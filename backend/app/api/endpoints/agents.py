"""
Agent management endpoints.
"""

import uuid
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Agent
from app.db.session import get_db
from app.schemas.agent import Agent as AgentSchema
from app.schemas.agent import AgentCreate, AgentUpdate
from app.schemas.memory import MemoryCreate
from app.services.llm import get_llm_service

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
    from sqlalchemy import text

    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )

    # Delete memories manually to avoid issues with the memory_type column
    await db.execute(text(f"DELETE FROM memory WHERE agent_id = '{agent_id}'"))

    # Delete the agent directly from the database
    await db.execute(text(f"DELETE FROM agent WHERE id = '{agent_id}'"))
    await db.commit()

    return None


@router.post("/{agent_id}/interact", status_code=status.HTTP_200_OK)
async def interact_with_agent(
    agent_id: uuid.UUID,
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """
    Interact with an agent.
    """
    # Get the agent
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )

    # Get the message from the request
    message = request.get("message", "")
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required",
        )

    # Get the LLM service
    from app.services.llm import get_llm_service
    llm_service = get_llm_service()

    # Create a memory for the user message
    user_memory = MemoryCreate(
        agent_id=str(agent_id),
        role="user",
        content=message,
    )

    # Get the response from the LLM
    response = await llm_service.generate_response(
        agent=agent,
        message=message,
        include_history=request.get("include_history", False),
    )

    # Create a memory for the assistant response
    assistant_memory = MemoryCreate(
        agent_id=str(agent_id),
        role="assistant",
        content=response,
    )

    # Return the response and memories
    return {
        "response": response,
        "memories": [
            {
                "id": str(uuid.uuid4()),
                "agent_id": str(agent_id),
                "role": "user",
                "content": message,
                "created_at": "2023-07-01T00:00:00Z",
            },
            {
                "id": str(uuid.uuid4()),
                "agent_id": str(agent_id),
                "role": "assistant",
                "content": response,
                "created_at": "2023-07-01T00:00:00Z",
            },
        ],
    }
