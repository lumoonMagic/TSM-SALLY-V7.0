# 🏆 Sally TSM Gold Layer Database Schema

## Overview

This document defines the **centralized "Gold Layer" database schema** that consolidates data from multiple source systems (SAP, CTMS/Veeva, IRT/RTSM) to provide a unified view for Sally TSM Assistant.

---

## 🎯 Design Principles

1. **Single Source of Truth**: One consolidated view of clinical trial supply chain
2. **Denormalized for Analytics**: Optimized for queries, not transactions
3. **Source Traceability**: Track data lineage from source systems
4. **Temporal Tracking**: Historical snapshots and change tracking
5. **Integration Ready**: Compatible with Sally's AI/ML insights

---

## 📊 Core Entities

### 1. **Studies** (Clinical Trials)

**Purpose**: Master record for clinical trials

```sql
CREATE TABLE gold_studies (
    -- Primary Key
    study_id VARCHAR(50) PRIMARY KEY,
    
    -- Study Identification
    protocol_number VARCHAR(100) NOT NULL UNIQUE,
    study_name VARCHAR(500) NOT NULL,
    sponsor_study_id VARCHAR(100),
    
    -- Study Classification
    phase VARCHAR(20) CHECK (phase IN ('I', 'I/II', 'II', 'II/III', 'III', 'III/IV', 'IV')),
    therapeutic_area VARCHAR(200),
    indication VARCHAR(500),
    study_type VARCHAR(50), -- Interventional, Observational, etc.
    
    -- Study Status
    status VARCHAR(50) CHECK (status IN ('Planning', 'Active', 'Suspended', 'Completed', 'Terminated')),
    status_date DATE,
    
    -- Timeline
    planned_start_date DATE,
    actual_start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    first_patient_in DATE,
    last_patient_in DATE,
    last_patient_out DATE,
    
    -- Enrollment
    planned_enrollment INTEGER,
    current_enrollment INTEGER,
    enrollment_rate DECIMAL(10,2), -- patients per month
    
    -- Geography
    regions TEXT[], -- Array of regions
    countries_count INTEGER,
    sites_count INTEGER,
    
    -- Supply Information
    drug_product VARCHAR(200),
    comparator_product VARCHAR(200),
    supply_strategy VARCHAR(100), -- Central, Regional, Local
    
    -- Source Tracking
    source_system VARCHAR(50), -- CTMS, Veeva, Manual
    source_record_id VARCHAR(100),
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    
    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_studies_status ON gold_studies(status);
CREATE INDEX idx_studies_phase ON gold_studies(phase);
CREATE INDEX idx_studies_protocol ON gold_studies(protocol_number);
```

**Source Mappings:**
- **Veeva CTMS**: `study__v` object
- **SAP**: Custom table or project system (PS module)
- **IRT**: Study configuration tables

---

### 2. **Sites** (Clinical Trial Sites)

**Purpose**: Clinical trial site master with operational metrics

```sql
CREATE TABLE gold_sites (
    -- Primary Key
    site_id VARCHAR(50) PRIMARY KEY,
    
    -- Site Identification
    site_number VARCHAR(100) NOT NULL,
    site_name VARCHAR(500) NOT NULL,
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    
    -- Location
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    time_zone VARCHAR(50),
    
    -- Geography Coordinates (for logistics)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Site Classification
    site_type VARCHAR(50), -- Hospital, Clinic, Research Center
    tier VARCHAR(20), -- Tier 1, 2, 3 (by enrollment capacity)
    
    -- Status
    status VARCHAR(50) CHECK (status IN (
        'Qualification', 'Initiation', 'Active', 'Enrollment_Complete', 
        'Close_Out', 'Closed', 'Terminated', 'On_Hold'
    )),
    status_date DATE,
    
    -- Timeline
    site_selection_date DATE,
    site_initiation_date DATE,
    first_patient_screened DATE,
    first_patient_enrolled DATE,
    last_patient_enrolled DATE,
    site_closeout_date DATE,
    
    -- Enrollment Metrics
    enrollment_target INTEGER,
    current_enrollment INTEGER,
    screened_count INTEGER,
    screen_failure_count INTEGER,
    dropout_count INTEGER,
    enrollment_rate DECIMAL(10,2),
    
    -- Site Personnel
    principal_investigator VARCHAR(200),
    pi_email VARCHAR(200),
    pi_phone VARCHAR(50),
    site_coordinator VARCHAR(200),
    coordinator_email VARCHAR(200),
    coordinator_phone VARCHAR(50),
    
    -- Supply Chain Attributes
    supply_depot VARCHAR(100), -- Linked depot/warehouse
    shipping_carrier VARCHAR(100),
    average_lead_time_days INTEGER,
    reorder_point INTEGER,
    safety_stock_level INTEGER,
    
    -- Performance Metrics
    protocol_deviations_count INTEGER DEFAULT 0,
    gcp_inspection_status VARCHAR(50),
    last_monitoring_visit DATE,
    
    -- Source Tracking
    source_system VARCHAR(50),
    source_record_id VARCHAR(100),
    ctms_site_id VARCHAR(100), -- Link to CTMS
    irt_site_id VARCHAR(100),  -- Link to IRT
    
    -- Metadata
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sites_study ON gold_sites(study_id);
CREATE INDEX idx_sites_status ON gold_sites(status);
CREATE INDEX idx_sites_country ON gold_sites(country);
CREATE INDEX idx_sites_enrollment ON gold_sites(current_enrollment, enrollment_target);
```

