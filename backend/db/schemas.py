from pydantic import BaseModel
from typing import Optional, List, Any

# --- Setu Pydantic Schemas ---

class CreateDataSessionRequest(BaseModel):
    consentId: str

class SetuConsentResponse(BaseModel):
    consentUrl: str
    consentId: str

class DataSessionResponse(BaseModel):
    sessionId: str

class SetuConsentStatus(BaseModel):
    consentId: str
    status: str
    sessionId: Optional[str] = None
