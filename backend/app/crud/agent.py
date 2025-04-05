from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from app.db.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate
import logging

logger = logging.getLogger(__name__)

def get_agent(db: Session, agent_id: int) -> Optional[Agent]:
    """
    Get an agent by ID.
    
    Args:
        db: Database session
        agent_id: ID of the agent to get
        
    Returns:
        The agent if found, None otherwise
    """
    return db.query(Agent).filter(Agent.id == agent_id).first()

def get_agents(db: Session, skip: int = 0, limit: int = 100) -> List[Agent]:
    """
    Get all agents.
    
    Args:
        db: Database session
        skip: Number of agents to skip
        limit: Maximum number of agents to return
        
    Returns:
        List of agents
    """
    return db.query(Agent).offset(skip).limit(limit).all()

def create_agent(db: Session, agent: AgentCreate) -> Agent:
    """
    Create a new agent.
    
    Args:
        db: Database session
        agent: Agent data
        
    Returns:
        The created agent
    """
    try:
        db_agent = Agent(**agent.dict())
        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)
        return db_agent
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating agent",
        )

def update_agent(db: Session, agent_id: int, agent: AgentUpdate) -> Optional[Agent]:
    """
    Update an agent.
    
    Args:
        db: Database session
        agent_id: ID of the agent to update
        agent: Updated agent data
        
    Returns:
        The updated agent if found, None otherwise
    """
    try:
        db_agent = get_agent(db, agent_id)
        if not db_agent:
            return None
            
        # Update agent fields
        for key, value in agent.dict(exclude_unset=True).items():
            setattr(db_agent, key, value)
            
        db.commit()
        db.refresh(db_agent)
        return db_agent
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating agent",
        )

def delete_agent(db: Session, agent_id: int) -> bool:
    """
    Delete an agent.
    
    Args:
        db: Database session
        agent_id: ID of the agent to delete
        
    Returns:
        True if the agent was deleted, False otherwise
    """
    try:
        db_agent = get_agent(db, agent_id)
        if not db_agent:
            return False
            
        db.delete(db_agent)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error deleting agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting agent",
        )
