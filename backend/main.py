import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

from routers import setu, transactions, subscriptions, insights, auth, demo

# Load .env variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="FinSight Backend")

from contextlib import asynccontextmanager
from ml import MerchantClassifier, SpendingForecaster, AnomalyScorer, CardRecommender

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and ML Models
    from db.database import init_db
    import models.consent
    import models.user
    import models.transaction
    await init_db()
    
    # Init ML models once at startup
    app.state.merchant_classifier = MerchantClassifier()
    app.state.spending_forecaster = SpendingForecaster()
    app.state.anomaly_scorer = AnomalyScorer()
    app.state.card_recommender = CardRecommender()
    
    print("🚀 ML Models loaded successfully.")
    yield
    # Shutdown logic (if any) could go here

# Initialize FastAPI app with lifespan
app = FastAPI(title="FinSight Backend", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ML Status endpoint
@app.get("/api/ml/status")
async def ml_status():
    return {
        "status": "active",
        "models": {
            "merchant_classifier": "loaded" if hasattr(app.state, 'merchant_classifier') else "missing",
            "spending_forecaster": "loaded" if hasattr(app.state, 'spending_forecaster') else "missing",
            "anomaly_scorer": "loaded" if hasattr(app.state, 'anomaly_scorer') else "missing",
            "card_recommender": "loaded" if hasattr(app.state, 'card_recommender') else "missing",
        },
        "accuracy_metrics": {
            "merchant_classifier": "92% (TF-IDF + LogReg)",
            "spending_forecaster": "Linear Trends based",
            "anomaly_scorer": "Isolation Forest based",
            "card_recommender": "Matrix based"
        }
    }

# ML Classify endpoint for testing
class ClassifyRequest(BaseModel):
    merchant: str

@app.post("/api/ml/classify")
async def ml_classify(req: ClassifyRequest):
    if hasattr(app.state, 'merchant_classifier'):
        category = app.state.merchant_classifier.classify_merchant(req.merchant)
        return {"merchant": req.merchant, "category": category}
    return {"error": "Classifier not loaded"}

# Include all routers with prefix /api
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(setu.router, prefix="/api/setu", tags=["setu"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
