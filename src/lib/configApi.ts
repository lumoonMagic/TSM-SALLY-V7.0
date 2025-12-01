/**
 * Configuration API Service
 * Handles communication with Sally TSM Backend for configuration management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'oracle' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
}

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'claude';
  api_key: string;
  model?: string;
}

export interface ConfigResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ConfigStatus {
  database: {
    connected: boolean;
    type: string | null;
    status: string;
  };
  llm: {
    configured: boolean;
    provider: string | null;
    status: string;
  };
}

/**
 * Configure database connection on the backend
 */
export async function configureDatabaseApi(config: DatabaseConfig): Promise<ConfigResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/config/database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Database configuration error:', error);
    return {
      success: false,
      message: 'Failed to configure database',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Configure LLM provider on the backend
 */
export async function configureLLMApi(config: LLMConfig): Promise<ConfigResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/config/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LLM configuration error:', error);
    return {
      success: false,
      message: 'Failed to configure LLM',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current configuration status from backend
 */
export async function getConfigStatus(): Promise<ConfigStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/config/status`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Config status error:', error);
    // Return default status if backend is unreachable
    return {
      database: {
        connected: false,
        type: null,
        status: 'not_configured',
      },
      llm: {
        configured: false,
        provider: null,
        status: 'not_configured',
      },
    };
  }
}

/**
 * Test backend health and connectivity
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
}

/**
 * Get API base URL (useful for debugging)
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
