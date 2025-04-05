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
from app.utils.working_memory import WorkingMemory

router = APIRouter()


@router.post("/trigger", response_model=EventResponse)
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

    # Determine memory type based on event type
    memory_type = "permanent"
    if event.type in ["scraping", "processing", "temporary"]:
        memory_type = "temporary"
    elif event.context and event.context.get("memory_type"):
        memory_type = event.context.get("memory_type")

    # Create memory for this event
    memory = await crud.memory.create(
        db,
        obj_in=MemoryCreate(
            agent_id=str(agent_id),
            role="user",
            content=event.content,
            memory_type=memory_type,
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
            memory_type=memory_type,
            meta_data={
                "event_type": event.type,
                "event_source": "agent",
                "in_response_to": str(memory.id),
            },
        ),
    )

    # If this is a task that generates working memory, create a summary
    if event.context and event.context.get("working_memory"):
        working_memory = event.context.get("working_memory")
        if isinstance(working_memory, dict):
            # Convert dict to WorkingMemory object
            wm = WorkingMemory()
            for key, value in working_memory.get("data", {}).items():
                wm.add_data(key, value)
            for step in working_memory.get("steps", []):
                wm.add_step(**step)
            for doc in working_memory.get("documents", []):
                wm.add_document(**doc)
            for result in working_memory.get("results", []):
                wm.add_result(**result)

            # Create permanent memories from working memory
            permanent_memories = wm.to_permanent_memories(str(agent_id))
            for mem_data in permanent_memories:
                await crud.memory.create(db, obj_in=MemoryCreate(**mem_data))

    # Return response
    return EventResponse(
        response=response,
        event_id=str(memory.id),
        response_id=str(response_memory.id),
        context=context,
    )
