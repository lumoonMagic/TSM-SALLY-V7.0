# Sally TSM: Intelligent UX Design - Morning Brief & Evening Summary

## 📋 Overview

Transform Morning Brief and Evening Summary from **static dashboards** into **intelligent, context-aware experiences** that adapt to what matters most to the user right now.

---

## 🌅 Morning Brief: Intelligent Priority-Based Design

### Traditional Dashboard Problem
```
┌─────────────────────────────────────────────────┐
│  MORNING BRIEF - Generic Dashboard              │
├─────────────────────────────────────────────────┤
│  Total Inventory: 8,492 units (+5.2%)          │
│  Active Shipments: 45 (3 delayed)              │
│  Sites Active: 87                               │
│  Studies Running: 12                            │
│  ...50 more metrics...                          │
└─────────────────────────────────────────────────┘
```
**Problem:** Information overload. User doesn't know what requires attention.

---

### Sally's Intelligent Morning Brief

#### Design Philosophy
**Show only what matters TODAY, ranked by urgency**

```
┌───────────────────────────────────────────────────────────────┐
│  🌅 Good Morning, Sarah! Here's what needs your attention:   │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  🚨 URGENT (3) - Requires action today                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🔴 Site 205 Stock-Out Risk                               ││
│  │    • Berlin site: Only 4 days of Drug X remaining        ││
│  │    • Shipment #SH-7723 delayed in customs (5 days)       ││
│  │    • Nearest backup: Vienna depot (520km, 1-day transit) ││
│  │    ✅ Suggest Transfer  📧 Draft Email  📊 View Details  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🟠 Temperature Excursion Alert                           ││
│  │    • Shipment #SH-8892 to Tokyo: 12°C spike (2 hours)    ││
│  │    • Product integrity: Questionable                     ││
│  │    • QA decision needed: Accept, Quarantine, or Reject   ││
│  │    📋 View Incident  ✅ Recommend Action  📧 Notify QA   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 🟡 Vendor Performance Issue                              ││
│  │    • GlobalPharma: 3 consecutive late deliveries         ││
│  │    • Average delay: 4.5 days                             ││
│  │    • 2 current shipments at risk                         ││
│  │    📊 Performance Report  📧 Draft Escalation Email      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
├───────────────────────────────────────────────────────────────┤
│  ⚠️ IMPORTANT (5) - Plan action this week                    │
│  • 80 kits expiring in 45 days at Site 112 (transfer opp)    │
│  • Study ABC-301 reached 50% enrollment (procurement review)  │
│  • Site 602 subject discontinued (40 kits excess)             │
│  • 4 orders can be consolidated to save $70K                  │
│  • Regulatory inspection at Site 705 in 14 days               │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│  ℹ️ MONITORING (8) - Keep an eye on these                    │
│  • 3 shipments in customs (normal processing)                 │
│  • 5 sites approaching reorder points (7-10 days out)         │
│  • Enrollment rate normal at 12 sites                         │
│  [View All]                                                    │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│  ✅ ALL GOOD (89% of operations)                             │
│  • 78 sites: Inventory healthy (>14 days)                     │
│  • 42 shipments: On-time and within temp range                │
│  • 11 studies: Enrollment on-track                            │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

### Morning Brief Component Architecture

#### 1. Priority Scoring Algorithm

```python
"""
Morning Brief Priority Scoring Engine
Each issue is scored 0-100 based on urgency, impact, and time-sensitivity
"""

