# Sally TSM: Production-Ready Implementation Guide

## 📋 Overview

Complete guide to make Sally TSM production-ready with:
- Control Panel Dashboard with live metrics
- Q&A with visual + textual responses (LangChain)
- Full-screen optimized UI (maximize content, minimize chrome)
- One-click schema deployment with pre-populated realistic data
- Morning Brief persistence (generated once daily)
- Theme consistency across all screens
- Vercel & Railway deployment optimization

---

## 🎯 Part 1: Control Panel Dashboard Design

### Design Philosophy
**Real-time operational overview with intelligent alerts**

```
┌────────────────────────────────────────────────────────────────┐
│  Sally TSM - Control Panel           🔔 Alerts: 3  👤 Sarah   │ ← Compact header (40px)
├────────────────────────────────────────────────────────────────┤
│  📊 Overview Metrics                                [Refresh]  │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐│
│  │ 🚢 Shipments │ 📦 Inventory │ 🏥 Sites     │ 👥 Subjects  ││
│  │                                                             ││
│  │ Total: 156   │ Total Items  │ Total: 124   │ Enrolled     ││
│  │ In Transit:45│ 8,492        │ Active: 118  │ 2,847        ││
│  │ Delayed: 3🔴 │ Low Stock:12🟡│ At Risk: 7🟠│ Completed    ││
│  │ On Time: 96% │ Expiring:8🟡 │ Healthy:111✅│ 1,203        ││
│  └──────────────┴──────────────┴──────────────┴──────────────┘│
│                                                                 │
│  🚨 Sites Requiring Immediate Attention                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 Site 205 (Berlin) - Stock-Out Risk                      ││
│  │    • Only 4 days of Drug X remaining                       ││
│  │    • Shipment delayed in customs (5 days)                  ││
│  │    [View Details] [Suggest Transfer] [Contact Site]       ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🟠 Site 309 (Tokyo) - Temperature Excursion                ││
│  │    • Shipment #SH-8892: 12°C spike (2 hours)               ││
│  │    • QA decision pending                                   ││
│  │    [View Incident] [Review Data] [Notify QA]              ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🟡 Site 112 (Berlin) - Expiry Risk                         ││
│  │    • 80 kits expiring in 45 days                           ││
│  │    • Transfer opportunity to Site 118 (Vienna)             ││
│  │    [View Analysis] [Initiate Transfer] [Calculate Savings]││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  📦 Inventory Alerts                                           │
│  ┌──────────────────────┬──────────────────────┬──────────────┐│
│  │ Low Stock (12 sites) │ Expiring Soon (8)    │ Overstocked  ││
│  │ [View Report]        │ [Redistribution Plan]│ [Optimize]   ││
│  └──────────────────────┴──────────────────────┴──────────────┘│
│                                                                 │
│  🚢 Shipment Status Map                        [Full Screen]  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │        [Interactive world map with shipment pins]          ││
│  │  🟢 On-time: 42    🟡 At-risk: 8    🔴 Delayed: 3          ││
│  │  📍 Click any shipment for details                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  📈 Real-Time Monitoring                                       │
│  ┌──────────────────────┬──────────────────────┬──────────────┐│
│  │ Enrollment Velocity  │ Demand Forecast      │ Supply Health││
│  │ [Live Chart]         │ [Trend Analysis]     │ [Score: 87]  ││
│  └──────────────────────┴──────────────────────┴──────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### Key Features
1. **Live Metrics** - Real-time updates (WebSocket or polling)
2. **Intelligent Alerts** - Priority-ranked issues
3. **Visual Map** - Geographic shipment tracking
4. **One-Click Actions** - Direct from control panel

---

### Control Panel Implementation

#### Backend API Endpoint
```python
# sally-backend/api/v1/control_panel.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
import asyncio

router = APIRouter()

@router.get("/api/v1/control-panel/overview")
async def get_control_panel_overview(db: Session = Depends(get_db)) -> Dict:
    """
    Get complete control panel data in a single call
    Optimized for performance
    """
    
    # Execute all queries in parallel
    results = await asyncio.gather(
        get_shipment_metrics(db),
        get_inventory_metrics(db),
        get_site_metrics(db),
        get_subject_metrics(db),
        get_priority_alerts(db),
        get_inventory_alerts(db)
    )
    
    return {
        'shipments': results[0],
        'inventory': results[1],
        'sites': results[2],
        'subjects': results[3],
        'priority_alerts': results[4],
        'inventory_alerts': results[5],
        'last_updated': datetime.now().isoformat()
    }

