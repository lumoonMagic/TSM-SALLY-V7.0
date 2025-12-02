import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  Brain, 
  TestTube, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

// ✅ Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

console.log('🌐 ConfigurationCockpit API_BASE_URL:', API_BASE_URL);

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export function ConfigurationCockpit() {
  const { config, updateConfig } = useApp();
  const { toast } = useToast();
  
  // Test connection state
  const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  
  // Database form fields
  const [dbType, setDbType] = useState<string>(config?.databaseType || 'postgres');
  const [dbHost, setDbHost] = useState<string>('postgres.railway.internal');
  const [dbPort, setDbPort] = useState<string>('5432');
  const [dbName, setDbName] = useState<string>('railway');
  const [dbUser, setDbUser] = useState<string>('postgres');
  const [dbPassword, setDbPassword] = useState<string>('');

  // ✅ REAL API call to test database connection
  const handleTestConnection = async () => {
    console.log('🔍 Testing database connection...');
    setTestConnection('testing');
    setTestResult(null);
    
    const url = `${API_BASE_URL}/api/v1/settings/database/test`;
    const requestBody = {
      database_type: dbType,
      host: dbHost,
      port: parseInt(dbPort),
      database: dbName,
      username: dbUser,
      password: dbPassword
    };
    
    console.log('📡 Request URL:', url);
    console.log('📤 Request body:', { ...requestBody, password: '***' });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 Response status:', response.status);
      const result: ConnectionTestResult = await response.json();
      console.log('📦 Response data:', result);
      
      setTestResult(result);
      
      if (result.success) {
        setTestConnection('success');
        toast({
          title: "✅ Connection Successful",
          description: result.message,
        });
      } else {
        setTestConnection('error');
        toast({
          title: "❌ Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Test connection error:', error);
      setTestConnection('error');
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message || error}`,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "❌ Connection Error",
        description: `Failed to connect: ${error.message || 'Network error'}`,
        variant: "destructive",
      });
    }
  };

  const handleConfigSave = () => {
    // Update config in context
    updateConfig({
      databaseType: dbType,
      // Add other config fields as needed
    });
    
    toast({
      title: "Configuration Saved",
      description: "Your settings have been successfully updated.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration Cockpit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure LLM, database, and system settings
          </p>
          <p className="text-xs text-blue-600 mt-1">
            🔗 API: {API_BASE_URL}
          </p>
        </div>
        <Badge variant={testConnection === 'success' ? 'default' : 'secondary'}>
          {testConnection === 'success' && '✅ Connected'}
          {testConnection === 'error' && '❌ Error'}
          {testConnection === 'idle' && '⚪ Not Tested'}
          {testConnection === 'testing' && '🔄 Testing...'}
        </Badge>
      </div>

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="llm">
            <Brain className="w-4 h-4 mr-2" />
            LLM
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Database Type */}
              <div className="space-y-2">
                <Label>Database Type</Label>
                <Select value={dbType} onValueChange={setDbType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqlite">SQLite (Development)</SelectItem>
                    <SelectItem value="postgres">PostgreSQL (Production)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PostgreSQL Configuration */}
              {dbType === 'postgres' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-host">Host</Label>
                      <Input
                        id="db-host"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="postgres.railway.internal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-port">Port</Label>
                      <Input
                        id="db-port"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="5432"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-name">Database Name</Label>
                    <Input
                      id="db-name"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="railway"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-user">Username</Label>
                      <Input
                        id="db-user"
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="postgres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="db-password">Password</Label>
                      <Input
                        id="db-password"
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Test Connection Button */}
              <div className="pt-4">
                <Button
                  onClick={handleTestConnection}
                  disabled={testConnection === 'testing'}
                  className="w-full"
                  variant={testConnection === 'success' ? 'default' : 'secondary'}
                >
                  {testConnection === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Database Connection
                    </>
                  )}
                </Button>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        testResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {testResult.message}
                      </p>
                      {testResult.details && (
                        <div className="mt-2 text-sm text-gray-600">
                          <pre className="bg-white p-2 rounded border overflow-auto max-h-64">
                            {JSON.stringify(testResult.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button onClick={handleConfigSave} className="w-full">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Tab */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                LLM configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                System settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
