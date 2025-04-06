'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Define the form state type
interface AgentFormState {
  name: string;
  description: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  personality: string;
  bio: string;
  avatar_url: string;
  memory_type: string;
  memory_window: number;
  provider: string;
  custom_provider_id?: string;
}

interface CustomProvider {
  id: string;
  name: string;
  api_key: string;
  api_base: string;
  default_model: string;
}

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  
  // State for custom providers
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize form state
  const [formState, setFormState] = useState<AgentFormState>({
    name: '',
    description: '',
    model: '',
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: '',
    personality: '',
    bio: '',
    avatar_url: '',
    memory_type: 'conversation',
    memory_window: 10,
    provider: 'openai',
    custom_provider_id: '',
  });

  // Load agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/agents/${agentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch agent');
        }
        
        const agent = await response.json();
        
        // Determine provider from integration_settings
        let provider = 'openai';
        let customProviderId = '';
        
        if (agent.integration_settings && agent.integration_settings.provider) {
          provider = agent.integration_settings.provider;
          
          // If it's a custom provider, we'll need to find the matching provider in our list
          if (provider === 'custom' && agent.integration_settings.custom_provider_name) {
            // We'll set this later when we load custom providers
            customProviderId = 'custom1'; // Default ID
          }
        }
        
        // Update form state with agent data
        setFormState({
          name: agent.name || '',
          description: agent.description || '',
          model: agent.model || '',
          temperature: agent.temperature || 0.7,
          max_tokens: agent.max_tokens || 1000,
          system_prompt: agent.system_prompt || '',
          personality: agent.personality || '',
          bio: agent.bio || '',
          avatar_url: agent.avatar_url || '',
          memory_type: agent.memory_type || 'conversation',
          memory_window: agent.memory_window || 10,
          provider: provider,
          custom_provider_id: customProviderId,
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching agent:', error);
        alert('Failed to load agent data. Please try again.');
        router.push('/agents');
      }
    };
    
    fetchAgent();
  }, [agentId, router]);

  // Load custom providers
  useEffect(() => {
    // Fetch custom providers from the API
    const fetchCustomProviders = async () => {
      try {
        const response = await fetch('/api/settings/provider/custom');
        if (response.ok) {
          const data = await response.json();
          // Transform the data into the format we need
          if (data && data.name && data.host) {
            // Only create a provider object if we have valid data
            const customProvider = {
              id: 'custom1',
              name: data.name,
              api_key: data.api_key || '',
              api_base: data.host || data.api_base || '',
              default_model: data.default_model || ''
            };
            
            setCustomProviders([customProvider]);
            
            // If our agent is using a custom provider, update the custom_provider_id
            if (formState.provider === 'custom') {
              setFormState(prev => ({
                ...prev,
                custom_provider_id: 'custom1'
              }));
            }
          } else {
            // No valid custom provider found
            setCustomProviders([]);
          }
        } else {
          // No custom provider settings found
          setCustomProviders([]);
        }
      } catch (error) {
        console.error('Error fetching custom providers:', error);
        // No custom provider available
        setCustomProviders([]);
      }
    };

    fetchCustomProviders();
  }, [formState.provider]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle provider change specially
    if (name === 'provider') {
      // Set default model based on provider
      let defaultModel = '';
      if (value === 'openai') {
        defaultModel = 'gpt-4';
      } else if (value === 'anthropic') {
        defaultModel = 'claude-3-opus-20240229';
      } else if (value === 'openrouter') {
        defaultModel = 'openai/gpt-3.5-turbo';
      } else if (value === 'ollama') {
        defaultModel = 'llama2';
      } else if (value === 'custom') {
        // For custom provider, we'll leave it empty and let the user select
        defaultModel = '';
        // Also reset the custom_provider_id
        setFormState({
          ...formState,
          provider: value,
          model: defaultModel,
          custom_provider_id: '',
        });
        return;
      }
      
      setFormState({
        ...formState,
        provider: value,
        model: defaultModel,
      });
      return;
    }

    // Handle custom provider selection
    if (name === 'custom_provider_id' && value) {
      const selectedProvider = customProviders.find(p => p.id === value);
      if (selectedProvider && selectedProvider.default_model) {
        setFormState({
          ...formState,
          custom_provider_id: value,
          model: selectedProvider.default_model,
        });
        return;
      }
    }

    // Convert numeric values
    if (name === 'temperature' || name === 'max_tokens' || name === 'memory_window') {
      setFormState({
        ...formState,
        [name]: parseFloat(value),
      });
    } else {
      setFormState({
        ...formState,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare the agent data
      let integrationSettings: any = {
        provider: formState.provider,
      };

      // If using a custom provider, add the custom provider details
      if (formState.provider === 'custom' && formState.custom_provider_id) {
        const customProvider = customProviders.find(p => p.id === formState.custom_provider_id);
        if (customProvider) {
          integrationSettings = {
            provider: 'custom',
            api_key: customProvider.api_key,
            api_base: customProvider.api_base,
            custom_provider_name: customProvider.name,
          };

          // Use the custom provider's default model if none is specified
          if (!formState.model || formState.model === 'gpt-4') {
            formState.model = customProvider.default_model;
          }
        }
      }

      const agentData = {
        ...formState,
        integration_settings: integrationSettings,
      };

      // Remove the provider and custom_provider_id fields as they're now in integration_settings
      delete (agentData as any).provider;
      delete (agentData as any).custom_provider_id;

      // Send the data to the API
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update agent' }));
        throw new Error(errorData.error || 'Failed to update agent');
      }

      const data = await response.json().catch(() => ({}));

      // Navigate back to the agent details page
      router.push(`/agents/${agentId}`);
    } catch (error) {
      console.error('Error updating agent:', error);
      alert(error instanceof Error ? error.message : 'Failed to update agent. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-bold mb-6">Edit Agent</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Agent</h1>
          <Link href={`/agents/${agentId}`} className="text-blue-500 hover:underline">
            Cancel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Personality */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Personality</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700">
                  System Prompt
                </label>
                <textarea
                  id="system_prompt"
                  name="system_prompt"
                  value={formState.system_prompt}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="personality" className="block text-sm font-medium text-gray-700">
                  Personality
                </label>
                <textarea
                  id="personality"
                  name="personality"
                  value={formState.personality}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formState.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
                  Avatar URL
                </label>
                <input
                  type="text"
                  id="avatar_url"
                  name="avatar_url"
                  value={formState.avatar_url}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* LLM Configuration */}
          <div>
            <h2 className="text-xl font-semibold mb-4">LLM Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                  Provider
                </label>
                <select
                  id="provider"
                  name="provider"
                  value={formState.provider}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="ollama">Ollama</option>
                  <option value="custom">Custom API</option>
                </select>
              </div>

              {formState.provider === 'custom' && (
                <div>
                  <label htmlFor="custom_provider_id" className="block text-sm font-medium text-gray-700">
                    Custom Provider
                  </label>
                  {customProviders.length > 0 ? (
                    <>
                      <select
                        id="custom_provider_id"
                        name="custom_provider_id"
                        value={formState.custom_provider_id || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select a custom provider</option>
                        {customProviders.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name} ({provider.api_base})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        <Link href="/settings-basic" className="text-blue-500 hover:underline">
                          Manage custom providers
                        </Link>
                      </p>
                    </>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm text-red-500 mb-2">No custom providers configured.</p>
                      <Link href="/settings-basic" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 inline-block">
                        Add Custom Provider
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formState.model}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature
                </label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  value={formState.temperature}
                  onChange={handleInputChange}
                  min="0"
                  max="2"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-700">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="max_tokens"
                  name="max_tokens"
                  value={formState.max_tokens}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Memory Configuration */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Memory Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="memory_type" className="block text-sm font-medium text-gray-700">
                  Memory Type
                </label>
                <select
                  id="memory_type"
                  name="memory_type"
                  value={formState.memory_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="conversation">Conversation</option>
                  <option value="summarization">Summarization</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label htmlFor="memory_window" className="block text-sm font-medium text-gray-700">
                  Memory Window
                </label>
                <input
                  type="number"
                  id="memory_window"
                  name="memory_window"
                  value={formState.memory_window}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/agents/${agentId}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
