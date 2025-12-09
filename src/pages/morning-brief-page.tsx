"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';

interface MorningBriefPageProps {
  onBack?: () => void;
}

const MorningBriefPage: React.FC<MorningBriefPageProps> = ({ onBack }) => {
  const { themeColors } = useGlobalTheme();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
            <Sun className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Morning Brief</h1>
            <p style={{ color: themeColors.accent }} className="text-sm">
              Your daily business insights
            </p>
          </div>
        </div>
        <div
          style={{
            backgroundColor: themeColors.muted,
            color: themeColors.foreground
          }}
          className="rounded-lg px-4 py-2"
        >
          <Clock className="mr-2 inline h-4 w-4" />
          {currentTime}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl space-y-6">
        {/* KPIs Section */}
        <section
          style={{
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border
          }}
          className="rounded-xl border p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KPICard
              title="Revenue"
              value="$45,678"
              trend="+12.5%"
              icon={<TrendingUp className="h-5 w-5" />}
              themeColors={themeColors}
            />
            <KPICard
              title="Orders"
              value="234"
              trend="+8.3%"
              icon={<TrendingUp className="h-5 w-5" />}
              themeColors={themeColors}
            />
            <KPICard
              title="Customers"
              value="1,234"
              trend="+5.1%"
              icon={<TrendingUp className="h-5 w-5" />}
              themeColors={themeColors}
            />
          </div>
        </section>

        {/* Alerts Section */}
        <section
          style={{
            backgroundColor: themeColors.muted,
            borderColor: themeColors.border
          }}
          className="rounded-xl border p-6"
        >
          <div className="mb-4 flex items-center space-x-2">
            <AlertCircle
              style={{ color: themeColors.primary }}
              className="h-6 w-6"
            />
            <h2 className="text-xl font-semibold">Important Alerts</h2>
          </div>
          <div className="space-y-3">
            <AlertItem
              message="Inventory levels low for Product A"
              severity="warning"
              themeColors={themeColors}
            />
            <AlertItem
              message="New customer inquiry waiting"
              severity="info"
              themeColors={themeColors}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  themeColors: any;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, icon, themeColors }) => {
  return (
    <div
      style={{
        backgroundColor: themeColors.background,
        borderColor: themeColors.border
      }}
      className="rounded-lg border p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: themeColors.accent }} className="text-sm">
          {title}
        </span>
        <span style={{ color: themeColors.primary }}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div style={{ color: themeColors.primary }} className="text-sm">
        {trend}
      </div>
    </div>
  );
};

// Alert Item Component
interface AlertItemProps {
  message: string;
  severity: 'warning' | 'info';
  themeColors: any;
}

const AlertItem: React.FC<AlertItemProps> = ({ message, severity, themeColors }) => {
  return (
    <div
      style={{
        backgroundColor: themeColors.background,
        borderColor: severity === 'warning' ? themeColors.primary : themeColors.border
      }}
      className="rounded-lg border p-3"
    >
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default MorningBriefPage;
