-- ============================================================================
-- SALLY TSM - COMPREHENSIVE GLOBAL SAMPLE DATA
-- Realistic clinical trial supply management data with global presence
-- ============================================================================

-- Clear existing sample data (keep schema)
DELETE FROM gold_temperature_logs;
DELETE FROM gold_quality_events;
DELETE FROM gold_inventory;
DELETE FROM gold_shipment_items;
DELETE FROM gold_shipments;
DELETE FROM gold_subjects;
DELETE FROM gold_inventory_targets;
DELETE FROM gold_demand_forecast;
DELETE FROM gold_purchase_orders;
DELETE FROM gold_sites;
DELETE FROM gold_depots;
DELETE FROM gold_products;
DELETE FROM gold_vendors;
DELETE FROM gold_studies;
DELETE FROM rag_queries;

-- ============================================================================
-- STUDIES - Global Clinical Trials
-- ============================================================================
INSERT INTO gold_studies (study_id, study_name, phase, therapeutic_area, indication, 
    sponsor, start_date, planned_end_date, enrollment_target, current_enrollment, 
    study_status, protocol_version, blinding_type, randomization_ratio)
VALUES
-- Oncology Study - Global Phase III
('STUDY-001', 'ONCURA-301: Advanced NSCLC Immunotherapy Trial', 
    'Phase III', 'Oncology', 'Non-Small Cell Lung Cancer', 
    'Global Pharma Inc', '2024-01-15', '2026-12-31', 450, 287, 
    'Enrolling', 'v2.1', 'Double-Blind', '2:1'),

-- Cardiovascular Study - Multi-Region Phase II
('STUDY-002', 'CARDIOMAX-202: Heart Failure Novel Therapy', 
    'Phase II', 'Cardiovascular', 'Chronic Heart Failure', 
    'HeartCare Therapeutics', '2024-03-01', '2025-09-30', 280, 198, 
    'Enrolling', 'v1.5', 'Double-Blind', '1:1'),

-- Diabetes Study - Global Phase III
('STUDY-003', 'DIABSOLVE-305: Type 2 Diabetes Management', 
    'Phase III', 'Endocrinology', 'Type 2 Diabetes Mellitus', 
    'MetaHealth Research', '2023-09-01', '2026-03-31', 600, 412, 
    'Enrolling', 'v3.0', 'Open-Label', '1:1:1'),

-- Neurology Study - Phase II
('STUDY-004', 'NEUROSHIELD-201: Early Alzheimer Prevention', 
    'Phase II', 'Neurology', 'Alzheimers Disease', 
    'NeuroVance Labs', '2024-06-01', '2026-12-31', 350, 145, 
    'Enrolling', 'v1.2', 'Double-Blind', '1:1'),

-- Rare Disease - Phase II/III
('STUDY-005', 'RAREDX-203: Orphan Drug for Pompe Disease', 
    'Phase II/III', 'Rare Disease', 'Pompe Disease', 
    'OrphanMed Consortium', '2024-02-15', '2027-06-30', 120, 67, 
    'Enrolling', 'v1.0', 'Open-Label', '2:1');

-- ============================================================================
-- VENDORS - Global Manufacturing & Distribution Partners
-- ============================================================================
INSERT INTO gold_vendors (vendor_id, vendor_name, vendor_type, country, 
    quality_rating, certification_status, primary_contact, email)
VALUES
-- North America
('VENDOR-001', 'PharmaBio Manufacturing USA', 'Manufacturer', 'United States', 
    'A+', 'GMP Certified', 'John Smith', 'john.smith@pharmabio.com'),
('VENDOR-002', 'MedCold Logistics NA', 'Logistics Provider', 'Canada', 
    'A', 'GDP Certified', 'Sarah Johnson', 's.johnson@medcold.ca'),

-- Europe
('VENDOR-003', 'EuroPharma GmbH', 'Manufacturer', 'Germany', 
    'A+', 'GMP Certified', 'Hans Mueller', 'h.mueller@europharm.de'),
('VENDOR-004', 'UK BioSupply Ltd', 'Distributor', 'United Kingdom', 
    'A', 'GDP Certified', 'James Wilson', 'j.wilson@ukbiosupply.co.uk'),
('VENDOR-005', 'SwissMed Precision AG', 'Manufacturer', 'Switzerland', 
    'A+', 'GMP Certified', 'Marie Dubois', 'm.dubois@swissmed.ch'),

-- Asia-Pacific
('VENDOR-006', 'JapanPharma KK', 'Manufacturer', 'Japan', 
    'A', 'GMP Certified', 'Takeshi Yamamoto', 't.yamamoto@jpharma.jp'),
('VENDOR-007', 'SingaCore Logistics Pte Ltd', 'Logistics Provider', 'Singapore', 
    'A+', 'GDP Certified', 'Wei Chen', 'w.chen@singacore.sg'),
('VENDOR-008', 'AusMed Pharmaceuticals', 'Distributor', 'Australia', 
    'A', 'GDP Certified', 'Emma Thompson', 'e.thompson@ausmed.au'),

-- Latin America
('VENDOR-009', 'BrazilBio Industria', 'Manufacturer', 'Brazil', 
    'A', 'ANVISA Certified', 'Carlos Santos', 'c.santos@brazilbio.br'),

-- Middle East/Africa
('VENDOR-010', 'Gulf Pharma Supply LLC', 'Distributor', 'UAE', 
    'A', 'GDP Certified', 'Ahmed Al-Mansouri', 'a.almansouri@gulfpharma.ae');

-- ============================================================================
-- PRODUCTS - Investigational Medicinal Products
-- ============================================================================
INSERT INTO gold_products (product_id, product_name, product_code, therapeutic_area,
    dosage_form, strength, storage_temperature_min, storage_temperature_max,
    shelf_life_months, manufacturer_id, approval_status)
VALUES
-- STUDY-001 Products (Oncology)
('PROD-001', 'Oncology Drug A - Active', 'ONC-A-100', 'Oncology',
    'Injectable Solution', '100mg/vial', 2.0, 8.0, 24, 'VENDOR-001', 'IND Approved'),
('PROD-002', 'Placebo for Drug A', 'ONC-A-PBO', 'Oncology',
    'Injectable Solution', '0mg/vial', 2.0, 8.0, 24, 'VENDOR-001', 'IND Approved'),
('PROD-003', 'Comparator Chemo', 'ONC-COMP-50', 'Oncology',
    'Injectable Solution', '50mg/vial', 2.0, 8.0, 18, 'VENDOR-003', 'Approved'),

-- STUDY-002 Products (Cardiology)
('PROD-010', 'Cardio Drug B', 'CARD-B-25', 'Cardiovascular',
    'Tablet', '25mg', 15.0, 30.0, 36, 'VENDOR-003', 'IND Approved'),
('PROD-011', 'Placebo for Drug B', 'CARD-B-PBO', 'Cardiovascular',
    'Tablet', '0mg', 15.0, 30.0, 36, 'VENDOR-003', 'IND Approved'),

-- STUDY-003 Products (Diabetes)
('PROD-020', 'Diabetes Drug C - Low Dose', 'DIAB-C-5', 'Endocrinology',
    'Tablet', '5mg', 15.0, 25.0, 24, 'VENDOR-005', 'IND Approved'),
('PROD-021', 'Diabetes Drug C - Medium Dose', 'DIAB-C-10', 'Endocrinology',
    'Tablet', '10mg', 15.0, 25.0, 24, 'VENDOR-005', 'IND Approved'),
('PROD-022', 'Diabetes Drug C - High Dose', 'DIAB-C-20', 'Endocrinology',
    'Tablet', '20mg', 15.0, 25.0, 24, 'VENDOR-005', 'IND Approved'),

-- STUDY-004 Products (Neurology)
('PROD-030', 'NeuroShield Active', 'NEUR-N-150', 'Neurology',
    'Capsule', '150mg', 15.0, 25.0, 30, 'VENDOR-006', 'IND Approved'),
('PROD-031', 'NeuroShield Placebo', 'NEUR-N-PBO', 'Neurology',
    'Capsule', '0mg', 15.0, 25.0, 30, 'VENDOR-006', 'IND Approved'),

-- STUDY-005 Products (Rare Disease)
('PROD-040', 'RareDx Enzyme Replacement', 'RARE-E-200', 'Rare Disease',
    'IV Infusion', '200mg/50mL', 2.0, 8.0, 18, 'VENDOR-001', 'IND Approved'),
('PROD-041', 'RareDx Supportive Care', 'RARE-S-100', 'Rare Disease',
    'Tablet', '100mg', 15.0, 25.0, 24, 'VENDOR-005', 'Approved');

-- ============================================================================
-- DEPOTS - Global Distribution Centers
-- ============================================================================
INSERT INTO gold_depots (depot_id, depot_name, depot_type, country, region,
    address, city, postal_code, storage_capacity_units, current_inventory_units,
    temperature_controlled, quality_certification, contact_person, phone)
VALUES
-- North America (5 depots)
('DEPOT-US-01', 'USA East Coast Depot', 'Regional Distribution Center', 'United States', 'North America',
    '123 Pharma Drive', 'Philadelphia', '19102', 50000, 12500, true, 'GDP/GMP', 'Michael Chen', '+1-215-555-0101'),
('DEPOT-US-02', 'USA West Coast Depot', 'Regional Distribution Center', 'United States', 'North America',
    '456 Biotech Boulevard', 'San Francisco', '94105', 45000, 11000, true, 'GDP/GMP', 'Lisa Park', '+1-415-555-0102'),
('DEPOT-CA-01', 'Canada Central Depot', 'Regional Distribution Center', 'Canada', 'North America',
    '789 Medical Way', 'Toronto', 'M5H 2N2', 30000, 8500, true, 'GDP', 'David Wong', '+1-416-555-0103'),
('DEPOT-MX-01', 'Mexico City Depot', 'Regional Distribution Center', 'Mexico', 'Latin America',
    'Av. Reforma 123', 'Mexico City', '06600', 25000, 6200, true, 'COFEPRIS', 'Ana Garcia', '+52-55-5555-0104'),

-- Europe (6 depots)
('DEPOT-UK-01', 'UK London Depot', 'Regional Distribution Center', 'United Kingdom', 'Europe',
    '45 Clinical Trial Lane', 'London', 'W1A 1AA', 40000, 15000, true, 'GDP/MHRA', 'Oliver Smith', '+44-20-7555-0201'),
('DEPOT-DE-01', 'Germany Frankfurt Depot', 'Regional Distribution Center', 'Germany', 'Europe',
    'Pharmastraße 67', 'Frankfurt', '60311', 50000, 18500, true, 'GDP/GMP', 'Hans Schmidt', '+49-69-5555-0202'),
('DEPOT-FR-01', 'France Paris Depot', 'Regional Distribution Center', 'France', 'Europe',
    '89 Rue de la Santé', 'Paris', '75014', 35000, 9800, true, 'GDP/ANSM', 'Marie Dubois', '+33-1-5555-0203'),
('DEPOT-ES-01', 'Spain Barcelona Depot', 'Regional Distribution Center', 'Spain', 'Europe',
    'Calle Medicina 34', 'Barcelona', '08001', 28000, 7500, true, 'GDP/AEMPS', 'Carlos Rodriguez', '+34-93-555-0204'),
('DEPOT-NL-01', 'Netherlands Amsterdam Depot', 'Regional Distribution Center', 'Netherlands', 'Europe',
    'Gezondheidsstraat 56', 'Amsterdam', '1012 AB', 32000, 8900, true, 'GDP', 'Jan de Vries', '+31-20-555-0205'),
('DEPOT-PL-01', 'Poland Warsaw Depot', 'Regional Distribution Center', 'Poland', 'Europe',
    'ul. Medyczna 78', 'Warsaw', '00-001', 25000, 5600, true, 'GDP', 'Piotr Kowalski', '+48-22-555-0206'),

-- Asia-Pacific (5 depots)
('DEPOT-JP-01', 'Japan Tokyo Depot', 'Regional Distribution Center', 'Japan', 'Asia-Pacific',
    '1-2-3 Pharma-cho, Chiyoda-ku', 'Tokyo', '100-0001', 45000, 16000, true, 'GDP/PMDA', 'Takeshi Yamamoto', '+81-3-5555-0301'),
('DEPOT-SG-01', 'Singapore Depot', 'Regional Distribution Center', 'Singapore', 'Asia-Pacific',
    '123 Science Park Drive', 'Singapore', '118258', 38000, 12500, true, 'GDP/HSA', 'Wei Chen', '+65-6555-0302'),
('DEPOT-AU-01', 'Australia Sydney Depot', 'Regional Distribution Center', 'Australia', 'Asia-Pacific',
    '456 Clinical Drive', 'Sydney', '2000', 30000, 8800, true, 'GDP/TGA', 'Emma Wilson', '+61-2-5555-0303'),
('DEPOT-IN-01', 'India Mumbai Depot', 'Regional Distribution Center', 'India', 'Asia-Pacific',
    'Medical Complex, BKC', 'Mumbai', '400051', 35000, 9500, true, 'GDP/CDSCO', 'Raj Patel', '+91-22-5555-0304'),
