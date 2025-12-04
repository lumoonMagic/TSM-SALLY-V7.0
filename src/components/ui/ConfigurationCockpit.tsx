/**
 * Configuration Cockpit Component
 * ✅ CORRECT EXPORT: export function ConfigurationCockpitPage()
 * ✅ FIXED: Theme colors apply to ENTIRE page (no white background)
 * ✅ FIXED: Full width layout
 * ✅ FIXED: Mode indicator syncs
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
  Sparkles
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tsm-sally-v70-production.up.railway.app'

const customThemes = [
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

// ✅ CORRECT EXPORT
export function ConfigurationCockpitPage() {
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
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('applicationModeChange', { detail: { mode: applicationMode } }))
    const config = JSON.parse(localStorage.getItem('sally_config') || '{}')
    config.applicationMode = applicationMode
    localStorage.setItem('sally_config', JSON.stringify(config))
  }, [applicationMode])

  const handleSaveSettings = async () => {
    try {
      const fullConfig = {
        applicationMode,
        theme: selectedTheme.value,
        database: databaseConfig,
        llm: llmConfig,
        vectorDb: vectorDbConfig
      }

      localStorage.setItem('sally_config', JSON.stringify(fullConfig))

      const response = await fetch(`${API_URL}/api/v1/settings/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig)
      })

      if (response.ok) {
        alert('✅ Settings saved successfully!')
      } else {
        alert('⚠️ Settings saved locally')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('⚠️ Settings saved locally')
    }
  }

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/health`)
      alert(response.ok ? '✅ Connection successful!' : '❌ Connection failed!')
    } catch (error) {
      alert('❌ Connection error: ' + error)
    }
  }

  // ✅ FIX: Apply theme to ENTIRE container
  return (
    <div 
      style={{
        backgroundColor: selectedTheme.colors.bg,
        color: selectedTheme.colors.text,
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Header */}
      <div 
        style={{
          backgroundColor: selectedTheme.colors.cardBg,
          borderBottom: `1px solid ${selectedTheme.colors.primary}`
        }}
        className="px-6 py-4"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" style={{ color: selectedTheme.colors.primary }} />
              Configuration Cockpit
            </h1>
            <p className="text-sm opacity-80 mt-1">Manage system settings</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
