-- Migration 001: Create Core Domain Tables
-- Sally TSM - Clinical Trial Supply Management
-- Created: 2024-11-28
-- Database: PostgreSQL 17.7+

-- 1. Studies table - Clinical trial metadata
CREATE TABLE IF NOT EXISTS studies (
    study_id VARCHAR(50) PRIMARY KEY,
    study_name VARCHAR(255) NOT NULL,
    protocol_number VARCHAR(100) UNIQUE NOT NULL,
    phase VARCHAR(20) CHECK (phase IN ('Phase I', 'Phase II', 'Phase III', 'Phase IV')),
    indication VARCHAR(255),
    sponsor VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Terminated')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sites table - Clinical sites
CREATE TABLE IF NOT EXISTS sites (
    site_id VARCHAR(50) PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES studies(study_id) ON DELETE CASCADE,
    site_name VARCHAR(255) NOT NULL,
    site_number VARCHAR(50),
    country VARCHAR(100),
    region VARCHAR(100),
    investigator_name VARCHAR(255),
    enrollment_target INTEGER,
    enrollment_actual INTEGER DEFAULT 0,
    status VARCHAR(50) CHECK (status IN ('Pending', 'Active', 'On Hold', 'Closed')),
    activation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products table - Investigational products
CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) UNIQUE,
    formulation VARCHAR(255),
    strength VARCHAR(100),
    unit VARCHAR(50),
    storage_condition VARCHAR(255),
    shelf_life_months INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inventory table - Site inventory levels
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id VARCHAR(50) PRIMARY KEY,
    site_id VARCHAR(50) REFERENCES sites(site_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    lot_number VARCHAR(100),
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    expiry_date DATE,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Shipments table - Shipment tracking
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES studies(study_id),
    from_location VARCHAR(255),
    to_site_id VARCHAR(50) REFERENCES sites(site_id),
    product_id VARCHAR(50) REFERENCES products(product_id),
    lot_number VARCHAR(100),
    quantity INTEGER NOT NULL,
    shipment_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(50) CHECK (status IN ('Pending', 'In Transit', 'Delivered', 'Delayed', 'Cancelled')),
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    temperature_monitored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Temperature_logs table - Cold chain monitoring
CREATE TABLE IF NOT EXISTS temperature_logs (
    log_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(shipment_id),
    inventory_id VARCHAR(50) REFERENCES inventory(inventory_id),
    recorded_at TIMESTAMP NOT NULL,
    temperature_celsius DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    location VARCHAR(255),
    device_id VARCHAR(100),
    alert_triggered BOOLEAN DEFAULT FALSE
);

-- 7. Alerts table - System alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
    alert_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    study_id VARCHAR(50) REFERENCES studies(study_id),
    site_id VARCHAR(50) REFERENCES sites(site_id),
    product_id VARCHAR(50) REFERENCES products(product_id),
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('Active', 'Acknowledged', 'Resolved', 'Dismissed')) DEFAULT 'Active'
);

-- 8. Users table - System users (future authentication)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    organization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_study_id ON sites(study_id);
CREATE INDEX IF NOT EXISTS idx_inventory_site_id ON inventory(site_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_shipments_to_site_id ON shipments(to_site_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_shipment_id ON temperature_logs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- Migration complete
-- Core 8 tables created with indexes
