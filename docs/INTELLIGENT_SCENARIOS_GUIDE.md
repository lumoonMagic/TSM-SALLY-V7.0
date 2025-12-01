# Sally TSM: Intelligent Scenario-Based System Design

## 📋 Overview

Transform Sally TSM from a static dashboard into an **intelligent, proactive AI assistant** that anticipates needs, suggests actions, and automates routine tasks. This guide covers 12 real-world scenarios Trial Supply Managers face daily.

---

## 🎯 Core Design Philosophy

### Problem with Traditional Dashboards
- ❌ **Information overload** - 50+ metrics, user overwhelmed
- ❌ **Reactive** - User must dig for insights
- ❌ **Generic** - Same view for all users/situations
- ❌ **No context** - Numbers without meaning
- ❌ **Manual actions** - User must do everything

### Sally TSM Intelligent Approach
- ✅ **Context-aware** - Shows what matters NOW
- ✅ **Proactive** - Alerts before problems occur
- ✅ **Personalized** - Adapts to user role and study
- ✅ **Actionable** - Suggests and automates actions
- ✅ **Conversational** - Natural language interaction

---

## 🎭 12 Critical TSM Scenarios

### Scenario 1: Emergency Stock Transfer Between Sites
**User Story:**
> "As a TSM, when Site A is running low on Drug X and Site B has excess stock nearby, I want Sally to automatically suggest an inter-site transfer with pre-drafted documentation, so I can prevent a stock-out without waiting for a new shipment."

**Situation:**
- Site 101 (New York): 5 days of Drug X remaining
- Site 104 (Boston): 45 days of Drug X remaining (250km away)
- New shipment to Site 101: 12 days away
- Risk: Site 101 will run out in 5 days

**What Sally Does:**
1. **Detects the problem** (predictive monitoring)
2. **Analyzes nearby sites** with excess stock
3. **Calculates logistics** (distance, transit time, cost)
4. **Suggests transfer** with exact quantities
5. **Generates documentation** (transfer request, shipment labels)
6. **Drafts email** to depot coordinator
7. **Updates inventory forecasts** post-transfer

**Database Requirements:**
```sql
-- New table needed: gold_site_transfers
CREATE TABLE gold_site_transfers (
    transfer_id VARCHAR(50) PRIMARY KEY,
    source_site_id VARCHAR(50) NOT NULL,
    destination_site_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity_transferred INT NOT NULL,
    transfer_reason VARCHAR(100), -- 'emergency_stockout', 'excess_return', 'planned'
    requested_date DATE NOT NULL,
    approved_date DATE,
    shipped_date DATE,
    delivered_date DATE,
    transfer_status VARCHAR(50), -- 'requested', 'approved', 'in_transit', 'delivered', 'cancelled'
    urgency_level VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    estimated_transit_days INT,
    actual_transit_days INT,
    cost_estimate DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    approver_name VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (destination_site_id) REFERENCES gold_sites(site_id)
);

-- Index for quick lookups
CREATE INDEX idx_transfers_status ON gold_site_transfers(transfer_status);
CREATE INDEX idx_transfers_urgency ON gold_site_transfers(urgency_level);
CREATE INDEX idx_transfers_product ON gold_site_transfers(product_name);
```

---

### Scenario 2: Vendor Performance Alert & Auto-Reminder
**User Story:**
> "As a TSM, when a vendor has 3 consecutive late deliveries, I want Sally to automatically flag them and draft a performance review email, so I can address the issue proactively."

**Situation:**
- Vendor "GlobalPharma Logistics" has delivered late 3 times in past month
- Average delay: 4.5 days
- Current shipments in transit: 2 (both potentially at risk)
- Contract SLA: 95% on-time delivery

**What Sally Does:**
1. **Monitors vendor performance** continuously
2. **Detects pattern** of late deliveries
3. **Calculates impact** (cost, risk to studies)
4. **Generates performance report** with charts
5. **Drafts escalation email** to vendor
6. **Suggests alternative vendors** for future shipments
7. **Updates vendor risk score**