('DEPOT-KR-01', 'South Korea Seoul Depot', 'Regional Distribution Center', 'South Korea', 'Asia-Pacific',
    '789 Pharma-ro, Gangnam-gu', 'Seoul', '06000', 32000, 10200, true, 'GDP/MFDS', 'Kim Min-jun', '+82-2-555-0305'),

-- Latin America (2 depots)
('DEPOT-BR-01', 'Brazil São Paulo Depot', 'Regional Distribution Center', 'Brazil', 'Latin America',
    'Av. Paulista 1000', 'São Paulo', '01310-100', 35000, 8900, true, 'GDP/ANVISA', 'Carlos Santos', '+55-11-5555-0401'),
('DEPOT-AR-01', 'Argentina Buenos Aires Depot', 'Regional Distribution Center', 'Argentina', 'Latin America',
    'Av. Corrientes 2345', 'Buenos Aires', 'C1046AAA', 22000, 5500, true, 'GDP/ANMAT', 'Maria Rodriguez', '+54-11-5555-0402'),

-- Middle East/Africa (2 depots)
('DEPOT-AE-01', 'UAE Dubai Depot', 'Regional Distribution Center', 'UAE', 'Middle East',
    'Dubai Healthcare City', 'Dubai', '00000', 30000, 7800, true, 'GDP/MOH', 'Ahmed Al-Mansouri', '+971-4-555-0501'),
('DEPOT-ZA-01', 'South Africa Johannesburg Depot', 'Regional Distribution Center', 'South Africa', 'Africa',
    '123 Medical Road, Sandton', 'Johannesburg', '2196', 25000, 6400, true, 'GDP/SAHPRA', 'Thabo Mbeki', '+27-11-555-0502');


-- ============================================================================
-- SITES - Global Clinical Trial Sites (80+ sites worldwide)
-- Designed to showcase: Uneven distribution, varying enrollment rates, 
-- inventory challenges, and need for supply chain optimization
-- ============================================================================

-- North America Sites (25 sites)
INSERT INTO gold_sites (site_id, site_number, site_name, study_id, country, region, city,
    site_status, enrollment_status, enrollment_target, current_enrollment,
    enrollment_rate_per_month, inventory_status, last_shipment_date, 
    primary_investigator, site_initiation_date)
VALUES
-- USA Sites (15 sites) - Mix of high performers and struggling sites
('SITE-US-001', '001', 'Memorial Sloan Kettering Cancer Center', 'STUDY-001', 'United States', 'North America', 'New York',
    'Active', 'Enrolling', 25, 18, 2.1, 'Adequate', '2024-11-15', 'Dr. Sarah Johnson', '2024-02-01'),
('SITE-US-002', '002', 'MD Anderson Cancer Center', 'STUDY-001', 'United States', 'North America', 'Houston',
    'Active', 'Enrolling', 30, 22, 2.5, 'Low', '2024-10-20', 'Dr. Michael Chen', '2024-01-20'),  -- LOW INVENTORY
('SITE-US-003', '003', 'Mayo Clinic - Rochester', 'STUDY-002', 'United States', 'North America', 'Rochester',
    'Active', 'Enrolling', 20, 14, 1.8, 'Adequate', '2024-11-25', 'Dr. Emily White', '2024-03-15'),
('SITE-US-004', '004', 'Cleveland Clinic', 'STUDY-002', 'United States', 'North America', 'Cleveland',
    'Active', 'Enrolling', 18, 16, 2.0, 'Critical', '2024-09-10', 'Dr. Robert Brown', '2024-03-01'),  -- CRITICAL - Stock out risk!
('SITE-US-005', '005', 'UCSF Medical Center', 'STUDY-003', 'United States', 'North America', 'San Francisco',
    'Active', 'Enrolling', 35, 28, 3.2, 'Adequate', '2024-11-20', 'Dr. Lisa Park', '2024-09-15'),
('SITE-US-006', '006', 'Johns Hopkins Hospital', 'STUDY-003', 'United States', 'North America', 'Baltimore',
    'Active', 'Enrolling', 30, 19, 2.3, 'Low', '2024-11-01', 'Dr. David Lee', '2024-09-01'),
('SITE-US-007', '007', 'Stanford Health Care', 'STUDY-004', 'United States', 'North America', 'Stanford',
    'Active', 'Enrolling', 22, 11, 1.5, 'Adequate', '2024-11-28', 'Dr. Jennifer Liu', '2024-06-10'),
('SITE-US-008', '008', 'Massachusetts General Hospital', 'STUDY-004', 'United States', 'North America', 'Boston',
    'Active', 'Screening', 20, 3, 0.5, 'Overstocked', '2024-11-30', 'Dr. Thomas Anderson', '2024-11-01'),  -- Just started, overstocked
('SITE-US-009', '009', 'UCLA Medical Center', 'STUDY-001', 'United States', 'North America', 'Los Angeles',
    'Active', 'Enrolling', 28, 21, 2.4, 'Low', '2024-10-05', 'Dr. Maria Garcia', '2024-02-15'),
('SITE-US-010', '010', 'Northwestern Medicine', 'STUDY-002', 'United States', 'North America', 'Chicago',
    'Active', 'Enrolling', 15, 9, 1.2, 'Adequate', '2024-11-18', 'Dr. James Wilson', '2024-03-20'),
('SITE-US-011', '011', 'Duke University Medical Center', 'STUDY-005', 'United States', 'North America', 'Durham',
    'Active', 'Enrolling', 8, 5, 0.8, 'Low', '2024-10-25', 'Dr. Patricia Moore', '2024-03-01'),  -- Rare disease, slower enrollment
('SITE-US-012', '012', 'University of Miami Health', 'STUDY-003', 'United States', 'North America', 'Miami',
    'Active', 'Enrolling', 25, 17, 2.0, 'Critical', '2024-08-30', 'Dr. Carlos Martinez', '2024-09-10'),  -- CRITICAL - Delayed shipment!
('SITE-US-013', '013', 'Seattle Cancer Care Alliance', 'STUDY-001', 'United States', 'North America', 'Seattle',
    'Active', 'Enrolling', 20, 13, 1.7, 'Adequate', '2024-11-22', 'Dr. Susan Kim', '2024-02-20'),
('SITE-US-014', '014', 'Emory University Hospital', 'STUDY-003', 'United States', 'North America', 'Atlanta',
    'Active', 'Enrolling', 30, 24, 2.6, 'Low', '2024-11-10', 'Dr. Richard Taylor', '2024-09-05'),
('SITE-US-015', '015', 'University of Pennsylvania', 'STUDY-002', 'United States', 'North America', 'Philadelphia',
    'Active', 'Enrolling', 18, 12, 1.5, 'Adequate', '2024-11-27', 'Dr. Amanda Foster', '2024-03-10'),

-- Canada Sites (5 sites)
('SITE-CA-001', '101', 'Princess Margaret Cancer Centre', 'STUDY-001', 'Canada', 'North America', 'Toronto',
    'Active', 'Enrolling', 22, 15, 1.9, 'Adequate', '2024-11-20', 'Dr. David Wong', '2024-02-10'),
('SITE-CA-002', '102', 'Vancouver General Hospital', 'STUDY-002', 'Canada', 'North America', 'Vancouver',
    'Active', 'Enrolling', 16, 10, 1.3, 'Low', '2024-10-15', 'Dr. Catherine Lee', '2024-03-25'),
('SITE-CA-003', '103', 'Montreal Heart Institute', 'STUDY-002', 'Canada', 'North America', 'Montreal',
    'Active', 'Enrolling', 18, 13, 1.6, 'Adequate', '2024-11-23', 'Dr. Jean Dubois', '2024-03-15'),
('SITE-CA-004', '104', 'University of Alberta Hospital', 'STUDY-003', 'Canada', 'North America', 'Edmonton',
    'Active', 'Enrolling', 20, 14, 1.7, 'Low', '2024-11-05', 'Dr. Robert Singh', '2024-09-20'),
('SITE-CA-005', '105', 'McGill University Health Centre', 'STUDY-004', 'Canada', 'North America', 'Montreal',
    'Active', 'Screening', 15, 2, 0.3, 'Adequate', '2024-11-28', 'Dr. Sophie Martin', '2024-10-15'),

-- Mexico Sites (3 sites)
('SITE-MX-001', '201', 'Instituto Nacional de Cancerología', 'STUDY-001', 'Mexico', 'Latin America', 'Mexico City',
    'Active', 'Enrolling', 18, 11, 1.4, 'Adequate', '2024-11-12', 'Dr. Ana Garcia', '2024-02-25'),
('SITE-MX-002', '202', 'Hospital Angeles Mexico', 'STUDY-003', 'Mexico', 'Latin America', 'Mexico City',
    'Active', 'Enrolling', 22, 16, 1.9, 'Low', '2024-10-28', 'Dr. Carlos Hernandez', '2024-09-15'),
('SITE-MX-003', '203', 'TecSalud - Hospital Zambrano', 'STUDY-002', 'Mexico', 'Latin America', 'Monterrey',
    'Active', 'Enrolling', 14, 8, 1.0, 'Critical', '2024-09-20', 'Dr. Maria Rodriguez', '2024-03-30'),  -- CRITICAL

-- Europe Sites (25 sites)
-- UK Sites (5 sites)
('SITE-UK-001', '301', 'The Royal Marsden NHS Foundation Trust', 'STUDY-001', 'United Kingdom', 'Europe', 'London',
    'Active', 'Enrolling', 24, 17, 2.0, 'Adequate', '2024-11-21', 'Dr. Oliver Smith', '2024-02-05'),
('SITE-UK-002', '302', 'Imperial College Healthcare NHS Trust', 'STUDY-002', 'United Kingdom', 'Europe', 'London',
    'Active', 'Enrolling', 19, 14, 1.7, 'Low', '2024-10-30', 'Dr. Emma Thompson', '2024-03-12'),
('SITE-UK-003', '303', 'Guy and St Thomas NHS Trust', 'STUDY-003', 'United Kingdom', 'Europe', 'London',
    'Active', 'Enrolling', 28, 21, 2.4, 'Adequate', '2024-11-19', 'Dr. James Wilson', '2024-09-08'),
('SITE-UK-004', '304', 'Oxford University Hospitals', 'STUDY-004', 'United Kingdom', 'Europe', 'Oxford',
    'Active', 'Enrolling', 16, 7, 0.9, 'Low', '2024-11-15', 'Dr. Sarah Brown', '2024-06-20'),
('SITE-UK-005', '305', 'Edinburgh Royal Infirmary', 'STUDY-005', 'United Kingdom', 'Europe', 'Edinburgh',
    'Active', 'Enrolling', 6, 3, 0.5, 'Adequate', '2024-11-25', 'Dr. Andrew MacLeod', '2024-03-15'),

-- Germany Sites (5 sites) - HIGH PERFORMING
('SITE-DE-001', '311', 'Charité - Universitätsmedizin Berlin', 'STUDY-001', 'Germany', 'Europe', 'Berlin',
    'Active', 'Enrolling', 26, 20, 2.3, 'Adequate', '2024-11-24', 'Dr. Hans Mueller', '2024-02-08'),
('SITE-DE-002', '312', 'Universitätsklinikum Frankfurt', 'STUDY-002', 'Germany', 'Europe', 'Frankfurt',
    'Active', 'Enrolling', 20, 16, 2.0, 'Adequate', '2024-11-22', 'Dr. Klaus Schmidt', '2024-03-05'),
('SITE-DE-003', '313', 'Klinikum der Universität München', 'STUDY-003', 'Germany', 'Europe', 'Munich',
    'Active', 'Enrolling', 32, 27, 3.0, 'Low', '2024-11-08', 'Dr. Petra Wagner', '2024-09-12'),  -- High enrollment but LOW stock
('SITE-DE-004', '314', 'Universitätsklinikum Heidelberg', 'STUDY-004', 'Germany', 'Europe', 'Heidelberg',
    'Active', 'Enrolling', 18, 9, 1.2, 'Adequate', '2024-11-26', 'Dr. Wolfgang Becker', '2024-06-15'),
('SITE-DE-005', '315', 'Universitätsklinikum Hamburg', 'STUDY-001', 'Germany', 'Europe', 'Hamburg',
    'Active', 'Enrolling', 22, 16, 1.9, 'Adequate', '2024-11-20', 'Dr. Anna Fischer', '2024-02-12'),

-- France Sites (4 sites)
('SITE-FR-001', '321', 'Institut Gustave Roussy', 'STUDY-001', 'France', 'Europe', 'Paris',
    'Active', 'Enrolling', 24, 18, 2.1, 'Low', '2024-10-18', 'Dr. Marie Dubois', '2024-02-15'),
('SITE-FR-002', '322', 'Hôpital Européen Georges-Pompidou', 'STUDY-002', 'France', 'Europe', 'Paris',
    'Active', 'Enrolling', 17, 12, 1.5, 'Adequate', '2024-11-23', 'Dr. Pierre Martin', '2024-03-18'),
('SITE-FR-003', '323', 'CHU de Lyon', 'STUDY-003', 'France', 'Europe', 'Lyon',
    'Active', 'Enrolling', 25, 19, 2.2, 'Adequate', '2024-11-17', 'Dr. Sophie Bernard', '2024-09-10'),
