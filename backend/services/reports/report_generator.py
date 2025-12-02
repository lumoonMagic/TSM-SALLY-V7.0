"""
Report Generator Service
Orchestrates report generation across different formats
"""
from typing import Dict, Any, Optional
from datetime import datetime
import json


class ReportGenerator:
    """Main service for generating reports"""
    
    def __init__(self, db_connection: Optional[Any] = None):
        self.db = db_connection
        
    async def generate_inventory_summary(
        self,
        study_id: Optional[str] = None,
        site_id: Optional[str] = None,
        mode: str = "demo"
    ) -> Dict[str, Any]:
        """
        Generate inventory summary report
        
        Args:
            study_id: Filter by study
            site_id: Filter by site
            mode: 'demo' or 'production'
            
        Returns:
            Dict containing inventory summary data
        """
        if mode == "demo":
            return self._demo_inventory_summary()
        
        # Production mode
        query = """
        SELECT 
            s.site_id,
            s.site_name,
            p.product_name,
            i.quantity_on_hand,
            i.quantity_allocated,
            i.expiry_date,
            i.days_until_expiry,
            CASE
                WHEN i.days_until_expiry < 30 THEN 'Critical'
                WHEN i.days_until_expiry < 90 THEN 'Warning'
                ELSE 'Normal'
            END as expiry_status,
            CASE
                WHEN i.quantity_on_hand - i.quantity_allocated < 50 THEN 'Low'
                WHEN i.quantity_on_hand - i.quantity_allocated < 20 THEN 'Critical'
                ELSE 'Healthy'
            END as stock_status
        FROM gold_inventory i
        JOIN gold_sites s ON i.site_id = s.site_id
        JOIN gold_products p ON i.product_id = p.product_id
        WHERE 1=1
        """
        
        params = []
        if study_id:
            query += " AND s.study_id = $%d" % (len(params) + 1)
            params.append(study_id)
        if site_id:
            query += " AND i.site_id = $%d" % (len(params) + 1)
            params.append(site_id)
            
        query += " ORDER BY i.days_until_expiry ASC, stock_status DESC"
        
        # Execute query with asyncpg
        if self.db:
            async with self.db.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return self._format_inventory_results(rows)
        else:
            raise Exception("Database connection not available")
    
    async def generate_shipment_report(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        mode: str = "demo"
    ) -> Dict[str, Any]:
        """Generate shipment status report"""
        if mode == "demo":
            return self._demo_shipment_report()
        
        query = """
        SELECT 
            sh.shipment_id,
            sh.shipment_number,
            sh.from_depot_id,
            sh.to_site_id,
            sh.shipment_status,
            sh.priority,
            sh.shipped_date,
            sh.estimated_delivery_date,
            sh.actual_delivery_date,
            sh.carrier,
            sh.tracking_number,
            sh.risk_level,
            CASE 
                WHEN sh.actual_delivery_date IS NOT NULL AND sh.actual_delivery_date > sh.estimated_delivery_date 
                THEN (sh.actual_delivery_date - sh.estimated_delivery_date)
                ELSE 0
            END as days_delayed,
            COUNT(si.shipment_id) as items_count,
            SUM(si.quantity) as total_units
        FROM gold_shipments sh
        LEFT JOIN gold_shipment_items si ON sh.shipment_id = si.shipment_id
        WHERE 1=1
        """
        
        params = []
        if start_date:
            query += " AND sh.shipped_date >= $%d" % (len(params) + 1)
            params.append(start_date)
        if end_date:
            query += " AND sh.shipped_date <= $%d" % (len(params) + 1)
            params.append(end_date)
            
        query += " GROUP BY sh.shipment_id ORDER BY sh.shipped_date DESC"
        
        if self.db:
            async with self.db.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return self._format_shipment_results(rows)
        else:
            raise Exception("Database connection not available")
    
    async def generate_site_performance(
        self,
        study_id: Optional[str] = None,
        mode: str = "demo"
    ) -> Dict[str, Any]:
        """Generate site performance report"""
        if mode == "demo":
            return self._demo_site_performance()
        
        query = """
        SELECT 
            s.site_id,
            s.site_name,
            s.country,
            s.site_status,
            s.current_enrollment,
            s.target_enrollment,
            s.enrollment_rate,
            s.inventory_status,
            COUNT(DISTINCT sub.subject_id) as total_subjects,
            COUNT(DISTINCT CASE WHEN sub.subject_status = 'Active' THEN sub.subject_id END) as active_subjects,
            COALESCE(AVG(i.quantity_on_hand), 0) as avg_inventory_level
        FROM gold_sites s
        LEFT JOIN gold_subjects sub ON s.site_id = sub.site_id
        LEFT JOIN gold_inventory i ON s.site_id = i.site_id
        WHERE s.site_status = 'Active'
        """
        
        params = []
        if study_id:
            query += " AND s.study_id = $%d" % (len(params) + 1)
            params.append(study_id)
            
        query += """
        GROUP BY s.site_id, s.site_name, s.country, s.site_status, 
                 s.current_enrollment, s.target_enrollment, s.enrollment_rate, s.inventory_status
        ORDER BY s.enrollment_rate DESC
        """
        
        if self.db:
            async with self.db.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return self._format_site_results(rows)
        else:
            raise Exception("Database connection not available")
    
    # ========================================================================
    # DEMO DATA GENERATORS
    # ========================================================================
    
    def _demo_inventory_summary(self) -> Dict[str, Any]:
        """Generate demo inventory data"""
        return {
            "summary": {
                "total_sites": 10,
                "total_products": 3,
                "total_units_on_hand": 1250,
                "total_units_allocated": 280,
                "sites_low_stock": 2,
                "sites_critical_stock": 1,
                "products_expiring_30days": 2,
                "products_expiring_90days": 5
            },
            "by_site": [
                {
                    "site_id": "SITE-001",
                    "site_name": "Memorial Hospital",
                    "total_units": 280,
                    "available_units": 250,
                    "status": "Healthy",
                    "days_of_supply": 45
                },
                {
                    "site_id": "SITE-005",
                    "site_name": "City Medical Center",
                    "total_units": 30,
                    "available_units": 20,
                    "status": "Critical",
                    "days_of_supply": 4
                }
            ],
            "expiry_alerts": [
                {
                    "site_id": "SITE-003",
                    "product_name": "Drug C",
                    "batch_number": "BATCH-003-2024",
                    "expiry_date": "2025-03-31",
                    "days_until_expiry": 119,
                    "quantity": 50
                }
            ]
        }
    
    def _demo_shipment_report(self) -> Dict[str, Any]:
        """Generate demo shipment data"""
        return {
            "summary": {
                "total_shipments": 12,
                "in_transit": 3,
                "delivered": 7,
                "delayed": 2,
                "planned": 2,
                "average_delivery_days": 5.2,
                "on_time_percentage": 83.3
            },
            "shipments": [
                {
                    "shipment_id": "SHIP-010",
                    "shipment_number": "SH-2024-0010",
                    "from": "DEPOT-001",
                    "to": "SITE-005",
                    "status": "In Transit",
                    "priority": "Critical",
                    "shipped_date": "2024-11-28",
                    "eta": "2024-12-03",
                    "carrier": "FedEx Priority",
                    "tracking": "FDX555444333"
                },
                {
                    "shipment_id": "SHIP-020",
                    "shipment_number": "SH-2024-0020",
                    "from": "DEPOT-002",
                    "to": "SITE-011",
                    "status": "Delayed",
                    "priority": "Normal",
                    "shipped_date": "2024-11-20",
                    "eta": "2024-11-25",
                    "days_delayed": 7,
                    "carrier": "DHL",
                    "tracking": "DHL777888999"
                }
            ]
        }
    
    def _demo_site_performance(self) -> Dict[str, Any]:
        """Generate demo site performance data"""
        return {
            "summary": {
                "total_sites": 10,
                "active_sites": 8,
                "paused_sites": 2,
                "average_enrollment_rate": 2.3,
                "total_enrolled": 245,
                "target_enrollment": 500
            },
            "sites": [
                {
                    "site_id": "SITE-001",
                    "site_name": "Memorial Hospital",
                    "country": "USA",
                    "enrollment_rate": 3.5,
                    "current_enrollment": 45,
                    "target_enrollment": 50,
                    "progress_percentage": 90.0,
                    "inventory_status": "Healthy",
                    "performance_score": 9.2
                },
                {
                    "site_id": "SITE-005",
                    "site_name": "City Medical Center",
                    "country": "USA",
                    "enrollment_rate": 1.2,
                    "current_enrollment": 12,
                    "target_enrollment": 50,
                    "progress_percentage": 24.0,
                    "inventory_status": "Critical",
                    "performance_score": 5.8
                }
            ]
        }
    
    # ========================================================================
    # RESULT FORMATTERS
    # ========================================================================
    
    def _format_inventory_results(self, rows) -> Dict[str, Any]:
        """Format database results for inventory report"""
        inventory_list = [dict(row) for row in rows]
        
        # Calculate summary statistics
        total_units = sum(row['quantity_on_hand'] for row in inventory_list)
        critical_count = sum(1 for row in inventory_list if row['stock_status'] == 'Critical')
        low_count = sum(1 for row in inventory_list if row['stock_status'] == 'Low')
        
        return {
            "summary": {
                "total_records": len(inventory_list),
                "total_units": total_units,
                "critical_sites": critical_count,
                "low_stock_sites": low_count
            },
            "inventory": inventory_list
        }
    
    def _format_shipment_results(self, rows) -> Dict[str, Any]:
        """Format database results for shipment report"""
        shipments = [dict(row) for row in rows]
        
        delivered_count = sum(1 for s in shipments if s['shipment_status'] == 'Delivered')
        delayed_count = sum(1 for s in shipments if s['days_delayed'] > 0)
        
        return {
            "summary": {
                "total_shipments": len(shipments),
                "delivered": delivered_count,
                "delayed": delayed_count,
                "on_time_percentage": (delivered_count / len(shipments) * 100) if shipments else 0
            },
            "shipments": shipments
        }
    
    def _format_site_results(self, rows) -> Dict[str, Any]:
        """Format database results for site performance report"""
        sites = [dict(row) for row in rows]
        
        total_enrollment = sum(s['current_enrollment'] for s in sites)
        avg_rate = sum(s['enrollment_rate'] for s in sites) / len(sites) if sites else 0
        
        return {
            "summary": {
                "total_sites": len(sites),
                "total_enrolled": total_enrollment,
                "average_enrollment_rate": round(avg_rate, 2)
            },
            "sites": sites
        }
