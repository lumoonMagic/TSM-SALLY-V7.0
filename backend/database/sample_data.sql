-- ============================================================================
-- Sally TSM - Sample Data for Testing
-- Version: 1.0.0
-- Purpose: Realistic test data for clinical trial supply management
-- Records: 100+ across all tables
-- ============================================================================

-- Clear existing data (in reverse dependency order)
TRUNCATE TABLE gold_audit_trail CASCADE;
TRUNCATE TABLE gold_quality_events CASCADE;
TRUNCATE TABLE gold_temperature_logs CASCADE;
TRUNCATE TABLE gold_purchase_orders CASCADE;
TRUNCATE TABLE gold_vendors CASCADE;
TRUNCATE TABLE gold_inventory_targets CASCADE;
TRUNCATE TABLE gold_demand_forecast CASCADE;
TRUNCATE TABLE gold_shipment_items CASCADE;
TRUNCATE TABLE gold_shipments CASCADE;
TRUNCATE TABLE gold_subjects CASCADE;
TRUNCATE TABLE gold_inventory CASCADE;
TRUNCATE TABLE gold_products CASCADE;
TRUNCATE TABLE gold_depots CASCADE;
TRUNCATE TABLE gold_sites CASCADE;
TRUNCATE TABLE gold_studies CASCADE;
TRUNCATE TABLE ai_briefs CASCADE;
TRUNCATE TABLE rag_queries CASCADE;
TRUNCATE TABLE vector_documents CASCADE;

-- ============================================================================
-- CLINICAL STUDIES
-- ============================================================================

INSERT INTO gold_studies (study_id, study_name, protocol_number, phase, indication, sponsor, status, start_date, planned_end_date, target_enrollment, current_enrollment, total_sites, active_sites, country_count) VALUES
('STUDY-001', 'Oncology Phase III Trial - Lung Cancer', 'ONC-2023-001', 'Phase III', 'Non-Small Cell Lung Cancer', 'Pharma Global Inc', 'Active', '2023-01-15', '2025-12-31', 600, 450, 50, 42, 12),
('STUDY-002', 'Cardiovascular Study - Heart Failure', 'CARDIO-2023-002', 'Phase II', 'Chronic Heart Failure', 'CardioMed Research', 'Active', '2023-03-20', '2025-06-30', 300, 180, 30, 28, 8),
('STUDY-003', 'Diabetes Management Trial', 'ENDO-2023-003', 'Phase III', 'Type 2 Diabetes', 'MetaboCare Pharma', 'Active', '2023-05-10', '2026-03-31', 800, 520, 65, 58, 15),
('STUDY-004', 'Immunology Phase II - Rheumatoid Arthritis', 'IMMUNO-2023-004', 'Phase II', 'Rheumatoid Arthritis', 'ImmunoTherapeutics', 'Active', '2023-07-01', '2025-09-30', 200, 145, 25, 22, 6),
('STUDY-005', 'Neurology Phase I - Alzheimer Disease', 'NEURO-2024-005', 'Phase I', 'Early-stage Alzheimer', 'NeuroPharma Ltd', 'Active', '2024-01-10', '2025-12-31', 100, 45, 15, 12, 5);

-- ============================================================================
-- CLINICAL SITES
-- ============================================================================