('SITE-FR-004', '324', 'CHU de Toulouse', 'STUDY-004', 'France', 'Europe', 'Toulouse',
    'Active', 'Enrolling', 14, 6, 0.8, 'Low', '2024-11-14', 'Dr. Laurent Petit', '2024-06-25'),

-- Spain, Italy, Netherlands, Poland (11 sites total)
('SITE-ES-001', '331', 'Hospital Clínic Barcelona', 'STUDY-001', 'Spain', 'Europe', 'Barcelona',
    'Active', 'Enrolling', 20, 14, 1.7, 'Adequate', '2024-11-21', 'Dr. Carlos Rodriguez', '2024-02-20'),
('SITE-ES-002', '332', 'Hospital Universitario Madrid', 'STUDY-003', 'Spain', 'Europe', 'Madrid',
    'Active', 'Enrolling', 26, 20, 2.3, 'Low', '2024-10-22', 'Dr. Isabel Martinez', '2024-09-18'),
('SITE-IT-001', '341', 'Istituto Europeo di Oncologia', 'STUDY-001', 'Italy', 'Europe', 'Milan',
    'Active', 'Enrolling', 22, 15, 1.8, 'Adequate', '2024-11-19', 'Dr. Giovanni Rossi', '2024-02-22'),
('SITE-IT-002', '342', 'Policlinico Gemelli', 'STUDY-002', 'Italy', 'Europe', 'Rome',
    'Active', 'Enrolling', 18, 13, 1.6, 'Adequate', '2024-11-24', 'Dr. Marco Ferrari', '2024-03-14'),
('SITE-NL-001', '351', 'Amsterdam UMC', 'STUDY-001', 'Netherlands', 'Europe', 'Amsterdam',
    'Active', 'Enrolling', 20, 14, 1.7, 'Low', '2024-11-10', 'Dr. Jan de Vries', '2024-02-18'),
('SITE-NL-002', '352', 'Erasmus MC Rotterdam', 'STUDY-003', 'Netherlands', 'Europe', 'Rotterdam',
    'Active', 'Enrolling', 24, 18, 2.1, 'Adequate', '2024-11-22', 'Dr. Pieter van Dam', '2024-09-14'),
('SITE-PL-001', '361', 'Maria Sklodowska-Curie Institute', 'STUDY-001', 'Poland', 'Europe', 'Warsaw',
    'Active', 'Enrolling', 18, 11, 1.4, 'Adequate', '2024-11-16', 'Dr. Piotr Kowalski', '2024-02-25'),

-- Asia-Pacific Sites (20 sites)
-- Japan Sites (5 sites) - HIGH QUALITY
('SITE-JP-001', '401', 'National Cancer Center Hospital', 'STUDY-001', 'Japan', 'Asia-Pacific', 'Tokyo',
    'Active', 'Enrolling', 24, 19, 2.2, 'Adequate', '2024-11-23', 'Dr. Takeshi Yamamoto', '2024-02-10'),
('SITE-JP-002', '402', 'University of Tokyo Hospital', 'STUDY-002', 'Japan', 'Asia-Pacific', 'Tokyo',
    'Active', 'Enrolling', 18, 14, 1.7, 'Adequate', '2024-11-21', 'Dr. Yuki Tanaka', '2024-03-08'),
('SITE-JP-003', '403', 'Osaka University Hospital', 'STUDY-003', 'Japan', 'Asia-Pacific', 'Osaka',
    'Active', 'Enrolling', 28, 22, 2.5, 'Low', '2024-11-06', 'Dr. Hiroshi Sato', '2024-09-15'),
('SITE-JP-004', '404', 'Kyoto University Hospital', 'STUDY-004', 'Japan', 'Asia-Pacific', 'Kyoto',
    'Active', 'Enrolling', 16, 8, 1.0, 'Adequate', '2024-11-25', 'Dr. Kenji Nakamura', '2024-06-18'),
('SITE-JP-005', '405', 'National Cerebral and Cardiovascular Center', 'STUDY-002', 'Japan', 'Asia-Pacific', 'Osaka',
    'Active', 'Enrolling', 17, 12, 1.5, 'Adequate', '2024-11-22', 'Dr. Akiko Suzuki', '2024-03-12'),

-- China Sites (4 sites)
('SITE-CN-001', '411', 'Peking Union Medical College Hospital', 'STUDY-001', 'China', 'Asia-Pacific', 'Beijing',
    'Active', 'Enrolling', 30, 24, 2.7, 'Adequate', '2024-11-18', 'Dr. Li Wei', '2024-02-15'),
('SITE-CN-002', '412', 'Fudan University Cancer Hospital', 'STUDY-001', 'China', 'Asia-Pacific', 'Shanghai',
    'Active', 'Enrolling', 28, 21, 2.4, 'Low', '2024-10-25', 'Dr. Zhang Ming', '2024-02-18'),
('SITE-CN-003', '413', 'West China Hospital', 'STUDY-003', 'China', 'Asia-Pacific', 'Chengdu',
    'Active', 'Enrolling', 32, 26, 2.9, 'Adequate', '2024-11-15', 'Dr. Wang Fang', '2024-09-12'),
('SITE-CN-004', '414', 'The First Hospital of China Medical University', 'STUDY-002', 'China', 'Asia-Pacific', 'Shenyang',
    'Active', 'Enrolling', 20, 15, 1.8, 'Low', '2024-11-08', 'Dr. Liu Jian', '2024-03-20'),

-- India Sites (4 sites) - FAST GROWING
('SITE-IN-001', '421', 'Tata Memorial Hospital', 'STUDY-001', 'India', 'Asia-Pacific', 'Mumbai',
    'Active', 'Enrolling', 26, 19, 2.2, 'Critical', '2024-09-15', 'Dr. Raj Patel', '2024-02-20'),  -- CRITICAL - Supply issues
('SITE-IN-002', '422', 'All India Institute of Medical Sciences', 'STUDY-003', 'India', 'Asia-Pacific', 'New Delhi',
    'Active', 'Enrolling', 35, 29, 3.3, 'Low', '2024-11-01', 'Dr. Priya Sharma', '2024-09-10'),  -- High enrollment, need more supply
('SITE-IN-003', '423', 'Christian Medical College', 'STUDY-002', 'India', 'Asia-Pacific', 'Vellore',
    'Active', 'Enrolling', 22, 16, 1.9, 'Adequate', '2024-11-20', 'Dr. Arun Kumar', '2024-03-15'),
('SITE-IN-004', '424', 'Apollo Hospitals', 'STUDY-004', 'India', 'Asia-Pacific', 'Bangalore',
    'Active', 'Enrolling', 18, 9, 1.1, 'Adequate', '2024-11-24', 'Dr. Kavita Reddy', '2024-06-22'),

-- Australia, Singapore, South Korea (7 sites)
('SITE-AU-001', '431', 'Peter MacCallum Cancer Centre', 'STUDY-001', 'Australia', 'Asia-Pacific', 'Melbourne',
    'Active', 'Enrolling', 22, 15, 1.8, 'Adequate', '2024-11-22', 'Dr. Emma Wilson', '2024-02-25'),
('SITE-AU-002', '432', 'Royal Prince Alfred Hospital', 'STUDY-002', 'Australia', 'Asia-Pacific', 'Sydney',
    'Active', 'Enrolling', 18, 12, 1.5, 'Low', '2024-11-16', 'Dr. James Mitchell', '2024-03-18'),
('SITE-AU-003', '433', 'Princess Alexandra Hospital', 'STUDY-003', 'Australia', 'Asia-Pacific', 'Brisbane',
    'Active', 'Enrolling', 24, 18, 2.1, 'Adequate', '2024-11-19', 'Dr. Sarah Campbell', '2024-09-16'),
('SITE-SG-001', '441', 'National University Hospital', 'STUDY-001', 'Singapore', 'Asia-Pacific', 'Singapore',
    'Active', 'Enrolling', 20, 15, 1.8, 'Adequate', '2024-11-23', 'Dr. Wei Chen', '2024-02-12'),
('SITE-SG-002', '442', 'Singapore General Hospital', 'STUDY-003', 'Singapore', 'Asia-Pacific', 'Singapore',
    'Active', 'Enrolling', 26, 20, 2.3, 'Adequate', '2024-11-20', 'Dr. Tan Li Ming', '2024-09-14'),
('SITE-KR-001', '451', 'Seoul National University Hospital', 'STUDY-001', 'South Korea', 'Asia-Pacific', 'Seoul',
    'Active', 'Enrolling', 24, 17, 2.0, 'Low', '2024-11-12', 'Dr. Kim Min-jun', '2024-02-22'),
('SITE-KR-002', '452', 'Samsung Medical Center', 'STUDY-002', 'South Korea', 'Asia-Pacific', 'Seoul',
    'Active', 'Enrolling', 19, 14, 1.7, 'Adequate', '2024-11-21', 'Dr. Lee Soo-jin', '2024-03-16'),

-- Latin America Sites (6 sites)
('SITE-BR-001', '501', 'Hospital Sírio-Libanês', 'STUDY-001', 'Brazil', 'Latin America', 'São Paulo',
    'Active', 'Enrolling', 22, 15, 1.8, 'Low', '2024-10-20', 'Dr. Carlos Santos', '2024-02-28'),
('SITE-BR-002', '502', 'Instituto Nacional de Câncer', 'STUDY-001', 'Brazil', 'Latin America', 'Rio de Janeiro',
    'Active', 'Enrolling', 20, 13, 1.6, 'Critical', '2024-09-05', 'Dr. Ana Silva', '2024-02-25'),  -- CRITICAL - Long distance
('SITE-BR-003', '503', 'Hospital Israelita Albert Einstein', 'STUDY-003', 'Brazil', 'Latin America', 'São Paulo',
    'Active', 'Enrolling', 28, 21, 2.4, 'Adequate', '2024-11-18', 'Dr. Ricardo Oliveira', '2024-09-12'),
('SITE-AR-001', '511', 'Hospital Italiano de Buenos Aires', 'STUDY-001', 'Argentina', 'Latin America', 'Buenos Aires',
    'Active', 'Enrolling', 18, 11, 1.4, 'Low', '2024-11-14', 'Dr. Maria Rodriguez', '2024-02-28'),
('SITE-AR-002', '512', 'Hospital de Clínicas', 'STUDY-002', 'Argentina', 'Latin America', 'Buenos Aires',
    'Active', 'Enrolling', 16, 10, 1.2, 'Adequate', '2024-11-20', 'Dr. Jorge Fernandez', '2024-03-22'),
('SITE-CL-001', '521', 'Clínica Las Condes', 'STUDY-003', 'Chile', 'Latin America', 'Santiago',
    'Active', 'Enrolling', 20, 14, 1.7, 'Adequate', '2024-11-22', 'Dr. Patricia Gonzalez', '2024-09-18'),

-- Middle East & Africa Sites (7 sites)
('SITE-AE-001', '601', 'Cleveland Clinic Abu Dhabi', 'STUDY-002', 'UAE', 'Middle East', 'Abu Dhabi',
    'Active', 'Enrolling', 17, 11, 1.4, 'Adequate', '2024-11-23', 'Dr. Ahmed Al-Mansouri', '2024-03-10'),
('SITE-AE-002', '602', 'Dubai Healthcare City - Mediclinic', 'STUDY-003', 'UAE', 'Middle East', 'Dubai',
    'Active', 'Enrolling', 22, 16, 1.9, 'Low', '2024-11-15', 'Dr. Fatima Hassan', '2024-09-15'),
('SITE-IL-001', '611', 'Sheba Medical Center', 'STUDY-001', 'Israel', 'Middle East', 'Tel Aviv',
    'Active', 'Enrolling', 20, 14, 1.7, 'Adequate', '2024-11-21', 'Dr. David Cohen', '2024-02-18'),
('SITE-IL-002', '612', 'Hadassah Medical Center', 'STUDY-004', 'Israel', 'Middle East', 'Jerusalem',
    'Active', 'Enrolling', 15, 7, 0.9, 'Adequate', '2024-11-24', 'Dr. Rachel Levy', '2024-06-20'),
('SITE-ZA-001', '621', 'Groote Schuur Hospital', 'STUDY-001', 'South Africa', 'Africa', 'Cape Town',
    'Active', 'Enrolling', 18, 11, 1.4, 'Low', '2024-10-30', 'Dr. Thabo Mbeki', '2024-02-28'),
('SITE-ZA-002', '622', 'Charlotte Maxeke Hospital', 'STUDY-003', 'South Africa', 'Africa', 'Johannesburg',
    'Active', 'Enrolling', 24, 17, 2.0, 'Adequate', '2024-11-17', 'Dr. Nomsa Dlamini', '2024-09-20'),
('SITE-ZA-003', '623', 'Steve Biko Academic Hospital', 'STUDY-002', 'South Africa', 'Africa', 'Pretoria',
    'Active', 'Enrolling', 16, 9, 1.1, 'Low', '2024-11-12', 'Dr. Sipho Nkosi', '2024-03-25');


-- ============================================================================
-- INVENTORY - Global Site Inventory (250+ records)
-- Designed to showcase: Low stock alerts, expiring products, imbalanced 
-- distribution, overstocking, and need for predictive analytics
-- IMPORTANT: Using fixed dates and calculating days_until_expiry as INTEGER
-- to avoid database deployment issues
-- ============================================================================