**Source Mappings:**
- **Veeva CTMS**: `study_country__v`, `site__v` objects
- **IRT/RTSM**: Site configuration
- **SAP**: Customer master (KNA1) if sites are customers

---

### 3. **Investigational Products** (Study Drugs)

**Purpose**: Master data for investigational medicinal products

```sql
CREATE TABLE gold_products (
    -- Primary Key
    product_id VARCHAR(50) PRIMARY KEY,
    
    -- Product Identification
    material_number VARCHAR(40) NOT NULL UNIQUE, -- SAP material number
    product_code VARCHAR(100),
    product_name VARCHAR(500) NOT NULL,
    generic_name VARCHAR(200),
    
    -- Product Classification
    product_type VARCHAR(50) CHECK (product_type IN (
        'IMP', 'Comparator', 'Placebo', 'Rescue', 'Ancillary'
    )),
    dosage_form VARCHAR(100), -- Tablet, Capsule, Injectable, etc.
    strength VARCHAR(100),
    unit_of_measure VARCHAR(20),
    
    -- Packaging
    primary_packaging VARCHAR(200),
    secondary_packaging VARCHAR(200),
    units_per_pack INTEGER,
    packs_per_carton INTEGER,
    
    -- Regulatory
    regulatory_status VARCHAR(100),
    controlled_substance BOOLEAN DEFAULT FALSE,
    narcotic_category VARCHAR(50),
    
    -- Storage Conditions
    storage_temperature_min DECIMAL(5,2),
    storage_temperature_max DECIMAL(5,2),
    storage_conditions TEXT,
    light_protection BOOLEAN DEFAULT FALSE,
    humidity_controlled BOOLEAN DEFAULT FALSE,
    
    -- Shelf Life
    shelf_life_months INTEGER,
    retest_period_months INTEGER,
    
    -- Supply Chain Attributes
    lead_time_days INTEGER,
    minimum_order_quantity INTEGER,
    standard_order_quantity INTEGER,
    unit_cost DECIMAL(15,2),
    currency VARCHAR(10),
    
    -- Manufacturing
    manufacturer VARCHAR(200),
    manufacturing_site VARCHAR(200),
    country_of_origin VARCHAR(100),
    
    -- Source Tracking
    source_system VARCHAR(50),
    sap_material_number VARCHAR(40),
    
    -- Metadata
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_products_type ON gold_products(product_type);
CREATE INDEX idx_products_material ON gold_products(material_number);
```

**Source Mappings:**
- **SAP Tables**: 
  - `MARA` (Material Master General Data)
  - `MARC` (Plant Data)
  - `MAKT` (Material Descriptions)

---

### 4. **Inventory** (Site-level Stock)

**Purpose**: Current inventory levels at each clinical site