**Database Requirements:**
```sql
-- Enhanced gold_vendors table
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS on_time_delivery_rate DECIMAL(5,2);
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS average_delay_days DECIMAL(5,2);
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0; -- 0-100
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS performance_grade VARCHAR(1); -- A, B, C, D, F
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS last_performance_review_date DATE;
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS consecutive_late_deliveries INT DEFAULT 0;
ALTER TABLE gold_vendors ADD COLUMN IF NOT EXISTS total_shipments_handled INT DEFAULT 0;

-- New table: vendor_performance_history
CREATE TABLE gold_vendor_performance_history (
    performance_id SERIAL PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL,
    evaluation_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_shipments INT,
    on_time_shipments INT,
    late_shipments INT,
    average_delay_days DECIMAL(5,2),
    on_time_rate DECIMAL(5,2),
    risk_score INT,
    performance_grade VARCHAR(1),
    issues_identified TEXT[],
    actions_taken TEXT[],
    evaluator_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES gold_vendors(vendor_id)
);

-- New table: vendor_communications
CREATE TABLE gold_vendor_communications (
    communication_id SERIAL PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL,
    communication_type VARCHAR(50), -- 'performance_alert', 'reminder', 'escalation', 'inquiry'
    subject VARCHAR(500),
    message_body TEXT,
    sent_date TIMESTAMP,
    sent_by VARCHAR(100),
    response_received BOOLEAN DEFAULT FALSE,
    response_date TIMESTAMP,
    response_summary TEXT,
    status VARCHAR(50), -- 'draft', 'sent', 'responded', 'escalated'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES gold_vendors(vendor_id)
);
```

---

### Scenario 3: Proactive Enrollment-Based Demand Surge
**User Story:**
> "As a TSM, when a site's enrollment suddenly accelerates, I want Sally to automatically recalculate drug demand and suggest an emergency order before we run low, so the study doesn't face delays."

**Situation:**
- Site 205 (London): Typical enrollment rate 2 subjects/week
- Past 2 weeks: Enrolled 8 subjects (4x normal rate)
- Current inventory: 60 kits (normally 30 days supply)
- At new rate: Only 15 days supply remaining
- Lead time for new shipment: 21 days

**What Sally Does:**
1. **Detects enrollment surge** (ML anomaly detection)
2. **Recalculates burn rate** based on new enrollment
3. **Predicts stock-out date** with confidence interval
4. **Suggests emergency order** with exact quantity
5. **Drafts purchase requisition** with justification
6. **Notifies depot** to expedite
7. **Updates demand forecast** for site

**Database Requirements:**
```sql
-- Enhanced gold_subjects table for enrollment tracking
ALTER TABLE gold_subjects ADD COLUMN IF NOT EXISTS enrollment_week INT;
ALTER TABLE gold_subjects ADD COLUMN IF NOT EXISTS enrollment_month INT;

-- New table: enrollment_analytics
CREATE TABLE gold_enrollment_analytics (
    analytics_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    week_start_date DATE NOT NULL,
    expected_enrollments INT,
    actual_enrollments INT,
    variance_percentage DECIMAL(5,2),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    suggested_actions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- New table: demand_forecasts
CREATE TABLE gold_demand_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_horizon_days INT DEFAULT 90,
    predicted_demand_quantity INT,
    confidence_level DECIMAL(5,2), -- 0-100
    current_inventory INT,
    predicted_stockout_date DATE,
    recommended_order_quantity INT,
    recommended_order_date DATE,
    forecast_method VARCHAR(50), -- 'time_series', 'protocol_driven', 'ml_hybrid'
    model_accuracy_mape DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);
```

---

### Scenario 4: Temperature Excursion During Shipment
**User Story:**
> "As a TSM, when a shipment's temperature exceeds acceptable range, I want Sally to immediately alert me with product integrity assessment and suggest whether to quarantine or accept, so I can make a quick decision."

**Situation:**
- Shipment #SH-8892 in transit to Site 309 (Tokyo)
- Temperature monitor shows: Spike to 12°C for 2 hours
- Acceptable range: 2-8°C
- Product: Monoclonal Antibody (temperature-sensitive)
- Protocol allows: <10°C for max 4 hours cumulative

**What Sally Does:**
1. **Receives real-time temp alert** from IoT sensor
2. **Analyzes excursion severity** against protocol
3. **Assesses product integrity** (stability data)
4. **Recommends action** (accept, quarantine, reject)
5. **Drafts incident report** with timeline
6. **Notifies quality assurance** team
7. **Suggests replacement shipment** if needed

