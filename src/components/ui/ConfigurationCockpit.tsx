"use client";

import React, { useState, useEffect } from 'react';
import { Save, Settings, Palette, ArrowLeft } from 'lucide-react';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';

interface ConfigurationCockpitProps {
  onBack?: () => void;
}

export function ConfigurationCockpit({ onBack }: ConfigurationCockpitProps) {
  const { currentTheme, themeColors, changeTheme, availableThemes } = useGlobalTheme();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    changeTheme(themeName);
    // Reload page to ensure all components get the new theme
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const themeDisplayNames: Record<string, string> = {
    'default': 'Default (Blue)',
    'black-green': 'Black & Green',
    'black-yellow': 'Black & Yellow',
    'navy-white': 'Navy Blue & White'
  };

  return (
    <div
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground,
        minHeight: '100vh'
      }}
      className="p-6"
    >
      {/* Header */}
      <div
        style={{
          borderColor: themeColors.border
        }}
        className="mb-6 flex items-center justify-between border-b pb-4"
      >
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              style={{
                backgroundColor: themeColors.muted,
                color: themeColors.foreground
              }}
              className="rounded-lg p-2 transition-colors hover:opacity-80"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.background
            }}
            className="rounded-lg p-2"
          >
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuration Cockpit</h1>
            <p style={{ color: themeColors.accent }} className="text-sm">
              Manage your preferences and settings
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Content */}
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Theme Configuration Section */}
        <section
          style={{
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border
          }}
          className="rounded-xl border p-6"
        >
          <div className="mb-4 flex items-center space-x-3">
            <Palette
              style={{ color: themeColors.primary }}
              className="h-6 w-6"
            />
            <h2 className="text-xl font-semibold">Theme Settings</h2>
          </div>

          <div className="space-y-4">
            <p style={{ color: themeColors.accent }} className="text-sm">
              Choose your preferred color scheme for the application
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {availableThemes.map((themeName) => {
                const isSelected = selectedTheme === themeName;
                return (
                  <button
                    key={themeName}
                    onClick={() => handleThemeChange(themeName)}
                    style={{
                      backgroundColor: isSelected ? themeColors.primary : themeColors.background,
                      borderColor: isSelected ? themeColors.primary : themeColors.border,
                      color: isSelected ? themeColors.background : themeColors.foreground
                    }}
                    className="rounded-lg border-2 p-4 text-left transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {themeDisplayNames[themeName] || themeName}
                      </span>
                      {isSelected && (
                        <Save className="h-5 w-5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Current Theme Preview */}
        <section
          style={{
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border
          }}
          className="rounded-xl border p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">Current Theme Preview</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ColorBox label="Primary" color={themeColors.primary} />
            <ColorBox label="Secondary" color={themeColors.secondary} />
            <ColorBox label="Accent" color={themeColors.accent} />
            <ColorBox label="Border" color={themeColors.border} />
          </div>
        </section>

        {/* System Info */}
        <section
          style={{
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border
          }}
          className="rounded-xl border p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">System Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: themeColors.accent }}>Current Theme:</span>
              <span className="font-medium">
                {themeDisplayNames[currentTheme] || currentTheme}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: themeColors.accent }}>Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Color Preview Component
interface ColorBoxProps {
  label: string;
  color: string;
}

const ColorBox: React.FC<ColorBoxProps> = ({ label, color }) => {
  return (
    <div className="text-center">
      <div
        style={{ backgroundColor: color }}
        className="mb-2 h-16 rounded-lg border-2 border-white shadow-sm"
      />
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs opacity-70">{color}</p>
    </div>
  );
};
