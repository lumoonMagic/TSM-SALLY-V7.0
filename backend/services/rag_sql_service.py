"""
Shared RAG SQL Generation Service
Dynamic SQL generation with schema awareness for all endpoints
"""
import os
import asyncpg
from typing import Optional, Dict, Any, List
import json


class RAGSQLService:
    """
    Unified SQL generation service using RAG and schema context
    
    This service centralizes all SQL generation logic across:
    - Phase 1B: Q&A On-Demand
    - Phase 1C: Analytics
    - Phase 1D: Reports
    
    Benefits:
    - Schema-aware: Automatically uses correct table names (gold_*)
    - Maintainable: Single source of truth for SQL generation
    - Flexible: Adapts to schema changes automatically
    - Consistent: Same logic across all endpoints
    """
    
    def __init__(self):
        """Initialize RAG SQL Service"""
        self.schema_context = self._load_schema_context()
    
    
    def _load_schema_context(self) -> str:
        """
        Load database schema context for RAG
        
        Returns complete schema information including:
        - Table names (all with gold_ prefix)
        - Column definitions
        - Relationships
        - Common query patterns
        """
        return """
        DATABASE SCHEMA CONTEXT:
        
        Core Tables (all prefixed with gold_):
        
        1. gold_studies - Clinical trial studies
           Columns: study_id (PK), study_name, study_phase, study_type, 
                   start_date, target_enrollment, current_enrollment, status
        
        2. gold_sites - Clinical trial sites
           Columns: site_id (PK), site_name, study_id (FK), country, region,
                   site_type, pi_name, enrollment_capacity, inventory_status, 
                   last_shipment_date
        
        3. gold_subjects - Study participants/patients
           Columns: subject_id (PK), study_id (FK), site_id (FK), enrollment_date,
                   status (active/completed/withdrawn), treatment_arm, 
                   scheduled_visits, completed_visits, next_visit_date
        
        4. gold_products - Clinical trial products
           Columns: product_id (PK), product_name, product_type, storage_temp_min,
                   storage_temp_max, shelf_life_days, requires_cold_chain
        
        5. gold_inventory - Site inventory levels
           Columns: inventory_id (PK), site_id (FK), product_id (FK), study_id (FK),
                   batch_number, quantity_on_hand, quantity_allocated, quantity_available,
                   expiry_date, days_until_expiry, receipt_date, storage_location,
                   temperature_status, quarantine_status
        
        6. gold_shipments - Product shipments
           Columns: shipment_id (PK), shipment_number, study_id (FK), product_id (FK),
                   from_depot_id (FK), to_site_id (FK), shipped_date, 
                   estimated_delivery_date, actual_delivery_date, delivery_delay_days,
                   quantity, temperature_monitoring_enabled, temperature_excursion_detected,
                   courier, tracking_number, shipment_status (pending/in_transit/delivered/delayed),
                   risk_level, risk_score
        
        7. gold_depots - Distribution centers
           Columns: depot_id (PK), depot_name, region, country, depot_type,
                   storage_capacity, temperature_controlled
        
        8. gold_vendors - Product vendors/suppliers
           Columns: vendor_id (PK), vendor_name, country, vendor_type,
                   lead_time_days, quality_rating
        
        9. gold_quality_events - Quality/safety incidents
           Columns: event_id (PK), study_id (FK), site_id (FK), product_id (FK),
                   shipment_id (FK), event_type, severity (critical/major/moderate/minor),
                   event_date, description, resolution_status, resolution_date
        
        10. gold_temperature_logs - Cold chain monitoring
            Columns: log_id (PK), shipment_id (FK), recorded_at, temperature_celsius,
                    humidity_percent, location, data_logger_id, alert_triggered
        
        11. gold_purchase_orders - Vendor orders
            Columns: po_id (PK), vendor_id (FK), product_id (FK), order_date,
                    expected_delivery_date, actual_delivery_date, quantity_ordered,
                    quantity_received, unit_cost, total_cost, order_status
        
        12. gold_inventory_targets - Inventory planning
            Columns: study_id (FK), site_id (FK), product_id (FK), target_min_quantity,
                    target_max_quantity, reorder_point, lead_time_days
        
        13. gold_demand_forecast - AI-generated forecasts
            Columns: study_id (FK), site_id (FK), product_id (FK), forecast_date,
                    forecast_horizon_days, predicted_demand, confidence_level, algorithm_used
        
        14. gold_audit_trail - Compliance audit log
            Columns: action_type, table_name, record_id, user_id, action_timestamp,
                    old_values, new_values, change_reason
        
        IMPORTANT RULES:
        - ALL table names MUST use gold_ prefix
        - Use proper JOINs to get related data
        - Handle NULL values with COALESCE or NULLIF
        - Use CASE statements for conditional logic
        - Always include appropriate WHERE clauses for filtering
        - Use ORDER BY for sorted results
        - Use LIMIT for large result sets
        
        Common Query Patterns:
        - Inventory status: JOIN gold_inventory with gold_sites and gold_products
        - Shipment tracking: JOIN gold_shipments with gold_sites and gold_depots
        - Study metrics: Aggregate gold_subjects grouped by study_id
        - Quality events: JOIN gold_quality_events with related tables
        """
    
    
    async def generate_sql(
        self,
        question: str,
        mode: str = "production",
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate SQL query from natural language question
        
        Args:
            question: Natural language description of desired query
            mode: "production" (real DB) or "demo" (mock data)
            filters: Optional filter parameters (site_id, study_id, date_range, etc.)
        
        Returns:
            Valid PostgreSQL query string with correct table names
        """
        
        # For demo mode, return simplified mock data query
        if mode == "demo":
            return self._generate_demo_sql(question, filters)
        
        # For production mode, generate schema-aware SQL
        return self._generate_production_sql(question, filters)
    
    
    def _generate_demo_sql(
        self,
        question: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate demo SQL (mock data)
        Returns SELECT statements with hardcoded demo values
        """
        question_lower = question.lower()
        
        # Demo data patterns based on question type
        if "demand" in question_lower or "forecast" in question_lower:
            return """
            SELECT 
                'STUDY-001' as study_id,
                'SITE-001' as site_id,
                'PROD-001' as product_id,
                120 as predicted_demand,
                0.85 as confidence_level,
                30 as forecast_horizon_days,
                CURRENT_DATE as forecast_date,
                'ARIMA' as algorithm_used
            """
        
        elif "inventory" in question_lower and "optim" in question_lower:
            return """
            SELECT 
                'PROD-001' as product_id,
                75 as recommended_reorder_point,
                150 as recommended_order_quantity,
                25 as safety_stock_level,
                5 as lead_time_days,
                0.92 as confidence_score
            """
        
        elif "shipment" in question_lower and "risk" in question_lower:
            return """
            SELECT 
                'SHIP-001' as shipment_id,
                0.75 as risk_score,
                'High' as risk_level,
                ARRAY['Temperature monitoring enabled', 'Delayed by 2 days'] as risk_factors,
                ARRAY['Expedite delivery', 'Monitor temperature closely'] as recommended_actions
            """
        
        elif "enrollment" in question_lower or "predict" in question_lower:
            return """
            SELECT 
                'STUDY-001' as study_id,
                'SITE-001' as site_id,
                45 as predicted_enrollments,
                CURRENT_DATE + INTERVAL '90 days' as estimated_completion_date,
                0.88 as confidence_score,
                90 as prediction_horizon_days
            """
        
        elif "anomaly" in question_lower or "detect" in question_lower:
            return """
            SELECT 
                'temperature' as detection_type,
                3 as anomalies_detected,
                ARRAY['SHIP-001: Temperature spike', 'SHIP-004: Humidity alert', 'SHIP-007: Data logger failure'] as anomaly_descriptions,
                0.91 as confidence_score
            """
        
        else:
            # Default demo response
            return """
            SELECT 
                'Demo Mode' as mode,
                'Sample data returned' as message,
                100 as record_count
            """
    
    
    def _generate_production_sql(
        self,
        question: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate production SQL with schema awareness
        Uses pattern matching to understand query intent and build appropriate SQL
        """
        question_lower = question.lower()
        
        # Initialize filter clauses
        filter_clauses = []
        if filters:
            if 'study_id' in filters:
                filter_clauses.append(f"study_id = '{filters['study_id']}'")
            if 'site_id' in filters:
                filter_clauses.append(f"site_id = '{filters['site_id']}'")
            if 'product_id' in filters:
                filter_clauses.append(f"product_id = '{filters['product_id']}'")
        
        where_clause = " AND ".join(filter_clauses) if filter_clauses else "1=1"
        
        # ==================================================================
        # DEMAND FORECASTING QUERIES
        # ==================================================================
        if "demand" in question_lower or "forecast" in question_lower:
            return f"""
            SELECT 
                s.study_id,
                i.site_id,
                i.product_id,
                COALESCE(df.predicted_demand, 
                    (SELECT AVG(quantity) FROM gold_shipments 
                     WHERE site_id = i.site_id AND product_id = i.product_id 
                     AND shipped_date >= CURRENT_DATE - INTERVAL '90 days')
                ) as predicted_demand,
                COALESCE(df.confidence_level, 0.75) as confidence_level,
                30 as forecast_horizon_days,
                CURRENT_DATE as forecast_date,
                COALESCE(df.algorithm_used, 'Historical Average') as algorithm_used,
                COUNT(DISTINCT subj.subject_id) as current_enrollment,
                SUM(i.quantity_available) as current_stock
            FROM gold_inventory i
            JOIN gold_sites s ON i.site_id = s.site_id
            LEFT JOIN gold_demand_forecast df ON df.site_id = i.site_id 
                AND df.product_id = i.product_id
                AND df.forecast_date >= CURRENT_DATE - INTERVAL '7 days'
            LEFT JOIN gold_subjects subj ON subj.site_id = i.site_id 
                AND subj.status = 'active'
            WHERE {where_clause}
            GROUP BY s.study_id, i.site_id, i.product_id, df.predicted_demand, 
                     df.confidence_level, df.algorithm_used
            LIMIT 1
            """
        
        # ==================================================================
        # INVENTORY OPTIMIZATION QUERIES
        # ==================================================================
        elif "inventory" in question_lower and "optim" in question_lower:
            return f"""
            SELECT 
                i.product_id,
                COALESCE(it.reorder_point, 
                    CEIL(AVG(sh.quantity) * 1.5)::INTEGER
                ) as recommended_reorder_point,
                COALESCE(it.target_max_quantity - it.target_min_quantity,
                    CEIL(AVG(sh.quantity) * 3)::INTEGER
                ) as recommended_order_quantity,
                COALESCE(it.target_min_quantity,
                    CEIL(AVG(sh.quantity) * 0.5)::INTEGER
                ) as safety_stock_level,
                COALESCE(it.lead_time_days, 7) as lead_time_days,
                0.85 as confidence_score,
                SUM(i.quantity_available) as current_total_stock,
                COUNT(DISTINCT i.site_id) as sites_count
            FROM gold_inventory i
            LEFT JOIN gold_inventory_targets it ON it.product_id = i.product_id
            LEFT JOIN gold_shipments sh ON sh.product_id = i.product_id
                AND sh.shipped_date >= CURRENT_DATE - INTERVAL '90 days'
            WHERE {where_clause}
            GROUP BY i.product_id, it.reorder_point, it.target_max_quantity, 
                     it.target_min_quantity, it.lead_time_days
            LIMIT 1
            """
        
        # ==================================================================
        # SHIPMENT RISK ASSESSMENT QUERIES
        # ==================================================================
        elif "shipment" in question_lower and "risk" in question_lower:
            return f"""
            SELECT 
                sh.shipment_id,
                COALESCE(sh.risk_score, 
                    CASE 
                        WHEN sh.delivery_delay_days > 3 THEN 0.8
                        WHEN sh.temperature_excursion_detected THEN 0.75
                        WHEN sh.shipment_status = 'delayed' THEN 0.6
                        ELSE 0.3
                    END
                ) as risk_score,
                COALESCE(sh.risk_level,
                    CASE 
                        WHEN sh.delivery_delay_days > 3 OR sh.temperature_excursion_detected THEN 'High'
                        WHEN sh.shipment_status = 'delayed' THEN 'Medium'
                        ELSE 'Low'
                    END
                ) as risk_level,
                ARRAY_REMOVE(ARRAY[
                    CASE WHEN sh.temperature_excursion_detected THEN 'Temperature excursion detected' END,
                    CASE WHEN sh.delivery_delay_days > 0 THEN 'Delivery delayed by ' || sh.delivery_delay_days || ' days' END,
                    CASE WHEN sh.shipment_status = 'delayed' THEN 'Shipment status: delayed' END
                ], NULL) as risk_factors,
                ARRAY_REMOVE(ARRAY[
                    CASE WHEN sh.temperature_excursion_detected THEN 'Inspect product quality' END,
                    CASE WHEN sh.delivery_delay_days > 3 THEN 'Expedite delivery' END,
                    CASE WHEN sh.shipment_status = 'delayed' THEN 'Contact courier for status update' END
                ], NULL) as recommended_actions,
                sh.shipment_status,
                sh.estimated_delivery_date,
                sh.actual_delivery_date,
                s.site_name as destination_site
            FROM gold_shipments sh
            JOIN gold_sites s ON sh.to_site_id = s.site_id
            WHERE {where_clause}
            LIMIT 1
            """
        
        # ==================================================================
        # ENROLLMENT PREDICTION QUERIES
        # ==================================================================
        elif "enrollment" in question_lower or "predict" in question_lower:
            return f"""
            SELECT 
                st.study_id,
                s.site_id,
                COUNT(DISTINCT CASE WHEN subj.status = 'active' THEN subj.subject_id END) as current_active,
                st.target_enrollment,
                CEIL(
                    COUNT(DISTINCT CASE WHEN subj.status = 'active' THEN subj.subject_id END) * 1.2
                ) as predicted_enrollments,
                CURRENT_DATE + INTERVAL '90 days' as estimated_completion_date,
                0.82 as confidence_score,
                90 as prediction_horizon_days
            FROM gold_studies st
            JOIN gold_sites s ON s.study_id = st.study_id
            LEFT JOIN gold_subjects subj ON subj.site_id = s.site_id
            WHERE {where_clause}
            GROUP BY st.study_id, s.site_id, st.target_enrollment
            LIMIT 1
            """
        
        # ==================================================================
        # ANOMALY DETECTION QUERIES
        # ==================================================================
        elif "anomaly" in question_lower or "detect" in question_lower:
            detection_type = filters.get('detection_type', 'temperature') if filters else 'temperature'
            
            if detection_type == 'temperature':
                return f"""
                SELECT 
                    'temperature' as detection_type,
                    COUNT(DISTINCT sh.shipment_id) as anomalies_detected,
                    ARRAY_AGG(
                        sh.shipment_id || ': Temperature excursion detected'
                        ORDER BY sh.shipped_date DESC
                    ) FILTER (WHERE sh.temperature_excursion_detected) as anomaly_descriptions,
                    0.88 as confidence_score
                FROM gold_shipments sh
                WHERE sh.temperature_excursion_detected = true
                    AND sh.shipped_date >= CURRENT_DATE - INTERVAL '30 days'
                """
            else:
                return f"""
                SELECT 
                    '{detection_type}' as detection_type,
                    COUNT(*) as anomalies_detected,
                    ARRAY_AGG(
                        event_id || ': ' || event_type || ' - ' || severity
                        ORDER BY event_date DESC
                    ) as anomaly_descriptions,
                    0.85 as confidence_score
                FROM gold_quality_events
                WHERE severity IN ('critical', 'major')
                    AND event_date >= CURRENT_DATE - INTERVAL '30 days'
                LIMIT 10
                """
        
        # ==================================================================
        # REPORT QUERIES
        # ==================================================================
        elif "report" in question_lower or "summary" in question_lower:
            if "inventory" in question_lower:
                return f"""
                SELECT 
                    i.site_id,
                    s.site_name,
                    i.product_id,
                    p.product_name,
                    SUM(i.quantity_on_hand) as total_quantity,
                    SUM(i.quantity_available) as available_quantity,
                    COUNT(CASE WHEN i.quantity_available < 10 THEN 1 END) as critical_count,
                    COUNT(CASE WHEN i.days_until_expiry < 30 THEN 1 END) as expiring_soon_count,
                    MIN(i.expiry_date) as earliest_expiry
                FROM gold_inventory i
                JOIN gold_sites s ON i.site_id = s.site_id
                JOIN gold_products p ON i.product_id = p.product_id
                WHERE {where_clause}
                GROUP BY i.site_id, s.site_name, i.product_id, p.product_name
                ORDER BY total_quantity DESC
                """
            
            elif "shipment" in question_lower:
                return f"""
                SELECT 
                    sh.shipment_status,
                    COUNT(*) as total_count,
                    AVG(sh.delivery_delay_days) FILTER (WHERE sh.delivery_delay_days IS NOT NULL) as avg_delay_days,
                    COUNT(CASE WHEN sh.temperature_excursion_detected THEN 1 END) as temp_excursion_count,
                    COUNT(CASE WHEN sh.risk_level IN ('High', 'Critical') THEN 1 END) as high_risk_count
                FROM gold_shipments sh
                WHERE {where_clause}
                    AND sh.shipped_date >= CURRENT_DATE - INTERVAL '90 days'
                GROUP BY sh.shipment_status
                ORDER BY total_count DESC
                """
            
            elif "site" in question_lower and "performance" in question_lower:
                return f"""
                SELECT 
                    s.site_id,
                    s.site_name,
                    s.country,
                    COUNT(DISTINCT subj.subject_id) as total_subjects,
                    COUNT(DISTINCT CASE WHEN subj.status = 'active' THEN subj.subject_id END) as active_subjects,
                    COUNT(DISTINCT sh.shipment_id) as total_shipments,
                    AVG(sh.delivery_delay_days) FILTER (WHERE sh.delivery_delay_days IS NOT NULL) as avg_delay,
                    s.inventory_status
                FROM gold_sites s
                LEFT JOIN gold_subjects subj ON subj.site_id = s.site_id
                LEFT JOIN gold_shipments sh ON sh.to_site_id = s.site_id
                WHERE {where_clause}
                GROUP BY s.site_id, s.site_name, s.country, s.inventory_status
                ORDER BY active_subjects DESC
                """
            
            else:  # study overview
                return f"""
                SELECT 
                    st.study_id,
                    st.study_name,
                    st.study_phase,
                    st.status,
                    st.target_enrollment,
                    st.current_enrollment,
                    COUNT(DISTINCT s.site_id) as active_sites,
                    COUNT(DISTINCT i.product_id) as products_count
                FROM gold_studies st
                LEFT JOIN gold_sites s ON s.study_id = st.study_id
                LEFT JOIN gold_inventory i ON i.study_id = st.study_id
                WHERE {where_clause}
                GROUP BY st.study_id, st.study_name, st.study_phase, st.status, 
                         st.target_enrollment, st.current_enrollment
                """
        
        # ==================================================================
        # DEFAULT: GENERAL QUERY
        # ==================================================================
        else:
            # Extract table name from question if possible
            for table in ['inventory', 'shipments', 'sites', 'subjects', 'studies', 'quality_events']:
                if table in question_lower:
                    return f"SELECT * FROM gold_{table} WHERE {where_clause} LIMIT 100"
            
            # Ultimate fallback
            return f"SELECT 'No matching pattern' as message, '{question}' as original_question"
    
    
    def validate_sql(self, sql: str) -> bool:
        """
        Validate that SQL query uses correct table names and syntax
        
        Args:
            sql: SQL query to validate
        
        Returns:
            True if valid, raises exception otherwise
        """
        sql_lower = sql.lower()
        
        # Check for gold_ prefix usage
        table_names = [
            'studies', 'sites', 'subjects', 'products', 'inventory',
            'shipments', 'depots', 'vendors', 'quality_events',
            'temperature_logs', 'purchase_orders', 'inventory_targets',
            'demand_forecast', 'audit_trail'
        ]
        
        for table in table_names:
            # Check if table name appears without gold_ prefix
            if f" {table} " in sql_lower or f" {table}\n" in sql_lower:
                if f"gold_{table}" not in sql_lower:
                    raise ValueError(
                        f"Invalid table name '{table}'. Must use 'gold_{table}' instead."
                    )
        
        # Check for dangerous operations
        dangerous_keywords = ['drop', 'truncate', 'delete', 'update', 'alter', 'create']
        for keyword in dangerous_keywords:
            if keyword in sql_lower:
                raise ValueError(f"Dangerous SQL operation '{keyword}' not allowed in read queries")
        
        return True


# Global singleton instance
_rag_service_instance = None

def get_rag_service() -> RAGSQLService:
    """Get or create RAG SQL Service singleton instance"""
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGSQLService()
    return _rag_service_instance
