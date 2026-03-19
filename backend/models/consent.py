from sqlalchemy import Column, String, DateTime
from datetime import datetime
from db.database import Base

class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(String, primary_key=True, index=True)
    status = Column(String, default="PENDING")
    session_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
