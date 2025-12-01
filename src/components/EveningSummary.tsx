import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EveningSummaryData {
  summary_date: string;
  achievements: string[];
  metrics_vs_targets: {
    shipments: { actual: number; target: number };
    alerts_resolved: { actual: number; target: number };
  };
  issues_resolved: string[];
  tomorrow_priorities: string[];
  overnight_monitors: Array<{
    description: string;
    status: string;
  }>;
}

export function EveningSummary() {
  const [summary, setSummary] = useState<EveningSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEveningSummary();
  }, []);

  const fetchEveningSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/v1/summary/evening/${today}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch evening summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading evening summary...</div>;
  if (!summary) return <div className="p-6">No summary available</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Evening Summary
          </h1>
          <p className="text-muted-foreground">
            {new Date(summary.summary_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Button variant="outline" onClick={fetchEveningSummary}>
          Refresh
        </Button>
      </div>

      {/* Today's Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Today's Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.achievements.map((achievement, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-card-foreground">{achievement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Metrics vs. Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Performance vs. Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              label="Shipments Completed"
              actual={summary.metrics_vs_targets.shipments.actual}
              target={summary.metrics_vs_targets.shipments.target}
            />
            <MetricCard
              label="Alerts Resolved"
              actual={summary.metrics_vs_targets.alerts_resolved.actual}
              target={summary.metrics_vs_targets.alerts_resolved.target}
            />
          </div>
        </CardContent>
      </Card>

      {/* Issues Resolved */}
      <Card>
        <CardHeader>
          <CardTitle>Issues Resolved Today</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.issues_resolved.map((issue, idx) => (
              <li key={idx} className="text-card-foreground">{issue}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Tomorrow's Priorities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Tomorrow's Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal list-inside">
            {summary.tomorrow_priorities.map((priority, idx) => (
              <li key={idx} className="text-card-foreground">
                {priority}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Overnight Monitors (Live Data) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Overnight Monitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.overnight_monitors.map((monitor, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="text-card-foreground">{monitor.description}</span>
                <span className="text-sm text-muted-foreground">{monitor.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, actual, target }) {
  const percentage = (actual / target) * 100;
  const isOnTrack = percentage >= 90;

  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1 text-foreground">
        {actual} / {target}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full ${isOnTrack ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={`text-sm ${isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
