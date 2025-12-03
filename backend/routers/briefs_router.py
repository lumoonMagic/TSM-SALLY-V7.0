"""
Morning Brief & Evening Summary Router - Phase 1D
WITH PRODUCTION MODE DATABASE INTEGRATION

This router provides daily operational summaries with REAL database queries
"""

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
import asyncpg
from pydantic import BaseModel

router = APIRouter(prefix="/briefs", tags=["Briefs"])

# Response Models
class MorningBriefResponse(BaseModel):
    date: str
    mode: str
    summary: Dict[str, Any]
    sections: Dict[str, Any]
    algorithms_used: List[str]
    generated_at: str

class EveningSummaryResponse(BaseModel):
    date: str
    mode: str
    summary: Dict[str, Any]
    sections: Dict[str, Any]
    generated_at: str


# Database connection (injected from main.py)
db_pool = None

def set_db_pool(pool):
    global db_pool
    db_pool = pool


async def get_production_morning_brief_data() -> Dict[str, Any]:
    """
    Fetch REAL data from database for morning brief
    """
    async with db_pool.acquire() as conn:
        # Critical Alerts
        critical_alerts = await conn.fetch("""
            SELECT 
                qe.severity,
                qe.event_type,
                s.site_id,
                s.site_name,
                qe.description,
                qe.resolution_status
            FROM gold_quality_events qe
            JOIN gold_sites s ON qe.site_id = s.site_id
            WHERE qe.severity IN ('critical', 'high')
              AND qe.resolution_status IN ('open', 'investigating')
            ORDER BY qe.event_date DESC
            LIMIT 10
        """)
        
        # Sites with low inventory
        low_inventory_sites = await conn.fetch("""
            SELECT 
                s.site_id,
                s.site_name,
                COUNT(DISTINCT i.product_id) as low_stock_products,
                SUM(i.quantity_available) as total_units
            FROM gold_sites s
            JOIN gold_inventory i ON s.site_id = i.site_id
            WHERE i.quantity_available < i.minimum_stock_level
            GROUP BY s.site_id, s.site_name
            ORDER BY low_stock_products DESC
            LIMIT 10
        """)
        
        # Active shipments
        active_shipments = await conn.fetch("""
            SELECT 
                shipment_id,
                from_location,
                to_site_id,
                status,
                expected_delivery_date,
                current_temperature
            FROM gold_shipments
            WHERE status IN ('in_transit', 'pending')
            ORDER BY expected_delivery_date
            LIMIT 20
        """)
        
        # Delayed shipments
        delayed_shipments = await conn.fetch("""
            SELECT COUNT(*) as count
            FROM gold_shipments
            WHERE status = 'delayed'
              OR (status = 'in_transit' AND expected_delivery_date < CURRENT_DATE)
        """)
        
        # Temperature issues
        temp_issues = await conn.fetch("""
            SELECT COUNT(DISTINCT shipment_id) as count
            FROM gold_temperature_logs
            WHERE alert_triggered = true
              AND recorded_at >= CURRENT_DATE - INTERVAL '24 hours'
        """)
        
        # Enrollment statistics
        enrollment_stats = await conn.fetch("""
            SELECT 
                st.study_id,
                st.study_name,
                st.target_enrollment,
                st.current_enrollment,
                COUNT(DISTINCT sub.subject_id) as active_subjects
            FROM gold_studies st
            LEFT JOIN gold_subjects sub ON st.study_id = sub.study_id 
                AND sub.status = 'active'
            WHERE st.status = 'active'
            GROUP BY st.study_id, st.study_name, st.target_enrollment, st.current_enrollment
        """)
        
        # Studies behind schedule
        studies_behind = await conn.fetch("""
            SELECT study_id, study_name
            FROM gold_studies
            WHERE status = 'active'
              AND current_enrollment < (target_enrollment * 0.7)
        """)
        
        return {
            "critical_alerts": [dict(row) for row in critical_alerts],
            "low_inventory_sites": [dict(row) for row in low_inventory_sites],
            "active_shipments": [dict(row) for row in active_shipments],
            "delayed_count": delayed_shipments[0]['count'] if delayed_shipments else 0,
            "temp_issues_count": temp_issues[0]['count'] if temp_issues else 0,
            "enrollment_stats": [dict(row) for row in enrollment_stats],
            "studies_behind": [dict(row) for row in studies_behind]
        }


