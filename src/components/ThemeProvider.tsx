'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme configuration
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

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  themeColors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<string>('default');
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('sally-theme') || 'default';
    setTheme(savedTheme);
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    if (!mounted) return;

    const colors = THEMES[theme] || THEMES['default'];
    const root = document.documentElement;

    // Apply CSS variables to root
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-foreground', colors.foreground);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-muted', colors.muted);
    root.style.setProperty('--color-border', colors.border);

    // Apply background and text color to body
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.foreground;

    // Save to localStorage
    localStorage.setItem('sally-theme', theme);
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme,
    themeColors: THEMES[theme] || THEMES['default']
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export themes for use in components
export { THEMES };
