"""
Memory cleanup utilities.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.memory import Memory

logger = logging.getLogger(__name__)


async def cleanup_temporary_memories(
    db: AsyncSession,
    agent_id: Optional[str] = None,
    older_than_days: int = 7,
) -> int:
    """
    Clean up temporary memories.
    
    Args:
        db: Database session
        agent_id: Agent ID (if None, clean up for all agents)
        older_than_days: Clean up memories older than this many days
        
    Returns:
        Number of memories deleted
    """
    # Calculate cutoff date
    cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
    
    # Build query
    query = delete(Memory).where(
        Memory.memory_type == "temporary",
        Memory.created_at < cutoff_date,
    )
    
    # Filter by agent ID if specified
    if agent_id:
        query = query.where(Memory.agent_id == agent_id)
    
    # Execute query
    result = await db.execute(query)
    await db.commit()
    
    # Get number of rows deleted
    deleted_count = result.rowcount
    
    logger.info(f"Deleted {deleted_count} temporary memories")
    
    return deleted_count


async def cleanup_execution_memories(
    db: AsyncSession,
    agent_id: Optional[str] = None,
    older_than_hours: int = 24,
) -> int:
    """
    Clean up execution memories.
    
    Args:
        db: Database session
        agent_id: Agent ID (if None, clean up for all agents)
        older_than_hours: Clean up memories older than this many hours
        
    Returns:
        Number of memories deleted
    """
    # Calculate cutoff date
    cutoff_date = datetime.utcnow() - timedelta(hours=older_than_hours)
    
    # Build query
    query = delete(Memory).where(
        Memory.memory_type == "execution",
        Memory.created_at < cutoff_date,
    )
    
    # Filter by agent ID if specified
    if agent_id:
        query = query.where(Memory.agent_id == agent_id)
    
    # Execute query
    result = await db.execute(query)
    await db.commit()
    
    # Get number of rows deleted
    deleted_count = result.rowcount
    
    logger.info(f"Deleted {deleted_count} execution memories")
    
    return deleted_count


async def get_memory_stats(
    db: AsyncSession,
    agent_id: Optional[str] = None,
) -> dict:
    """
    Get memory statistics.
    
    Args:
        db: Database session
        agent_id: Agent ID (if None, get stats for all agents)
        
    Returns:
        Dictionary with memory statistics
    """
    # Build query for permanent memories
    permanent_query = select(Memory).where(Memory.memory_type == "permanent")
    if agent_id:
        permanent_query = permanent_query.where(Memory.agent_id == agent_id)
    
    # Build query for temporary memories
    temporary_query = select(Memory).where(Memory.memory_type == "temporary")
    if agent_id:
        temporary_query = temporary_query.where(Memory.agent_id == agent_id)
    
    # Build query for execution memories
    execution_query = select(Memory).where(Memory.memory_type == "execution")
    if agent_id:
        execution_query = execution_query.where(Memory.agent_id == agent_id)
    
    # Execute queries
    permanent_result = await db.execute(permanent_query)
    temporary_result = await db.execute(temporary_query)
    execution_result = await db.execute(execution_query)
    
    # Count results
    permanent_count = len(permanent_result.scalars().all())
    temporary_count = len(temporary_result.scalars().all())
    execution_count = len(execution_result.scalars().all())
    
    # Calculate total
    total_count = permanent_count + temporary_count + execution_count
    
    return {
        "total": total_count,
        "permanent": permanent_count,
        "temporary": temporary_count,
        "execution": execution_count,
        "agent_id": agent_id,
    }
