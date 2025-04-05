"""
API router for the Fra-Gent API server.
"""

from fastapi import APIRouter

from app.api.endpoints import agents, memories, workflows, health

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(memories.router, prefix="/agents/{agent_id}/memories", tags=["memories"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