async def get_shipment_metrics(db: Session) -> Dict:
    """Get shipment metrics"""
    query = """
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE shipment_status = 'in_transit') as in_transit,
        COUNT(*) FILTER (WHERE shipment_status = 'delayed') as delayed,
        ROUND(100.0 * COUNT(*) FILTER (WHERE 
            expected_delivery_date >= CURRENT_DATE
        ) / NULLIF(COUNT(*), 0), 1) as on_time_percentage
    FROM gold_shipments
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    """
    
    result = db.execute(query).fetchone()
    
    return {
        'total': result['total'],
        'in_transit': result['in_transit'],
        'delayed': result['delayed'],
        'on_time_percentage': result['on_time_percentage']
    }

async def get_inventory_metrics(db: Session) -> Dict:
    """Get inventory metrics"""
    query = """
    SELECT 
        SUM(quantity) as total_items,
        COUNT(DISTINCT site_id) FILTER (WHERE 
            quantity < reorder_point
        ) as low_stock_sites,
        COUNT(*) FILTER (WHERE 
            days_until_expiry <= 60 AND quantity > 0
        ) as expiring_soon
    FROM gold_inventory
    WHERE quantity > 0
    """
    
    result = db.execute(query).fetchone()
    
    return {
        'total_items': result['total_items'],
        'low_stock_sites': result['low_stock_sites'],
        'expiring_soon': result['expiring_soon']
    }

async def get_site_metrics(db: Session) -> Dict:
    """Get site metrics"""
    query = """
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE site_status = 'Active') as active,
        COUNT(*) FILTER (WHERE site_id IN (
            SELECT DISTINCT site_id 
            FROM gold_inventory 
            WHERE quantity < reorder_point
        )) as at_risk,
        COUNT(*) FILTER (WHERE site_status = 'Active' AND site_id NOT IN (
            SELECT DISTINCT site_id 
            FROM gold_inventory 
            WHERE quantity < reorder_point
        )) as healthy
    FROM gold_sites
    """
    
    result = db.execute(query).fetchone()
    
    return {
        'total': result['total'],
        'active': result['active'],
        'at_risk': result['at_risk'],
        'healthy': result['healthy']
    }

async def get_subject_metrics(db: Session) -> Dict:
    """Get subject metrics"""
    query = """
    SELECT 
        COUNT(*) FILTER (WHERE subject_status IN ('Enrolled', 'Active')) as enrolled,
        COUNT(*) FILTER (WHERE subject_status = 'Completed') as completed
    FROM gold_subjects
    """
    
    result = db.execute(query).fetchone()
    
    return {
        'enrolled': result['enrolled'],
        'completed': result['completed']
    }

async def get_priority_alerts(db: Session) -> List[Dict]:
    """Get priority alerts from morning brief engine"""
    from services.priority_engine import MorningBriefPriorityEngine
    
    engine = MorningBriefPriorityEngine(db)
    brief = engine.generate_brief(user_id='current_user', user_role='TSM')
    
    # Get top 5 urgent issues
    return brief['urgent'][:5]

async def get_inventory_alerts(db: Session) -> Dict:
    """Get inventory-specific alerts"""
    low_stock = db.execute("""
        SELECT COUNT(DISTINCT site_id) 
        FROM gold_inventory 
        WHERE quantity < reorder_point
    """).scalar()
    
    expiring = db.execute("""
        SELECT COUNT(*) 
        FROM gold_inventory 
        WHERE days_until_expiry <= 60 AND quantity > 0
    """).scalar()
    
    overstocked = db.execute("""
        SELECT COUNT(DISTINCT site_id) 
        FROM gold_inventory 
        WHERE quantity > (reorder_point * 3)
    """).scalar()
    
    return {
        'low_stock_count': low_stock,
        'expiring_count': expiring,
        'overstocked_count': overstocked
    }
```

#### Frontend Component
```typescript
// src/components/ControlPanel.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/configApi';
import { 
  Ship, Package, Building, Users, 
  AlertCircle, TrendingUp, RefreshCw 
} from 'lucide-react';

