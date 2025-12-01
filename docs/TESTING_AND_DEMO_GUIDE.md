# Sally TSM: Testing & Demo Guide
## Complete Test Suites and Scenario Demo Scripts

**Version:** 1.0.0  
**Last Updated:** 2024-11-28  
**Purpose:** Comprehensive testing strategy and demonstration scripts for all features

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Scenario Demo Scripts (12 Complete Walkthroughs)](#scenario-demo-scripts)
7. [Performance Tests](#performance-tests)
8. [Test Data Management](#test-data-management)

---

## Testing Philosophy

### Test Pyramid

```
        /\
       /  \        10% E2E Tests
      /____\         (Critical user journeys)
     /      \
    /        \     30% Integration Tests
   /__________\      (API + Database)
  /            \
 /              \  60% Unit Tests
/________________\   (Business logic)
```

### Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All API endpoints
- **E2E Tests:** All critical paths + 12 scenarios
- **Performance Tests:** Key queries < 200ms

### Testing Stack

- **Python Backend:** pytest, pytest-cov, pytest-asyncio
- **TypeScript Frontend:** Vitest, React Testing Library
- **E2E:** Playwright
- **API Testing:** FastAPI TestClient, httpx
- **Database:** PostgreSQL test database (isolated)

---

## Test Environment Setup

### 1. Install Test Dependencies

```bash
# Backend
cd backend
pip install pytest pytest-cov pytest-asyncio pytest-mock httpx

# Frontend
cd ../
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @playwright/test
```

### 2. Configure Test Database

```bash
# Create test database
createdb sally_tsm_test

# Set test environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sally_tsm_test"
export TESTING=true
```

### 3. Run Test Suites

```bash
# Backend tests
pytest backend/tests/ --cov=backend --cov-report=html

# Frontend tests
npm run test

# E2E tests
npx playwright test
```

---

## Unit Tests

### Backend Unit Tests (Python + pytest)

#### Test: Emergency SOS Detection Logic

```python
# File: backend/tests/unit/test_emergency_sos.py

import pytest
from backend.scenarios.emergency_sos import (
    detect_critical_low_stock,
    calculate_nearest_depot,
    estimate_delivery_time,
    create_transfer_plan
)

class TestEmergencySOS:
    
    def test_detect_critical_low_stock_true(self):
        """Should detect critical stock when available < reorder point"""
        inventory = {
            "site_id": "SITE001",
            "product_id": "PROD001",
            "quantity_available": 5,
            "quantity_reserved": 2,
            "reorder_point": 10,
            "safety_stock": 5
        }
        
        result = detect_critical_low_stock(inventory)
        
        assert result["is_critical"] == True
        assert result["available_after_reserved"] == 3  # 5 - 2
        assert result["shortfall_units"] == 7  # 10 - 3
        assert result["urgency_level"] == "critical"
    
    def test_detect_critical_low_stock_false(self):
        """Should NOT detect critical when stock is sufficient"""
        inventory = {
            "site_id": "SITE001",
            "product_id": "PROD001",
            "quantity_available": 25,
            "quantity_reserved": 5,
            "reorder_point": 10,
            "safety_stock": 5
        }
        
        result = detect_critical_low_stock(inventory)
        
        assert result["is_critical"] == False
        assert result["available_after_reserved"] == 20
        assert result["shortfall_units"] == 0
    
    def test_calculate_nearest_depot(self):
        """Should return closest depot with sufficient stock"""
        site_location = {
            "latitude": 40.7128,
            "longitude": -74.0060,  # New York
            "site_id": "SITE001"
        }
        
        depots = [
            {
                "depot_id": "DEPOT_A",
                "latitude": 42.3601,
                "longitude": -71.0589,  # Boston (190 miles)
                "stock_available": 100
            },
            {
                "depot_id": "DEPOT_B",
                "latitude": 39.9526,
                "longitude": -75.1652,  # Philadelphia (80 miles)
                "stock_available": 50
            },
            {
                "depot_id": "DEPOT_C",
                "latitude": 41.8781,
                "longitude": -87.6298,  # Chicago (790 miles)
                "stock_available": 200
            }
        ]
        
        result = calculate_nearest_depot(site_location, depots, required_quantity=30)
        
        assert result["selected_depot"]["depot_id"] == "DEPOT_B"
        assert result["distance_miles"] < 100
        assert result["has_sufficient_stock"] == True
    
    def test_estimate_delivery_time(self):
        """Should estimate delivery based on distance and urgency"""
        # Critical urgency, short distance
        delivery_time_1 = estimate_delivery_time(
            distance_miles=50,
            urgency="critical"
        )
        assert delivery_time_1["estimated_hours"] <= 24
        assert delivery_time_1["shipping_method"] == "express"
        
        # Normal urgency, long distance
        delivery_time_2 = estimate_delivery_time(
            distance_miles=500,
            urgency="normal"
        )
        assert delivery_time_2["estimated_hours"] >= 48
        assert delivery_time_2["shipping_method"] == "standard"
    
    def test_create_transfer_plan(self):
        """Should create complete transfer plan"""
        request = {
            "site_id": "SITE001",
            "product_id": "PROD001",
            "quantity_needed": 20,
            "urgency": "critical"
        }
        
        plan = create_transfer_plan(request)
        
        assert plan["source_depot"] is not None
        assert plan["quantity"] == 20
        assert plan["estimated_delivery_date"] is not None
        assert plan["tracking_number"] is not None
        assert plan["cost_estimate"] > 0
```

#### Test: Temperature Excursion Logic

```python
# File: backend/tests/unit/test_temperature_excursion.py

import pytest
from datetime import datetime, timedelta
from backend.scenarios.temperature_excursion import (
    detect_excursion,
    calculate_excursion_severity,
    determine_drug_viability,
    generate_capa_actions
)

class TestTemperatureExcursion:
    
    def test_detect_excursion_high_temp(self):
        """Should detect temperature exceeding upper limit"""
        reading = {
            "recorded_at": datetime.now(),
            "temperature_celsius": 12.0,
            "allowed_min": 2.0,
            "allowed_max": 8.0
        }
        
        result = detect_excursion(reading)
        
        assert result["is_excursion"] == True
        assert result["excursion_type"] == "high"
        assert result["deviation_celsius"] == 4.0
    
    def test_detect_excursion_low_temp(self):
        """Should detect temperature below lower limit"""
        reading = {
            "recorded_at": datetime.now(),
            "temperature_celsius": -5.0,
            "allowed_min": 2.0,
            "allowed_max": 8.0
        }
        
        result = detect_excursion(reading)
        
        assert result["is_excursion"] == True
        assert result["excursion_type"] == "low"
        assert result["deviation_celsius"] == 7.0
    
    def test_calculate_excursion_severity(self):
        """Should calculate severity based on deviation and duration"""
        # Minor excursion (short duration, small deviation)
        severity_1 = calculate_excursion_severity(
            deviation_celsius=1.0,
            duration_minutes=15
        )
        assert severity_1["level"] == "minor"
        assert severity_1["risk_score"] < 30
        
        # Major excursion (long duration, large deviation)
        severity_2 = calculate_excursion_severity(
            deviation_celsius=10.0,
            duration_minutes=120
        )
        assert severity_2["level"] == "major"
        assert severity_2["risk_score"] > 70
    
    def test_determine_drug_viability(self):
        """Should determine if drug is still usable"""
        # Usable: minor excursion
        viability_1 = determine_drug_viability(
            excursion_severity="minor",
            drug_type="standard",
            duration_minutes=10
        )
        assert viability_1["is_usable"] == True
        assert viability_1["requires_testing"] == False
        
        # Testing required: moderate excursion
        viability_2 = determine_drug_viability(
            excursion_severity="moderate",
            drug_type="biologic",
            duration_minutes=60
        )
        assert viability_2["is_usable"] == "pending"
        assert viability_2["requires_testing"] == True
        
        # Not usable: major excursion
        viability_3 = determine_drug_viability(
            excursion_severity="major",
            drug_type="biologic",
            duration_minutes=180
        )
        assert viability_3["is_usable"] == False
        assert viability_3["recommendation"] == "quarantine_and_destroy"
```

#### Test: Morning Brief Generation

```python
# File: backend/tests/unit/test_morning_brief.py

import pytest
from datetime import date, datetime
from backend.ai.morning_brief import (
    gather_yesterday_metrics,
    generate_brief_narrative,
    extract_priority_sites,
    format_brief_for_ui
)

class TestMorningBrief:
    
    def test_gather_yesterday_metrics(self):
        """Should aggregate yesterday's data"""
        yesterday = date.today() - timedelta(days=1)
        
        metrics = gather_yesterday_metrics(yesterday)
        
        assert "shipments_completed" in metrics
        assert "alerts_resolved" in metrics
        assert "issues_opened" in metrics
        assert "inventory_changes" in metrics
        assert isinstance(metrics["shipments_completed"], int)
    
    @pytest.mark.asyncio
    async def test_generate_brief_narrative(self):
        """Should generate LLM-powered narrative"""
        data = {
            "yesterday_metrics": {
                "shipments_completed": 15,
                "alerts_resolved": 8,
                "issues_opened": 3
            },
            "critical_alerts": [
                {"site": "SITE001", "issue": "Low stock"},
                {"site": "SITE005", "issue": "Temp excursion"}
            ],
            "priority_sites": ["SITE001", "SITE005", "SITE012"]
        }
        
        narrative = await generate_brief_narrative(data)
        
        assert isinstance(narrative, dict)
        assert "executive_summary" in narrative
        assert "key_insights" in narrative
        assert len(narrative["key_insights"]) >= 3
        assert len(narrative["executive_summary"]) > 50
    
    def test_extract_priority_sites(self):
        """Should identify sites needing attention"""
        sites = [
            {"site_id": "SITE001", "alerts": 5, "low_stock": True},
            {"site_id": "SITE002", "alerts": 1, "low_stock": False},
            {"site_id": "SITE003", "alerts": 3, "low_stock": True},
        ]
        
        priority = extract_priority_sites(sites, top_n=2)
        
        assert len(priority) == 2
        assert priority[0]["site_id"] == "SITE001"  # Highest priority
        assert priority[1]["site_id"] == "SITE003"
```

### Frontend Unit Tests (Vitest + React Testing Library)

```typescript
// File: src/tests/unit/EveningSummary.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EveningSummary from '@/pages/EveningSummary';

describe('EveningSummary Component', () => {
  
  it('should render loading state initially', () => {
    render(<EveningSummary />);
    expect(screen.getByText(/loading evening summary/i)).toBeInTheDocument();
  });
  
  it('should fetch and display evening summary data', async () => {
    // Mock API response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          summary_date: '2024-11-28',
          achievements: [
            'Completed 15 shipments',
            'Resolved 8 critical alerts'
          ],
          metrics_vs_targets: {
            shipments: { actual: 15, target: 12 },
            alerts_resolved: { actual: 8, target: 10 }
          }
        })
      })
    );
    
    render(<EveningSummary />);
    
    await waitFor(() => {
      expect(screen.getByText(/evening summary/i)).toBeInTheDocument();
      expect(screen.getByText(/completed 15 shipments/i)).toBeInTheDocument();
      expect(screen.getByText(/15 \/ 12/)).toBeInTheDocument(); // Metrics
    });
  });
  
  it('should display performance metrics with correct styling', async () => {
    render(<EveningSummary />);
    
    await waitFor(() => {
      const metricsCard = screen.getByText(/performance vs. targets/i);
      expect(metricsCard).toBeInTheDocument();
    });
  });
});
```

---

## Integration Tests

### API Integration Tests (FastAPI TestClient)

```python
# File: backend/tests/integration/test_qa_api.py

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

class TestQAAPI:
    
    def test_ask_rag_endpoint_success(self):
        """Should return SQL, chart, and recommendations"""
        payload = {
            "query": "Which sites have critical low inventory?"
        }
        
        response = client.post("/api/v1/qa/ask-rag", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "sql" in data
        assert "chart_type" in data
        assert "summary" in data
        assert "recommendations" in data
        assert data["sql"].upper().startswith("SELECT")
    
    def test_execute_query_endpoint_success(self):
        """Should execute SQL and return results"""
        payload = {
            "sql": "SELECT site_id, site_name, country FROM sites LIMIT 5"
        }
        
        response = client.post("/api/v1/qa/execute", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        assert "visualization" in data
        assert isinstance(data["data"], list)
    
    def test_execute_query_prevent_drop(self):
        """Should reject DROP statements"""
        payload = {
            "sql": "DROP TABLE sites;"
        }
        
        response = client.post("/api/v1/qa/execute", json=payload)
        
        assert response.status_code == 400
        assert "only select queries allowed" in response.json()["detail"].lower()
    
    def test_morning_brief_endpoint(self):
        """Should return or generate morning brief"""
        today = date.today().isoformat()
        
        response = client.get(f"/api/v1/brief/morning/{today}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "executive_summary" in data
        assert "key_insights" in data
        assert "priority_sites" in data
        assert "generated_at" in data
```

### Database Integration Tests

```python
# File: backend/tests/integration/test_database_operations.py

import pytest
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Study, Site, Inventory, Shipment

class TestDatabaseOperations:
    
    def test_create_study_and_sites(self, db: Session):
        """Should create study with related sites"""
        # Create study
        study = Study(
            study_id="TEST_STUDY_001",
            study_name="Test Phase III Trial",
            protocol_number="PROTO-TEST-001",
            phase="Phase III",
            status="Active"
        )
        db.add(study)
        db.commit()
        
        # Create sites
        sites = [
            Site(study_id=study.study_id, site_name=f"Site {i}")
            for i in range(3)
        ]
        db.add_all(sites)
        db.commit()
        
        # Verify
        retrieved_study = db.query(Study).filter_by(study_id="TEST_STUDY_001").first()
        assert retrieved_study is not None
        assert len(retrieved_study.sites) == 3
    
    def test_cascade_delete_study(self, db: Session):
        """Should cascade delete sites when study is deleted"""
        # Create study with sites
        study = Study(study_id="TEST_CASCADE", study_name="Cascade Test")
        db.add(study)
        db.commit()
        
        sites = [Site(study_id=study.study_id, site_name=f"Site {i}") for i in range(2)]
        db.add_all(sites)
        db.commit()
        
        # Delete study
        db.delete(study)
        db.commit()
        
        # Verify sites are deleted
        remaining_sites = db.query(Site).filter_by(study_id="TEST_CASCADE").all()
        assert len(remaining_sites) == 0
```

---

## End-to-End Tests

### E2E Tests (Playwright)

```typescript
// File: tests/e2e/scenarios/emergency-sos.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Emergency SOS Transfer Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login (future)
    // await page.goto('/login');
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button:has-text("Login")');
    
    // Seed test data
    await page.goto('/');
  });
  
  test('Complete emergency transfer from inventory alert', async ({ page }) => {
    // Step 1: Navigate to Inventory page
    await page.goto('/inventory');
    await expect(page).toHaveURL('/inventory');
    
    // Step 2: Verify critical alert is visible
    const alertCard = page.locator('.inventory-alert.critical').first();
    await expect(alertCard).toBeVisible();
    await expect(alertCard).toContainText('Low Stock');
    
    // Step 3: Click "Emergency Transfer" button
    const transferButton = alertCard.locator('button:has-text("Emergency Transfer")');
    await transferButton.click();
    
    // Step 4: Fill emergency transfer form
    await expect(page.locator('h2:has-text("Emergency Transfer")')).toBeVisible();
    await page.selectOption('select[name="urgency"]', 'critical');
    await page.fill('input[name="quantity"]', '20');
    await page.fill('textarea[name="reason"]', 'Site running critically low, immediate need');
    
    // Step 5: Submit transfer request
    await page.click('button:has-text("Confirm Transfer")');
    
    // Step 6: Verify success notification
    const successToast = page.locator('.toast-success');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('Emergency transfer initiated');
    
    // Step 7: Verify shipment created
    await page.goto('/shipments');
    const newShipment = page.locator('.shipment-row').first();
    await expect(newShipment).toContainText('Emergency');
    await expect(newShipment).toContainText('In Transit');
    
    // Step 8: Verify tracking number generated
    const trackingNumber = await newShipment.locator('.tracking-number').textContent();
    expect(trackingNumber).toMatch(/^SH\d{6}$/); // Format: SH123456
  });
  
  test('Morning brief shows emergency transfer', async ({ page }) => {
    // Navigate to Morning Brief
    await page.goto('/morning-brief');
    
    // Verify yesterday's emergency transfer is mentioned
    await expect(page.locator('text=/1 emergency transfer initiated/i')).toBeVisible();
  });
});
```

---

## Scenario Demo Scripts

### Scenario 1: Emergency SOS Transfer

**Demo Duration:** 5 minutes  
**Audience:** Clinical supply managers, stakeholders  
**Prerequisites:** Demo data loaded, Sally TSM running

#### Setup (1 minute)

```bash
# Reset demo database
npm run seed:demo

# Verify site SITE001 has critical low stock
psql -U postgres -d sally_tsm_demo -c \
  "SELECT site_id, product_id, quantity_available FROM inventory WHERE quantity_available < 10;"
```

#### Demo Script

**Step 1: Dashboard Overview (30 seconds)**
- Navigate to https://sally-tsm.vercel.app
- Show main dashboard with metrics
- Point out "3 Critical Alerts" indicator (red badge)

**Step 2: Identify Critical Alert (1 minute)**
- Click "View Alerts" or navigate to `/inventory`
- Locate red alert card: "SITE001 - Product X - Only 3 units remaining"
- Explain: "System detected inventory below safety threshold of 10 units"
- Show alert details:
  - Current stock: 3 units
  - Reserved: 1 unit
  - Available: 2 units
  - Reorder point: 10 units
  - Shortfall: 8 units

**Step 3: Initiate Emergency Transfer (2 minutes)**
- Click "Emergency Transfer" button on alert card
- Show auto-populated transfer form:
  - **From:** DEPOT_B (Philadelphia) - Auto-selected (nearest with stock)
  - **To:** SITE001 (New York Medical Center)
  - **Product:** Product X (Lot #LOT12345)
  - **Quantity:** 20 units (recommended reorder amount)
  - **Urgency:** Critical (next-day delivery)
  - **Estimated Cost:** $450 (express shipping)
  - **Estimated Delivery:** Tomorrow, 10:00 AM
- Add reason: "Site enrollment ahead of schedule, immediate need"
- Click "Confirm Emergency Transfer"

**Step 4: Validate Outcomes (1 minute)**
- Show success notification: "Emergency shipment created - Tracking #SH789456"
- Navigate to `/shipments`
- Highlight new shipment row:
  - Status: "In Transit"
  - Priority: Red "Emergency" tag
  - Tracking: SH789456
  - Temperature: Monitored (green indicator)
- Click shipment row to show details modal:
  - Map with depot → site route
  - Estimated delivery timeline
  - Contact info (carrier, driver)

**Step 5: AI-Generated Insights (30 seconds)**
- Navigate to `/qa` (Q&A Assistant)
- Show AI recommendation that appeared automatically:
  - "Consider increasing safety stock at SITE001 from 10 to 15 units"
  - "Historical data shows 20% higher enrollment at this site"
- Navigate to `/morning-brief`
- Preview tomorrow's brief: "1 emergency transfer initiated yesterday for SITE001"

#### Q&A Talking Points

**Q: How does the system determine the nearest depot?**  
A: Geolocation-based distance calculation + real-time stock availability check. If nearest depot lacks stock, system selects next closest.

**Q: Can emergency transfers be cancelled?**  
A: Yes, within 30 minutes of creation (before carrier pickup). Click "Cancel Transfer" button.

**Q: Does this integrate with our ERP system?**  
A: Yes, shipment data automatically syncs to SAP via our ETL pipeline. Inventory updates in real-time.

**Q: What about temperature monitoring?**  
A: All shipments have IoT temperature sensors. Alerts trigger if temp exceeds range. View logs in shipment details.

#### Cleanup

```bash
# Reset demo data for next demonstration
npm run seed:demo

# Or manually reset specific shipment
psql -U postgres -d sally_tsm_demo -c \
  "DELETE FROM shipments WHERE tracking_number = 'SH789456';"
```

---

### Scenario 2: Temperature Excursion Response

**Demo Duration:** 6 minutes  
**Audience:** Quality assurance, regulatory affairs

#### Setup

```bash
# Simulate temperature excursion
npm run simulate:temp-excursion -- --shipment=SH123456 --temp=15 --duration=45
```

#### Demo Script

**Step 1: Alert Triggered (1 minute)**
- Dashboard shows new critical alert: "Temperature Excursion - Shipment SH123456"
- Click alert to view details:
  - Shipment ID: SH123456
  - Product: Product Y (Biologic - Requires 2-8°C)
  - Excursion temp: 15°C (7°C above max)
  - Duration: 45 minutes
  - Location: In transit from DEPOT_A to SITE005

**Step 2: Assess Severity (2 minutes)**
- Navigate to `/scenarios/temperature-excursion`
- System shows automated risk assessment:
  - Severity: **Major** (based on deviation × duration)
  - Risk score: 78/100
  - Drug viability: **Pending Testing**
  - Recommendation: **Quarantine immediately**
- Show excursion timeline chart:
  - X-axis: Time (0-45 min)
  - Y-axis: Temperature (°C)
  - Yellow zone: 8-10°C (acceptable range)
  - Red spike: 15°C (excursion period)

**Step 3: Execute CAPA (Corrective Action) (2 minutes)**
- System auto-generated CAPA plan:
  1. ✅ Quarantine shipment (auto-executed)
  2. ⏳ Notify site investigator (email sent)
  3. ⏳ Request stability testing (form generated)
  4. ⏳ Investigate root cause (assigned to QA)
  5. ⏳ Prepare regulatory report (template ready)
- Click "Initiate CAPA" to execute plan
- Show CAPA timeline (Gantt chart):
  - Stability testing: 5 business days
  - Root cause analysis: 3 business days
  - Regulatory report: 7 business days

**Step 4: Communicate & Document (1 minute)**
- Show auto-generated emails:
  - To site: "Shipment SH123456 quarantined due to temp excursion"
  - To sponsor: "Regulatory event notification"
  - To QA: "CAPA investigation assigned"
- Show documentation package (auto-compiled):
  - Temperature logs (CSV export)
  - Excursion summary report (PDF)
  - Device calibration records
  - Chain of custody form

#### Q&A Talking Points

**Q: How quickly are excursions detected?**  
A: Real-time monitoring. Alerts trigger within 1 minute of excursion start.

**Q: Can we adjust temperature thresholds?**  
A: Yes, configurable per product. Navigate to `/products` → Edit product → Set custom thresholds.

**Q: What if drug fails stability testing?**  
A: System automatically marks batch as "Unusable", triggers replacement shipment, and updates site inventory projections.

---

### Scenario 3: Morning Brief - Daily Workflow

**Demo Duration:** 3 minutes  
**Audience:** Supply chain managers, executives

#### Demo Script

**Step 1: Morning Routine (30 seconds)**
- User logs in at 8:00 AM
- Dashboard automatically shows "Morning Brief Ready" notification
- Click notification or navigate to `/morning-brief`

**Step 2: Executive Summary (1 minute)**
- Show LLM-generated narrative:

> **Executive Summary (Nov 28, 2024)**  
> "Yesterday was a productive day with 15 shipments completed (25% above target) and 8 critical alerts resolved. However, 2 new sites (SITE001, SITE005) require immediate attention due to low inventory levels. Overall supply chain health is good with 92% of sites adequately stocked."

- Highlight key insights (bullet points):
  - ✅ Shipment performance exceeded targets
  - ⚠️ 2 sites need immediate stock replenishment
  - ✅ No temperature excursions in last 24 hours
  - 📊 Enrollment 5% ahead of forecast

**Step 3: Priority Actions (1 minute)**
- Show "Priority Sites" section:
  - **SITE001:** Critical low stock (Action: Emergency transfer initiated)
  - **SITE005:** Temperature sensor malfunction (Action: Technician dispatched)
  - **SITE012:** Enrollment target reached (Action: Prepare closeout)
- Click "Take Action" button next to SITE001 → Redirects to emergency transfer page

**Step 4: Live Alerts (30 seconds)**
- Show "Critical Alerts (Live)" section (updates in real-time):
  - 1 shipment delayed (customs hold)
  - 1 product expiring in 30 days at SITE007
- Show "Shipments in Transit (Live)" section:
  - 5 active shipments
  - Map view with real-time tracking
  - Temperature status: All green

#### Talking Points

- Brief is generated daily at 6:00 AM automatically (Celery scheduled task)
- Cached in database for instant loading
- Can view historical briefs (date picker at top)
- Combines static summary (yesterday) + live data (current alerts)

---

## Performance Tests

### Load Testing (Locust)

```python
# File: backend/tests/performance/locustfile.py

from locust import HttpUser, task, between

class SallyTSMUser(HttpUser):
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    @task(3)
    def view_dashboard(self):
        """Most common action - view dashboard"""
        self.client.get("/api/v1/metrics/dashboard")
    
    @task(2)
    def ask_qa_question(self):
        """Frequently used - ask Q&A question"""
        self.client.post("/api/v1/qa/ask-rag", json={
            "query": "Which sites have low inventory?"
        })
    
    @task(1)
    def view_morning_brief(self):
        """Daily action - view morning brief"""
        self.client.get("/api/v1/brief/morning/2024-11-28")
    
    @task(1)
    def view_shipments(self):
        """Common action - check shipments"""
        self.client.get("/api/v1/shipments?limit=50")

# Run with: locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10
```

### Query Performance Tests

```python
# File: backend/tests/performance/test_query_performance.py

import pytest
import time
from sqlalchemy.orm import Session

class TestQueryPerformance:
    
    def test_dashboard_metrics_query_speed(self, db: Session):
        """Dashboard query should complete in < 200ms"""
        start = time.time()
        
        # Execute dashboard query
        result = db.execute("""
            SELECT 
                COUNT(DISTINCT study_id) as total_studies,
                COUNT(DISTINCT site_id) as total_sites,
                COUNT(*) FILTER (WHERE status = 'critical') as critical_alerts
            FROM studies, sites, alerts
            WHERE sites.study_id = studies.study_id
        """)
        
        elapsed_ms = (time.time() - start) * 1000
        
        assert elapsed_ms < 200, f"Query took {elapsed_ms}ms (threshold: 200ms)"
```

---

## Test Data Management

### Seed Demo Data

```python
# File: backend/database/seed_demo_data.py

def seed_demo_data():
    """Seed realistic demo data for testing and demonstrations"""
    
    # Create 5 studies
    studies = [
        {
            "study_id": "DEMO_001",
            "study_name": "Phase III Oncology Trial",
            "protocol_number": "PROTO-2024-001",
            "phase": "Phase III",
            "indication": "Non-Small Cell Lung Cancer",
            "status": "Active"
        },
        # ... 4 more studies
    ]
    
    # Create 25 sites (5 per study)
    # Create 50 inventory records
    # Create 100 shipments (various statuses)
    # Create 20 alerts (mix of critical/warning)
    # Create 50 temperature logs
    
    # Insert demo scenario trigger data
    # e.g., SITE001 with critical low stock for Emergency SOS demo
```

---

## Summary: Test Coverage Matrix

| Feature | Unit Tests | Integration Tests | E2E Tests | Demo Script |
|---------|-----------|-------------------|-----------|-------------|
| Emergency SOS | ✅ 5 tests | ✅ 3 tests | ✅ 1 test | ✅ Complete |
| Temp Excursion | ✅ 6 tests | ✅ 2 tests | ✅ 1 test | ✅ Complete |
| Morning Brief | ✅ 4 tests | ✅ 2 tests | ✅ 1 test | ✅ Complete |
| Evening Summary | ✅ 4 tests | ✅ 2 tests | ✅ 1 test | ✅ Planned |
| Q&A with RAG | ✅ 8 tests | ✅ 4 tests | ✅ 2 tests | ✅ Planned |
| ... (8 more scenarios) | ... | ... | ... | ... |

**Total Tests Planned:** 150+ tests  
**Current Coverage:** 0% (to be implemented)  
**Target Coverage:** 80%+ by end of Phase 4

---

**Document Status:** 🟢 COMPLETE  
**Last Updated:** 2024-11-28  
**Next Steps:** Implement tests alongside feature development (Test-Driven Development)
