"""
CRUD operations for preferences.
"""

from typing import Any, Dict, List, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.knowledge_base import Preference
from app.schemas.knowledge_base import PreferenceCreate, PreferenceUpdate


async def get(db: AsyncSession, id: str) -> Optional[Preference]:
    """Get a preference by ID."""
    result = await db.execute(select(Preference).where(Preference.id == id))
    return result.scalars().first()


async def get_by_key(db: AsyncSession, agent_id: str, key: str) -> Optional[Preference]:
    """Get a preference by key."""
    result = await db.execute(
        select(Preference).where(Preference.agent_id == agent_id, Preference.key == key)
    )
    return result.scalars().first()


async def get_multi(
    db: AsyncSession, 
    agent_id: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[Preference]:
    """Get multiple preferences."""
    query = select(Preference)
    
    if agent_id:
        query = query.where(Preference.agent_id == agent_id)
    
    if category:
        query = query.where(Preference.category == category)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def create(db: AsyncSession, obj_in: PreferenceCreate) -> Preference:
    """Create a new preference."""
    db_obj = Preference(
        agent_id=obj_in.agent_id,
        key=obj_in.key,
        value=obj_in.value,
        category=obj_in.category,
        description=obj_in.description,
        priority=obj_in.priority,
        meta_data=obj_in.meta_data,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update(
    db: AsyncSession, db_obj: Preference, obj_in: Union[PreferenceUpdate, Dict[str, Any]]
) -> Preference:
    """Update a preference."""
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


async def delete(db: AsyncSession, id: str) -> Preference:
    """Delete a preference."""
    db_obj = await get(db, id)
    await db.delete(db_obj)
    await db.commit()
    return db_obj


async def upsert(
    db: AsyncSession, agent_id: str, key: str, value: Dict[str, Any], **kwargs
) -> Preference:
    """Create or update a preference."""
    db_obj = await get_by_key(db, agent_id, key)
    
    if db_obj:
        update_data = {"value": value, **kwargs}
        return await update(db, db_obj, update_data)
    else:
        create_data = PreferenceCreate(
            agent_id=agent_id,
            key=key,
            value=value,
            **kwargs
        )
        return await create(db, create_data)
