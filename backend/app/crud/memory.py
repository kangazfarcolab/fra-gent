from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.db.models.memory import Memory
from app.schemas.memory import MemoryCreate, MemoryUpdate
import logging

logger = logging.getLogger(__name__)

def get_memory(db: Session, memory_id: int) -> Optional[Memory]:
    """
    Get a memory by ID.
    
    Args:
        db: Database session
        memory_id: ID of the memory to get
        
    Returns:
        The memory if found, None otherwise
    """
    return db.query(Memory).filter(Memory.id == memory_id).first()

def get_memories_by_agent(db: Session, agent_id: int, skip: int = 0, limit: int = 100) -> List[Memory]:
    """
    Get all memories for an agent.
    
    Args:
        db: Database session
        agent_id: ID of the agent
        skip: Number of memories to skip
        limit: Maximum number of memories to return
        
    Returns:
        List of memories
    """
    return db.query(Memory).filter(Memory.agent_id == agent_id).offset(skip).limit(limit).all()

def create_memory(db: Session, memory: MemoryCreate) -> Memory:
    """
    Create a new memory.
    
    Args:
        db: Database session
        memory: Memory data
        
    Returns:
        The created memory
    """
    try:
        db_memory = Memory(**memory.dict())
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)
        return db_memory
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating memory",
        )

def update_memory(db: Session, memory_id: int, memory: MemoryUpdate) -> Optional[Memory]:
    """
    Update a memory.
    
    Args:
        db: Database session
        memory_id: ID of the memory to update
        memory: Updated memory data
        
    Returns:
        The updated memory if found, None otherwise
    """
    try:
        db_memory = get_memory(db, memory_id)
        if not db_memory:
            return None
            
        # Update memory fields
        for key, value in memory.dict(exclude_unset=True).items():
            setattr(db_memory, key, value)
            
        db.commit()
        db.refresh(db_memory)
        return db_memory
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating memory",
        )

def delete_memory(db: Session, memory_id: int) -> bool:
    """
    Delete a memory.
    
    Args:
        db: Database session
        memory_id: ID of the memory to delete
        
    Returns:
        True if the memory was deleted, False otherwise
    """
    try:
        db_memory = get_memory(db, memory_id)
        if not db_memory:
            return False
            
        db.delete(db_memory)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting memory",
        )