class MorningBriefPriorityEngine:
    def __init__(self, db_connection):
        self.db = db_connection
    
    def generate_brief(self, user_id: str, user_role: str) -> Dict:
        """
        Generate personalized morning brief
        
        Returns:
            {
                'urgent': [...],  # Score 80-100
                'important': [...],  # Score 50-79
                'monitoring': [...],  # Score 20-49
                'all_good': {...}  # Score 0-19
            }
        """
        # Step 1: Collect all potential issues
        issues = []
        
        issues.extend(self._check_stockout_risks())
        issues.extend(self._check_temperature_excursions())
        issues.extend(self._check_shipment_delays())
        issues.extend(self._check_vendor_performance())
        issues.extend(self._check_expiry_risks())
        issues.extend(self._check_enrollment_anomalies())
        issues.extend(self._check_deviation_impacts())
        issues.extend(self._check_customs_delays())
        
        # Step 2: Score each issue
        scored_issues = []
        for issue in issues:
            score = self._calculate_priority_score(issue)
            issue['priority_score'] = score
            scored_issues.append(issue)
        
        # Step 3: Categorize by urgency
        urgent = [i for i in scored_issues if i['priority_score'] >= 80]
        important = [i for i in scored_issues if 50 <= i['priority_score'] < 80]
        monitoring = [i for i in scored_issues if 20 <= i['priority_score'] < 50]
        
        # Step 4: Sort each category
        urgent.sort(key=lambda x: x['priority_score'], reverse=True)
        important.sort(key=lambda x: x['priority_score'], reverse=True)
        monitoring.sort(key=lambda x: x['priority_score'], reverse=True)
        
        # Step 5: Generate "All Good" summary
        all_good = self._generate_all_good_summary()
        
        return {
            'urgent': urgent[:10],  # Max 10 urgent items
            'important': important[:10],
            'monitoring': monitoring[:10],
            'all_good': all_good,
            'generated_at': datetime.now()
        }
    
    def _calculate_priority_score(self, issue: Dict) -> int:
        """
        Calculate priority score 0-100
        
        Factors:
        - Time urgency (40 points): How soon action needed?
        - Impact severity (30 points): What's at stake?
        - Cascading risk (20 points): Could this affect other things?
        - Cost implications (10 points): Financial impact
        """
        score = 0
        
        # Time Urgency (40 points)
        days_until_action = issue.get('days_until_action_needed', 999)
        if days_until_action == 0:
            score += 40  # Today
        elif days_until_action == 1:
            score += 35  # Tomorrow
        elif days_until_action <= 3:
            score += 30  # This week
        elif days_until_action <= 7:
            score += 20  # Next week
        elif days_until_action <= 14:
            score += 10  # This month
        
        # Impact Severity (30 points)
        impact = issue.get('impact_level', 'low')
        impact_scores = {
            'critical': 30,  # Study stoppage, patient safety
            'high': 25,      # Site disruption
            'medium': 15,    # Operational inefficiency
            'low': 5         # Minor inconvenience
        }
        score += impact_scores.get(impact, 0)
        
        # Cascading Risk (20 points)
        if issue.get('affects_multiple_sites', False):
            score += 10
        if issue.get('affects_multiple_studies', False):
            score += 10
        
        # Cost Implications (10 points)
        cost_impact = issue.get('cost_impact_usd', 0)
        if cost_impact > 100000:
            score += 10
        elif cost_impact > 50000:
            score += 7
        elif cost_impact > 10000:
            score += 5
        elif cost_impact > 1000:
            score += 2
        
        return min(score, 100)  # Cap at 100
    
    def _check_stockout_risks(self) -> List[Dict]:
        """Check for sites at risk of running out of stock"""
        query = """
        WITH site_burn_rates AS (
            SELECT 
                i.site_id,
                i.product_name,
                i.quantity as current_stock,
                COALESCE(f.predicted_demand_quantity / f.forecast_horizon_days, 0) as daily_burn_rate,
                f.predicted_stockout_date
            FROM gold_inventory i
            LEFT JOIN gold_demand_forecasts f 
                ON i.site_id = f.site_id 
                AND i.product_name = f.product_name
            WHERE i.quantity > 0
        )
        SELECT 
            s.site_id,
            s.site_name,
            s.country,
            sbr.product_name,
            sbr.current_stock,
            sbr.daily_burn_rate,
            sbr.predicted_stockout_date,
            EXTRACT(DAY FROM (sbr.predicted_stockout_date - CURRENT_DATE)) as days_until_stockout,
            sh.shipment_id,
            sh.shipment_status,
            sh.expected_delivery_date
        FROM site_burn_rates sbr
        JOIN gold_sites s ON sbr.site_id = s.site_id
        LEFT JOIN gold_shipments sh 
            ON sbr.site_id = sh.site_id 
            AND sh.shipment_status IN ('in_transit', 'pending')
        WHERE sbr.predicted_stockout_date <= CURRENT_DATE + INTERVAL '14 days'
        ORDER BY days_until_stockout ASC
        """
        
        results = pd.read_sql(query, self.db)
        
        issues = []
        for _, row in results.iterrows():
            days_remaining = row['days_until_stockout']
            
            # Check if incoming shipment will arrive in time
            shipment_delayed = False
            if row['shipment_id']:
                expected_delivery = row['expected_delivery_date']
                if expected_delivery > row['predicted_stockout_date']:
                    shipment_delayed = True
            
            issue = {
                'type': 'stockout_risk',
                'severity': 'critical' if days_remaining <= 3 else 'high',
                'site_id': row['site_id'],
                'site_name': row['site_name'],
                'country': row['country'],
                'product_name': row['product_name'],
                'days_remaining': days_remaining,
                'current_stock': row['current_stock'],
                'shipment_delayed': shipment_delayed,
                'days_until_action_needed': days_remaining - 2,  # Need 2 days to arrange transfer
                'impact_level': 'critical',
                'affects_study': True,
                'cost_impact_usd': 50000,  # Estimated impact of stockout
                'suggested_actions': [
                    'emergency_transfer_from_nearby_site',
                    'expedite_incoming_shipment',
                    'emergency_order_from_depot'
                ]
            }
            issues.append(issue)
        
        return issues
    
    def _check_temperature_excursions(self) -> List[Dict]:
        """Check for recent temperature excursions"""
        query = """
        SELECT 
            tei.incident_id,
            tei.shipment_id,
            sh.site_id,
            s.site_name,
            tei.detected_at,
            tei.max_temperature_celsius,
            tei.duration_minutes,
            tei.severity_level,
            tei.product_integrity_status,
            tei.recommended_action,
            tei.qa_decision
        FROM gold_temperature_excursion_incidents tei
        JOIN gold_shipments sh ON tei.shipment_id = sh.shipment_id
        JOIN gold_sites s ON sh.site_id = s.site_id
        WHERE tei.detected_at >= CURRENT_DATE - INTERVAL '24 hours'
          AND tei.qa_decision IS NULL
        ORDER BY tei.detected_at DESC
        """
        
        results = pd.read_sql(query, self.db)
        
        issues = []
        for _, row in results.iterrows():
            issue = {
                'type': 'temperature_excursion',
                'severity': row['severity_level'],
                'incident_id': row['incident_id'],
                'shipment_id': row['shipment_id'],
                'site_name': row['site_name'],
                'max_temp': row['max_temperature_celsius'],
                'duration_minutes': row['duration_minutes'],
                'product_status': row['product_integrity_status'],
                'recommended_action': row['recommended_action'],
                'days_until_action_needed': 0,  # Needs immediate decision
                'impact_level': 'high' if row['product_integrity_status'] == 'questionable' else 'medium',
                'cost_impact_usd': 25000 if row['recommended_action'] == 'reject_replace' else 5000,
                'suggested_actions': [
                    'qa_integrity_assessment',
                    'quarantine_shipment',
                    'arrange_replacement' if row['recommended_action'] == 'reject_replace' else 'release_with_documentation'
                ]
            }
            issues.append(issue)
        
        return issues
    
    def _generate_all_good_summary(self) -> Dict:
        """Generate summary of things going well"""
        queries = {
            'healthy_sites': """
                SELECT COUNT(DISTINCT site_id) 
                FROM gold_inventory 
                WHERE quantity > 0 
                  AND days_until_expiry > 30
            """,
            'on_time_shipments': """
                SELECT COUNT(*) 
                FROM gold_shipments 
                WHERE shipment_status = 'in_transit'
                  AND expected_delivery_date >= CURRENT_DATE
            """,
            'on_track_studies': """
                SELECT COUNT(*) 
                FROM gold_studies 
                WHERE study_status = 'Active'
                  AND current_enrollment >= (target_enrollment * 
                    EXTRACT(DAY FROM (CURRENT_DATE - actual_start_date)) / 
                    EXTRACT(DAY FROM (planned_end_date - actual_start_date)))
            """
        }
        
        summary = {}
        for key, query in queries.items():
            result = pd.read_sql(query, self.db)
            summary[key] = int(result.iloc[0, 0])
        
        return summary
