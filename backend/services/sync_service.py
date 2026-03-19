import pandas as pd
from datetime import datetime
from sqlalchemy.future import select

from db.database import AsyncSessionLocal
from models.transaction import Transaction, Subscription, Anomaly, CardRecommendation, SyncStatus
from models.consent import Consent
from routers.setu import fetch_data
from ml import MerchantClassifier, AnomalyScorer, CardRecommender
from services.dataset_loader import load_all_quarters, load_current_quarter

async def run_full_sync(user_id: str):
    """
    Background sync function that runs in this exact order:
    1. Set SyncStatus to running
    2. Fetch raw transactions from Setu API
    3. Save all raw transactions to Transaction table
    4. Run ML classifier on each transaction & update category field
    5. Run subscription detector and save results to Subscription table
    6. Run anomaly scorer and save results to Anomaly table
    7. Run card recommender and save results to CardRecommendation table
    8. Set SyncStatus to completed
    If any step fails, set SyncStatus to failed and log the error
    """
    async with AsyncSessionLocal() as db:
        # 1. Set SyncStatus to running
        sync_status = SyncStatus(user_id=user_id, status="running")
        db.add(sync_status)
        await db.commit()
        await db.refresh(sync_status)

        try:
            # Load ML Models
            merch_cls = MerchantClassifier()
            anomaly_scorer_model = AnomalyScorer()
            card_rec = CardRecommender()
            
            # Find the user's consent/session. In this app, user_id acts as consent_id
            query = select(Consent).where(Consent.id == user_id).order_by(Consent.created_at.desc())
            result = await db.execute(query)
            consent = result.scalars().first()
            
            if not consent or not consent.session_id:
                raise Exception("No active Setu session found.")
                
            # 2. Fetch raw transactions from Setu API
            raw_txns = await fetch_data(consent.session_id)
            if not raw_txns:
                raise Exception("No transactions returned from Setu.")
                
            df = pd.DataFrame(raw_txns)
            for col in ['txnId', 'type', 'mode', 'amount', 'transactionTimestamp', 'narration']:
                if col not in df.columns:
                    df[col] = None
                    
            df = df.dropna(subset=['amount', 'transactionTimestamp', 'type'])
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
            df['transactionTimestamp'] = pd.to_datetime(df['transactionTimestamp'], utc=True, errors='coerce')
            df = df.dropna(subset=['transactionTimestamp'])
            df['type'] = df['type'].astype(str).str.upper()
            df['narration'] = df['narration'].astype(str)
            
            debits = df[df['type'] == 'DEBIT']
            transactions_processed = 0
            
            # Process and Save Data
            # Clear existing data for this user to avoid duplicates on re-sync
            for model in [Transaction, Subscription, Anomaly, CardRecommendation]:
                await db.execute(model.__table__.delete().where(model.user_id == user_id))
                
            current_date = pd.Timestamp.utcnow()

            # 3 & 4. Save Transactions & Run ML Classifier
            for _, row in df.iterrows():
                amt = float(row['amount'])
                merchant = row['narration']
                cat = merch_cls.classify_merchant(merchant)
                date_str = row['transactionTimestamp'].isoformat()
                
                tx = Transaction(
                    id=str(row.get('txnId', '')),
                    user_id=user_id,
                    merchant_name=merchant,
                    amount=amt if row['type'] == 'DEBIT' else -amt,
                    category=cat,
                    date=date_str,
                    is_anomaly=False,
                    anomaly_score=0.0
                )
                db.add(tx)
                transactions_processed += 1
            
            # Flush to get transactions in DB
            await db.commit()

            # 5 & 6. Subscriptions & Anomalies
            for narration, group in debits.groupby('narration'):
                if len(group) < 2 or narration.lower() in ['nan', 'none', '']:
                    continue
                    
                group = group.sort_values('transactionTimestamp')
                
                # Anomalies (Model 3)
                historical_amounts = []
                for _, row in group.iterrows():
                    amt = float(row['amount'])
                    historical_amounts.append(amt)
                    
                    if len(historical_amounts) > 1:
                        result = anomaly_scorer_model.score_anomaly(historical_amounts)
                        if result["is_anomaly"]:
                            anom = Anomaly(
                                id=f"ANOM-{row.get('txnId')}",
                                user_id=user_id,
                                merchant_name=narration,
                                amount=amt,
                                average_amount=sum(historical_amounts[:-1]) / len(historical_amounts[:-1]),
                                anomaly_score=result["score"],
                                flagged_at=datetime.utcnow()
                            )
                            db.add(anom)
                            
                            # Update Transaction table
                            tx_q = select(Transaction).where((Transaction.id == str(row.get('txnId'))) & (Transaction.user_id == user_id))
                            tx_res = await db.execute(tx_q)
                            tx_record = tx_res.scalar_one_or_none()
                            if tx_record:
                                tx_record.is_anomaly = True
                                tx_record.anomaly_score = result["score"]
                                
                # Subscriptions
                for amount, sub_group in group.groupby('amount'):
                    if len(sub_group) >= 2:
                        sub_group = sub_group.sort_values('transactionTimestamp')
                        diffs = sub_group['transactionTimestamp'].diff().dt.days.dropna()
                        avg_diff = diffs.mean()
                        
                        if 28 <= avg_diff <= 35:
                            last_tx = sub_group.iloc[-1]
                            last_used = last_tx['transactionTimestamp']
                            days_since_last = (current_date - last_used).days
                            
                            status = "active"
                            if days_since_last > 40:
                                status = "unused"
                            elif days_since_last > 20:
                                status = "forgotten"
                                
                            next_due = last_used + pd.Timedelta(days=int(avg_diff))
                            
                            sub = Subscription(
                                id=f"SUB-{narration}-{int(amount)}",
                                user_id=user_id,
                                merchant_name=narration,
                                amount=float(amount),
                                frequency="Monthly",
                                status=status,
                                last_used_date=last_used.isoformat(),
                                next_billing_date=next_due.isoformat()
                            )
                            db.add(sub)
            
            # 7. Card Recommendations
            user_cards = ["SBI SimplyClick", "ICICI Amazon Pay", "Amex Gold"]
            for i, row in debits.nlargest(15, 'amount').iterrows():
                amt = float(row['amount'])
                merchant = row['narration']
                cat = merch_cls.classify_merchant(merchant)
                
                recs = card_rec.recommend_card(merchant, cat, amt, user_cards + ["HDFC Swiggy Card", "HDFC Regalia", "Axis Magnus"])
                best_card = recs[0]
                current_card = next((r for r in recs if r['card'] == "SBI SimplyClick"), recs[-1])
                
                missed = max(0, best_card['estimated_cashback'] - current_card['estimated_cashback'])
                if missed > 10:
                    crec = CardRecommendation(
                        id=f"REC-{row.get('txnId')}",
                        user_id=user_id,
                        merchant_name=merchant,
                        transaction_amount=amt,
                        recommended_card=best_card['card'],
                        cashback_missed=missed,
                        category=cat
                    )
                    db.add(crec)
            
            # 8. Set SyncStatus to completed
            sync_status.status = "completed"
            sync_status.completed_at = datetime.utcnow()
            sync_status.transactions_processed = transactions_processed
            await db.commit()
            
        except Exception as e:
            await db.rollback()
            sync_status.status = "failed"
            sync_status.completed_at = datetime.utcnow()
            await db.commit()
            print(f"Sync failed for user {user_id}: {e}")