**Database Requirements:**
```sql
-- New table: shipment_temperature_logs
CREATE TABLE gold_shipment_temperature_logs (
    log_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    temperature_celsius DECIMAL(5,2),
    humidity_percentage DECIMAL(5,2),
    location_latitude DECIMAL(10,7),
    location_longitude DECIMAL(10,7),
    sensor_id VARCHAR(100),
    is_excursion BOOLEAN DEFAULT FALSE,
    excursion_severity VARCHAR(20), -- 'minor', 'moderate', 'major', 'critical'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES gold_shipments(shipment_id)
);

CREATE INDEX idx_temp_logs_shipment ON gold_shipment_temperature_logs(shipment_id);
CREATE INDEX idx_temp_logs_excursion ON gold_shipment_temperature_logs(is_excursion);

-- New table: temperature_excursion_incidents
CREATE TABLE gold_temperature_excursion_incidents (
    incident_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    excursion_start_time TIMESTAMP,
    excursion_end_time TIMESTAMP,
    duration_minutes INT,
    max_temperature_celsius DECIMAL(5,2),
    min_temperature_celsius DECIMAL(5,2),
    acceptable_range_min DECIMAL(5,2),
    acceptable_range_max DECIMAL(5,2),
    severity_level VARCHAR(20),
    product_integrity_status VARCHAR(50), -- 'acceptable', 'questionable', 'compromised'
    recommended_action VARCHAR(100), -- 'accept', 'quarantine_test', 'reject_replace'
    qa_decision VARCHAR(100),
    qa_decision_date TIMESTAMP,
    qa_decision_by VARCHAR(100),
    incident_report_id VARCHAR(100),
    financial_impact DECIMAL(10,2),
    root_cause TEXT,
    corrective_actions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES gold_shipments(shipment_id)
);
```

---

### Scenario 5: Multi-Site Expiry Risk Management
**User Story:**
> "As a TSM, when drug kits are approaching expiry across multiple sites, I want Sally to automatically identify redistribution opportunities and draft transfer requests, so we minimize waste."

**Situation:**
- Site 112 (Berlin): 80 kits expiring in 45 days, low usage rate
- Site 118 (Vienna): High enrollment, will consume 80 kits in 30 days
- Distance: 520km, 1-day truck transit
- Cost to replace expired kits: €120,000
- Transfer cost: €2,500

**What Sally Does:**
1. **Scans all sites** for approaching expiries
2. **Identifies consumption rates** at each site
3. **Matches surplus with demand** geographically
4. **Calculates financial benefit** (€117,500 savings)
5. **Suggests optimal transfers** with routes
6. **Generates transfer documentation**
7. **Drafts coordination emails**

**Database Requirements:**
```sql
-- Enhanced gold_inventory for expiry tracking
ALTER TABLE gold_inventory ADD COLUMN IF NOT EXISTS days_until_expiry INT;
ALTER TABLE gold_inventory ADD COLUMN IF NOT EXISTS expiry_risk_level VARCHAR(20); -- 'low', 'medium', 'high', 'critical'
ALTER TABLE gold_inventory ADD COLUMN IF NOT EXISTS consumption_rate_daily DECIMAL(10,2);
ALTER TABLE gold_inventory ADD COLUMN IF NOT EXISTS projected_consumption_by_expiry INT;
ALTER TABLE gold_inventory ADD COLUMN IF NOT EXISTS waste_risk BOOLEAN DEFAULT FALSE;

-- New table: expiry_risk_analysis
CREATE TABLE gold_expiry_risk_analysis (
    analysis_id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    site_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100),
    current_quantity INT,
    expiry_date DATE,
    days_until_expiry INT,
    daily_consumption_rate DECIMAL(10,2),
    projected_usage_by_expiry INT,
    projected_waste_quantity INT,
    waste_value_usd DECIMAL(12,2),
    recommended_action VARCHAR(100), -- 'monitor', 'accelerate_usage', 'transfer', 'write_off'
    transfer_candidate_sites VARCHAR(500)[], -- Array of site_ids
    potential_savings_usd DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id)
);

-- New table: waste_prevention_actions
CREATE TABLE gold_waste_prevention_actions (
    action_id SERIAL PRIMARY KEY,
    analysis_id INT NOT NULL,
    action_type VARCHAR(100), -- 'inter_site_transfer', 'return_to_depot', 'accelerate_enrollment', 'write_off'
    action_status VARCHAR(50), -- 'recommended', 'approved', 'in_progress', 'completed', 'cancelled'
    expected_waste_reduction_quantity INT,
    expected_savings_usd DECIMAL(12,2),
    actual_waste_reduction_quantity INT,
    actual_savings_usd DECIMAL(12,2),
    initiated_date DATE,
    completed_date DATE,
    initiated_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES gold_expiry_risk_analysis(analysis_id)
);
```

---

### Scenario 6: Customs Delay Mitigation
**User Story:**
> "As a TSM, when a critical shipment is stuck in customs, I want Sally to suggest nearby depot stock as emergency backup and auto-draft emails to customs broker and site, so we have a contingency plan."

