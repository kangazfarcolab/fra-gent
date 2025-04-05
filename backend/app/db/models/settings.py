import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.base_class import Base


class Settings(Base):
    """Settings model for storing application settings."""

    __tablename__ = "settings"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Settings key (e.g., "openai", "custom", "default_provider")
    key = Column(String, nullable=False, unique=True, index=True)

    # Settings value (can be a string, number, boolean, or JSON object)
    value = Column(JSONB, nullable=False)

    # Description
    description = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