```sql
CREATE TABLE gold_inventory (
    -- Primary Key
    inventory_id VARCHAR(50) PRIMARY KEY,
    
    -- Links
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    
    -- Batch Information
    batch_number VARCHAR(100) NOT NULL,
    lot_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    retest_date DATE,
    
    -- Quantities
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_allocated INTEGER DEFAULT 0, -- Reserved for patients
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_allocated) STORED,
    quantity_quarantine INTEGER DEFAULT 0,
    quantity_expired INTEGER DEFAULT 0,
    quantity_damaged INTEGER DEFAULT 0,
    
    -- Unit of Measure
    uom VARCHAR(20), -- Vials, Bottles, Tablets, etc.
    
    -- Status
    status VARCHAR(50) CHECK (status IN (
        'Available', 'Reserved', 'Allocated', 'Quarantine', 
        'Expired', 'Damaged', 'Returned', 'Destroyed'
    )),
    status_date DATE,
    
    -- Temperature Monitoring
    temperature_excursion BOOLEAN DEFAULT FALSE,
    temperature_excursion_date DATE,
    temperature_min_recorded DECIMAL(5,2),
    temperature_max_recorded DECIMAL(5,2),
    
    -- Location
    storage_location VARCHAR(100),
    bin_location VARCHAR(50),
    
    -- Dates
    received_date DATE,
    first_use_date DATE,
    last_use_date DATE,
    
    -- Calculations
    days_until_expiry INTEGER GENERATED ALWAYS AS (expiry_date - CURRENT_DATE) STORED,
    expiry_risk_level VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN (expiry_date - CURRENT_DATE) < 30 THEN 'Critical'
            WHEN (expiry_date - CURRENT_DATE) < 90 THEN 'High'
            WHEN (expiry_date - CURRENT_DATE) < 180 THEN 'Medium'
            ELSE 'Low'
        END
    ) STORED,
    
    -- Source Tracking
    source_system VARCHAR(50),
    irt_inventory_id VARCHAR(100),
    sap_stock_id VARCHAR(100),
    
    -- Metadata
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    snapshot_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_inventory_site ON gold_inventory(site_id);
CREATE INDEX idx_inventory_product ON gold_inventory(product_id);
CREATE INDEX idx_inventory_status ON gold_inventory(status);
CREATE INDEX idx_inventory_expiry ON gold_inventory(expiry_date);
CREATE INDEX idx_inventory_batch ON gold_inventory(batch_number);
```

**Source Mappings:**
- **IRT/RTSM**: Site inventory tables
- **SAP Tables**:
  - `MCHB` (Batch Stocks)
  - `MARD` (Storage Location Stock)
  - `MSKA` (Sales Order Stock)

---

### 5. **Shipments** (Supply Deliveries)

**Purpose**: Track shipments from depot to sites

```sql
CREATE TABLE gold_shipments (
    -- Primary Key
    shipment_id VARCHAR(50) PRIMARY KEY,
    
    -- Shipment Identification
    shipment_number VARCHAR(100) NOT NULL UNIQUE,
    tracking_number VARCHAR(100),
    awb_number VARCHAR(100), -- Air Waybill
    
    -- Links
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    from_location_id VARCHAR(50), -- Depot/Warehouse
    to_site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    
    -- Shipment Details
    shipment_type VARCHAR(50) CHECK (shipment_type IN (
        'Initial', 'Resupply', 'Emergency', 'Return', 'Destruction'
    )),
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    
    -- Status
    status VARCHAR(50) CHECK (status IN (
        'Planned', 'Prepared', 'Packed', 'Shipped', 'In_Transit', 
        'Out_For_Delivery', 'Delivered', 'Delayed', 'Returned', 'Lost'
    )),
    status_date TIMESTAMP,
    
    -- Timeline
    planned_ship_date DATE,
    actual_ship_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Transit Time
    transit_days INTEGER GENERATED ALWAYS AS (actual_delivery_date - actual_ship_date) STORED,
    delay_days INTEGER GENERATED ALWAYS AS (actual_delivery_date - expected_delivery_date) STORED,
    
    -- Carrier Information
    carrier VARCHAR(100),
    service_level VARCHAR(50), -- Standard, Express, Same-Day
    mode_of_transport VARCHAR(50), -- Air, Ground, Courier
    
    -- Temperature Controlled
    temperature_controlled BOOLEAN DEFAULT FALSE,
    temperature_range VARCHAR(50),
    temperature_logger_id VARCHAR(100),
    temperature_excursion BOOLEAN DEFAULT FALSE,
    
    -- Contents Summary
    total_packages INTEGER,
    total_units INTEGER,
    total_weight_kg DECIMAL(10,2),
    
    -- Costs
    shipping_cost DECIMAL(15,2),
    duty_fees DECIMAL(15,2),
    insurance_cost DECIMAL(15,2),
    currency VARCHAR(10),
    
    -- Documentation
    commercial_invoice VARCHAR(100),
    packing_list VARCHAR(100),
    certificate_of_analysis VARCHAR(100),
    import_license VARCHAR(100),
    
    -- Delivery Confirmation
    received_by VARCHAR(200),
    delivery_notes TEXT,
    condition_on_arrival VARCHAR(100),
    damage_reported BOOLEAN DEFAULT FALSE,
    
    -- Source Tracking
    source_system VARCHAR(50),
    sap_delivery_number VARCHAR(20), -- SAP Delivery
    sap_shipment_number VARCHAR(20), -- SAP Shipment
    irt_shipment_id VARCHAR(100),
    
    -- Metadata
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_by VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE INDEX idx_shipments_site ON gold_shipments(to_site_id);
CREATE INDEX idx_shipments_status ON gold_shipments(status);
CREATE INDEX idx_shipments_date ON gold_shipments(actual_ship_date, expected_delivery_date);
CREATE INDEX idx_shipments_tracking ON gold_shipments(tracking_number);
```

