from sqlalchemy import Column, String, Float, Boolean, DateTime
from datetime import datetime
from db.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    merchant_name = Column(String)
    amount = Column(Float)
    category = Column(String)
    date = Column(String)  # ISO string or use DateTime based on your preference
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    merchant_name = Column(String)
    amount = Column(Float)
    frequency = Column(String)
    status = Column(String) # active/forgotten/unused
    last_used_date = Column(String, nullable=True)
    next_billing_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CardRecommendation(Base):
    __tablename__ = "card_recommendations"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    merchant_name = Column(String)
    transaction_amount = Column(Float)
    recommended_card = Column(String)
    cashback_missed = Column(Float)
    category = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    merchant_name = Column(String)
    amount = Column(Float)
    average_amount = Column(Float)
    anomaly_score = Column(Float)
    flagged_at = Column(DateTime, default=datetime.utcnow)

class SyncStatus(Base):
    __tablename__ = "sync_statuses"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    status = Column(String) # pending/running/completed/failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    transactions_processed = Column(Float, default=0) # using Float or Integer, let's use Integer
