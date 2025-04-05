// Use fetch API directly for Next.js API routes

export interface ProviderSettings {
  api_key?: string;
  api_base?: string;
  default_model?: string;
  models?: Record<string, any>;
}

export interface AllSettings {
  default_provider: string;
  providers: Record<string, ProviderSettings>;
}

/**
 * Fetch all settings
 */
export const fetchSettings = async (): Promise<AllSettings> => {
  const response = await fetch('/api/settings/all');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
};

/**
 * Update provider settings
 */
export const updateProviderSettings = async (provider: string, settings: ProviderSettings): Promise<any> => {
  const response = await fetch(`/api/settings/provider/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error('Failed to update provider settings');
  }
  return response.json();
};

/**
 * Set default provider
 */
export const setDefaultProvider = async (provider: string): Promise<any> => {
  const response = await fetch(`/api/settings/default-provider/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to set default provider');
  }
  return response.json();
};
