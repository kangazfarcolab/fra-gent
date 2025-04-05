"""
Settings service for managing application settings.
"""

from typing import Any, Dict, Optional

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Settings
from app.db.session import get_db


class SettingsService:
    """Settings service for managing application settings."""

    def __init__(self, db: AsyncSession = None):
        """Initialize the settings service."""
        self.db = db

    async def get_settings(self, key: str) -> Optional[Dict[str, Any]]:
        """Get settings by key."""
        result = await self.db.execute(select(Settings).filter(Settings.key == key))
        settings = result.scalars().first()
        return settings.value if settings else None

    async def get_provider_settings(self, provider: str) -> Optional[Dict[str, Any]]:
        """Get provider settings."""
        result = await self.db.execute(
            select(Settings).filter(Settings.key == f"provider_{provider}")
        )
        settings = result.scalars().first()
        return settings.value if settings else None

    async def get_default_provider(self) -> Optional[str]:
        """Get the default provider."""
        result = await self.db.execute(
            select(Settings).filter(Settings.key == "default_provider")
        )
        settings = result.scalars().first()
        return settings.value.get("provider") if settings else None


def get_settings_service() -> SettingsService:
    """Get the settings service."""
    from app.db.session import get_db_sync
    db = get_db_sync()
    return SettingsService(db)
