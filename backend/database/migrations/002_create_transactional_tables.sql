-- Migration 002: Create Transactional Tables
-- Sally TSM - Clinical Trial Supply Management
-- Created: 2024-11-28
-- Database: PostgreSQL 17.7+

-- 9. Demand_forecasts table - AI-generated demand predictions
CREATE TABLE IF NOT EXISTS demand_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) REFERENCES sites(site_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecast_period_start DATE NOT NULL,
    forecast_period_end DATE NOT NULL,
    predicted_demand INTEGER NOT NULL,
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,
    algorithm_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Shipment_events table - Detailed shipment event log
CREATE TABLE IF NOT EXISTS shipment_events (
    event_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    location VARCHAR(255),
    description TEXT,
    recorded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Protocol_amendments table - Protocol change tracking
CREATE TABLE IF NOT EXISTS protocol_amendments (
    amendment_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES studies(study_id) ON DELETE CASCADE,
    amendment_number VARCHAR(50) NOT NULL,
    amendment_date DATE NOT NULL,
    effective_date DATE,
    summary TEXT NOT NULL,
    impact_on_supply TEXT,
    approval_status VARCHAR(50) CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Inspections table - Regulatory inspection records
CREATE TABLE IF NOT EXISTS inspections (
    inspection_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) REFERENCES sites(site_id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL,
    inspector_name VARCHAR(255),
    inspection_type VARCHAR(100),
    findings TEXT,
    capa_required BOOLEAN DEFAULT FALSE,
    capa_due_date DATE,
    status VARCHAR(50) CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Follow-up Required')) DEFAULT 'Scheduled',
    documented_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. SAE_unblinding table - Serious Adverse Event unblinding log
CREATE TABLE IF NOT EXISTS sae_unblinding (
    unblinding_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES studies(study_id) ON DELETE CASCADE,
    site_id VARCHAR(50) REFERENCES sites(site_id) ON DELETE CASCADE,
    patient_id VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    requested_by VARCHAR(255),
    approved_by VARCHAR(255),
    unblinded_treatment VARCHAR(255),
    emergency_supply_requested BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) CHECK (status IN ('Requested', 'Approved', 'Rejected', 'Completed')) DEFAULT 'Requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_site_id ON demand_forecasts(site_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_id ON demand_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp ON shipment_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_protocol_amendments_study_id ON protocol_amendments(study_id);
CREATE INDEX IF NOT EXISTS idx_inspections_site_id ON inspections(site_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_sae_unblinding_study_id ON sae_unblinding(study_id);

-- Migration complete
-- Transactional tables (9-13) created with indexes
