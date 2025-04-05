"""
Memory database model.
"""

import uuid
from sqlalchemy import Column, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Memory(Base):
    """
    Memory database model for storing agent conversation history and vector memories.
    """
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent.id"), nullable=False)

    # Memory content
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)

    # Memory type
    # - permanent: Stored permanently in the database
    # - temporary: Stored temporarily and periodically cleaned up
    # - execution: Only relevant during task execution, not stored long-term
    memory_type = Column(String, nullable=False, default="permanent")

    # For vector memories
    embedding = Column(ARRAY(Float), nullable=True)

    # Metadata
    meta_data = Column(JSONB, default={})

    # Relationships
    agent = relationship("Agent", back_populates="memories")