**Situation:**
- Shipment #SH-7734 to Site 401 (São Paulo): Stuck in customs for 5 days
- Expected clearance: Unknown (Brazilian customs backlog)
- Site 401 inventory: 8 days remaining
- Nearest depot: Buenos Aires (2,400km, 3-day transit if air freight)
- Depot stock: 200 kits available

**What Sally Does:**
1. **Detects customs delay** (shipment tracking)
2. **Calculates site runway** (8 days inventory)
3. **Identifies risk window** (clearance + transit = uncertain)
4. **Searches alternative sources** (depots, nearby sites)
5. **Proposes contingency plan** (emergency air shipment from Buenos Aires)
6. **Drafts broker escalation email**
7. **Drafts site notification** with backup plan
8. **Calculates cost impact** (air freight premium)

**Database Requirements:**
```sql
-- Enhanced gold_shipments for customs tracking
ALTER TABLE gold_shipments ADD COLUMN IF NOT EXISTS customs_status VARCHAR(50); -- 'not_applicable', 'pending', 'in_clearance', 'cleared', 'delayed', 'held'
ALTER TABLE gold_shipments ADD COLUMN IF NOT EXISTS customs_entry_date DATE;
ALTER TABLE gold_shipments ADD COLUMN IF NOT EXISTS customs_clearance_date DATE;
ALTER TABLE gold_shipments ADD COLUMN IF NOT EXISTS days_in_customs INT;
ALTER TABLE gold_shipments ADD COLUMN IF NOT EXISTS customs_broker_name VARCHAR(200);
ALTER TABLE gold_shipments ADD COLUMN IF NOT EXISTS customs_delay_reason TEXT;

-- New table: customs_incidents
CREATE TABLE gold_customs_incidents (
    incident_id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    customs_location VARCHAR(200),
    entry_date DATE NOT NULL,
    expected_clearance_date DATE,
    actual_clearance_date DATE,
    delay_days INT,
    delay_severity VARCHAR(20), -- 'minor', 'moderate', 'major', 'critical'
    delay_reason TEXT,
    documentation_issues TEXT[],
    broker_name VARCHAR(200),
    broker_contact VARCHAR(200),
    resolution_actions TEXT[],
    escalation_level INT DEFAULT 0, -- 0=none, 1=broker, 2=local_agent, 3=regulatory
    financial_impact_usd DECIMAL(10,2),
    contingency_plan TEXT,
    contingency_activated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES gold_shipments(shipment_id)
);

-- New table: depot_inventory (for emergency backup)
CREATE TABLE gold_depot_inventory (
    depot_inventory_id SERIAL PRIMARY KEY,
    depot_id VARCHAR(50) NOT NULL,
    depot_name VARCHAR(200) NOT NULL,
    depot_location VARCHAR(200),
    country_code VARCHAR(10),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    product_name VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100),
    quantity_available INT,
    expiry_date DATE,
    storage_conditions VARCHAR(100),
    can_ship_internationally BOOLEAN DEFAULT TRUE,
    lead_time_days INT DEFAULT 7,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_depot_inventory_product ON gold_depot_inventory(product_name);
CREATE INDEX idx_depot_inventory_location ON gold_depot_inventory(country_code);
```

---

### Scenario 7: Protocol Deviation Impact Analysis
**User Story:**
> "As a TSM, when a protocol deviation occurs (e.g., wrong dosage dispensed), I want Sally to immediately assess impact on drug supply, suggest corrective actions, and draft incident report, so we can respond quickly."

**Situation:**
- Site 505 (Mumbai): Subject #505-024 received 200mg instead of 100mg
- Caused by: Pharmacist dispensed wrong kit
- Impact: -1 extra 200mg kit consumed, +1 unused 100mg kit
- Remaining 200mg kits: 12 (now critically low)
- Protocol requires: Replacement dose at next visit (14 days)

**What Sally Does:**
1. **Receives deviation alert** from CTMS
2. **Analyzes supply impact** (inventory reduction)
3. **Checks replacement availability** for next visit
4. **Assesses criticality** (low stock of 200mg)
5. **Suggests emergency order** if needed
6. **Drafts deviation report** with supply section
7. **Updates dosing schedule** for affected subject
8. **Notifies site coordinator**

