'use client';

/**
 * Configuration Cockpit Page - PRODUCTION READY
 * 
 * Comprehensive system configuration interface with:
 * - Production/Demo mode toggle
 * - Theme customization
 * - Database connection management
 * - LLM provider configuration
 * - Vector DB settings
 * - Schema deployment/download
 * - Settings persistence
 * - Real-time connection testing
 * 
 * API Endpoints:
 * - GET /api/v1/config/settings - Get current settings
 * - POST /api/v1/config/settings - Save settings
 * - POST /api/v1/config/test-connection - Test database connection
 * - POST /api/v1/schema/deploy - Deploy default schema
 * - GET /api/v1/schema/download - Download schema SQL
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Brain,
  Palette,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  TestTube,
  Server,
  Key,
  Globe
} from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ConfigSettings {
  // System Mode
  mode: 'demo' | 'production';
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  
  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  
  // LLM Provider
  llm: {
    enabled: boolean;
    provider: 'gemini' | 'openai' | 'anthropic';
    model: string;
    apiKey: string;
    temperature: number;
  };
  
  // Vector Database
  vectorDb: {
    enabled: boolean;
    provider: 'pgvector' | 'pinecone' | 'weaviate';
    host?: string;
    apiKey?: string;
  };
  
  // Features
  features: {
    ragEnabled: boolean;
    analyticsEnabled: boolean;
    scenariosEnabled: boolean;
    exportEnabled: boolean;
  };
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function ConfigurationCockpitPage() {
  // State management
  const [settings, setSettings] = useState<ConfigSettings>({
    mode: 'production',
    theme: 'light',
    primaryColor: '#3b82f6',
    database: {
      host: 'localhost',
      port: 5432,
      name: 'sally_tsm',
      user: 'postgres',
      password: '',
      ssl: true
    },
    llm: {
      enabled: true,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      apiKey: '',
      temperature: 0.7
    },
    vectorDb: {
      enabled: true,
      provider: 'pgvector'
    },
    features: {
      ragEnabled: true,
      analyticsEnabled: true,
      scenariosEnabled: true,
      exportEnabled: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'database' | 'llm' | 'vector' | 'features'>('general');

  // API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tsm-sally-v70-production.up.railway.app';

  // ========== Load Settings ==========
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/config/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== Save Settings ==========
  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/config/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ========== Test Database Connection ==========
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/v1/config/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings.database),
      });

      const latency = Date.now() - startTime;
      const data = await response.json();

      setTestResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Connection successful' : 'Connection failed'),
        latency: response.ok ? latency : undefined
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  // ========== Deploy Default Schema ==========
  const deploySchema = async () => {
    if (!confirm('This will deploy the default SALLY TSM schema to the database. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schema/deploy`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Schema deployed successfully!');
      } else {
        throw new Error('Schema deployment failed');
      }
    } catch (err) {
      console.error('Deployment error:', err);
      alert('Failed to deploy schema');
    }
  };

  // ========== Download Schema ==========
  const downloadSchema = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/schema/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sally_tsm_schema.sql';
        link.click();
      } else {
        throw new Error('Schema download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download schema');
    }
  };

  // ========== Reset to Defaults ==========
  const resetToDefaults = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      loadSettings();
    }
  };

  // ========== Update Setting Helper ==========
  const updateSetting = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="h-10 w-10 text-blue-500" />
            Configuration Cockpit
          </h1>
          <p className="text-gray-600">Manage system settings, connections, and features</p>
        </div>

        {/* Save Success Banner */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-green-900 font-medium">Settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar: Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Settings Sections
              </h2>
              
              <div className="space-y-1">
                <button
                  onClick={() => setActiveSection('general')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeSection === 'general'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Globe className="h-5 w-5" />
                  General
                </button>
                
                <button
                  onClick={() => setActiveSection('database')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeSection === 'database'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Database className="h-5 w-5" />
                  Database
                </button>
                
                <button
                  onClick={() => setActiveSection('llm')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeSection === 'llm'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Brain className="h-5 w-5" />
                  LLM Provider
                </button>
                
                <button
                  onClick={() => setActiveSection('vector')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeSection === 'vector'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Server className="h-5 w-5" />
                  Vector DB
                </button>
                
                <button
                  onClick={() => setActiveSection('features')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeSection === 'features'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Palette className="h-5 w-5" />
                  Features
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full bg-blue-500 text-white font-medium py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save All
                </button>
                
                <button
                  onClick={resetToDefaults}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Right Content: Settings Panels */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              
              {/* General Settings */}
              {activeSection === 'general' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">General Settings</h2>
                  
                  {/* Mode Toggle */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      System Mode
                    </label>
                    <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                      <button
                        onClick={() => updateSetting(['mode'], 'demo')}
                        className={`px-6 py-3 rounded-md font-medium transition-all ${
                          settings.mode === 'demo'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Demo Mode
                      </button>
                      <button
                        onClick={() => updateSetting(['mode'], 'production')}
                        className={`px-6 py-3 rounded-md font-medium transition-all ${
                          settings.mode === 'production'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Production Mode
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {settings.mode === 'demo' 
                        ? 'Using sample data for demonstrations and testing'
                        : 'Connected to live database with real operational data'
                      }
                    </p>
                  </div>

                  {/* Theme */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Theme
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting(['theme'], e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting(['primaryColor'], e.target.value)}
                        className="h-12 w-24 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{settings.primaryColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Settings */}
              {activeSection === 'database' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Connection</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Host
                        </label>
                        <input
                          type="text"
                          value={settings.database.host}
                          onChange={(e) => updateSetting(['database', 'host'], e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={settings.database.port}
                          onChange={(e) => updateSetting(['database', 'port'], parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Database Name
                      </label>
                      <input
                        type="text"
                        value={settings.database.name}
                        onChange={(e) => updateSetting(['database', 'name'], e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User
                        </label>
                        <input
                          type="text"
                          value={settings.database.user}
                          onChange={(e) => updateSetting(['database', 'user'], e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={settings.database.password}
                          onChange={(e) => updateSetting(['database', 'password'], e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.database.ssl}
                        onChange={(e) => updateSetting(['database', 'ssl'], e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Use SSL Connection
                      </label>
                    </div>

                    {/* Test Connection */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={testConnection}
                        disabled={testing}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {testing ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Testing Connection...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-5 w-5" />
                            Test Database Connection
                          </>
                        )}
                      </button>

                      {testResult && (
                        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                          testResult.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          {testResult.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div>
                            <p className={`font-medium ${
                              testResult.success ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {testResult.message}
                            </p>
                            {testResult.latency && (
                              <p className="text-sm text-green-700 mt-1">
                                Latency: {testResult.latency}ms
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schema Management */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-4">Schema Management</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={deploySchema}
                          className="px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2 font-medium"
                        >
                          <Upload className="h-4 w-4" />
                          Deploy Schema
                        </button>
                        <button
                          onClick={downloadSchema}
                          className="px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Download Schema
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LLM Settings */}
              {activeSection === 'llm' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">LLM Provider Configuration</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.llm.enabled}
                        onChange={(e) => updateSetting(['llm', 'enabled'], e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Enable LLM Integration
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provider
                      </label>
                      <select
                        value={settings.llm.provider}
                        onChange={(e) => updateSetting(['llm', 'provider'], e.target.value)}
                        disabled={!settings.llm.enabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={settings.llm.model}
                        onChange={(e) => updateSetting(['llm', 'model'], e.target.value)}
                        disabled={!settings.llm.enabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="e.g., gemini-2.5-flash"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={settings.llm.apiKey}
                        onChange={(e) => updateSetting(['llm', 'apiKey'], e.target.value)}
                        disabled={!settings.llm.enabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="••••••••••••••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature: {settings.llm.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.llm.temperature}
                        onChange={(e) => updateSetting(['llm', 'temperature'], parseFloat(e.target.value))}
                        disabled={!settings.llm.enabled}
                        className="w-full disabled:opacity-50"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>More Focused</span>
                        <span>More Creative</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vector DB Settings */}
              {activeSection === 'vector' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Vector Database Configuration</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.vectorDb.enabled}
                        onChange={(e) => updateSetting(['vectorDb', 'enabled'], e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Enable Vector Database (for RAG)
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provider
                      </label>
                      <select
                        value={settings.vectorDb.provider}
                        onChange={(e) => updateSetting(['vectorDb', 'provider'], e.target.value)}
                        disabled={!settings.vectorDb.enabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="pgvector">pgvector (PostgreSQL Extension)</option>
                        <option value="pinecone">Pinecone</option>
                        <option value="weaviate">Weaviate</option>
                      </select>
                    </div>

                    {settings.vectorDb.provider !== 'pgvector' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Host/Endpoint
                          </label>
                          <input
                            type="text"
                            value={settings.vectorDb.host || ''}
                            onChange={(e) => updateSetting(['vectorDb', 'host'], e.target.value)}
                            disabled={!settings.vectorDb.enabled}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={settings.vectorDb.apiKey || ''}
                            onChange={(e) => updateSetting(['vectorDb', 'apiKey'], e.target.value)}
                            disabled={!settings.vectorDb.enabled}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            placeholder="••••••••••••••••••••"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Features Settings */}
              {activeSection === 'features' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Toggles</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">RAG (Retrieval-Augmented Generation)</h3>
                        <p className="text-sm text-gray-600 mt-1">Enhanced Q&A with context retrieval</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.features.ragEnabled}
                          onChange={(e) => updateSetting(['features', 'ragEnabled'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Analytics</h3>
                        <p className="text-sm text-gray-600 mt-1">Advanced analytics and forecasting</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.features.analyticsEnabled}
                          onChange={(e) => updateSetting(['features', 'analyticsEnabled'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Clinical Scenarios</h3>
                        <p className="text-sm text-gray-600 mt-1">12+ pre-built clinical trial scenarios</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.features.scenariosEnabled}
                          onChange={(e) => updateSetting(['features', 'scenariosEnabled'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Import/Export</h3>
                        <p className="text-sm text-gray-600 mt-1">Data import and export capabilities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.features.exportEnabled}
                          onChange={(e) => updateSetting(['features', 'exportEnabled'], e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
