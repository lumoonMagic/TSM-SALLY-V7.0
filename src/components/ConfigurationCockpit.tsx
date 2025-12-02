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
  FileText,
  Globe,
  Monitor
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  configureDatabaseApi, 
  configureLLMApi, 
  getConfigStatus,
  testDatabaseConnection,
  deployDefaultSchema,
  getDefaultSchema,
  deployCustomSchema,
  getCurrentSchema,
  type DatabaseConfig,
  type LLMConfig,
  type ConfigStatus 
} from '@/lib/configApi';
import { isProductionMode, getDatabaseMode, getModeInfo } from '@/lib/mode';

// ✅ API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

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

// 🎨 Theme Configurations
const THEMES = [
  {
    id: 'dark-green',
    name: 'Dark Green',
    description: 'Classic dark theme with green accents',
    preview: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
    primaryColor: '#10b981',
    backgroundColor: '#064e3b'
  },
  {
    id: 'blue-white',
    name: 'Navy Blue & White',
    description: 'Professional navy blue theme',
    preview: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    primaryColor: '#3b82f6',
    backgroundColor: '#1e3a8a'
  },
  {
    id: 'black-yellow',
    name: 'Black & Yellow',
    description: 'Bold black theme with yellow highlights',
    preview: 'linear-gradient(135deg, #1f2937 0%, #fbbf24 100%)',
    primaryColor: '#fbbf24',
    backgroundColor: '#1f2937'
  }
];

