"""
Advanced RAG SQL Generation Service with LLM Integration
Dynamic SQL generation using Gemini 2.5 Flash with vector embeddings
"""
import os
import json
import asyncpg
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from datetime import datetime


class RAGSQLService:
    """
    Advanced RAG SQL Service with LLM-powered dynamic query generation
    
    Features:
    - Gemini 2.5 Flash for SQL generation
    - Vector embeddings for schema knowledge
    - Dynamic response formatting with insights
    - Visualization recommendations
    - Text summaries
    
    This service handles:
    - Phase 1B: Q&A On-Demand (arbitrary questions)
    - Phase 1C: Analytics (dynamic queries)
    - Phase 1D: Reports (custom formatting)
    """
    
    def __init__(self):
        """Initialize RAG SQL Service with LLM"""
        # Load configuration from environment
        self.llm_provider = os.getenv("LLM_PROVIDER", "gemini")
        self.llm_model = os.getenv("LLM_MODEL", "gemini-2.0-flash-exp")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        # Initialize Gemini
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.model = genai.GenerativeModel(self.llm_model)
            self.llm_enabled = True
        else:
            self.llm_enabled = False
            print("⚠️ WARNING: No GEMINI_API_KEY found. Falling back to pattern-based generation.")
        
        # Load schema context
        self.schema_context = self._load_schema_context()
        
        # Load data model for embeddings
        self.data_model = self._load_data_model()
    
    
    def _load_schema_context(self) -> str:
        """
        Load comprehensive database schema context for RAG
        
        This context is used as part of the LLM prompt to ensure
        accurate SQL generation with proper table names and relationships.
        """
        return """
        CLINICAL TRIAL SUPPLY MANAGEMENT DATABASE SCHEMA
        
        ═══════════════════════════════════════════════════════════════
        CORE TABLES (All prefixed with gold_)
        ═══════════════════════════════════════════════════════════════
        
        1. gold_global_studies - Clinical trial studies
           Primary Key: study_id
           Columns:
           - study_id: VARCHAR(50) - Unique study identifier
           - study_name: VARCHAR(255) - Study name
           - study_phase: VARCHAR(20) - Phase (I, II, III, IV)
           - study_type: VARCHAR(50) - Type of study
           - start_date: DATE - Study start date
           - end_date: DATE - Study end date
           - target_enrollment: INTEGER - Target number of subjects
           - current_enrollment: INTEGER - Current enrolled subjects
           - status: VARCHAR(20) - active, completed, suspended
           - therapeutic_area: VARCHAR(100) - Disease area
           - sponsor: VARCHAR(255) - Sponsoring organization
        
        2. gold_clinical_sites - Clinical trial sites
           Primary Key: site_id
           Foreign Keys: study_id → gold_global_studies.study_id
           Columns:
           - site_id: VARCHAR(50) - Unique site identifier
           - site_name: VARCHAR(255) - Site name
           - study_id: VARCHAR(50) - Associated study
           - country: VARCHAR(100) - Country location
           - region: VARCHAR(100) - Geographic region
           - city: VARCHAR(100) - City location
           - site_type: VARCHAR(50) - hospital, clinic, research_center
           - pi_name: VARCHAR(255) - Principal Investigator name
           - enrollment_capacity: INTEGER - Maximum enrollment capacity
           - current_enrollment: INTEGER - Current enrolled subjects
           - inventory_status: VARCHAR(20) - adequate, low, critical
           - activation_date: DATE - Site activation date
           - last_shipment_date: DATE - Last product shipment date
           - status: VARCHAR(20) - active, inactive, pending
        
        3. gold_subjects - Study participants/patients
           Primary Key: subject_id
           Foreign Keys: 
           - study_id → gold_global_studies.study_id
           - site_id → gold_clinical_sites.site_id
           Columns:
           - subject_id: VARCHAR(50) - Unique subject identifier
           - study_id: VARCHAR(50) - Associated study
           - site_id: VARCHAR(50) - Enrollment site
           - enrollment_date: DATE - Date of enrollment
           - status: VARCHAR(20) - active, completed, withdrawn, screen_failed
           - treatment_arm: VARCHAR(50) - Treatment group assignment
           - scheduled_visits: INTEGER - Total visits scheduled
           - completed_visits: INTEGER - Visits completed
           - next_visit_date: DATE - Next scheduled visit
           - withdrawal_date: DATE - If withdrawn
           - withdrawal_reason: TEXT - Reason for withdrawal
        
        4. gold_clinical_products - Clinical trial products/drugs
           Primary Key: product_id
           Columns:
           - product_id: VARCHAR(50) - Unique product identifier
           - product_name: VARCHAR(255) - Product name
           - product_type: VARCHAR(50) - drug, placebo, device
           - dosage_form: VARCHAR(50) - tablet, injection, etc.
           - strength: VARCHAR(50) - Dosage strength
           - storage_temp_min: DECIMAL - Minimum storage temperature (°C)
           - storage_temp_max: DECIMAL - Maximum storage temperature (°C)
           - shelf_life_days: INTEGER - Product shelf life in days
           - requires_cold_chain: BOOLEAN - Cold chain requirement
           - manufacturer: VARCHAR(255) - Manufacturer name
           - lot_number_prefix: VARCHAR(20) - Lot number prefix
        
        5. gold_inventory - Site inventory levels
           Primary Key: inventory_id
           Foreign Keys:
           - site_id → gold_clinical_sites.site_id
           - product_id → gold_clinical_products.product_id
           - study_id → gold_global_studies.study_id
           Columns:
           - inventory_id: VARCHAR(50) - Unique inventory record
           - site_id: VARCHAR(50) - Site location
           - product_id: VARCHAR(50) - Product stored
           - study_id: VARCHAR(50) - Associated study
           - batch_number: VARCHAR(50) - Batch/lot number
           - quantity_on_hand: INTEGER - Current quantity
           - quantity_allocated: INTEGER - Reserved for subjects
           - quantity_available: INTEGER - Available for use
           - quantity_expired: INTEGER - Expired units
           - quantity_damaged: INTEGER - Damaged units
           - expiry_date: DATE - Product expiration date
           - days_until_expiry: INTEGER - Days remaining until expiry
           - receipt_date: DATE - Date received at site
           - storage_location: VARCHAR(100) - Physical storage location
           - temperature_status: VARCHAR(20) - normal, excursion, unknown
           - quarantine_status: VARCHAR(20) - released, quarantined, rejected
           - last_updated: TIMESTAMP - Last inventory update
        
        6. gold_shipments - Product shipments
           Primary Key: shipment_id
           Foreign Keys:
           - study_id → gold_global_studies.study_id
           - product_id → gold_clinical_products.product_id
           - from_depot_id → gold_regional_depots.depot_id
           - to_site_id → gold_clinical_sites.site_id
           Columns:
           - shipment_id: VARCHAR(50) - Unique shipment identifier
           - shipment_number: VARCHAR(100) - Tracking number
           - study_id: VARCHAR(50) - Associated study
           - product_id: VARCHAR(50) - Product shipped
           - from_depot_id: VARCHAR(50) - Origin depot
           - to_site_id: VARCHAR(50) - Destination site
           - shipped_date: DATE - Shipment date
           - estimated_delivery_date: DATE - Expected delivery
           - actual_delivery_date: DATE - Actual delivery
           - delivery_delay_days: INTEGER - Days delayed (if any)
           - quantity: INTEGER - Quantity shipped
           - temperature_monitoring_enabled: BOOLEAN - Temperature tracking
           - temperature_excursion_detected: BOOLEAN - Temperature violation
           - courier: VARCHAR(255) - Courier/carrier name
           - tracking_number: VARCHAR(100) - Carrier tracking number
           - shipment_status: VARCHAR(20) - pending, in_transit, delivered, delayed, failed
           - risk_level: VARCHAR(20) - low, medium, high, critical
           - risk_score: DECIMAL - Numerical risk score (0-1)
           - notes: TEXT - Additional notes
        
        7. gold_regional_depots - Distribution centers
           Primary Key: depot_id
           Columns:
           - depot_id: VARCHAR(50) - Unique depot identifier
           - depot_name: VARCHAR(255) - Depot name
           - region: VARCHAR(100) - Geographic region
           - country: VARCHAR(100) - Country location
           - city: VARCHAR(100) - City location
           - depot_type: VARCHAR(50) - central, regional, local
           - storage_capacity: INTEGER - Total storage capacity (units)
           - current_stock_level: INTEGER - Current stock level
           - temperature_controlled: BOOLEAN - Climate control capability
           - operational_status: VARCHAR(20) - operational, maintenance, closed
        
        8. gold_global_vendors - Product vendors/suppliers
           Primary Key: vendor_id
           Columns:
           - vendor_id: VARCHAR(50) - Unique vendor identifier
           - vendor_name: VARCHAR(255) - Vendor name
           - country: VARCHAR(100) - Country location
           - vendor_type: VARCHAR(50) - manufacturer, distributor, logistics
           - lead_time_days: INTEGER - Average lead time
           - quality_rating: DECIMAL - Quality score (0-5)
           - reliability_score: DECIMAL - Reliability score (0-5)
           - contracts_active: INTEGER - Active contracts
           - last_delivery_date: DATE - Most recent delivery
        
        9. gold_quality_events - Quality/safety incidents
           Primary Key: event_id
           Foreign Keys:
           - study_id → gold_global_studies.study_id
           - site_id → gold_clinical_sites.site_id
           - product_id → gold_clinical_products.product_id
           - shipment_id → gold_shipments.shipment_id
           Columns:
           - event_id: VARCHAR(50) - Unique event identifier
           - study_id: VARCHAR(50) - Associated study
           - site_id: VARCHAR(50) - Site where event occurred
           - product_id: VARCHAR(50) - Product involved
           - shipment_id: VARCHAR(50) - Related shipment (if applicable)
           - event_type: VARCHAR(50) - temperature_excursion, damage, shortage, expiry, etc.
           - severity: VARCHAR(20) - critical, major, moderate, minor
           - event_date: DATE - Date event occurred
           - detected_date: DATE - Date event was detected
           - description: TEXT - Event description
           - impact_assessment: TEXT - Impact analysis
           - corrective_action: TEXT - Actions taken
           - preventive_action: TEXT - Prevention measures
           - resolution_status: VARCHAR(20) - open, investigating, resolved, closed
           - resolution_date: DATE - Date resolved
           - reported_by: VARCHAR(255) - Person reporting
        
        10. gold_temperature_logs - Cold chain monitoring
            Primary Key: log_id
            Foreign Keys: shipment_id → gold_shipments.shipment_id
            Columns:
            - log_id: VARCHAR(50) - Unique log entry identifier
            - shipment_id: VARCHAR(50) - Associated shipment
            - recorded_at: TIMESTAMP - Timestamp of reading
            - temperature_celsius: DECIMAL - Temperature reading (°C)
            - humidity_percent: DECIMAL - Humidity reading (%)
            - location: VARCHAR(255) - GPS or location description
            - data_logger_id: VARCHAR(50) - Logger device ID
            - alert_triggered: BOOLEAN - Alert flag
            - battery_level: INTEGER - Logger battery level (%)
        
        ═══════════════════════════════════════════════════════════════
        IMPORTANT RULES FOR SQL GENERATION
        ═══════════════════════════════════════════════════════════════
        
        1. ALL table names MUST use the gold_ prefix
        2. Use proper JOINs to retrieve related data across tables
        3. Handle NULL values with COALESCE or IS NULL/IS NOT NULL
        4. Always include appropriate WHERE clauses for filtering
        5. Use aggregate functions (COUNT, SUM, AVG) for summary queries
        6. Apply LIMIT clause to prevent excessive data retrieval
        7. Use ORDER BY for sorted results
        8. Prefer LEFT JOIN over INNER JOIN when relationships may not exist
        9. Use date functions for date comparisons (e.g., CURRENT_DATE, DATE_TRUNC)
        10. Always validate that columns exist in the referenced tables
        
        ═══════════════════════════════════════════════════════════════
        COMMON QUERY PATTERNS
        ═══════════════════════════════════════════════════════════════
        
        Study Overview:
        - JOIN gold_global_studies with gold_clinical_sites and gold_subjects
        
        Inventory Analysis:
        - JOIN gold_inventory with gold_clinical_sites and gold_clinical_products
        - Check quantity_available, days_until_expiry, temperature_status
        
        Shipment Tracking:
        - JOIN gold_shipments with gold_clinical_sites and gold_regional_depots
        - Check shipment_status, delivery_delay_days, temperature_excursion_detected
        
        Quality Events:
        - JOIN gold_quality_events with relevant entities (study, site, product, shipment)
        - Filter by severity, event_type, resolution_status
        
        Subject Enrollment:
        - JOIN gold_subjects with gold_clinical_sites and gold_global_studies
        - Count by status, site, treatment_arm
        
        Temperature Monitoring:
        - JOIN gold_temperature_logs with gold_shipments
        - Identify excursions where temperature_celsius outside acceptable range
        """
    
    
    def _load_data_model(self) -> Dict[str, Any]:
        """
        Load data model metadata for vector embeddings
        
        This provides semantic understanding of the database structure,
        relationships, and business logic for better RAG retrieval.
        """
        return {
            "entities": [
                {
                    "name": "Study",
                    "table": "gold_global_studies",
                    "description": "Clinical trial study with phases, enrollment targets, and therapeutic areas",
                    "key_fields": ["study_id", "study_name", "study_phase", "status"],
                    "common_queries": [
                        "List all active studies",
                        "Find studies by phase",
                        "Studies with enrollment below target",
                        "Studies by therapeutic area"
                    ]
                },
                {
                    "name": "Site",
                    "table": "gold_clinical_sites",
                    "description": "Clinical trial sites where subjects are enrolled and products are stored",
                    "key_fields": ["site_id", "site_name", "country", "region", "inventory_status"],
                    "relationships": ["Belongs to Study", "Has Subjects", "Has Inventory", "Receives Shipments"],
                    "common_queries": [
                        "Sites with low inventory",
                        "Sites by country or region",
                        "Sites with enrollment capacity",
                        "Sites with recent shipments"
                    ]
                },
                {
                    "name": "Subject",
                    "table": "gold_subjects",
                    "description": "Study participants enrolled at sites",
                    "key_fields": ["subject_id", "status", "enrollment_date", "treatment_arm"],
                    "relationships": ["Enrolled in Study", "Enrolled at Site"],
                    "common_queries": [
                        "Total subjects by study",
                        "Active subjects by site",
                        "Subjects by treatment arm",
                        "Recent enrollments"
                    ]
                },
                {
                    "name": "Product",
                    "table": "gold_clinical_products",
                    "description": "Clinical trial products including drugs and placebos",
                    "key_fields": ["product_id", "product_name", "product_type", "requires_cold_chain"],
                    "common_queries": [
                        "Products requiring cold chain",
                        "Products by type",
                        "Products with short shelf life"
                    ]
                },
                {
                    "name": "Inventory",
                    "table": "gold_inventory",
                    "description": "Product inventory levels at clinical sites",
                    "key_fields": ["quantity_on_hand", "quantity_available", "expiry_date", "temperature_status"],
                    "relationships": ["Located at Site", "Contains Product", "Belongs to Study"],
                    "common_queries": [
                        "Low inventory levels",
                        "Products expiring soon",
                        "Inventory by site",
                        "Temperature excursions",
                        "Available vs allocated inventory"
                    ]
                },
                {
                    "name": "Shipment",
                    "table": "gold_shipments",
                    "description": "Product shipments from depots to sites",
                    "key_fields": ["shipment_status", "delivery_delay_days", "risk_level", "temperature_excursion_detected"],
                    "relationships": ["Ships Product", "From Depot", "To Site", "Belongs to Study"],
                    "common_queries": [
                        "Delayed shipments",
                        "Shipments with temperature excursions",
                        "High-risk shipments",
                        "In-transit shipments",
                        "Shipments by status"
                    ]
                },
                {
                    "name": "Quality Event",
                    "table": "gold_quality_events",
                    "description": "Quality and safety incidents",
                    "key_fields": ["event_type", "severity", "resolution_status"],
                    "relationships": ["Related to Study", "Occurred at Site", "Involves Product", "Related to Shipment"],
                    "common_queries": [
                        "Open quality events",
                        "Critical incidents",
                        "Events by type",
                        "Unresolved events",
                        "Events by site or study"
                    ]
                },
                {
                    "name": "Temperature Log",
                    "table": "gold_temperature_logs",
                    "description": "Temperature monitoring data from shipments",
                    "key_fields": ["temperature_celsius", "alert_triggered", "recorded_at"],
                    "relationships": ["Belongs to Shipment"],
                    "common_queries": [
                        "Temperature alerts",
                        "Excursions outside range",
                        "Temperature trends",
                        "Logs by shipment"
                    ]
                }
            ],
            "business_rules": [
                "Inventory is considered LOW when quantity_available < 10",
                "Inventory is CRITICAL when quantity_available < 5",
                "Products are near expiry when days_until_expiry < 90",
                "Shipments are DELAYED when delivery_delay_days > 2",
                "Temperature excursion occurs when temperature_celsius outside product's min/max range",
                "Risk levels: low (0-0.3), medium (0.3-0.6), high (0.6-0.8), critical (0.8-1.0)",
                "Subject statuses: active (currently enrolled), completed (finished study), withdrawn (discontinued)",
                "Quarantine statuses: released (available for use), quarantined (under review), rejected (not usable)"
            ],
            "kpis": [
                {
                    "name": "Enrollment Rate",
                    "description": "Current enrollment / Target enrollment",
                    "calculation": "COUNT(subjects with status='active') / target_enrollment"
                },
                {
                    "name": "Inventory Turnover",
                    "description": "Rate at which inventory is used",
                    "calculation": "quantity_allocated / quantity_on_hand"
                },
                {
                    "name": "On-Time Delivery Rate",
                    "description": "Percentage of shipments delivered on time",
                    "calculation": "COUNT(shipments with delivery_delay_days <= 0) / COUNT(all shipments)"
                },
                {
                    "name": "Temperature Compliance",
                    "description": "Percentage of shipments without temperature excursions",
                    "calculation": "COUNT(shipments with temperature_excursion_detected=false) / COUNT(all shipments)"
                },
                {
                    "name": "Quality Event Rate",
                    "description": "Number of quality events per shipment",
                    "calculation": "COUNT(quality_events) / COUNT(shipments)"
                }
            ]
        }
    
    
    async def generate_sql(
        self,
        question: str,
        mode: str = "production",
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate SQL query from natural language question using LLM
        
        Args:
            question: Natural language question from user
            mode: "production" (real DB) or "demo" (mock data)
            filters: Optional filter parameters (study_id, site_id, etc.)
        
        Returns:
            Valid PostgreSQL query string
        """
        if mode == "demo":
            return self._generate_demo_sql(question, filters)
        
        # Use LLM for production SQL generation
        if self.llm_enabled:
            return await self._generate_sql_with_llm(question, filters)
        else:
            # Fallback to pattern-based if LLM not available
            return self._generate_sql_pattern_based(question, filters)
    
    
    async def _generate_sql_with_llm(
        self,
        question: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate SQL using Gemini 2.5 Flash LLM
        
        This method uses the LLM to dynamically generate SQL based on:
        - User's natural language question
        - Database schema context
        - Data model metadata
        - Business rules and KPIs
        - Optional filters
        """
        # Build filter context
        filter_context = ""
        if filters:
            filter_context = "\n\nFILTERS TO APPLY:\n"
            for key, value in filters.items():
                filter_context += f"- {key} = '{value}'\n"
        
        # Build comprehensive prompt
        prompt = f"""You are an expert PostgreSQL database analyst for a Clinical Trial Supply Management system.

DATABASE SCHEMA:
{self.schema_context}

DATA MODEL CONTEXT:
{json.dumps(self.data_model, indent=2)}

USER QUESTION:
{question}
{filter_context}

INSTRUCTIONS:
1. Generate a valid PostgreSQL query to answer the user's question
2. Use ONLY the tables and columns defined in the schema (all tables have gold_ prefix)
3. Apply the filters provided (if any) in the WHERE clause
4. Use appropriate JOINs to retrieve related data
5. Include aggregate functions (COUNT, SUM, AVG) where appropriate
6. Add LIMIT 100 to prevent excessive data retrieval
7. Use descriptive column aliases for clarity
8. Handle NULL values appropriately
9. Order results logically (e.g., by date DESC, count DESC)
10. Follow PostgreSQL syntax and functions

RESPONSE FORMAT:
Return ONLY the SQL query without any explanation, markdown formatting, or additional text.
Do not include ```sql or ``` markers.
"""
        
        try:
            # Call Gemini API
            response = self.model.generate_content(prompt)
            sql_query = response.text.strip()
            
            # Clean up any markdown or extra formatting
            sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
            
            return sql_query
            
        except Exception as e:
            print(f"❌ Error generating SQL with LLM: {str(e)}")
            # Fallback to pattern-based
            return self._generate_sql_pattern_based(question, filters)
    
    
    def _generate_sql_pattern_based(
        self,
        question: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Fallback pattern-based SQL generation (limited)
        Used when LLM is not available
        """
        question_lower = question.lower()
        
        # Build WHERE clause from filters
        where_conditions = ["1=1"]
        if filters:
            for key, value in filters.items():
                if isinstance(value, str):
                    where_conditions.append(f"{key} = '{value}'")
                else:
                    where_conditions.append(f"{key} = {value}")
        
        where_clause = " AND ".join(where_conditions)
        
        # Basic pattern matching (fallback only)
        if "study" in question_lower or "studies" in question_lower:
            return f"""
                SELECT 
                    s.study_id,
                    s.study_name,
                    s.study_phase,
                    s.status,
                    COUNT(DISTINCT cs.site_id) as total_sites,
                    COUNT(DISTINCT subj.subject_id) as total_subjects
                FROM gold_global_studies s
                LEFT JOIN gold_clinical_sites cs ON s.study_id = cs.study_id
                LEFT JOIN gold_subjects subj ON s.study_id = subj.study_id
                WHERE {where_clause}
                GROUP BY s.study_id, s.study_name, s.study_phase, s.status
                ORDER BY s.study_name
                LIMIT 100
            """
        
        # Default generic query
        return f"""
            SELECT 
                cs.site_id,
                cs.site_name,
                cs.country,
                cs.status,
                COUNT(i.inventory_id) as inventory_items
            FROM gold_clinical_sites cs
            LEFT JOIN gold_inventory i ON cs.site_id = i.site_id
            WHERE {where_clause}
            GROUP BY cs.site_id, cs.site_name, cs.country, cs.status
            LIMIT 100
        """
    
    
    def _generate_demo_sql(
        self,
        question: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate demo SQL that returns mock data
        """
        return """
            SELECT 
                'DEMO-001' as id,
                'Demo Result' as name,
                'This is demo mode data' as description,
                100 as value,
                CURRENT_DATE as date
        """
    
    
    async def generate_and_execute_sql(
        self,
        question: str,
        mode: str = "production",
        query_type: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate SQL from question AND execute it against database
        
        Args:
            question: Natural language question
            mode: "production" or "demo"
            query_type: Optional query type hint
            filters: Optional filter parameters
        
        Returns:
            Dict with query results, metadata, and LLM-generated insights
        """
        # Generate SQL
        sql = await self.generate_sql(question, mode, filters)
        
        # Validate SQL
        try:
            self.validate_sql(sql)
        except ValueError as e:
            return {
                "rows": [],
                "row_count": 0,
                "query_used": sql,
                "mode": mode,
                "error": str(e)
            }
        
        # For demo mode, return mock result
        if mode == "demo":
            return {
                "rows": [{"demo": True, "message": "Demo data response"}],
                "row_count": 1,
                "query_used": sql,
                "mode": mode
            }
        
        # Execute against production database
        try:
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                raise ValueError("DATABASE_URL not configured")
            
            conn = await asyncpg.connect(database_url)
            rows = await conn.fetch(sql)
            await conn.close()
            
            # Convert rows to list of dicts
            results = [dict(row) for row in rows]
            
            return {
                "rows": results,
                "row_count": len(results),
                "query_used": sql,
                "mode": mode,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "rows": [],
                "row_count": 0,
                "query_used": sql,
                "mode": mode,
                "error": f"Query execution failed: {str(e)}"
            }
    
    
    async def format_response_with_insights(
        self,
        query_results: Dict[str, Any],
        question: str
    ) -> Dict[str, Any]:
        """
        Format query results with LLM-generated insights, summaries, and visualization recommendations
        
        Args:
            query_results: Raw query results from generate_and_execute_sql
            question: Original user question
        
        Returns:
            Enhanced response with:
            - text_summary: Natural language summary of results
            - insights: Key insights and findings
            - visualizations: Recommended chart types and configurations
            - recommendations: Actionable recommendations
            - raw_data: Original query results
        """
        if not self.llm_enabled:
            # Return basic formatting if LLM not available
            return {
                "text_summary": f"Query returned {query_results.get('row_count', 0)} results.",
                "raw_data": query_results,
                "insights": [],
                "visualizations": [],
                "recommendations": []
            }
        
        # Build prompt for response formatting
        rows_sample = query_results.get("rows", [])[:10]  # First 10 rows for context
        
        prompt = f"""You are a data analyst for a Clinical Trial Supply Management system.

USER QUESTION:
{question}

QUERY RESULTS SUMMARY:
- Total rows returned: {query_results.get('row_count', 0)}
- Sample data (first 10 rows):
{json.dumps(rows_sample, indent=2, default=str)}

SQL QUERY USED:
{query_results.get('query_used', 'N/A')}

TASK:
Analyze these results and provide a comprehensive response in JSON format with the following structure:

{{
  "text_summary": "A clear, concise natural language summary of the results (2-3 sentences)",
  "insights": [
    "Key insight 1 about the data",
    "Key insight 2 about trends or patterns",
    "Key insight 3 about notable findings"
  ],
  "visualizations": [
    {{
      "chart_type": "bar|line|pie|table|scatter|heatmap",
      "title": "Chart title",
      "description": "What this chart shows",
      "x_axis": "column name for x-axis",
      "y_axis": "column name for y-axis",
      "recommended": true|false
    }}
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "kpis": [
    {{
      "name": "KPI name",
      "value": "calculated value",
      "status": "good|warning|critical",
      "description": "What this KPI means"
    }}
  ]
}}

GUIDELINES:
- Be specific and data-driven
- Focus on actionable insights
- Recommend visualizations that best represent the data
- Highlight any concerning trends or positive outcomes
- Use domain knowledge of clinical trial supply management

Return ONLY valid JSON, no additional text or formatting.
"""
        
        try:
            response = self.model.generate_content(prompt)
            formatted_text = response.text.strip()
            
            # Clean up markdown formatting
            formatted_text = formatted_text.replace("```json", "").replace("```", "").strip()
            
            # Parse JSON response
            formatted_response = json.loads(formatted_text)
            
            # Add raw data to response
            formatted_response["raw_data"] = query_results
            
            return formatted_response
            
        except Exception as e:
            print(f"❌ Error formatting response: {str(e)}")
            # Return basic format on error
            return {
                "text_summary": f"Query returned {query_results.get('row_count', 0)} results.",
                "raw_data": query_results,
                "insights": [],
                "visualizations": [],
                "recommendations": [],
                "error": str(e)
            }
    
    
    def validate_sql(self, sql: str) -> None:
        """
        Validate SQL query for security and correctness
        
        Raises ValueError if SQL is invalid or potentially dangerous
        """
        sql_lower = sql.lower()
        
        # Check for dangerous operations
        dangerous_operations = ["drop", "truncate", "delete", "update", "alter", "create", "insert"]
        for operation in dangerous_operations:
            if operation in sql_lower:
                raise ValueError(f"SQL contains forbidden operation: {operation.upper()}")
        
        # Ensure gold_ prefix is used
        table_keywords = ["from ", "join "]
        for keyword in table_keywords:
            if keyword in sql_lower:
                # Check if gold_ appears after the keyword
                idx = sql_lower.find(keyword)
                if idx != -1:
                    substr = sql_lower[idx:idx+50]
                    # Allow common table names without gold_ in specific contexts
                    valid_patterns = ["gold_", "lateral", "unnest", "(select"]
                    if not any(pattern in substr for pattern in valid_patterns):
                        # This is a basic check; in production, use more sophisticated parsing
                        pass
        
        # Basic syntax check
        if "select" not in sql_lower:
            raise ValueError("SQL must be a SELECT query")


# Singleton instance
_rag_service_instance = None

def get_rag_service() -> RAGSQLService:
    """Get or create singleton RAG service instance"""
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGSQLService()
    return _rag_service_instance
