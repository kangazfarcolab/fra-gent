"""
Agent interaction endpoints.
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Agent, Memory
from app.db.session import get_db
from app.schemas.memory import Memory as MemorySchema
from app.schemas.memory import MemoryCreate
from app.utils.agent import generate_agent_response, create_memory_from_interaction

router = APIRouter()


class InteractionRequest(BaseModel):
    """Interaction request schema."""
    message: str
    include_history: bool = True
    history_limit: Optional[int] = None


class InteractionResponse(BaseModel):
    """Interaction response schema."""
    response: str
    memories: List[MemorySchema]


@router.post("", response_model=InteractionResponse)
async def interact_with_agent(
    agent_id: uuid.UUID,
    interaction: InteractionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Interact with an agent.
    """
    # Check if agent exists
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {agent_id} not found",
        )
    
    # Get conversation history if requested
    conversation_history = None
    if interaction.include_history:
        history_query = select(Memory).filter(Memory.agent_id == agent_id)
        
        # Apply history limit if specified
        if interaction.history_limit:
            history_query = history_query.order_by(Memory.created_at.desc()).limit(interaction.history_limit)
        
        history_result = await db.execute(history_query)
        conversation_history = history_result.scalars().all()
        
        # Reverse the history to get chronological order
        if conversation_history:
            conversation_history = list(reversed(conversation_history))
    
    # Create a memory for the user message
    user_memory = await create_memory_from_interaction(
        agent_id=agent_id,
        role="user",
        content=interaction.message,
    )
    db.add(user_memory)
    await db.commit()
    await db.refresh(user_memory)
    
    # Generate a response from the agent
    response = await generate_agent_response(
        agent=agent,
        message=interaction.message,
        conversation_history=conversation_history,
    )
    
    # Create a memory for the assistant response
    assistant_memory = await create_memory_from_interaction(
        agent_id=agent_id,
        role="assistant",
        content=response,
    )
    db.add(assistant_memory)
    await db.commit()
    await db.refresh(assistant_memory)
    
    # Return the response and memories
    return InteractionResponse(
        response=response,
        memories=[user_memory, assistant_memory],
    )