async def get_production_evening_summary_data() -> Dict[str, Any]:
    """
    Fetch REAL data from database for evening summary
    """
    async with db_pool.acquire() as conn:
        # Issues resolved today
        resolved_today = await conn.fetch("""
            SELECT 
                event_type,
                COUNT(*) as count
            FROM gold_quality_events
            WHERE resolution_status = 'resolved'
              AND resolution_date = CURRENT_DATE
            GROUP BY event_type
        """)
        
        # Shipments delivered today
        deliveries_today = await conn.fetch("""
            SELECT 
                COUNT(*) as total_deliveries,
                COUNT(CASE WHEN actual_delivery_date <= expected_delivery_date THEN 1 END) as on_time,
                COUNT(CASE WHEN actual_delivery_date > expected_delivery_date THEN 1 END) as delayed
            FROM gold_shipments
            WHERE actual_delivery_date = CURRENT_DATE
        """)
        
        # New enrollments today
        enrollments_today = await conn.fetch("""
            SELECT 
                st.study_id,
                st.study_name,
                COUNT(sub.subject_id) as new_subjects
            FROM gold_studies st
            JOIN gold_subjects sub ON st.study_id = sub.study_id
            WHERE sub.enrollment_date = CURRENT_DATE
            GROUP BY st.study_id, st.study_name
        """)
        
        # Inventory changes
        inventory_movements = await conn.fetch("""
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN quantity_change > 0 THEN 1 ELSE 0 END) as additions,
                SUM(CASE WHEN quantity_change < 0 THEN 1 ELSE 0 END) as removals
            FROM (
                SELECT 
                    site_id,
                    product_id,
                    quantity_available - LAG(quantity_available) OVER (
                        PARTITION BY site_id, product_id ORDER BY updated_at
                    ) as quantity_change
                FROM gold_inventory
                WHERE updated_at >= CURRENT_DATE
            ) changes
            WHERE quantity_change IS NOT NULL
        """)
        
        # Shipments departing overnight
        overnight_shipments = await conn.fetch("""
            SELECT 
                shipment_id,
                from_location,
                to_site_id,
                expected_delivery_date
            FROM gold_shipments
            WHERE status = 'in_transit'
              AND expected_delivery_date = CURRENT_DATE + INTERVAL '1 day'
            LIMIT 10
        """)
        
        return {
            "resolved_today": [dict(row) for row in resolved_today],
            "deliveries": dict(deliveries_today[0]) if deliveries_today else {},
            "enrollments_today": [dict(row) for row in enrollments_today],
            "inventory_movements": dict(inventory_movements[0]) if inventory_movements else {},
            "overnight_shipments": [dict(row) for row in overnight_shipments]
        }