async def run_demo_sync(profile_folder: str, user_id: str):
    """
    Run the full ML pipeline against a local JSON dataset.
    Mirrors run_full_sync but uses dataset_loader instead of Setu API.
    - All 12 months of data are used for historical analysis
      (anomaly scoring, subscription detection).
    - Card recommendations use current-quarter transactions where the
      card_used field tells us which card was actually used.
    """
    async with AsyncSessionLocal() as db:
        # 1. Create SyncStatus = running
        sync_status = SyncStatus(user_id=user_id, status="running")
        db.add(sync_status)
        await db.commit()
        await db.refresh(sync_status)

        try:
            # Load ML models
            merch_cls = MerchantClassifier()
            anomaly_scorer_model = AnomalyScorer()
            card_rec = CardRecommender()

            # 2. Load all 12 months for historical ML
            full_data = load_all_quarters(profile_folder)
            all_txns = full_data["all_transactions"]

            # 3. Load current quarter only for card wins
            current_txns = load_current_quarter(profile_folder)

            # 4. Clear existing data for this user
            for model in [Transaction, Subscription, Anomaly, CardRecommendation]:
                await db.execute(
                    model.__table__.delete().where(model.user_id == user_id)
                )

            # 5. Save all transactions & run classifier
            transactions_processed = 0
            df = pd.DataFrame(all_txns)

            for _, row in df.iterrows():
                tx_type = str(row.get("type", "DEBIT")).upper()
                amt = float(row["amount"])
                merchant = str(row["narration"])
                cat = merch_cls.classify_merchant(merchant)
                date_str = str(row["transactionTimestamp"])

                # Store credits as negative amounts (income)
                signed_amt = amt if tx_type == "DEBIT" else -amt

                tx = Transaction(
                    id=str(row["txnId"]),
                    user_id=user_id,
                    merchant_name=merchant,
                    amount=signed_amt,
                    category=cat,
                    date=date_str,
                    is_anomaly=False,
                    anomaly_score=0.0,
                )
                db.add(tx)
                transactions_processed += 1

            await db.commit()

            # 6. Subscription detection & Anomaly scoring (all 12 months)
            debits_df = df[df["type"].str.upper() == "DEBIT"].copy()
            debits_df["amount"] = debits_df["amount"].astype(float)
            debits_df["transactionTimestamp"] = pd.to_datetime(
                debits_df["transactionTimestamp"], utc=True, errors="coerce"
            )
            debits_df = debits_df.dropna(subset=["transactionTimestamp"])
            current_date = pd.Timestamp.utcnow()

            for narration, group in debits_df.groupby("narration"):
                if len(group) < 2 or str(narration).lower() in ["nan", "none", ""]:
                    continue

                group = group.sort_values("transactionTimestamp")

                # Anomaly scoring (Model 3)
                historical_amounts: list = []
                for _, row in group.iterrows():
                    amt = float(row["amount"])
                    historical_amounts.append(amt)
                    if len(historical_amounts) > 1:
                        result = anomaly_scorer_model.score_anomaly(historical_amounts)
                        if result["is_anomaly"]:
                            anom_id = f"ANOM-{row['txnId']}"
                            anom = Anomaly(
                                id=anom_id,
                                user_id=user_id,
                                merchant_name=narration,
                                amount=amt,
                                average_amount=sum(historical_amounts[:-1]) / len(historical_amounts[:-1]),
                                anomaly_score=result["score"],
                                flagged_at=datetime.utcnow(),
                            )
                            db.add(anom)

                            # Update is_anomaly flag on Transaction
                            tx_q = select(Transaction).where(
                                (Transaction.id == str(row["txnId"]))
                                & (Transaction.user_id == user_id)
                            )
                            tx_res = await db.execute(tx_q)
                            tx_record = tx_res.scalar_one_or_none()
                            if tx_record:
                                tx_record.is_anomaly = True
                                tx_record.anomaly_score = result["score"]

                # Subscription detection — same amount, monthly recurrence (Model 3 overlap)
                for amount, sub_group in group.groupby("amount"):
                    if len(sub_group) >= 2:
                        sub_group = sub_group.sort_values("transactionTimestamp")
                        diffs = sub_group["transactionTimestamp"].diff().dt.days.dropna()
                        avg_diff = diffs.mean()

                        if 28 <= avg_diff <= 35:
                            last_tx = sub_group.iloc[-1]
                            last_used = last_tx["transactionTimestamp"]
                            days_since_last = (current_date - last_used).days

                            status = "active"
                            if days_since_last > 40:
                                status = "unused"
                            elif days_since_last > 20:
                                status = "forgotten"

                            next_due = last_used + pd.Timedelta(days=int(avg_diff))

                            sub = Subscription(
                                id=f"SUB-{narration}-{int(amount)}",
                                user_id=user_id,
                                merchant_name=narration,
                                amount=float(amount),
                                frequency="Monthly",
                                status=status,
                                last_used_date=last_used.isoformat(),
                                next_billing_date=next_due.isoformat(),
                            )
                            db.add(sub)

            # 7. Card Recommendations (current quarter — uses actual card_used field)
            current_df = pd.DataFrame(current_txns)
            current_df["amount"] = current_df["amount"].astype(float)
            current_debits = current_df[current_df["type"].str.upper() == "DEBIT"].copy()

            # Cards Priya actually owns
            priya_cards = [
                "HDFC Regalia", "SBI SimplyClick", "ICICI Amazon Pay",
                "Axis Magnus", "SBI Cashback"
            ]

            for _, row in current_debits.nlargest(20, "amount").iterrows():
                amt = float(row["amount"])
                merchant = str(row["narration"])
                cat = merch_cls.classify_merchant(merchant)
                card_used = row.get("card_used") or "SBI SimplyClick"

                recs = card_rec.recommend_card(merchant, cat, amt, priya_cards)
                if not recs:
                    continue

                best_card = recs[0]
                current_card_recs = [r for r in recs if r["card"] == card_used]
                current_card = current_card_recs[0] if current_card_recs else recs[-1]

                missed = max(0.0, best_card["estimated_cashback"] - current_card["estimated_cashback"])
                if missed > 5:
                    crec = CardRecommendation(
                        id=f"REC-{row['txnId']}",
                        user_id=user_id,
                        merchant_name=merchant,
                        transaction_amount=amt,
                        recommended_card=best_card["card"],
                        cashback_missed=missed,
                        category=cat,
                    )
                    db.add(crec)

            # 8. Mark sync as completed
            sync_status.status = "completed"
            sync_status.completed_at = datetime.utcnow()
            sync_status.transactions_processed = transactions_processed
            await db.commit()
            print(f"✅ Demo sync completed for {user_id}: {transactions_processed} transactions processed")

        except Exception as e:
            await db.rollback()
            sync_status.status = "failed"
            sync_status.completed_at = datetime.utcnow()
            await db.commit()
            print(f"❌ Demo sync failed for {user_id}: {e}")
            import traceback
            traceback.print_exc()

