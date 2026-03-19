from fastapi import APIRouter
from services.ml_service import ml_service

router = APIRouter()

@router.get('/dashboard')
def get_dashboard():
    return ml_service.analyze_profile('priya_sharma')

@router.get('/risk')
def get_risk():
    return ml_service.analyze_profile('priya_sharma')['risk']

@router.get('/monthly-trend')
def get_monthly_trend():
    data = ml_service.analyze_profile('priya_sharma')
    return {
        'monthly_spend': data['monthly_spend_trend'],
        'seasonal': data['seasonal_patterns'],
        'quarterly': data['quarterly_summaries']
    }

@router.get('/anomalies')
def get_anomalies():
    return ml_service.analyze_profile('priya_sharma')['anomalies']

@router.get('/subscriptions')
def get_subscriptions():
    data = ml_service.analyze_profile('priya_sharma')
    return {
        'subscriptions': data['subscriptions'],
        'total_monthly': sum(s['avg'] for s in data['subscriptions'])
    }

@router.get('/quarters')
def get_quarters():
    data = ml_service.analyze_profile('priya_sharma')
    return data['quarterly_summaries']

@router.get('/quarter/{quarter_file}')
def get_specific_quarter(quarter_file: str):
    return ml_service.get_quarter('priya_sharma', quarter_file)

# Maintain dummy endpoints to prevent 404s if frontend still calls them
@router.get('/card-wins/summary')
def get_card_wins_summary():
    return {
        "total_missed": 0,
        "transaction_count": 0,
        "top_missed_items": [],
        "categories_missed": {},
        "last_updated": None
    }

@router.get('/sync/status')
def get_sync_status():
    return {"status": "completed", "last_sync": None, "transactions_processed": 0}
