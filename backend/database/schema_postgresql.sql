-- ============================================================================
-- Sally TSM - Complete Database Schema (Gold Layer)
-- Version: 1.0.0
-- Database: PostgreSQL 14+
-- Purpose: Clinical Trial Supply Management - Production Ready
-- ============================================================================

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS gold_audit_trail CASCADE;
DROP TABLE IF EXISTS gold_quality_events CASCADE;
DROP TABLE IF EXISTS gold_temperature_logs CASCADE;
DROP TABLE IF EXISTS gold_purchase_orders CASCADE;
DROP TABLE IF EXISTS gold_vendors CASCADE;
DROP TABLE IF EXISTS gold_inventory_targets CASCADE;
DROP TABLE IF EXISTS gold_demand_forecast CASCADE;
DROP TABLE IF EXISTS gold_shipment_items CASCADE;
DROP TABLE IF EXISTS gold_shipments CASCADE;
DROP TABLE IF EXISTS gold_subjects CASCADE;
DROP TABLE IF EXISTS gold_inventory CASCADE;
DROP TABLE IF EXISTS gold_products CASCADE;
DROP TABLE IF EXISTS gold_depots CASCADE;
DROP TABLE IF EXISTS gold_sites CASCADE;
DROP TABLE IF EXISTS gold_studies CASCADE;
DROP TABLE IF EXISTS ai_briefs CASCADE;
DROP TABLE IF EXISTS rag_queries CASCADE;
DROP TABLE IF EXISTS vector_documents CASCADE;
DROP TABLE IF EXISTS schema_versions CASCADE;

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Clinical Studies (Trials)
CREATE TABLE gold_studies (
    study_id VARCHAR(50) PRIMARY KEY,
    study_name VARCHAR(255) NOT NULL,
    protocol_number VARCHAR(100) UNIQUE NOT NULL,
    phase VARCHAR(20) CHECK (phase IN ('Phase I', 'Phase II', 'Phase III', 'Phase IV')),
    indication TEXT,
    sponsor VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('Planning', 'Active', 'Paused', 'Completed', 'Terminated')),
    start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    target_enrollment INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    total_sites INTEGER DEFAULT 0,
    active_sites INTEGER DEFAULT 0,
    country_count INTEGER DEFAULT 0,
    source_system VARCHAR(50) DEFAULT 'CTMS',
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_studies_status ON gold_studies(status);
CREATE INDEX idx_studies_phase ON gold_studies(phase);

-- Clinical Sites
CREATE TABLE gold_sites (
    site_id VARCHAR(50) PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    site_number VARCHAR(100),
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    country VARCHAR(100),
    city VARCHAR(100),
    investigator_name VARCHAR(255),
    site_status VARCHAR(50) CHECK (site_status IN ('Screening', 'Active', 'Paused', 'Closed')),
    activation_date DATE,
    target_enrollment INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    enrollment_rate DECIMAL(10,2), -- subjects per week
    inventory_status VARCHAR(50) CHECK (inventory_status IN ('Healthy', 'Low', 'Critical', 'Overstocked')),
    last_shipment_date DATE,
    next_shipment_eta DATE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    timezone VARCHAR(50),
    source_system VARCHAR(50) DEFAULT 'CTMS',
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sites_study ON gold_sites(study_id);
CREATE INDEX idx_sites_status ON gold_sites(site_status);
CREATE INDEX idx_sites_inventory_status ON gold_sites(inventory_status);
CREATE INDEX idx_sites_country ON gold_sites(country);

-- Investigational Products
CREATE TABLE gold_products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) UNIQUE,
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    product_type VARCHAR(50) CHECK (product_type IN ('IMP', 'Placebo', 'Comparator', 'Rescue')),
    dosage_form VARCHAR(100),
    strength VARCHAR(50),
    unit_of_measure VARCHAR(20),
    storage_temperature_min DECIMAL(5,2),
    storage_temperature_max DECIMAL(5,2),
    shelf_life_days INTEGER,
    cost_per_unit DECIMAL(10,2),
    requires_cold_chain BOOLEAN DEFAULT false,
    requires_controlled_substance_tracking BOOLEAN DEFAULT false,
    source_system VARCHAR(50) DEFAULT 'IRT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_study ON gold_products(study_id);
