import asyncio
import sys
import os

# Add the current directory to sys.path so we can import internal modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.database import init_db, AsyncSessionLocal
from models.consent import Consent
from sqlalchemy.future import select

async def seed():
    print("Initializing database...")
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # Check if mock data already exists
        query = select(Consent).where(Consent.id == 'mock-consent-123')
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            print("Seeding mock consent and session...")
            mock_consent = Consent(
                id='mock-consent-123', 
                status='ACTIVE', 
                session_id='mock-session-456'
            )
            session.add(mock_consent)
            await session.commit()
            print("Successfully seeded database with mock data.")
        else:
            print("Mock data already exists. Skipping seed.")

if __name__ == "__main__":
    asyncio.run(seed())
