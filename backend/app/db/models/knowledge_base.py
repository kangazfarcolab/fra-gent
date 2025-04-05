"""
Knowledge base model for storing agent knowledge.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class KnowledgeBase(Base):
    __tablename__ = 'knowledgebase_main'
    __table_args__ = {'extend_existing': True}
    """
    Knowledge base model for storing agent knowledge.
    """
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent.id"), nullable=False)

    # Basic information
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Knowledge type
    # - general: General knowledge about the world
    # - personal: Personal preferences and knowledge
    # - procedural: How to perform specific tasks
    # - domain: Domain-specific knowledge
    knowledge_type = Column(String, nullable=False)

    # Tags for categorizing knowledge
    tags = Column(ARRAY(String), nullable=True)

    # Priority (higher values are more important)
    priority = Column(Integer, nullable=False, default=1)

    # Content
    content = Column(Text, nullable=False)

    # Vector embedding for semantic search
    embedding = Column(ARRAY(Float), nullable=True)

    # Additional metadata
    meta_data = Column(JSONB, nullable=True)

    # Relationships
    agent = relationship("Agent", back_populates="knowledge_bases")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TaskTemplate(Base):
    """
    Task template model for storing how to handle specific tasks.
    """
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent.id"), nullable=False)

    # Basic information
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Task type (email, notification, scheduled, etc.)
    task_type = Column(String, nullable=False)

    # Task pattern (regex or keywords to match)
    task_pattern = Column(String, nullable=True)

    # Priority (higher values are more important)
    priority = Column(Integer, nullable=False, default=1)

    # Steps to handle the task
    steps = Column(JSONB, nullable=False)

    # Example inputs and outputs
    examples = Column(JSONB, nullable=True)

    # Additional metadata
    meta_data = Column(JSONB, nullable=True)

    # Relationships
    agent = relationship("Agent", back_populates="task_templates")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Preference(Base):
    """
    Preference model for storing agent preferences.
    """
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent.id"), nullable=False)

    # Preference key and value
    key = Column(String, nullable=False)
    value = Column(JSONB, nullable=False)

    # Category
    category = Column(String, nullable=True)

    # Description
    description = Column(Text, nullable=True)

    # Priority (higher values are more important)
    priority = Column(Integer, nullable=False, default=1)

    # Additional metadata
    meta_data = Column(JSONB, nullable=True)

    # Relationships
    agent = relationship("Agent", back_populates="preferences")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
