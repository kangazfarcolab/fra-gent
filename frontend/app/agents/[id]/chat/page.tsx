'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Define the message type
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Define the agent type
interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  avatar_url?: string;
}

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.id as string;

  // State for the agent
  const [agent, setAgent] = useState<Agent | null>(null);

  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);

  // State for the current message
  const [currentMessage, setCurrentMessage] = useState('');

  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  // Ref for the message container
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the agent data
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent');
        }

        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
      }
    };

    fetchAgent();
  }, [agentId]);

  // Fetch the agent's messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}/memories`);

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();

        // Convert the memories to messages
        const formattedMessages = data.map((memory: any) => ({
          id: memory.id,
          role: memory.role,
          content: memory.content,
          timestamp: new Date(memory.created_at),
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (agentId) {
      fetchMessages();
    }
  }, [agentId]);

  // Scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMessage.trim()) {
      return;
    }

    // Add the user message to the UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Send the message to the API
      const response = await fetch(`/api/agents/${agentId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          include_history: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add the assistant message to the UI
      const assistantMessage: Message = {
        id: data.memories[1].id,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      // Replace the temporary user message with the actual one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? { ...msg, id: data.memories[0].id } : msg
        ).concat(assistantMessage)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface shadow border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/agents" className="text-blue-500 dark:text-blue-400 hover:underline mr-4">
              &larr; Back to Agents
            </Link>
            {agent && (
              <div className="flex items-center">
                {agent.avatar_url && (
                  <img
                    src={agent.avatar_url}
                    alt={agent.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <h1 className="text-xl font-bold dark:text-white">{agent.name}</h1>
              </div>
            )}
          </div>
          {agent && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Model: {agent.model}
            </div>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
              disabled={isLoading || !currentMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
