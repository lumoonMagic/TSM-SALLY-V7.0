import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '@/lib/database';
import { AIQueryService } from '@/lib/aiService';

interface AppContextType {
  isInitialized: boolean;
  aiService: AIQueryService | null;
  currentUser: {
    name: string;
    role: string;
    avatar: string;
  };
  config: {
    llmProvider: 'openai' | 'anthropic' | 'gemini' | 'local';
    llmApiKey: string;
    databaseType: 'sqlite' | 'postgres' | 'mysql' | 'mssql';
    databaseConfig: {
      host?: string;
      port?: number;
      database?: string;
      username?: string;
      password?: string;
    };
    theme: 'dark-green' | 'blue-white' | 'black-yellow';
    emailConfig: {
      enabled: boolean;
      smtpHost: string;
      smtpPort: number;
      username: string;
      password: string;
      fromEmail: string;
    };
  };
  updateConfig: (newConfig: Partial<AppContextType['config']>) => void;
  updateTheme: (theme: 'dark-green' | 'blue-white' | 'black-yellow') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [aiService, setAiService] = useState<AIQueryService | null>(null);
  // Load config from localStorage or use defaults
  const loadConfigFromStorage = (): AppContextType['config'] => {
    try {
      const savedConfig = localStorage.getItem('sally-tsm-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return {
          llmProvider: parsed.llmProvider || 'local',
          llmApiKey: parsed.llmApiKey || '',
          databaseType: parsed.databaseType || 'sqlite',
          databaseConfig: parsed.databaseConfig || {},
          theme: parsed.theme || 'dark-green',
          emailConfig: {
            enabled: parsed.emailConfig?.enabled || false,
            smtpHost: parsed.emailConfig?.smtpHost || '',
            smtpPort: parsed.emailConfig?.smtpPort || 587,
            username: parsed.emailConfig?.username || '',
            password: parsed.emailConfig?.password || '',
            fromEmail: parsed.emailConfig?.fromEmail || ''
          }
        };
      }
    } catch (error) {
      console.error('Error loading config from localStorage:', error);
    }
    
    // Return defaults if no saved config or error
    return {
      llmProvider: 'local',
      llmApiKey: '',
      databaseType: 'sqlite',
      databaseConfig: {},
      theme: 'dark-green',
      emailConfig: {
        enabled: false,
        smtpHost: '',
        smtpPort: 587,
        username: '',
        password: '',
        fromEmail: ''
      }
    };
  };
  
  const [config, setConfig] = useState<AppContextType['config']>(loadConfigFromStorage);

  const currentUser = {
    name: 'Sarah Johnson',
    role: 'Trial Supply Manager',
    avatar: '/placeholder.svg'
  };

  useEffect(() => {
    async function initialize() {
      try {
        // Apply initial theme
        document.documentElement.setAttribute('data-theme', config.theme);
        
        // Initialize database
        await initDatabase();
        
        // Initialize AI service
        const service = new AIQueryService();
        await service.initialize();
        setAiService(service);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }

    initialize();
  }, []);

  const updateConfig = (newConfig: Partial<AppContextType['config']>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    // Save to localStorage
    try {
      localStorage.setItem('sally-tsm-config', JSON.stringify(updatedConfig));
    } catch (error) {
      console.error('Error saving config to localStorage:', error);
    }
  };

  const updateTheme = (theme: 'dark-green' | 'blue-white' | 'black-yellow') => {
    const updatedConfig = { ...config, theme };
    setConfig(updatedConfig);
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    try {
      localStorage.setItem('sally-tsm-config', JSON.stringify(updatedConfig));
    } catch (error) {
      console.error('Error saving config to localStorage:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      isInitialized,
      aiService,
      currentUser,
      config,
      updateConfig,
      updateTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}