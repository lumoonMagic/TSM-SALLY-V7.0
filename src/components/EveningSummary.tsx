import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info, CheckCircle, Lightbulb, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Match the backend API response structure
interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface Alert {
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
  date: string;
  mode: string;
  kpis: KPI[];
  alerts: Alert[];
  top_insights: TopInsight[];
  summary_text: string;
  generated_at: string;
}

export function EveningSummary() {
  const [summary, setSummary] = useState<EveningSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEveningSummary();
  }, []);

  const fetchEveningSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      
      if (!apiUrl) {
        throw new Error('VITE_API_URL not configured. Please set it in Vercel environment variables.');
      }
      
      console.log('Fetching from:', `${apiUrl}/api/v1/evening-summary`);
      
      const response = await fetch(`${apiUrl}/api/v1/evening-summary`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch evening summary:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Trend icon helper
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Severity icon helper
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Impact badge helper
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Medium Impact</Badge>;
      default:
        return <Badge variant="secondary">Low Impact</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading evening summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Failed to Load Evening Summary</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button onClick={fetchEveningSummary} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No summary available</p>
            <Button onClick={fetchEveningSummary} variant="outline" size="sm" className="mt-4">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            End of Day Summary
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            {new Date(summary.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            <Badge variant="outline" className="ml-2">{summary.mode}</Badge>
          </p>
        </div>
        <Button variant="outline" onClick={fetchEveningSummary}>
          Refresh
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.kpis.map((kpi, idx) => (
          <Card key={idx} className={`border-2 ${getStatusColor(kpi.status)}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                {getTrendIcon(kpi.trend)}
              </div>
              <p className="text-2xl font-bold mb-1">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mb-2">{alert.category}</Badge>
                      <p className="font-medium text-card-foreground">{alert.message}</p>
                    </div>
                  </div>
                  
                  {(alert.site || alert.compound) && (
                    <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                      {alert.site && <span>Site: {alert.site}</span>}
                      {alert.compound && <span>Compound: {alert.compound}</span>}
                    </div>
                  )}
                  
                  {alert.action_required && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <span className="font-medium text-blue-900">Action: </span>
                      <span className="text-blue-700">{alert.action_required}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.top_insights.map((insight, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-card-foreground mb-1">
                      {insight.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">{insight.category}</Badge>
                  </div>
                  {getImpactBadge(insight.impact)}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-card-foreground leading-relaxed whitespace-pre-line">
            {summary.summary_text}
          </p>
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            Generated at: {new Date(summary.generated_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
