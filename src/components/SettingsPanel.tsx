import { useState, useEffect } from 'react';
import { Settings, Database, Bot, HardDrive, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface LLMProvider {
  name: string;
  chat_models: string[];
  embedding_models: string[];
  embedding_cost: string;
  native_embeddings: boolean;
  requires_api_key: string;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

// ✅ Get API URL from environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

console.log('🌐 API_BASE_URL loaded:', API_BASE_URL);
console.log('🔧 Environment:', import.meta.env.MODE);

export default function SettingsPanel() {
  // State
  const [activeTab, setActiveTab] = useState('llm');
  const [providers, setProviders] = useState<Record<string, LLMProvider>>({});
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  
  // LLM Settings
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [llmTestResult, setLlmTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingLLM, setTestingLLM] = useState(false);
  
  // Database Settings
  const [databaseType, setDatabaseType] = useState('sqlite');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbTestResult, setDbTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingDB, setTestingDB] = useState(false);
  
  // Vector Store Settings
  const [vectorStoreType, setVectorStoreType] = useState('chromadb');
  const [vsTestResult, setVsTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingVS, setTestingVS] = useState(false);

  // Load available providers on mount
  useEffect(() => {
    console.log('📡 Loading LLM providers from:', `${API_BASE_URL}/api/v1/settings/llm-providers`);
    
    fetch(`${API_BASE_URL}/api/v1/settings/llm-providers`)
      .then(res => {
        console.log('📡 LLM providers response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📦 LLM providers data:', data);
        setProviders(data.providers);
        setConfiguredProviders(data.configured);
        if (data.configured.length > 0) {
          setSelectedProvider(data.configured[0]);
        }
      })
      .catch(err => {
        console.error('❌ Failed to load providers:', err);
      });
  }, []);

  // Test LLM Connection
  const testLLMConnection = async () => {
    console.log('🧪 Testing LLM connection...');
    setTestingLLM(true);
    setLlmTestResult(null);
    
    try {
      console.log('📡 Request URL:', `${API_BASE_URL}/api/v1/settings/llm-provider/test`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/llm-provider/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKey || undefined
        })
      });
      
      console.log('📡 LLM test response status:', response.status);
      const result = await response.json();
      console.log('📦 LLM test result:', result);
      setLlmTestResult(result);
    } catch (error) {
      console.error('❌ LLM test error:', error);
      setLlmTestResult({
        success: false,
        message: `Connection failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingLLM(false);
    }
  };

  // Test Database Connection
  const testDatabaseConnection = async () => {
    console.log('🔍 Testing database connection...');
    console.log('📝 Database config:', { databaseType, dbHost, dbPort, dbName, dbUser });
    
    setTestingDB(true);
    setDbTestResult(null);
    
    try {
      const url = `${API_BASE_URL}/api/v1/settings/database/test`;
      console.log('📡 Request URL:', url);
      
      const body = {
        database_type: databaseType,
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser,
        password: dbPassword
      };
      console.log('📤 Request body:', { ...body, password: '***' });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('📦 Response data:', result);
      
      setDbTestResult(result);
    } catch (error) {
      console.error('❌ Database test error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      setDbTestResult({
        success: false,
        message: `Connection failed: ${error.message || error}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingDB(false);
    }
  };

  // Test Vector Store Connection
  const testVectorStoreConnection = async () => {
    console.log('🧪 Testing vector store connection...');
    setTestingVS(true);
    setVsTestResult(null);
    
    try {
      console.log('📡 Request URL:', `${API_BASE_URL}/api/v1/settings/vector-store/test`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/vector-store/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector_store_type: vectorStoreType,
          llm_provider: {
            provider: selectedProvider,
            api_key: apiKey || undefined
          }
        })
      });
      
      console.log('📡 Vector store test response status:', response.status);
      const result = await response.json();
      console.log('📦 Vector store test result:', result);
      setVsTestResult(result);
    } catch (error) {
      console.error('❌ Vector store test error:', error);
      setVsTestResult({
        success: false,
        message: `Connection failed: ${error}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingVS(false);
    }
  };

  const renderConnectionResult = (result: ConnectionTestResult | null) => {
    if (!result) return null;
    
    return (
      <div className={`mt-4 p-4 rounded-lg border ${
        result.success 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.message}
            </p>
            {result.details && (
              <div className="mt-2 text-sm text-gray-600">
                <pre className="bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-sm text-gray-600">
                Configure LLM providers, database, and vector storage
              </p>
              <p className="text-xs text-blue-600 mt-1">
                🔗 API: {API_BASE_URL}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Environment: {import.meta.env.MODE} | VITE_API_URL: {import.meta.env.VITE_API_URL || 'not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1 px-6">
            {[
              { id: 'llm', label: 'LLM Provider', icon: Bot },
              { id: 'database', label: 'Database', icon: Database },
              { id: 'vector', label: 'Vector Store', icon: HardDrive }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* LLM Provider Tab */}
          {activeTab === 'llm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">LLM Provider Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select your LLM provider. Each provider uses ONLY its own capabilities - no cross-dependencies.
                </p>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {Object.entries(providers).map(([key, provider]) => (
                    <option key={key} value={key}>
                      {provider.name} - {provider.embedding_cost}
                      {configuredProviders.includes(key) && ' ✓'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Info */}
              {selectedProvider && providers[selectedProvider] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{providers[selectedProvider].name}</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Embedding Cost:</strong> {providers[selectedProvider].embedding_cost}</p>
                    <p><strong>Native Embeddings:</strong> {providers[selectedProvider].native_embeddings ? 'Yes' : 'No'}</p>
                    <p><strong>Chat Models:</strong> {providers[selectedProvider].chat_models.join(', ')}</p>
                  </div>
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  API Key
                  <span className="text-xs text-gray-500 ml-2">(optional if already set in environment)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`${providers[selectedProvider]?.requires_api_key || 'API_KEY'}`}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Test Connection Button */}
              <button
                onClick={testLLMConnection}
                disabled={testingLLM}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testingLLM ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test LLM Connection'
                )}
              </button>

              {/* Test Result */}
              {renderConnectionResult(llmTestResult)}
            </div>
          )}

          {/* Database Tab */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Database Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure your database connection. Recommended: PostgreSQL with pgvector for Railway deployment.
                </p>
              </div>

              {/* Database Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Database Type</label>
                <select
                  value={databaseType}
                  onChange={(e) => setDatabaseType(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="sqlite">SQLite (Development)</option>
                  <option value="postgres">PostgreSQL (Production - Railway)</option>
                </select>
              </div>

              {/* PostgreSQL Fields */}
              {databaseType === 'postgres' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Host</label>
                      <input
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="postgres.railway.internal"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Port</label>
                      <input
                        type="text"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="5432"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Database Name</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="railway"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="postgres"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Password</label>
                      <input
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Test Connection Button */}
              <button
                onClick={() => {
                  console.log('🖱️ Test Database Connection button clicked!');
                  testDatabaseConnection();
                }}
                disabled={testingDB}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testingDB ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Database Connection'
                )}
              </button>

              {/* Test Result */}
              {renderConnectionResult(dbTestResult)}
            </div>
          )}

          {/* Vector Store Tab */}
          {activeTab === 'vector' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Vector Store Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose how to store document embeddings. PGVector uses your PostgreSQL database.
                </p>
              </div>

              {/* Vector Store Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Vector Store Type</label>
                <select
                  value={vectorStoreType}
                  onChange={(e) => setVectorStoreType(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="chromadb">ChromaDB (File-based)</option>
                  <option value="pgvector">PGVector (PostgreSQL)</option>
                </select>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm">
                  {vectorStoreType === 'pgvector' ? (
                    <>
                      <strong>PGVector:</strong> Stores vectors in PostgreSQL database. 
                      Recommended for Railway deployment. Free, persistent, and scalable.
                    </>
                  ) : (
                    <>
                      <strong>ChromaDB:</strong> Stores vectors in local files. 
                      Good for development. Requires Railway Volume ($5/mo) for persistence in production.
                    </>
                  )}
                </p>
              </div>

              {/* Test Connection Button */}
              <button
                onClick={testVectorStoreConnection}
                disabled={testingVS}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testingVS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Vector Store Connection'
                )}
              </button>

              {/* Test Result */}
              {renderConnectionResult(vsTestResult)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> All connection tests run through the Railway API. 
            Check the console (F12) for detailed debugging information.
          </p>
        </div>
      </div>
    </div>
  );
}