**Database Requirements:**
```sql
-- Enhanced gold_protocol_deviations table
ALTER TABLE gold_protocol_deviations ADD COLUMN IF NOT EXISTS supply_impact BOOLEAN DEFAULT FALSE;
ALTER TABLE gold_protocol_deviations ADD COLUMN IF NOT EXISTS affected_product VARCHAR(200);
ALTER TABLE gold_protocol_deviations ADD COLUMN IF NOT EXISTS quantity_impact INT; -- +/- from expected
ALTER TABLE gold_protocol_deviations ADD COLUMN IF NOT EXISTS replacement_required BOOLEAN DEFAULT FALSE;
ALTER TABLE gold_protocol_deviations ADD COLUMN IF NOT EXISTS replacement_deadline DATE;
ALTER TABLE gold_protocol_deviations ADD COLUMN IF NOT EXISTS supply_criticality VARCHAR(20); -- 'none', 'low', 'medium', 'high', 'critical'

-- New table: deviation_supply_actions
CREATE TABLE gold_deviation_supply_actions (
    action_id SERIAL PRIMARY KEY,
    deviation_id INT NOT NULL,
    subject_id VARCHAR(50),
    site_id VARCHAR(50),
    affected_product VARCHAR(200),
    deviation_date DATE,
    action_type VARCHAR(100), -- 'emergency_order', 'kit_replacement', 'inventory_adjustment', 'transfer_request'
    action_description TEXT,
    action_status VARCHAR(50), -- 'identified', 'planned', 'in_progress', 'completed'
    required_by_date DATE,
    completed_date DATE,
    assigned_to VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deviation_id) REFERENCES gold_protocol_deviations(deviation_id),
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id)
);
```

---

### Scenario 8: Study Enrollment Milestone Trigger
**User Story:**
> "As a TSM, when a study reaches 50% enrollment, I want Sally to automatically recalculate total supply needs, suggest bulk ordering for cost savings, and project final drug requirements, so I can optimize procurement."

**Situation:**
- Study ABC-301: Just enrolled subject #150 (50% of 300 target)
- Actual enrollment rate: Faster than expected (8 months vs planned 12)
- Projected completion: 4 months early
- Current supply strategy: Quarterly orders
- Opportunity: Bulk order for final 50% could save 15% ($450K)

**What Sally Does:**
1. **Detects enrollment milestone** (50% reached)
2. **Recalculates enrollment trajectory** (revised timeline)
3. **Projects total drug requirements** with confidence bands
4. **Analyzes ordering strategies:**
   - Current quarterly approach: $3M total
   - Bulk order for remaining: $2.55M (15% savings)
5. **Compares scenarios** (cost, risk, storage)
6. **Recommends optimal strategy**
7. **Drafts business case memo** with analysis
8. **Generates PO requisition** if approved

**Database Requirements:**
```sql
-- New table: enrollment_milestones
CREATE TABLE gold_enrollment_milestones (
    milestone_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) NOT NULL,
    milestone_type VARCHAR(100), -- 'first_patient_in', '25%', '50%', '75%', 'last_patient_in', 'last_patient_out'
    milestone_name VARCHAR(200),
    target_date DATE,
    actual_date DATE,
    variance_days INT,
    current_enrollment_count INT,
    target_enrollment_count INT,
    enrollment_percentage DECIMAL(5,2),
    days_ahead_behind INT, -- negative = behind, positive = ahead
    supply_implications TEXT,
    recommended_actions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- New table: procurement_optimization_scenarios
CREATE TABLE gold_procurement_optimization_scenarios (
    scenario_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) NOT NULL,
    analysis_date DATE NOT NULL,
    scenario_name VARCHAR(200),
    scenario_type VARCHAR(100), -- 'current_strategy', 'bulk_order', 'phased_ordering', 'just_in_time'
    projected_enrollment_completion_date DATE,
    total_drug_requirement_kits INT,
    total_cost_usd DECIMAL(12,2),
    ordering_frequency VARCHAR(100), -- 'monthly', 'quarterly', 'one_time', etc.
    storage_cost_usd DECIMAL(10,2),
    waste_risk_percentage DECIMAL(5,2),
    supply_risk_score INT, -- 0-100
    cost_savings_vs_baseline_usd DECIMAL(12,2),
    recommended BOOLEAN DEFAULT FALSE,
    recommendation_rationale TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- New table: bulk_order_recommendations
CREATE TABLE gold_bulk_order_recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    recommended_date DATE NOT NULL,
    recommended_quantity INT,
    unit_cost_usd DECIMAL(10,2),
    total_cost_usd DECIMAL(12,2),
    cost_savings_percentage DECIMAL(5,2),
    savings_amount_usd DECIMAL(12,2),
    rationale TEXT,
    risk_factors TEXT[],
    mitigation_strategies TEXT[],
    approval_status VARCHAR(50), -- 'pending', 'approved', 'rejected', 'implemented'
    approved_by VARCHAR(100),
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);
```