INSERT INTO gold_sites (site_id, site_name, site_number, study_id, country, city, investigator_name, site_status, activation_date, target_enrollment, current_enrollment, enrollment_rate, inventory_status, last_shipment_date, contact_email) VALUES
-- STUDY-001 Sites
('SITE-001', 'Memorial Cancer Center', 'S001', 'STUDY-001', 'USA', 'New York', 'Dr. Sarah Johnson', 'Active', '2023-02-01', 15, 12, 0.8, 'Healthy', '2024-11-15', 'sarah.johnson@memorial.org'),
('SITE-002', 'City Hospital Oncology', 'S002', 'STUDY-001', 'USA', 'Los Angeles', 'Dr. Michael Chen', 'Active', '2023-02-15', 12, 10, 0.7, 'Healthy', '2024-11-20', 'mchen@cityhospital.com'),
('SITE-003', 'London Cancer Institute', 'S003', 'STUDY-001', 'UK', 'London', 'Prof. Emma Williams', 'Active', '2023-03-01', 18, 15, 1.2, 'Low', '2024-11-10', 'e.williams@lci.nhs.uk'),
('SITE-004', 'Berlin Medical Center', 'S004', 'STUDY-001', 'Germany', 'Berlin', 'Dr. Hans Mueller', 'Active', '2023-03-10', 10, 8, 0.5, 'Healthy', '2024-11-25', 'h.mueller@berlinmed.de'),
('SITE-005', 'Tokyo University Hospital', 'S005', 'STUDY-001', 'Japan', 'Tokyo', 'Dr. Yuki Tanaka', 'Active', '2023-03-20', 12, 9, 0.6, 'Critical', '2024-10-30', 'y.tanaka@tokyo-univ.jp'),
('SITE-006', 'Sydney Cancer Center', 'S006', 'STUDY-001', 'Australia', 'Sydney', 'Dr. James Brown', 'Active', '2023-04-01', 15, 11, 0.9, 'Low', '2024-11-18', 'j.brown@sydneycc.au'),
('SITE-007', 'Toronto General Hospital', 'S007', 'STUDY-001', 'Canada', 'Toronto', 'Dr. Lisa Anderson', 'Active', '2023-04-15', 10, 7, 0.4, 'Healthy', '2024-11-22', 'l.anderson@tgh.ca'),
-- STUDY-002 Sites
('SITE-010', 'Heart Institute Boston', 'S010', 'STUDY-002', 'USA', 'Boston', 'Dr. Robert Taylor', 'Active', '2023-04-01', 12, 8, 0.7, 'Healthy', '2024-11-12', 'r.taylor@heartboston.org'),
('SITE-011', 'Paris Cardiac Center', 'S011', 'STUDY-002', 'France', 'Paris', 'Dr. Marie Dubois', 'Active', '2023-04-20', 10, 6, 0.5, 'Low', '2024-11-08', 'm.dubois@pcc.fr'),
('SITE-012', 'Madrid Heart Hospital', 'S012', 'STUDY-002', 'Spain', 'Madrid', 'Dr. Carlos Garcia', 'Active', '2023-05-01', 8, 5, 0.3, 'Healthy', '2024-11-20', 'c.garcia@madrid-heart.es'),
-- STUDY-003 Sites
('SITE-020', 'Diabetes Research Center NYC', 'S020', 'STUDY-003', 'USA', 'New York', 'Dr. Patricia Lee', 'Active', '2023-06-01', 15, 12, 1.0, 'Healthy', '2024-11-23', 'p.lee@drcnyc.org'),
('SITE-021', 'London Diabetes Institute', 'S021', 'STUDY-003', 'UK', 'London', 'Dr. David Smith', 'Active', '2023-06-15', 12, 9, 0.8, 'Healthy', '2024-11-19', 'd.smith@ldi.nhs.uk'),
('SITE-022', 'Mumbai Endocrine Center', 'S022', 'STUDY-003', 'India', 'Mumbai', 'Dr. Priya Sharma', 'Active', '2023-07-01', 20, 15, 1.5, 'Low', '2024-11-05', 'p.sharma@mumbaidc.in'),
-- STUDY-004 Sites
('SITE-030', 'Rheumatology Center Chicago', 'S030', 'STUDY-004', 'USA', 'Chicago', 'Dr. Jennifer White', 'Active', '2023-08-01', 10, 7, 0.6, 'Healthy', '2024-11-17', 'j.white@rheumchicago.org'),
('SITE-031', 'Amsterdam Medical Center', 'S031', 'STUDY-004', 'Netherlands', 'Amsterdam', 'Dr. Peter van der Berg', 'Active', '2023-08-20', 8, 5, 0.4, 'Healthy', '2024-11-21', 'p.vandenberg@amc.nl'),
-- STUDY-005 Sites
('SITE-040', 'Brain Research Institute SF', 'S040', 'STUDY-005', 'USA', 'San Francisco', 'Dr. Amanda Martinez', 'Active', '2024-02-01', 8, 4, 0.3, 'Healthy', '2024-11-14', 'a.martinez@brainsf.org'),
('SITE-041', 'Stockholm Neurology Center', 'S041', 'STUDY-005', 'Sweden', 'Stockholm', 'Dr. Erik Andersson', 'Active', '2024-02-20', 6, 3, 0.2, 'Healthy', '2024-11-16', 'e.andersson@snc.se');

-- ============================================================================
-- PRODUCTS
-- ============================================================================