CREATE INDEX idx_products_type ON gold_products(product_type);

-- Distribution Depots
CREATE TABLE gold_depots (
    depot_id VARCHAR(50) PRIMARY KEY,
    depot_name VARCHAR(255) NOT NULL,
    depot_code VARCHAR(100) UNIQUE,
    country VARCHAR(100),
    city VARCHAR(100),
    depot_type VARCHAR(50) CHECK (depot_type IN ('Regional', 'Central', 'Local')),
    storage_capacity INTEGER,
    current_utilization_pct DECIMAL(5,2),
    temperature_controlled BOOLEAN DEFAULT true,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    operating_hours VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_depots_country ON gold_depots(country);
CREATE INDEX idx_depots_type ON gold_depots(depot_type);

-- ============================================================================
-- TRANSACTIONAL DATA
-- ============================================================================

-- Site-level Inventory
CREATE TABLE gold_inventory (
    inventory_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    batch_number VARCHAR(100),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_allocated INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_allocated) STORED,
    expiry_date DATE,
    days_until_expiry INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM (expiry_date - CURRENT_DATE))) STORED,
    receipt_date DATE,
    storage_location VARCHAR(100),
    temperature_status VARCHAR(50) CHECK (temperature_status IN ('Normal', 'Excursion', 'Critical')),
    quarantine_status BOOLEAN DEFAULT false,
    quarantine_reason TEXT,
    last_count_date DATE,
    source_system VARCHAR(50) DEFAULT 'IRT',
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(site_id, product_id, batch_number)
);

CREATE INDEX idx_inventory_site ON gold_inventory(site_id);
CREATE INDEX idx_inventory_product ON gold_inventory(product_id);
CREATE INDEX idx_inventory_expiry ON gold_inventory(expiry_date);
CREATE INDEX idx_inventory_batch ON gold_inventory(batch_number);

-- Shipments
CREATE TABLE gold_shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    shipment_number VARCHAR(100) UNIQUE,
    from_depot_id VARCHAR(50) REFERENCES gold_depots(depot_id),
    to_site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    shipment_type VARCHAR(50) CHECK (shipment_type IN ('Routine', 'Emergency', 'Return', 'Redistribution')),
    shipment_status VARCHAR(50) CHECK (shipment_status IN ('Planned', 'Packed', 'In Transit', 'Delivered', 'Delayed', 'Cancelled')),
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    carrier VARCHAR(100),
    tracking_number VARCHAR(200),
    shipped_date TIMESTAMP,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    delivery_delay_days INTEGER GENERATED ALWAYS AS (
        CASE WHEN actual_delivery_date IS NOT NULL 
        THEN EXTRACT(DAY FROM (actual_delivery_date - estimated_delivery_date))::INTEGER
        ELSE NULL END
    ) STORED,
    temperature_monitoring_enabled BOOLEAN DEFAULT true,
    temperature_excursion_detected BOOLEAN DEFAULT false,
    customs_clearance_required BOOLEAN DEFAULT false,
    customs_cleared BOOLEAN DEFAULT false,
    shipment_cost DECIMAL(10,2),
    risk_score DECIMAL(5,4),
    risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    notes TEXT,
    source_system VARCHAR(50) DEFAULT 'SAP',
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipments_status ON gold_shipments(shipment_status);
CREATE INDEX idx_shipments_site ON gold_shipments(to_site_id);
CREATE INDEX idx_shipments_study ON gold_shipments(study_id);
CREATE INDEX idx_shipments_delivery_date ON gold_shipments(estimated_delivery_date);
CREATE INDEX idx_shipments_risk ON gold_shipments(risk_level);