@router.get("/morning", response_model=MorningBriefResponse)
async def get_morning_brief(
    mode: str = Query("production", regex="^(production|demo)$")
):
    """
    Get Morning Brief with PRODUCTION mode database integration
    
    - **mode**: 'production' (real DB data) or 'demo' (sample data)
    """
    current_date = date.today().isoformat()
    
    if mode == "production":
        # PRODUCTION MODE - Fetch real data from database
        try:
            db_data = await get_production_morning_brief_data()
            
            # Build response from real data
            response = {
                "date": current_date,
                "mode": "production",
                "summary": {
                    "critical_alerts": len(db_data["critical_alerts"]),
                    "sites_low_inventory": len(db_data["low_inventory_sites"]),
                    "high_risk_shipments": db_data["delayed_count"],
                    "temperature_issues": db_data["temp_issues_count"],
                    "enrollment_behind_schedule": [
                        study["study_id"] for study in db_data["studies_behind"]
                    ]
                },
                "sections": {
                    "alerts": [
                        {
                            "severity": alert["severity"],
                            "type": alert["event_type"],
                            "site": alert["site_id"],
                            "site_name": alert["site_name"],
                            "message": alert["description"],
                            "status": alert["resolution_status"]
                        }
                        for alert in db_data["critical_alerts"]
                    ],
                    "inventory_status": {
                        "sites_with_issues": len(db_data["low_inventory_sites"]),
                        "details": [
                            {
                                "site_id": site["site_id"],
                                "site_name": site["site_name"],
                                "low_stock_products": site["low_stock_products"],
                                "total_units": site["total_units"]
                            }
                            for site in db_data["low_inventory_sites"]
                        ]
                    },
                    "shipments": {
                        "in_transit": len([s for s in db_data["active_shipments"] if s["status"] == "in_transit"]),
                        "delayed": db_data["delayed_count"],
                        "temperature_issues": db_data["temp_issues_count"],
                        "arriving_today": len([
                            s for s in db_data["active_shipments"] 
                            if s["expected_delivery_date"] and s["expected_delivery_date"].date() == date.today()
                        ]),
                        "active_shipments": [
                            {
                                "shipment_id": s["shipment_id"],
                                "from": s["from_location"],
                                "to": s["to_site_id"],
                                "status": s["status"],
                                "eta": s["expected_delivery_date"].isoformat() if s["expected_delivery_date"] else None
                            }
                            for s in db_data["active_shipments"][:10]
                        ]
                    },
                    "enrollment": {
                        "total_studies": len(db_data["enrollment_stats"]),
                        "studies_on_track": len([s for s in db_data["enrollment_stats"] 
                                                if s["current_enrollment"] >= s["target_enrollment"] * 0.7]),
                        "studies_behind": len(db_data["studies_behind"]),
                        "studies_details": [
                            {
                                "study_id": s["study_id"],
                                "study_name": s["study_name"],
                                "target": s["target_enrollment"],
                                "current": s["current_enrollment"],
                                "active_subjects": s["active_subjects"]
                            }
                            for s in db_data["enrollment_stats"]
                        ]
                    },
                    "risk_insights": [
                        f"{site['site_name']}: {site['low_stock_products']} products below minimum"
                        for site in db_data["low_inventory_sites"][:5]
                    ],
                    "recommendations": []  # Can add LLM-generated recommendations
                },
                "algorithms_used": [
                    "real_time_database_queries",
                    "inventory_analysis",
                    "shipment_tracking",
                    "enrollment_monitoring"
                ],
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
            return response
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching production data: {str(e)}"
            )
    
    else:
        # DEMO MODE - Return sample data
        return {
            "date": current_date,
            "mode": "demo",
            "summary": {
                "critical_alerts": 3,
                "sites_low_inventory": 5,
                "high_risk_shipments": 2,
                "enrollment_behind_schedule": ["STUDY-001", "STUDY-003"]
            },
            "sections": {
                "alerts": [
                    {
                        "severity": "high",
                        "type": "inventory_critical",
                        "site": "SITE-005",
                        "message": "Stock will run out in 3 days",
                        "action": "Emergency shipment required"
                    }
                ],
                "inventory_status": {
                    "total_sites": 50,
                    "healthy": 42,
                    "low_stock": 5,
                    "critical": 3
                },
                "shipments": {
                    "in_transit": 12,
                    "delayed": 2,
                    "temperature_issues": 0,
                    "arriving_today": 5
                },
                "enrollment": {
                    "studies_on_track": 8,
                    "studies_behind": 2,
                    "total_subjects": 450,
                    "weekly_enrollment_rate": 15
                },
                "risk_insights": [
                    "SITE-005: High waste risk due to low enrollment",
                    "SHIP-123: Customs delay risk (destination: India)"
                ],
                "recommendations": [
                    "Redistribute 50 units from SITE-002 to SITE-005",
                    "Increase safety stock for STUDY-001 by 20%"
                ]
            },
            "algorithms_used": [
                "demo_data_generator"
            ],
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }


