"""
CRUD operations for knowledge base.
"""

from typing import Any, Dict, List, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.knowledge_base import KnowledgeBase
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseUpdate


async def get(db: AsyncSession, id: str) -> Optional[KnowledgeBase]:
    """Get a knowledge base by ID."""
    result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.id == id))
    return result.scalars().first()


async def get_multi(
    db: AsyncSession, 
    agent_id: Optional[str] = None,
    knowledge_type: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[KnowledgeBase]:
    """Get multiple knowledge bases."""
    query = select(KnowledgeBase)
    
    if agent_id:
        query = query.where(KnowledgeBase.agent_id == agent_id)
    
    if knowledge_type:
        query = query.where(KnowledgeBase.knowledge_type == knowledge_type)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def create(db: AsyncSession, obj_in: KnowledgeBaseCreate) -> KnowledgeBase:
    """Create a new knowledge base."""
    db_obj = KnowledgeBase(
        agent_id=obj_in.agent_id,
        name=obj_in.name,
        description=obj_in.description,
        knowledge_type=obj_in.knowledge_type,
        tags=obj_in.tags,
        priority=obj_in.priority,
        content=obj_in.content,
        meta_data=obj_in.meta_data,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update(
    db: AsyncSession, db_obj: KnowledgeBase, obj_in: Union[KnowledgeBaseUpdate, Dict[str, Any]]
) -> KnowledgeBase:
    """Update a knowledge base."""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def delete(db: AsyncSession, id: str) -> KnowledgeBase:
    """Delete a knowledge base."""
    db_obj = await get(db, id)
    await db.delete(db_obj)
    await db.commit()
    return db_obj