INSERT INTO gold_products (product_id, product_name, product_code, study_id, product_type, dosage_form, strength, unit_of_measure, storage_temperature_min, storage_temperature_max, shelf_life_days, cost_per_unit, requires_cold_chain) VALUES
-- STUDY-001 Products
('PROD-001', 'Oncology Drug A', 'ONC-A-100', 'STUDY-001', 'IMP', 'Tablet', '100mg', 'tablet', 15.0, 25.0, 730, 250.00, false),
('PROD-002', 'Placebo for Drug A', 'ONC-PL-100', 'STUDY-001', 'Placebo', 'Tablet', '100mg', 'tablet', 15.0, 25.0, 730, 5.00, false),
('PROD-003', 'Comparator Chemo', 'ONC-COMP-50', 'STUDY-001', 'Comparator', 'Injection', '50mg/ml', 'vial', 2.0, 8.0, 365, 500.00, true),
-- STUDY-002 Products
('PROD-010', 'Cardio Drug B', 'CARDIO-B-50', 'STUDY-002', 'IMP', 'Capsule', '50mg', 'capsule', 15.0, 25.0, 730, 180.00, false),
('PROD-011', 'Placebo for Drug B', 'CARDIO-PL-50', 'STUDY-002', 'Placebo', 'Capsule', '50mg', 'capsule', 15.0, 25.0, 730, 3.00, false),
-- STUDY-003 Products
('PROD-020', 'Diabetes Drug C', 'ENDO-C-10', 'STUDY-003', 'IMP', 'Tablet', '10mg', 'tablet', 15.0, 25.0, 730, 120.00, false),
('PROD-021', 'Placebo for Drug C', 'ENDO-PL-10', 'STUDY-003', 'Placebo', 'Tablet', '10mg', 'tablet', 15.0, 25.0, 730, 2.00, false),
-- STUDY-004 Products
('PROD-030', 'Immuno Drug D', 'IMMUNO-D-25', 'STUDY-004', 'IMP', 'Injection', '25mg/ml', 'syringe', 2.0, 8.0, 365, 800.00, true),
('PROD-031', 'Placebo for Drug D', 'IMMUNO-PL-25', 'STUDY-004', 'Placebo', 'Injection', '0mg/ml', 'syringe', 2.0, 8.0, 365, 10.00, true),
-- STUDY-005 Products
('PROD-040', 'Neuro Drug E', 'NEURO-E-5', 'STUDY-005', 'IMP', 'Tablet', '5mg', 'tablet', 15.0, 25.0, 730, 350.00, false);

-- ============================================================================
-- DEPOTS
-- ============================================================================

INSERT INTO gold_depots (depot_id, depot_name, depot_code, country, city, depot_type, storage_capacity, current_utilization_pct, temperature_controlled, contact_email) VALUES
('DEPOT-001', 'North America Central Depot', 'NAM-CENTRAL', 'USA', 'Philadelphia', 'Central', 100000, 65.5, true, 'ops@namdepot.com'),
('DEPOT-002', 'Europe Regional Depot', 'EUR-REGIONAL', 'Belgium', 'Brussels', 'Regional', 75000, 58.2, true, 'ops@eurdepot.com'),
('DEPOT-003', 'Asia-Pacific Regional Depot', 'APAC-REGIONAL', 'Singapore', 'Singapore', 'Regional', 60000, 72.3, true, 'ops@apacdepot.com'),
('DEPOT-004', 'Latin America Regional Depot', 'LATAM-REGIONAL', 'Brazil', 'Sao Paulo', 'Regional', 50000, 45.8, true, 'ops@latamdepot.com'),
('DEPOT-005', 'Middle East Local Depot', 'ME-LOCAL', 'UAE', 'Dubai', 'Local', 30000, 38.5, true, 'ops@medepot.ae');

-- ============================================================================
-- INVENTORY
-- ============================================================================

