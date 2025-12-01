"""
Evening Summary Router - Provides end-of-day analytics for trial supply management
Supports both demo mode and production mode with real-time data
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import os
import logging
from datetime import datetime

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
# Demo Data
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
# Production Data Handler
# ============================================================================

async def get_production_evening_summary() -> EveningSummaryResponse:
    """
    Generate evening summary from production database
    This would typically query:
    - PostgreSQL for inventory/shipment data
    - Vector DB for historical insights
    - LLM for intelligent summarization
    """
    
    # TODO: Implement production logic
    # For now, return demo data with a flag
    logger.warning("Production mode evening summary not yet implemented - returning demo data")
    
    summary = get_demo_evening_summary()
    summary.mode = "production (demo data)"
    summary.summary_text = "[Production Mode - Using Demo Data] " + summary.summary_text
    
    return summary

# ============================================================================
# Endpoints
# ============================================================================

@router.get("/evening-summary", response_model=EveningSummaryResponse, tags=["Evening Summary"])
async def get_evening_summary(
    date: Optional[str] = Query(None, description="Date for summary (YYYY-MM-DD), defaults to today")
):
    """
    Get evening summary with KPIs, alerts, and insights
    
    **Features:**
    - Daily KPI metrics
    - Critical alerts and warnings
    - Top insights of the day
    - Executive summary text
    
    **Modes:**
    - Demo: Returns realistic demo data
    - Production: Queries live database (requires configuration)
    """
    
    try:
        application_mode = os.getenv("APPLICATION_MODE", "demo").lower()
        
        logger.info(f"Generating evening summary - Mode: {application_mode}, Date: {date or 'today'}")
        
        if application_mode == "demo":
            return get_demo_evening_summary()
        else:
            return await get_production_evening_summary()
            
    except Exception as e:
        logger.error(f"Error generating evening summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate evening summary: {str(e)}"
        )

@router.get("/evening-summary/kpis", response_model=List[KPIMetric], tags=["Evening Summary"])
async def get_kpis_only():
    """Get only the KPI metrics"""
    try:
        summary = get_demo_evening_summary()
        return summary.kpis
    except Exception as e:
        logger.error(f"Error fetching KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evening-summary/alerts", response_model=List[AlertItem], tags=["Evening Summary"])
async def get_alerts_only():
    """Get only the alert items"""
    try:
        summary = get_demo_evening_summary()
        return summary.alerts
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evening-summary/insights", response_model=List[TopInsight], tags=["Evening Summary"])
async def get_insights_only():
    """Get only the top insights"""
    try:
        summary = get_demo_evening_summary()
        return summary.top_insights
    except Exception as e:
        logger.error(f"Error fetching insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))
