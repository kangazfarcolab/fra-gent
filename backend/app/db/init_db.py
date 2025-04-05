"""
Database initialization script.
"""

import asyncio
import logging

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine, async_session
from app.db.base import Base

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """
    Initialize the database.
    """
    # Try to enable pgvector extension
    try:
        async with engine.begin() as conn:
            await conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
            logger.info("pgvector extension enabled")
    except Exception as e:
        logger.warning(f"Could not enable pgvector extension: {e}")

    # Create tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

    logger.info("Database initialized")


async def get_session() -> AsyncSession:
    """
    Get a database session.
    """
    async with async_session() as session:
        yield session


if __name__ == "__main__":
    asyncio.run(init_db())
