"""
Import all models here to ensure they are registered with SQLAlchemy.
"""

# Import base class
from app.db.base_class import Base

# Import all models
from app.db.models.agent import Agent
from app.db.models.memory import Memory
from app.db.models.workflow import Workflow
from app.db.models.knowledgebase import KnowledgeBase
from app.db.models.document import Document
from app.db.models.settings import Settings
