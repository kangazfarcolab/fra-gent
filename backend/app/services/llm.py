"""
LLM service for interacting with language models.
"""

import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import Depends

from app.db.models import Agent
from app.services.settings import get_settings_service


class LLMService:
    """LLM service for interacting with language models."""

    def __init__(self, settings_service=None):
        """Initialize the LLM service."""
        self.settings_service = settings_service

    async def generate_response(
        self, agent: Agent, message: str, include_history: bool = False
    ) -> str:
        """Generate a response from the LLM."""
        # Get the provider settings
        provider = agent.integration_settings.get("provider", "custom")

        # Get provider settings from the database
        from app.db.session import async_session
        from sqlalchemy import select
        from app.db.models import Settings

        # Create a new session
        async with async_session() as db:
            # Get the provider settings
            result = await db.execute(
                select(Settings).filter(Settings.key == f"provider_{provider}")
            )
            settings = result.scalars().first()
            provider_settings = settings.value if settings else None

        if not provider_settings:
            return "Error: Provider settings not found."

        # Get the model
        model = agent.model

        # Get the API key
        api_key = provider_settings.get("api_key", "")

        # Get the host URL
        host = provider_settings.get("host", "")

        if not host:
            return "Error: Host URL not found in provider settings."

        # Prepare the messages
        messages = []

        # Add system message if available
        if agent.system_prompt:
            messages.append({
                "role": "system",
                "content": agent.system_prompt
            })

        # Add user message
        messages.append({
            "role": "user",
            "content": message
        })

        # Prepare the request payload
        payload = {
            "model": model,
            "messages": messages,
            "temperature": agent.temperature,
            "max_tokens": agent.max_tokens
        }

        try:
            # Make the API request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{host}/chat/completions",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    timeout=60.0
                )

                # Check if the request was successful
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    return f"Error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error: {str(e)}"


def get_llm_service() -> LLMService:
    """Get the LLM service."""
    settings_service = get_settings_service()
    return LLMService(settings_service)
