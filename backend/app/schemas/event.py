"""
Event schemas.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EventTrigger(BaseModel):
    """Event trigger schema."""
    type: str = Field(..., description="Type of event (email, notification, scheduled, etc.)")
    source: str = Field(..., description="Source of the event")
    content: str = Field(..., description="Content of the event")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the event")


class EventResponse(BaseModel):
    """Event response schema."""
    response: str = Field(..., description="Agent's response to the event")
    event_id: str = Field(..., description="ID of the event memory")
    response_id: str = Field(..., description="ID of the response memory")
    context: Dict[str, Any] = Field(..., description="Context used to generate the response")
