from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

router = APIRouter()

class CancelRequest(BaseModel):
    subscription_names: List[str]

@router.post("/cancel")
async def cancel_subscriptions(req: CancelRequest):
    # In a real app, this would use a background task to contact the bank
    # or external provider APIs to officially terminate the mandate.
    # For now, we simulate a successful API response.
    
    return {
        "status": "success", 
        "message": f"Successfully cancelled {len(req.subscription_names)} subscriptions",
        "cancelled": req.subscription_names
    }
