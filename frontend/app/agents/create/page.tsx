'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
}

export default function CreateAgentPage() {
  const router = useRouter();
  
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
    provider: 'openai',
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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
      const agentData = {
        ...formState,
        integration_settings: {
          provider: formState.provider,
        },
      };
      
      // Remove the provider field as it's now in integration_settings
      delete (agentData as any).provider;
      
      // Send the data to the API
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create agent');
      }
      
      // Navigate back to the agents page
      router.push('/agents');
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
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
                    <option value="ollama">Ollama</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
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
