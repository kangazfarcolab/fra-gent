"""
API endpoints for knowledge bases.
"""

from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db
from app.schemas.knowledge_base import (
    KnowledgeBase,
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[KnowledgeBase])
async def get_knowledge_bases(
    agent_id: Optional[str] = None,
    knowledge_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all knowledge bases.
    """
    knowledge_bases = await crud.knowledge_base.get_multi(
        db, agent_id=agent_id, knowledge_type=knowledge_type, skip=skip, limit=limit
    )
    return knowledge_bases


@router.post("/", response_model=KnowledgeBase)
async def create_knowledge_base(
    knowledge_base_in: KnowledgeBaseCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new knowledge base.
    """
    # Check if agent exists
    agent = await crud.agent.get(db, knowledge_base_in.agent_id)
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID {knowledge_base_in.agent_id} not found",
        )
    
    knowledge_base = await crud.knowledge_base.create(db, obj_in=knowledge_base_in)
    return knowledge_base


@router.get("/{knowledge_base_id}", response_model=KnowledgeBase)
async def get_knowledge_base(
    knowledge_base_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get a knowledge base by ID.
    """
    knowledge_base = await crud.knowledge_base.get(db, id=knowledge_base_id)
    if not knowledge_base:
        raise HTTPException(
            status_code=404,
            detail=f"Knowledge base with ID {knowledge_base_id} not found",
        )
    return knowledge_base


@router.put("/{knowledge_base_id}", response_model=KnowledgeBase)
async def update_knowledge_base(
    knowledge_base_id: str,
    knowledge_base_in: KnowledgeBaseUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a knowledge base.
    """
    knowledge_base = await crud.knowledge_base.get(db, id=knowledge_base_id)
    if not knowledge_base:
        raise HTTPException(
            status_code=404,
            detail=f"Knowledge base with ID {knowledge_base_id} not found",
        )
    
    knowledge_base = await crud.knowledge_base.update(
        db, db_obj=knowledge_base, obj_in=knowledge_base_in
    )
    return knowledge_base


@router.delete("/{knowledge_base_id}", response_model=KnowledgeBase)
async def delete_knowledge_base(
    knowledge_base_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a knowledge base.
    """
    knowledge_base = await crud.knowledge_base.get(db, id=knowledge_base_id)
    if not knowledge_base:
        raise HTTPException(
            status_code=404,
            detail=f"Knowledge base with ID {knowledge_base_id} not found",
        )
    
    knowledge_base = await crud.knowledge_base.delete(db, id=knowledge_base_id)
    return knowledge_base