interface ControlPanelData {
  shipments: {
    total: number;
    in_transit: number;
    delayed: number;
    on_time_percentage: number;
  };
  inventory: {
    total_items: number;
    low_stock_sites: number;
    expiring_soon: number;
  };
  sites: {
    total: number;
    active: number;
    at_risk: number;
    healthy: number;
  };
  subjects: {
    enrolled: number;
    completed: number;
  };
  priority_alerts: Alert[];
  inventory_alerts: {
    low_stock_count: number;
    expiring_count: number;
    overstocked_count: number;
  };
  last_updated: string;
}

interface Alert {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  site_name: string;
  description: string;
  suggested_actions: string[];
}

export function ControlPanel() {
  const { data, isLoading, refetch } = useQuery<ControlPanelData>({
    queryKey: ['control-panel'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/control-panel/overview');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full w-full overflow-auto p-4 space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Control Panel</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Updated: {new Date(data.last_updated).toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics - 4 Cards in Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          icon={<Ship className="h-6 w-6" />}
          title="Shipments"
          metrics={[
            { label: 'Total', value: data.shipments.total },
            { label: 'In Transit', value: data.shipments.in_transit },
            { 
              label: 'Delayed', 
              value: data.shipments.delayed,
              variant: data.shipments.delayed > 0 ? 'destructive' : 'default'
            },
            { 
              label: 'On Time', 
              value: `${data.shipments.on_time_percentage}%`,
              variant: data.shipments.on_time_percentage >= 95 ? 'success' : 'warning'
            },
          ]}
        />

        <MetricCard
          icon={<Package className="h-6 w-6" />}
          title="Inventory"
          metrics={[
            { label: 'Total Items', value: data.inventory.total_items.toLocaleString() },
            { 
              label: 'Low Stock', 
              value: data.inventory.low_stock_sites,
              variant: data.inventory.low_stock_sites > 0 ? 'warning' : 'default'
            },
            { 
              label: 'Expiring Soon', 
              value: data.inventory.expiring_soon,
              variant: data.inventory.expiring_soon > 0 ? 'warning' : 'default'
            },
          ]}
        />

        <MetricCard
          icon={<Building className="h-6 w-6" />}
          title="Sites"
          metrics={[
            { label: 'Total', value: data.sites.total },
            { label: 'Active', value: data.sites.active },
            { 
              label: 'At Risk', 
              value: data.sites.at_risk,
              variant: data.sites.at_risk > 0 ? 'destructive' : 'default'
            },
            { label: 'Healthy', value: data.sites.healthy, variant: 'success' },
          ]}
        />

        <MetricCard
          icon={<Users className="h-6 w-6" />}
          title="Subjects"
          metrics={[
            { label: 'Enrolled', value: data.subjects.enrolled },
            { label: 'Completed', value: data.subjects.completed },
          ]}
        />
      </div>

      {/* Priority Alerts */}
      {data.priority_alerts.length > 0 && (
        <Card className="border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Sites Requiring Immediate Attention ({data.priority_alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.priority_alerts.map((alert, idx) => (
              <AlertCard key={idx} alert={alert} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Inventory Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📦 Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <p className="text-2xl font-bold text-orange-600">
                {data.inventory_alerts.low_stock_count}
              </p>
              <p className="text-sm text-muted-foreground">Low Stock Sites</p>
              <Button variant="outline" size="sm" className="mt-2">
                View Report
              </Button>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-2xl font-bold text-yellow-600">
                {data.inventory_alerts.expiring_count}
              </p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <Button variant="outline" size="sm" className="mt-2">
                Redistribution Plan
              </Button>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-2xl font-bold text-blue-600">
                {data.inventory_alerts.overstocked_count}
              </p>
              <p className="text-sm text-muted-foreground">Overstocked</p>
              <Button variant="outline" size="sm" className="mt-2">
                Optimize
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon, title, metrics }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <Badge variant={metric.variant || 'default'}>
              {metric.value}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const severityColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className={`border-l-4 p-4 rounded ${severityColors[alert.severity]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{alert.site_name}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {alert.description}
          </p>
        </div>
        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
          {alert.severity.toUpperCase()}
        </Badge>
      </div>
      <div className="flex gap-2 mt-3">
        {alert.suggested_actions.slice(0, 3).map((action, idx) => (
          <Button key={idx} variant="outline" size="sm">
            {formatActionLabel(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Part 2: Q&A with Visual + Textual Responses

### Design Philosophy
**Multi-modal responses: Charts + Tables + Natural Language**

### LangChain Integration with Visual Response Generation

```python
# sally-backend/services/qa_with_visuals.py

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import Tool
from typing import Dict, List, Union
import pandas as pd
import json

class VisualQAService:
    """
    Q&A Service that generates both textual and visual responses
    """
    
    def __init__(self, db_connection, gemini_api_key: str):
        self.db = db_connection
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=gemini_api_key,
            temperature=0.1
        )
        
        # Define tools for LangChain
        self.tools = [
            Tool(
                name="QueryDatabase",
                func=self._query_database,
                description="Execute SQL queries on the database"
            ),
            Tool(
                name="CalculateMetrics",
                func=self._calculate_metrics,
                description="Calculate metrics and statistics"
            ),
            Tool(
                name="GenerateChart",
                func=self._generate_chart_spec,
                description="Generate chart specifications for data visualization"
            )
        ]
    
    async def process_query(self, user_question: str) -> Dict:
        """
        Process user query and return multi-modal response
        
        Returns:
            {
                'answer': str,  # Natural language answer
                'data_table': List[Dict],  # Tabular data (if applicable)
                'chart_spec': Dict,  # Chart specification (if applicable)
                'recommendations': List[str],  # Actionable recommendations
                'sql_executed': str  # SQL query that was run (for transparency)
            }
        """
        
        # Step 1: Understand the query and determine response type
        query_analysis = await self._analyze_query(user_question)
        
        # Step 2: Execute appropriate data retrieval
        data = await self._retrieve_data(query_analysis)
        
        # Step 3: Generate natural language answer
        answer = await self._generate_answer(user_question, data, query_analysis)
        
        # Step 4: Generate visualizations if applicable
        visualizations = await self._generate_visualizations(data, query_analysis)
        
        # Step 5: Generate recommendations based on scenario
        recommendations = await self._generate_recommendations(data, query_analysis)
        
        return {
            'answer': answer,
            'data_table': data.get('table_data'),
            'chart_spec': visualizations.get('chart_spec'),
            'recommendations': recommendations,
            'sql_executed': data.get('sql_query'),
            'query_type': query_analysis['type']
        }
    
    async def _analyze_query(self, question: str) -> Dict:
        """Analyze query to determine intent and response type"""
        
        prompt = PromptTemplate(
            input_variables=["question"],
            template="""
            Analyze this user question and determine:
            1. Query type (metrics, comparison, trend, risk_assessment, recommendation)
            2. Entities involved (sites, shipments, inventory, subjects)
            3. Whether visualization is appropriate
            4. Best chart type (if visualization needed): bar, line, pie, scatter, table
            
            Question: {question}
            
            Respond in JSON format:
            {{
                "type": "query_type",
                "entities": ["entity1", "entity2"],
                "needs_visualization": true/false,
                "chart_type": "bar/line/pie/scatter/table/none",
                "time_based": true/false
            }}
            """
        )
        
        chain = LLMChain(llm=self.llm, prompt=prompt)
        result = await chain.arun(question=question)
        
        return json.loads(result)
    
    async def _retrieve_data(self, query_analysis: Dict) -> Dict:
        """Retrieve data based on query analysis"""
        
        # Generate SQL based on query type
        sql_generator_prompt = PromptTemplate(
            input_variables=["query_type", "entities"],
            template="""
            Generate a SQL query for this analysis:
            Type: {query_type}
            Entities: {entities}
            
            Available tables:
            - gold_sites (site_id, site_name, country, site_status)
            - gold_inventory (site_id, product_name, quantity, days_until_expiry)
            - gold_shipments (shipment_id, site_id, shipment_status, expected_delivery_date)
            - gold_subjects (subject_id, site_id, subject_status, enrollment_date)
            - gold_site_transfers (transfer_id, source_site_id, destination_site_id, quantity_transferred)
            - gold_vendor_performance_history (vendor_id, on_time_rate, risk_score)
            
            Generate ONLY the SQL query, no explanations.
            """
        )
        
        chain = LLMChain(llm=self.llm, prompt=sql_generator_prompt)
        sql_query = await chain.arun(
            query_type=query_analysis['type'],
            entities=str(query_analysis['entities'])
        )
        
        # Execute SQL
        result = pd.read_sql(sql_query, self.db)
        
        return {
            'sql_query': sql_query,
            'table_data': result.to_dict('records'),
            'dataframe': result
        }
    
    async def _generate_answer(
        self, 
        question: str, 
        data: Dict, 
        query_analysis: Dict
    ) -> str:
        """Generate natural language answer"""
        
        prompt = PromptTemplate(
            input_variables=["question", "data", "query_type"],
            template="""
            Based on this data analysis, provide a clear, concise answer to the user's question.
            
            Question: {question}
            Query Type: {query_type}
            Data Summary: {data}
            
            Provide:
            1. Direct answer to the question
            2. Key insights from the data
            3. Context and implications
            
            Keep it conversational and actionable.
            """
        )
        
        chain = LLMChain(llm=self.llm, prompt=prompt)
        
        # Summarize data for prompt
        data_summary = self._summarize_data(data['dataframe'])
        
        answer = await chain.arun(
            question=question,
            data=data_summary,
            query_type=query_analysis['type']
        )
        
        return answer
    
    async def _generate_visualizations(
        self, 
        data: Dict, 
        query_analysis: Dict
    ) -> Dict:
        """Generate chart specifications for frontend rendering"""
        
        if not query_analysis.get('needs_visualization'):
            return {}
        
        df = data['dataframe']
        chart_type = query_analysis.get('chart_type', 'bar')
        
        # Generate chart spec based on data and chart type
        if chart_type == 'bar':
            return self._generate_bar_chart_spec(df)
        elif chart_type == 'line':
            return self._generate_line_chart_spec(df)
        elif chart_type == 'pie':
            return self._generate_pie_chart_spec(df)
        elif chart_type == 'scatter':
            return self._generate_scatter_chart_spec(df)
        else:
            return {}
    
    def _generate_bar_chart_spec(self, df: pd.DataFrame) -> Dict:
        """Generate Recharts bar chart specification"""
        
        # Assuming first column is x-axis, second is y-axis
        x_column = df.columns[0]
        y_column = df.columns[1]
        
        return {
            'type': 'bar',
            'data': df.to_dict('records'),
            'xKey': x_column,
            'bars': [
                {
                    'dataKey': y_column,
                    'fill': '#8884d8',
                    'name': y_column.replace('_', ' ').title()
                }
            ],
            'title': f'{y_column.replace("_", " ").title()} by {x_column.replace("_", " ").title()}'
        }
    
    def _generate_line_chart_spec(self, df: pd.DataFrame) -> Dict:
        """Generate Recharts line chart specification"""
        
        x_column = df.columns[0]
        y_columns = df.columns[1:]
        
        return {
            'type': 'line',
            'data': df.to_dict('records'),
            'xKey': x_column,
            'lines': [
                {
                    'dataKey': col,
                    'stroke': self._get_color(idx),
                    'name': col.replace('_', ' ').title()
                }
                for idx, col in enumerate(y_columns)
            ],
            'title': f'Trend Analysis'
        }
    
    async def _generate_recommendations(
        self, 
        data: Dict, 
        query_analysis: Dict
    ) -> List[str]:
        """Generate actionable recommendations based on data"""
        
        prompt = PromptTemplate(
            input_variables=["data", "query_type"],
            template="""
            Based on this data analysis, provide 3-5 actionable recommendations.
            
            Data: {data}
            Query Type: {query_type}
            
            For each recommendation:
            - Be specific and actionable
            - Include expected impact
            - Prioritize by urgency
            
            Format as a JSON array of strings.
            """
        )
        
        chain = LLMChain(llm=self.llm, prompt=prompt)
        
        data_summary = self._summarize_data(data['dataframe'])
        
        result = await chain.arun(
            data=data_summary,
            query_type=query_analysis['type']
        )
        
        return json.loads(result)
    
    def _summarize_data(self, df: pd.DataFrame) -> str:
        """Create a text summary of dataframe"""
        summary = f"Rows: {len(df)}\n"
        summary += f"Columns: {', '.join(df.columns)}\n"
        
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                summary += f"{col}: min={df[col].min()}, max={df[col].max()}, avg={df[col].mean():.2f}\n"
        
        return summary
    
    def _get_color(self, index: int) -> str:
        """Get color for chart series"""
        colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
        return colors[index % len(colors)]
```

### Frontend Q&A Component with Visual Response

```typescript
// src/components/OnDemandQA.tsx

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Loader2, Send } from 'lucide-react';
import { apiClient } from '@/lib/configApi';

interface QAResponse {
  answer: string;
  data_table?: any[];
  chart_spec?: ChartSpec;
  recommendations?: string[];
  sql_executed?: string;
  query_type: string;
}

interface ChartSpec {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  data: any[];
  xKey?: string;
  bars?: Array<{ dataKey: string; fill: string; name: string }>;
  lines?: Array<{ dataKey: string; stroke: string; name: string }>;
  title: string;
}

export function OnDemandQA() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    try {
      const result = await apiClient.post('/api/v1/ai/qa-visual', {
        question: question
      });
      setResponse(result.data);
    } catch (error) {
      console.error('Q&A failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-4 space-y-4">
      {/* Query Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Ask anything about your supply chain..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Response Area */}
      {response && (
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Text Answer */}
          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{response.answer}</p>
            </CardContent>
          </Card>

          {/* Visual Chart */}
          {response.chart_spec && (
            <Card>
              <CardHeader>
                <CardTitle>{response.chart_spec.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  {renderChart(response.chart_spec)}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          {response.data_table && response.data_table.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(response.data_table[0]).map(key => (
                          <th key={key} className="text-left p-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {response.data_table.map((row, idx) => (
                        <tr key={idx} className="border-b">
                          {Object.values(row).map((val: any, i) => (
                            <td key={i} className="p-2">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {response.recommendations && response.recommendations.length > 0 && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-green-700">
                  💡 Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {response.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-semibold">{idx + 1}.</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </CardContent>
            </Card>
          )}

          {/* SQL Query (for transparency) */}
          {response.sql_executed && (
            <Card className="border-gray-300">
              <CardHeader>
                <CardTitle className="text-sm">SQL Query Executed</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {response.sql_executed}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function renderChart(spec: ChartSpec) {
  switch (spec.type) {
    case 'bar':
      return (
        <BarChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={spec.xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {spec.bars?.map(bar => (
            <Bar key={bar.dataKey} {...bar} />
          ))}
        </BarChart>
      );
    
    case 'line':
      return (
        <LineChart data={spec.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={spec.xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {spec.lines?.map(line => (
            <Line key={line.dataKey} {...line} />
          ))}
        </LineChart>
      );
    
    // Add other chart types...
    default:
      return null;
  }
}
```

---

## 🎯 Part 3: Full-Screen UI Optimization

### Current Problem
- Redundant header taking 80-100px
- Excessive padding/margins
- Small content area
- Lots of scrolling

### Solution: Maximize Content Area

```typescript
// src/App.tsx - Optimized Layout

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompactHeader } from '@/components/CompactHeader';
import { ControlPanel } from '@/components/ControlPanel';
import { MorningBrief } from '@/components/MorningBrief';
import { OnDemandQA } from '@/components/OnDemandQA';
import { EndOfDaySummary } from '@/components/EndOfDaySummary';
import { ConfigurationCockpit } from '@/components/ConfigurationCockpit';

export function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* Compact Header - Fixed 48px height */}
        <CompactHeader />
        
        {/* Main Content - Fills remaining space */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ControlPanel />} />
            <Route path="/morning-brief" element={<MorningBrief />} />
            <Route path="/qa" element={<OnDemandQA />} />
            <Route path="/end-of-day" element={<EndOfDaySummary />} />
            <Route path="/config" element={<ConfigurationCockpit />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

```typescript
// src/components/CompactHeader.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function CompactHeader() {
  const location = useLocation();
  const { currentUser, theme } = useApp();
  
  const nav Items = [
    { path: '/', label: 'Control Panel' },
    { path: '/morning-brief', label: 'Morning Brief' },
    { path: '/qa', label: 'Q&A Assistant' },
    { path: '/end-of-day', label: 'End of Day' },
  ];

  return (
    <header className="h-12 border-b bg-background flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="font-bold text-lg">Sally TSM</div>
      
      {/* Navigation - Compact Tabs */}
      <nav className="flex gap-2 flex-1">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-1 rounded text-sm ${
              location.pathname === item.path
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
          <Badge variant="destructive" className="ml-1">3</Badge>
        </Button>
        
        <Button variant="ghost" size="sm" asChild>
          <Link to="/config">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
          <span className="ml-1 text-sm">{currentUser}</span>
        </Button>
      </div>
    </header>
  );
}
```

### CSS Optimization
```css
/* src/index.css - Add these */

/* Remove default margins */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Full viewport */
html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Compact scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--background);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}

/* Reduce card padding on small screens */
@media (max-width: 1024px) {
  .card {
    padding: 0.75rem;
  }
}
```

---

## 🎯 Part 4: Theme Consistency

### Problem
Configuration Cockpit doesn't respect theme changes

### Solution: Apply Theme to All Components

```typescript
// src/components/ConfigurationCockpit.tsx - Add theme classes

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ConfigurationCockpit() {
  const { theme } = useApp();
  
  return (
    <div className={`h-full w-full overflow-auto p-4 space-y-4 ${theme}`}>
      {/* Theme is now applied to root container */}
      
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

```typescript
// src/contexts/AppContext.tsx - Ensure theme propagates

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  theme: 'light' | 'dark';
  updateTheme: (theme: 'light' | 'dark') => void;
  // ... other properties
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const updateTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    
    // Apply to document root
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
  };
  
  // Load theme on mount
  useEffect(() => {
    const saved Theme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      updateTheme(savedTheme);
    }
  }, []);
  
  return (
    <AppContext.Provider value={{ theme, updateTheme, ... }}>
      <div className={theme}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
```

---

## 🎯 Part 5: One-Click Schema Deployment

### Feature Requirements
1. Default SQL DDL file in repository
2. "Deploy Schema" button
3. "Validate Schema" shows tables/columns (not DDL text)
4. Download/Upload modified schema
5. Pre-populated demo data

### Implementation

#### Default Schema SQL File
```sql
-- public/schema/default_schema.sql

-- This file contains the complete Sally TSM database schema
-- It can be deployed to PostgreSQL, MySQL, or SQLite

-- Drop existing tables (if any)
DROP TABLE IF EXISTS gold_site_transfers CASCADE;
DROP TABLE IF EXISTS gold_vendor_communications CASCADE;
DROP TABLE IF EXISTS gold_vendor_performance_history CASCADE;
DROP TABLE IF EXISTS gold_enrollment_analytics CASCADE;
DROP TABLE IF EXISTS gold_demand_forecasts CASCADE;
DROP TABLE IF EXISTS gold_shipment_temperature_logs CASCADE;
DROP TABLE IF EXISTS gold_temperature_excursion_incidents CASCADE;
DROP TABLE IF EXISTS gold_expiry_risk_analysis CASCADE;
DROP TABLE IF EXISTS gold_customs_incidents CASCADE;
DROP TABLE IF EXISTS gold_depot_inventory CASCADE;
DROP TABLE IF EXISTS gold_procurement_optimization_scenarios CASCADE;
DROP TABLE IF EXISTS gold_dispensations CASCADE;
DROP TABLE IF EXISTS gold_randomizations CASCADE;
DROP TABLE IF EXISTS gold_adverse_events CASCADE;
DROP TABLE IF EXISTS gold_protocol_deviations CASCADE;
DROP TABLE IF EXISTS gold_visits CASCADE;
DROP TABLE IF EXISTS gold_tasks CASCADE;
DROP TABLE IF EXISTS gold_shipments CASCADE;
DROP TABLE IF EXISTS gold_inventory CASCADE;
DROP TABLE IF EXISTS gold_products CASCADE;
DROP TABLE IF EXISTS gold_vendors CASCADE;
DROP TABLE IF EXISTS gold_subjects CASCADE;
DROP TABLE IF EXISTS gold_sites CASCADE;
DROP TABLE IF EXISTS gold_studies CASCADE;

-- Create tables in dependency order

-- 1. Studies
CREATE TABLE gold_studies (
    study_id VARCHAR(50) PRIMARY KEY,
    study_name VARCHAR(200) NOT NULL,
    study_code VARCHAR(100) NOT NULL UNIQUE,
    protocol_number VARCHAR(100),
    study_phase VARCHAR(50),
    study_type VARCHAR(100),
    therapeutic_area VARCHAR(200),
    indication VARCHAR(500),
    sponsor_name VARCHAR(200),
    study_status VARCHAR(50) NOT NULL,
    randomization_type VARCHAR(100),
    blinding_type VARCHAR(100),
    target_enrollment INT,
    current_enrollment INT DEFAULT 0,
    planned_start_date DATE,
    actual_start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    primary_endpoint TEXT,
    regulatory_status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sites
CREATE TABLE gold_sites (
    site_id VARCHAR(50) PRIMARY KEY,
    site_number VARCHAR(100) NOT NULL,
    site_name VARCHAR(200) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    principal_investigator VARCHAR(200),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    site_status VARCHAR(50) NOT NULL,
    activation_date DATE,
    initiation_date DATE,
    enrollment_target INT,
    current_enrollment INT DEFAULT 0,
    enrollment_rate DECIMAL(5, 2),
    last_enrollment_date DATE,
    closeout_date DATE,
    depot_name VARCHAR(200),
    depot_contact VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- 3. Subjects
CREATE TABLE gold_subjects (
    subject_id VARCHAR(50) PRIMARY KEY,
    subject_number VARCHAR(100) NOT NULL,
    site_id VARCHAR(50) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    screening_number VARCHAR(100),
    randomization_number VARCHAR(100),
    treatment_arm VARCHAR(100),
    subject_status VARCHAR(50) NOT NULL,
    enrollment_date DATE,
    screening_date DATE,
    randomization_date DATE,
    completion_date DATE,
    withdrawal_date DATE,
    withdrawal_reason VARCHAR(500),
    age INT,
    gender VARCHAR(20),
    weight_kg DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- 4. Vendors
CREATE TABLE gold_vendors (
    vendor_id VARCHAR(50) PRIMARY KEY,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type VARCHAR(100),
    contact_person VARCHAR(200),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    address VARCHAR(500),
    country VARCHAR(100),
    service_type VARCHAR(200),
    on_time_delivery_rate DECIMAL(5, 2),
    average_delay_days DECIMAL(5, 2),
    risk_score INT DEFAULT 0,
    performance_grade VARCHAR(1),
    last_performance_review_date DATE,
    consecutive_late_deliveries INT DEFAULT 0,
    total_shipments_handled INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products
CREATE TABLE gold_products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(100),
    product_type VARCHAR(100),
    dosage_form VARCHAR(100),
    strength VARCHAR(50),
    unit_of_measure VARCHAR(50),
    storage_conditions VARCHAR(200),
    temperature_range VARCHAR(50),
    shelf_life_months INT,
    unit_cost_usd DECIMAL(10, 2),
    manufacturer VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inventory
CREATE TABLE gold_inventory (
    inventory_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100),
    quantity INT NOT NULL,
    quality_inspection_qty INT DEFAULT 0,
    blocked_qty INT DEFAULT 0,
    reorder_point INT DEFAULT 10,
    storage_location VARCHAR(100),
    expiry_date DATE,
    days_until_expiry INT,
    expiry_risk_level VARCHAR(20),
    consumption_rate_daily DECIMAL(10, 2),
    projected_consumption_by_expiry INT,
    waste_risk BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    temperature_range VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(50),
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id)
);

-- 7. Shipments
CREATE TABLE gold_shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    vendor VARCHAR(200),
    tracking_number VARCHAR(100),
    shipment_status VARCHAR(50) NOT NULL,
    origin_location VARCHAR(200),
    origin_country VARCHAR(100),
    destination_location VARCHAR(200),
    destination_country VARCHAR(100),
    shipped_date DATE,
    expected_delivery_date DATE,
    expected_delivery_days INT,
    actual_delivery_date DATE,
    contents TEXT,
    quantity INT,
    priority VARCHAR(50),
    temperature_controlled BOOLEAN DEFAULT FALSE,
    customs_status VARCHAR(50),
    customs_entry_date DATE,
    customs_clearance_date DATE,
    days_in_customs INT,
    customs_broker_name VARCHAR(200),
    customs_delay_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id)
);

-- ... (Continue with remaining 15+ tables)
-- Full schema continues in next section...

-- END OF SCHEMA
```

---

**This document continues in PRODUCTION_READY_IMPLEMENTATION_PART2.md due to length...**

Would you like me to continue with:
- Part 6: Morning Brief Daily Persistence
- Part 7: Demo Data Generation SQL
- Part 8: Schema Validation UI
- Part 9: Vercel & Railway Deployment Optimization
- Part 10: Complete Implementation Checklist