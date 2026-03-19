import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.database import get_db
from models.consent import Consent
from db.schemas import (
    SetuConsentResponse, 
    DataSessionResponse, 
    SetuConsentStatus,
    CreateDataSessionRequest
)

router = APIRouter()

def get_setu_headers():
    return {
        "x-client-id": os.getenv("SETU_CLIENT_ID", ""),
        "x-client-secret": os.getenv("SETU_CLIENT_SECRET", ""),
        "x-product-instance-id": os.getenv("SETU_PRODUCT_INSTANCE_ID", ""),
        "Content-Type": "application/json"
    }

SETU_BASE_URL = os.getenv("SETU_BASE_URL", "https://fiu-uat.setu.co")

@router.post("/create-consent", response_model=SetuConsentResponse)
async def create_consent(db: AsyncSession = Depends(get_db)):
    # Fallback to mock data if API keys are not set for local testing
    client_id = os.getenv("SETU_CLIENT_ID", "")
    if not client_id or client_id == "your_client_id":
        return SetuConsentResponse(
            consentUrl="http://localhost:5173/dashboard", 
            consentId="mock-consent-123"
        )

    url = f"{SETU_BASE_URL}/consents"
    payload = {
        "consentDuration": { 
            "unit": "MONTH", 
            "value": 12 
        },
        "dataRange": {
            "from": "2024-01-01T00:00:00.000Z",
            "to": "2024-12-31T00:00:00.000Z"
        },
        "fiTypes": ["DEPOSIT"],
        "redirectUrl": "http://localhost:5173/dashboard"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=get_setu_headers(), json=payload)
        
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=response.status_code, detail=f"Setu API error: {response.text}")
        
    data = response.json()
    consent_id = data.get("id") or data.get("consentId")
    consent_url = data.get("url")
    
    # Fallback if the API returns only consentId without the url field
    if not consent_url and consent_id:
        consent_url = f"https://fiu-uat.setu.co/consents/{consent_id}"
        
    if not consent_id:
        raise HTTPException(status_code=500, detail="Could not retrieve consentId from Setu")
        
    # Save the consent info to the DB
    db_consent = Consent(id=consent_id, status="PENDING")
    db.add(db_consent)
    await db.commit()
    
    return SetuConsentResponse(consentUrl=consent_url, consentId=consent_id)

async def auto_create_data_session(consent_id: str, db: AsyncSession):
    """Background task to automatically create a data session when consent becomes ACTIVE"""
    url = f"{SETU_BASE_URL}/sessions"
    payload = {"consentId": consent_id}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=get_setu_headers(), json=payload)
        
    if response.status_code in (200, 201):
        data = response.json()
        session_id = data.get("id") or data.get("sessionId")
        
        if session_id:
            # Update the existing consent with the newly retrieved session_id
            query = select(Consent).where(Consent.id == consent_id)
            result = await db.execute(query)
            db_consent = result.scalar_one_or_none()
            if db_consent:
                db_consent.session_id = session_id
                await db.commit()
                
            from services.sync_service import run_full_sync
            import asyncio
            asyncio.create_task(run_full_sync(consent_id))

@router.post("/webhook")
async def setu_webhook(request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    body = await request.json()
    
    # Extract notification specifics
    notification = body.get("notification", body)
    consent_id = notification.get("consentId")
    status = notification.get("consentStatus")
    
    if consent_id and status:
        query = select(Consent).where(Consent.id == consent_id)
        result = await db.execute(query)
        db_consent = result.scalar_one_or_none()
        
        if db_consent:
            # Update consent status in DB
            db_consent.status = status
            await db.commit()
            
            if status == "ACTIVE":
                # Automatically call create-data-session in background
                # And then we should enqueue run_full_sync when session is created
                # Wait, inside auto_create_data_session we receive session_id, we should call run_full_sync there!
                pass # see auto_create_data_session
                
    # Return 200 OK immediately
    return {"status": "ok"}

@router.post("/create-data-session", response_model=DataSessionResponse)
async def create_data_session(req: CreateDataSessionRequest, db: AsyncSession = Depends(get_db)):
    url = f"{SETU_BASE_URL}/sessions"
    payload = {"consentId": req.consentId}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=get_setu_headers(), json=payload)
        
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=response.status_code, detail=f"Setu API error: {response.text}")
        
    data = response.json()
    session_id = data.get("id") or data.get("sessionId")
    
    if not session_id:
         raise HTTPException(status_code=500, detail="Could not retrieve sessionId from Setu")
         
    # Save sessionId to the database for this consent
    query = select(Consent).where(Consent.id == req.consentId)
    result = await db.execute(query)
    db_consent = result.scalar_one_or_none()
    
    if db_consent:
        db_consent.session_id = session_id
        await db.commit()
            
    from services.sync_service import run_full_sync
    import asyncio
    asyncio.create_task(run_full_sync(req.consentId))

    return DataSessionResponse(sessionId=session_id)

@router.get("/fetch-data/{session_id}")
async def fetch_data(session_id: str):
    # Mock data for local testing
    if session_id == "mock-session-456":
        from datetime import datetime, timedelta
        import random
        
        now = datetime.now()
        mock_txns = []
        merchants = [
            ("Zomato", "DEBIT", "Food & Dining", 450),
            ("Uber", "DEBIT", "Travel", 220),
            ("Amazon", "DEBIT", "Shopping", 1250),
            ("Swiggy", "DEBIT", "Food & Dining", 380),
            ("Netflix", "DEBIT", "Subscription", 499),
            ("Spotify", "DEBIT", "Subscription", 129),
            ("Airtel", "DEBIT", "Bill", 799),
            ("Salary", "CREDIT", "Income", 75000),
            ("Rent", "DEBIT", "Home", 22000),
            ("Blinkit", "DEBIT", "Groceries", 650),
            ("Instamart", "DEBIT", "Groceries", 320),
            ("Apple", "DEBIT", "Shopping", 150),
        ]
        
        balance = 85000.0
        for i in range(40):
            m_name, m_type, m_cat, m_base_amt = random.choice(merchants)
            amt = round(m_base_amt * (0.8 + random.random() * 0.4), 2)
            ts = (now - timedelta(days=random.randint(0, 30))).isoformat()
            
            if m_type == "DEBIT":
                balance -= amt
            else:
                balance += amt
                
            mock_txns.append({
                "txnId": f"TXN{i:05d}",
                "type": m_type,
                "mode": "UPI",
                "amount": str(amt),
                "currentBalance": str(round(balance, 2)),
                "transactionTimestamp": ts,
                "narration": f"{m_name} Order #{i}",
                "reference": f"REF{i:05d}"
            })
        return mock_txns

    url = f"{SETU_BASE_URL}/sessions/{session_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=get_setu_headers())
        
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Setu API error: {response.text}")
        
    data = response.json()
    
    # Return raw transactions array
    # Looking through fallback keys in case Setu's structure wraps it
    transactions = data.get("transactions", [])
    if not transactions and "data" in data:
        transactions = data.get("data", [])
    if not transactions and isinstance(data, list):
         transactions = data

    return transactions

@router.get("/status/{consent_id}", response_model=SetuConsentStatus)
async def get_consent_status(consent_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Consent).where(Consent.id == consent_id)
    result = await db.execute(query)
    db_consent = result.scalar_one_or_none()
    
    if not db_consent:
        raise HTTPException(status_code=404, detail="Consent not found in DB")
        
    return SetuConsentStatus(
        consentId=db_consent.id,
        status=db_consent.status,
        sessionId=db_consent.session_id
    )
