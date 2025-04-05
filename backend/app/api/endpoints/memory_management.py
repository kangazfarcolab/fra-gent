"""
API endpoints for memory management.
"""

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db
from app.utils.memory_cleanup import (
    cleanup_execution_memories,
    cleanup_temporary_memories,
    get_memory_stats,
)

router = APIRouter()


@router.get("/stats")
async def get_memory_statistics(
    agent_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get memory statistics.
    
    This endpoint returns statistics about the agent's memory usage,
    including counts of permanent, temporary, and execution memories.
    """
    stats = await get_memory_stats(db, str(agent_id) if agent_id else None)
    return stats


@router.post("/cleanup/temporary")
async def cleanup_temporary_memory(
    agent_id: Optional[uuid.UUID] = None,
    older_than_days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Clean up temporary memories.
    
    This endpoint deletes temporary memories that are older than the specified
    number of days. If agent_id is provided, only memories for that agent are
    deleted. Otherwise, memories for all agents are deleted.
    """
    # Check if agent exists if agent_id is provided
    if agent_id:
        agent = await crud.agent.get(db, str(agent_id))
        if not agent:
            raise HTTPException(
                status_code=404,
                detail=f"Agent with ID {agent_id} not found",
            )
    
    # Clean up temporary memories
    deleted_count = await cleanup_temporary_memories(
        db,
        str(agent_id) if agent_id else None,
        older_than_days,
    )
    
    return {
        "deleted_count": deleted_count,
        "agent_id": agent_id,
        "older_than_days": older_than_days,
    }


@router.post("/cleanup/execution")
async def cleanup_execution_memory(
    agent_id: Optional[uuid.UUID] = None,
    older_than_hours: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Clean up execution memories.
    
    This endpoint deletes execution memories that are older than the specified
    number of hours. If agent_id is provided, only memories for that agent are
    deleted. Otherwise, memories for all agents are deleted.
    """
    # Check if agent exists if agent_id is provided
    if agent_id:
        agent = await crud.agent.get(db, str(agent_id))
        if not agent:
            raise HTTPException(
                status_code=404,
                detail=f"Agent with ID {agent_id} not found",
            )
    
    # Clean up execution memories
    deleted_count = await cleanup_execution_memories(
        db,
        str(agent_id) if agent_id else None,
        older_than_hours,
    )
    
    return {
        "deleted_count": deleted_count,
        "agent_id": agent_id,
        "older_than_hours": older_than_hours,
    }
