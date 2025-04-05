from datetime import datetime
from typing import Any, Dict, Optional, Union

from pydantic import BaseModel, Field


class SettingsBase(BaseModel):
    """Base settings schema."""
    key: str
    value: Dict[str, Any]
    description: Optional[str] = None


class SettingsCreate(SettingsBase):
    """Settings creation schema."""
    pass


class SettingsUpdate(BaseModel):
    """Settings update schema."""
    value: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class SettingsInDBBase(SettingsBase):
    """Settings in DB base schema."""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Settings(SettingsInDBBase):
    """Settings schema."""
    pass


class ProviderSettings(BaseModel):
    """Provider settings schema."""
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    default_model: Optional[str] = None
    models: Optional[Dict[str, Dict[str, Union[str, int, float, bool]]]] = None


class AllSettings(BaseModel):
    """All settings schema."""
    default_provider: str = "openai"
    providers: Dict[str, ProviderSettings] = Field(default_factory=dict)
