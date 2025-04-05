"""
Document model.
"""

import uuid

from sqlalchemy import Column, ForeignKey, Float, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Document(Base):
    """
    Document model.
    """
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    knowledge_base_id = Column(UUID(as_uuid=True), ForeignKey("knowledgebase.id"), nullable=False)

    # Basic information
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # Metadata
    source = Column(String, nullable=True)
    source_type = Column(String, nullable=True)
    url = Column(String, nullable=True)

    # Embeddings
    embedding = Column(ARRAY(Float), nullable=True)

    # Additional metadata
    meta_data = Column(JSONB, nullable=True)

    # Relationships
    knowledge_base = relationship("KnowledgeBase", back_populates="documents")
