"""
API endpoints for event-driven agent interactions.
"""

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db
from app.schemas.event import EventTrigger, EventResponse
from app.schemas.memory import MemoryCreate
from app.utils.agent import generate_agent_response
from app.utils.memory_retrieval import build_agent_context

router = APIRouter()


@router.post("/{agent_id}/trigger", response_model=EventResponse)
async def trigger_agent(
    agent_id: uuid.UUID,
    event: EventTrigger,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Trigger an agent with an event.

    This endpoint allows triggering an agent with various types of events,
    such as notifications, emails, or scheduled tasks.
    """
    # Get agent
    agent = await crud.agent.get(db, str(agent_id))
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID {agent_id} not found",
        )

    # Build comprehensive context for the agent
    context = await build_agent_context(
        db,
        str(agent_id),
        event.content,
        task_type=event.type,
        embedding=None,  # TODO: Generate embedding
    )

    # Generate response
    response = await generate_agent_response(
        agent=agent,
        message=event.content,
        context=context,
        db=db,
    )

    # Create memory for this event
    memory = await crud.memory.create(
        db,
        obj_in=MemoryCreate(
            agent_id=str(agent_id),
            role="user",
            content=event.content,
            meta_data={
                "event_type": event.type,
                "event_source": event.source,
                "context": event.context,
            },
        ),
    )

    # Create memory for agent's response
    response_memory = await crud.memory.create(
        db,
        obj_in=MemoryCreate(
            agent_id=str(agent_id),
            role="assistant",
            content=response,
            meta_data={
                "event_type": event.type,
                "event_source": "agent",
                "in_response_to": str(memory.id),
            },
        ),
    )

    # Return response
    return EventResponse(
        response=response,
        event_id=str(memory.id),
        response_id=str(response_memory.id),
        context=context,
    )
