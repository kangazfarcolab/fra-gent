# Changelog

## April 5, 2025

### Fixed Issues

#### Agent Management
- Fixed the delete agent button functionality
  - Updated the delete_agent endpoint to use raw SQL queries to delete memories and the agent
  - Added proper error handling for the delete operation
  - Fixed issues with the KnowledgeBase model that was causing conflicts

#### Chat Functionality
- Fixed the chat functionality with custom LLM providers
  - Created the interact_with_agent endpoint to handle chat interactions
  - Implemented the LLM service to generate responses from language models
  - Added proper error handling for the chat functionality
  - Created the necessary API routes for agent interaction

#### Provider Settings Management
- Added a GET endpoint for retrieving provider settings
- Fixed the key format for provider settings to use "provider_{provider}" format
- Updated the provider settings schema to include the host field for custom providers
- Improved error handling for provider settings

#### Frontend Connectivity
- Fixed connectivity issues between frontend and backend in Docker environment
  - Updated API URL in frontend to use the backend service name instead of localhost
  - Fixed issues with the API routes in the frontend

### Technical Details

#### Backend Changes
- Updated the agent deletion process to handle memory deletion properly
- Added a new interact endpoint for agent chat functionality
- Implemented the LLM service for generating responses
- Fixed issues with the database models
- Added proper error handling for API endpoints

#### Frontend Changes
- Updated API routes to use the backend service name
- Fixed connectivity issues between frontend and backend

### Usage

#### Custom LLM Provider Setup
1. Set up the custom provider settings:
   ```bash
   curl -X POST http://localhost:8000/api/settings/provider/custom -H "Content-Type: application/json" -d '{"name":"Custom Provider","host":"https://your-llm-api-url.com/v1","api_key":"your-api-key"}'
   ```

2. Create an agent with the custom provider:
   ```bash
   curl -X POST http://localhost:8000/api/agents -H "Content-Type: application/json" -d '{"name":"Custom Agent","description":"An agent using a custom LLM provider","provider":"custom","model":"your-model-name","integration_settings":{"provider":"custom"}}'
   ```

3. Chat with the agent:
   ```bash
   curl -X POST http://localhost:8000/api/agents/{agent_id}/interact -H "Content-Type: application/json" -d '{"message":"Hello, how are you?"}'
   ```

#### Agent Deletion
To delete an agent:
```bash
curl -X DELETE http://localhost:8000/api/agents/{agent_id}
```

### Known Issues
- The pgvector extension is not enabled, which may affect vector search functionality
- Memory retrieval for chat history is not fully implemented
