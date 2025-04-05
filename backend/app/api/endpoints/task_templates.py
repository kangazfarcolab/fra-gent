"""
API endpoints for task templates.
"""

from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db
from app.schemas.knowledge_base import (
    TaskTemplate,
    TaskTemplateCreate,
    TaskTemplateUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[TaskTemplate])
async def get_task_templates(
    agent_id: Optional[str] = None,
    task_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get all task templates.
    """
    task_templates = await crud.task_template.get_multi(
        db, agent_id=agent_id, task_type=task_type, skip=skip, limit=limit
    )
    return task_templates


@router.post("/", response_model=TaskTemplate)
async def create_task_template(
    task_template_in: TaskTemplateCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new task template.
    """
    # Check if agent exists
    agent = await crud.agent.get(db, task_template_in.agent_id)
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agent with ID {task_template_in.agent_id} not found",
        )
    
    task_template = await crud.task_template.create(db, obj_in=task_template_in)
    return task_template


@router.get("/{task_template_id}", response_model=TaskTemplate)
async def get_task_template(
    task_template_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get a task template by ID.
    """
    task_template = await crud.task_template.get(db, id=task_template_id)
    if not task_template:
        raise HTTPException(
            status_code=404,
            detail=f"Task template with ID {task_template_id} not found",
        )
    return task_template


@router.put("/{task_template_id}", response_model=TaskTemplate)
async def update_task_template(
    task_template_id: str,
    task_template_in: TaskTemplateUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update a task template.
    """
    task_template = await crud.task_template.get(db, id=task_template_id)
    if not task_template:
        raise HTTPException(
            status_code=404,
            detail=f"Task template with ID {task_template_id} not found",
        )
    
    task_template = await crud.task_template.update(
        db, db_obj=task_template, obj_in=task_template_in
    )
    return task_template


@router.delete("/{task_template_id}", response_model=TaskTemplate)
async def delete_task_template(
    task_template_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Delete a task template.
    """
    task_template = await crud.task_template.get(db, id=task_template_id)
    if not task_template:
        raise HTTPException(
            status_code=404,
            detail=f"Task template with ID {task_template_id} not found",
        )
    
    task_template = await crud.task_template.delete(db, id=task_template_id)
    return task_template
