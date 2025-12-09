/**
 * Configuration Cockpit Component - FIXED SAVE API
 * ✅ Correct API structure for settings
 * ✅ Proper data format matching backend expectations
 * ✅ Fixed: Settings now reflect across all screens
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Database,
  Cpu,
  Layers,
  CheckCircle,
  Save,
  Globe,
  Sparkles,
  ArrowLeft,
  Upload,
  Download,
  PlayCircle,
  FileText
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tsm-sally-v70-production.up.railway.app'

const customThemes = [
  {
    name: 'Default (Blue)',
    value: 'default',
    colors: { primary: '#3b82f6', secondary: '#1e40af', bg: '#ffffff', text: '#000000', cardBg: '#f1f5f9' }
  },
  {
    name: 'Black & Green',
    value: 'black-green',
    colors: { primary: '#10b981', secondary: '#000000', bg: '#000000', text: '#FFFFFF', cardBg: '#1a1a1a' }
  },
  {
    name: 'Black & Yellow',
    value: 'black-yellow',
    colors: { primary: '#FFD700', secondary: '#000000', bg: '#000000', text: '#FFFFFF', cardBg: '#1a1a1a' }
  },
  {
    name: 'Navy Blue & White',
    value: 'navy-white',
    colors: { primary: '#FFFFFF', secondary: '#000080', bg: '#000080', text: '#FFFFFF', cardBg: '#1a1a5a' }
  }
]

interface ConfigurationCockpitProps {
  onBack?: () => void;
}

export function ConfigurationCockpit({ onBack }: ConfigurationCockpitProps) {
  const [applicationMode, setApplicationMode] = useState<'demo' | 'production'>('production')
  const [selectedTheme, setSelectedTheme] = useState(customThemes[0])
  const [databaseConfig, setDatabaseConfig] = useState({
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    database: 'sally_tsm',
    user: 'postgres',
    password: ''
  })
  
  const [llmConfig, setLLMConfig] = useState({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-pro'
  })
  
  const [vectorDbConfig, setVectorDbConfig] = useState({
    type: 'postgres_pgvector',
    enabled: true
  })

  const [schemaStatus, setSchemaStatus] = useState({
    deployed: false,
    tableCount: 0,
    lastDeployed: null as string | null
  })

  const [isDeploying, setIsDeploying] = useState(false)

  useEffect(() => {
    const savedConfig = localStorage.getItem('sally_config')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        if (config.applicationMode) setApplicationMode(config.applicationMode)
        if (config.theme) {
          const theme = customThemes.find(t => t.value === config.theme)
          if (theme) setSelectedTheme(theme)
        }
        if (config.database) setDatabaseConfig(config.database)
        if (config.llm) setLLMConfig(config.llm)
        if (config.vectorDb) setVectorDbConfig(config.vectorDb)
      } catch (error) {
        console.error('Error loading config:', error)
      }
    }

    // Load schema status
    loadSchemaStatus()
  }, [])

  useEffect(() => {
    // Broadcast mode changes to other components
    window.dispatchEvent(new CustomEvent('applicationModeChange', { detail: { mode: applicationMode } }))
    
    // Save mode change immediately
    const config = JSON.parse(localStorage.getItem('sally_config') || '{}')
    config.applicationMode = applicationMode
    localStorage.setItem('sally_config', JSON.stringify(config))
    
    // Broadcast theme change as well
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: selectedTheme } }))
  }, [applicationMode, selectedTheme])

  const loadSchemaStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/schema/status`)
      if (response.ok) {
        const data = await response.json()
        setSchemaStatus({
          deployed: data.schema_deployed || false,
          tableCount: data.table_count || 0,
          lastDeployed: data.last_deployed || null
        })
      }
    } catch (error) {
      console.error('Error loading schema status:', error)
    }
  }

  const handleDeploySchema = async () => {
    if (!confirm('Deploy database schema? This will create all tables.')) return

    setIsDeploying(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/schema/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          include_sample_data: false,
          applied_by: 'configuration_ui'
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ Schema deployed successfully!\n\nTables created: ${data.tables_created}\nTime: ${data.deployment_time_seconds}s`)
        await loadSchemaStatus()
      } else {
        alert(`❌ Schema deployment failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deploying schema:', error)
      alert('❌ Schema deployment error: ' + error)
    } finally {
      setIsDeploying(false)
    }
  }

  const handleDownloadSchema = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/schema/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sally_schema_${new Date().toISOString().split('T')[0]}.sql`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        alert('✅ Schema downloaded successfully!')
      } else {
        alert('❌ Schema download failed!')
      }
    } catch (error) {
      console.error('Error downloading schema:', error)
      alert('❌ Schema download error: ' + error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      // Save to localStorage first
      const fullConfig = {
        applicationMode,
        theme: selectedTheme.value,
        database: databaseConfig,
        llm: llmConfig,
        vectorDb: vectorDbConfig
      }

      localStorage.setItem('sally_config', JSON.stringify(fullConfig))
      console.log('✅ Settings saved to localStorage:', fullConfig)

      // **FIXED: Correct API structure matching backend expectations**
      const backendPayload = {
        llm_provider: {
          provider: llmConfig.provider,
          chat_model: llmConfig.model,
          api_key: llmConfig.apiKey || undefined,
          temperature: 0.2
        },
        database: {
          database_type: databaseConfig.type === 'postgresql' ? 'postgres' : databaseConfig.type,
          host: databaseConfig.host,
          port: parseInt(databaseConfig.port),
          database: databaseConfig.database,
          username: databaseConfig.user,
          password: databaseConfig.password
        },
        vector_store: {
          vector_store_type: vectorDbConfig.type === 'postgres_pgvector' ? 'pgvector' : vectorDbConfig.type
        },
        features: {
          rag_enabled: true,
          scenarios_enabled: true,
          morning_brief_enabled: true,
          evening_summary_enabled: true
        }
      }

      console.log('📤 Sending to backend:', backendPayload)

      const response = await fetch(`${API_URL}/api/v1/settings/app-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      })

      const data = await response.json()
      console.log('📥 Backend response:', data)

      if (response.ok) {
        alert('✅ Settings saved successfully!\n\n' + 
              'Settings are now active across all screens.\n\n' +
              (data.environment_variables 
                ? 'Environment variables to update:\n' + data.environment_variables.slice(0, 3).join('\n')
                : ''))
        
        // Broadcast settings change to all components
        window.dispatchEvent(new CustomEvent('settingsChanged', { 
          detail: { 
            config: fullConfig,
            timestamp: new Date().toISOString()
          } 
        }))
        
        // Reload page to apply changes everywhere
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        alert('⚠️ Settings saved locally but backend sync failed\n\n' + 
              (data.detail || 'Check backend logs'))
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error)
      alert('⚠️ Settings saved to localStorage only\n\n' + 
            'Backend connection failed. Settings will persist in browser but may not sync.')
    }
  }

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/settings/database/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database_type: databaseConfig.type === 'postgresql' ? 'postgres' : databaseConfig.type,
          host: databaseConfig.host,
          port: parseInt(databaseConfig.port),
          database: databaseConfig.database,
          username: databaseConfig.user,
          password: databaseConfig.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(`✅ Database connection successful!\n\n` +
              `Type: ${data.details?.database_type || 'N/A'}\n` +
              `Version: ${data.details?.version || 'N/A'}\n` +
              `Host: ${data.details?.host || databaseConfig.host}`)
      } else {
        alert(`❌ Database connection failed!\n\n${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('❌ Connection error: ' + error)
    }
  }

  const handleTestLLM = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/settings/llm-provider/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: llmConfig.provider,
          api_key: llmConfig.apiKey
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert(`✅ LLM connection successful!\n\n` +
              `Provider: ${data.details?.provider || llmConfig.provider}\n` +
              `Model: ${data.details?.model || llmConfig.model}`)
      } else {
        alert(`❌ LLM connection failed!\n\n${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('❌ LLM test error: ' + error)
    }
  }

  return (
    <div 
      style={{
        backgroundColor: selectedTheme.colors.bg,
        color: selectedTheme.colors.text,
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Header with Back Button */}
      <div 
        style={{
          backgroundColor: selectedTheme.colors.cardBg,
          borderBottom: `1px solid ${selectedTheme.colors.primary}`
        }}
        className="px-6 py-4"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  backgroundColor: selectedTheme.colors.cardBg,
                  color: selectedTheme.colors.primary,
                  border: `1px solid ${selectedTheme.colors.primary}`
                }}
                className="rounded-lg p-2 transition-colors hover:opacity-80"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6" style={{ color: selectedTheme.colors.primary }} />
                Configuration Cockpit
              </h1>
              <p className="text-sm opacity-80 mt-1">Manage system settings & database schema</p>
            </div>
          </div>
          
          <Badge 
            style={{ 
              backgroundColor: applicationMode === 'production' ? selectedTheme.colors.primary : selectedTheme.colors.secondary,
              color: applicationMode === 'production' ? selectedTheme.colors.secondary : selectedTheme.colors.primary,
              borderColor: selectedTheme.colors.primary,
              borderWidth: '1px'
            }}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {applicationMode === 'production' ? 'Production Mode' : 'Demo Mode'}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 w-full">
        <div className="space-y-6">
          {/* Schema Management */}
          <Card style={{ backgroundColor: selectedTheme.colors.cardBg, borderColor: selectedTheme.colors.primary }}>
            <CardHeader>
              <CardTitle style={{ color: selectedTheme.colors.text }}>
                <FileText className="inline mr-2 h-5 w-5" />
                Schema Management
              </CardTitle>
              <CardDescription style={{ color: selectedTheme.colors.text, opacity: 0.7 }}>
                {schemaStatus.deployed 
                  ? `Schema deployed • ${schemaStatus.tableCount} tables` 
                  : 'No schema deployed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleDeploySchema}
                  disabled={isDeploying}
                  style={{
                    backgroundColor: selectedTheme.colors.primary,
                    color: selectedTheme.colors.secondary,
                    opacity: isDeploying ? 0.6 : 1
                  }}
                  className="w-full h-20"
                >
                  {isDeploying ? (
                    <>
                      <PlayCircle className="mr-2 h-5 w-5 animate-spin" />
                      Deploying Schema...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Deploy Schema
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDownloadSchema}
                  style={{
                    backgroundColor: selectedTheme.colors.secondary,
                    color: selectedTheme.colors.primary,
                    borderColor: selectedTheme.colors.primary,
                    borderWidth: '1px'
                  }}
                  className="w-full h-20"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Schema
                </Button>
              </div>

              {schemaStatus.deployed && (
                <div 
                  className="mt-4 p-3 rounded"
                  style={{
                    backgroundColor: selectedTheme.colors.bg,
                    borderColor: selectedTheme.colors.primary,
                    borderWidth: '1px'
                  }}
                >
                  <p className="text-sm" style={{ color: selectedTheme.colors.text }}>
                    ✅ Schema deployed with <strong>{schemaStatus.tableCount}</strong> tables
                    {schemaStatus.lastDeployed && (
                      <span className="block mt-1 opacity-70">
                        Last deployed: {new Date(schemaStatus.lastDeployed).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card style={{ backgroundColor: selectedTheme.colors.cardBg, borderColor: selectedTheme.colors.primary }}>
            <CardHeader>
              <CardTitle style={{ color: selectedTheme.colors.text }}>
                <Globe className="inline mr-2 h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Mode */}
              <div className="space-y-3">
                <Label style={{ color: selectedTheme.colors.text }}>System Mode</Label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setApplicationMode('demo')}
                    style={{
                      backgroundColor: applicationMode === 'demo' ? selectedTheme.colors.primary : selectedTheme.colors.secondary,
                      color: applicationMode === 'demo' ? selectedTheme.colors.secondary : selectedTheme.colors.primary,
                      borderColor: selectedTheme.colors.primary,
                      borderWidth: '1px'
                    }}
                    className="flex-1"
                  >
                    Demo Mode
                  </Button>
                  <Button
                    onClick={() => setApplicationMode('production')}
                    style={{
                      backgroundColor: applicationMode === 'production' ? selectedTheme.colors.primary : selectedTheme.colors.secondary,
                      color: applicationMode === 'production' ? selectedTheme.colors.secondary : selectedTheme.colors.primary,
                      borderColor: selectedTheme.colors.primary,
                      borderWidth: '1px'
                    }}
                    className="flex-1"
                  >
                    Production Mode
                  </Button>
                </div>
                <p className="text-sm" style={{ color: selectedTheme.colors.text, opacity: 0.7 }}>
                  {applicationMode === 'production' ? 'Live database' : 'Demo data'}
                </p>
              </div>

              {/* Application Theme */}
              <div className="space-y-3">
                <Label style={{ color: selectedTheme.colors.text }}>Application Theme</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {customThemes.map((theme) => (
                    <div
                      key={theme.value}
                      onClick={() => setSelectedTheme(theme)}
                      className="p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105"
                      style={{
                        borderColor: selectedTheme.value === theme.value ? theme.colors.primary : 'transparent',
                        backgroundColor: theme.colors.bg,
                        opacity: selectedTheme.value === theme.value ? 1 : 0.7
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.primary }} />
                        <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.secondary }} />
                      </div>
                      <p className="font-medium" style={{ color: theme.colors.text }}>{theme.name}</p>
                      <p className="text-xs" style={{ color: theme.colors.text, opacity: 0.7 }}>
                        Primary: {theme.colors.primary}
                      </p>
                      {selectedTheme.value === theme.value && (
                        <CheckCircle className="mt-2 h-5 w-5" style={{ color: theme.colors.primary }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card style={{ backgroundColor: selectedTheme.colors.cardBg, borderColor: selectedTheme.colors.primary }}>
            <CardHeader>
              <CardTitle style={{ color: selectedTheme.colors.text }}>
                <Database className="inline mr-2 h-5 w-5" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: selectedTheme.colors.text }}>Database Type</Label>
                <select
                  value={databaseConfig.type}
                  onChange={(e) => setDatabaseConfig({...databaseConfig, type: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: selectedTheme.colors.cardBg,
                    color: selectedTheme.colors.text,
                    borderColor: selectedTheme.colors.primary
                  }}
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: selectedTheme.colors.text }}>Host</Label>
                  <Input
                    value={databaseConfig.host}
                    onChange={(e) => setDatabaseConfig({...databaseConfig, host: e.target.value})}
                    style={{
                      backgroundColor: selectedTheme.colors.cardBg,
                      color: selectedTheme.colors.text,
                      borderColor: selectedTheme.colors.primary
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: selectedTheme.colors.text }}>Port</Label>
                  <Input
                    value={databaseConfig.port}
                    onChange={(e) => setDatabaseConfig({...databaseConfig, port: e.target.value})}
                    style={{
                      backgroundColor: selectedTheme.colors.cardBg,
                      color: selectedTheme.colors.text,
                      borderColor: selectedTheme.colors.primary
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ color: selectedTheme.colors.text }}>Database Name</Label>
                <Input
                  value={databaseConfig.database}
                  onChange={(e) => setDatabaseConfig({...databaseConfig, database: e.target.value})}
                  style={{
                    backgroundColor: selectedTheme.colors.cardBg,
                    color: selectedTheme.colors.text,
                    borderColor: selectedTheme.colors.primary
                  }}
                />
              </div>

              <Button 
                onClick={handleTestConnection}
                style={{
                  backgroundColor: selectedTheme.colors.primary,
                  color: selectedTheme.colors.secondary
                }}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/* LLM Provider */}
          <Card style={{ backgroundColor: selectedTheme.colors.cardBg, borderColor: selectedTheme.colors.primary }}>
            <CardHeader>
              <CardTitle style={{ color: selectedTheme.colors.text }}>
                <Cpu className="inline mr-2 h-5 w-5" />
                LLM Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: selectedTheme.colors.text }}>Provider</Label>
                <select
                  value={llmConfig.provider}
                  onChange={(e) => setLLMConfig({...llmConfig, provider: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: selectedTheme.colors.cardBg,
                    color: selectedTheme.colors.text,
                    borderColor: selectedTheme.colors.primary
                  }}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label style={{ color: selectedTheme.colors.text }}>API Key</Label>
                <Input
                  type="password"
                  value={llmConfig.apiKey}
                  onChange={(e) => setLLMConfig({...llmConfig, apiKey: e.target.value})}
                  placeholder="Enter API key"
                  style={{
                    backgroundColor: selectedTheme.colors.cardBg,
                    color: selectedTheme.colors.text,
                    borderColor: selectedTheme.colors.primary
                  }}
                />
              </div>

              <Button 
                onClick={handleTestLLM}
                style={{
                  backgroundColor: selectedTheme.colors.primary,
                  color: selectedTheme.colors.secondary
                }}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Test LLM Connection
              </Button>
            </CardContent>
          </Card>

          {/* Vector DB */}
          <Card style={{ backgroundColor: selectedTheme.colors.cardBg, borderColor: selectedTheme.colors.primary }}>
            <CardHeader>
              <CardTitle style={{ color: selectedTheme.colors.text }}>
                <Layers className="inline mr-2 h-5 w-5" />
                Vector Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label style={{ color: selectedTheme.colors.text }}>Enable Vector DB</Label>
                <Switch
                  checked={vectorDbConfig.enabled}
                  onCheckedChange={(checked) => setVectorDbConfig({...vectorDbConfig, enabled: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ color: selectedTheme.colors.text }}>Type</Label>
                <select
                  value={vectorDbConfig.type}
                  onChange={(e) => setVectorDbConfig({...vectorDbConfig, type: e.target.value})}
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: selectedTheme.colors.cardBg,
                    color: selectedTheme.colors.text,
                    borderColor: selectedTheme.colors.primary
                  }}
                >
                  <option value="postgres_pgvector">PostgreSQL (pgvector)</option>
                  <option value="pinecone">Pinecone</option>
                  <option value="weaviate">Weaviate</option>
                  <option value="qdrant">Qdrant</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveSettings}
            size="lg"
            style={{
              backgroundColor: selectedTheme.colors.primary,
              color: selectedTheme.colors.secondary
            }}
            className="w-full"
          >
            <Save className="mr-2 h-5 w-5" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