INSERT INTO gold_inventory (site_id, product_id, batch_number, quantity_on_hand, quantity_allocated, expiry_date, receipt_date, storage_location, temperature_status, last_count_date) VALUES
-- SITE-001 Inventory
('SITE-001', 'PROD-001', 'BATCH-001-2024', 150, 30, '2025-06-30', '2024-01-15', 'Room A-101', 'Normal', '2024-11-25'),
('SITE-001', 'PROD-002', 'BATCH-002-2024', 150, 30, '2025-06-30', '2024-01-15', 'Room A-102', 'Normal', '2024-11-25'),
('SITE-001', 'PROD-003', 'BATCH-003-2024', 50, 10, '2025-03-31', '2024-06-01', 'Refrigerator R-01', 'Normal', '2024-11-25'),
-- SITE-002 Inventory
('SITE-002', 'PROD-001', 'BATCH-001-2024', 120, 20, '2025-06-30', '2024-02-10', 'Room B-201', 'Normal', '2024-11-20'),
('SITE-002', 'PROD-002', 'BATCH-002-2024', 120, 20, '2025-06-30', '2024-02-10', 'Room B-202', 'Normal', '2024-11-20'),
-- SITE-003 Inventory (Low Stock)
('SITE-003', 'PROD-001', 'BATCH-001-2024', 40, 15, '2025-06-30', '2024-03-05', 'Room C-301', 'Normal', '2024-11-10'),
('SITE-003', 'PROD-002', 'BATCH-002-2024', 40, 15, '2025-06-30', '2024-03-05', 'Room C-302', 'Normal', '2024-11-10'),
-- SITE-005 Inventory (Critical - Very Low)
('SITE-005', 'PROD-001', 'BATCH-001-2024', 20, 10, '2025-06-30', '2024-04-01', 'Room E-501', 'Normal', '2024-10-30'),
('SITE-005', 'PROD-002', 'BATCH-002-2024', 20, 10, '2025-06-30', '2024-04-01', 'Room E-502', 'Normal', '2024-10-30'),
-- SITE-006 Inventory (Low Stock)
('SITE-006', 'PROD-001', 'BATCH-001-2024', 45, 12, '2025-06-30', '2024-04-20', 'Room F-601', 'Normal', '2024-11-18'),
-- SITE-010 Inventory
('SITE-010', 'PROD-010', 'BATCH-010-2024', 100, 15, '2025-08-31', '2024-04-15', 'Room J-1001', 'Normal', '2024-11-12'),
('SITE-010', 'PROD-011', 'BATCH-011-2024', 100, 15, '2025-08-31', '2024-04-15', 'Room J-1002', 'Normal', '2024-11-12'),
-- SITE-011 Inventory (Low)
('SITE-011', 'PROD-010', 'BATCH-010-2024', 35, 8, '2025-08-31', '2024-05-10', 'Room K-1101', 'Normal', '2024-11-08'),
-- SITE-020 Inventory
('SITE-020', 'PROD-020', 'BATCH-020-2024', 180, 25, '2025-09-30', '2024-06-05', 'Room T-2001', 'Normal', '2024-11-23'),
('SITE-020', 'PROD-021', 'BATCH-021-2024', 180, 25, '2025-09-30', '2024-06-05', 'Room T-2002', 'Normal', '2024-11-23'),
-- SITE-022 Inventory (Low)
('SITE-022', 'PROD-020', 'BATCH-020-2024', 50, 15, '2025-09-30', '2024-07-20', 'Room V-2201', 'Normal', '2024-11-05'),
-- SITE-030 Inventory
('SITE-030', 'PROD-030', 'BATCH-030-2024', 60, 10, '2025-04-30', '2024-08-10', 'Refrigerator R-30', 'Normal', '2024-11-17'),
('SITE-030', 'PROD-031', 'BATCH-031-2024', 60, 10, '2025-04-30', '2024-08-10', 'Refrigerator R-31', 'Normal', '2024-11-17');

-- ============================================================================
-- SHIPMENTS
-- ============================================================================

