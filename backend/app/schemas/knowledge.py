"""
Knowledge base schemas.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    """Base document schema."""
    knowledge_base_id: UUID
    title: str
    content: str
    chunks: Optional[Dict[str, Union[str, List[str]]]] = None


class DocumentCreate(DocumentBase):
    """Document creation schema."""
    pass


class DocumentUpdate(BaseModel):
    """Document update schema."""
    title: Optional[str] = None
    content: Optional[str] = None
    chunks: Optional[Dict[str, Union[str, List[str]]]] = None


class Document(DocumentBase):
    """Document schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""
        from_attributes = True


class KnowledgeBaseBase(BaseModel):
    """Base knowledge base schema."""
    name: str
    description: Optional[str] = None
    type: str  # document, vector, structured
    content: Optional[Dict[str, Union[str, int, float, bool, dict]]] = None
    file_path: Optional[str] = None
    embedding_model: Optional[str] = None


class KnowledgeBaseCreate(KnowledgeBaseBase):
    """Knowledge base creation schema."""
    pass


class KnowledgeBaseUpdate(BaseModel):
    """Knowledge base update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    content: Optional[Dict[str, Union[str, int, float, bool, dict]]] = None
    file_path: Optional[str] = None
    embedding_model: Optional[str] = None


class KnowledgeBase(KnowledgeBaseBase):
    """Knowledge base schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    documents: List[Document] = []

    class Config:
        """Pydantic config."""
        from_attributes = True