---

### Scenario 9: Adverse Event Supply Impact
**User Story:**
> "As a TSM, when a serious adverse event causes subject discontinuation, I want Sally to immediately adjust dosing forecasts, identify excess supply at that site, and suggest redistribution, so we optimize inventory."

**Situation:**
- Site 602 (Singapore): Subject #602-041 discontinued due to SAE
- Subject was in 200mg arm, 12 weeks into 52-week study
- Remaining treatment: 40 weeks × 200mg dose = 40 kits unused
- Site 602: Only 3 other subjects in 200mg arm (low demand)
- Site 607 (Hong Kong): 12 subjects in 200mg arm (high demand)
- Transfer time: 2 days

**What Sally Does:**
1. **Receives AE notification** from CTMS (subject discontinued)
2. **Calculates excess supply** (40 kits no longer needed)
3. **Analyzes site demand** (Site 602 low, Site 607 high)
4. **Suggests transfer** to high-demand site
5. **Updates demand forecasts** for both sites
6. **Adjusts next order quantities**
7. **Drafts transfer documentation**

**Database Requirements:**
```sql
-- Enhanced gold_adverse_events table
ALTER TABLE gold_adverse_events ADD COLUMN IF NOT EXISTS subject_discontinued BOOLEAN DEFAULT FALSE;
ALTER TABLE gold_adverse_events ADD COLUMN IF NOT EXISTS discontinuation_date DATE;
ALTER TABLE gold_adverse_events ADD COLUMN IF NOT EXISTS treatment_arm VARCHAR(100);
ALTER TABLE gold_adverse_events ADD COLUMN IF NOT EXISTS remaining_treatment_weeks INT;
ALTER TABLE gold_adverse_events ADD COLUMN IF NOT EXISTS supply_impact_kits INT;
ALTER TABLE gold_adverse_events ADD COLUMN IF NOT EXISTS excess_supply_value_usd DECIMAL(10,2);

-- New table: supply_adjustments
CREATE TABLE gold_supply_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    adjustment_date DATE NOT NULL,
    adjustment_reason VARCHAR(200), -- 'subject_discontinuation', 'enrollment_slowdown', 'protocol_amendment', etc.
    affected_product VARCHAR(200),
    quantity_adjustment INT, -- +/- adjustment
    previous_forecast_quantity INT,
    new_forecast_quantity INT,
    financial_impact_usd DECIMAL(10,2),
    recommended_actions TEXT[],
    implemented_actions TEXT[],
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);
```

---

### Scenario 10: Global Supply Chain Disruption
**User Story:**
> "As a TSM, when a major disruption occurs (e.g., port strike, pandemic), I want Sally to immediately assess impact across all studies, identify at-risk sites, and suggest mitigation strategies, so I can respond to the crisis."

**Situation:**
- News Alert: Port of Shanghai closed due to typhoon (7-10 days)
- Impact: 8 shipments in transit or planned to/from Shanghai
- Affected sites: 12 sites across 4 studies in China/Asia
- Inventory at affected sites: 15-30 days remaining
- Lead time through Shanghai: 21 days normally

**What Sally Does:**
1. **Monitors news/alerts** for disruptions (API integration)
2. **Maps impact** (all shipments through affected region)
3. **Assesses criticality** (site inventory vs disruption duration)
4. **Identifies alternative routes** (Hong Kong, Seoul ports)
5. **Calculates cost premium** for alternatives
6. **Prioritizes sites by urgency**
7. **Suggests rerouting plan** for each shipment
8. **Drafts crisis communication** to stakeholders
9. **Updates all forecasts** with new lead times

**Database Requirements:**
```sql
-- New table: supply_chain_disruptions
CREATE TABLE gold_supply_chain_disruptions (
    disruption_id SERIAL PRIMARY KEY,
    disruption_name VARCHAR(200) NOT NULL,
    disruption_type VARCHAR(100), -- 'port_closure', 'weather', 'pandemic', 'political', 'natural_disaster', 'strike'
    affected_region VARCHAR(200),
    affected_countries VARCHAR(100)[],
    start_date DATE NOT NULL,
    estimated_end_date DATE,
    actual_end_date DATE,
    severity_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    affected_shipments_count INT,
    affected_sites_count INT,
    affected_studies_count INT,
    estimated_financial_impact_usd DECIMAL(12,2),
    mitigation_strategy TEXT,
    status VARCHAR(50), -- 'active', 'monitoring', 'resolved'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: disruption_impact_assessment
CREATE TABLE gold_disruption_impact_assessment (
    assessment_id SERIAL PRIMARY KEY,
    disruption_id INT NOT NULL,
    site_id VARCHAR(50) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    current_inventory_days INT,
    shipments_delayed_count INT,
    estimated_stockout_date DATE,
    criticality_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    recommended_actions TEXT[],
    alternative_routes TEXT[],
    cost_premium_usd DECIMAL(10,2),
    action_taken TEXT,
    action_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disruption_id) REFERENCES gold_supply_chain_disruptions(disruption_id),
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);
```

