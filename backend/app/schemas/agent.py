"""
Agent schemas.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field


class AgentBase(BaseModel):
    """Base agent schema."""
    name: str
    description: Optional[str] = None
    
    # LLM Configuration
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 1000
    
    # Personality & Behavior
    system_prompt: Optional[str] = None
    personality: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Memory Configuration
    memory_type: str = "conversation"
    memory_window: int = 10
    
    # Knowledge Configuration
    knowledge_base_ids: Optional[List[UUID]] = None
    
    # Integration Settings
    integration_settings: Dict[str, Dict[str, Union[str, int, float, bool, dict]]] = Field(default_factory=dict)
    
    # Agent State
    is_active: bool = True


class AgentCreate(AgentBase):
    """Agent creation schema."""
    pass


class AgentUpdate(BaseModel):
    """Agent update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    
    # LLM Configuration
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    
    # Personality & Behavior
    system_prompt: Optional[str] = None
    personality: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Memory Configuration
    memory_type: Optional[str] = None
    memory_window: Optional[int] = None
    
    # Knowledge Configuration
    knowledge_base_ids: Optional[List[UUID]] = None
    
    # Integration Settings
    integration_settings: Optional[Dict[str, Dict[str, Union[str, int, float, bool, dict]]]] = None
    
    # Agent State
    is_active: Optional[bool] = None


class Agent(AgentBase):
    """Agent schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True