INSERT INTO gold_shipments (shipment_id, shipment_number, from_depot_id, to_site_id, study_id, shipment_type, shipment_status, priority, carrier, tracking_number, shipped_date, estimated_delivery_date, actual_delivery_date, temperature_monitoring_enabled, customs_clearance_required, customs_cleared, shipment_cost, risk_score, risk_level) VALUES
-- Delivered Shipments
('SHIP-001', 'SH-2024-0001', 'DEPOT-001', 'SITE-001', 'STUDY-001', 'Routine', 'Delivered', 'Normal', 'FedEx', 'FDX123456789', '2024-11-10', '2024-11-15', '2024-11-15', true, false, true, 350.00, 0.15, 'Low'),
('SHIP-002', 'SH-2024-0002', 'DEPOT-001', 'SITE-002', 'STUDY-001', 'Routine', 'Delivered', 'Normal', 'UPS', 'UPS987654321', '2024-11-12', '2024-11-18', '2024-11-20', true, false, true, 380.00, 0.22, 'Low'),
('SHIP-003', 'SH-2024-0003', 'DEPOT-002', 'SITE-003', 'STUDY-001', 'Routine', 'Delivered', 'Normal', 'DHL', 'DHL456789123', '2024-11-05', '2024-11-10', '2024-11-10', true, false, true, 420.00, 0.18, 'Low'),
-- In Transit Shipments
('SHIP-010', 'SH-2024-0010', 'DEPOT-001', 'SITE-005', 'STUDY-001', 'Emergency', 'In Transit', 'Critical', 'FedEx Priority', 'FDX555444333', '2024-11-28', '2024-12-03', NULL, true, false, true, 850.00, 0.35, 'Medium'),
('SHIP-011', 'SH-2024-0011', 'DEPOT-002', 'SITE-006', 'STUDY-001', 'Routine', 'In Transit', 'High', 'DHL Express', 'DHL888999000', '2024-11-27', '2024-12-02', NULL, true, false, true, 520.00, 0.28, 'Low'),
('SHIP-012', 'SH-2024-0012', 'DEPOT-003', 'SITE-005', 'STUDY-001', 'Emergency', 'In Transit', 'Critical', 'Air Cargo', 'AIR111222333', '2024-11-26', '2024-12-05', NULL, true, true, false, 1200.00, 0.75, 'High'),
-- Delayed Shipment
('SHIP-020', 'SH-2024-0020', 'DEPOT-002', 'SITE-011', 'STUDY-002', 'Routine', 'Delayed', 'Normal', 'DHL', 'DHL777888999', '2024-11-20', '2024-11-25', NULL, true, true, false, 450.00, 0.68, 'High'),
-- Planned Shipments
('SHIP-030', 'SH-2024-0030', 'DEPOT-001', 'SITE-022', 'STUDY-003', 'Routine', 'Planned', 'High', 'FedEx', NULL, NULL, '2024-12-08', NULL, true, false, false, 680.00, 0.42, 'Medium'),
('SHIP-031', 'SH-2024-0031', 'DEPOT-002', 'SITE-003', 'STUDY-001', 'Emergency', 'Planned', 'Critical', 'DHL Express', NULL, NULL, '2024-12-04', NULL, true, false, false, 920.00, 0.55, 'Medium');

-- ============================================================================
-- SHIPMENT ITEMS
-- ============================================================================

INSERT INTO gold_shipment_items (shipment_id, product_id, batch_number, quantity, expiry_date, unit_cost) VALUES
-- SHIP-001 Items
('SHIP-001', 'PROD-001', 'BATCH-001-2024', 100, '2025-06-30', 250.00),
('SHIP-001', 'PROD-002', 'BATCH-002-2024', 100, '2025-06-30', 5.00),
-- SHIP-010 Items (Emergency to SITE-005)
('SHIP-010', 'PROD-001', 'BATCH-001-2024', 150, '2025-06-30', 250.00),
('SHIP-010', 'PROD-002', 'BATCH-002-2024', 150, '2025-06-30', 5.00),
-- SHIP-012 Items (High risk shipment)
('SHIP-012', 'PROD-003', 'BATCH-003-2024', 50, '2025-03-31', 500.00);

-- ============================================================================
-- SUBJECTS
-- ============================================================================

