'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// import api from '../../../services/api';

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

export default function CreateAgentPage() {
  const router = useRouter();

  // State for custom providers
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);

  // Initialize form state
  const [formState, setFormState] = useState<AgentFormState>({
    name: '',
    description: '',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: 'You are a helpful AI assistant.',
    personality: 'helpful',
    bio: '',
    avatar_url: '',
    memory_type: 'conversation',
    memory_window: 10,
    provider: '', // This will be updated from settings
  });

  // Fetch default provider from settings
  useEffect(() => {
    const fetchDefaultProvider = async () => {
      try {
        // First, log the initial state
        console.log('Initial provider state:', formState.provider);

        // Add a cache-busting parameter to ensure we're not getting cached responses
        const response = await fetch(`/api/settings/all?_=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Settings data:', data); // Debug log

          // The default_provider might be a string or an object with a value property
          if (data && data.default_provider) {
            // Extract the provider value, handling both string and object formats
            let provider = data.default_provider;
            if (typeof provider === 'object' && provider.value) {
              provider = provider.value;
            }
            console.log('Default provider found:', provider); // Debug log

            // Only update if it's a valid provider
            if (provider && provider !== '' &&
                ['openai', 'anthropic', 'openrouter', 'ollama', 'custom'].includes(provider)) {

              setFormState(prevState => {
                const newState = {
                  ...prevState,
                  provider: provider,
                  // Set default model based on provider
                  model: getDefaultModelForProvider(provider)
                };
                console.log('Updated form state:', newState);
                return newState;
              });
            } else {
              console.log('Invalid provider value:', provider);
            }
          } else {
            console.log('No default provider found in settings data');
          }
        } else {
          console.log('Failed to fetch settings, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching default provider:', error);
      }
    };

    fetchDefaultProvider();
  }, []);

  // Helper function to get default model for a provider
  const getDefaultModelForProvider = (provider: string): string => {
    switch (provider) {
      case 'openai':
        return 'gpt-4';
      case 'anthropic':
        return 'claude-3-opus-20240229';
      case 'openrouter':
        return 'openai/gpt-3.5-turbo';
      case 'ollama':
        return 'llama2';
      case 'custom':
        return '';
      default:
        return 'gpt-4';
    }
  };

  // Load custom providers from settings
  useEffect(() => {
    // Fetch custom providers from the API
    const fetchCustomProviders = async () => {
      try {
        const response = await fetch('/api/settings/provider/custom');
        if (response.ok) {
          const data = await response.json();
          // Transform the data into the format we need
          const provider = data; // The response is the provider settings

          // Only create a provider object if we have valid data
          if (provider && provider.name && provider.host) {
            const customProvider = {
              id: 'custom1',
              name: provider.name,
              api_key: provider.api_key || '',
              api_base: provider.host || provider.api_base || '',
              default_model: provider.default_model || ''
            };

            setCustomProviders([customProvider]);
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
  }, []);

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
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create agent' }));
        throw new Error(errorData.error || 'Failed to create agent');
      }

      const data = await response.json().catch(() => ({}));

      // Navigate back to the agents page
      router.push('/agents');
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(error instanceof Error ? error.message : 'Failed to create agent. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link href="/agents" className="text-blue-500 hover:underline">
            &larr; Back to Agents
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Create New Agent</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name *
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
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    rows={3}
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

            {/* Personality & Behavior */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Personality & Behavior</h2>
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
                  <input
                    type="text"
                    id="personality"
                    name="personality"
                    value={formState.personality}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    e.g., helpful, creative, analytical
                  </p>
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
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Backstory or character description
                  </p>
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
                    <option value="vector">Vector</option>
                    <option value="hybrid">Hybrid</option>
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
                  <p className="mt-1 text-sm text-gray-500">
                    Number of messages to remember
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Create Agent
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
