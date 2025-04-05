"""
Knowledge base schemas.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class KnowledgeBaseBase(BaseModel):
    """Base knowledge base schema."""
    name: str
    description: Optional[str] = None
    knowledge_type: str
    tags: Optional[List[str]] = None
    priority: int = 1
    content: str
    meta_data: Optional[Dict[str, Any]] = None


class KnowledgeBaseCreate(KnowledgeBaseBase):
    """Knowledge base creation schema."""
    agent_id: str


class KnowledgeBaseUpdate(BaseModel):
    """Knowledge base update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    knowledge_type: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: Optional[int] = None
    content: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None


class KnowledgeBaseInDBBase(KnowledgeBaseBase):
    """Knowledge base in DB base schema."""
    id: str
    agent_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeBase(KnowledgeBaseInDBBase):
    """Knowledge base schema."""
    pass


class TaskTemplateBase(BaseModel):
    """Base task template schema."""
    name: str
    description: Optional[str] = None
    task_type: str
    task_pattern: Optional[str] = None
    priority: int = 1
    steps: Dict[str, Any]
    examples: Optional[Dict[str, Any]] = None
    meta_data: Optional[Dict[str, Any]] = None


class TaskTemplateCreate(TaskTemplateBase):
    """Task template creation schema."""
    agent_id: str


class TaskTemplateUpdate(BaseModel):
    """Task template update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[str] = None
    task_pattern: Optional[str] = None
    priority: Optional[int] = None
    steps: Optional[Dict[str, Any]] = None
    examples: Optional[Dict[str, Any]] = None
    meta_data: Optional[Dict[str, Any]] = None


class TaskTemplateInDBBase(TaskTemplateBase):
    """Task template in DB base schema."""
    id: str
    agent_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskTemplate(TaskTemplateInDBBase):
    """Task template schema."""
    pass


class PreferenceBase(BaseModel):
    """Base preference schema."""
    key: str
    value: Dict[str, Any]
    category: Optional[str] = None
    description: Optional[str] = None
    priority: int = 1
    meta_data: Optional[Dict[str, Any]] = None


class PreferenceCreate(PreferenceBase):
    """Preference creation schema."""
    agent_id: str


class PreferenceUpdate(BaseModel):
    """Preference update schema."""
    key: Optional[str] = None
    value: Optional[Dict[str, Any]] = None
    category: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    meta_data: Optional[Dict[str, Any]] = None


class PreferenceInDBBase(PreferenceBase):
    """Preference in DB base schema."""
    id: str
    agent_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Preference(PreferenceInDBBase):
    """Preference schema."""
    pass
