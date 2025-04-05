# Agent Interaction API

This document provides details on the agent interaction API endpoints.

## Interact with Agent

Send a message to an agent and receive a response.

```http
POST /api/agents/{agent_id}/interact
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "include_history": false
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | string | The message to send to the agent |
| `include_history` | boolean | Whether to include the conversation history in the context (optional, default: false) |

### Response

```json
{
  "response": "I'm doing well, thank you for asking! How can I help you today?",
  "memories": [
    {
      "id": "9b5a09ff-fec8-45a6-9882-a0c3cb648dd7",
      "agent_id": "26a29e66-1e53-4bdf-8e99-98635d64069a",
      "role": "user",
      "content": "Hello, how are you?",
      "created_at": "2023-07-01T00:00:00Z"
    },
    {
      "id": "4723dbe7-3c32-4dfb-963a-08b86263cb1f",
      "agent_id": "26a29e66-1e53-4bdf-8e99-98635d64069a",
      "role": "assistant",
      "content": "I'm doing well, thank you for asking! How can I help you today?",
      "created_at": "2023-07-01T00:00:00Z"
    }
  ]
}
```

## Provider Settings

### Get Provider Settings

Retrieve the settings for a specific provider.

```http
GET /api/settings/provider/{provider}
```

Where `{provider}` can be one of:
- `openai`
- `custom`
- `ollama`
- `openrouter`

### Response

```json
{
  "name": "Custom Provider",
  "api_key": "your-api-key",
  "api_base": null,
  "host": "https://your-llm-api-url.com/v1",
  "default_model": null,
  "models": null
}
```

### Update Provider Settings

Update the settings for a specific provider.

```http
POST /api/settings/provider/{provider}
Content-Type: application/json

{
  "name": "Custom Provider",
  "host": "https://your-llm-api-url.com/v1",
  "api_key": "your-api-key"
}
```

### Response

```json
{
  "key": "provider_custom",
  "value": {
    "host": "https://your-llm-api-url.com/v1",
    "name": "Custom Provider",
    "api_key": "your-api-key"
  },
  "description": "Settings for custom provider",
  "id": "b7aa61f9-cede-4152-9e94-670edb696e61",
  "created_at": "2025-04-05T21:39:39.942081",
  "updated_at": "2025-04-05T21:41:15.127983"
}
```

## Set Default Provider

Set the default provider for the system.

```http
POST /api/settings/default-provider/{provider}
```

Where `{provider}` can be one of:
- `openai`
- `custom`
- `ollama`
- `openrouter`

### Response

```json
{
  "key": "default_provider",
  "value": {
    "provider": "custom"
  },
  "description": "Default provider",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-04-05T21:39:39.942081",
  "updated_at": "2025-04-05T21:41:15.127983"
}
```
