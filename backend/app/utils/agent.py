"""
Utility functions for working with agents.
"""

import logging
from typing import Any, Dict, List, Optional, Union

from langchain.schema import AIMessage, HumanMessage, SystemMessage

from app.core.config import settings
from app.db.models import Agent, Memory
from app.utils.llm_providers import create_chat_model, create_chat_model_async, format_messages

logger = logging.getLogger(__name__)


async def generate_agent_response(
    agent: Agent,
    message: str,
    conversation_history: Optional[List[Memory]] = None,
    context: Optional[Dict[str, Any]] = None,
    db = None,
) -> str:
    """
    Generate a response from an agent.

    Args:
        agent: The agent to generate a response from.
        message: The message to respond to.
        conversation_history: The conversation history to use for context.
        context: Additional context for the agent.
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

    # Prepare enhanced system prompt with context
    system_prompt = agent.system_prompt or ""

    # Add context to system prompt if available
    if context:
        # Add agent personality and bio
        if agent.personality or agent.bio:
            system_prompt += f"\n\nYour personality: {agent.personality}\nYour bio: {agent.bio}"

        # Add knowledge
        if context.get("knowledge"):
            system_prompt += "\n\nYou have the following knowledge:\n"
            for item in context["knowledge"]:
                system_prompt += f"- {item['name']}: {item['content']}\n"

        # Add preferences
        if context.get("preferences"):
            system_prompt += "\n\nYou have the following preferences:\n"
            for key, value in context["preferences"].items():
                system_prompt += f"- {key}: {value}\n"

        # Add task template if available
        if context.get("task_template"):
            template = context["task_template"]
            system_prompt += f"\n\nFor tasks of type '{template['task_type']}', follow these steps:\n"
            for i, step in enumerate(template["steps"]):
                system_prompt += f"{i+1}. {step}\n"

            if template.get("examples"):
                system_prompt += "\nExamples:\n"
                for example in template["examples"]:
                    system_prompt += f"- Input: {example['input']}\n  Output: {example['output']}\n"

    # Add conversation history if available
    if conversation_history:
        for memory in conversation_history:
            messages.append({
                "role": memory.role,
                "content": memory.content,
            })
    elif context and context.get("memories"):
        # Use memories from context if no conversation history is provided
        for memory in context["memories"]:
            messages.append({
                "role": memory["role"],
                "content": memory["content"],
            })

    # Add the current message
    messages.append({
        "role": "user",
        "content": message,
    })

    # Format the messages for the chat model
    formatted_messages = format_messages(
        system_prompt=system_prompt,
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
