from typing import Any, Dict, List, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.settings import Settings
from app.schemas.settings import SettingsCreate, SettingsUpdate


async def get(db: AsyncSession, id: str) -> Optional[Settings]:
    """Get a setting by ID."""
    result = await db.execute(select(Settings).where(Settings.id == id))
    return result.scalars().first()


async def get_by_key(db: AsyncSession, key: str) -> Optional[Settings]:
    """Get a setting by key."""
    result = await db.execute(select(Settings).where(Settings.key == key))
    return result.scalars().first()


async def get_multi(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Settings]:
    """Get multiple settings."""
    result = await db.execute(select(Settings).offset(skip).limit(limit))
    return result.scalars().all()


async def create(db: AsyncSession, obj_in: SettingsCreate) -> Settings:
    """Create a new setting."""
    db_obj = Settings(
        key=obj_in.key,
        value=obj_in.value,
        description=obj_in.description,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update(
    db: AsyncSession, db_obj: Settings, obj_in: Union[SettingsUpdate, Dict[str, Any]]
) -> Settings:
    """Update a setting."""
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


async def delete(db: AsyncSession, id: str) -> Settings:
    """Delete a setting."""
    db_obj = await get(db, id)
    await db.delete(db_obj)
    await db.commit()
    return db_obj


async def upsert(db: AsyncSession, key: str, value: Dict[str, Any], description: Optional[str] = None) -> Settings:
    """Create or update a setting by key."""
    db_obj = await get_by_key(db, key)
    if db_obj:
        return await update(db, db_obj, {"value": value, "description": description or db_obj.description})
    else:
        return await create(db, SettingsCreate(key=key, value=value, description=description))
