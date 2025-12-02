import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  Palette,
  Upload,
  Download,
  Play,
  FileText
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
  const [savingDB, setSavingDB] = useState(false);

  // ==================== DATABASE DEPLOYMENT ====================
  const [deployingSchema, setDeployingSchema] = useState(false);
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [schemaText, setSchemaText] = useState('');

  // ==================== VECTOR STORE SETTINGS ====================
  const [vectorStoreType, setVectorStoreType] = useState('postgres_pgvector');
  const [vsTestResult, setVsTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingVS, setTestingVS] = useState(false);

  // ==================== THEME SETTINGS ====================
  const [currentTheme, setCurrentTheme] = useState<'dark-green' | 'blue-white' | 'black-yellow'>(config.theme || 'dark-green');

  // ==================== LOAD INITIAL SETTINGS ====================
  useEffect(() => {
    console.log('🚀 ConfigurationCockpit loaded!');
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
      console.log('🔍 Testing LLM connection');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/llm-provider/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKey || undefined
        })
      });
      
      const result = await response.json();
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
      console.log('🔍 Testing database connection');
      console.log('📊 Database config:', {
        type: databaseType,
        host: dbHost,
        port: dbPort,
        database: dbName,
        username: dbUser
      });
      
      // ✅ FIX: Use correct field names (no "database_" prefix except for database_type)
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/database/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseType,
          host: dbHost,              // ✅ Changed from database_host
          port: parseInt(dbPort),
          database: dbName,          // ✅ Changed from database_name
          username: dbUser,          // ✅ Changed from database_username
          password: dbPassword       // ✅ Changed from database_password
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

  // ==================== SAVE DATABASE SETTINGS ====================
  const saveDatabaseSettings = async () => {
    setSavingDB(true);
    
    try {
      console.log('💾 Saving database settings');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/database/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseType,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbName,
          username: dbUser,
          password: dbPassword
        })
      });
      
      const result = await response.json();
      
      if (result.success || response.ok) {
        // Update local config
        updateConfig({
          databaseType: databaseType as any,
          databaseConfig: {
            host: dbHost,
            port: parseInt(dbPort),
            database: dbName,
            username: dbUser,
            password: dbPassword
          }
        });
        
        toast({
          title: "Settings Saved",
          description: "Database configuration has been saved successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      toast({
        title: "Save Failed",
        description: `Could not save settings: ${error}`,
        variant: "destructive",
      });
    } finally {
      setSavingDB(false);
    }
  };

  // ==================== DATABASE DEPLOYMENT ====================
  const deployDefaultSchema = async () => {
    setDeployingSchema(true);
    
    try {
      console.log('🚀 Deploying default database schema');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/database/deploy-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseType,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbName,
          username: dbUser,
          password: dbPassword,
          include_sample_data: true
        })
      });
      
      const result = await response.json();
      
      toast({
        title: result.success ? "Schema Deployed" : "Deployment Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('❌ Schema deployment error:', error);
      toast({
        title: "Deployment Error",
        description: `Failed to deploy schema: ${error}`,
        variant: "destructive",
      });
    } finally {
      setDeployingSchema(false);
    }
  };

  // ==================== SCHEMA DOWNLOAD ====================
  const downloadDefaultSchema = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/database/schema/default`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sally_tsm_default_schema.sql';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Schema Downloaded",
        description: "Default schema SQL file has been downloaded",
      });
    } catch (error) {
      console.error('❌ Schema download error:', error);
      toast({
        title: "Download Failed",
        description: `Could not download schema: ${error}`,
        variant: "destructive",
      });
    }
  };

  // ==================== SCHEMA UPLOAD ====================
  const handleSchemaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setSchemaFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSchemaText(content);
    };
    reader.readAsText(file);
    
    toast({
      title: "Schema File Loaded",
      description: `${file.name} has been loaded. Review and deploy when ready.`,
    });
  };

  const deployCustomSchema = async () => {
    if (!schemaText) {
      toast({
        title: "No Schema Loaded",
        description: "Please upload a schema file first",
        variant: "destructive",
      });
      return;
    }
    
    setDeployingSchema(true);
    
    try {
      console.log('🚀 Deploying custom database schema');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/database/deploy-custom-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseType,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbName,
          username: dbUser,
          password: dbPassword,
          schema_sql: schemaText
        })
      });
      
      const result = await response.json();
      
      toast({
        title: result.success ? "Custom Schema Deployed" : "Deployment Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('❌ Custom schema deployment error:', error);
      toast({
        title: "Deployment Error",
        description: `Failed to deploy custom schema: ${error}`,
        variant: "destructive",
      });
    } finally {
      setDeployingSchema(false);
    }
  };

  // ==================== VIEW CURRENT SCHEMA ====================
  const viewCurrentSchema = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/database/schema/current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseType,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbName,
          username: dbUser,
          password: dbPassword
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSchemaText(result.schema);
        toast({
          title: "Schema Retrieved",
          description: "Current database schema has been loaded",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Schema view error:', error);
      toast({
        title: "Failed to Retrieve Schema",
        description: `Could not load current schema: ${error}`,
        variant: "destructive",
      });
    }
  };

  // ==================== VECTOR STORE CONNECTION TEST ====================
  const testVectorStoreConnection = async () => {
    setTestingVS(true);
    setVsTestResult(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/vector-store/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector_store_type: vectorStoreType
        })
      });
      
      const result = await response.json();
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
          <h1 className="text-2xl font-bold text-white">Configuration Cockpit</h1>
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
      <Tabs defaultValue="database" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
          <TabsTrigger value="llm" className="data-[state=active]:bg-green-600">
            <Brain className="h-4 w-4 mr-2" />
            LLM Provider
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-green-600">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="schema" className="data-[state=active]:bg-green-600">
            <FileText className="h-4 w-4 mr-2" />
            Schema
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

        {/* DATABASE CONFIGURATION TAB */}
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
                  </SelectContent>
                </Select>
              </div>

              {/* PostgreSQL/MySQL Fields */}
              {(databaseType === 'postgresql' || databaseType === 'mysql') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-host">Host</Label>
                      <Input
                        id="db-host"
                        placeholder="postgres.railway.internal"
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

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={testDatabaseConnection}
                  disabled={testingDB}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {testingDB ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button 
                  onClick={saveDatabaseSettings}
                  disabled={savingDB || testingDB}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {savingDB ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>

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

        {/* SCHEMA MANAGEMENT TAB */}
        <TabsContent value="schema" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-400" />
                Database Schema Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deploy Default Schema */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Deploy Default Schema</h3>
                <p className="text-sm text-slate-400">
                  Deploy the default TSM database schema with sample data (sites, inventory, shipments)
                </p>
                <Button 
                  onClick={deployDefaultSchema}
                  disabled={deployingSchema}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {deployingSchema ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Deploy Default Schema + Data
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-slate-700 my-4" />

              {/* Download/Upload Schema */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Manage Custom Schema</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={downloadDefaultSchema}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Default Schema
                  </Button>

                  <Button 
                    onClick={viewCurrentSchema}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Current Schema
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schema-upload">Upload Custom Schema (SQL File)</Label>
                  <Input
                    id="schema-upload"
                    type="file"
                    accept=".sql"
                    onChange={handleSchemaUpload}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>

                {schemaFile && (
                  <div className="flex items-center gap-2 p-2 bg-slate-900 rounded">
                    <FileText className="h-4 w-4 text-green-400" />
                    <span className="text-sm">{schemaFile.name}</span>
                  </div>
                )}

                {schemaText && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="schema-preview">Schema Preview</Label>
                      <Textarea
                        id="schema-preview"
                        value={schemaText}
                        onChange={(e) => setSchemaText(e.target.value)}
                        rows={12}
                        className="bg-slate-900 border-slate-600 font-mono text-xs"
                      />
                    </div>

                    <Button 
                      onClick={deployCustomSchema}
                      disabled={deployingSchema}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {deployingSchema ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Deploy Custom Schema
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-green-400" />
                Appearance & Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Select Theme</Label>
                
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

        {/* LLM TAB (Placeholder) */}
        <TabsContent value="llm" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-400" />
                LLM Provider Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">LLM configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVANCED TAB (Placeholder) */}
        <TabsContent value="advanced" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-400" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
