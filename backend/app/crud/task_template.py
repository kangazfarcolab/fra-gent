"""
CRUD operations for task templates.
"""

from typing import Any, Dict, List, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.knowledge_base import TaskTemplate
from app.schemas.knowledge_base import TaskTemplateCreate, TaskTemplateUpdate


async def get(db: AsyncSession, id: str) -> Optional[TaskTemplate]:
    """Get a task template by ID."""
    result = await db.execute(select(TaskTemplate).where(TaskTemplate.id == id))
    return result.scalars().first()


async def get_multi(
    db: AsyncSession, 
    agent_id: Optional[str] = None,
    task_type: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[TaskTemplate]:
    """Get multiple task templates."""
    query = select(TaskTemplate)
    
    if agent_id:
        query = query.where(TaskTemplate.agent_id == agent_id)
    
    if task_type:
        query = query.where(TaskTemplate.task_type == task_type)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def create(db: AsyncSession, obj_in: TaskTemplateCreate) -> TaskTemplate:
    """Create a new task template."""
    db_obj = TaskTemplate(
        agent_id=obj_in.agent_id,
        name=obj_in.name,
        description=obj_in.description,
        task_type=obj_in.task_type,
        task_pattern=obj_in.task_pattern,
        priority=obj_in.priority,
        steps=obj_in.steps,
        examples=obj_in.examples,
        meta_data=obj_in.meta_data,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update(
    db: AsyncSession, db_obj: TaskTemplate, obj_in: Union[TaskTemplateUpdate, Dict[str, Any]]
) -> TaskTemplate:
    """Update a task template."""
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


async def delete(db: AsyncSession, id: str) -> TaskTemplate:
    """Delete a task template."""
    db_obj = await get(db, id)
    await db.delete(db_obj)
    await db.commit()
    return db_obj
