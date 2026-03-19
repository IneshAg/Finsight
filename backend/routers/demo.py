from fastapi import APIRouter, BackgroundTasks
from sqlalchemy.future import select
import asyncio

from db.database import AsyncSessionLocal
from models.consent import Consent
from services.dataset_loader import list_available_profiles, load_profile
from services.sync_service import run_demo_sync

router = APIRouter()


@router.get("/profiles")
async def get_demo_profiles():
    """List all available demo profiles."""
    profiles = list_available_profiles()
    return {"profiles": profiles}


@router.post("/load/{profile_folder}")
async def load_demo_profile(profile_folder: str, background_tasks: BackgroundTasks):
    """
    Trigger the ML sync pipeline against a local JSON dataset.
    Creates a demo Consent row, then runs run_demo_sync in background.
    Returns immediately so the frontend can poll /insights/sync/status.
    """
    profile = load_profile(profile_folder)
    user_id = profile.get("user_id", f"demo_{profile_folder}")

    async with AsyncSessionLocal() as db:
        # Upsert a Consent row using the demo user_id
        existing = await db.execute(
            select(Consent).where(Consent.id == user_id)
        )
        consent = existing.scalars().first()
        if consent:
            consent.status = "ACTIVE"
            consent.session_id = f"demo-session-{profile_folder}"
        else:
            consent = Consent(
                id=user_id,
                status="ACTIVE",
                session_id=f"demo-session-{profile_folder}",
            )
            db.add(consent)
        await db.commit()

    # Fire the ML sync as a background task
    background_tasks.add_task(_run_demo_sync_task, profile_folder, user_id)

    return {
        "status": "syncing",
        "user_id": user_id,
        "profile_name": profile.get("profile_name"),
        "message": "Demo data is being processed. Poll /api/insights/sync/status to check progress.",
    }


async def _run_demo_sync_task(profile_folder: str, user_id: str):
    """Wrapper so run_demo_sync can be called from BackgroundTasks."""
    await run_demo_sync(profile_folder, user_id)