-- Helper: Current reference date for calculations: 2024-12-02
-- Expiry calculations: days_until_expiry = (expiry_date - '2024-12-02')::INTEGER

INSERT INTO gold_inventory (site_id, product_id, batch_number, quantity_on_hand, 
    quantity_allocated, quantity_available, expiry_date, days_until_expiry, 
    receipt_date, storage_location, temperature_status, quarantine_status, 
    last_temperature_check, notes)
VALUES
-- CRITICAL INVENTORY SITUATIONS (Sites needing immediate attention)
-- SITE-US-004 (Cleveland Clinic) - CRITICAL LOW
('SITE-US-004', 'PROD-010', 'BATCH-CARD-2024-003', 8, 6, 2, '2025-06-30', 210, '2024-09-15', 'Pharmacy-A-Shelf-12', 'Normal', false, '2024-12-01', 'CRITICAL: Only 2 units available, high enrollment site'),
('SITE-US-004', 'PROD-011', 'BATCH-CARD-P-2024-002', 6, 5, 1, '2025-06-30', 210, '2024-09-15', 'Pharmacy-A-Shelf-13', 'Normal', false, '2024-12-01', 'CRITICAL: Only 1 placebo unit available'),

-- SITE-US-012 (Miami) - CRITICAL, Shipment delayed
('SITE-US-012', 'PROD-020', 'BATCH-DIAB-2024-007', 12, 10, 2, '2025-04-30', 149, '2024-08-20', 'Storage-Room-B', 'Normal', false, '2024-12-01', 'CRITICAL: Shipment delayed 65 days, enrollment continuing'),
('SITE-US-012', 'PROD-021', 'BATCH-DIAB-2024-008', 10, 8, 2, '2025-04-30', 149, '2024-08-20', 'Storage-Room-B', 'Normal', false, '2024-12-01', 'CRITICAL: Low stock, need emergency replenishment'),

-- SITE-IN-001 (Mumbai) - CRITICAL, High enrollment
('SITE-IN-001', 'PROD-001', 'BATCH-ONC-2024-011', 15, 12, 3, '2025-08-31', 272, '2024-08-25', 'Cold-Storage-Unit-1', 'Normal', false, '2024-12-01', 'CRITICAL: High enrollment rate 2.2/month, need restock'),
('SITE-IN-001', 'PROD-002', 'BATCH-ONC-P-2024-006', 10, 8, 2, '2025-08-31', 272, '2024-08-25', 'Cold-Storage-Unit-1', 'Normal', false, '2024-12-01', 'CRITICAL: Placebo running low'),

-- SITE-BR-002 (Rio) - CRITICAL, Remote location
('SITE-BR-002', 'PROD-001', 'BATCH-ONC-2024-009', 18, 15, 3, '2025-07-31', 241, '2024-08-05', 'Refrigerator-Main', 'Normal', false, '2024-12-01', 'CRITICAL: Remote site, long lead time for shipments'),
('SITE-BR-002', 'PROD-002', 'BATCH-ONC-P-2024-005', 12, 10, 2, '2025-07-31', 241, '2024-08-05', 'Refrigerator-Main', 'Normal', false, '2024-12-01', 'CRITICAL: Stock-out risk within 2 weeks'),

-- SITE-MX-003 (Monterrey) - CRITICAL
('SITE-MX-003', 'PROD-010', 'BATCH-CARD-2024-004', 7, 6, 1, '2025-06-30', 210, '2024-09-10', 'Main-Pharmacy', 'Normal', false, '2024-12-01', 'CRITICAL: Last unit, emergency order placed'),

-- LOW INVENTORY SITES (Warning level - need replenishment soon)
-- SITE-US-002 (MD Anderson) - LOW, high enrollment
('SITE-US-002', 'PROD-001', 'BATCH-ONC-2024-001', 25, 18, 7, '2026-01-31', 425, '2024-10-15', 'Cold-Room-1', 'Normal', false, '2024-12-01', 'LOW: High enrollment site, reorder soon'),
('SITE-US-002', 'PROD-002', 'BATCH-ONC-P-2024-001', 20, 15, 5, '2026-01-31', 425, '2024-10-15', 'Cold-Room-1', 'Normal', false, '2024-12-01', 'LOW: Monitor closely'),
('SITE-US-002', 'PROD-003', 'BATCH-ONC-C-2024-001', 18, 14, 4, '2025-10-31', 333, '2024-10-15', 'Cold-Room-2', 'Normal', false, '2024-12-01', 'LOW: Comparator running low'),

-- SITE-US-006 (Johns Hopkins) - LOW
('SITE-US-006', 'PROD-020', 'BATCH-DIAB-2024-005', 22, 16, 6, '2025-09-30', 302, '2024-10-25', 'Pharmacy-Shelf-A5', 'Normal', false, '2024-12-01', 'LOW: Reorder point reached'),
('SITE-US-006', 'PROD-021', 'BATCH-DIAB-2024-006', 18, 14, 4, '2025-09-30', 302, '2024-10-25', 'Pharmacy-Shelf-A6', 'Normal', false, '2024-12-01', 'LOW: Need replenishment'),
('SITE-US-006', 'PROD-022', 'BATCH-DIAB-2024-007', 16, 12, 4, '2025-09-30', 302, '2024-10-25', 'Pharmacy-Shelf-A7', 'Normal', false, '2024-12-01', 'LOW: 3-dose regimen site'),

-- SITE-US-009 (UCLA) - LOW
('SITE-US-009', 'PROD-001', 'BATCH-ONC-2024-002', 28, 20, 8, '2026-02-28', 453, '2024-09-28', 'Cold-Storage-Main', 'Normal', false, '2024-12-01', 'LOW: Good enrollment, need more stock'),
('SITE-US-009', 'PROD-002', 'BATCH-ONC-P-2024-002', 22, 16, 6, '2026-02-28', 453, '2024-09-28', 'Cold-Storage-Main', 'Normal', false, '2024-12-01', 'LOW: Reorder scheduled'),

-- SITE-US-011 (Duke) - LOW, Rare disease
('SITE-US-011', 'PROD-040', 'BATCH-RARE-2024-001', 14, 10, 4, '2025-12-31', 394, '2024-10-15', 'Secure-Cold-Unit', 'Normal', false, '2024-12-01', 'LOW: Expensive rare disease drug, need precise forecasting'),
('SITE-US-011', 'PROD-041', 'BATCH-RARE-S-2024-001', 18, 12, 6, '2026-06-30', 575, '2024-10-15', 'Pharmacy-A', 'Normal', false, '2024-12-01', 'LOW: Supportive care'),

-- SITE-US-014 (Emory) - LOW
('SITE-US-014', 'PROD-020', 'BATCH-DIAB-2024-009', 20, 15, 5, '2025-11-30', 363, '2024-10-28', 'Storage-B12', 'Normal', false, '2024-12-01', 'LOW: High enrollment, need more'),
('SITE-US-014', 'PROD-021', 'BATCH-DIAB-2024-010', 18, 14, 4, '2025-11-30', 363, '2024-10-28', 'Storage-B13', 'Normal', false, '2024-12-01', 'LOW: Reorder threshold'),
('SITE-US-014', 'PROD-022', 'BATCH-DIAB-2024-011', 16, 12, 4, '2025-11-30', 363, '2024-10-28', 'Storage-B14', 'Normal', false, '2024-12-01', 'LOW: Monitor weekly'),

-- Canada Sites - LOW
('SITE-CA-002', 'PROD-010', 'BATCH-CARD-2024-005', 12, 9, 3, '2025-07-31', 241, '2024-10-10', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'LOW: Vancouver site needs restock'),
('SITE-CA-002', 'PROD-011', 'BATCH-CARD-P-2024-003', 10, 7, 3, '2025-07-31', 241, '2024-10-10', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'LOW: Placebo supply'),

('SITE-CA-004', 'PROD-020', 'BATCH-DIAB-2024-012', 16, 12, 4, '2025-10-31', 333, '2024-10-20', 'Storage-Unit-3', 'Normal', false, '2024-12-01', 'LOW: Edmonton winter weather may delay shipments'),

-- Mexico Sites - LOW
('SITE-MX-002', 'PROD-020', 'BATCH-DIAB-2024-013', 18, 14, 4, '2025-08-31', 272, '2024-10-15', 'Bodega-Principal', 'Normal', false, '2024-12-01', 'LOW: Mexico City site'),
('SITE-MX-002', 'PROD-021', 'BATCH-DIAB-2024-014', 15, 11, 4, '2025-08-31', 272, '2024-10-15', 'Bodega-Principal', 'Normal', false, '2024-12-01', 'LOW: Need replenishment'),

-- Europe Sites - LOW
('SITE-UK-002', 'PROD-010', 'BATCH-CARD-2024-006', 14, 10, 4, '2025-08-31', 272, '2024-10-25', 'Pharmacy-Store-A', 'Normal', false, '2024-12-01', 'LOW: Imperial College'),
('SITE-UK-002', 'PROD-011', 'BATCH-CARD-P-2024-004', 12, 9, 3, '2025-08-31', 272, '2024-10-25', 'Pharmacy-Store-A', 'Normal', false, '2024-12-01', 'LOW: London traffic may delay'),

('SITE-UK-004', 'PROD-030', 'BATCH-NEUR-2024-001', 10, 7, 3, '2025-12-31', 394, '2024-11-10', 'Secure-Storage', 'Normal', false, '2024-12-01', 'LOW: Oxford neurology trial'),
('SITE-UK-004', 'PROD-031', 'BATCH-NEUR-P-2024-001', 8, 6, 2, '2025-12-31', 394, '2024-11-10', 'Secure-Storage', 'Normal', false, '2024-12-01', 'LOW: Placebo low'),

('SITE-DE-003', 'PROD-020', 'BATCH-DIAB-2024-015', 24, 20, 4, '2025-09-30', 302, '2024-10-28', 'Lager-Raum-1', 'Normal', false, '2024-12-01', 'LOW: Munich high enrollment 3.0/month'),
('SITE-DE-003', 'PROD-021', 'BATCH-DIAB-2024-016', 20, 16, 4, '2025-09-30', 302, '2024-10-28', 'Lager-Raum-1', 'Normal', false, '2024-12-01', 'LOW: Need emergency shipment'),
('SITE-DE-003', 'PROD-022', 'BATCH-DIAB-2024-017', 18, 14, 4, '2025-09-30', 302, '2024-10-28', 'Lager-Raum-1', 'Normal', false, '2024-12-01', 'LOW: 3-arm study'),

('SITE-FR-001', 'PROD-001', 'BATCH-ONC-2024-012', 20, 15, 5, '2025-10-31', 333, '2024-10-10', 'Chambre-Froide-1', 'Normal', false, '2024-12-01', 'LOW: Institut Gustave Roussy'),
('SITE-FR-001', 'PROD-002', 'BATCH-ONC-P-2024-007', 16, 12, 4, '2025-10-31', 333, '2024-10-10', 'Chambre-Froide-1', 'Normal', false, '2024-12-01', 'LOW: Paris site'),

('SITE-FR-004', 'PROD-030', 'BATCH-NEUR-2024-002', 9, 6, 3, '2026-01-31', 425, '2024-11-08', 'Pharmacie-Centrale', 'Normal', false, '2024-12-01', 'LOW: Toulouse site'),

('SITE-ES-002', 'PROD-020', 'BATCH-DIAB-2024-018', 20, 16, 4, '2025-08-31', 272, '2024-10-18', 'Almacén-A', 'Normal', false, '2024-12-01', 'LOW: Madrid site'),

('SITE-NL-001', 'PROD-001', 'BATCH-ONC-2024-013', 18, 14, 4, '2025-11-30', 363, '2024-11-05', 'Koel-Opslag-1', 'Normal', false, '2024-12-01', 'LOW: Amsterdam UMC'),

-- Asia Sites - LOW
('SITE-JP-003', 'PROD-020', 'BATCH-DIAB-2024-019', 22, 18, 4, '2025-10-31', 333, '2024-11-01', '冷蔵庫-1', 'Normal', false, '2024-12-01', 'LOW: Osaka high enrollment'),
('SITE-JP-003', 'PROD-021', 'BATCH-DIAB-2024-020', 19, 15, 4, '2025-10-31', 333, '2024-11-01', '冷蔵庫-1', 'Normal', false, '2024-12-01', 'LOW: 2.5/month enrollment'),

('SITE-CN-002', 'PROD-001', 'BATCH-ONC-2024-014', 26, 20, 6, '2025-12-31', 394, '2024-10-20', '冷库-A', 'Normal', false, '2024-12-01', 'LOW: Shanghai Cancer Hospital'),

('SITE-CN-004', 'PROD-010', 'BATCH-CARD-2024-007', 15, 11, 4, '2025-09-30', 302, '2024-11-03', '药房-1', 'Normal', false, '2024-12-01', 'LOW: Shenyang site'),

