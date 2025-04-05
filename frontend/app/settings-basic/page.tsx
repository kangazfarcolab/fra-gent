'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsBasicPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [settings, setSettings] = useState({
    default_provider: 'custom',
    providers: {
      openai: { api_key: '', api_base: 'https://api.openai.com/v1', default_model: 'gpt-4' },
      custom: { api_key: '', api_base: 'https://llm.chutes.ai/v1', default_model: 'RekaAI/reka-flash-3' },
      ollama: { api_key: '', api_base: 'http://localhost:11434', default_model: 'llama2' },
    },
  });

  useEffect(() => {
    // In a real implementation, we would fetch settings from the API
    // For now, we'll just use the default values
    setLoading(false);
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

  const handleDefaultProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    setSettings({
      ...settings,
      default_provider: provider,
    });
    setNotification({ message: 'Default provider updated successfully', type: 'success' });
  };

  const handleSaveProvider = (provider: string) => {
    setLoading(true);
    // In a real implementation, we would save settings to the API
    setTimeout(() => {
      setLoading(false);
      setNotification({ message: `${provider.toUpperCase()} settings updated successfully`, type: 'success' });
    }, 1000);
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
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Home
        </Link>
      </div>
      <div className="h-px bg-gray-200 mb-6"></div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
              <h2 className="text-xl font-semibold mb-4">Custom API Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="custom-api-key">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="custom-api-key"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={settings.providers.custom?.api_key || ''}
                    onChange={(e) => handleProviderChange('custom', 'api_key', e.target.value)}
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
                    value={settings.providers.custom?.api_base || ''}
                    onChange={(e) => handleProviderChange('custom', 'api_base', e.target.value)}
                    placeholder="https://llm.chutes.ai/v1"
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
                    value={settings.providers.custom?.default_model || ''}
                    onChange={(e) => handleProviderChange('custom', 'default_model', e.target.value)}
                    placeholder="RekaAI/reka-flash-3"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                  onClick={() => handleSaveProvider('custom')}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="ml-2">Saving...</span>
                    </div>
                  ) : 'Save Custom API Settings'}
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
