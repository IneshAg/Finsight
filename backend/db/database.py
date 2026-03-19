import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

# Database URL using SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./finsight.db")

# Setup async connecting engine
engine = create_async_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create an async session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Declarative base for SQLAlchemy models
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
