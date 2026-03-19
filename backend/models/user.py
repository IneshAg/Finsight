from sqlalchemy import Column, String
from db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    hashed_password = Column(String)
    consent_id = Column(String, nullable=True) # Used to track if user has connected bank
