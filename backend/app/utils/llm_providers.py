"""
Utility functions for working with different LLM providers.
"""

import logging
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    OLLAMA = "ollama"
    OPENROUTER = "openrouter"
    CUSTOM = "custom"


def get_provider_settings(provider: str) -> Dict[str, Any]:
    """
    Get the settings for a specific LLM provider.
    
    Args:
        provider: The provider to get settings for.
        
    Returns:
        A dictionary of settings for the provider.
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


def create_chat_model(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> ChatOpenAI:
    """
    Create a chat model for the specified provider.
    
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
    
    if provider == LLMProvider.OPENAI:
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=provider_settings["api_key"],
            openai_api_base=provider_settings["api_base"],
        )
    elif provider == LLMProvider.OLLAMA:
        # For Ollama, we need to use a different approach
        from langchain.llms import Ollama
        
        return Ollama(
            model=model,
            temperature=temperature,
            base_url=provider_settings["api_base"],
        )
    elif provider == LLMProvider.OPENROUTER:
        # OpenRouter is compatible with OpenAI's API
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=provider_settings["api_key"],
            openai_api_base=provider_settings["api_base"],
            headers={"HTTP-Referer": "https://fra-gent.ai"},  # Required by OpenRouter
        )
    elif provider == LLMProvider.CUSTOM:
        # Custom API host (like Chutes.ai)
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            openai_api_key=provider_settings["api_key"],
            openai_api_base=provider_settings["api_base"],
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


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
