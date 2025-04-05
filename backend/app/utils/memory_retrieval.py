"""
Memory retrieval utilities.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent import Agent
from app.db.models.knowledge_base import KnowledgeBase, Preference, TaskTemplate
from app.db.models.memory import Memory

logger = logging.getLogger(__name__)


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    """
    if not a or not b:
        return 0.0

    a_array = np.array(a)
    b_array = np.array(b)

    dot_product = np.dot(a_array, b_array)
    norm_a = np.linalg.norm(a_array)
    norm_b = np.linalg.norm(b_array)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


async def retrieve_relevant_memories(
    db: AsyncSession,
    agent_id: str,
    current_context: str,
    embedding: Optional[List[float]] = None,
    limit: int = 10,
    memory_types: Optional[List[str]] = None,
) -> List[Memory]:
    """
    Retrieve memories relevant to the current context.

    Args:
        db: Database session
        agent_id: Agent ID
        current_context: Current context
        embedding: Embedding of the current context
        limit: Maximum number of memories to retrieve
        memory_types: Types of memories to retrieve

    Returns:
        List of relevant memories
    """
    # Get all memories for the agent
    query = select(Memory).where(Memory.agent_id == agent_id)

    # Filter by memory types if specified
    if memory_types:
        # Assuming memory_type is stored in meta_data
        # This is a simplification - in a real system, you'd need a more sophisticated query
        pass

    # Execute query
    result = await db.execute(query)
    memories = result.scalars().all()

    # If no embedding is provided, return the most recent memories
    if not embedding:
        # Sort by created_at in descending order
        memories.sort(key=lambda x: x.created_at, reverse=True)
        return memories[:limit]

    # Calculate similarity and sort
    memories_with_scores = []
    for memory in memories:
        if memory.embedding:
            similarity = cosine_similarity(embedding, memory.embedding)
            memories_with_scores.append((memory, similarity))

    # Sort by similarity score
    memories_with_scores.sort(key=lambda x: x[1], reverse=True)

    # Return top N memories
    return [memory for memory, _ in memories_with_scores[:limit]]


async def retrieve_relevant_knowledge(
    db: AsyncSession,
    agent_id: str,
    current_context: str,
    embedding: Optional[List[float]] = None,
    limit: int = 5,
    knowledge_types: Optional[List[str]] = None,
) -> List[KnowledgeBase]:
    """
    Retrieve knowledge relevant to the current context.

    Args:
        db: Database session
        agent_id: Agent ID
        current_context: Current context
        embedding: Embedding of the current context
        limit: Maximum number of knowledge items to retrieve
        knowledge_types: Types of knowledge to retrieve

    Returns:
        List of relevant knowledge items
    """
    # Get all knowledge for the agent
    query = select(KnowledgeBase).where(KnowledgeBase.agent_id == agent_id)

    # Filter by knowledge types if specified
    if knowledge_types:
        query = query.where(KnowledgeBase.knowledge_type.in_(knowledge_types))

    # Execute query
    result = await db.execute(query)
    knowledge_items = result.scalars().all()

    # If no embedding is provided, return the highest priority knowledge
    if not embedding:
        # Sort by priority in descending order
        knowledge_items.sort(key=lambda x: x.priority, reverse=True)
        return knowledge_items[:limit]

    # Calculate similarity and sort
    knowledge_with_scores = []
    for knowledge in knowledge_items:
        if knowledge.embedding:
            similarity = cosine_similarity(embedding, knowledge.embedding)
            # Adjust score by priority
            adjusted_score = similarity * (1 + 0.1 * knowledge.priority)
            knowledge_with_scores.append((knowledge, adjusted_score))
        else:
            # If no embedding, use priority as a fallback
            knowledge_with_scores.append((knowledge, 0.1 * knowledge.priority))

    # Sort by adjusted score
    knowledge_with_scores.sort(key=lambda x: x[1], reverse=True)

    # Return top N knowledge items
    return [knowledge for knowledge, _ in knowledge_with_scores[:limit]]


async def retrieve_relevant_task_template(
    db: AsyncSession,
    agent_id: str,
    task_description: str,
    task_type: Optional[str] = None,
) -> Optional[TaskTemplate]:
    """
    Retrieve the most relevant task template for a given task.

    Args:
        db: Database session
        agent_id: Agent ID
        task_description: Description of the task
        task_type: Type of task

    Returns:
        Most relevant task template, or None if no relevant template is found
    """
    # Get all task templates for the agent
    query = select(TaskTemplate).where(TaskTemplate.agent_id == agent_id)

    # Filter by task type if specified
    if task_type:
        query = query.where(TaskTemplate.task_type == task_type)

    # Execute query
    result = await db.execute(query)
    templates = result.scalars().all()

    if not templates:
        return None

    # TODO: Implement more sophisticated matching based on embeddings
    # For now, just return the highest priority template
    templates.sort(key=lambda x: x.priority, reverse=True)
    return templates[0]


async def get_agent_preferences(
    db: AsyncSession,
    agent_id: str,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get all preferences for an agent.

    Args:
        db: Database session
        agent_id: Agent ID
        category: Category of preferences to retrieve

    Returns:
        Dictionary of preferences
    """
    # Get all preferences for the agent
    query = select(Preference).where(Preference.agent_id == agent_id)

    # Filter by category if specified
    if category:
        query = query.where(Preference.category == category)

    # Execute query
    result = await db.execute(query)
    preferences = result.scalars().all()

    # Convert to dictionary
    preferences_dict = {}
    for preference in preferences:
        preferences_dict[preference.key] = preference.value

    return preferences_dict


async def build_agent_context(
    db: AsyncSession,
    agent_id: str,
    current_context: str,
    task_type: Optional[str] = None,
    embedding: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Build a comprehensive context for the agent.

    Args:
        db: Database session
        agent_id: Agent ID
        current_context: Current context
        task_type: Type of task
        embedding: Embedding of the current context

    Returns:
        Dictionary containing all relevant context for the agent
    """
    # Get agent
    agent = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = agent.scalars().first()

    if not agent:
        logger.error(f"Agent with ID {agent_id} not found")
        return {}

    # Get relevant memories
    memories = await retrieve_relevant_memories(
        db, agent_id, current_context, embedding, limit=10
    )

    # Get relevant knowledge
    knowledge = await retrieve_relevant_knowledge(
        db, agent_id, current_context, embedding, limit=5
    )

    # Get relevant task template
    task_template = await retrieve_relevant_task_template(
        db, agent_id, current_context, task_type
    )

    # Get agent preferences
    preferences = await get_agent_preferences(db, agent_id)

    # Build context
    context = {
        "agent": {
            "id": str(agent.id),
            "name": agent.name,
            "description": agent.description,
            "personality": agent.personality,
            "bio": agent.bio,
        },
        "memories": [
            {
                "role": memory.role,
                "content": memory.content,
                "created_at": memory.created_at.isoformat(),
            }
            for memory in memories
        ],
        "knowledge": [
            {
                "name": item.name,
                "knowledge_type": item.knowledge_type,
                "content": item.content,
                "priority": item.priority,
            }
            for item in knowledge
        ],
        "task_template": None,
        "preferences": preferences,
    }

    if task_template:
        context["task_template"] = {
            "name": task_template.name,
            "task_type": task_template.task_type,
            "steps": task_template.steps,
            "examples": task_template.examples,
        }

    return context