export function ConfigurationCockpit() {
  const { config, updateConfig, updateTheme } = useApp();
  const { toast } = useToast();

  // ==================== MODE DETECTION ====================
  const [modeInfo, setModeInfo] = useState(getModeInfo());
  const [backendStatus, setBackendStatus] = useState<ConfigStatus | null>(null);
  const [loadingBackendStatus, setLoadingBackendStatus] = useState(false);

  // ==================== APPLICATION MODE ====================
  const [applicationMode, setApplicationMode] = useState<'demo' | 'production'>(getDatabaseMode());
  const [switchingMode, setSwitchingMode] = useState(false);

  // ==================== LLM SETTINGS ====================
  const [providers, setProviders] = useState<Record<string, LLMProvider>>({});
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [llmTestResult, setLlmTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingLLM, setTestingLLM] = useState(false);
  const [savingLLM, setSavingLLM] = useState(false);

  // ==================== DATABASE SETTINGS ====================
  const [databaseType, setDatabaseType] = useState('postgresql');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbTestResult, setDbTestResult] = useState<ConnectionTestResult | null>(null);
  const [testingDB, setTestingDB] = useState(false);
  const [savingDB, setSavingDB] = useState(false);

  // ==================== DATABASE DEPLOYMENT ====================
  const [deployingSchema, setDeployingSchema] = useState(false);
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [schemaText, setSchemaText] = useState('');
  const [downloadingSchema, setDownloadingSchema] = useState(false);
  const [viewingSchema, setViewingSchema] = useState(false);

  // ==================== VECTOR STORE SETTINGS ====================
  const [vectorStoreType, setVectorStoreType] = useState('postgres_pgvector');

  // ==================== THEME SETTINGS ====================
  const [currentTheme, setCurrentTheme] = useState<'dark-green' | 'blue-white' | 'black-yellow'>(config.theme || 'dark-green');

  // ==================== LOAD INITIAL SETTINGS ====================
  useEffect(() => {
    console.log('🚀 ConfigurationCockpit PRODUCTION-READY loaded!');
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    console.log('🎨 Current theme:', currentTheme);
    console.log('🔍 Mode Info:', modeInfo);
    
    loadAllSettings();
    checkBackendStatus();
  }, []);

  // ==================== LOAD SETTINGS FROM LOCALSTORAGE ====================
  const loadAllSettings = async () => {
    try {
      // Load LLM providers
      await loadLLMProviders();
      
      // Load saved configurations from localStorage
      const savedConfig = localStorage.getItem('sally-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        
        // Load database settings
        if (parsed.database) {
          setDatabaseType(parsed.database.type || 'postgresql');
          setDbHost(parsed.database.host || '');
          setDbPort(String(parsed.database.port || '5432'));
          setDbName(parsed.database.database || '');
          setDbUser(parsed.database.username || '');
          // Don't load password from localStorage
        }
        
        // Load LLM settings
        if (parsed.llm) {
          setSelectedProvider(parsed.llm.provider || 'gemini');
          setSelectedModel(parsed.llm.model || '');
          // Don't load API key from localStorage
        }
        
        // Load vector store settings
        if (parsed.vectorStore) {
          setVectorStoreType(parsed.vectorStore.type || 'postgres_pgvector');
        }
        
        // Load theme
        if (parsed.theme) {
          setCurrentTheme(parsed.theme);
        }
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    }
  };

  // ==================== BACKEND STATUS CHECK ====================
  const checkBackendStatus = async () => {
    if (!isProductionMode()) {
      console.log('📍 Demo mode - skipping backend status check');
      return;
    }

    setLoadingBackendStatus(true);
    try {
      console.log('🔍 Checking backend status...');
      const status = await getConfigStatus();
      setBackendStatus(status);
      console.log('✅ Backend status:', status);
    } catch (error) {
      console.error('❌ Backend status check failed:', error);
      setBackendStatus(null);
    } finally {
      setLoadingBackendStatus(false);
    }
  };

  // ==================== LOAD LLM PROVIDERS ====================
  const loadLLMProviders = async () => {
    try {
      console.log('📡 Loading LLM providers from:', `${API_BASE_URL}/api/v1/settings/llm-providers`);
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/llm-providers`);
      
      if (!response.ok) {
        throw new Error(`Failed to load providers: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Loaded providers:', data);
      setProviders(data.providers || {});
      setConfiguredProviders(data.configured || []);
    } catch (error) {
      console.error('❌ Error loading LLM providers:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Load Providers',
        description: 'Could not load LLM provider list'
      });
    }
  };

  // ==================== TEST LLM CONNECTION ====================
  const handleTestLLM = async () => {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'Missing API Key',
        description: 'Please enter an API key'
      });
      return;
    }

    setTestingLLM(true);
    setLlmTestResult(null);

    try {
      console.log('🧪 Testing LLM connection:', selectedProvider);
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/llm-provider/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKey,
          model: selectedModel || undefined
        })
      });

      const result = await response.json();
      setLlmTestResult(result);

      if (result.success) {
        toast({
          title: '✅ LLM Connection Successful',
          description: result.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: '❌ LLM Connection Failed',
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ LLM test error:', error);
      setLlmTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Could not test LLM connection'
      });
    } finally {
      setTestingLLM(false);
    }
  };

  // ==================== SAVE LLM SETTINGS ====================
  const handleSaveLLM = async () => {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'Missing API Key',
        description: 'Please enter an API key'
      });
      return;
    }

    setSavingLLM(true);

    try {
      // Save to localStorage
      const currentConfig = JSON.parse(localStorage.getItem('sally-config') || '{}');
      currentConfig.llm = {
        provider: selectedProvider,
        model: selectedModel
      };
      localStorage.setItem('sally-config', JSON.stringify(currentConfig));

      // Save to backend if in production mode
      if (isProductionMode()) {
        console.log('💾 Saving LLM config to backend...');
        const llmConfig: LLMConfig = {
          provider: selectedProvider as any,
          api_key: apiKey,
          model: selectedModel || undefined
        };
        
        await configureLLMApi(llmConfig);
        
        // Refresh backend status
        await checkBackendStatus();
      }

      toast({
        title: '✅ LLM Settings Saved',
        description: `${selectedProvider} configuration saved successfully`
      });

      // Update app context
      updateConfig({ llmProvider: selectedProvider });
    } catch (error) {
      console.error('❌ LLM save error:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Could not save LLM settings'
      });
    } finally {
      setSavingLLM(false);
    }
  };

  // ==================== TEST DATABASE CONNECTION ====================
  const handleTestDatabase = async () => {
    if (!dbHost || !dbName || !dbUser) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required database fields'
      });
      return;
    }

    setTestingDB(true);
    setDbTestResult(null);

    try {
      console.log('🧪 Testing database connection');
      const dbConfig: DatabaseConfig = {
        type: databaseType as any,
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser,
        password: dbPassword
      };

      const result = await testDatabaseConnection(dbConfig);
      setDbTestResult(result);

      if (result.success) {
        toast({
          title: '✅ Database Connection Successful',
          description: result.message
        });
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Database Connection Failed',
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ Database test error:', error);
      setDbTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Could not test database connection'
      });
    } finally {
      setTestingDB(false);
    }
  };

  // ==================== SAVE DATABASE SETTINGS ====================
  const handleSaveDatabase = async () => {
    if (!dbHost || !dbName || !dbUser) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required database fields'
      });
      return;
    }

    setSavingDB(true);

    try {
      // Save to localStorage
      const currentConfig = JSON.parse(localStorage.getItem('sally-config') || '{}');
      currentConfig.database = {
        type: databaseType,
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser
      };
      localStorage.setItem('sally-config', JSON.stringify(currentConfig));

      // Save to backend if in production mode
      if (isProductionMode()) {
        console.log('💾 Saving database config to backend...');
        const dbConfig: DatabaseConfig = {
          type: databaseType as any,
          host: dbHost,
          port: parseInt(dbPort),
          database: dbName,
          username: dbUser,
          password: dbPassword
        };
        
        await configureDatabaseApi(dbConfig);
        
        // Refresh backend status
        await checkBackendStatus();
      }

      toast({
        title: '✅ Database Settings Saved',
        description: `${databaseType} configuration saved successfully`
      });

      // Update app context
      updateConfig({ databaseType });
    } catch (error) {
      console.error('❌ Database save error:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Could not save database settings'
      });
    } finally {
      setSavingDB(false);
    }
  };

  // ==================== DEPLOY DEFAULT SCHEMA ====================
  const handleDeployDefaultSchema = async () => {
    if (!dbHost || !dbName || !dbUser) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please configure and test database connection first'
      });
      return;
    }

    setDeployingSchema(true);

    try {
      console.log('🚀 Deploying default schema...');
      const dbConfig: DatabaseConfig = {
        type: databaseType as any,
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser,
        password: dbPassword
      };

      const result = await deployDefaultSchema(dbConfig, true);

      if (result.success) {
        toast({
          title: '✅ Schema Deployed Successfully',
          description: result.message || 'Default DDL and sample data loaded'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Schema Deployment Failed',
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ Schema deployment error:', error);
      toast({
        variant: 'destructive',
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Could not deploy schema'
      });
    } finally {
      setDeployingSchema(false);
    }
  };

  // ==================== DOWNLOAD DEFAULT SCHEMA ====================
  const handleDownloadSchema = async () => {
    setDownloadingSchema(true);

    try {
      console.log('📥 Downloading default schema...');
      const blob = await getDefaultSchema();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sally-tsm-schema.sql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Schema Downloaded',
        description: 'sally-tsm-schema.sql downloaded successfully'
      });
    } catch (error) {
      console.error('❌ Schema download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not download schema'
      });
    } finally {
      setDownloadingSchema(false);
    }
  };

  // ==================== UPLOAD CUSTOM SCHEMA ====================
  const handleSchemaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSchemaFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSchemaText(content);
    };
    reader.readAsText(file);

    toast({
      title: 'Schema File Loaded',
      description: `${file.name} loaded successfully`
    });
  };

  // ==================== DEPLOY CUSTOM SCHEMA ====================
  const handleDeployCustomSchema = async () => {
    if (!schemaText) {
      toast({
        variant: 'destructive',
        title: 'No Schema',
        description: 'Please upload a schema file first'
      });
      return;
    }

    if (!dbHost || !dbName || !dbUser) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please configure and test database connection first'
      });
      return;
    }

    setDeployingSchema(true);

    try {
      console.log('🚀 Deploying custom schema...');
      const dbConfig: DatabaseConfig = {
        type: databaseType as any,
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser,
        password: dbPassword
      };

      const result = await deployCustomSchema(dbConfig, schemaText);

      if (result.success) {
        toast({
          title: '✅ Custom Schema Deployed',
          description: result.message || 'Custom schema deployed successfully'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Deployment Failed',
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ Custom schema deployment error:', error);
      toast({
        variant: 'destructive',
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Could not deploy custom schema'
      });
    } finally {
      setDeployingSchema(false);
    }
  };

  // ==================== VIEW CURRENT SCHEMA ====================
  const handleViewCurrentSchema = async () => {
    if (!dbHost || !dbName || !dbUser) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please configure and test database connection first'
      });
      return;
    }

    setViewingSchema(true);

    try {
      console.log('👀 Viewing current schema...');
      const dbConfig: DatabaseConfig = {
        type: databaseType as any,
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        username: dbUser,
        password: dbPassword
      };

      const result = await getCurrentSchema(dbConfig);

      if (result.success) {
        setSchemaText(result.schema || 'No schema found');
        toast({
          title: '✅ Schema Retrieved',
          description: 'Current database schema loaded'
        });
      } else {
        toast({
          variant: 'destructive',
          title: '❌ Retrieval Failed',
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ Schema retrieval error:', error);
      toast({
        variant: 'destructive',
        title: 'Retrieval Failed',
        description: 'Could not retrieve schema'
      });
    } finally {
      setViewingSchema(false);
    }
  };

  // ==================== SWITCH APPLICATION MODE ====================
  const handleModeSwitch = async (newMode: 'demo' | 'production') => {
    setSwitchingMode(true);

    try {
      console.log(`🔄 Switching to ${newMode} mode...`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/settings/mode/switch?mode=${newMode}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        setApplicationMode(newMode);
        toast({
          title: `✅ Switched to ${newMode === 'demo' ? 'Demo' : 'Production'} Mode`,
          description: result.message
        });
        
        // Refresh backend status
        await checkBackendStatus();
      } else {
        toast({
          variant: 'destructive',
          title: 'Mode Switch Failed',
          description: result.message
        });
      }
    } catch (error) {
      console.error('❌ Mode switch error:', error);
      toast({
        variant: 'destructive',
        title: 'Switch Failed',
        description: 'Could not switch mode'
      });
    } finally {
      setSwitchingMode(false);
    }
  };

  // ==================== CHANGE THEME ====================
  const handleThemeChange = (themeId: string) => {
    const theme = themeId as 'dark-green' | 'blue-white' | 'black-yellow';
    setCurrentTheme(theme);
    updateTheme(theme);
    
    // Save to localStorage
    const currentConfig = JSON.parse(localStorage.getItem('sally-config') || '{}');
    currentConfig.theme = theme;
    localStorage.setItem('sally-config', JSON.stringify(currentConfig));

    toast({
      title: '🎨 Theme Changed',
      description: `Switched to ${THEMES.find(t => t.id === themeId)?.name || theme}`
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuration Cockpit
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage application settings, database connections, and integrations
          </p>
        </div>
      </div>

      {/* ==================== BACKEND STATUS PANEL ==================== */}
      {isProductionMode() && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Backend Status
              {loadingBackendStatus && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Database Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <Database className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground">
                    {backendStatus?.database.connected 
                      ? `Connected (${backendStatus.database.type})`
                      : 'Not connected'}
                  </p>
                </div>
                {backendStatus?.database.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>

              {/* LLM Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <Brain className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">LLM Provider</p>
                  <p className="text-xs text-muted-foreground">
                    {backendStatus?.llm.configured 
                      ? `Configured (${backendStatus.llm.provider})`
                      : 'Not configured'}
                  </p>
                </div>
                {backendStatus?.llm.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">API Endpoint:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{API_BASE_URL}</code>
              </div>
              <Button size="sm" variant="outline" onClick={checkBackendStatus}>
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== MODE TOGGLE ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Application Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{modeInfo.label}</p>
              <p className="text-sm text-muted-foreground">{modeInfo.database}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">Demo</span>
              <Switch
                checked={applicationMode === 'production'}
                onCheckedChange={(checked) => handleModeSwitch(checked ? 'production' : 'demo')}
                disabled={switchingMode}
              />
              <span className="text-sm">Production</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== MAIN CONFIGURATION TABS ==================== */}
      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="llm">
            <Brain className="h-4 w-4 mr-2" />
            LLM Provider
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="schema">
            <FileText className="h-4 w-4 mr-2" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </TabsTrigger>
        </TabsList>

        {/* ==================== LLM CONFIGURATION TAB ==================== */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(providers).map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {providers[provider].name}
                        {configuredProviders.includes(provider) && (
                          <Badge variant="outline" className="ml-2">Configured</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {providers[selectedProvider] && (
                <>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers[selectedProvider].chat_models.map((model) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleTestLLM}
                      disabled={testingLLM || !apiKey}
                      variant="outline"
                    >
                      {testingLLM ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleSaveLLM}
                      disabled={savingLLM || !apiKey}
                    >
                      {savingLLM ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>

                  {llmTestResult && (
                    <div className={`p-3 rounded-lg ${llmTestResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                      <div className="flex items-center gap-2">
                        {llmTestResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm">{llmTestResult.message}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DATABASE CONFIGURATION TAB ==================== */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Database Type</Label>
                <Select value={databaseType} onValueChange={setDatabaseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {databaseType !== 'sqlite' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Host</Label>
                      <Input
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="localhost or postgres.railway.internal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="5432"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Database Name</Label>
                    <Input
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="railway"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="postgres"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleTestDatabase}
                  disabled={testingDB || !dbHost || !dbName || !dbUser}
                  variant="outline"
                >
                  {testingDB ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSaveDatabase}
                  disabled={savingDB || !dbHost || !dbName || !dbUser}
                >
                  {savingDB ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>

              {dbTestResult && (
                <div className={`p-3 rounded-lg ${dbTestResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-2">
                    {dbTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium">{dbTestResult.message}</span>
                      {dbTestResult.details && (
                        <pre className="text-xs mt-2 p-2 bg-background rounded overflow-auto">
                          {JSON.stringify(dbTestResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SCHEMA MANAGEMENT TAB ==================== */}
        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Schema Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Default Schema</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy the default Sally TSM database schema with sample data
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeployDefaultSchema}
                    disabled={deployingSchema}
                  >
                    {deployingSchema ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Deploy Default Schema
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleDownloadSchema}
                    disabled={downloadingSchema}
                    variant="outline"
                  >
                    {downloadingSchema ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Schema SQL
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                {/* Custom Schema Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Custom Schema</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload and deploy your own database schema
                  </p>

                  <div className="space-y-2">
                    <Label>Upload Schema File (.sql)</Label>
                    <Input
                      type="file"
                      accept=".sql"
                      onChange={handleSchemaFileUpload}
                    />
                    {schemaFile && (
                      <p className="text-sm text-green-600">
                        ✅ {schemaFile.name} loaded
                      </p>
                    )}
                  </div>

                  {schemaText && (
                    <div className="space-y-2">
                      <Label>Schema Preview</Label>
                      <Textarea
                        value={schemaText}
                        onChange={(e) => setSchemaText(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeployCustomSchema}
                      disabled={deployingSchema || !schemaText}
                    >
                      {deployingSchema ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Deploy Custom Schema
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleViewCurrentSchema}
                      disabled={viewingSchema}
                      variant="outline"
                    >
                      {viewingSchema ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          View Current Schema
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== THEME SETTINGS TAB ==================== */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Theme</Label>
                <Select value={currentTheme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ background: theme.preview }}
                          />
                          <div>
                            <p className="font-medium">{theme.name}</p>
                            <p className="text-xs text-muted-foreground">{theme.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        currentTheme === theme.id
                          ? 'border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="w-full h-24 rounded-lg mb-2"
                        style={{ background: theme.preview }}
                      />
                      <p className="text-sm font-medium">{theme.name}</p>
                      {currentTheme === theme.id && (
                        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  💡 Theme changes apply immediately across the entire application.
                  Your selection is saved automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
