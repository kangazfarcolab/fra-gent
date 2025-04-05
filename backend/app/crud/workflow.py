from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.db.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate
import logging

logger = logging.getLogger(__name__)

def get_workflow(db: Session, workflow_id: int) -> Optional[Workflow]:
    """
    Get a workflow by ID.
    
    Args:
        db: Database session
        workflow_id: ID of the workflow to get
        
    Returns:
        The workflow if found, None otherwise
    """
    return db.query(Workflow).filter(Workflow.id == workflow_id).first()

def get_workflows(db: Session, skip: int = 0, limit: int = 100) -> List[Workflow]:
    """
    Get all workflows.
    
    Args:
        db: Database session
        skip: Number of workflows to skip
        limit: Maximum number of workflows to return
        
    Returns:
        List of workflows
    """
    return db.query(Workflow).offset(skip).limit(limit).all()

def create_workflow(db: Session, workflow: WorkflowCreate) -> Workflow:
    """
    Create a new workflow.
    
    Args:
        db: Database session
        workflow: Workflow data
        
    Returns:
        The created workflow
    """
    try:
        db_workflow = Workflow(**workflow.dict())
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        return db_workflow
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating workflow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating workflow",
        )

def update_workflow(db: Session, workflow_id: int, workflow: WorkflowUpdate) -> Optional[Workflow]:
    """
    Update a workflow.
    
    Args:
        db: Database session
        workflow_id: ID of the workflow to update
        workflow: Updated workflow data
        
    Returns:
        The updated workflow if found, None otherwise
    """
    try:
        db_workflow = get_workflow(db, workflow_id)
        if not db_workflow:
            return None
            
        # Update workflow fields
        for key, value in workflow.dict(exclude_unset=True).items():
            setattr(db_workflow, key, value)
            
        db.commit()
        db.refresh(db_workflow)
        return db_workflow
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating workflow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating workflow",
        )

def delete_workflow(db: Session, workflow_id: int) -> bool:
    """
    Delete a workflow.
    
    Args:
        db: Database session
        workflow_id: ID of the workflow to delete
        
    Returns:
        True if the workflow was deleted, False otherwise
    """
    try:
        db_workflow = get_workflow(db, workflow_id)
        if not db_workflow:
            return False
            
        db.delete(db_workflow)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting workflow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting workflow",
        )
