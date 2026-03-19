import pandas as pd
from datetime import datetime, timedelta

def process_transactions(raw_transactions: list, ml_models: dict = None) -> dict:
    if not raw_transactions:
        return {
            "total_spent": 0.0,
            "current_balance": 0.0,
            "budget_health": 100.0,
            "subscriptions": [],
            "upcoming_bills": [],
            "weekly_breakdown": {"W1": 0.0, "W2": 0.0, "W3": 0.0, "W4": 0.0},
            "risk_weeks": [
                {"week": "W1", "amount": 0.0, "risk": "LOW"},
                {"week": "W2", "amount": 0.0, "risk": "LOW"},
                {"week": "W3", "amount": 0.0, "risk": "LOW"},
                {"week": "W4", "amount": 0.0, "risk": "LOW"}
            ],
            "anomalies": [],
            "monthly_trend": {},
            "card_wins": {
                "total_missed": 0,
                "efficiency_percent": 100,
                "missed_transactions": []
            }
        }
    
    # Extract ML models from dict if available
    merch_cls = ml_models.get("merchant_classifier") if ml_models else None
    forecaster = ml_models.get("spending_forecaster") if ml_models else None
    anomaly_scorer = ml_models.get("anomaly_scorer") if ml_models else None
    card_rec = ml_models.get("card_recommender") if ml_models else None

    df = pd.DataFrame(raw_transactions)
    
    # Ensure all required columns exist
    for col in ['txnId', 'type', 'mode', 'amount', 'currentBalance', 'transactionTimestamp', 'narration', 'reference']:
        if col not in df.columns:
            df[col] = None
            
    # Clean and parse columns
    df = df.dropna(subset=['amount', 'transactionTimestamp', 'type'])
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
    df['transactionTimestamp'] = pd.to_datetime(df['transactionTimestamp'], utc=True, errors='coerce')
    df = df.dropna(subset=['transactionTimestamp'])
    df['type'] = df['type'].astype(str).str.upper()
    df['narration'] = df['narration'].astype(str)
    
    # Extract current balance from latest transaction if possible
    latest_tx = df.sort_values('transactionTimestamp').iloc[-1] if not df.empty else None
    current_balance = float(latest_tx['currentBalance']) if latest_tx is not None and pd.notnull(latest_tx.get('currentBalance')) else 0.0

    debits = df[df['type'] == 'DEBIT']
    credits = df[df['type'] == 'CREDIT']
    
    total_debits = debits['amount'].sum()
    total_credits = credits['amount'].sum()
    
    # Budget Health Calculation
    budget_health = 0.0
    if total_credits > 0:
        budget_health = max(0.0, min(100.0, (1 - (total_debits / total_credits)) * 100))
    else:
        budget_health = 0.0 if total_debits > 0 else 100.0
        
    current_date = pd.Timestamp.utcnow()
    
    subscriptions = []
    upcoming_bills = []
    anomalies = []
    
    # Subscriptions & Anomalies Detection
    for narration, group in debits.groupby('narration'):
        if len(group) < 2 or narration.lower() in ['nan', 'none', '']:
            continue
            
        group = group.sort_values('transactionTimestamp')
        mean_amount = group['amount'].mean()
        
        # Anomaly Detection: Use ML Model 3 (Anomaly Scorer)
        for _, row in group.iterrows():
            is_anomaly = False
            score = 0.0
            
            if anomaly_scorer:
                # Get historical amounts for this merchant
                historical_amounts = group[group['transactionTimestamp'] <= row['transactionTimestamp']]['amount'].tolist()
                result = anomaly_scorer.score_anomaly(historical_amounts)
                is_anomaly = result["is_anomaly"]
                score = result["score"]
            else:
                # Rule-based fallback
                if row['amount'] > 2 * mean_amount and mean_amount > 0:
                    is_anomaly = True
                    score = 0.8

            if is_anomaly:
                anomalies.append({
                    "txnId": row.get('txnId', ''),
                    "narration": narration,
                    "amount": float(row['amount']),
                    "average": float(mean_amount),
                    "anomaly_score": score,
                    "date": row['transactionTimestamp'].isoformat()
                })
                
        # Subscriptions Detection (Rule-based as per requirements - "do not rebuild")
        # Group by same amount to find recurring fixed payments
        for amount, sub_group in group.groupby('amount'):
            if len(sub_group) >= 2:
                sub_group = sub_group.sort_values('transactionTimestamp')
                
                # Calculate days between consecutive transactions
                diffs = sub_group['transactionTimestamp'].diff().dt.days.dropna()
                avg_diff = diffs.mean()
                
                # Check for monthly billing cycle (28-35 days)
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
                    
                    subscriptions.append({
                        "name": narration,
                        "amount": float(amount),
                        "billing_cycle": "Monthly",
                        "last_used": last_used.isoformat(),
                        "next_due": next_due.isoformat(),
                        "status": status
                    })
                    
                    # Upcoming bills: due in the next 7 days
                    days_to_due = (next_due - current_date).days
                    if 0 <= days_to_due <= 7:
                        upcoming_bills.append({
                            "name": narration,
                            "amount": float(amount),
                            "date": next_due.isoformat()
                        })

    # Weekly Breakdown (for the current month)
    current_month_debits = debits[
        (debits['transactionTimestamp'].dt.month == current_date.month) & 
        (debits['transactionTimestamp'].dt.year == current_date.year)
    ]
    w1_amt = float(current_month_debits[current_month_debits['transactionTimestamp'].dt.day.between(1, 7)]['amount'].sum())
    w2_amt = float(current_month_debits[current_month_debits['transactionTimestamp'].dt.day.between(8, 14)]['amount'].sum())
    w3_amt = float(current_month_debits[current_month_debits['transactionTimestamp'].dt.day.between(15, 21)]['amount'].sum())
    w4_amt = float(current_month_debits[current_month_debits['transactionTimestamp'].dt.day.between(22, 31)]['amount'].sum())
    
    weekly_breakdown = {
        "W1": w1_amt,
        "W2": w2_amt,
        "W3": w3_amt,
        "W4": w4_amt
    }
    
    # Risk Weeks Calculation: Use ML Model 2 (Forecaster)
    risk_weeks = []
    if forecaster:
        # Prepare 3 months of historical weekly data for the forecaster
        # For simplicity in this demo, we'll use the current month's breakdown repeated 
        # or extrapolated since we don't have full 3 months here yet
        hist = [w1_amt*0.9, w2_amt*0.9, w3_amt*0.9, w4_amt*0.9, 
                w1_amt*0.95, w2_amt*0.95, w3_amt*0.95, w4_amt*0.95,
                w1_amt, w2_amt, w3_amt, w4_amt]
        forecast = forecaster.forecast_monthly_risk(hist)
        preds = forecast["week_predictions"]
        for week, amt in preds.items():
            risk_weeks.append({"week": week, "amount": amt, "risk": forecast["risk_level"]})
    else:
        # Rule-based fallback
        for week, amt in weekly_breakdown.items():
            risk = "HIGH" if amt > 4000 else ("MODERATE" if amt > 2000 else "LOW")
            risk_weeks.append({"week": week, "amount": amt, "risk": risk})
        
    # Monthly Trend (last 6 months)
    six_months_ago = current_date - pd.DateOffset(months=6)
    recent_debits = debits[debits['transactionTimestamp'] >= six_months_ago].copy()
    recent_debits['year_month'] = recent_debits['transactionTimestamp'].dt.strftime('%Y-%m')
    
    monthly_groups = recent_debits.groupby('year_month')['amount'].sum()
    monthly_trend = {str(k): float(v) for k, v in monthly_groups.items()}
    
    # Card Wins Logic: Use ML Model 1 (Classifier) and Model 4 (Recommender)
    missed_transactions = []
    total_missed = 0
    categories_missed = {}
    
    # User's current cards (mock list for demonstration)
    user_cards = ["SBI SimplyClick", "ICICI Amazon Pay", "Amex Gold"]

    # Pick a few large debits to simulate missed cashback
    for i, row in debits.nlargest(10, 'amount').iterrows():
        amt = float(row['amount'])
        merchant = row['narration']
        
        # 1. Classify category using Model 1
        category = merch_cls.classify_merchant(merchant) if merch_cls else "Other"
        
        # 2. Get recommendations using Model 4
        if card_rec:
            recs = card_rec.recommend_card(merchant, category, amt, user_cards + ["HDFC Swiggy Card", "HDFC Regalia", "Axis Magnus"])
            best_card = recs[0]
            current_card = next((r for r in recs if r['card'] == "SBI SimplyClick"), recs[-1]) # Assume SBI for this demo
            
            missed = max(0, best_card['estimated_cashback'] - current_card['estimated_cashback'])
            
            if missed > 10: # Only count if missed > ₹10
                missed_transactions.append({
                    "merchant": merchant,
                    "amount_spent": amt,
                    "amount_missed": missed,
                    "category": category,
                    "recommended_card": best_card['card'],
                    "benefit": f"Earn {best_card['score']}% cashback/rewards"
                })
                total_missed += missed
                categories_missed[category] = categories_missed.get(category, 0) + missed
        else:
            # Existing rule-based fallback logic (omitted for brevity in replacement, but kept in spirit)
            if amt > 300:
                missed = round(amt * 0.05, 2) # Simulate 5% cashback missed
                
                # Guess category
                cat = "Shopping"
                rec_card = "SBI SimplyClick"
                benefit = f"5% cashback on {cat}"
                
                m_lower = merchant.lower()
                if any(x in m_lower for x in ["zomato", "swiggy", "restaurant", "cafe", "food"]):
                    cat = "Food & Dining"
                    rec_card = "HDFC Diners Club"
                    benefit = "10X Rewards on Dining"
                elif any(x in m_lower for x in ["amazon", "flipkart", "myntra"]):
                    cat = "Shopping"
                    rec_card = "ICICI Amazon Pay"
                    benefit = "5% flat cashback"
                elif any(x in m_lower for x in ["uber", "ola", "makemytrip", "indigo"]):
                    cat = "Travel"
                    rec_card = "Axis Atlas"
                    benefit = "AirMiles on Travel"
                elif any(x in m_lower for x in ["blinkit", "instamart", "zepto", "grocery", "supermarket"]):
                    cat = "Groceries"
                    rec_card = "Amex MRCC"
                    benefit = "Bonus MR points"
                    
                categories_missed[cat] = categories_missed.get(cat, 0) + missed
                    
                missed_transactions.append({
                    "merchant": merchant,
                    "amount_spent": amt,
                    "amount_missed": missed,
                    "category": cat,
                    "ideal_card": rec_card,
                    "recommended_card": rec_card,
                    "benefit": benefit
                })
                total_missed += missed

    efficiency_percent = 100
    if total_debits > 0:
        ideal_cashback = float(total_debits) * 0.05
        earned_cashback = max(0, ideal_cashback - total_missed)
        efficiency_percent = int((earned_cashback / ideal_cashback) * 100) if ideal_cashback > 0 else 100
            
    return {
        "total_spent": float(total_debits),
        "current_balance": current_balance,
        "budget_health": round(float(budget_health), 2),
        "subscriptions": subscriptions,
        "upcoming_bills": upcoming_bills,
        "weekly_breakdown": weekly_breakdown,
        "risk_weeks": risk_weeks,
        "anomalies": anomalies,
        "monthly_trend": monthly_trend,
        "card_wins": {
            "total_missed": total_missed,
            "efficiency_percent": efficiency_percent,
            "missed_transactions": missed_transactions,
            "categories_missed": categories_missed
        }
    }
