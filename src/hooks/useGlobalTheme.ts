/**
 * Global Theme Hook - Works without Context Provider
 * Can be used in any component to read and apply the global theme
 */

import { useEffect, useState } from 'react';

export interface ThemeColors {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
}

export const THEMES: Record<string, ThemeColors> = {
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

/**
 * Hook to use global theme across any component
 * Reads from localStorage and applies CSS variables
 */
export function useGlobalTheme() {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [themeColors, setThemeColors] = useState<ThemeColors>(THEMES['default']);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sally-theme') || 'default';
    if (THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
      setThemeColors(THEMES[savedTheme]);
    }
  }, []);

  // Apply theme colors to CSS variables and body
  useEffect(() => {
    const colors = THEMES[currentTheme] || THEMES['default'];
    setThemeColors(colors);

    // Apply to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-foreground', colors.foreground);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-muted', colors.muted);
    root.style.setProperty('--color-border', colors.border);

    // Apply to body
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.foreground;
  }, [currentTheme]);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sally-theme' && e.newValue) {
        if (THEMES[e.newValue]) {
          setCurrentTheme(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    currentTheme,
    themeColors,
    allThemes: THEMES
  };
}
