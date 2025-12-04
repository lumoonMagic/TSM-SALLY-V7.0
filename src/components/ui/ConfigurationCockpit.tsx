'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, Database, Palette, Zap, Save, CheckCircle } from 'lucide-react';

// Theme configuration (standalone - no context needed)
interface ThemeColors {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
}

const THEMES: Record<string, ThemeColors> = {
  'default': {
    name: 'Default',
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    foreground: '#0f172a',
    accent: '#f59e0b',
    muted: '#f1f5f9',
    border: '#e2e8f0'
  },
  'black-green': {
    name: 'Black & Green',
    primary: '#10b981',
    secondary: '#059669',
    background: '#000000',
    foreground: '#10b981',
    accent: '#34d399',
    muted: '#064e3b',
    border: '#065f46'
  },
  'black-yellow': {
    name: 'Black & Yellow',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    background: '#000000',
    foreground: '#fbbf24',
    accent: '#fcd34d',
    muted: '#78350f',
    border: '#92400e'
  },
  'navy-white': {
    name: 'Navy Blue & White',
    primary: '#1e40af',
    secondary: '#3b82f6',
    background: '#0f172a',
    foreground: '#f8fafc',
    accent: '#60a5fa',
    muted: '#1e293b',
    border: '#334155'
  }
};

