import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  Brain, 
  TestTube, 
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  HardDrive,
  Zap,
  Palette
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

// ✅ API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

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
  timestamp?: string;
}

export function ConfigurationCockpit() {
  const { config, updateConfig, updateTheme } = useApp();
  const { toast } = useToast();

  // ==================== APPLICATION MODE ====================
  const [applicationMode, setApplicationMode] = useState<'demo' | 'production'>('demo');
  const [isDemo, setIsDemo] = useState(true);
  const [switchingMode, setSwitchingMode] = useState(false);

  // ==================== LLM SETTINGS ====================
  const [providers, setProviders] = useState<Record<string, LLMProvider>>({});
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [llmTestResult, setLlmTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingLLM, setTestingLLM] = useState(false);

  // ==================== DATABASE SETTINGS ====================
  const [databaseType, setDatabaseType] = useState('postgresql');
  const [dbHost, setDbHost] = useState('postgres.railway.internal');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('railway');
  const [dbUser, setDbUser] = useState('postgres');
  const [dbPassword, setDbPassword] = useState('');
  const [dbTestResult, setDbTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingDB, setTestingDB] = useState(false);

  // ==================== VECTOR STORE SETTINGS ====================
  const [vectorStoreType, setVectorStoreType] = useState('postgres_pgvector');
  const [vsTestResult, setVsTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingVS, setTestingVS] = useState(false);

  // ==================== THEME SETTINGS ====================
  const [currentTheme, setCurrentTheme] = useState<'dark-green' | 'blue-white' | 'black-yellow'>(config.theme || 'dark-green');

  // ==================== LOAD INITIAL SETTINGS ====================
  useEffect(() => {
    console.log('🚀 ComprehensiveSettingsPanel loaded!');
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    console.log('🎨 Current theme:', currentTheme);
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      // Load application mode
      const modeResponse = await fetch(`${API_BASE_URL}/api/v1/settings/mode`);
      if (modeResponse.ok) {
        const modeData = await modeResponse.json();
        setApplicationMode(modeData.mode);
        setIsDemo(modeData.is_demo);
      }

      // Load LLM providers
      const providersResponse = await fetch(`${API_BASE_URL}/api/v1/settings/llm-providers`);
      if (providersResponse.ok) {
        const data = await providersResponse.json();
        setProviders(data.providers);
        setConfiguredProviders(data.configured);
        if (data.configured.length > 0) {
          setSelectedProvider(data.configured[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // ==================== MODE SWITCHING ====================
  const switchMode = async () => {
    const newMode = isDemo ? 'production' : 'demo';
    setSwitchingMode(true);
    
    try {
      console.log('🔄 Switching mode to:', newMode);
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/mode/switch?mode=${newMode}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApplicationMode(newMode);
        setIsDemo(newMode === 'demo');
        toast({
          title: "Mode Switched",
          description: `Application is now in ${newMode.toUpperCase()} mode`,
        });
      } else {
        throw new Error(data.message || 'Failed to switch mode');
      }
    } catch (error) {
      console.error('❌ Mode switch error:', error);
      toast({
        title: "Mode Switch Failed",
        description: `Could not switch to ${newMode} mode`,
        variant: "destructive",
      });
    } finally {
      setSwitchingMode(false);
    }
  };

  // ==================== LLM CONNECTION TEST ====================
  const testLLMConnection = async () => {
    setTestingLLM(true);
    setLlmTestResult(null);
    
    try {
      console.log('🔍 Testing LLM connection to:', `${API_BASE_URL}/api/v1/settings/llm-provider/test`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/llm-provider/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKey || undefined
        })
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);
      
      setLlmTestResult(result);
      
      toast({
        title: result.success ? "LLM Connection Successful" : "LLM Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('❌ LLM test error:', error);
      const errorResult = {
        success: false,
        message: `Connection failed: ${error}`,
        timestamp: new Date().toISOString()
      };
      setLlmTestResult(errorResult);
      
      toast({
        title: "LLM Connection Error",
        description: errorResult.message,
        variant: "destructive",
      });
    } finally {
      setTestingLLM(false);
    }
  };

  // ==================== DATABASE CONNECTION TEST ====================
  const testDatabaseConnection = async () => {
    setTestingDB(true);
    setDbTestResult(null);
    
    try {
      console.log('🔍 Testing database connection to:', `${API_BASE_URL}/api/v1/settings/database/test`);
      console.log('📊 Database config:', {
        type: databaseType,
        host: dbHost,
        port: dbPort,
        database: dbName,
        username: dbUser
      });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/database/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseType,
          database_host: dbHost,
          database_port: parseInt(dbPort),
          database_name: dbName,
          database_username: dbUser,
          database_password: dbPassword
        })
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);
      
      setDbTestResult(result);
      
      toast({
        title: result.success ? "Database Connection Successful" : "Database Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('❌ Database test error:', error);
      const errorResult = {
        success: false,
        message: `Connection failed: ${error}`,
        timestamp: new Date().toISOString()
      };
      setDbTestResult(errorResult);
      
      toast({
        title: "Database Connection Error",
        description: errorResult.message,
        variant: "destructive",
      });
    } finally {
      setTestingDB(false);
    }
  };

  // ==================== VECTOR STORE CONNECTION TEST ====================
  const testVectorStoreConnection = async () => {
    setTestingVS(true);
    setVsTestResult(null);
    
    try {
      console.log('🔍 Testing vector store connection to:', `${API_BASE_URL}/api/v1/settings/vector-store/test`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/vector-store/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector_store_type: vectorStoreType
        })
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);
      
      setVsTestResult(result);
      
      toast({
        title: result.success ? "Vector Store Connection Successful" : "Vector Store Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('❌ Vector store test error:', error);
      const errorResult = {
        success: false,
        message: `Connection failed: ${error}`,
        timestamp: new Date().toISOString()
      };
      setVsTestResult(errorResult);
      
      toast({
        title: "Vector Store Connection Error",
        description: errorResult.message,
        variant: "destructive",
      });
    } finally {
      setTestingVS(false);
    }
  };

  // ==================== THEME CHANGE ====================
  const handleThemeChange = (newTheme: 'dark-green' | 'blue-white' | 'black-yellow') => {
    console.log('🎨 Changing theme to:', newTheme);
    setCurrentTheme(newTheme);
    updateTheme(newTheme);
    updateConfig({ theme: newTheme });
    
    toast({
      title: "Theme Updated",
      description: `Theme changed to ${newTheme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
    });
  };

  // Theme button styles
  const getThemeButtonClass = (theme: string) => {
    const baseClass = "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all";
    if (currentTheme === theme) {
      return `${baseClass} border-green-500 bg-green-500/20`;
    }
    return `${baseClass} border-slate-600 hover:border-slate-500`;
  };

  // ==================== RENDER ====================
  return (
    <div className="h-full overflow-y-auto bg-background p-6 max-w-none w-full">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-green-400" />
          <h1 className="text-2xl font-bold text-white">Comprehensive Settings</h1>
        </div>
        
        {/* Application Mode Toggle */}
        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${isDemo ? 'text-yellow-400' : 'text-green-400'}`} />
            <span className="text-sm font-medium">
              Mode: <span className={isDemo ? 'text-yellow-400' : 'text-green-400'}>
                {isDemo ? 'DEMO' : 'PRODUCTION'}
              </span>
            </span>
          </div>
          <Switch
            checked={!isDemo}
            onCheckedChange={switchMode}
            disabled={switchingMode}
          />
          {switchingMode && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>

      {/* API Base URL Display */}
      <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">
          🔗 <span className="font-semibold">API:</span>{' '}
          <span className="text-blue-400">{API_BASE_URL}</span>
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="llm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
          <TabsTrigger value="llm" className="data-[state=active]:bg-green-600">
            <Brain className="h-4 w-4 mr-2" />
            LLM Provider
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-green-600">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="vectorstore" className="data-[state=active]:bg-green-600">
            <HardDrive className="h-4 w-4 mr-2" />
            Vector Store
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-green-600">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-green-600">
            <Settings className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* ==================== LLM CONFIGURATION TAB ==================== */}
        <TabsContent value="llm" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-400" />
                LLM Provider Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="llm-provider">LLM Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="llm-provider" className="bg-slate-900 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
                {configuredProviders.includes(selectedProvider) && (
                  <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                )}
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="llm-api-key">API Key</Label>
                <Input
                  id="llm-api-key"
                  type="password"
                  placeholder="Enter API key (optional if set in backend)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-slate-900 border-slate-600"
                />
              </div>

              {/* Test Connection Button */}
              <Button 
                onClick={testLLMConnection}
                disabled={testingLLM}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {testingLLM ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test LLM Connection
                  </>
                )}
              </Button>

              {/* Test Result */}
              {llmTestResult && (
                <div className={`p-4 rounded-lg border ${
                  llmTestResult.success 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-red-900/30 border-red-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {llmTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className="font-semibold">
                      {llmTestResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{llmTestResult.message}</p>
                  {llmTestResult.details && (
                    <pre className="mt-2 text-xs bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(llmTestResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DATABASE CONFIGURATION TAB ==================== */}
        <TabsContent value="database" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                Database Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Database Type */}
              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type</Label>
                <Select value={databaseType} onValueChange={setDatabaseType}>
                  <SelectTrigger id="db-type" className="bg-slate-900 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlite">SQLite (Local)</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PostgreSQL/MySQL Fields */}
              {(databaseType === 'postgresql' || databaseType === 'mysql') && (
                <>
                  {/* Host and Port */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-host">Host</Label>
                      <Input
                        id="db-host"
                        placeholder="localhost or postgres.railway.internal"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-port">Port</Label>
                      <Input
                        id="db-port"
                        placeholder="5432"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>

                  {/* Database Name */}
                  <div className="space-y-2">
                    <Label htmlFor="db-name">Database Name</Label>
                    <Input
                      id="db-name"
                      placeholder="railway"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      className="bg-slate-900 border-slate-600"
                    />
                  </div>

                  {/* Username and Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-user">Username</Label>
                      <Input
                        id="db-user"
                        placeholder="postgres"
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-password">Password</Label>
                      <Input
                        id="db-password"
                        type="password"
                        placeholder="Enter password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SQLite Path */}
              {databaseType === 'sqlite' && (
                <div className="space-y-2">
                  <Label htmlFor="sqlite-path">SQLite Database Path</Label>
                  <Input
                    id="sqlite-path"
                    placeholder="./data/tsm.db"
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
              )}

              {/* Test Connection Button */}
              <Button 
                onClick={testDatabaseConnection}
                disabled={testingDB}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {testingDB ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Database Connection
                  </>
                )}
              </Button>

              {/* Test Result */}
              {dbTestResult && (
                <div className={`p-4 rounded-lg border ${
                  dbTestResult.success 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-red-900/30 border-red-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {dbTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className="font-semibold">
                      {dbTestResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{dbTestResult.message}</p>
                  {dbTestResult.details && (
                    <pre className="mt-2 text-xs bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(dbTestResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== VECTOR STORE TAB ==================== */}
        <TabsContent value="vectorstore" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-400" />
                Vector Store Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vector Store Type */}
              <div className="space-y-2">
                <Label htmlFor="vs-type">Vector Store Type</Label>
                <Select value={vectorStoreType} onValueChange={setVectorStoreType}>
                  <SelectTrigger id="vs-type" className="bg-slate-900 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgres_pgvector">PostgreSQL + pgvector</SelectItem>
                    <SelectItem value="chromadb">ChromaDB</SelectItem>
                    <SelectItem value="pinecone">Pinecone</SelectItem>
                    <SelectItem value="qdrant">Qdrant</SelectItem>
                    <SelectItem value="weaviate">Weaviate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Connection Button */}
              <Button 
                onClick={testVectorStoreConnection}
                disabled={testingVS}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {testingVS ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Vector Store Connection
                  </>
                )}
              </Button>

              {/* Test Result */}
              {vsTestResult && (
                <div className={`p-4 rounded-lg border ${
                  vsTestResult.success 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-red-900/30 border-red-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {vsTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className="font-semibold">
                      {vsTestResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{vsTestResult.message}</p>
                  {vsTestResult.details && (
                    <pre className="mt-2 text-xs bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(vsTestResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== APPEARANCE TAB ==================== */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-green-400" />
                Appearance & Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label>Select Theme</Label>
                
                {/* Dark Green Theme (Default) */}
                <button
                  onClick={() => handleThemeChange('dark-green')}
                  className={getThemeButtonClass('dark-green')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-green-500"></div>
                      <div className="w-6 h-6 rounded bg-slate-900"></div>
                    </div>
                    <span className="font-medium">Dark Green</span>
                    {currentTheme === 'dark-green' && <CheckCircle className="h-4 w-4 text-green-400" />}
                  </div>
                </button>

                {/* Blue White Theme */}
                <button
                  onClick={() => handleThemeChange('blue-white')}
                  className={getThemeButtonClass('blue-white')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-blue-500"></div>
                      <div className="w-6 h-6 rounded bg-white"></div>
                    </div>
                    <span className="font-medium">Blue & White</span>
                    {currentTheme === 'blue-white' && <CheckCircle className="h-4 w-4 text-green-400" />}
                  </div>
                </button>

                {/* Black Yellow Theme */}
                <button
                  onClick={() => handleThemeChange('black-yellow')}
                  className={getThemeButtonClass('black-yellow')}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-black"></div>
                      <div className="w-6 h-6 rounded bg-yellow-400"></div>
                    </div>
                    <span className="font-medium">Black & Yellow</span>
                    {currentTheme === 'black-yellow' && <CheckCircle className="h-4 w-4 text-green-400" />}
                  </div>
                </button>
              </div>

              {/* Current Theme Display */}
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400">
                  Current theme: <span className="text-green-400 font-semibold">
                    {currentTheme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ADVANCED TAB ==================== */}
        <TabsContent value="advanced" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-400" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Environment Info */}
              <div className="space-y-2">
                <Label>Environment Information</Label>
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">API Base URL:</span>{' '}
                    <span className="text-blue-400">{API_BASE_URL}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Application Mode:</span>{' '}
                    <span className={isDemo ? 'text-yellow-400' : 'text-green-400'}>
                      {isDemo ? 'DEMO' : 'PRODUCTION'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Theme:</span>{' '}
                    <span className="text-green-400">
                      {currentTheme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-2">
                <Label>Feature Flags</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <span className="text-sm">Enable RAG Features</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <span className="text-sm">Enable Scenarios</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <span className="text-sm">Enable Morning Brief</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                    <span className="text-sm">Enable Evening Summary</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