---

### Scenario 11: Regulatory Inspection Readiness
**User Story:**
> "As a TSM, when a site is notified of an upcoming regulatory inspection, I want Sally to automatically compile all supply chain documentation, identify any gaps, and create an inspection readiness report, so we're prepared."

**Situation:**
- Site 705 (Tokyo): FDA inspection in 14 days
- Inspection scope: Drug accountability and temperature monitoring
- Documents needed: 6 months of records
- Sally must verify: All shipments documented, temp logs complete, no discrepancies

**What Sally Does:**
1. **Receives inspection notification**
2. **Compiles supply documentation:**
   - All shipment records (inbound/outbound)
   - Temperature logs and excursions
   - Inventory reconciliation reports
   - Dispensation logs
   - Transfer records
   - Destruction records
3. **Identifies gaps** (missing signatures, incomplete logs)
4. **Generates inspection checklist**
5. **Creates summary report** with key metrics
6. **Flags any discrepancies** for resolution
7. **Drafts site notification** with action items

**Database Requirements:**
```sql
-- New table: regulatory_inspections
CREATE TABLE gold_regulatory_inspections (
    inspection_id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    study_id VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(100), -- 'FDA', 'EMA', 'PMDA', 'sponsor_audit', 'internal_audit'
    notification_date DATE NOT NULL,
    scheduled_date DATE,
    actual_date DATE,
    inspection_scope TEXT[],
    inspection_status VARCHAR(50), -- 'notified', 'preparing', 'in_progress', 'completed'
    documents_required TEXT[],
    findings_summary TEXT,
    observations_count INT,
    critical_findings_count INT,
    major_findings_count INT,
    minor_findings_count INT,
    readiness_score INT, -- 0-100
    gaps_identified TEXT[],
    corrective_actions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES gold_sites(site_id),
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- New table: inspection_documentation
CREATE TABLE gold_inspection_documentation (
    doc_id SERIAL PRIMARY KEY,
    inspection_id INT NOT NULL,
    document_type VARCHAR(100), -- 'shipment_record', 'temp_log', 'inventory_reconciliation', etc.
    document_reference VARCHAR(200),
    start_date DATE,
    end_date DATE,
    completeness_status VARCHAR(50), -- 'complete', 'incomplete', 'missing'
    gaps_description TEXT,
    verified_by VARCHAR(100),
    verified_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES gold_regulatory_inspections(inspection_id)
);
```

---

### Scenario 12: Cost Optimization Through Consolidation
**User Story:**
> "As a TSM, at month-end, I want Sally to analyze all planned orders, identify consolidation opportunities across studies, and calculate bulk discount savings, so I can optimize procurement costs."

**Situation:**
- Month-end: 4 separate orders planned for same product (Drug X)
  - Study A: 500 kits
  - Study B: 750 kits
  - Study C: 300 kits
  - Study D: 450 kits
- Individual orders: $250/kit
- Consolidated order (2,000 kits): $215/kit (14% discount)
- Potential savings: $70,000

**What Sally Does:**
1. **Reviews all planned orders** for month
2. **Identifies same products** across studies
3. **Calculates bulk discount potential**
4. **Verifies timing compatibility** (all needed within same week)
5. **Suggests consolidation** with savings breakdown
6. **Allocates costs** to individual studies
7. **Generates consolidated PO**
8. **Drafts approval memo** with business case

