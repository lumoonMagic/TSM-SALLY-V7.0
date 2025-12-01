-- Migration 004: Create Integration Tables
-- Sally TSM - Clinical Trial Supply Management
-- Created: 2024-11-28
-- Database: PostgreSQL 17.7+

-- 18. ETL_jobs table - ETL pipeline execution log
CREATE TABLE IF NOT EXISTS etl_jobs (
    job_id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    source_system VARCHAR(100) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('Running', 'Success', 'Failed', 'Cancelled')) DEFAULT 'Running',
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB
);

-- 19. SAP_staging table - SAP data staging area
CREATE TABLE IF NOT EXISTS sap_staging (
    staging_id SERIAL PRIMARY KEY,
    material_code VARCHAR(100) NOT NULL,
    plant_code VARCHAR(100) NOT NULL,
    storage_location VARCHAR(100),
    batch_number VARCHAR(100),
    quantity DECIMAL(15,3),
    uom VARCHAR(50),  -- Unit of Measure
    stock_type VARCHAR(50),
    last_movement_date DATE,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_status VARCHAR(50) CHECK (processed_status IN ('Pending', 'Processed', 'Error')) DEFAULT 'Pending',
    error_message TEXT
);

-- 20. Veeva_staging table - Veeva CTMS staging area
CREATE TABLE IF NOT EXISTS veeva_staging (
    staging_id SERIAL PRIMARY KEY,
    study_number VARCHAR(100) NOT NULL,
    site_number VARCHAR(100) NOT NULL,
    site_name VARCHAR(255),
    country VARCHAR(100),
    status VARCHAR(100),
    enrollment_count INTEGER,
    last_modified_date TIMESTAMP,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_status VARCHAR(50) CHECK (processed_status IN ('Pending', 'Processed', 'Error')) DEFAULT 'Pending',
    error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_etl_jobs_status ON etl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_etl_jobs_started_at ON etl_jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sap_staging_processed_status ON sap_staging(processed_status);
CREATE INDEX IF NOT EXISTS idx_sap_staging_material_code ON sap_staging(material_code);
CREATE INDEX IF NOT EXISTS idx_veeva_staging_processed_status ON veeva_staging(processed_status);
CREATE INDEX IF NOT EXISTS idx_veeva_staging_study_number ON veeva_staging(study_number);

-- Migration complete
-- Integration tables (18-20) created with indexes
-- All 20 tables are now in place!