export function ConfigurationCockpitPage() {
  // Mode state
  const [isProductionMode, setIsProductionMode] = useState(false);
  
  // Theme state (local - no context)
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [themeColors, setThemeColors] = useState<ThemeColors>(THEMES['default']);
  
  // Database state
  const [databaseType, setDatabaseType] = useState('postgresql');
  const [databaseConfig, setDatabaseConfig] = useState({
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: ''
  });

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    const colors = THEMES[currentTheme] || THEMES['default'];
    setThemeColors(colors);
    
    // Apply CSS variables to root
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-foreground', colors.foreground);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-muted', colors.muted);
    root.style.setProperty('--color-border', colors.border);

    // Save to localStorage
    localStorage.setItem('sally-theme', currentTheme);
  }, [currentTheme]);

  const loadConfiguration = () => {
    try {
      // Load mode
      const savedMode = localStorage.getItem('sally-mode');
      setIsProductionMode(savedMode === 'production');

      // Load theme
      const savedTheme = localStorage.getItem('sally-theme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      }

      // Load database config
      const savedDbType = localStorage.getItem('sally-db-type');
      if (savedDbType) setDatabaseType(savedDbType);

      const savedDbConfig = localStorage.getItem('sally-db-config');
      if (savedDbConfig) {
        setDatabaseConfig(JSON.parse(savedDbConfig));
      }

      toast.success('Configuration loaded');
    } catch (error) {
      toast.error('Failed to load configuration');
    }
  };

  const saveConfiguration = () => {
    try {
      // Save mode
      localStorage.setItem('sally-mode', isProductionMode ? 'production' : 'demo');

      // Save theme
      localStorage.setItem('sally-theme', currentTheme);

      // Save database config
      localStorage.setItem('sally-db-type', databaseType);
      localStorage.setItem('sally-db-config', JSON.stringify(databaseConfig));

      toast.success('Configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleModeToggle = (checked: boolean) => {
    setIsProductionMode(checked);
    toast.info(`Switched to ${checked ? 'Production' : 'Demo'} Mode`);
  };

  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    toast.success(`Theme changed to ${THEMES[newTheme]?.name || 'Default'}`);
  };

  const handleDatabaseConfigChange = (field: string, value: string) => {
    setDatabaseConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div 
      className="min-h-screen w-full p-6"
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" style={{ color: themeColors.primary }} />
              Configuration Cockpit
            </h1>
            <p className="mt-1" style={{ color: themeColors.secondary }}>
              Manage system configuration and preferences
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={isProductionMode ? 'default' : 'secondary'}
              style={{
                backgroundColor: isProductionMode ? themeColors.primary : themeColors.muted,
                color: isProductionMode ? themeColors.background : themeColors.foreground
              }}
            >
              {isProductionMode ? '🔴 Production Mode' : '🟢 Demo Mode'}
            </Badge>
            <Button 
              onClick={saveConfiguration}
              style={{
                backgroundColor: themeColors.primary,
                color: themeColors.background
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save All
            </Button>
          </div>
        </div>

        {/* Main Configuration Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList style={{ backgroundColor: themeColors.muted }}>
            <TabsTrigger value="general">
              <Zap className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="mr-2 h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="mr-2 h-4 w-4" />
              Theme
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card style={{ 
              backgroundColor: themeColors.background,
              borderColor: themeColors.border 
            }}>
              <CardHeader>
                <CardTitle style={{ color: themeColors.foreground }}>
                  Application Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label style={{ color: themeColors.foreground }}>
                      Production Mode
                    </Label>
                    <p className="text-sm" style={{ color: themeColors.secondary }}>
                      {isProductionMode 
                        ? 'Using live database and real data' 
                        : 'Using demo data for testing'}
                    </p>
                  </div>
                  <Switch
                    checked={isProductionMode}
                    onCheckedChange={handleModeToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database" className="space-y-4">
            <Card style={{ 
              backgroundColor: themeColors.background,
              borderColor: themeColors.border 
            }}>
              <CardHeader>
                <CardTitle style={{ color: themeColors.foreground }}>
                  Database Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Database Type */}
                <div className="space-y-2">
                  <Label style={{ color: themeColors.foreground }}>
                    Database Type
                  </Label>
                  <Select value={databaseType} onValueChange={setDatabaseType}>
                    <SelectTrigger style={{ 
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.foreground
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Connection Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label style={{ color: themeColors.foreground }}>Host</Label>
                    <Input
                      value={databaseConfig.host}
                      onChange={(e) => handleDatabaseConfigChange('host', e.target.value)}
                      placeholder="localhost"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.foreground
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: themeColors.foreground }}>Port</Label>
                    <Input
                      value={databaseConfig.port}
                      onChange={(e) => handleDatabaseConfigChange('port', e.target.value)}
                      placeholder="5432"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.foreground
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label style={{ color: themeColors.foreground }}>Database Name</Label>
                  <Input
                    value={databaseConfig.database}
                    onChange={(e) => handleDatabaseConfigChange('database', e.target.value)}
                    placeholder="sally_tsm"
                    style={{ 
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.foreground
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label style={{ color: themeColors.foreground }}>Username</Label>
                    <Input
                      value={databaseConfig.username}
                      onChange={(e) => handleDatabaseConfigChange('username', e.target.value)}
                      placeholder="admin"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.foreground
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: themeColors.foreground }}>Password</Label>
                    <Input
                      type="password"
                      value={databaseConfig.password}
                      onChange={(e) => handleDatabaseConfigChange('password', e.target.value)}
                      placeholder="••••••••"
                      style={{ 
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.foreground
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-4">
            <Card style={{ 
              backgroundColor: themeColors.background,
              borderColor: themeColors.border 
            }}>
              <CardHeader>
                <CardTitle style={{ color: themeColors.foreground }}>
                  Theme Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(THEMES).map(([key, themeConfig]) => (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className="relative p-6 rounded-lg border-2 transition-all hover:scale-105"
                      style={{
                        backgroundColor: themeConfig.background,
                        borderColor: currentTheme === key ? themeColors.primary : themeConfig.border,
                        boxShadow: currentTheme === key ? `0 0 0 2px ${themeColors.primary}` : 'none'
                      }}
                    >
                      {currentTheme === key && (
                        <CheckCircle 
                          className="absolute top-2 right-2 h-6 w-6"
                          style={{ color: themeColors.primary }}
                        />
                      )}
                      <div className="space-y-3">
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: themeConfig.foreground }}
                        >
                          {themeConfig.name}
                        </h3>
                        <div className="flex gap-2">
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: themeConfig.primary }}
                          />
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: themeConfig.secondary }}
                          />
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: themeConfig.accent }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
