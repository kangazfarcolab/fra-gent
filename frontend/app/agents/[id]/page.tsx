'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Define the agent type
interface Agent {
  id: string;
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
  integration_settings: {
    provider: string;
  };
  created_at: string;
  updated_at: string;
}

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  // State for the agent
  const [agent, setAgent] = useState<Agent | null>(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch the agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/agents/${agentId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent');
        }

        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  // Handle deleting the agent
  const handleDeleteAgent = async () => {
    if (isDeleting) {
      return; // Prevent multiple clicks
    }

    if (!confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      // Redirect to agents list
      router.push('/agents');
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
      setIsDeleting(false); // Reset deleting state on error
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-xl">Loading agent details...</div>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-xl">Agent not found</div>
        <Link href="/agents" className="text-blue-500 hover:underline mt-4">
          Back to Agents
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link href="/agents" className="text-blue-500 hover:underline">
            &larr; Back to Agents
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <div className="flex space-x-2">
            <Link
              href={`/agents/${agentId}/chat`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Chat
            </Link>
            <button
              onClick={handleDeleteAgent}
              disabled={isDeleting}
              className={`${isDeleting ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded flex items-center`}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Name</div>
                <div className="mt-1">{agent.name}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Created</div>
                <div className="mt-1">
                  {new Date(agent.created_at).toLocaleString()}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm font-medium text-gray-500">Description</div>
                <div className="mt-1">{agent.description || 'No description'}</div>
              </div>

              {agent.avatar_url && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Avatar</div>
                  <div className="mt-1">
                    <img
                      src={agent.avatar_url}
                      alt={agent.name}
                      className="w-16 h-16 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">LLM Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Provider</div>
                <div className="mt-1">{agent.integration_settings?.provider || 'openai'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Model</div>
                <div className="mt-1">{agent.model}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Temperature</div>
                <div className="mt-1">{agent.temperature}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Max Tokens</div>
                <div className="mt-1">{agent.max_tokens}</div>
              </div>
            </div>
          </div>

          {/* Personality & Behavior */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Personality & Behavior</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">System Prompt</div>
                <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                  {agent.system_prompt || 'No system prompt'}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Personality</div>
                <div className="mt-1">{agent.personality || 'Not specified'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Bio</div>
                <div className="mt-1">{agent.bio || 'No bio'}</div>
              </div>
            </div>
          </div>

          {/* Memory Configuration */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Memory Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Memory Type</div>
                <div className="mt-1">{agent.memory_type}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Memory Window</div>
                <div className="mt-1">{agent.memory_window} messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
