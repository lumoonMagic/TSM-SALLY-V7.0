import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle, 
  AlertCircle, 
  Info,
  Clock, 
  CheckCircle, 
  Target,
  Lightbulb,
  Calendar,
  RefreshCw,
  Settings,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Match backend API structure
interface AlertItem {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action_required?: string;
}

interface MetricItem {
  name: string;
  value: string;
  change?: string;
  status: 'good' | 'warning' | 'critical';
}

interface RecommendationItem {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimated_impact?: string;
}

interface MorningBriefData {
  brief_id: string;
  date: string;
  generated_at: string;
  summary: string;
  alerts: AlertItem[];
  key_metrics: MetricItem[];
  recommendations: RecommendationItem[];
  upcoming_activities: string[];
}

export function MorningBrief() {
  const [brief, setBrief] = useState<MorningBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(true); // Default to demo mode
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load mode preference from localStorage
    const savedMode = localStorage.getItem('appMode') || 'demo';
    setDemoMode(savedMode === 'demo');
    loadMorningBrief(savedMode === 'demo');
  }, []);

  const loadMorningBrief = async (useDemoMode: boolean = demoMode) => {
    setLoading(true);
    setError(null);

    try {
      if (useDemoMode) {
        // DEMO MODE - Use realistic demo data
        setBrief(getDemoMorningBrief());
      } else {
        // PRODUCTION MODE - Call backend API
        const apiUrl = import.meta.env.VITE_API_URL;
        
        if (!apiUrl) {
          throw new Error('VITE_API_URL not configured. Please set it in Vercel environment variables.');
        }

        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${apiUrl}/api/v1/morning-brief/${today}`);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setBrief(data);
      }
    } catch (err) {
      console.error('Failed to load morning brief:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Fallback to demo data on error
      if (!useDemoMode) {
        toast({
          title: "Error loading brief",
          description: "Falling back to demo data",
          variant: "destructive"
        });
        setBrief(getDemoMorningBrief());
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    localStorage.setItem('appMode', newMode ? 'demo' : 'production');
    loadMorningBrief(newMode);
    
    toast({
      title: `Switched to ${newMode ? 'Demo' : 'Production'} Mode`,
      description: newMode ? 'Using sample data' : 'Using live backend data'
    });
  };

  // Demo data generator
  const getDemoMorningBrief = (): MorningBriefData => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      brief_id: `brief_${Date.now()}`,
      date: today,
      generated_at: new Date().toISOString(),
      summary: "Good morning! Today's forecast shows stable operations with 47 active shipments across 12 sites. Inventory levels are healthy at 95% of target. Focus areas: Site 1034 requires attention for low stock levels, and 3 shipments need expedited processing to meet delivery deadlines. Temperature monitoring shows all shipments within acceptable ranges. Overall system performance is strong with 94.3% forecast accuracy.",
      
      alerts: [
        {
          severity: 'critical',
          title: 'Low Inventory Alert',
          description: 'Site 1034 (Germany) inventory level at 15% - below minimum threshold',
          action_required: 'Expedite shipment SH-8942 scheduled for today'
        },
        {
          severity: 'warning',
          title: 'Delayed Shipments',
          description: '3 shipments are running behind schedule due to customs delays',
          action_required: 'Contact logistics partner for expedited clearance'
        },
        {
          severity: 'info',
          title: 'Weekly Enrollment Update',
          description: 'Site 5042 (Japan) exceeded enrollment targets by 12% this week',
          action_required: 'Review inventory allocation for next month'
        }
      ],
      
      key_metrics: [
        {
          name: 'Global Inventory',
          value: '15,234 units',
          change: '+2.8% from yesterday',
          status: 'good'
        },
        {
          name: 'Active Shipments',
          value: '47 shipments',
          change: '+5 new today',
          status: 'good'
        },
        {
          name: 'Sites at Risk',
          value: '2 sites',
          change: '-1 from yesterday',
          status: 'warning'
        },
        {
          name: 'Forecast Accuracy',
          value: '94.3%',
          change: '+1.2%',
          status: 'good'
        },
        {
          name: 'Temperature Compliance',
          value: '98.5%',
          change: 'Stable',
          status: 'good'
        },
        {
          name: 'Supply Days Remaining',
          value: '47 days avg',
          change: '+3 days',
          status: 'good'
        }
      ],
      
      recommendations: [
        {
          priority: 'high',
          title: 'Urgent: Inventory Replenishment',
          description: 'Site 1034 requires immediate stock replenishment. Recommend expediting shipment SH-8942 scheduled for today. Alternative: reallocate 150 units from Site 2011 (overstocked by 25%).',
          estimated_impact: 'Prevents potential site closure and study delays'
        },
        {
          priority: 'high',
          title: 'Regional Demand Rebalancing',
          description: 'APAC region showing 18% higher enrollment than forecast. Recommend reallocating 450 units from EU (12% below forecast) within 2 weeks to avoid stockouts.',
          estimated_impact: 'Reduces expiry risk by $67,500 and prevents APAC shortages'
        },
        {
          priority: 'medium',
          title: 'Optimize Shipping Routes',
          description: 'European sites showing 15% longer delivery times. Review logistics partner SLA and consider alternative carriers for time-sensitive shipments.',
          estimated_impact: 'Reduce average delivery time from 5.2 to 4.5 days'
        },
        {
          priority: 'low',
          title: 'Update Forecasting Model',
          description: 'Q4 enrollment patterns differ from historical data. Schedule review of forecasting assumptions with clinical operations team.',
          estimated_impact: 'Improve forecast accuracy from 94.3% to 96%+ target'
        }
      ],
      
      upcoming_activities: [
        'Site 1034 emergency shipment departure (10:00 AM UTC)',
        'Weekly inventory review with clinical operations (2:00 PM UTC)',
        'Customs clearance follow-up for delayed shipments (3:30 PM UTC)',
        'Monthly forecast review meeting (4:00 PM UTC)',
        'Temperature excursion investigation report due by EOD'
      ]
    };
  };

  // Helper functions
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Medium Priority</Badge>;
      default:
        return <Badge variant="secondary">Low Priority</Badge>;
    }
  };

  const getTrendIcon = (change?: string) => {
    if (!change) return <Minus className="h-4 w-4" />;
    if (change.includes('+') || change.toLowerCase().includes('increase')) {
      return <TrendingUp className="h-4 w-4" />;
    }
    if (change.includes('-') || change.toLowerCase().includes('decrease')) {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading morning brief...</p>
        </div>
      </div>
    );
  }

  if (error && !brief) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Failed to Load Morning Brief</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="flex gap-2">
                  <Button onClick={() => loadMorningBrief(demoMode)} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <Button onClick={() => { setDemoMode(true); loadMorningBrief(true); }} variant="outline" size="sm">
                    Load Demo Data
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No brief available</p>
            <Button onClick={() => loadMorningBrief(demoMode)} variant="outline" size="sm" className="mt-4">
              Load Brief
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Morning Brief
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            {new Date(brief.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            <Badge variant="outline" className="ml-2">{demoMode ? 'Demo Mode' : 'Production Mode'}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadMorningBrief(demoMode)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="demo-mode"
                    checked={demoMode}
                    onCheckedChange={toggleMode}
                  />
                  <Label htmlFor="demo-mode" className="cursor-pointer">
                    {demoMode ? 'Demo Mode (Sample Data)' : 'Production Mode (Live Data)'}
                  </Label>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                Close
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {demoMode 
                ? 'Using realistic sample data for demonstration. No backend connection required.' 
                : 'Connected to live backend API. Requires VITE_API_URL to be configured.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-card-foreground leading-relaxed whitespace-pre-line">
            {brief.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brief.key_metrics.map((metric, idx) => (
            <Card key={idx} className={`border-2 ${getStatusColor(metric.status)}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                  {getTrendIcon(metric.change)}
                </div>
                <p className="text-2xl font-bold mb-1">{metric.value}</p>
                {metric.change && (
                  <p className="text-sm text-muted-foreground">{metric.change}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Priority Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brief.alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <h3 className="font-semibold text-card-foreground mb-1">{alert.title}</h3>
                  <p className="text-muted-foreground mb-2">{alert.description}</p>
                  
                  {alert.action_required && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <span className="font-medium text-blue-900">Action Required: </span>
                      <span className="text-blue-700">{alert.action_required}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brief.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-card-foreground">
                    {rec.title}
                  </h3>
                  {getPriorityBadge(rec.priority)}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  {rec.description}
                </p>
                {rec.estimated_impact && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <span className="font-medium text-green-900">Impact: </span>
                    <span className="text-green-700">{rec.estimated_impact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {brief.upcoming_activities.map((activity, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-card-foreground">{activity}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-sm text-muted-foreground text-center pt-4 border-t">
        Generated at: {new Date(brief.generated_at).toLocaleString()} • Brief ID: {brief.brief_id}
      </div>
    </div>
  );
}