```

---

### Morning Brief React Component

```typescript
// src/components/MorningBrief.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/configApi';

interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority_score: number;
  site_name?: string;
  product_name?: string;
  days_remaining?: number;
  shipment_id?: string;
  suggested_actions: string[];
  [key: string]: any;
}

interface MorningBriefData {
  urgent: Issue[];
  important: Issue[];
  monitoring: Issue[];
  all_good: {
    healthy_sites: number;
    on_time_shipments: number;
    on_track_studies: number;
  };
  generated_at: string;
}

export function MorningBrief() {
  const { data, isLoading } = useQuery<MorningBriefData>({
    queryKey: ['morning-brief'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/analytics/morning-brief');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return <LoadingSpinner message="Analyzing your supply chain..." />;
  }

  const userName = "Sarah"; // From user context
  const urgentCount = data?.urgent.length || 0;
  const importantCount = data?.important.length || 0;
  const monitoringCount = data?.monitoring.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            🌅 Good Morning, {userName}!
          </CardTitle>
          <p className="text-muted-foreground">
            Here's what needs your attention today
          </p>
        </CardHeader>
      </Card>

      {/* Urgent Issues */}
      {urgentCount > 0 && (
        <Card className="border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              URGENT ({urgentCount}) - Requires action today
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {data?.urgent.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} urgency="urgent" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Important Issues */}
      {importantCount > 0 && (
        <Card className="border-orange-500">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Clock className="h-5 w-5" />
              IMPORTANT ({importantCount}) - Plan action this week
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {data?.important.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} urgency="important" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Monitoring Issues */}
      {monitoringCount > 0 && (
        <Card className="border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              MONITORING ({monitoringCount}) - Keep an eye on these
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-2">
              {data?.monitoring.map((issue, idx) => (
                <li key={idx} className="text-sm">
                  • {formatIssueOneLiner(issue)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* All Good Summary */}
      <Card className="border-green-500">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            ALL GOOD (89% of operations)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">
                {data?.all_good.healthy_sites}
              </p>
              <p className="text-sm text-muted-foreground">
                Sites with healthy inventory
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {data?.all_good.on_time_shipments}
              </p>
              <p className="text-sm text-muted-foreground">
                On-time shipments
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {data?.all_good.on_track_studies}
              </p>
              <p className="text-sm text-muted-foreground">
                Studies on-track
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IssueCard({ issue, urgency }: { issue: Issue; urgency: string }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {formatIssueTitle(issue)}
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {formatIssueDetails(issue)}
            </div>
          </div>
          <Badge variant={urgency === 'urgent' ? 'destructive' : 'secondary'}>
            Score: {issue.priority_score}
          </Badge>
        </div>

        <div className="flex gap-2">
          {issue.suggested_actions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleAction(action, issue)}
            >
              {formatActionButton(action)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatIssueTitle(issue: Issue): string {
  switch (issue.type) {
    case 'stockout_risk':
      return `🔴 ${issue.site_name} Stock-Out Risk`;
    case 'temperature_excursion':
      return `🟠 Temperature Excursion Alert`;
    case 'vendor_performance':
      return `🟡 Vendor Performance Issue`;
    default:
      return issue.type;
  }
}

function formatIssueDetails(issue: Issue): JSX.Element[] {
  const details: JSX.Element[] = [];
  
  if (issue.type === 'stockout_risk') {
    details.push(
      <p key="1">• {issue.site_name}: Only {issue.days_remaining} days of {issue.product_name} remaining</p>,
      <p key="2">• Current stock: {issue.current_stock} kits</p>
    );
    if (issue.shipment_delayed) {
      details.push(<p key="3">• Incoming shipment delayed</p>);
    }
  }
  
  return details;
}

function formatActionButton(action: string): string {
  const actionLabels: Record<string, string> = {
    'emergency_transfer_from_nearby_site': '✅ Suggest Transfer',
    'expedite_incoming_shipment': '📧 Contact Vendor',
    'emergency_order_from_depot': '📦 Emergency Order',
    'qa_integrity_assessment': '📋 View Incident',
    'quarantine_shipment': '⚠️ Quarantine',
    'release_with_documentation': '✅ Release',
  };
  
  return actionLabels[action] || action;
}

function handleAction(action: string, issue: Issue) {
  // Dispatch action to backend or open modal
  console.log('Action:', action, 'Issue:', issue);
}
```

---

## 🌆 Evening Summary: Action-Tracking Design

### Design Philosophy
**Show what got done, what's pending, and what's coming tomorrow**

```
┌───────────────────────────────────────────────────────────────┐
│  🌆 End of Day Summary - December 19, 2024                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ✅ COMPLETED TODAY (8 actions)                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ✓ Emergency transfer approved: Berlin → Vienna           ││
│  │   • 40 kits of Drug X transferred                        ││
│  │   • Saved €120,000 from potential stock-out              ││
│  │   • Transit completed in 18 hours                        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ✓ Temperature excursion resolved                         ││
│  │   • QA decision: Accept with documentation               ││
│  │   • Shipment #SH-8892 released to Site 309               ││
│  │   • Incident report filed                                ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  [View All 8 Completed Actions]                               │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│  ⏳ IN PROGRESS (5 actions)                                   │
│  • Vendor escalation email sent (awaiting response)           │
│  • Consolidation proposal drafted (pending approval)          │
│  • Site 705 inspection prep (12 days remaining)               │
│  • Study ABC-301 procurement review (meeting tomorrow)        │
│  • Shanghai port disruption (monitoring)                      │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│  📅 TOMORROW'S PRIORITIES (3 actions)                         │
│  • Follow up on Site 205 customs clearance                    │
│  • Review consolidation proposal with finance                 │
│  • Check Site 602 transfer documentation                      │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│  📊 TODAY'S IMPACT                                            │
│  • Cost savings: $70,000 (consolidation opportunity)          │
│  • Risk mitigation: 3 potential stock-outs prevented          │
│  • Shipments processed: 12 (all on-time)                      │
│  • Issues resolved: 8 of 11 (73%)                             │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## 📝 Continued in LANGGRAPH_IMPLEMENTATION.md...

This covers UX design. Next file will include:
- Complete LangGraph implementation
- RAG vector database setup
- Demo data generation scripts
- Frontend-backend integration

Should I continue?