**Source Mappings:**
- **SAP Tables**:
  - `LIKP` (Delivery Header)
  - `LIPS` (Delivery Items)
  - `VTTK` (Shipment Header)
  - `VTTP` (Shipment Items)
- **3PL Systems**: Carrier tracking integration

---

### 6. **Shipment Line Items**

**Purpose**: Individual products within each shipment

```sql
CREATE TABLE gold_shipment_items (
    -- Primary Key
    shipment_item_id VARCHAR(50) PRIMARY KEY,
    
    -- Links
    shipment_id VARCHAR(50) REFERENCES gold_shipments(shipment_id),
    product_id VARCHAR(50) REFERENCES gold_products(product_id),
    
    -- Item Details
    line_number INTEGER,
    batch_number VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    uom VARCHAR(20),
    
    -- Batch Dates
    manufacturing_date DATE,
    expiry_date DATE,
    
    -- Package Details
    package_number VARCHAR(100),
    package_type VARCHAR(100),
    
    -- Condition
    condition_on_receipt VARCHAR(100),
    quantity_damaged INTEGER DEFAULT 0,
    damage_description TEXT,
    
    -- Source Tracking
    source_system VARCHAR(50),
    sap_delivery_item VARCHAR(10),
    
    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipment_items_shipment ON gold_shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_product ON gold_shipment_items(product_id);
CREATE INDEX idx_shipment_items_batch ON gold_shipment_items(batch_number);
```

---

### 7. **Subjects/Patients** (De-identified)

**Purpose**: Patient enrollment and dosing information (de-identified for privacy)

```sql
CREATE TABLE gold_subjects (
    -- Primary Key
    subject_id VARCHAR(50) PRIMARY KEY, -- De-identified
    
    -- Links
    study_id VARCHAR(50) REFERENCES gold_studies(study_id),
    site_id VARCHAR(50) REFERENCES gold_sites(site_id),
    
    -- Subject Identification (De-identified)
    subject_number VARCHAR(100) NOT NULL, -- Study-specific number
    screening_number VARCHAR(100),
    randomization_number VARCHAR(100),
    
    -- Demographics (Minimal for supply planning)
    age_group VARCHAR(20), -- <18, 18-65, >65
    gender VARCHAR(20),
    
    -- Study Participation
    status VARCHAR(50) CHECK (status IN (
        'Screening', 'Screened', 'Enrolled', 'Active', 
        'Completed', 'Discontinued', 'Screen_Failed'
    )),
    
    -- Timeline
    screening_date DATE,
    enrollment_date DATE,
    randomization_date DATE,
    completion_date DATE,
    discontinuation_date DATE,
    
    -- Treatment Assignment
    treatment_arm VARCHAR(100),
    treatment_group VARCHAR(100), -- Active, Placebo, etc.
    stratification_factors TEXT,
    
    -- Supply Allocation
    kit_assigned VARCHAR(100),
    total_kits_dispensed INTEGER DEFAULT 0,
    last_dispensation_date DATE,
    next_scheduled_visit DATE,
    
    -- Compliance (for forecasting)
    visit_compliance_rate DECIMAL(5,2), -- Percentage
    dosing_compliance_rate DECIMAL(5,2),
    
    -- Source Tracking
    source_system VARCHAR(50),
    irt_subject_id VARCHAR(100),
    ctms_subject_id VARCHAR(100),
    
    -- Metadata
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_study ON gold_subjects(study_id);
CREATE INDEX idx_subjects_site ON gold_subjects(site_id);
CREATE INDEX idx_subjects_status ON gold_subjects(status);
CREATE INDEX idx_subjects_arm ON gold_subjects(treatment_arm);
```

**Source Mappings:**
- **IRT/RTSM**: Subject randomization and kit assignment
- **Veeva CTMS**: `study_subject__v` (de-identified)

---

**(Document continues with remaining tables...)**

**To be continued in next section with:**
- Forecasting & Demand Planning tables
- Vendors & Suppliers
- Purchase Orders
- Quality Events
- Audit Trail
