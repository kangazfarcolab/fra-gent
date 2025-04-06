"""
API router for the Fra-Gent API server.
"""

from fastapi import APIRouter

from app.api.endpoints import (
    agents,
    interactions,
    memories,
    workflow_test,  # Use our test workflow implementation
    workflow_execution,  # Add workflow execution endpoint
    health,
    settings,
    knowledge_bases,
    task_templates,
    preferences,
    events,
    memory_management,
)

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(memories.router, prefix="/agents/{agent_id}/memories", tags=["memories"])
api_router.include_router(interactions.router, prefix="/agents/{agent_id}/interact", tags=["interactions"])
api_router.include_router(events.router, prefix="/agents/{agent_id}/events", tags=["events"])
api_router.include_router(memory_management.router, prefix="/memory", tags=["memory-management"])
api_router.include_router(workflow_test.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(workflow_execution.router, prefix="/workflows", tags=["workflow-execution"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(knowledge_bases.router, prefix="/knowledge-bases", tags=["knowledge-bases"])
api_router.include_router(task_templates.router, prefix="/task-templates", tags=["task-templates"])
api_router.include_router(preferences.router, prefix="/preferences", tags=["preferences"])
