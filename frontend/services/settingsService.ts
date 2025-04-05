import api from './api';

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
  const response = await api.get('/settings/all');
  return response.data;
};

/**
 * Update provider settings
 */
export const updateProviderSettings = async (provider: string, settings: ProviderSettings): Promise<any> => {
  const response = await api.post(`/settings/provider/${provider}`, settings);
  return response.data;
};

/**
 * Set default provider
 */
export const setDefaultProvider = async (provider: string): Promise<any> => {
  const response = await api.post(`/settings/default-provider/${provider}`);
  return response.data;
};
