"""
API endpoints for preferences.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db
from app.schemas.knowledge_base import (
    Preference,
    PreferenceCreate,
    PreferenceUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[Preference])
async def get_preferences(
    agent_id: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all preferences.
    """
    preferences = await crud.preference.get_multi(
        db, agent_id=agent_id, category=category, skip=skip, limit=limit
    )
    return preferences


@router.post("/", response_model=Preference)
async def create_preference(
    preference_in: PreferenceCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new preference.
    """
    # Check if agent exists
    agent = await crud.agent.get(db, preference_in.agent_id)
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID {preference_in.agent_id} not found",
        )
    
    # Check if preference with same key already exists
    existing_preference = await crud.preference.get_by_key(
        db, agent_id=preference_in.agent_id, key=preference_in.key
    )
    if existing_preference:
        raise HTTPException(
            status_code=400,
            detail=f"Preference with key {preference_in.key} already exists for agent {preference_in.agent_id}",
        )
    
    preference = await crud.preference.create(db, obj_in=preference_in)
    return preference


@router.get("/{preference_id}", response_model=Preference)
async def get_preference(
    preference_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get a preference by ID.
    """
    preference = await crud.preference.get(db, id=preference_id)
    if not preference:
        raise HTTPException(
            status_code=404,
            detail=f"Preference with ID {preference_id} not found",
        )
    return preference


@router.put("/{preference_id}", response_model=Preference)
async def update_preference(
    preference_id: str,
    preference_in: PreferenceUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a preference.
    """
    preference = await crud.preference.get(db, id=preference_id)
    if not preference:
        raise HTTPException(
            status_code=404,
            detail=f"Preference with ID {preference_id} not found",
        )
    
    preference = await crud.preference.update(
        db, db_obj=preference, obj_in=preference_in
    )
    return preference


@router.delete("/{preference_id}", response_model=Preference)
async def delete_preference(
    preference_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a preference.
    """
    preference = await crud.preference.get(db, id=preference_id)
    if not preference:
        raise HTTPException(
            status_code=404,
            detail=f"Preference with ID {preference_id} not found",
        )
    
    preference = await crud.preference.delete(db, id=preference_id)
    return preference


@router.post("/{agent_id}/upsert", response_model=Preference)
async def upsert_preference(
    agent_id: str,
    key: str,
    value: Dict[str, Any],
    category: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[int] = None,
    meta_data: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create or update a preference.
    """
    # Check if agent exists
    agent = await crud.agent.get(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID {agent_id} not found",
        )
    
    kwargs = {}
    if category:
        kwargs["category"] = category
    if description:
        kwargs["description"] = description
    if priority:
        kwargs["priority"] = priority
    if meta_data:
        kwargs["meta_data"] = meta_data
    
    preference = await crud.preference.upsert(
        db, agent_id=agent_id, key=key, value=value, **kwargs
    )
    return preference
