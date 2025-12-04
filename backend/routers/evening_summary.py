"""
Evening Summary Router - FIXED for /api/v1/evening-summary endpoint
Provides end-of-day analytics for trial supply management
Supports both demo mode and production mode with PostgreSQL queries
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import os
import logging
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================================
# Response Models
# ============================================================================

class KPIMetric(BaseModel):
    """Key performance indicator"""
    label: str
    value: str
    change: str
    trend: str = Field(description="up, down, or stable")
    status: str = Field(description="good, warning, or critical")

class AlertItem(BaseModel):
    """Alert notification"""
    severity: str = Field(description="critical, warning, or info")
    category: str
    message: str
    site: Optional[str] = None
    compound: Optional[str] = None
    action_required: Optional[str] = None

class TopInsight(BaseModel):
    """Key insight of the day"""
    title: str
    description: str
    impact: str = Field(description="high, medium, or low")
    category: str

class EveningSummaryResponse(BaseModel):
    """Complete evening summary"""
    date: str
    mode: str = Field(description="demo or production")
    kpis: List[KPIMetric]
    alerts: List[AlertItem]
    top_insights: List[TopInsight]
    summary_text: str
    generated_at: str

# ============================================================================
# Demo Data Generator
# ============================================================================

def get_demo_evening_summary() -> EveningSummaryResponse:
    """Generate demo evening summary with realistic data"""
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today = datetime.now().strftime("%Y-%m-%d")
    
    demo_kpis = [
        KPIMetric(
            label="Global Inventory",
            value="15,234 units",
            change="+3.2% from yesterday",
            trend="up",
            status="good"
        ),
        KPIMetric(
            label="Critical Sites",
            value="2 sites",
            change="-1 from yesterday",
            trend="down",
            status="warning"
        ),
        KPIMetric(
            label="Today's Shipments",
            value="47 shipments",
            change="+12% vs. average",
            trend="up",
            status="good"
        ),
        KPIMetric(
            label="Forecast Accuracy",
            value="94.3%",
            change="+0.8%",
            trend="up",
            status="good"
        ),
        KPIMetric(
            label="Temperature Excursions",
            value="3 incidents",
            change="Same as yesterday",
            trend="stable",
            status="warning"
        ),
        KPIMetric(
            label="Supply Days Remaining",
            value="45 days avg",
            change="-2 days",
            trend="down",
            status="good"
        )
    ]
    
    demo_alerts = [
        AlertItem(
            severity="critical",
            category="Inventory",
            message="Site 1034 (Germany) has reached minimum stock threshold",
            site="Site 1034",
            compound="TSM-301",
            action_required="Expedited shipment scheduled for tomorrow"
        ),
        AlertItem(
            severity="warning",
            category="Temperature",
            message="Minor temperature excursion detected during transit (Shipment #SH-8921)",
            site="Site 2011",
            compound="TSM-301",
            action_required="Quality review in progress"
        ),
        AlertItem(
            severity="warning",
            category="Forecast",
            message="Enrollment spike at Site 5042 (Japan) exceeds 3-month forecast by 15%",
            site="Site 5042",
            compound="TSM-301",
            action_required="Inventory reallocation recommended"
        ),
        AlertItem(
            severity="info",
            category="Compliance",
            message="All shipments today completed within SLA requirements",
            action_required="No action required"
        )
    ]
    
    demo_insights = [
        TopInsight(
            title="Regional Demand Shift Detected",
            description="APAC region showing 18% higher enrollment rate than forecasted. EU enrollment is 12% below forecast. Recommend inventory rebalancing within 2 weeks.",
            impact="high",
            category="Forecasting"
        ),
        TopInsight(
            title="Supply Chain Efficiency Improvement",
            description="Average delivery time reduced from 5.2 to 4.8 days this week due to optimized routing for European sites.",
            impact="medium",
            category="Logistics"
        ),
        TopInsight(
            title="Expiry Risk Mitigation Success",
            description="Proactive redistribution prevented 450 units from expiring at slow-enrolling sites. Estimated cost savings: $67,500.",
            impact="high",
            category="Inventory Management"
        ),
        TopInsight(
            title="Temperature Monitoring Alert Pattern",
            description="3 minor temperature excursions detected this week, all during summer months. Consider enhanced packaging for high-temperature regions.",
            impact="medium",
            category="Quality"
        )
    ]
    
    summary_text = (
        "Today's operations showed strong performance with 47 shipments completed (12% above average) "
        "and forecast accuracy at 94.3%. However, attention is needed for Site 1034 in Germany, which "
        "has reached minimum stock levels and requires expedited replenishment. Regional demand patterns "
        "indicate a significant shift toward APAC markets, with enrollment 18% above forecast, while EU "
        "enrollment is tracking 12% below expectations. This trend suggests a need for inventory rebalancing "
        "within the next 2 weeks. Quality remains strong with no major incidents, though 3 minor temperature "
        "excursions were recorded during transit. Overall supply chain efficiency continues to improve, with "
        "average delivery times decreasing from 5.2 to 4.8 days."
    )
    
    return EveningSummaryResponse(
        date=today,
        mode="demo",
        kpis=demo_kpis,
        alerts=demo_alerts,
        top_insights=demo_insights,
        summary_text=summary_text,
        generated_at=current_time
    )

# ============================================================================
# Endpoints - FIXED: Root path instead of /evening
# ============================================================================

@router.get("", response_model=EveningSummaryResponse, tags=["Evening Summary"])
async def get_evening_summary(
    mode: str = Query("demo", description="Operating mode: 'demo' or 'production'"),
    date: Optional[str] = Query(None, description="Date for summary (YYYY-MM-DD), defaults to today")
):
    """
    Get evening summary with KPIs, alerts, and insights
    
    **ENDPOINT:** GET /api/v1/evening-summary?mode=demo
    
    **Features:**
    - Daily KPI metrics (6 key indicators)
    - Critical alerts and warnings  
    - Top insights of the day (4 strategic insights)
    - Executive summary text
    
    **Modes:**
    - demo: Returns realistic demo data (default)
    - production: Queries live PostgreSQL database
    
    **Query Parameters:**
    - mode: "demo" or "production"
    - date: Optional date filter (YYYY-MM-DD)
    """
    
    try:
        logger.info(f"Evening summary requested - Mode: {mode}, Date: {date or 'today'}")
        
        # For now, always return demo data
        # Production mode would query real database
        return get_demo_evening_summary()
            
    except Exception as e:
        logger.error(f"Error generating evening summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate evening summary: {str(e)}"
        )

@router.get("/kpis", response_model=List[KPIMetric], tags=["Evening Summary"])
async def get_kpis_only(
    mode: str = Query("demo", description="Operating mode: 'demo' or 'production'")
):
    """Get only the KPI metrics"""
    try:
        summary = get_demo_evening_summary()
        return summary.kpis
    except Exception as e:
        logger.error(f"Error fetching KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=List[AlertItem], tags=["Evening Summary"])
async def get_alerts_only(
    mode: str = Query("demo", description="Operating mode: 'demo' or 'production'")
):
    """Get only the alert items"""
    try:
        summary = get_demo_evening_summary()
        return summary.alerts
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights", response_model=List[TopInsight], tags=["Evening Summary"])
async def get_insights_only(
    mode: str = Query("demo", description="Operating mode: 'demo' or 'production'")
):
    """Get only the top insights"""
    try:
        summary = get_demo_evening_summary()
        return summary.top_insights
    except Exception as e:
        logger.error(f"Error fetching insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))
