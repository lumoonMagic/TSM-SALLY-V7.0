import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  Brain, 
  TestTube, 
  Save, 
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export function ConfigurationCockpit() {
  const { config, updateConfig, updateTheme } = useApp();
  const { toast } = useToast();
  const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [dataModelFile, setDataModelFile] = useState<File | null>(null);

  const handleConfigSave = () => {
    toast({
      title: "Configuration Saved",
      description: "Your settings have been successfully updated.",
    });
  };

  const handleTestConnection = async () => {
    setTestConnection('testing');
    
    // Simulate connection test
    setTimeout(() => {
      if (config.databaseType === 'sqlite') {
        setTestConnection('success');
        toast({
          title: "Connection Successful",
          description: "SQLite database is ready and operational.",
        });
      } else {
        setTestConnection('error');
        toast({
          title: "Connection Failed",
          description: "Please check your database configuration.",
          variant: "destructive",
        });
      }
    }, 2000);
  };

  const handleDataModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDataModelFile(file);
      toast({
        title: "Data Model Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const sampleDataModel = {
    tables: [
      {
        name: 'sites',
        columns: [
          { name: 'id', type: 'VARCHAR(50)', primary: true },
          { name: 'name', type: 'VARCHAR(255)' },
          { name: 'location', type: 'VARCHAR(255)' },
          { name: 'status', type: 'VARCHAR(50)' },
          { name: 'investigator', type: 'VARCHAR(255)' },
          { name: 'enrollment_target', type: 'INTEGER' },
          { name: 'current_enrollment', type: 'INTEGER' },
          { name: 'last_shipment', type: 'DATE' }
        ]
      },
      {
        name: 'inventory',
        columns: [
          { name: 'id', type: 'VARCHAR(50)', primary: true },
          { name: 'site_id', type: 'VARCHAR(50)', foreign: 'sites.id' },
          { name: 'product_name', type: 'VARCHAR(255)' },
          { name: 'batch_number', type: 'VARCHAR(100)' },
          { name: 'quantity', type: 'INTEGER' },
          { name: 'expiry_date', type: 'DATE' },
          { name: 'status', type: 'VARCHAR(50)' },
          { name: 'temperature_range', type: 'VARCHAR(50)' },
          { name: 'last_updated', type: 'TIMESTAMP' }
        ]
      },
      {
        name: 'shipments',
        columns: [
          { name: 'id', type: 'VARCHAR(50)', primary: true },
          { name: 'site_id', type: 'VARCHAR(50)', foreign: 'sites.id' },
          { name: 'tracking_number', type: 'VARCHAR(100)' },
          { name: 'status', type: 'VARCHAR(50)' },
          { name: 'shipped_date', type: 'DATE' },
          { name: 'expected_delivery', type: 'DATE' },
          { name: 'actual_delivery', type: 'DATE' },
          { name: 'contents', type: 'TEXT' },
          { name: 'priority', type: 'VARCHAR(50)' },
          { name: 'vendor', type: 'VARCHAR(255)' }
        ]
      }
    ]
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-4 max-w-none w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-green-400" />
        <h1 className="text-2xl font-bold text-white">Configuration Cockpit</h1>
      </div>

      <Tabs defaultValue="llm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
          <TabsTrigger value="llm" className="data-[state=active]:bg-green-600">
            <Brain className="h-4 w-4 mr-2" />
            LLM Configuration
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-green-600">
            <Database className="h-4 w-4 mr-2" />
            Database Setup
          </TabsTrigger>
          <TabsTrigger value="datamodel" className="data-[state=active]:bg-green-600">
            <TestTube className="h-4 w-4 mr-2" />
            Data Model
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-green-600">
            <Settings className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-green-600">
            <Settings className="h-4 w-4 mr-2" />
            Email Settings
          </TabsTrigger>
        </TabsList>

        {/* LLM Configuration */}
        <TabsContent value="llm" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-400" />
                Large Language Model Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-provider" className="text-slate-300">LLM Provider</Label>
                  <Select 
                    value={config.llmProvider} 
                    onValueChange={(value: 'openai' | 'anthropic' | 'gemini' | 'local') => 
                      updateConfig({ llmProvider: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="local">Local Model (Demo Mode)</SelectItem>
                      <SelectItem value="openai">OpenAI GPT</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="llm-key" className="text-slate-300">API Key</Label>
                  <Input
                    id="llm-key"
                    type="password"
                    placeholder={config.llmProvider === 'local' ? 'Not required for demo mode' : 'Enter your API key'}
                    value={config.llmApiKey}
                    onChange={(e) => updateConfig({ llmApiKey: e.target.value })}
                    disabled={config.llmProvider === 'local'}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-medium mb-1">Demo Mode Active</p>
                    <p>Currently using local processing for demonstration. Connect your preferred LLM provider for enhanced AI capabilities and real-time query processing.</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save LLM Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Configuration */}
        <TabsContent value="database" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                Database Connection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-type" className="text-slate-300">Database Type</Label>
                <Select 
                  value={config.databaseType} 
                  onValueChange={(value: 'sqlite' | 'postgres' | 'mysql' | 'mssql') => 
                    updateConfig({ databaseType: value })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="sqlite">SQLite (Demo Mode)</SelectItem>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mssql">Microsoft SQL Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.databaseType !== 'sqlite' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="db-host" className="text-slate-300">Host</Label>
                    <Input
                      id="db-host"
                      placeholder="localhost"
                      value={config.databaseConfig.host || ''}
                      onChange={(e) => updateConfig({ 
                        databaseConfig: { ...config.databaseConfig, host: e.target.value }
                      })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-port" className="text-slate-300">Port</Label>
                    <Input
                      id="db-port"
                      type="number"
                      placeholder="5432"
                      value={config.databaseConfig.port || ''}
                      onChange={(e) => updateConfig({ 
                        databaseConfig: { ...config.databaseConfig, port: parseInt(e.target.value) }
                      })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-name" className="text-slate-300">Database Name</Label>
                    <Input
                      id="db-name"
                      placeholder="tsm_database"
                      value={config.databaseConfig.database || ''}
                      onChange={(e) => updateConfig({ 
                        databaseConfig: { ...config.databaseConfig, database: e.target.value }
                      })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-username" className="text-slate-300">Username</Label>
                    <Input
                      id="db-username"
                      placeholder="username"
                      value={config.databaseConfig.username || ''}
                      onChange={(e) => updateConfig({ 
                        databaseConfig: { ...config.databaseConfig, username: e.target.value }
                      })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="db-password" className="text-slate-300">Password</Label>
                    <Input
                      id="db-password"
                      type="password"
                      placeholder="password"
                      value={config.databaseConfig.password || ''}
                      onChange={(e) => updateConfig({ 
                        databaseConfig: { ...config.databaseConfig, password: e.target.value }
                      })}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              )}

              {config.databaseType === 'sqlite' && (
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-medium mb-1">Demo Mode Active</p>
                      <p>Using SQLite with pre-loaded clinical supply chain data. Perfect for testing and demonstration purposes.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestConnection}
                  disabled={testConnection === 'testing'}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  {testConnection === 'testing' ? (
                    <>Testing...</>
                  ) : testConnection === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      Connected
                    </>
                  ) : testConnection === 'error' ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
                      Test Connection
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>

                <Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Database Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Model */}
        <TabsContent value="datamodel" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TestTube className="h-5 w-5 text-green-400" />
                Data Model Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="data-model-upload" className="text-slate-300 mb-2 block">
                    Upload Custom Data Model
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="data-model-upload"
                      type="file"
                      accept=".sql,.json,.xml"
                      onChange={handleDataModelUpload}
                      className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                    />
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Supported formats: SQL, JSON, XML
                  </p>
                </div>

                {dataModelFile && (
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-sm text-slate-300">
                      <strong>Uploaded:</strong> {dataModelFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Current Data Model</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                      <Download className="h-4 w-4 mr-2" />
                      Download Schema
                    </Button>
                    <Badge variant="outline" className="border-green-600 text-green-400">
                      SQLite Demo
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {sampleDataModel.tables.map((table) => (
                    <Card key={table.name} className="bg-slate-700/50 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-base flex items-center gap-2">
                          <Database className="h-4 w-4 text-green-400" />
                          {table.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-600">
                                <th className="text-left py-2 text-slate-300">Column</th>
                                <th className="text-left py-2 text-slate-300">Type</th>
                                <th className="text-left py-2 text-slate-300">Constraints</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.columns.map((column) => (
                                <tr key={column.name} className="border-b border-slate-700/50">
                                  <td className="py-2 text-slate-200 font-medium">{column.name}</td>
                                  <td className="py-2 text-slate-300">{column.type}</td>
                                  <td className="py-2">
                                    <div className="flex gap-1">
                                      {column.primary && (
                                        <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">
                                          PRIMARY KEY
                                        </Badge>
                                      )}
                                      {column.foreign && (
                                        <Badge variant="outline" className="text-xs border-purple-600 text-purple-400">
                                          FK: {column.foreign}
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="bg-green-600 hover:bg-green-700">
                  Deploy to Database
                </Button>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  Validate Schema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Configuration */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-400" />
                Theme & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Theme</Label>
                <Select 
                  value={config.theme} 
                  onValueChange={(value: 'dark-green' | 'blue-white' | 'black-yellow') => {
                    updateConfig({ theme: value });
                    updateTheme(value);
                  }}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark-green">Dark Green (Default)</SelectItem>
                    <SelectItem value="blue-white">Blue & White</SelectItem>
                    <SelectItem value="black-yellow">Black & Yellow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-400" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emailEnabled"
                  checked={config.emailConfig.enabled}
                  onChange={(e) => updateConfig({
                    emailConfig: { ...config.emailConfig, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
                <Label htmlFor="emailEnabled" className="text-slate-300">
                  Enable direct email sending from the application
                </Label>
              </div>

              {config.emailConfig.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-slate-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">SMTP Host</Label>
                      <Input
                        value={config.emailConfig.smtpHost}
                        onChange={(e) => updateConfig({
                          emailConfig: { ...config.emailConfig, smtpHost: e.target.value }
                        })}
                        placeholder="smtp.gmail.com"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">SMTP Port</Label>
                      <Input
                        type="number"
                        value={config.emailConfig.smtpPort}
                        onChange={(e) => updateConfig({
                          emailConfig: { ...config.emailConfig, smtpPort: parseInt(e.target.value) }
                        })}
                        placeholder="587"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">From Email</Label>
                    <Input
                      value={config.emailConfig.fromEmail}
                      onChange={(e) => updateConfig({
                        emailConfig: { ...config.emailConfig, fromEmail: e.target.value }
                      })}
                      placeholder="sally@company.com"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}