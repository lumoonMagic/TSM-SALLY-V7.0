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

// ✅ CRITICAL: API URL Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

// 🔥 DEBUG: Log everything on load
console.log('════════════════════════════════════════');
console.log('🚀 SettingsPanel.tsx loaded!');
console.log('🌐 API_BASE_URL:', API_BASE_URL);
console.log('🔧 VITE_API_URL env:', import.meta.env.VITE_API_URL);
console.log('🔧 Environment mode:', import.meta.env.MODE);
console.log('🔧 All env vars:', import.meta.env);
console.log('════════════════════════════════════════');

export default function SettingsPanel() {
  // State
  const [activeTab, setActiveTab] = useState('database'); // Default to database tab
  const [providers, setProviders] = useState<Record<string, LLMProvider>>({});
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  
  // LLM Settings
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [llmTestResult, setLlmTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingLLM, setTestingLLM] = useState(false);
  
  // Database Settings
  const [databaseType, setDatabaseType] = useState('postgres'); // Default to postgres
  const [dbHost, setDbHost] = useState('postgres.railway.internal');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('railway');
  const [dbUser, setDbUser] = useState('postgres');
  const [dbPassword, setDbPassword] = useState('');
  const [dbTestResult, setDbTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingDB, setTestingDB] = useState(false);
  
  // Vector Store Settings
  const [vectorStoreType, setVectorStoreType] = useState('chromadb');
  const [vsTestResult, setVsTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingVS, setTestingVS] = useState(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(`🐛 ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  useEffect(() => {
    addDebugLog('Component mounted');
    addDebugLog(`API_BASE_URL is: ${API_BASE_URL}`);
  }, []);

  // Test Database Connection
  const testDatabaseConnection = async () => {
    addDebugLog('═══ TEST DATABASE CONNECTION CLICKED ═══');
    addDebugLog(`Button state: testingDB=${testingDB}`);
    
    setTestingDB(true);
    setDbTestResult(null);
    
    const requestBody = {
      database_type: databaseType,
      host: dbHost,
      port: parseInt(dbPort),
      database: dbName,
      username: dbUser,
      password: dbPassword
    };
    
    const url = `${API_BASE_URL}/api/v1/settings/database/test`;
    
    addDebugLog(`Request URL: ${url}`);
    addDebugLog(`Request body: ${JSON.stringify({...requestBody, password: '***'})}`);
    
    try {
      addDebugLog('Starting fetch request...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      addDebugLog(`Response received! Status: ${response.status}`);
      addDebugLog(`Response OK: ${response.ok}`);
      addDebugLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      const result = await response.json();
      addDebugLog(`Response JSON: ${JSON.stringify(result).substring(0, 200)}...`);
      
      setDbTestResult(result);
      addDebugLog('✅ Test completed successfully!');
      
    } catch (error: any) {
      addDebugLog(`❌ ERROR CAUGHT: ${error.message || error}`);
      addDebugLog(`Error type: ${error.name}`);
      addDebugLog(`Error stack: ${error.stack}`);
      
      setDbTestResult({
        success: false,
        message: `Connection failed: ${error.message || error}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingDB(false);
      addDebugLog('testingDB set to false');
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
                <pre className="bg-white p-2 rounded border overflow-auto max-h-64">
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Settings - DEBUG MODE</h2>
              <p className="text-sm text-gray-600">
                Configure LLM providers, database, and vector storage
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-mono text-blue-600">
                  🔗 API_BASE_URL: {API_BASE_URL}
                </p>
                <p className="text-xs font-mono text-gray-500">
                  🔧 VITE_API_URL: {import.meta.env.VITE_API_URL || '(not set)'}
                </p>
                <p className="text-xs font-mono text-gray-500">
                  🌍 Mode: {import.meta.env.MODE}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Database Configuration</h3>
              </div>

              {/* Database Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Database Type</label>
                <select
                  value={databaseType}
                  onChange={(e) => {
                    setDatabaseType(e.target.value);
                    addDebugLog(`Database type changed to: ${e.target.value}`);
                  }}
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
                  addDebugLog('🖱️ Button clicked!');
                  testDatabaseConnection();
                }}
                disabled={testingDB}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {testingDB ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  '🔍 Test Database Connection'
                )}
              </button>

              {/* Test Result */}
              {renderConnectionResult(dbTestResult)}
            </div>
          </div>

          {/* Right: Debug Log */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">🐛 Debug Log</h4>
                <button
                  onClick={() => {
                    setDebugInfo([]);
                    addDebugLog('Log cleared');
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
              </div>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-96 overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <div className="text-gray-500">No logs yet... Click "Test Connection"</div>
                ) : (
                  debugInfo.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p className="font-semibold mb-1">💡 Debugging Tips:</p>
              <ul className="space-y-1 text-gray-700">
                <li>• Check browser Console (F12)</li>
                <li>• Check Network tab for requests</li>
                <li>• Watch the debug log on the right</li>
                <li>• Verify VITE_API_URL is set</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