@router.get("/evening", response_model=EveningSummaryResponse)
async def get_evening_summary(
    mode: str = Query("production", regex="^(production|demo)$")
):
    """
    Get Evening Summary with PRODUCTION mode database integration
    
    - **mode**: 'production' (real DB data) or 'demo' (sample data)
    """
    current_date = date.today().isoformat()
    
    if mode == "production":
        # PRODUCTION MODE - Fetch real data from database
        try:
            db_data = await get_production_evening_summary_data()
            
            response = {
                "date": current_date,
                "mode": "production",
                "summary": {
                    "issues_resolved": sum(item["count"] for item in db_data["resolved_today"]),
                    "deliveries_completed": db_data["deliveries"].get("total_deliveries", 0),
                    "on_time_percentage": (
                        (db_data["deliveries"].get("on_time", 0) / db_data["deliveries"].get("total_deliveries", 1)) * 100
                        if db_data["deliveries"].get("total_deliveries", 0) > 0 else 0
                    ),
                    "new_enrollments": sum(e["new_subjects"] for e in db_data["enrollments_today"])
                },
                "sections": {
                    "today_achievements": {
                        "issues_resolved": [
                            {
                                "type": item["event_type"],
                                "count": item["count"]
                            }
                            for item in db_data["resolved_today"]
                        ],
                        "deliveries": db_data["deliveries"],
                        "enrollments": db_data["enrollments_today"]
                    },
                    "metrics_vs_targets": {
                        "delivery_performance": {
                            "total": db_data["deliveries"].get("total_deliveries", 0),
                            "on_time": db_data["deliveries"].get("on_time", 0),
                            "delayed": db_data["deliveries"].get("delayed", 0),
                            "target": "95% on-time",
                            "status": "meeting" if (
                                db_data["deliveries"].get("total_deliveries", 0) > 0 and
                                (db_data["deliveries"].get("on_time", 0) / db_data["deliveries"].get("total_deliveries", 1)) >= 0.95
                            ) else "below"
                        },
                        "inventory_transactions": db_data["inventory_movements"]
                    },
                    "overnight_monitors": {
                        "shipments_in_transit": [
                            {
                                "shipment_id": s["shipment_id"],
                                "from": s["from_location"],
                                "to": s["to_site_id"],
                                "eta": s["expected_delivery_date"].isoformat() if s["expected_delivery_date"] else None
                            }
                            for s in db_data["overnight_shipments"]
                        ]
                    },
                    "tomorrow_priorities": []  # Can add AI-generated priorities
                },
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
            return response
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching production data: {str(e)}"
            )
    
    else:
        # DEMO MODE - Return sample data
        return {
            "date": current_date,
            "mode": "demo",
            "summary": {
                "issues_resolved": 8,
                "deliveries_completed": 15,
                "on_time_percentage": 93.3,
                "new_enrollments": 12
            },
            "sections": {
                "today_achievements": {
                    "issues_resolved": [
                        {"type": "temperature_excursion", "count": 3},
                        {"type": "stockout_risk", "count": 5}
                    ],
                    "deliveries_completed": 15,
                    "on_time": 14,
                    "delayed": 1
                },
                "metrics_vs_targets": {
                    "delivery_performance": {
                        "actual": 93.3,
                        "target": 95.0,
                        "status": "slightly_below"
                    },
                    "enrollment_rate": {
                        "actual": 12,
                        "target": 10,
                        "status": "exceeding"
                    }
                },
                "overnight_monitors": {
                    "shipments_in_transit": 8,
                    "sites_requiring_attention": 2
                },
                "tomorrow_priorities": [
                    "Follow up on delayed shipment SHIP-789",
                    "Schedule inventory audit for SITE-012",
                    "Review enrollment pipeline for STUDY-003"
                ]
            },
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
