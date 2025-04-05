"""
Agent database model.
"""

from sqlalchemy import Column, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Agent(Base):
    """
    Agent database model.
    """
    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    model = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=True)
    temperature = Column(Float, nullable=False, default=0.7)
    max_tokens = Column(Integer, nullable=False, default=1000)

    # Additional fields
    personality = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    memory_type = Column(String, default="conversation")
    memory_window = Column(Integer, default=10)
    knowledge_base_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)
    integration_settings = Column(JSONB, default={})
    is_active = Column(Integer, default=1)

    # Relationships
    memories = relationship("Memory", back_populates="agent", cascade="all, delete-orphan")
    knowledge_bases = relationship("app.db.models.knowledge_base.KnowledgeBase", back_populates="agent", cascade="all, delete-orphan")
    task_templates = relationship("TaskTemplate", back_populates="agent", cascade="all, delete-orphan")
    preferences = relationship("Preference", back_populates="agent", cascade="all, delete-orphan")
