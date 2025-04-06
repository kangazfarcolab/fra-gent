from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import get_db
from app.schemas.settings import AllSettings, ProviderSettings, Settings, SettingsCreate, SettingsUpdate

router = APIRouter()


@router.get("/", response_model=List[Settings])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all settings."""
    settings = await crud.settings.get_multi(db, skip=skip, limit=limit)
    return settings


@router.get("/all", response_model=AllSettings)
async def get_all_settings(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get all settings in a structured format."""
    # Get default provider
    default_provider_setting = await crud.settings.get_by_key(db, "default_provider")
    default_provider = default_provider_setting.value["value"] if default_provider_setting else "openai"

    # Get all provider settings
    providers = {}
    provider_keys = ["openai", "custom", "ollama", "openrouter", "anthropic"]

    for key in provider_keys:
        provider_setting = await crud.settings.get_by_key(db, f"provider_{key}")
        if provider_setting:
            providers[key] = ProviderSettings(**provider_setting.value)

    return AllSettings(
        default_provider=default_provider,
        providers=providers,
    )


@router.post("/", response_model=Settings)
async def create_setting(
    setting_in: SettingsCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new setting."""
    # Check if setting with this key already exists
    existing_setting = await crud.settings.get_by_key(db, setting_in.key)
    if existing_setting:
        raise HTTPException(
            status_code=400,
            detail=f"Setting with key {setting_in.key} already exists",
        )

    return await crud.settings.create(db, setting_in)


@router.put("/{key}", response_model=Settings)
async def update_setting(
    key: str,
    setting_in: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update a setting."""
    setting = await crud.settings.get_by_key(db, key)
    if not setting:
        raise HTTPException(
            status_code=404,
            detail=f"Setting with key {key} not found",
        )

    return await crud.settings.update(db, setting, setting_in)


@router.get("/{key}", response_model=Settings)
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get a setting by key."""
    setting = await crud.settings.get_by_key(db, key)
    if not setting:
        raise HTTPException(
            status_code=404,
            detail=f"Setting with key {key} not found",
        )

    return setting


@router.delete("/{key}", response_model=Settings)
async def delete_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Delete a setting."""
    setting = await crud.settings.get_by_key(db, key)
    if not setting:
        raise HTTPException(
            status_code=404,
            detail=f"Setting with key {key} not found",
        )

    return await crud.settings.delete(db, setting.id)


@router.post("/provider/{provider}", response_model=Settings)
async def update_provider_settings(
    provider: str,
    settings: ProviderSettings,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update provider settings."""
    if provider not in ["openai", "custom", "ollama", "openrouter", "anthropic"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider: {provider}",
        )

    # Convert to dict for storage
    settings_dict = settings.model_dump(exclude_none=True)

    # Upsert the settings
    return await crud.settings.upsert(
        db,
        key=f"provider_{provider}",
        value=settings_dict,
        description=f"Settings for {provider} provider",
    )


@router.get("/provider/{provider}", response_model=ProviderSettings)
async def get_provider_settings(
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get provider settings."""
    if provider not in ["openai", "custom", "ollama", "openrouter", "anthropic"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider: {provider}",
        )

    # Get the settings
    setting = await crud.settings.get_by_key(db, f"provider_{provider}")
    if not setting:
        raise HTTPException(
            status_code=404,
            detail=f"Settings for provider {provider} not found",
        )

    # Return the settings
    return setting.value


@router.delete("/provider/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider_settings(
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete provider settings."""
    if provider not in ["openai", "custom", "ollama", "openrouter", "anthropic"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider: {provider}",
        )

    # Get the settings
    setting = await crud.settings.get_by_key(db, f"provider_{provider}")
    if not setting:
        raise HTTPException(
            status_code=404,
            detail=f"Settings for provider {provider} not found",
        )

    # Delete the settings
    await db.delete(setting)
    await db.commit()

    return None


@router.post("/default-provider/{provider}", response_model=Settings)
async def set_default_provider(
    provider: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Set the default provider."""
    if provider not in ["openai", "custom", "ollama", "openrouter", "anthropic"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider: {provider}",
        )

    # Check if provider settings exist
    provider_settings = await crud.settings.get_by_key(db, f"provider_{provider}")
    if not provider_settings:
        raise HTTPException(
            status_code=400,
            detail=f"Provider {provider} is not configured",
        )

    # Upsert the default provider setting
    return await crud.settings.upsert(
        db,
        key="default_provider",
        value={"value": provider},
        description="Default LLM provider",
    )
