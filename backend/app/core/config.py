"""
Configuration settings for the Fra-Gent API server.
"""

import os
import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Project info
    PROJECT_NAME: str = "Fra-Gent"
    PROJECT_DESCRIPTION: str = "AI Agent Framework"
    VERSION: str = "0.1.0"

    # API settings
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS settings are defined directly in main.py

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "fragent"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v
        values = info.data
        return f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB') or ''}"

    # LLM Provider settings

    # Default Provider and Model
    DEFAULT_PROVIDER: str = "custom"
    DEFAULT_MODEL: str = "RekaAI/reka-flash-3"

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    OPENAI_DEFAULT_MODEL: str = "gpt-4"

    # Ollama
    OLLAMA_API_BASE: str = "http://localhost:11434"
    OLLAMA_DEFAULT_MODEL: str = "llama3"

    # OpenRouter
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_API_BASE: str = "https://openrouter.ai/api/v1"
    OPENROUTER_DEFAULT_MODEL: str = "anthropic/claude-3-opus"

    # Custom API Host
    CUSTOM_API_KEY: Optional[str] = None
    CUSTOM_API_BASE: str = "https://llm.chutes.ai/v1"
    CUSTOM_DEFAULT_MODEL: str = "RekaAI/reka-flash-3"

    # Vector database settings
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    VECTOR_SIMILARITY_METRIC: str = "cosine"  # cosine, l2, inner_product

    class Config:
        case_sensitive = True
        env_file = ".env"


# Create settings instance
settings = Settings()
