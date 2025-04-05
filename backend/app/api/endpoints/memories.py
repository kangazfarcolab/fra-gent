"""
Memory management endpoints.
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Agent, Memory
from app.db.session import get_db
from app.schemas.memory import Memory as MemorySchema
from app.schemas.memory import MemoryCreate, MemoryUpdate

router = APIRouter()


@router.get("", response_model=List[MemorySchema])
async def list_memories(
    agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """
    List all memories for an agent.
    """
    # Check if agent exists
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )

    # Get memories
    result = await db.execute(select(Memory).filter(Memory.agent_id == agent_id))
    memories = result.scalars().all()
    return memories


@router.post("", response_model=MemorySchema, status_code=status.HTTP_201_CREATED)
async def create_memory(
    memory: MemoryCreate, db: AsyncSession = Depends(get_db)
):
    """
    Create a new memory.
    """
    # Check if agent exists
    result = await db.execute(select(Agent).filter(Agent.id == memory.agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {memory.agent_id} not found",
        )

    # Create memory
    db_memory = Memory(
        id=uuid.uuid4(),
        agent_id=memory.agent_id,
        role=memory.role,
        content=memory.content,
        metadata=memory.metadata,
    )
    db.add(db_memory)
    await db.commit()
    await db.refresh(db_memory)
    return db_memory


@router.get("/{memory_id}", response_model=MemorySchema)
async def get_memory(
    agent_id: uuid.UUID, memory_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """
    Get a memory by ID.
    """
    result = await db.execute(
        select(Memory).filter(Memory.id == memory_id, Memory.agent_id == agent_id)
    )
    memory = result.scalars().first()
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory with ID {memory_id} not found for agent {agent_id}",
        )
    return memory


@router.put("/{memory_id}", response_model=MemorySchema)
async def update_memory(
    agent_id: uuid.UUID,
    memory_id: uuid.UUID,
    memory: MemoryUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a memory.
    """
    result = await db.execute(
        select(Memory).filter(Memory.id == memory_id, Memory.agent_id == agent_id)
    )
    db_memory = result.scalars().first()
    if not db_memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory with ID {memory_id} not found for agent {agent_id}",
        )

    # Update memory fields
    update_data = memory.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_memory, field, value)

    await db.commit()
    await db.refresh(db_memory)
    return db_memory


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    agent_id: uuid.UUID, memory_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """
    Delete a memory.
    """
    result = await db.execute(
        select(Memory).filter(Memory.id == memory_id, Memory.agent_id == agent_id)
    )
    memory = result.scalars().first()
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory with ID {memory_id} not found for agent {agent_id}",
        )
    await db.delete(memory)
    await db.commit()
    return None
