"""
Agent management endpoints.
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Agent
from app.db.session import get_db
from app.schemas.agent import Agent as AgentSchema
from app.schemas.agent import AgentCreate, AgentUpdate

router = APIRouter()


@router.get("", response_model=List[AgentSchema])
async def list_agents(db: AsyncSession = Depends(get_db)):
    """
    List all agents.
    """
    result = await db.execute(select(Agent))
    agents = result.scalars().all()
    return agents


@router.post("", response_model=AgentSchema, status_code=status.HTTP_201_CREATED)
async def create_agent(agent: AgentCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new agent.
    """
    db_agent = Agent(
        id=uuid.uuid4(),
        name=agent.name,
        description=agent.description,
        model=agent.model,
        system_prompt=agent.system_prompt,
        temperature=agent.temperature,
        max_tokens=agent.max_tokens,
        personality=agent.personality,
        bio=agent.bio,
        avatar_url=agent.avatar_url,
        memory_type=agent.memory_type,
        memory_window=agent.memory_window,
        knowledge_base_ids=agent.knowledge_base_ids,
        integration_settings=agent.integration_settings,
        is_active=agent.is_active,
    )
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    return db_agent


@router.get("/{agent_id}", response_model=AgentSchema)
async def get_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Get an agent by ID.
    """
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )
    return agent


@router.put("/{agent_id}", response_model=AgentSchema)
async def update_agent(
    agent_id: uuid.UUID, agent: AgentUpdate, db: AsyncSession = Depends(get_db)
):
    """
    Update an agent.
    """
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    db_agent = result.scalars().first()
    if not db_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )

    # Update agent fields
    update_data = agent.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_agent, field, value)

    await db.commit()
    await db.refresh(db_agent)
    return db_agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Delete an agent.
    """
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )
    await db.delete(agent)
    await db.commit()
    return None