INSERT INTO gold_subjects (subject_id, study_id, site_id, subject_number, enrollment_date, randomization_date, treatment_arm, subject_status, last_visit_date, next_visit_date, dosing_frequency, total_doses_required, doses_completed) VALUES
-- STUDY-001 Subjects
('SUB-001-001', 'STUDY-001', 'SITE-001', '001-001', '2024-03-15', '2024-03-20', 'Drug A', 'Active', '2024-11-20', '2024-12-18', 'Daily', 365, 245),
('SUB-001-002', 'STUDY-001', 'SITE-001', '001-002', '2024-04-10', '2024-04-15', 'Placebo', 'Active', '2024-11-22', '2024-12-20', 'Daily', 365, 225),
('SUB-001-003', 'STUDY-001', 'SITE-001', '001-003', '2024-05-05', '2024-05-10', 'Drug A', 'Active', '2024-11-18', '2024-12-16', 'Daily', 365, 200),
('SUB-001-004', 'STUDY-001', 'SITE-002', '002-001', '2024-04-20', '2024-04-25', 'Comparator', 'Active', '2024-11-25', '2024-12-23', 'Weekly', 52, 32),
('SUB-001-005', 'STUDY-001', 'SITE-003', '003-001', '2024-05-15', '2024-05-20', 'Drug A', 'Active', '2024-11-15', '2024-12-13', 'Daily', 365, 190),
-- STUDY-002 Subjects
('SUB-002-001', 'STUDY-002', 'SITE-010', '010-001', '2024-06-01', '2024-06-05', 'Drug B', 'Active', '2024-11-28', '2024-12-26', 'Twice Daily', 730, 340),
('SUB-002-002', 'STUDY-002', 'SITE-010', '010-002', '2024-07-10', '2024-07-15', 'Placebo', 'Active', '2024-11-26', '2024-12-24', 'Twice Daily', 730, 280),
-- STUDY-003 Subjects
('SUB-003-001', 'STUDY-003', 'SITE-020', '020-001', '2024-08-01', '2024-08-05', 'Drug C', 'Active', '2024-11-30', '2024-12-28', 'Daily', 365, 115),
('SUB-003-002', 'STUDY-003', 'SITE-020', '020-002', '2024-08-15', '2024-08-20', 'Placebo', 'Active', '2024-11-29', '2024-12-27', 'Daily', 365, 100);

-- ============================================================================
-- VENDORS
-- ============================================================================

INSERT INTO gold_vendors (vendor_id, vendor_name, vendor_code, vendor_type, country, contact_email, performance_rating, on_time_delivery_pct, quality_compliance_pct, active) VALUES
('VENDOR-001', 'GlobalPharma Manufacturing', 'GPM-001', 'Manufacturer', 'USA', 'ops@globalpharma.com', 4.5, 95.5, 98.2, true),
('VENDOR-002', 'EuroDist Logistics', 'EDL-002', 'Distributor', 'Germany', 'logistics@eurodist.de', 4.2, 92.0, 96.5, true),
('VENDOR-003', 'AsiaPac Supply Chain', 'APSC-003', 'Distributor', 'Singapore', 'supply@asiapac.sg', 4.0, 88.5, 95.0, true),
('VENDOR-004', 'FedEx Healthcare', 'FDX-004', 'Courier', 'USA', 'healthcare@fedex.com', 4.8, 97.8, 99.5, true),
('VENDOR-005', 'DHL Life Sciences', 'DHL-005', 'Courier', 'Germany', 'lifesciences@dhl.com', 4.6, 96.2, 99.0, true);

-- ============================================================================
-- QUALITY EVENTS
-- ============================================================================

INSERT INTO gold_quality_events (event_id, event_number, event_type, severity, shipment_id, site_id, product_id, batch_number, event_date, detected_by, description, event_status, regulatory_reporting_required) VALUES
('QE-001', 'QE-2024-0001', 'Temperature Excursion', 'Medium', 'SHIP-020', 'SITE-011', 'PROD-010', 'BATCH-010-2024', '2024-11-22 14:30:00', 'Site Staff', 'Temperature exceeded 8°C for 2 hours during transit', 'Under Investigation', false),
('QE-002', 'QE-2024-0002', 'Damaged Product', 'Low', 'SHIP-002', 'SITE-002', 'PROD-001', 'BATCH-001-2024', '2024-11-20 10:15:00', 'Receiving Staff', 'Outer packaging damaged, inner packaging intact', 'Closed', false),
('QE-003', 'QE-2024-0003', 'Documentation Issue', 'Low', NULL, 'SITE-003', NULL, NULL, '2024-11-18 09:00:00', 'Site Monitor', 'Missing temperature log for one shipment', 'Open', false);

-- ============================================================================
-- TEMPERATURE LOGS (for SHIP-012 - the high-risk cold chain shipment)
-- ============================================================================

