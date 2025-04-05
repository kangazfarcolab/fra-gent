"""
Knowledge base database model.
"""

import uuid
from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class DocumentKnowledgeBase(Base):
    __tablename__ = 'document_knowledgebase'
    __table_args__ = {'extend_existing': True}
    """
    Knowledge base database model for storing agent knowledge sources.
    """
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Knowledge type
    type = Column(String, nullable=False)  # document, vector, structured

    # Content
    content = Column(JSONB, nullable=True)  # For structured data
    file_path = Column(String, nullable=True)  # For document references

    # Vector search settings
    embedding_model = Column(String, nullable=True)

    # Relationships
    documents = relationship(
        "KnowledgeDocument",
        back_populates="knowledge_base",
        cascade="all, delete-orphan"
    )


class KnowledgeDocument(Base):
    __table_args__ = {'extend_existing': True}
    """
    Document database model for storing knowledge base documents.
    """
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    knowledge_base_id = Column(UUID(as_uuid=True), ForeignKey("document_knowledgebase.id"), nullable=False)

    # Document info
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # For vector search
    chunks = Column(JSONB, nullable=True)

    # Relationships
    knowledge_base = relationship(
        "DocumentKnowledgeBase",
        back_populates="documents"
    )
