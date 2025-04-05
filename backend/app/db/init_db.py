"""
Database initialization script.
"""

import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine, async_session
from app.db.base import Base

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """
    Initialize the database.
    """
    async with engine.begin() as conn:
        # Enable pgvector extension
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database initialized")


async def get_session() -> AsyncSession:
    """
    Get a database session.
    """
    async with async_session() as session:
        yield session


if __name__ == "__main__":
    asyncio.run(init_db())
