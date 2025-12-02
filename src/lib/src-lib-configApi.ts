/**
 * Configuration API Service
 * Complete API layer for Sally TSM backend communication
 * Version: 2.0.0
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

// ==================== TYPE DEFINITIONS ====================

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  api_key?: string;
  model?: string;
}

export interface ConfigStatus {
  database: {
    connected: boolean;
    type: string;
    status: string;
  };
  llm: {
    configured: boolean;
    provider: string;
    status: string;
  };
}

export interface SchemaDeploymentResult {
  success: boolean;
  message: string;
  tables_created?: number;
  indexes_created?: number;
  sample_records?: number;
  execution_time_seconds?: number;
  errors?: string[];
}

export interface VectorDBSetupResult {
  success: boolean;
  message: string;
  extension_enabled?: boolean;
  tables_created?: string[];
  indexes_created?: number;
}

// ==================== HELPER FUNCTION ====================

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }
  return response.json();
}

// ==================== DATABASE CONFIGURATION ====================

/**
 * Configure database connection via backend API
 */
export async function configureDatabaseApi(config: DatabaseConfig): Promise<any> {
  try {
    console.log('📡 Sending database config to backend:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/config/database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      })
    });

    const result = await handleApiResponse(response);
    console.log('✅ Database config response:', result);
    return result;
  } catch (error) {
    console.error('❌ Database config error:', error);
    throw error;
  }
}

/**
 * Test database connection via backend API
 */
export async function testDatabaseConnection(config: DatabaseConfig): Promise<any> {
  try {
    console.log('🔍 Testing database connection');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/settings/database/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database_type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Database test error:', error);
    throw error;
  }
}

// ==================== SCHEMA MANAGEMENT ====================

/**
 * Deploy default database schema
 */
export async function deployDefaultSchema(
  config: DatabaseConfig, 
  includeSampleData: boolean = true
): Promise<SchemaDeploymentResult> {
  try {
    console.log('🚀 Deploying default schema');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/database/deploy-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database_type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        include_sample_data: includeSampleData
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Schema deployment error:', error);
    throw error;
  }
}

/**
 * Get default schema SQL for download
 */
export async function getDefaultSchema(): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/database/schema/default`);
  if (!response.ok) {
    throw new Error(`Failed to download schema: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Deploy custom schema
 */
export async function deployCustomSchema(
  config: DatabaseConfig, 
  schemaSql: string
): Promise<SchemaDeploymentResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/database/deploy-custom-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database_type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        schema_sql: schemaSql
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Custom schema deployment error:', error);
    throw error;
  }
}

/**
 * Get current database schema
 */
export async function getCurrentSchema(config: DatabaseConfig): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/database/schema/current`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database_type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Get schema error:', error);
    throw error;
  }
}

/**
 * Validate schema deployment
 */
export async function validateSchema(config: DatabaseConfig): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/database/validate-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database_type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Schema validation error:', error);
    throw error;
  }
}

// ==================== VECTOR DATABASE (PGVECTOR) ====================

/**
 * Setup PGVector extension and tables
 */
export async function setupVectorDB(config: DatabaseConfig): Promise<VectorDBSetupResult> {
  try {
    console.log('🔧 Setting up PGVector');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/vectordb/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ VectorDB setup error:', error);
    throw error;
  }
}

/**
 * Test vector database
 */
export async function testVectorDB(testQuery: string = 'test query'): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/vectordb/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ VectorDB test error:', error);
    throw error;
  }
}

/**
 * Ingest documents into vector database
 */
export async function ingestDocuments(documents: Array<{ content: string; metadata: any }>): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/vectordb/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Document ingestion error:', error);
    throw error;
  }
}

// ==================== LLM CONFIGURATION ====================

/**
 * Configure LLM provider via backend API
 */
export async function configureLLMApi(config: LLMConfig): Promise<any> {
  try {
    console.log('📡 Sending LLM config to backend:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/config/llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        api_key: config.api_key,
        model: config.model
      })
    });

    const result = await handleApiResponse(response);
    console.log('✅ LLM config response:', result);
    return result;
  } catch (error) {
    console.error('❌ LLM config error:', error);
    throw error;
  }
}

// ==================== CONFIGURATION STATUS ====================

/**
 * Get current configuration status from backend
 */
export async function getConfigStatus(): Promise<ConfigStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/config/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const status = await response.json();
    return status;
  } catch (error) {
    console.error('❌ Config status error:', error);
    return {
      database: {
        connected: false,
        type: 'unknown',
        status: 'disconnected'
      },
      llm: {
        configured: false,
        provider: 'unknown',
        status: 'not configured'
      }
    };
  }
}

// ==================== MODE MANAGEMENT ====================

/**
 * Switch between demo and production modes
 */
export async function switchMode(mode: 'demo' | 'production'): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/settings/mode/switch?mode=${mode}`, {
      method: 'POST'
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Mode switch error:', error);
    throw error;
  }
}

/**
 * Get current application mode
 */
export async function getCurrentMode(): Promise<{ mode: 'demo' | 'production'; details: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/settings/mode`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Get mode error:', error);
    return { mode: 'demo', details: {} };
  }
}

// ==================== ANALYTICS & ALGORITHMS ====================

/**
 * Run demand forecasting algorithm
 */
export async function forecastDemand(
  studyId: string,
  siteId: string,
  horizonDays: number = 90
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/forecast-demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        study_id: studyId,
        site_id: siteId,
        horizon_days: horizonDays
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Demand forecast error:', error);
    throw error;
  }
}

/**
 * Optimize inventory using EOQ algorithm
 */
export async function optimizeInventory(productId: string, siteId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/optimize-inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        site_id: siteId
      })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Inventory optimization error:', error);
    throw error;
  }
}

/**
 * Assess shipment risk
 */
export async function assessShipmentRisk(shipmentId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/assess-shipment-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipment_id: shipmentId })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Shipment risk assessment error:', error);
    throw error;
  }
}

// ==================== BRIEFS (MODE-AWARE) ====================

/**
 * Get morning brief (mode-aware)
 */
export async function getMorningBrief(mode?: 'demo' | 'production'): Promise<any> {
  try {
    const modeParam = mode ? `?mode=${mode}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/briefs/morning${modeParam}`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Morning brief error:', error);
    throw error;
  }
}

/**
 * Get evening summary (mode-aware)
 */
export async function getEveningSummary(mode?: 'demo' | 'production'): Promise<any> {
  try {
    const modeParam = mode ? `?mode=${mode}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/briefs/evening${modeParam}`);
    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Evening summary error:', error);
    throw error;
  }
}

// ==================== Q&A (MODE-AWARE) ====================

/**
 * Query on-demand Q&A (mode-aware with RAG)
 */
export async function queryQA(query: string, mode?: 'demo' | 'production'): Promise<any> {
  try {
    const modeParam = mode ? `?mode=${mode}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/qa/query${modeParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    return handleApiResponse(response);
  } catch (error) {
    console.error('❌ Q&A query error:', error);
    throw error;
  }
}
