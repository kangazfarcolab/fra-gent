"""
Memory schemas.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryBase(BaseModel):
    """Base memory schema."""
    agent_id: UUID
    role: str  # user, assistant, system
    content: str
    metadata: Dict[str, Union[str, int, float, bool, dict]] = Field(default_factory=dict)


class MemoryCreate(MemoryBase):
    """Memory creation schema."""
    pass


class MemoryUpdate(BaseModel):
    """Memory update schema."""
    role: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Union[str, int, float, bool, dict]]] = None


class Memory(MemoryBase):
    """Memory schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    embedding: Optional[List[float]] = None

    class Config:
        """Pydantic config."""
        from_attributes = True