**Database Requirements:**
```sql
-- New table: procurement_plans
CREATE TABLE gold_procurement_plans (
    plan_id SERIAL PRIMARY KEY,
    study_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    planned_order_date DATE NOT NULL,
    planned_delivery_date DATE,
    quantity_required INT,
    unit_cost_usd DECIMAL(10,2),
    total_cost_usd DECIMAL(12,2),
    order_priority VARCHAR(50), -- 'routine', 'urgent', 'critical'
    consolidation_candidate BOOLEAN DEFAULT FALSE,
    consolidation_group_id INT,
    order_status VARCHAR(50), -- 'planned', 'approved', 'ordered', 'delivered', 'cancelled'
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES gold_studies(study_id)
);

-- New table: consolidation_opportunities
CREATE TABLE gold_consolidation_opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    consolidation_period VARCHAR(50), -- 'weekly', 'monthly'
    individual_orders_count INT,
    total_quantity INT,
    individual_cost_total_usd DECIMAL(12,2),
    consolidated_cost_total_usd DECIMAL(12,2),
    savings_amount_usd DECIMAL(12,2),
    savings_percentage DECIMAL(5,2),
    affected_studies VARCHAR(100)[],
    recommended BOOLEAN DEFAULT FALSE,
    recommendation_rationale TEXT,
    implementation_status VARCHAR(50), -- 'identified', 'proposed', 'approved', 'implemented'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧠 AI/ML Architecture for Scenarios

### RAG (Retrieval Augmented Generation) vs LangChain vs LangGraph

**Recommendation: Use LangGraph with RAG**

#### Why LangGraph?
1. **State Management**: Complex TSM scenarios require multi-step reasoning with state
2. **Branching Logic**: Different scenarios need different execution paths
3. **Tool Calling**: Integrate database queries, calculations, document generation
4. **Memory**: Remember context across conversation turns
5. **Streaming**: Real-time updates for long-running analyses

#### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    User Query (Natural Language)             │
│          "Are any sites at risk of stock-outs?"            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Query Understanding (Gemini 2.0)              │
│  - Intent Classification (stock_risk_assessment)            │
│  - Entity Extraction (time_horizon: next_30_days)           │
│  - Scenario Identification (Scenario 3: Demand Surge)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LangGraph State Machine (Orchestration)         │
│                                                              │
│  State 1: Retrieve Context (RAG)                            │
│    ├─→ Vector DB: Similar past scenarios                   │
│    ├─→ SQL DB: Current inventory levels                    │
│    └─→ SQL DB: Enrollment rates, forecasts                 │
│                                                              │
│  State 2: Analysis (Tool Calling)                           │
│    ├─→ Calculate burn rates                                │
│    ├─→ Predict stock-out dates                             │
│    ├─→ Identify at-risk sites                              │
│    └─→ Rank by criticality                                 │
│                                                              │
│  State 3: Action Generation                                 │
│    ├─→ Suggest emergency orders                            │
│    ├─→ Propose inter-site transfers                        │
│    └─→ Draft communications                                │
│                                                              │
│  State 4: Document Creation                                 │
│    ├─→ Generate order requisitions                         │
│    ├─→ Draft emails to sites/vendors                       │
│    └─→ Create action tracking tickets                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Response Generation (Gemini 2.0)                │
│  - Natural language summary                                 │
│  - Visual dashboards (charts, tables)                       │
│  - Actionable recommendations                               │
│  - Draft documents for review                               │
└─────────────────────────────────────────────────────────────┘
```

---

### Vector Embeddings - When to Use

**✅ Use Vector Embeddings For:**

1. **Historical Scenario Matching**
   - User asks: "What should I do about late shipment from India?"
   - Vector search: Find similar past incidents and resolutions
   - Embedding: `text-embedding-004` (Google) or `text-embedding-3-large` (OpenAI)

2. **Document Search**
   - SOPs, protocols, regulatory guidelines
   - User asks: "What's the SOP for temperature excursions?"
   - Vector DB retrieves relevant sections

3. **Contextual Q&A**
   - Multi-turn conversations
   - Remember what user discussed 5 minutes ago
   - Maintain conversation context

**❌ Don't Use Vector Embeddings For:**

1. **Structured Data Queries**
   - "How many sites have <10 days inventory?"
   - Use direct SQL - faster and more accurate

2. **Real-time Calculations**
   - Demand forecasts, risk scores
   - Use algorithms, not embeddings

3. **Exact Matches**
   - Shipment ID lookup
   - Use database indexes

---

### Recommended Tech Stack for AI System

```python
# requirements.txt
langchain==0.1.0
langgraph==0.0.20
langchain-google-genai==0.0.6
chromadb==0.4.20  # Vector database
sentence-transformers==2.2.2  # For embeddings
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
fastapi==0.104.1
pydantic==2.5.0
```

---

## 📝 Continued in next file...

**This is Part 1 of Intelligent Scenarios Guide**

Next sections:
- Morning Brief Design (Scenario-Driven)
- Evening Summary Design (Action-Tracking)
- RAG Implementation Details
- LangGraph State Machine Code
- Demo Data Generation Script
- Frontend Component Designs

Would you like me to continue with these sections?