"""
Association tables for many-to-many relationships.
"""

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

# Association table for agents and knowledge bases
agent_knowledge_base = Table(
    "agent_knowledge_base",
    Base.metadata,
    Column("agent_id", UUID(as_uuid=True), ForeignKey("agent.id"), primary_key=True),
    Column("knowledge_base_id", UUID(as_uuid=True), ForeignKey("knowledgebase.id"), primary_key=True),
)
