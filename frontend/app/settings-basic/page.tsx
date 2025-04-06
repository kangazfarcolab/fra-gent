'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsBasicPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [newProvider, setNewProvider] = useState({
    id: '',
    name: '',
    api_key: '',
    api_base: '',
    default_model: ''
  });
  const [settings, setSettings] = useState({
    default_provider: '',
    providers: {
      openai: { name: 'OpenAI', api_key: '', api_base: 'https://api.openai.com/v1', default_model: 'gpt-4' },
      custom: { name: 'Custom API', api_key: '', api_base: '', default_model: '' },
      ollama: { name: 'Ollama', api_key: '', api_base: 'http://localhost:11434', default_model: 'llama2' },
      openrouter: { name: 'OpenRouter', api_key: '', api_base: 'https://openrouter.ai/api/v1', default_model: 'openai/gpt-3.5-turbo' },
      anthropic: { name: 'Anthropic', api_key: '', api_base: 'https://api.anthropic.com/v1', default_model: 'claude-3-opus-20240229' },
    },
    custom_providers: [],
  });

  useEffect(() => {
    // Fetch settings from the API
    const fetchSettings = async () => {
      try {
        setLoading(true);

        try {
          // Fetch settings from the API
          // Add a cache-busting parameter to ensure we're not getting cached responses
          const defaultProviderResponse = await fetch(`/api/settings/all?_=${Date.now()}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (defaultProviderResponse.ok) {
            const data = await defaultProviderResponse.json();
            console.log('Settings data:', data); // Debug log

            // The default_provider might be a string or an object with a value property
            if (data && data.default_provider) {
              // Extract the provider value, handling both string and object formats
              let provider = data.default_provider;
              if (typeof provider === 'object' && provider.value) {
                provider = provider.value;
              }
              console.log('Default provider found:', provider);
              setSettings(prevSettings => ({
                ...prevSettings,
                default_provider: provider,
              }));
            } else {
              console.log('No default provider in response');
            }
          }
        } catch (error) {
          console.error('Error fetching default provider:', error);
        }

        try {
          // Fetch custom provider settings
          const customProviderResponse = await fetch('/api/settings/provider/custom', {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (customProviderResponse.ok) {
            const data = await customProviderResponse.json();
            if (data && data.name && data.host) {
              // Update providers
              setSettings(prevSettings => ({
                ...prevSettings,
                providers: {
                  ...prevSettings.providers,
                  custom: {
                    name: data.name,
                    api_key: data.api_key || '',
                    api_base: data.host || '',
                    default_model: data.default_model || ''
                  }
                },
                custom_providers: [
                  {
                    id: 'custom1',
                    name: data.name,
                    api_key: data.api_key || '',
                    api_base: data.host || '',
                    default_model: data.default_model || ''
                  }
                ]
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching custom provider:', error);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleProviderChange = (provider: string, field: string, value: string) => {
    setSettings({
      ...settings,
      providers: {
        ...settings.providers,
        [provider]: {
          ...settings.providers[provider],
          [field]: value,
        },
      },
    });
  };

  const handleDefaultProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;

    try {
      // Check if the provider is configured
      const providerConfig = settings.providers[provider as keyof typeof settings.providers];
      if (!providerConfig || !providerConfig.api_key) {
        setNotification({ message: `Provider ${provider} is not configured. Please configure it first.`, type: 'error' });
        return;
      }

      // Save to the API
      // Add a cache-busting parameter to ensure we're not getting cached responses
      const response = await fetch(`/api/settings/default-provider/${provider}?_=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.detail || 'Failed to update default provider');
      }

      const data = await response.json();
      console.log('Default provider updated:', data); // Debug log

      // Update local state
      setSettings({
        ...settings,
        default_provider: provider,
      });

      setNotification({ message: 'Default provider updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating default provider:', error);
      setNotification({ message: `Failed to update default provider: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
    }
  };

  const handleSaveProvider = async (provider: string) => {
    setLoading(true);
    try {
      // Prepare the data for the API
      const providerData = settings.providers[provider];

      // Call the API to save the provider settings
      const response = await fetch(`/api/settings/provider/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${provider} provider settings`);
      }

      setNotification({ message: `${provider.toUpperCase()} settings updated successfully`, type: 'success' });
    } catch (error) {
      console.error(`Error saving ${provider} provider settings:`, error);
      setNotification({ message: `Failed to save ${provider} provider settings`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <div className="h-px bg-gray-200 mb-6"></div>

      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'openai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('openai')}
            >
              OpenAI
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'anthropic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('anthropic')}
            >
              Anthropic
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'openrouter' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('openrouter')}
            >
              OpenRouter
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'custom' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('custom')}
            >
              Custom API
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'ollama' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('ollama')}
            >
              Ollama
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="default-provider">
                    Default Provider
                  </label>
                  <select
                    id="default-provider"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={settings.default_provider}
                    onChange={handleDefaultProviderChange}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">Custom API</option>
                    <option value="ollama">Ollama</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    The default provider will be used when creating new agents
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OpenAI Settings */}
          {activeTab === 'openai' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">OpenAI Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="openai-api-key">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="openai-api-key"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.openai?.api_key || ''}
                    onChange={(e) => handleProviderChange('openai', 'api_key', e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="openai-api-base">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    id="openai-api-base"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.openai?.api_base || 'https://api.openai.com/v1'}
                    onChange={(e) => handleProviderChange('openai', 'api_base', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="openai-default-model">
                    Default Model
                  </label>
                  <input
                    type="text"
                    id="openai-default-model"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.openai?.default_model || 'gpt-4'}
                    onChange={(e) => handleProviderChange('openai', 'default_model', e.target.value)}
                    placeholder="gpt-4"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                  onClick={() => handleSaveProvider('openai')}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="ml-2">Saving...</span>
                    </div>
                  ) : 'Save OpenAI Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Custom API Settings */}
          {activeTab === 'custom' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Custom API Providers</h2>

              {/* List of existing custom providers */}
              {settings.custom_providers.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-3">Your Custom Providers</h3>
                  <div className="space-y-6">
                    {settings.custom_providers.map((provider, index) => (
                      <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-semibold">{provider.name}</h4>
                          <button
                            className="text-red-600 hover:text-red-800 text-sm"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete the provider "${provider.name}"? This cannot be undone.`)) {
                                try {
                                  // Delete from the backend
                                  const response = await fetch('/api/settings/provider/custom', {
                                    method: 'DELETE',
                                  });

                                  if (!response.ok) {
                                    throw new Error('Failed to delete custom provider');
                                  }

                                  // Remove from local state
                                  const newProviders = [...settings.custom_providers];
                                  newProviders.splice(index, 1);
                                  setSettings({
                                    ...settings,
                                    custom_providers: newProviders,
                                    providers: {
                                      ...settings.providers,
                                      custom: {
                                        name: '',
                                        api_key: '',
                                        api_base: '',
                                        default_model: ''
                                      }
                                    }
                                  });
                                  setNotification({ message: `Removed provider ${provider.name}`, type: 'success' });
                                } catch (error) {
                                  console.error('Error deleting custom provider:', error);
                                  setNotification({ message: 'Failed to delete custom provider', type: 'error' });
                                }
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Provider Name</p>
                            <p className="font-medium">{provider.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">API Base URL</p>
                            <p className="font-medium">{provider.api_base}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Default Model</p>
                            <p className="font-medium">{provider.default_model}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">API Key</p>
                            <p className="font-medium">••••••••••••••••</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => {
                              // Edit provider (populate the form below)
                              setNewProvider({
                                id: provider.id,
                                name: provider.name,
                                api_key: provider.api_key,
                                api_base: provider.api_base,
                                default_model: provider.default_model
                              });
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add/Edit Custom Provider Form */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">{newProvider.id ? 'Edit Provider' : 'Add New Provider'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="custom-provider-name">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      id="custom-provider-name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                      placeholder="Custom Provider Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="custom-api-key">
                      API Key
                    </label>
                    <input
                      type="password"
                      id="custom-api-key"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newProvider.api_key}
                      onChange={(e) => setNewProvider({...newProvider, api_key: e.target.value})}
                      placeholder="Your API key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="custom-api-base">
                      API Base URL
                    </label>
                    <input
                      type="text"
                      id="custom-api-base"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newProvider.api_base}
                      onChange={(e) => setNewProvider({...newProvider, api_base: e.target.value})}
                      placeholder="https://your-api-url.com/v1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="custom-default-model">
                      Default Model
                    </label>
                    <input
                      type="text"
                      id="custom-default-model"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newProvider.default_model}
                      onChange={(e) => setNewProvider({...newProvider, default_model: e.target.value})}
                      placeholder="your-model-name"
                    />
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    className={`px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading || !newProvider.name || !newProvider.api_base}
                    onClick={() => {
                      setLoading(true);

                      // Save to the API
                      const saveCustomProvider = async () => {
                        try {
                          // Prepare the data for the API
                          const providerData = {
                            name: newProvider.name,
                            api_key: newProvider.api_key,
                            host: newProvider.api_base,
                            default_model: newProvider.default_model
                          };

                          // Call the API to save the provider settings
                          const response = await fetch('/api/settings/provider/custom', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(providerData),
                          });

                          if (!response.ok) {
                            throw new Error('Failed to save custom provider settings');
                          }

                          // Get the updated settings
                          const data = await response.json();

                          // Update the UI
                          setNotification({ message: `Saved provider ${newProvider.name}`, type: 'success' });

                          // Reset form
                          setNewProvider({
                            id: '',
                            name: '',
                            api_key: '',
                            api_base: '',
                            default_model: ''
                          });

                          // Refresh the custom providers list
                          const customProvider = {
                            id: 'custom1',
                            name: providerData.name,
                            api_key: providerData.api_key,
                            api_base: providerData.host,
                            default_model: providerData.default_model
                          };

                          setSettings({
                            ...settings,
                            providers: {
                              ...settings.providers,
                              custom: {
                                name: providerData.name,
                                api_key: providerData.api_key,
                                api_base: providerData.host,
                                default_model: providerData.default_model
                              }
                            },
                            custom_providers: [customProvider]
                          });
                        } catch (error) {
                          console.error('Error saving custom provider:', error);
                          setNotification({ message: 'Failed to save custom provider settings', type: 'error' });
                        } finally {
                          setLoading(false);
                        }
                      };

                      saveCustomProvider();
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span className="ml-2">Saving...</span>
                      </div>
                    ) : newProvider.id ? 'Update Provider' : 'Add Provider'}
                  </button>

                  {newProvider.id && (
                    <button
                      className="px-4 py-2 rounded-md font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        // Reset form
                        setNewProvider({
                          id: '',
                          name: '',
                          api_key: '',
                          api_base: '',
                          default_model: ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Anthropic Settings */}
          {activeTab === 'anthropic' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Anthropic Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="anthropic-api-key">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="anthropic-api-key"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.anthropic?.api_key || ''}
                    onChange={(e) => handleProviderChange('anthropic', 'api_key', e.target.value)}
                    placeholder="sk-ant-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="anthropic-api-base">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    id="anthropic-api-base"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.anthropic?.api_base || 'https://api.anthropic.com/v1'}
                    onChange={(e) => handleProviderChange('anthropic', 'api_base', e.target.value)}
                    placeholder="https://api.anthropic.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="anthropic-default-model">
                    Default Model
                  </label>
                  <input
                    type="text"
                    id="anthropic-default-model"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.anthropic?.default_model || 'claude-3-opus-20240229'}
                    onChange={(e) => handleProviderChange('anthropic', 'default_model', e.target.value)}
                    placeholder="claude-3-opus-20240229"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => handleSaveProvider('anthropic')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* OpenRouter Settings */}
          {activeTab === 'openrouter' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">OpenRouter Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="openrouter-api-key">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="openrouter-api-key"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.openrouter?.api_key || ''}
                    onChange={(e) => handleProviderChange('openrouter', 'api_key', e.target.value)}
                    placeholder="sk-or-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="openrouter-api-base">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    id="openrouter-api-base"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.openrouter?.api_base || 'https://openrouter.ai/api/v1'}
                    onChange={(e) => handleProviderChange('openrouter', 'api_base', e.target.value)}
                    placeholder="https://openrouter.ai/api/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="openrouter-default-model">
                    Default Model
                  </label>
                  <input
                    type="text"
                    id="openrouter-default-model"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.openrouter?.default_model || 'openai/gpt-3.5-turbo'}
                    onChange={(e) => handleProviderChange('openrouter', 'default_model', e.target.value)}
                    placeholder="openai/gpt-3.5-turbo"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => handleSaveProvider('openrouter')}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Ollama Settings */}
          {activeTab === 'ollama' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Ollama Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ollama-api-base">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    id="ollama-api-base"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.ollama?.api_base || 'http://localhost:11434'}
                    onChange={(e) => handleProviderChange('ollama', 'api_base', e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ollama-default-model">
                    Default Model
                  </label>
                  <input
                    type="text"
                    id="ollama-default-model"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.ollama?.default_model || 'llama2'}
                    onChange={(e) => handleProviderChange('ollama', 'default_model', e.target.value)}
                    placeholder="llama2"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                  onClick={() => handleSaveProvider('ollama')}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="ml-2">Saving...</span>
                    </div>
                  ) : 'Save Ollama Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