-- Shipment Line Items
CREATE TABLE gold_shipment_items (
    shipment_item_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES gold_shipments(shipment_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL,
    expiry_date DATE,
    unit_cost DECIMAL(10,2),
    line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipment_items_shipment ON gold_shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_product ON gold_shipment_items(product_id);

-- De-identified Subjects (for enrollment tracking only)
CREATE TABLE gold_subjects (
    subject_id VARCHAR(50) PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    subject_number VARCHAR(100),
    enrollment_date DATE,
    randomization_date DATE,
    treatment_arm VARCHAR(100),
    subject_status VARCHAR(50) CHECK (subject_status IN ('Screening', 'Randomized', 'Active', 'Completed', 'Withdrawn')),
    last_visit_date DATE,
    next_visit_date DATE,
    dosing_frequency VARCHAR(50),
    total_doses_required INTEGER,
    doses_completed INTEGER DEFAULT 0,
    source_system VARCHAR(50) DEFAULT 'CTMS',
    last_sync_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subjects_study ON gold_subjects(study_id);
CREATE INDEX idx_subjects_site ON gold_subjects(site_id);
CREATE INDEX idx_subjects_status ON gold_subjects(subject_status);
CREATE INDEX idx_subjects_enrollment ON gold_subjects(enrollment_date);

-- ============================================================================
-- FORECASTING & PLANNING
-- ============================================================================

-- Demand Forecasts
CREATE TABLE gold_demand_forecast (
    forecast_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    forecast_date DATE NOT NULL,
    forecast_horizon_days INTEGER,
    predicted_demand INTEGER,
    confidence_level DECIMAL(5,4),
    algorithm_used VARCHAR(100),
    actual_demand INTEGER,
    forecast_accuracy DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(study_id, site_id, product_id, forecast_date)
);

CREATE INDEX idx_forecast_study_site ON gold_demand_forecast(study_id, site_id);
CREATE INDEX idx_forecast_date ON gold_demand_forecast(forecast_date);

-- Inventory Targets (Optimized levels)
CREATE TABLE gold_inventory_targets (
    target_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    optimal_stock_level INTEGER,
    safety_stock_level INTEGER,
    reorder_point INTEGER,
    economic_order_quantity INTEGER,
    lead_time_days INTEGER,
    calculated_at TIMESTAMP DEFAULT NOW(),
    algorithm_used VARCHAR(100),
    UNIQUE(site_id, product_id)
);

CREATE INDEX idx_targets_site_product ON gold_inventory_targets(site_id, product_id);

-- ============================================================================
-- VENDORS & PROCUREMENT
-- ============================================================================

-- Vendors/Suppliers
CREATE TABLE gold_vendors (
    vendor_id VARCHAR(50) PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_code VARCHAR(100) UNIQUE,
    vendor_type VARCHAR(50) CHECK (vendor_type IN ('Manufacturer', 'Distributor', 'Courier', 'Depot')),
    country VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    performance_rating DECIMAL(3,2),
    on_time_delivery_pct DECIMAL(5,2),
    quality_compliance_pct DECIMAL(5,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vendors_type ON gold_vendors(vendor_type);
CREATE INDEX idx_vendors_active ON gold_vendors(active);

-- Purchase Orders
CREATE TABLE gold_purchase_orders (
    po_id VARCHAR(50) PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE,
    vendor_id VARCHAR(50) REFERENCES gold_vendors(vendor_id),
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    order_date DATE,
    required_date DATE,
    quantity_ordered INTEGER,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    po_status VARCHAR(50) CHECK (po_status IN ('Draft', 'Submitted', 'Approved', 'In Production', 'Shipped', 'Received', 'Cancelled')),
    received_quantity INTEGER DEFAULT 0,
    received_date DATE,
    source_system VARCHAR(50) DEFAULT 'SAP',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_po_vendor ON gold_purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON gold_purchase_orders(po_status);
CREATE INDEX idx_po_study ON gold_purchase_orders(study_id);

-- ============================================================================
-- QUALITY & COMPLIANCE
-- ============================================================================

-- Quality Events
CREATE TABLE gold_quality_events (
    event_id VARCHAR(50) PRIMARY KEY,
    event_number VARCHAR(100) UNIQUE,
    event_type VARCHAR(100) CHECK (event_type IN ('Temperature Excursion', 'Damaged Product', 'Contamination', 'Labeling Error', 'Documentation Issue', 'Other')),
    severity VARCHAR(20) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    shipment_id VARCHAR(50) REFERENCES gold_shipments(shipment_id),
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    batch_number VARCHAR(100),
    event_date TIMESTAMP,
    detected_by VARCHAR(255),
    description TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    event_status VARCHAR(50) CHECK (event_status IN ('Open', 'Under Investigation', 'Pending Approval', 'Closed')),
    resolution_date DATE,
    regulatory_reporting_required BOOLEAN DEFAULT false,
    capa_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quality_severity ON gold_quality_events(severity);
CREATE INDEX idx_quality_status ON gold_quality_events(event_status);
CREATE INDEX idx_quality_shipment ON gold_quality_events(shipment_id);

-- Temperature Monitoring Logs
CREATE TABLE gold_temperature_logs (
    log_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES gold_shipments(shipment_id) ON DELETE CASCADE,
    recorded_at TIMESTAMP NOT NULL,
    temperature_celsius DECIMAL(5,2),
    humidity_pct DECIMAL(5,2),
    location_lat DECIMAL(10,7),
    location_lon DECIMAL(10,7),
    within_range BOOLEAN,
    alert_triggered BOOLEAN DEFAULT false,
    device_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_temp_logs_shipment ON gold_temperature_logs(shipment_id);
CREATE INDEX idx_temp_logs_recorded ON gold_temperature_logs(recorded_at);
CREATE INDEX idx_temp_logs_alerts ON gold_temperature_logs(alert_triggered);

-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================

-- Audit Trail (Change Tracking)
CREATE TABLE gold_audit_trail (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    source_system VARCHAR(50)
);

CREATE INDEX idx_audit_table_record ON gold_audit_trail(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON gold_audit_trail(changed_at);
CREATE INDEX idx_audit_action ON gold_audit_trail(action);

-- ============================================================================
-- AI / ANALYTICS TABLES
-- ============================================================================

-- AI Briefs (Morning/Evening)
CREATE TABLE ai_briefs (
    brief_id SERIAL PRIMARY KEY,
    brief_type VARCHAR(20) CHECK (brief_type IN ('morning', 'evening')),
    brief_date DATE NOT NULL,
    mode VARCHAR(20) CHECK (mode IN ('demo', 'production')),
    content JSONB NOT NULL,
    algorithms_used TEXT[],
    generation_time_ms INTEGER,
    generated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brief_type, brief_date, mode)
);

CREATE INDEX idx_briefs_type_date ON ai_briefs(brief_type, brief_date);
CREATE INDEX idx_briefs_mode ON ai_briefs(mode);

-- RAG Query History
CREATE TABLE rag_queries (
    query_id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    sql_generated TEXT,
    sql_executed BOOLEAN DEFAULT false,
    execution_time_ms INTEGER,
    result_count INTEGER,
    answer TEXT,
    rag_context TEXT[],
    confidence_score DECIMAL(5,4),
    mode VARCHAR(20) CHECK (mode IN ('demo', 'production')),
    helpful_feedback BOOLEAN,
    user_comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_queries_created ON rag_queries(created_at);
CREATE INDEX idx_rag_queries_mode ON rag_queries(mode);

-- Vector Documents (for RAG)
CREATE TABLE vector_documents (
    document_id SERIAL PRIMARY KEY,
    document_type VARCHAR(50),
    content TEXT NOT NULL,
    embedding_model VARCHAR(100),
    metadata JSONB,
    source_table VARCHAR(100),
    source_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Note: Vector column and index will be added via PGVector extension in separate migration
-- This is handled by vectordb_setup.sql

CREATE INDEX idx_vector_docs_type ON vector_documents(document_type);
CREATE INDEX idx_vector_docs_source ON vector_documents(source_table, source_id);

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE schema_versions (
    version_id SERIAL PRIMARY KEY,
    version_number VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(255),
    rollback_sql TEXT
);

-- Insert initial version
INSERT INTO schema_versions (version_number, description, applied_by)
VALUES ('1.0.0', 'Initial schema deployment with 20+ tables', 'system');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Site Inventory Summary View
CREATE OR REPLACE VIEW vw_site_inventory_summary AS
SELECT 
    s.site_id,
    s.site_name,
    s.study_id,
    st.study_name,
    s.inventory_status,
    COUNT(DISTINCT i.product_id) as product_count,
    SUM(i.quantity_available) as total_units_available,
    MIN(i.days_until_expiry) as min_days_until_expiry,
    MAX(s.last_shipment_date) as last_shipment_date
FROM gold_sites s
JOIN gold_studies st ON s.study_id = st.study_id
LEFT JOIN gold_inventory i ON s.site_id = i.site_id
GROUP BY s.site_id, s.site_name, s.study_id, st.study_name, s.inventory_status;

-- Active Shipments View
CREATE OR REPLACE VIEW vw_active_shipments AS
SELECT 
    sh.shipment_id,
    sh.shipment_number,
    sh.shipment_status,
    sh.priority,
    sh.risk_level,
    s.site_name,
    st.study_name,
    sh.estimated_delivery_date,
    sh.carrier,
    sh.tracking_number,
    sh.temperature_excursion_detected,
    COUNT(si.shipment_item_id) as item_count,
    SUM(si.quantity) as total_units
FROM gold_shipments sh
JOIN gold_sites s ON sh.to_site_id = s.site_id
JOIN gold_studies st ON sh.study_id = st.study_id
LEFT JOIN gold_shipment_items si ON sh.shipment_id = si.shipment_id
WHERE sh.shipment_status IN ('Planned', 'Packed', 'In Transit')
GROUP BY sh.shipment_id, sh.shipment_number, sh.shipment_status, sh.priority,
         sh.risk_level, s.site_name, st.study_name, sh.estimated_delivery_date,
         sh.carrier, sh.tracking_number, sh.temperature_excursion_detected;

-- Study Enrollment Progress View
CREATE OR REPLACE VIEW vw_study_enrollment_progress AS
SELECT 
    st.study_id,
    st.study_name,
    st.protocol_number,
    st.phase,
    st.status,
    st.target_enrollment,
    st.current_enrollment,
    ROUND((st.current_enrollment::DECIMAL / NULLIF(st.target_enrollment, 0)) * 100, 2) as enrollment_pct,
    COUNT(DISTINCT s.site_id) as active_sites,
    COUNT(DISTINCT sub.subject_id) as total_subjects,
    COUNT(DISTINCT CASE WHEN sub.subject_status = 'Active' THEN sub.subject_id END) as active_subjects
FROM gold_studies st
LEFT JOIN gold_sites s ON st.study_id = s.study_id AND s.site_status = 'Active'
LEFT JOIN gold_subjects sub ON st.study_id = sub.study_id
GROUP BY st.study_id, st.study_name, st.protocol_number, st.phase, st.status,
         st.target_enrollment, st.current_enrollment;

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to update site inventory status based on stock levels
CREATE OR REPLACE FUNCTION update_site_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE gold_sites SET
        inventory_status = CASE
            WHEN (SELECT SUM(quantity_available) FROM gold_inventory WHERE site_id = NEW.site_id) = 0 
                THEN 'Critical'
            WHEN (SELECT AVG(quantity_available) FROM gold_inventory WHERE site_id = NEW.site_id) < 50 
                THEN 'Low'
            WHEN (SELECT AVG(quantity_available) FROM gold_inventory WHERE site_id = NEW.site_id) > 200 
                THEN 'Overstocked'
            ELSE 'Healthy'
        END,
        updated_at = NOW()
    WHERE site_id = NEW.site_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update site inventory status
CREATE TRIGGER trg_inventory_status_update
AFTER INSERT OR UPDATE ON gold_inventory
FOR EACH ROW
EXECUTE FUNCTION update_site_inventory_status();

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO gold_audit_trail (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.site_id::TEXT, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO gold_audit_trail (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.site_id::TEXT, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO gold_audit_trail (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.site_id::TEXT, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Schema deployment complete!';
    RAISE NOTICE 'Version: 1.0.0';
    RAISE NOTICE 'Tables created: 20+';
    RAISE NOTICE 'Views created: 3';
    RAISE NOTICE 'Functions created: 2';
    RAISE NOTICE 'Ready for sample data insertion.';
END $$;
