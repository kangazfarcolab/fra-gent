"""
Knowledge base model.
"""

import uuid

from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class KnowledgeBase(Base):
    """
    Knowledge base model.
    """
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic information
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration
    embedding_model = Column(String, nullable=True)
    chunk_size = Column(String, nullable=True)
    chunk_overlap = Column(String, nullable=True)
    
    # Additional settings
    settings = Column(JSONB, nullable=True)
    
    # Relationships
    documents = relationship("Document", back_populates="knowledge_base", cascade="all, delete-orphan")
