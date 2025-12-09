'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';

// ==================== CONFIGURATION ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tsm-sally-v70-production.up.railway.app';

// ==================== TYPES ====================
interface KPIMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface AlertItem {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  site?: string;
  compound?: string;
  action_required?: string;
}

interface TopInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface EveningSummaryData {
  kpis: KPIMetric[];
  alerts: AlertItem[];
  top_insights: TopInsight[];
  summary_text: string;
  generated_at: string;
}

// ==================== API FUNCTIONS ====================
const fetchEveningSummary = async (mode: 'production' | 'demo'): Promise<EveningSummaryData> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/evening-summary?mode=${mode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// ==================== COMPONENT ====================
export function EveningSummary() {
  const [currentMode, setCurrentMode] = useState<'production' | 'demo'>('demo');
  const { themeColors } = useGlobalTheme();

  // React Query for data fetching
  const { 
    data: summaryData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['evening-summary', currentMode],
    queryFn: () => fetchEveningSummary(currentMode),
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Handle mode toggle
  const handleModeToggle = () => {
    const newMode = currentMode === 'production' ? 'demo' : 'production';
    setCurrentMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing evening summary...');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div 
        className="container mx-auto p-6"
        style={{
          backgroundColor: themeColors.background,
          color: themeColors.foreground,
          minHeight: '100vh'
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto" style={{ color: themeColors.primary }} />
            <p className="text-lg font-medium" style={{ color: themeColors.foreground }}>
              Loading Evening Summary...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className="container mx-auto p-6"
        style={{
          backgroundColor: themeColors.background,
          minHeight: '100vh'
        }}
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load evening summary: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={handleRefresh} style={{ backgroundColor: themeColors.primary, color: themeColors.background }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto p-6 space-y-6"
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground,
        minHeight: '100vh'
      }}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: themeColors.foreground }}>
            End of Day Summary
          </h1>
          <p className="flex items-center gap-2" style={{ color: themeColors.secondary }}>
            <Calendar className="h-4 w-4" />
            {summaryData?.generated_at && format(new Date(summaryData.generated_at), 'MMMM dd, yyyy - HH:mm')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={currentMode === 'production' ? 'default' : 'secondary'}
            style={{
              backgroundColor: currentMode === 'production' ? themeColors.primary : themeColors.muted,
              color: currentMode === 'production' ? themeColors.background : themeColors.foreground
            }}
          >
            {currentMode === 'production' ? 'Production Mode' : 'Demo Mode'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleModeToggle}
            style={{
              borderColor: themeColors.border,
              color: themeColors.foreground
            }}
          >
            <Zap className="mr-2 h-4 w-4" />
            Switch to {currentMode === 'production' ? 'Demo' : 'Production'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefetching}
            style={{
              borderColor: themeColors.border,
              color: themeColors.foreground
            }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryData?.kpis.map((kpi, index) => (
          <Card 
            key={index}
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: themeColors.secondary }}>
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold" style={{ color: themeColors.foreground }}>
                  {kpi.value}
                </div>
                <Badge 
                  variant={kpi.trend === 'up' ? 'default' : kpi.trend === 'down' ? 'destructive' : 'secondary'}
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: kpi.status === 'good' ? themeColors.primary : 
                                   kpi.status === 'warning' ? themeColors.accent : 
                                   themeColors.secondary
                  }}
                >
                  <TrendingUp className="h-3 w-3" />
                  {kpi.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList style={{ backgroundColor: themeColors.muted }}>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts ({summaryData?.alerts.length || 0})
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Top Insights ({summaryData?.top_insights.length || 0})
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Executive Summary
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {summaryData?.alerts.map((alert, index) => (
            <Alert 
              key={index} 
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
              style={{
                backgroundColor: themeColors.muted,
                borderColor: themeColors.border
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              <div className="ml-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold" style={{ color: themeColors.foreground }}>
                    {alert.message}
                  </h4>
                  <Badge variant="outline" className="ml-2">
                    {alert.severity}
                  </Badge>
                </div>
                {alert.action_required && (
                  <AlertDescription style={{ color: themeColors.secondary }}>
                    {alert.action_required}
                  </AlertDescription>
                )}
              </div>
            </Alert>
          ))}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {summaryData?.top_insights.map((insight, index) => (
            <Card 
              key={index}
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" style={{ color: themeColors.foreground }}>
                    {insight.title}
                  </CardTitle>
                  <Badge 
                    variant={
                      insight.impact === 'high' ? 'destructive' : 
                      insight.impact === 'medium' ? 'default' : 
                      'secondary'
                    }
                    style={{
                      backgroundColor: insight.impact === 'high' ? themeColors.accent : themeColors.primary
                    }}
                  >
                    {insight.impact} impact
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit">{insight.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: themeColors.secondary }}>
                  {insight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="summary">
          <Card
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: themeColors.foreground }}>
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: themeColors.foreground }}>
                {summaryData?.summary_text}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
