"""
API router for the Fra-Gent API server.
"""

from fastapi import APIRouter

from app.api.endpoints import (
    agents,
    interactions,
    memories,
    workflows,
    health,
    settings,
    knowledge_bases,
    task_templates,
    preferences,
    events,
)

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(memories.router, prefix="/agents/{agent_id}/memories", tags=["memories"])
api_router.include_router(interactions.router, prefix="/agents/{agent_id}/interact", tags=["interactions"])
api_router.include_router(events.router, prefix="/agents/{agent_id}/events", tags=["events"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(knowledge_bases.router, prefix="/knowledge-bases", tags=["knowledge-bases"])
api_router.include_router(task_templates.router, prefix="/task-templates", tags=["task-templates"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["preferences"])