('SITE-IN-002', 'PROD-020', 'BATCH-DIAB-2024-021', 28, 24, 4, '2025-07-31', 241, '2024-10-25', 'Cold-Store-Main', 'Normal', false, '2024-12-01', 'LOW: AIIMS Delhi - VERY high enrollment 3.3/month!'),
('SITE-IN-002', 'PROD-021', 'BATCH-DIAB-2024-022', 25, 21, 4, '2025-07-31', 241, '2024-10-25', 'Cold-Store-Main', 'Normal', false, '2024-12-01', 'LOW: Need urgent resupply'),
('SITE-IN-002', 'PROD-022', 'BATCH-DIAB-2024-023', 22, 18, 4, '2025-07-31', 241, '2024-10-25', 'Cold-Store-Main', 'Normal', false, '2024-12-01', 'LOW: Fast-growing site'),

('SITE-AU-002', 'PROD-010', 'BATCH-CARD-2024-008', 13, 9, 4, '2025-10-31', 333, '2024-11-10', 'Pharmacy-A', 'Normal', false, '2024-12-01', 'LOW: Sydney RPA'),

('SITE-KR-001', 'PROD-001', 'BATCH-ONC-2024-015', 19, 14, 5, '2026-01-31', 425, '2024-11-08', '냉장보관실', 'Normal', false, '2024-12-01', 'LOW: Seoul National University'),

-- Latin America - LOW
('SITE-BR-001', 'PROD-001', 'BATCH-ONC-2024-016', 20, 15, 5, '2025-09-30', 302, '2024-10-15', 'Refrigerador-Principal', 'Normal', false, '2024-12-01', 'LOW: São Paulo Sírio-Libanês'),

('SITE-AR-001', 'PROD-001', 'BATCH-ONC-2024-017', 16, 12, 4, '2025-10-31', 333, '2024-11-10', 'Deposito-Frio', 'Normal', false, '2024-12-01', 'LOW: Buenos Aires'),

-- Middle East/Africa - LOW
('SITE-AE-002', 'PROD-020', 'BATCH-DIAB-2024-024', 18, 14, 4, '2025-11-30', 363, '2024-11-10', 'Storage-Unit-A', 'Normal', false, '2024-12-01', 'LOW: Dubai Healthcare City'),

('SITE-ZA-001', 'PROD-001', 'BATCH-ONC-2024-018', 15, 11, 4, '2025-08-31', 272, '2024-10-25', 'Cold-Room-1', 'Normal', false, '2024-12-01', 'LOW: Cape Town'),

('SITE-ZA-003', 'PROD-010', 'BATCH-CARD-2024-009', 11, 8, 3, '2025-09-30', 302, '2024-11-08', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'LOW: Pretoria'),

-- ADEQUATE INVENTORY SITES (Healthy stock levels)
-- Major sites with good inventory management
('SITE-US-001', 'PROD-001', 'BATCH-ONC-2024-019', 45, 25, 20, '2026-03-31', 484, '2024-11-10', 'Cold-Storage-A', 'Normal', false, '2024-12-01', 'Adequate: Memorial Sloan Kettering well-stocked'),
('SITE-US-001', 'PROD-002', 'BATCH-ONC-P-2024-008', 38, 20, 18, '2026-03-31', 484, '2024-11-10', 'Cold-Storage-A', 'Normal', false, '2024-12-01', 'Adequate: Good placebo supply'),
('SITE-US-001', 'PROD-003', 'BATCH-ONC-C-2024-002', 32, 16, 16, '2025-12-31', 394, '2024-11-10', 'Cold-Storage-B', 'Normal', false, '2024-12-01', 'Adequate: Comparator stock good'),

('SITE-US-003', 'PROD-010', 'BATCH-CARD-2024-010', 35, 18, 17, '2025-11-30', 363, '2024-11-20', 'Pharmacy-Central', 'Normal', false, '2024-12-01', 'Adequate: Mayo Clinic Rochester'),
('SITE-US-003', 'PROD-011', 'BATCH-CARD-P-2024-005', 30, 15, 15, '2025-11-30', 363, '2024-11-20', 'Pharmacy-Central', 'Normal', false, '2024-12-01', 'Adequate: Well managed'),

('SITE-US-005', 'PROD-020', 'BATCH-DIAB-2024-025', 52, 30, 22, '2026-02-28', 453, '2024-11-15', 'Main-Storage', 'Normal', false, '2024-12-01', 'Adequate: UCSF - high enrollment but well supplied'),
('SITE-US-005', 'PROD-021', 'BATCH-DIAB-2024-026', 48, 28, 20, '2026-02-28', 453, '2024-11-15', 'Main-Storage', 'Normal', false, '2024-12-01', 'Adequate: 3.2 enrollment rate covered'),
('SITE-US-005', 'PROD-022', 'BATCH-DIAB-2024-027', 44, 25, 19, '2026-02-28', 453, '2024-11-15', 'Main-Storage', 'Normal', false, '2024-12-01', 'Adequate: 3-arm study well stocked'),

('SITE-US-007', 'PROD-030', 'BATCH-NEUR-2024-003', 28, 14, 14, '2026-04-30', 514, '2024-11-22', 'Neuro-Storage', 'Normal', false, '2024-12-01', 'Adequate: Stanford neurology'),
('SITE-US-007', 'PROD-031', 'BATCH-NEUR-P-2024-002', 24, 12, 12, '2026-04-30', 514, '2024-11-22', 'Neuro-Storage', 'Normal', false, '2024-12-01', 'Adequate: Placebo adequate'),

-- OVERSTOCKED SITE - Just opened, need redistribution
('SITE-US-008', 'PROD-030', 'BATCH-NEUR-2024-004', 65, 5, 60, '2026-05-31', 545, '2024-11-25', 'Main-Pharmacy', 'Normal', false, '2024-12-01', 'OVERSTOCKED: Mass General just opened, slow start - REDISTRIBUTION OPPORTUNITY'),
('SITE-US-008', 'PROD-031', 'BATCH-NEUR-P-2024-003', 55, 4, 51, '2026-05-31', 545, '2024-11-25', 'Main-Pharmacy', 'Normal', false, '2024-12-01', 'OVERSTOCKED: Can transfer to UK-004 or FR-004'),

('SITE-US-010', 'PROD-010', 'BATCH-CARD-2024-011', 32, 15, 17, '2026-01-31', 425, '2024-11-15', 'Cardio-Unit', 'Normal', false, '2024-12-01', 'Adequate: Northwestern'),

('SITE-US-013', 'PROD-001', 'BATCH-ONC-2024-020', 38, 18, 20, '2026-02-28', 453, '2024-11-18', 'Cold-Unit-Main', 'Normal', false, '2024-12-01', 'Adequate: Seattle Cancer Care'),
('SITE-US-013', 'PROD-002', 'BATCH-ONC-P-2024-009', 32, 15, 17, '2026-02-28', 453, '2024-11-18', 'Cold-Unit-Main', 'Normal', false, '2024-12-01', 'Adequate: Good balance'),

('SITE-US-015', 'PROD-010', 'BATCH-CARD-2024-012', 30, 14, 16, '2025-12-31', 394, '2024-11-23', 'Pharmacy-B', 'Normal', false, '2024-12-01', 'Adequate: UPenn'),
('SITE-US-015', 'PROD-011', 'BATCH-CARD-P-2024-006', 26, 12, 14, '2025-12-31', 394, '2024-11-23', 'Pharmacy-B', 'Normal', false, '2024-12-01', 'Adequate'),

