"""
Utility functions for working with different LLM providers.
"""

import logging
import os
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core.config import settings

from langchain_community.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage
from langchain_core.outputs import LLMResult
from langchain_core.messages import BaseMessage

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    OLLAMA = "ollama"
    OPENROUTER = "openrouter"
    CUSTOM = "custom"


async def get_provider_settings_from_db(db: AsyncSession, provider: str) -> Dict[str, Any]:
    """
    Get provider settings from the database.

    Args:
        db: Database session
        provider: The provider to get settings for

    Returns:
        A dictionary of settings for the provider
    """
    try:
        # Try to get settings from the database
        setting = await crud.settings.get_by_key(db, provider)
        if setting and setting.value:
            return setting.value
    except Exception as e:
        logger.error(f"Error getting provider settings from database: {e}")

    # Fallback to environment variables
    return get_provider_settings_from_env(provider)


def get_provider_settings_from_env(provider: str) -> Dict[str, Any]:
    """
    Get provider settings from environment variables.

    Args:
        provider: The provider to get settings for

    Returns:
        A dictionary of settings for the provider
    """
    provider = provider.lower()

    if provider == LLMProvider.OPENAI:
        return {
            "api_key": settings.OPENAI_API_KEY,
            "api_base": settings.OPENAI_API_BASE,
            "default_model": settings.OPENAI_DEFAULT_MODEL,
        }
    elif provider == LLMProvider.OLLAMA:
        return {
            "api_base": settings.OLLAMA_API_BASE,
            "default_model": settings.OLLAMA_DEFAULT_MODEL,
        }
    elif provider == LLMProvider.OPENROUTER:
        return {
            "api_key": settings.OPENROUTER_API_KEY,
            "api_base": settings.OPENROUTER_API_BASE,
            "default_model": settings.OPENROUTER_DEFAULT_MODEL,
        }
    elif provider == LLMProvider.CUSTOM:
        return {
            "api_key": settings.CUSTOM_API_KEY,
            "api_base": settings.CUSTOM_API_BASE,
            "default_model": settings.CUSTOM_DEFAULT_MODEL,
        }
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


def get_provider_settings(provider: str) -> Dict[str, Any]:
    """
    Get the settings for a specific LLM provider (sync version).

    Args:
        provider: The provider to get settings for.

    Returns:
        A dictionary of settings for the provider.
    """
    return get_provider_settings_from_env(provider)


async def create_chat_model_async(
    db: AsyncSession,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> ChatOpenAI:
    """
    Create a chat model for the specified provider (async version).

    Args:
        db: Database session
        provider: The LLM provider to use. If None, uses the default provider.
        model: The model to use. If None, uses the default model for the provider.
        temperature: The temperature to use for generation.
        max_tokens: The maximum number of tokens to generate.

    Returns:
        A ChatOpenAI instance configured for the specified provider.
    """
    # Get default provider from database if not specified
    if not provider:
        try:
            default_provider_setting = await crud.settings.get_by_key(db, "default_provider")
            if default_provider_setting and default_provider_setting.value:
                provider = default_provider_setting.value.get("value", settings.DEFAULT_PROVIDER)
            else:
                provider = settings.DEFAULT_PROVIDER
        except Exception as e:
            logger.error(f"Error getting default provider from database: {e}")
            provider = settings.DEFAULT_PROVIDER

    # Get provider settings from database
    provider_settings = await get_provider_settings_from_db(db, provider)

    # Use default model if none provided
    model = model or provider_settings.get("default_model")

    return create_chat_model_with_settings(provider, model, temperature, max_tokens, provider_settings)


def create_chat_model(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> ChatOpenAI:
    """
    Create a chat model for the specified provider (sync version).

    Args:
        provider: The LLM provider to use. If None, uses the default provider.
        model: The model to use. If None, uses the default model for the provider.
        temperature: The temperature to use for generation.
        max_tokens: The maximum number of tokens to generate.

    Returns:
        A ChatOpenAI instance configured for the specified provider.
    """
    provider = provider or settings.DEFAULT_PROVIDER
    provider_settings = get_provider_settings(provider)

    model = model or provider_settings.get("default_model")

    return create_chat_model_with_settings(provider, model, temperature, max_tokens, provider_settings)


def create_chat_model_with_settings(
    provider: str,
    model: Optional[str],
    temperature: float,
    max_tokens: Optional[int],
    provider_settings: Dict[str, Any],
) -> ChatOpenAI:
    """
    Create a chat model with the given settings.

    Args:
        provider: The LLM provider to use.
        model: The model to use.
        temperature: The temperature to use for generation.
        max_tokens: The maximum number of tokens to generate.
        provider_settings: The provider settings to use.

    Returns:
        A ChatOpenAI instance configured with the given settings.
    """
    if provider == LLMProvider.OPENAI:
        try:
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                openai_api_key=provider_settings.get("api_key") or "sk-dummy-key",
                openai_api_base=provider_settings.get("api_base"),
            )
        except Exception as e:
            logger.error(f"Error creating OpenAI chat model: {e}")
            # Return a mock chat model that returns a fixed response
            return MockChatModel()
    elif provider == LLMProvider.OLLAMA:
        # For Ollama, we need to use a different approach
        from langchain_community.llms import Ollama

        return Ollama(
            model=model,
            temperature=temperature,
            base_url=provider_settings.get("api_base"),
        )
    elif provider == LLMProvider.OPENROUTER:
        # OpenRouter is compatible with OpenAI's API
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=provider_settings.get("api_key"),
            openai_api_base=provider_settings.get("api_base"),
            headers={"HTTP-Referer": "https://fra-gent.ai"},  # Required by OpenRouter
        )
    elif provider == LLMProvider.CUSTOM:
        # Custom API host (like Chutes.ai)
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=provider_settings.get("api_key"),
            openai_api_base=provider_settings.get("api_base"),
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


class MockChatModel:
    """A mock chat model that returns a fixed response."""
    def predict_messages(self, messages: List[Any]) -> str:
        """Return a fixed response."""
        return "I'm sorry, but I cannot process your request at the moment. The OpenAI API key is invalid or missing. Please contact the administrator to set up a valid API key."


def format_messages(
    system_prompt: Optional[str] = None,
    messages: Optional[List[Dict[str, str]]] = None,
) -> List[Union[SystemMessage, HumanMessage, AIMessage]]:
    """
    Format messages for the chat model.

    Args:
        system_prompt: The system prompt to use.
        messages: A list of message dictionaries with 'role' and 'content' keys.

    Returns:
        A list of LangChain message objects.
    """
    formatted_messages = []

    if system_prompt:
        formatted_messages.append(SystemMessage(content=system_prompt))

    if messages:
        for message in messages:
            role = message["role"].lower()
            content = message["content"]

            if role == "user":
                formatted_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                formatted_messages.append(AIMessage(content=content))
            elif role == "system":
                formatted_messages.append(SystemMessage(content=content))

    return formatted_messages