INSERT INTO gold_temperature_logs (shipment_id, recorded_at, temperature_celsius, humidity_pct, within_range, alert_triggered, device_id) VALUES
('SHIP-012', '2024-11-26 08:00:00', 4.5, 55.0, true, false, 'TEMP-SENSOR-123'),
('SHIP-012', '2024-11-26 12:00:00', 5.2, 58.0, true, false, 'TEMP-SENSOR-123'),
('SHIP-012', '2024-11-26 16:00:00', 6.8, 60.0, true, false, 'TEMP-SENSOR-123'),
('SHIP-012', '2024-11-27 08:00:00', 5.5, 57.0, true, false, 'TEMP-SENSOR-123'),
('SHIP-012', '2024-11-27 12:00:00', 4.8, 56.0, true, false, 'TEMP-SENSOR-123');

-- ============================================================================
-- DEMAND FORECASTS
-- ============================================================================

INSERT INTO gold_demand_forecast (study_id, site_id, product_id, forecast_date, forecast_horizon_days, predicted_demand, confidence_level, algorithm_used) VALUES
('STUDY-001', 'SITE-005', 'PROD-001', '2024-12-10', 30, 180, 0.92, 'time_series_arima'),
('STUDY-001', 'SITE-003', 'PROD-001', '2024-12-10', 30, 150, 0.89, 'time_series_arima'),
('STUDY-002', 'SITE-011', 'PROD-010', '2024-12-10', 30, 90, 0.87, 'time_series_arima');

-- ============================================================================
-- INVENTORY TARGETS
-- ============================================================================

INSERT INTO gold_inventory_targets (site_id, product_id, optimal_stock_level, safety_stock_level, reorder_point, economic_order_quantity, lead_time_days, algorithm_used) VALUES
('SITE-005', 'PROD-001', 200, 50, 100, 150, 14, 'eoq_optimization'),
('SITE-003', 'PROD-001', 180, 45, 90, 150, 10, 'eoq_optimization'),
('SITE-011', 'PROD-010', 150, 35, 70, 100, 12, 'eoq_optimization');

-- ============================================================================
-- AI BRIEFS (Sample)
-- ============================================================================

INSERT INTO ai_briefs (brief_type, brief_date, mode, content, algorithms_used, generation_time_ms) VALUES
('morning', '2024-12-02', 'production', 
 '{"summary": {"critical_alerts": 2, "sites_low_inventory": 4}, "alerts": [{"severity": "high", "message": "SITE-005 critical stock level"}]}'::jsonb,
 ARRAY['demand_forecasting', 'inventory_optimization'],
 2500),
('evening', '2024-12-01', 'production',
 '{"summary": {"shipments_delivered": 3, "issues_resolved": 2}, "performance": {"on_time_delivery_pct": 95.5}}'::jsonb,
 ARRAY['trend_analysis'],
 1800);

-- ============================================================================
-- RAG QUERIES (Sample)
-- ============================================================================

INSERT INTO rag_queries (question, sql_generated, sql_executed, execution_time_ms, result_count, answer, confidence_score, mode) VALUES
('How many sites have low inventory?', 'SELECT COUNT(*) FROM gold_sites WHERE inventory_status IN (''Low'', ''Critical'')', true, 45, 1, '4 sites currently have low inventory status', 0.95, 'production'),
('Which shipments are delayed?', 'SELECT * FROM gold_shipments WHERE shipment_status = ''Delayed''', true, 38, 1, '1 shipment (SHIP-020) is currently delayed', 0.92, 'production');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
    study_count INTEGER;
    site_count INTEGER;
    product_count INTEGER;
    inventory_count INTEGER;
    shipment_count INTEGER;
    subject_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO study_count FROM gold_studies;
    SELECT COUNT(*) INTO site_count FROM gold_sites;
    SELECT COUNT(*) INTO product_count FROM gold_products;
    SELECT COUNT(*) INTO inventory_count FROM gold_inventory;
    SELECT COUNT(*) INTO shipment_count FROM gold_shipments;
    SELECT COUNT(*) INTO subject_count FROM gold_subjects;
    
    RAISE NOTICE 'Sample data insertion complete!';
    RAISE NOTICE 'Studies: %', study_count;
    RAISE NOTICE 'Sites: %', site_count;
    RAISE NOTICE 'Products: %', product_count;
    RAISE NOTICE 'Inventory Records: %', inventory_count;
    RAISE NOTICE 'Shipments: %', shipment_count;
    RAISE NOTICE 'Subjects: %', subject_count;
    RAISE NOTICE 'Total Records: %', study_count + site_count + product_count + inventory_count + shipment_count + subject_count;
END $$;