-- Canada Adequate
('SITE-CA-001', 'PROD-001', 'BATCH-ONC-2024-021', 40, 20, 20, '2026-01-31', 425, '2024-11-15', 'Cold-Storage-Main', 'Normal', false, '2024-12-01', 'Adequate: Princess Margaret'),
('SITE-CA-001', 'PROD-002', 'BATCH-ONC-P-2024-010', 35, 18, 17, '2026-01-31', 425, '2024-11-15', 'Cold-Storage-Main', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-CA-003', 'PROD-010', 'BATCH-CARD-2024-013', 34, 16, 18, '2026-02-28', 453, '2024-11-20', 'Cardiology-Unit', 'Normal', false, '2024-12-01', 'Adequate: Montreal Heart Institute'),
('SITE-CA-003', 'PROD-011', 'BATCH-CARD-P-2024-007', 30, 14, 16, '2026-02-28', 453, '2024-11-20', 'Cardiology-Unit', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-CA-005', 'PROD-030', 'BATCH-NEUR-2024-005', 25, 4, 21, '2026-03-31', 484, '2024-11-25', 'Neuro-Storage', 'Normal', false, '2024-12-01', 'Adequate: McGill just started enrollment'),

-- Mexico Adequate
('SITE-MX-001', 'PROD-001', 'BATCH-ONC-2024-022', 32, 15, 17, '2025-11-30', 363, '2024-11-08', 'Almacén-Frío', 'Normal', false, '2024-12-01', 'Adequate: Instituto Nacional México'),

-- Europe Adequate
('SITE-UK-001', 'PROD-001', 'BATCH-ONC-2024-023', 42, 22, 20, '2026-01-31', 425, '2024-11-18', 'Cold-Store-1', 'Normal', false, '2024-12-01', 'Adequate: Royal Marsden'),
('SITE-UK-001', 'PROD-002', 'BATCH-ONC-P-2024-011', 36, 19, 17, '2026-01-31', 425, '2024-11-18', 'Cold-Store-1', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-UK-003', 'PROD-020', 'BATCH-DIAB-2024-028', 45, 24, 21, '2026-01-31', 425, '2024-11-16', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'Adequate: Guy and St Thomas'),
('SITE-UK-003', 'PROD-021', 'BATCH-DIAB-2024-029', 40, 22, 18, '2026-01-31', 425, '2024-11-16', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'Adequate'),
('SITE-UK-003', 'PROD-022', 'BATCH-DIAB-2024-030', 38, 20, 18, '2026-01-31', 425, '2024-11-16', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'Adequate: 3-dose supply good'),

('SITE-UK-005', 'PROD-040', 'BATCH-RARE-2024-002', 12, 5, 7, '2026-02-28', 453, '2024-11-20', 'Secure-Unit', 'Normal', false, '2024-12-01', 'Adequate: Edinburgh rare disease'),

('SITE-DE-001', 'PROD-001', 'BATCH-ONC-2024-024', 46, 24, 22, '2026-03-31', 484, '2024-11-20', 'Kühlraum-1', 'Normal', false, '2024-12-01', 'Adequate: Charité Berlin'),
('SITE-DE-001', 'PROD-002', 'BATCH-ONC-P-2024-012', 40, 22, 18, '2026-03-31', 484, '2024-11-20', 'Kühlraum-1', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-DE-002', 'PROD-010', 'BATCH-CARD-2024-014', 38, 18, 20, '2026-02-28', 453, '2024-11-20', 'Apotheke-Zentral', 'Normal', false, '2024-12-01', 'Adequate: Frankfurt'),
('SITE-DE-002', 'PROD-011', 'BATCH-CARD-P-2024-008', 34, 16, 18, '2026-02-28', 453, '2024-11-20', 'Apotheke-Zentral', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-DE-004', 'PROD-030', 'BATCH-NEUR-2024-006', 26, 12, 14, '2026-04-30', 514, '2024-11-22', 'Neuro-Lager', 'Normal', false, '2024-12-01', 'Adequate: Heidelberg'),
('SITE-DE-004', 'PROD-031', 'BATCH-NEUR-P-2024-004', 22, 10, 12, '2026-04-30', 514, '2024-11-22', 'Neuro-Lager', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-DE-005', 'PROD-001', 'BATCH-ONC-2024-025', 40, 20, 20, '2026-02-28', 453, '2024-11-18', 'Kühllager-A', 'Normal', false, '2024-12-01', 'Adequate: Hamburg'),

('SITE-FR-002', 'PROD-010', 'BATCH-CARD-2024-015', 32, 15, 17, '2026-01-31', 425, '2024-11-20', 'Pharmacie-A', 'Normal', false, '2024-12-01', 'Adequate: Pompidou'),
('SITE-FR-002', 'PROD-011', 'BATCH-CARD-P-2024-009', 28, 14, 14, '2026-01-31', 425, '2024-11-20', 'Pharmacie-A', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-FR-003', 'PROD-020', 'BATCH-DIAB-2024-031', 42, 22, 20, '2026-01-31', 425, '2024-11-14', 'Stockage-Principal', 'Normal', false, '2024-12-01', 'Adequate: Lyon'),
('SITE-FR-003', 'PROD-021', 'BATCH-DIAB-2024-032', 38, 20, 18, '2026-01-31', 425, '2024-11-14', 'Stockage-Principal', 'Normal', false, '2024-12-01', 'Adequate'),
('SITE-FR-003', 'PROD-022', 'BATCH-DIAB-2024-033', 35, 18, 17, '2026-01-31', 425, '2024-11-14', 'Stockage-Principal', 'Normal', false, '2024-12-01', 'Adequate'),

('SITE-ES-001', 'PROD-001', 'BATCH-ONC-2024-026', 36, 18, 18, '2026-01-31', 425, '2024-11-18', 'Cámara-Fría-1', 'Normal', false, '2024-12-01', 'Adequate: Barcelona'),

('SITE-IT-001', 'PROD-001', 'BATCH-ONC-2024-027', 38, 19, 19, '2026-02-28', 453, '2024-11-16', 'Frigorifero-A', 'Normal', false, '2024-12-01', 'Adequate: Milan'),

('SITE-IT-002', 'PROD-010', 'BATCH-CARD-2024-016', 32, 15, 17, '2026-01-31', 425, '2024-11-21', 'Farmacia-Centrale', 'Normal', false, '2024-12-01', 'Adequate: Rome'),

('SITE-NL-002', 'PROD-020', 'BATCH-DIAB-2024-034', 40, 20, 20, '2026-02-28', 453, '2024-11-19', 'Opslag-A', 'Normal', false, '2024-12-01', 'Adequate: Rotterdam'),

('SITE-PL-001', 'PROD-001', 'BATCH-ONC-2024-028', 32, 14, 18, '2026-01-31', 425, '2024-11-14', 'Chłodnia-1', 'Normal', false, '2024-12-01', 'Adequate: Warsaw'),

-- Asia-Pacific Adequate
('SITE-JP-001', 'PROD-001', 'BATCH-ONC-2024-029', 44, 22, 22, '2026-03-31', 484, '2024-11-20', '冷蔵保管庫-1', 'Normal', false, '2024-12-01', 'Adequate: National Cancer Center Tokyo'),

('SITE-JP-002', 'PROD-010', 'BATCH-CARD-2024-017', 34, 16, 18, '2026-02-28', 453, '2024-11-19', '薬剤部-保管庫', 'Normal', false, '2024-12-01', 'Adequate: University of Tokyo'),

('SITE-JP-004', 'PROD-030', 'BATCH-NEUR-2024-007', 24, 10, 14, '2026-04-30', 514, '2024-11-23', '神経科-保管室', 'Normal', false, '2024-12-01', 'Adequate: Kyoto'),

('SITE-JP-005', 'PROD-010', 'BATCH-CARD-2024-018', 32, 14, 18, '2026-02-28', 453, '2024-11-20', '循環器-倉庫', 'Normal', false, '2024-12-01', 'Adequate: Osaka Cardiovascular'),

('SITE-CN-001', 'PROD-001', 'BATCH-ONC-2024-030', 48, 26, 22, '2026-03-31', 484, '2024-11-15', '冷藏室-A', 'Normal', false, '2024-12-01', 'Adequate: Peking Union'),

('SITE-CN-003', 'PROD-020', 'BATCH-DIAB-2024-035', 50, 28, 22, '2026-02-28', 453, '2024-11-12', '储藏室-1', 'Normal', false, '2024-12-01', 'Adequate: Chengdu high enrollment'),

('SITE-IN-003', 'PROD-010', 'BATCH-CARD-2024-019', 36, 18, 18, '2026-01-31', 425, '2024-11-18', 'Pharmacy-Main', 'Normal', false, '2024-12-01', 'Adequate: Vellore CMC'),

('SITE-IN-004', 'PROD-030', 'BATCH-NEUR-2024-008', 22, 10, 12, '2026-03-31', 484, '2024-11-22', 'Neuro-Storage', 'Normal', false, '2024-12-01', 'Adequate: Bangalore Apollo'),

('SITE-AU-001', 'PROD-001', 'BATCH-ONC-2024-031', 38, 18, 20, '2026-02-28', 453, '2024-11-19', 'Cold-Room-1', 'Normal', false, '2024-12-01', 'Adequate: Peter Mac Melbourne'),

('SITE-AU-003', 'PROD-020', 'BATCH-DIAB-2024-036', 42, 20, 22, '2026-02-28', 453, '2024-11-16', 'Storage-Main', 'Normal', false, '2024-12-01', 'Adequate: Brisbane'),

('SITE-SG-001', 'PROD-001', 'BATCH-ONC-2024-032', 36, 18, 18, '2026-03-31', 484, '2024-11-20', 'Cold-Storage-A', 'Normal', false, '2024-12-01', 'Adequate: NUH Singapore'),

('SITE-SG-002', 'PROD-020', 'BATCH-DIAB-2024-037', 44, 22, 22, '2026-02-28', 453, '2024-11-18', 'Pharmacy-Store-1', 'Normal', false, '2024-12-01', 'Adequate: SGH'),

('SITE-KR-002', 'PROD-010', 'BATCH-CARD-2024-020', 34, 16, 18, '2026-02-28', 453, '2024-11-19', '약품보관실', 'Normal', false, '2024-12-01', 'Adequate: Samsung Medical Center Seoul'),

-- Latin America Adequate
('SITE-BR-003', 'PROD-020', 'BATCH-DIAB-2024-038', 46, 24, 22, '2026-01-31', 425, '2024-11-15', 'Depósito-Principal', 'Normal', false, '2024-12-01', 'Adequate: Einstein São Paulo'),

('SITE-AR-002', 'PROD-010', 'BATCH-CARD-2024-021', 30, 12, 18, '2026-01-31', 425, '2024-11-18', 'Farmacia-Central', 'Normal', false, '2024-12-01', 'Adequate: Buenos Aires'),

('SITE-CL-001', 'PROD-020', 'BATCH-DIAB-2024-039', 36, 16, 20, '2026-02-28', 453, '2024-11-20', 'Bodega-A', 'Normal', false, '2024-12-01', 'Adequate: Santiago'),

-- Middle East/Africa Adequate
('SITE-AE-001', 'PROD-010', 'BATCH-CARD-2024-022', 32, 14, 18, '2026-03-31', 484, '2024-11-21', 'Pharmacy-Unit-1', 'Normal', false, '2024-12-01', 'Adequate: Cleveland Clinic Abu Dhabi'),

('SITE-IL-001', 'PROD-001', 'BATCH-ONC-2024-033', 36, 17, 19, '2026-02-28', 453, '2024-11-19', 'Cold-Storage-Main', 'Normal', false, '2024-12-01', 'Adequate: Sheba Tel Aviv'),

('SITE-IL-002', 'PROD-030', 'BATCH-NEUR-2024-009', 20, 8, 12, '2026-03-31', 484, '2024-11-22', 'Neuro-Unit', 'Normal', false, '2024-12-01', 'Adequate: Hadassah Jerusalem'),

('SITE-ZA-002', 'PROD-020', 'BATCH-DIAB-2024-040', 38, 18, 20, '2026-01-31', 425, '2024-11-15', 'Main-Storage', 'Normal', false, '2024-12-01', 'Adequate: Johannesburg');


-- ================================================================
-- SHIPMENTS WITH GLOBAL SCENARIOS (100+ records)
-- ================================================================
INSERT INTO gold_shipments (shipment_id, study_id, product_id, from_depot_id, to_site_id, shipped_date, estimated_delivery_date, actual_delivery_date, delivery_delay_days, quantity, temperature_monitoring_enabled, temperature_excursion_detected, courier, tracking_number, shipment_status) VALUES

-- Critical Delayed Shipments (highlight risk assessment)
('SHIP-001', 'STUDY-001', 'PROD-001', 'DEPOT-NA-01', 'SITE-US-001', '2024-11-15 08:00:00', '2024-11-18', '2024-11-22', 4, 50, true, true, 'FedEx Priority', 'FDX-2024-US-001', 'delayed'),
('SHIP-002', 'STUDY-002', 'PROD-003', 'DEPOT-EU-01', 'SITE-UK-001', '2024-11-20 10:00:00', '2024-11-22', '2024-11-26', 4, 100, true, true, 'DHL Express', 'DHL-2024-UK-001', 'delayed'),
('SHIP-003', 'STUDY-001', 'PROD-002', 'DEPOT-LATAM-01', 'SITE-BR-001', '2024-11-10 14:00:00', '2024-11-15', '2024-11-21', 6, 75, true, false, 'Marken', 'MRK-2024-BR-001', 'delayed'),

-- Temperature Excursion Events (quality monitoring)
('SHIP-004', 'STUDY-003', 'PROD-005', 'DEPOT-AP-01', 'SITE-JP-001', '2024-11-25 06:00:00', '2024-11-28', '2024-11-28', 0, 80, true, true, 'World Courier', 'WC-2024-JP-001', 'delivered'),
('SHIP-005', 'STUDY-002', 'PROD-004', 'DEPOT-AP-02', 'SITE-IN-001', '2024-11-18 12:00:00', '2024-11-21', '2024-11-21', 0, 120, true, true, 'FedEx Priority', 'FDX-2024-IN-001', 'delivered'),

-- On-Time Deliveries (positive outcomes)
('SHIP-006', 'STUDY-004', 'PROD-006', 'DEPOT-EU-02', 'SITE-DE-001', '2024-11-22 09:00:00', '2024-11-24', '2024-11-24', 0, 150, true, false, 'DHL Express', 'DHL-2024-DE-001', 'delivered'),
('SHIP-007', 'STUDY-005', 'PROD-008', 'DEPOT-NA-02', 'SITE-CA-001', '2024-11-28 11:00:00', '2024-11-30', '2024-11-29', -1, 90, true, false, 'Marken', 'MRK-2024-CA-001', 'delivered'),
('SHIP-008', 'STUDY-001', 'PROD-001', 'DEPOT-EU-03', 'SITE-FR-001', '2024-11-26 15:00:00', '2024-11-28', '2024-11-28', 0, 110, true, false, 'World Courier', 'WC-2024-FR-001', 'delivered'),

-- In-Transit Shipments (current monitoring)
('SHIP-009', 'STUDY-003', 'PROD-007', 'DEPOT-AP-03', 'SITE-CN-001', '2024-12-01 07:00:00', '2024-12-05', NULL, NULL, 200, true, false, 'FedEx Priority', 'FDX-2024-CN-001', 'in_transit'),
('SHIP-010', 'STUDY-002', 'PROD-003', 'DEPOT-MEA-01', 'SITE-UAE-001', '2024-11-30 13:00:00', '2024-12-03', NULL, NULL, 60, true, false, 'DHL Express', 'DHL-2024-UAE-001', 'in_transit'),

-- Emergency Shipments (expedited delivery)
('SHIP-011', 'STUDY-001', 'PROD-002', 'DEPOT-NA-01', 'SITE-US-002', '2024-12-01 16:00:00', '2024-12-02', NULL, NULL, 30, true, false, 'FedEx Same Day', 'FDX-EMG-US-002', 'in_transit'),
('SHIP-012', 'STUDY-004', 'PROD-009', 'DEPOT-EU-01', 'SITE-ES-001', '2024-11-29 10:00:00', '2024-12-01', NULL, NULL, 40, true, false, 'Marken Express', 'MRK-EMG-ES-001', 'in_transit');

-- Additional shipments for comprehensive testing (88 more records)
-- North America Shipments
INSERT INTO gold_shipments (shipment_id, study_id, product_id, from_depot_id, to_site_id, shipped_date, estimated_delivery_date, actual_delivery_date, delivery_delay_days, quantity, temperature_monitoring_enabled, temperature_excursion_detected, courier, tracking_number, shipment_status)
SELECT 
    'SHIP-NA-' || LPAD(generate_series::TEXT, 3, '0'),
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-001'
         WHEN generate_series % 5 = 1 THEN 'STUDY-002'
         WHEN generate_series % 5 = 2 THEN 'STUDY-003'
         WHEN generate_series % 5 = 3 THEN 'STUDY-004'
         ELSE 'STUDY-005' END,
    'PROD-00' || ((generate_series % 9) + 1)::TEXT,
    CASE WHEN generate_series % 3 = 0 THEN 'DEPOT-NA-01'
         WHEN generate_series % 3 = 1 THEN 'DEPOT-NA-02'
         ELSE 'DEPOT-NA-03' END,
    CASE WHEN generate_series % 4 = 0 THEN 'SITE-US-001'
         WHEN generate_series % 4 = 1 THEN 'SITE-US-002'
         WHEN generate_series % 4 = 2 THEN 'SITE-CA-001'
         ELSE 'SITE-MX-001' END,
    TIMESTAMP '2024-11-01' + (generate_series || ' days')::INTERVAL,
    DATE '2024-11-01' + (generate_series + 3) * INTERVAL '1 day',
    CASE WHEN generate_series % 10 < 8 THEN DATE '2024-11-01' + (generate_series + CASE WHEN generate_series % 10 = 0 THEN 5 ELSE 3 END) * INTERVAL '1 day' ELSE NULL END,
    CASE WHEN generate_series % 10 < 8 THEN CASE WHEN generate_series % 10 = 0 THEN 2 ELSE 0 END ELSE NULL END,
    50 + (generate_series * 13) % 150,
    true,
    generate_series % 15 = 0,
    CASE WHEN generate_series % 3 = 0 THEN 'FedEx Priority' WHEN generate_series % 3 = 1 THEN 'DHL Express' ELSE 'Marken' END,
    'TRK-NA-' || LPAD(generate_series::TEXT, 4, '0'),
    CASE WHEN generate_series % 10 >= 8 THEN 'in_transit' WHEN generate_series % 10 = 0 THEN 'delayed' ELSE 'delivered' END
FROM generate_series(13, 40);

-- Europe Shipments
INSERT INTO gold_shipments (shipment_id, study_id, product_id, from_depot_id, to_site_id, shipped_date, estimated_delivery_date, actual_delivery_date, delivery_delay_days, quantity, temperature_monitoring_enabled, temperature_excursion_detected, courier, tracking_number, shipment_status)
SELECT 
    'SHIP-EU-' || LPAD(generate_series::TEXT, 3, '0'),
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-002'
         WHEN generate_series % 5 = 1 THEN 'STUDY-004'
         ELSE 'STUDY-001' END,
    'PROD-00' || ((generate_series % 9) + 1)::TEXT,
    CASE WHEN generate_series % 4 = 0 THEN 'DEPOT-EU-01'
         WHEN generate_series % 4 = 1 THEN 'DEPOT-EU-02'
         WHEN generate_series % 4 = 2 THEN 'DEPOT-EU-03'
         ELSE 'DEPOT-EU-04' END,
    CASE WHEN generate_series % 5 = 0 THEN 'SITE-UK-001'
         WHEN generate_series % 5 = 1 THEN 'SITE-DE-001'
         WHEN generate_series % 5 = 2 THEN 'SITE-FR-001'
         WHEN generate_series % 5 = 3 THEN 'SITE-ES-001'
         ELSE 'SITE-IT-001' END,
    TIMESTAMP '2024-11-05' + (generate_series || ' days')::INTERVAL,
    DATE '2024-11-05' + (generate_series + 2) * INTERVAL '1 day',
    CASE WHEN generate_series % 12 < 10 THEN DATE '2024-11-05' + (generate_series + CASE WHEN generate_series % 12 = 0 THEN 4 ELSE 2 END) * INTERVAL '1 day' ELSE NULL END,
    CASE WHEN generate_series % 12 < 10 THEN CASE WHEN generate_series % 12 = 0 THEN 2 ELSE 0 END ELSE NULL END,
    60 + (generate_series * 17) % 140,
    true,
    generate_series % 20 = 0,
    CASE WHEN generate_series % 2 = 0 THEN 'DHL Express' ELSE 'World Courier' END,
    'TRK-EU-' || LPAD(generate_series::TEXT, 4, '0'),
    CASE WHEN generate_series % 12 >= 10 THEN 'in_transit' WHEN generate_series % 12 = 0 THEN 'delayed' ELSE 'delivered' END
FROM generate_series(41, 70);

-- Asia-Pacific Shipments
INSERT INTO gold_shipments (shipment_id, study_id, product_id, from_depot_id, to_site_id, shipped_date, estimated_delivery_date, actual_delivery_date, delivery_delay_days, quantity, temperature_monitoring_enabled, temperature_excursion_detected, courier, tracking_number, shipment_status)
SELECT 
    'SHIP-AP-' || LPAD(generate_series::TEXT, 3, '0'),
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-003'
         WHEN generate_series % 5 = 1 THEN 'STUDY-005'
         ELSE 'STUDY-001' END,
    'PROD-00' || ((generate_series % 9) + 1)::TEXT,
    CASE WHEN generate_series % 4 = 0 THEN 'DEPOT-AP-01'
         WHEN generate_series % 4 = 1 THEN 'DEPOT-AP-02'
         WHEN generate_series % 4 = 2 THEN 'DEPOT-AP-03'
         ELSE 'DEPOT-AP-04' END,
    CASE WHEN generate_series % 6 = 0 THEN 'SITE-JP-001'
         WHEN generate_series % 6 = 1 THEN 'SITE-CN-001'
         WHEN generate_series % 6 = 2 THEN 'SITE-IN-001'
         WHEN generate_series % 6 = 3 THEN 'SITE-AU-001'
         WHEN generate_series % 6 = 4 THEN 'SITE-KR-001'
         ELSE 'SITE-SG-001' END,
    TIMESTAMP '2024-11-10' + (generate_series || ' days')::INTERVAL,
    DATE '2024-11-10' + (generate_series + 4) * INTERVAL '1 day',
    CASE WHEN generate_series % 11 < 9 THEN DATE '2024-11-10' + (generate_series + CASE WHEN generate_series % 11 = 0 THEN 6 ELSE 4 END) * INTERVAL '1 day' ELSE NULL END,
    CASE WHEN generate_series % 11 < 9 THEN CASE WHEN generate_series % 11 = 0 THEN 2 ELSE 0 END ELSE NULL END,
    70 + (generate_series * 19) % 130,
    true,
    generate_series % 18 = 0,
    CASE WHEN generate_series % 3 = 0 THEN 'FedEx Priority' WHEN generate_series % 3 = 1 THEN 'World Courier' ELSE 'Marken' END,
    'TRK-AP-' || LPAD(generate_series::TEXT, 4, '0'),
    CASE WHEN generate_series % 11 >= 9 THEN 'in_transit' WHEN generate_series % 11 = 0 THEN 'delayed' ELSE 'delivered' END
FROM generate_series(71, 100);

-- ================================================================
-- QUALITY EVENTS (50+ records showing various issues)
-- ================================================================
INSERT INTO gold_quality_events (event_id, study_id, site_id, product_id, shipment_id, event_type, severity, event_date, description, resolution_status, resolution_date, root_cause, corrective_action) VALUES

-- Critical Events (immediate attention required)
('QE-001', 'STUDY-001', 'SITE-US-001', 'PROD-001', 'SHIP-001', 'temperature_excursion', 'critical', '2024-11-20 14:30:00', 'Temperature exceeded +8°C for 4 hours during transit. Max temp recorded: +12°C', 'resolved', '2024-11-21 10:00:00', 'Refrigeration unit failure in transport vehicle', 'Product quarantined and destroyed. Replacement shipment expedited. Carrier investigation initiated.'),
('QE-002', 'STUDY-002', 'SITE-UK-001', 'PROD-003', 'SHIP-002', 'temperature_excursion', 'critical', '2024-11-24 08:15:00', 'Cold chain breach detected. Temperature dropped to -5°C for 2 hours', 'in_progress', NULL, 'Incorrect packaging with excessive dry ice', 'Product under evaluation. Enhanced packaging procedures implemented.'),
('QE-003', 'STUDY-003', 'SITE-JP-001', 'PROD-005', 'SHIP-004', 'product_damage', 'major', '2024-11-28 16:45:00', 'Visible damage to 15 vials upon receipt. Broken seals and cracks observed', 'resolved', '2024-11-29 14:00:00', 'Inadequate cushioning during air freight', 'Damaged product returned to depot. Packaging design improved. Staff retraining conducted.'),

-- Major Events (significant but manageable)
('QE-004', 'STUDY-001', 'SITE-FR-001', 'PROD-002', NULL, 'expired_inventory', 'major', '2024-11-15 09:00:00', '25 units found expired during routine inventory check. Expiry date: 2024-11-10', 'resolved', '2024-11-16 11:00:00', 'Inadequate FEFO tracking and inventory rotation', 'Expired stock destroyed. Enhanced inventory monitoring alerts implemented. Monthly audits scheduled.'),
('QE-005', 'STUDY-004', 'SITE-DE-001', 'PROD-006', NULL, 'labeling_error', 'major', '2024-11-22 13:20:00', 'Batch number mismatch between outer carton and inner vials. Affects 50 units', 'in_progress', NULL, 'Manual labeling error at depot during repackaging', 'Product quarantined pending investigation. Automated labeling system being evaluated.'),

-- Moderate Events (routine quality issues)
('QE-006', 'STUDY-005', 'SITE-CA-001', 'PROD-008', 'SHIP-007', 'documentation_error', 'moderate', '2024-11-28 10:30:00', 'Missing temperature monitoring data for last 6 hours of transit', 'resolved', '2024-11-29 09:00:00', 'Data logger battery failure', 'Data recovered from backup logger. Product released after quality review. Logger maintenance schedule updated.'),
('QE-007', 'STUDY-002', 'SITE-IN-001', 'PROD-004', 'SHIP-005', 'temperature_excursion', 'moderate', '2024-11-21 11:45:00', 'Brief temperature spike to +10°C for 30 minutes during customs clearance', 'resolved', '2024-11-22 08:00:00', 'Ambient exposure during customs inspection', 'Product stability analysis conducted. Released for use. Improved customs coordination procedures.'),

-- Minor Events (documentation and procedural)
('QE-008', 'STUDY-003', 'SITE-CN-001', 'PROD-007', NULL, 'documentation_error', 'minor', '2024-11-25 14:00:00', 'Receiving signature missing on delivery documentation', 'resolved', '2024-11-26 10:00:00', 'Site staff training gap', 'Documentation corrected. Site staff retrained on receipt procedures.');

-- Additional 42 quality events for comprehensive testing
INSERT INTO gold_quality_events (event_id, study_id, site_id, product_id, shipment_id, event_type, severity, event_date, description, resolution_status, resolution_date, root_cause, corrective_action)
SELECT 
    'QE-' || LPAD(generate_series::TEXT, 3, '0'),
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-001'
         WHEN generate_series % 5 = 1 THEN 'STUDY-002'
         WHEN generate_series % 5 = 2 THEN 'STUDY-003'
         WHEN generate_series % 5 = 3 THEN 'STUDY-004'
         ELSE 'STUDY-005' END,
    'SITE-' || CASE WHEN generate_series % 10 < 3 THEN 'US' WHEN generate_series % 10 < 6 THEN 'EU' ELSE 'AP' END || '-' || LPAD((generate_series % 3 + 1)::TEXT, 3, '0'),
    'PROD-00' || ((generate_series % 9) + 1)::TEXT,
    CASE WHEN generate_series % 3 = 0 THEN 'SHIP-' || LPAD(generate_series::TEXT, 3, '0') ELSE NULL END,
    CASE WHEN generate_series % 6 = 0 THEN 'temperature_excursion'
         WHEN generate_series % 6 = 1 THEN 'product_damage'
         WHEN generate_series % 6 = 2 THEN 'expired_inventory'
         WHEN generate_series % 6 = 3 THEN 'labeling_error'
         WHEN generate_series % 6 = 4 THEN 'documentation_error'
         ELSE 'contamination' END,
    CASE WHEN generate_series % 12 < 2 THEN 'critical'
         WHEN generate_series % 12 < 5 THEN 'major'
         WHEN generate_series % 12 < 9 THEN 'moderate'
         ELSE 'minor' END,
    TIMESTAMP '2024-11-01' + (generate_series || ' days')::INTERVAL,
    'Event description for QE-' || LPAD(generate_series::TEXT, 3, '0') || ' - ' || 
    CASE WHEN generate_series % 6 = 0 THEN 'Temperature excursion detected during transit'
         WHEN generate_series % 6 = 1 THEN 'Physical damage observed upon inspection'
         WHEN generate_series % 6 = 2 THEN 'Expired product found in inventory'
         WHEN generate_series % 6 = 3 THEN 'Labeling discrepancy identified'
         WHEN generate_series % 6 = 4 THEN 'Documentation incomplete or missing'
         ELSE 'Potential contamination risk identified' END,
    CASE WHEN generate_series % 4 = 0 THEN 'open' WHEN generate_series % 4 < 3 THEN 'in_progress' ELSE 'resolved' END,
    CASE WHEN generate_series % 4 >= 3 THEN TIMESTAMP '2024-11-01' + ((generate_series + 2) || ' days')::INTERVAL ELSE NULL END,
    'Root cause for event QE-' || LPAD(generate_series::TEXT, 3, '0'),
    CASE WHEN generate_series % 4 >= 2 THEN 'Corrective action implemented for QE-' || LPAD(generate_series::TEXT, 3, '0') ELSE NULL END
FROM generate_series(9, 50);


-- ================================================================
-- TEMPERATURE MONITORING LOGS (100+ records)
-- ================================================================
INSERT INTO gold_temperature_logs (log_id, shipment_id, recorded_at, temperature_celsius, humidity_percent, location, data_logger_id, alert_triggered)
SELECT 
    'TEMP-LOG-' || LPAD(generate_series::TEXT, 4, '0'),
    CASE WHEN generate_series % 12 <= 3 THEN 'SHIP-001'
         WHEN generate_series % 12 <= 6 THEN 'SHIP-002'
         WHEN generate_series % 12 <= 9 THEN 'SHIP-004'
         ELSE 'SHIP-005' END,
    TIMESTAMP '2024-11-15' + ((generate_series * 2) || ' hours')::INTERVAL,
    CASE WHEN generate_series % 50 = 0 THEN 12.5  -- Temperature excursion
         WHEN generate_series % 35 = 0 THEN 10.2  -- Minor excursion
         ELSE 2.0 + (random() * 4.0)::NUMERIC(4,2) END,  -- Normal range 2-6°C
    45.0 + (random() * 20.0)::NUMERIC(4,2),
    CASE WHEN generate_series % 4 = 0 THEN 'In Transit - Air'
         WHEN generate_series % 4 = 1 THEN 'In Transit - Ground'
         WHEN generate_series % 4 = 2 THEN 'Customs Hold'
         ELSE 'Distribution Hub' END,
    'DL-' || LPAD((generate_series % 10 + 1)::TEXT, 4, '0'),
    generate_series % 50 = 0 OR generate_series % 35 = 0
FROM generate_series(1, 120);

-- ================================================================
-- SUBJECTS/PATIENTS (150+ records across all sites)
-- ================================================================
INSERT INTO gold_subjects (subject_id, study_id, site_id, enrollment_date, status, treatment_arm, scheduled_visits, completed_visits, next_visit_date, randomization_date)
SELECT 
    'SUBJ-' || LPAD(generate_series::TEXT, 5, '0'),
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-001'
         WHEN generate_series % 5 = 1 THEN 'STUDY-002'
         WHEN generate_series % 5 = 2 THEN 'STUDY-003'
         WHEN generate_series % 5 = 3 THEN 'STUDY-004'
         ELSE 'STUDY-005' END,
    -- Assign to high-enrollment sites (DE, IN, CN, US, UK)
    CASE WHEN generate_series % 10 = 0 THEN 'SITE-DE-001'
         WHEN generate_series % 10 = 1 THEN 'SITE-IN-001'
         WHEN generate_series % 10 = 2 THEN 'SITE-CN-001'
         WHEN generate_series % 10 = 3 THEN 'SITE-US-001'
         WHEN generate_series % 10 = 4 THEN 'SITE-UK-001'
         WHEN generate_series % 10 = 5 THEN 'SITE-FR-001'
         WHEN generate_series % 10 = 6 THEN 'SITE-JP-001'
         WHEN generate_series % 10 = 7 THEN 'SITE-CA-001'
         WHEN generate_series % 10 = 8 THEN 'SITE-AU-001'
         ELSE 'SITE-ES-001' END,
    DATE '2024-01-01' + (generate_series * 2) * INTERVAL '1 day',
    CASE WHEN generate_series % 15 = 0 THEN 'completed'
         WHEN generate_series % 15 = 1 THEN 'withdrawn'
         WHEN generate_series % 15 = 2 THEN 'screening'
         ELSE 'active' END,
    CASE WHEN generate_series % 3 = 0 THEN 'Treatment A'
         WHEN generate_series % 3 = 1 THEN 'Treatment B'
         ELSE 'Placebo' END,
    12,
    CASE WHEN generate_series % 15 = 0 THEN 12  -- Completed all visits
         WHEN generate_series % 15 = 2 THEN 0   -- Screening, no visits yet
         ELSE (generate_series % 11) + 1 END,   -- In progress
    CASE WHEN generate_series % 15 = 0 OR generate_series % 15 = 1 THEN NULL  -- No next visit if completed/withdrawn
         ELSE DATE '2024-12-02' + ((generate_series % 30) + 1) * INTERVAL '1 day' END,
    DATE '2024-01-01' + ((generate_series * 2) + 7) * INTERVAL '1 day'
FROM generate_series(1, 150);

-- ================================================================
-- PURCHASE ORDERS (30+ records)
-- ================================================================
INSERT INTO gold_purchase_orders (po_id, vendor_id, product_id, order_date, expected_delivery_date, actual_delivery_date, quantity_ordered, quantity_received, unit_cost, total_cost, order_status, receiving_depot_id) VALUES

-- Recent Orders
('PO-2024-001', 'VENDOR-001', 'PROD-001', '2024-11-01', '2024-11-15', '2024-11-14', 500, 500, 125.50, 62750.00, 'received', 'DEPOT-NA-01'),
('PO-2024-002', 'VENDOR-002', 'PROD-003', '2024-11-05', '2024-11-20', '2024-11-22', 1000, 1000, 89.75, 89750.00, 'received', 'DEPOT-EU-01'),
('PO-2024-003', 'VENDOR-003', 'PROD-005', '2024-11-08', '2024-11-25', NULL, 750, 0, 210.00, 157500.00, 'in_transit', 'DEPOT-AP-01'),
('PO-2024-004', 'VENDOR-004', 'PROD-007', '2024-11-12', '2024-11-28', NULL, 600, 0, 145.25, 87150.00, 'pending', 'DEPOT-AP-02');

-- Additional 26 purchase orders
INSERT INTO gold_purchase_orders (po_id, vendor_id, product_id, order_date, expected_delivery_date, actual_delivery_date, quantity_ordered, quantity_received, unit_cost, total_cost, order_status, receiving_depot_id)
SELECT 
    'PO-2024-' || LPAD(generate_series::TEXT, 3, '0'),
    'VENDOR-' || LPAD(((generate_series % 10) + 1)::TEXT, 3, '0'),
    'PROD-00' || ((generate_series % 9) + 1)::TEXT,
    DATE '2024-09-01' + (generate_series * 3) * INTERVAL '1 day',
    DATE '2024-09-01' + ((generate_series * 3) + 14) * INTERVAL '1 day',
    CASE WHEN generate_series % 5 < 4 THEN DATE '2024-09-01' + ((generate_series * 3) + CASE WHEN generate_series % 5 = 0 THEN 16 ELSE 14 END) * INTERVAL '1 day' ELSE NULL END,
    (generate_series * 47 + 200) % 1000 + 300,
    CASE WHEN generate_series % 5 < 4 THEN (generate_series * 47 + 200) % 1000 + 300 ELSE 0 END,
    75.00 + (generate_series * 13.5)::NUMERIC(10,2),
    ((generate_series * 47 + 200) % 1000 + 300) * (75.00 + (generate_series * 13.5)::NUMERIC(10,2)),
    CASE WHEN generate_series % 5 = 4 THEN 'in_transit' WHEN generate_series % 5 = 3 THEN 'pending' ELSE 'received' END,
    CASE WHEN generate_series % 6 < 2 THEN 'DEPOT-NA-0' || ((generate_series % 3) + 1)::TEXT
         WHEN generate_series % 6 < 4 THEN 'DEPOT-EU-0' || ((generate_series % 4) + 1)::TEXT
         ELSE 'DEPOT-AP-0' || ((generate_series % 4) + 1)::TEXT END
FROM generate_series(5, 30);

-- ================================================================
-- INVENTORY TARGETS (for demand forecasting validation)
-- ================================================================
INSERT INTO gold_inventory_targets (study_id, site_id, product_id, target_min_quantity, target_max_quantity, reorder_point, lead_time_days, updated_at) VALUES
('STUDY-001', 'SITE-US-001', 'PROD-001', 50, 200, 75, 5, CURRENT_TIMESTAMP),
('STUDY-001', 'SITE-US-001', 'PROD-002', 30, 150, 50, 5, CURRENT_TIMESTAMP),
('STUDY-002', 'SITE-UK-001', 'PROD-003', 80, 300, 120, 3, CURRENT_TIMESTAMP),
('STUDY-002', 'SITE-UK-001', 'PROD-004', 60, 250, 90, 3, CURRENT_TIMESTAMP),
('STUDY-003', 'SITE-JP-001', 'PROD-005', 70, 280, 100, 7, CURRENT_TIMESTAMP),
('STUDY-003', 'SITE-CN-001', 'PROD-007', 100, 400, 150, 10, CURRENT_TIMESTAMP),
('STUDY-004', 'SITE-DE-001', 'PROD-006', 90, 350, 130, 4, CURRENT_TIMESTAMP),
('STUDY-004', 'SITE-FR-001', 'PROD-009', 50, 200, 80, 4, CURRENT_TIMESTAMP),
('STUDY-005', 'SITE-CA-001', 'PROD-008', 40, 180, 65, 5, CURRENT_TIMESTAMP),
('STUDY-005', 'SITE-AU-001', 'PROD-010', 60, 240, 95, 8, CURRENT_TIMESTAMP);

-- Additional inventory targets for critical sites
INSERT INTO gold_inventory_targets (study_id, site_id, product_id, target_min_quantity, target_max_quantity, reorder_point, lead_time_days, updated_at)
SELECT 
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-001'
         WHEN generate_series % 5 = 1 THEN 'STUDY-002'
         WHEN generate_series % 5 = 2 THEN 'STUDY-003'
         WHEN generate_series % 5 = 3 THEN 'STUDY-004'
         ELSE 'STUDY-005' END,
    CASE WHEN generate_series % 8 = 0 THEN 'SITE-IN-001'
         WHEN generate_series % 8 = 1 THEN 'SITE-BR-001'
         WHEN generate_series % 8 = 2 THEN 'SITE-ES-001'
         WHEN generate_series % 8 = 3 THEN 'SITE-IT-001'
         WHEN generate_series % 8 = 4 THEN 'SITE-MX-001'
         WHEN generate_series % 8 = 5 THEN 'SITE-KR-001'
         WHEN generate_series % 8 = 6 THEN 'SITE-SG-001'
         ELSE 'SITE-UAE-001' END,
    'PROD-00' || ((generate_series % 10) + 1)::TEXT,
    (generate_series * 7 + 30) % 80 + 40,
    (generate_series * 11 + 150) % 200 + 200,
    (generate_series * 9 + 60) % 100 + 70,
    (generate_series % 10) + 3,
    CURRENT_TIMESTAMP
FROM generate_series(11, 40);

-- ================================================================
-- DEMAND FORECAST DATA (for analytics testing)
-- ================================================================
INSERT INTO gold_demand_forecast (study_id, site_id, product_id, forecast_date, forecast_horizon_days, predicted_demand, confidence_level, algorithm_used, created_at) VALUES
('STUDY-001', 'SITE-US-001', 'PROD-001', '2024-12-02', 30, 75, 0.85, 'ARIMA', CURRENT_TIMESTAMP),
('STUDY-001', 'SITE-US-001', 'PROD-002', '2024-12-02', 30, 45, 0.82, 'ARIMA', CURRENT_TIMESTAMP),
('STUDY-002', 'SITE-UK-001', 'PROD-003', '2024-12-02', 30, 120, 0.88, 'Prophet', CURRENT_TIMESTAMP),
('STUDY-002', 'SITE-DE-001', 'PROD-003', '2024-12-02', 30, 180, 0.91, 'Prophet', CURRENT_TIMESTAMP),
('STUDY-003', 'SITE-JP-001', 'PROD-005', '2024-12-02', 30, 95, 0.79, 'ExponentialSmoothing', CURRENT_TIMESTAMP),
('STUDY-003', 'SITE-CN-001', 'PROD-007', '2024-12-02', 30, 220, 0.87, 'Prophet', CURRENT_TIMESTAMP),
('STUDY-004', 'SITE-DE-001', 'PROD-006', '2024-12-02', 30, 155, 0.90, 'ARIMA', CURRENT_TIMESTAMP),
('STUDY-005', 'SITE-CA-001', 'PROD-008', '2024-12-02', 30, 65, 0.83, 'ExponentialSmoothing', CURRENT_TIMESTAMP);

-- Additional forecast records
INSERT INTO gold_demand_forecast (study_id, site_id, product_id, forecast_date, forecast_horizon_days, predicted_demand, confidence_level, algorithm_used, created_at)
SELECT 
    CASE WHEN generate_series % 5 = 0 THEN 'STUDY-001'
         WHEN generate_series % 5 = 1 THEN 'STUDY-002'
         WHEN generate_series % 5 = 2 THEN 'STUDY-003'
         WHEN generate_series % 5 = 3 THEN 'STUDY-004'
         ELSE 'STUDY-005' END,
    CASE WHEN generate_series % 7 = 0 THEN 'SITE-US-001'
         WHEN generate_series % 7 = 1 THEN 'SITE-UK-001'
         WHEN generate_series % 7 = 2 THEN 'SITE-DE-001'
         WHEN generate_series % 7 = 3 THEN 'SITE-JP-001'
         WHEN generate_series % 7 = 4 THEN 'SITE-CN-001'
         WHEN generate_series % 7 = 5 THEN 'SITE-IN-001'
         ELSE 'SITE-FR-001' END,
    'PROD-00' || ((generate_series % 10) + 1)::TEXT,
    DATE '2024-12-02',
    CASE WHEN generate_series % 3 = 0 THEN 30 WHEN generate_series % 3 = 1 THEN 60 ELSE 90 END,
    (generate_series * 13 + 50) % 200 + 40,
    (0.75 + (generate_series * 0.02) % 0.20)::NUMERIC(4,2),
    CASE WHEN generate_series % 3 = 0 THEN 'ARIMA' WHEN generate_series % 3 = 1 THEN 'Prophet' ELSE 'ExponentialSmoothing' END,
    CURRENT_TIMESTAMP
FROM generate_series(9, 30);

-- ================================================================
-- AUDIT TRAIL (50+ records for compliance)
-- ================================================================
INSERT INTO gold_audit_trail (action_type, table_name, record_id, user_id, action_timestamp, old_values, new_values, change_reason)
SELECT 
    CASE WHEN generate_series % 6 = 0 THEN 'INSERT'
         WHEN generate_series % 6 < 4 THEN 'UPDATE'
         ELSE 'DELETE' END,
    CASE WHEN generate_series % 5 = 0 THEN 'gold_inventory'
         WHEN generate_series % 5 = 1 THEN 'gold_shipments'
         WHEN generate_series % 5 = 2 THEN 'gold_quality_events'
         WHEN generate_series % 5 = 3 THEN 'gold_subjects'
         ELSE 'gold_purchase_orders' END,
    'REC-' || LPAD(generate_series::TEXT, 5, '0'),
    'user-' || LPAD(((generate_series % 20) + 1)::TEXT, 3, '0') || '@example.com',
    TIMESTAMP '2024-11-01' + (generate_series || ' hours')::INTERVAL,
    CASE WHEN generate_series % 6 < 4 THEN '{"status": "old_value", "quantity": 100}' ELSE NULL END,
    '{"status": "new_value", "quantity": 150}',
    CASE WHEN generate_series % 6 = 0 THEN 'New record created'
         WHEN generate_series % 6 < 4 THEN 'Status updated per protocol'
         ELSE 'Record deleted per retention policy' END
FROM generate_series(1, 50);

