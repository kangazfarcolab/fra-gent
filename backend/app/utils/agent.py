"""
Utility functions for working with agents.
"""

import logging
from typing import Dict, List, Optional, Union

from langchain.schema import AIMessage, HumanMessage, SystemMessage

from app.core.config import settings
from app.db.models import Agent, Memory
from app.utils.llm_providers import create_chat_model, create_chat_model_async, format_messages

logger = logging.getLogger(__name__)


async def generate_agent_response(
    agent: Agent,
    message: str,
    conversation_history: Optional[List[Memory]] = None,
    db = None,
) -> str:
    """
    Generate a response from an agent.

    Args:
        agent: The agent to generate a response from.
        message: The message to respond to.
        conversation_history: The conversation history to use for context.
        db: The database session to use for retrieving settings.

    Returns:
        The generated response.
    """
    # Create the chat model
    if db:
        # Use async version with database settings
        chat = await create_chat_model_async(
            db=db,
            provider=agent.integration_settings.get("provider", settings.DEFAULT_PROVIDER),
            model=agent.model,
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
        )
    else:
        # Use sync version with environment variables
        chat = create_chat_model(
            provider=agent.integration_settings.get("provider", settings.DEFAULT_PROVIDER),
            model=agent.model,
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
        )

    # Format the messages
    messages = []

    # Add conversation history if available
    if conversation_history:
        for memory in conversation_history:
            messages.append({
                "role": memory.role,
                "content": memory.content,
            })

    # Add the current message
    messages.append({
        "role": "user",
        "content": message,
    })

    # Format the messages for the chat model
    formatted_messages = format_messages(
        system_prompt=agent.system_prompt,
        messages=messages,
    )

    # Generate the response
    response = chat.predict_messages(formatted_messages)

    # Return the response content
    return response.content


async def create_memory_from_interaction(
    agent_id: str,
    role: str,
    content: str,
    meta_data: Optional[Dict[str, Union[str, int, float, bool, dict]]] = None,
) -> Memory:
    """
    Create a memory from an interaction.

    Args:
        agent_id: The ID of the agent.
        role: The role of the message (user, assistant, system).
        content: The content of the message.
        metadata: Additional metadata for the memory.

    Returns:
        The created memory.
    """
    memory = Memory(
        agent_id=agent_id,
        role=role,
        content=content,
        meta_data=meta_data or {},
    )

    return memory
