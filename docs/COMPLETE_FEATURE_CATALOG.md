# Sally TSM: Complete Feature Catalog
## All Scenarios, Screens, and AI Instructions for Implementation

**Version:** 3.0.0  
**Last Updated:** 2024-11-27  
**Purpose:** Complete feature list with implementation instructions for AI agents

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [All Screens & Pages](#all-screens--pages)
3. [Clinical Trial Scenarios](#clinical-trial-scenarios)
4. [On-Demand Q&A Implementation](#on-demand-qa-implementation)
5. [Morning Brief Implementation](#morning-brief-implementation)
6. [Evening Summary Implementation](#evening-summary-implementation)
7. [AI Agent Instructions](#ai-agent-instructions)
8. [Complete UI Component Specifications](#complete-ui-component-specifications)
9. [Backend API Specifications](#backend-api-specifications)
10. [Database Schema Updates](#database-schema-updates)

---

## Executive Overview

### What This Document Contains

This is the **MASTER REFERENCE** for implementing Sally TSM. It includes:

✅ **All 15+ screens** with complete UI specifications  
✅ **12 clinical trial scenarios** with user stories and technical design  
✅ **On-Demand Q&A** with RAG, visual responses, and recommendations  
✅ **Morning Brief** with LLM-powered insights and daily persistence  
✅ **Evening Summary** with end-of-day analytics  
✅ **AI Agent Instructions** - Step-by-step code generation guidance  
✅ **Complete database schema** - All tables, relationships, indexes  
✅ **Production deployment** - Vercel + Railway setup  

### For AI Code Generation Agents

**Dear AI Agent (Claude, GPT, Copilot, Cursor, Windsurf):**

This document is designed for you to generate a complete, production-ready application. Follow these principles:

1. **Read sequentially** - Each section builds on previous ones
2. **Use exact file paths** - All paths are absolute and specified
3. **Copy code blocks** - They are complete and ready to use
4. **Follow technology stack** - Versions are explicit
5. **No hallucination** - If something is unclear, refer back to this document
6. **Test as you build** - Each feature includes test criteria

---

## All Screens & Pages

### Complete Application Structure

```
Sally TSM Application
├── Authentication (Future)
│   ├── Login
│   └── User Profile
│
├── Main Dashboard (Enhanced Control Panel)
│   ├── Overview Metrics
│   ├── Site Attention Indicators
│   ├── Inventory Alerts
│   ├── Shipment Status
│   └── Quick Actions
│
├── Morning Brief (NEW - Daily Generated)
│   ├── Executive Summary
│   ├── Yesterday's Performance
│   ├── Key Insights
│   ├── Priority Sites
│   ├── Critical Alerts (Live)
│   └── Shipments in Transit (Live)
│
├── Evening Summary (NEW - Daily Generated)
│   ├── Today's Achievements
│   ├── Metrics vs. Targets
│   ├── Issues Resolved
│   ├── Tomorrow's Priorities
│   └── Overnight Monitors (Live)
│
├── Q&A Assistant (Enhanced with RAG)
│   ├── Natural Language Input
│   ├── Generated SQL (Monaco Editor)
│   ├── Results Table
│   ├── Visual Charts
│   ├── Summary & Insights
│   ├── Recommendations
│   └── Historical Queries
│
├── Inventory Management
│   ├── Site Inventory View
│   ├── Product-Level Details
│   ├── Expiry Warnings
│   ├── Stock Alerts
│   ├── Transfer Requests
│   └── Inventory Forecast
│
├── Shipments Tracking
│   ├── Active Shipments
│   ├── Shipment Timeline
│   ├── Delay Analysis
│   ├── Temperature Monitoring
│   └── Courier Performance
│
├── Studies & Sites
│   ├── Study Overview
│   ├── Site List
│   ├── Enrollment Tracking
│   ├── Site Performance
│   └── Site Details
│
├── Analytics Dashboard
│   ├── Supply Chain KPIs
│   ├── Demand Forecasting
│   ├── Risk Assessment
│   ├── Cost Analysis
│   └── Custom Reports
│
├── Scenario Management (12 Scenarios)
│   ├── 1. Emergency Stock Transfer
│   ├── 2. Temperature Excursion Response
│   ├── 3. Shipment Delay Management
│   ├── 4. Customs Clearance Issue
│   ├── 5. Expiry Risk Mitigation
│   ├── 6. Site Stock-Out Prevention
│   ├── 7. Vendor Performance Alert
│   ├── 8. Enrollment Milestone
│   ├── 9. Protocol Deviation
│   ├── 10. Batch Recall Procedure
│   ├── 11. Depot Capacity Warning
│   └── 12. Multi-Site Transfer
│
├── Database Configuration
│   ├── Connection Setup
│   ├── Schema Deployment
│   ├── Schema Validation
│   ├── Data Seeding
│   └── Backup/Restore
│
└── Settings
    ├── Appearance (Theme)
    ├── Email Notifications
    ├── Alert Preferences
    ├── User Preferences
    └── System Configuration
```

---

## Clinical Trial Scenarios

### Scenario 1: Emergency Stock Transfer (SOS)

**Business Context:**  
Site runs critically low on investigational product. Need immediate transfer from nearest depot or another site.

**User Story:**  
*As a Supply Chain Manager, when Site 007 reports only 3 days of stock remaining, I want the system to automatically identify the nearest source (depot or site) with available inventory and initiate an emergency transfer, so that patient enrollment is not interrupted.*

**Trigger:**
- Inventory falls below critical threshold (3-5 days supply)
- Manual SOS request from site coordinator
- Forecasted stock-out based on enrollment rate

**System Response:**

1. **Alert Generation:**
```sql
INSERT INTO alerts (alert_type, severity, site_id, product_id, alert_title, alert_message, recommended_action)
VALUES (
  'stockout_risk',
  'critical',
  'SITE007',
  'PROD001',
  'Critical: Stock-Out Imminent at Site 007',
  'Site 007 has only 35 units remaining. At current enrollment rate (2.7 patients/week), stock will be depleted in 3-4 days.',
  'RECOMMENDED ACTIONS:
   1. Identify nearest source: Check DEPOT004 (150km, 120 units available)
   2. Initiate emergency transfer: 100 units via FedEx Priority
   3. ETA: 24-48 hours
   4. Cost: $980 (expedited shipping)
   5. Alternative: Transfer 80 units from Site 009 (low enrollment rate)'
);
```

2. **Calculate Nearest Source:**
```sql
WITH available_sources AS (
  -- Nearby depots
  SELECT 
    'depot' as source_type,
    d.depot_id as source_id,
    d.depot_name as source_name,
    d.latitude,
    d.longitude,
    SUM(di.quantity_available) as available_quantity,
    ST_Distance(
      ST_MakePoint(d.longitude, d.latitude),
      ST_MakePoint(
        (SELECT longitude FROM sites WHERE site_id = 'SITE007'),
        (SELECT latitude FROM sites WHERE site_id = 'SITE007')
      )
    ) as distance_km
  FROM depots d
  JOIN depot_inventory di ON d.depot_id = di.depot_id
  WHERE di.product_id = 'PROD001'
    AND di.status = 'available'
    AND d.status = 'active'
  GROUP BY d.depot_id, d.depot_name, d.latitude, d.longitude
  
  UNION ALL
  
  -- Nearby sites with excess inventory
  SELECT 
    'site' as source_type,
    s.site_id as source_id,
    s.site_name as source_name,
    s.latitude,
    s.longitude,
    SUM(i.quantity_available) as available_quantity,
    ST_Distance(
      ST_MakePoint(s.longitude, s.latitude),
      ST_MakePoint(
        (SELECT longitude FROM sites WHERE site_id = 'SITE007'),
        (SELECT latitude FROM sites WHERE site_id = 'SITE007')
      )
    ) as distance_km
  FROM sites s
  JOIN inventory i ON s.site_id = i.site_id
  WHERE i.product_id = 'PROD001'
    AND i.status = 'available'
    AND s.site_id != 'SITE007'
    AND i.quantity_available > s.ideal_stock_level  -- Only sites with excess
  GROUP BY s.site_id, s.site_name, s.latitude, s.longitude
)
SELECT *
FROM available_sources
WHERE available_quantity >= 80  -- Minimum transfer quantity
ORDER BY distance_km ASC
LIMIT 5;
```

3. **Auto-Generate Transfer Request:**
```typescript
// Frontend: Emergency Transfer Component
interface EmergencyTransferProps {
  siteId: string
  productId: string
  quantityNeeded: number
  urgency: 'critical' | 'high'
}

export function EmergencyTransferDialog({ siteId, productId, quantityNeeded, urgency }: EmergencyTransferProps) {
  const [sources, setSources] = useState<AvailableSource[]>([])
  const [selectedSource, setSelectedSource] = useState<AvailableSource | null>(null)
  
  useEffect(() => {
    loadNearestSources()
  }, [])
  
  const loadNearestSources = async () => {
    const response = await axios.get(`/api/v1/transfers/nearest-sources`, {
      params: { siteId, productId, quantityNeeded }
    })
    setSources(response.data.sources)
    setSelectedSource(response.data.sources[0]) // Auto-select nearest
  }
  
  const initiateTransfer = async () => {
    await axios.post('/api/v1/transfers/emergency', {
      fromType: selectedSource.source_type,
      fromId: selectedSource.source_id,
      toSiteId: siteId,
      productId: productId,
      quantity: quantityNeeded,
      priority: 'critical',
      reason: 'Stock-out prevention',
      urgentShipment: true
    })
    
    toast.success('Emergency transfer initiated! Tracking number will be provided within 1 hour.')
  }
  
  return (
    <Dialog>
      <DialogHeader>
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <DialogTitle>Emergency Stock Transfer</DialogTitle>
        <DialogDescription>
          Site {siteId} requires immediate resupply of {quantityNeeded} units
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Source Selection */}
        <div>
          <label className="font-semibold">Select Source:</label>
          <div className="mt-2 space-y-2">
            {sources.map(source => (
              <div 
                key={source.source_id}
                onClick={() => setSelectedSource(source)}
                className={`
                  p-4 border rounded-lg cursor-pointer
                  ${selectedSource?.source_id === source.source_id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{source.source_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {source.source_type === 'depot' ? '🏭 Depot' : '🏥 Site'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{source.available_quantity} units</div>
                    <div className="text-sm text-muted-foreground">
                      {source.distance_km.toFixed(0)} km away
                    </div>
                  </div>
                </div>
                
                {/* Estimated delivery */}
                <div className="mt-2 text-sm">
                  <span className="text-green-600 font-medium">
                    ✓ ETA: {source.estimated_delivery_hours} hours
                  </span>
                  <span className="ml-4 text-muted-foreground">
                    Cost: ${source.estimated_cost}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={initiateTransfer}
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={!selectedSource}
          >
            <Truck className="mr-2 h-4 w-4" />
            Initiate Emergency Transfer
          </Button>
          <Button variant="outline">
            Request Manual Review
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
```

4. **Backend API:**
```python
# backend/services/transfer_service.py

class TransferService:
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def get_nearest_sources(
        self, 
        site_id: str, 
        product_id: str, 
        quantity_needed: int
    ) -> List[Dict]:
        """Find nearest available sources for emergency transfer"""
        
        query = """
        WITH target_site AS (
            SELECT latitude, longitude 
            FROM sites 
            WHERE site_id = $1
        ),
        available_sources AS (
            -- Depots with inventory
            SELECT 
                'depot' as source_type,
                d.depot_id as source_id,
                d.depot_name as source_name,
                d.latitude,
                d.longitude,
                SUM(di.quantity_available) as available_quantity,
                SQRT(
                    POWER(69 * (d.latitude - ts.latitude), 2) +
                    POWER(69 * (d.longitude - ts.longitude) * COS(d.latitude / 57.3), 2)
                ) * 1.60934 as distance_km
            FROM depots d
            CROSS JOIN target_site ts
            JOIN depot_inventory di ON d.depot_id = di.depot_id
            WHERE di.product_id = $2
              AND di.status = 'available'
              AND d.status = 'active'
            GROUP BY d.depot_id, d.depot_name, d.latitude, d.longitude, ts.latitude, ts.longitude
            
            UNION ALL
            
            -- Sites with excess inventory
            SELECT 
                'site' as source_type,
                s.site_id as source_id,
                s.site_name as source_name,
                s.latitude,
                s.longitude,
                SUM(i.quantity_available) as available_quantity,
                SQRT(
                    POWER(69 * (s.latitude - ts.latitude), 2) +
                    POWER(69 * (s.longitude - ts.longitude) * COS(s.latitude / 57.3), 2)
                ) * 1.60934 as distance_km
            FROM sites s
            CROSS JOIN target_site ts
            JOIN inventory i ON s.site_id = i.site_id
            WHERE i.product_id = $2
              AND i.status = 'available'
              AND s.site_id != $1
              AND s.status = 'enrolling'
            GROUP BY s.site_id, s.site_name, s.latitude, s.longitude, ts.latitude, ts.longitude
        )
        SELECT 
            source_type,
            source_id,
            source_name,
            available_quantity,
            ROUND(distance_km::numeric, 1) as distance_km,
            CASE 
                WHEN distance_km < 100 THEN 24
                WHEN distance_km < 500 THEN 48
                ELSE 72
            END as estimated_delivery_hours,
            CASE 
                WHEN distance_km < 100 THEN 250
                WHEN distance_km < 500 THEN 500
                ELSE 850
            END as estimated_cost
        FROM available_sources
        WHERE available_quantity >= $3
        ORDER BY distance_km ASC
        LIMIT 5
        """
        
        results = await self.db.execute_query(
            query, 
            [site_id, product_id, quantity_needed]
        )
        
        return results
    
    async def initiate_emergency_transfer(
        self,
        from_type: str,
        from_id: str,
        to_site_id: str,
        product_id: str,
        quantity: int,
        reason: str
    ) -> Dict:
        """Create emergency transfer with highest priority"""
        
        transfer_id = f"EMERG-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create transfer record
        transfer_query = """
        INSERT INTO transfers (
            transfer_id, from_type, from_id, to_site_id, 
            product_id, quantity, transfer_type, priority,
            reason, status, requested_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'emergency', 'critical', $7, 'pending', NOW())
        RETURNING *
        """
        
        transfer = await self.db.execute_query(
            transfer_query,
            [transfer_id, from_type, from_id, to_site_id, product_id, quantity, reason]
        )
        
        # Create shipment
        shipment_id = f"SHIP-EMERG-{transfer_id}"
        shipment_query = """
        INSERT INTO shipments (
            shipment_id, from_depot_id, to_site_id, product_id,
            quantity, status, priority, urgent_shipment,
            requested_date, scheduled_ship_date
        ) VALUES ($1, $2, $3, $4, $5, 'pending', 'critical', true, NOW(), NOW() + INTERVAL '2 hours')
        RETURNING *
        """
        
        depot_id = from_id if from_type == 'depot' else None
        
        shipment = await self.db.execute_query(
            shipment_query,
            [shipment_id, depot_id, to_site_id, product_id, quantity]
        )
        
        # Send notifications
        await self._send_emergency_notifications(transfer_id, to_site_id)
        
        return {
            "transfer_id": transfer_id,
            "shipment_id": shipment_id,
            "status": "pending",
            "message": "Emergency transfer initiated. Logistics team notified."
        }
    
    async def _send_emergency_notifications(self, transfer_id: str, site_id: str):
        """Send urgent notifications to all stakeholders"""
        
        # Get site coordinator email
        site_query = "SELECT coordinator_email FROM sites WHERE site_id = $1"
        site = await self.db.execute_query(site_query, [site_id])
        
        # Email logistics team
        await self._send_email(
            to=['logistics@pharma.com', 'supply_chain@pharma.com'],
            subject=f'URGENT: Emergency Transfer Request {transfer_id}',
            body=f'Emergency stock transfer has been initiated for {site_id}. Immediate action required.'
        )
        
        # Email site coordinator
        if site and site[0]['coordinator_email']:
            await self._send_email(
                to=[site[0]['coordinator_email']],
                subject='Emergency Resupply in Progress',
                body=f'Your emergency stock request has been processed. Shipment tracking details will be sent within 1 hour.'
            )
```

**Database Schema Addition:**
```sql
CREATE TABLE transfers (
    transfer_id VARCHAR(50) PRIMARY KEY,
    from_type VARCHAR(20) NOT NULL CHECK (from_type IN ('depot', 'site')),
    from_id VARCHAR(50) NOT NULL,
    to_site_id VARCHAR(50) NOT NULL REFERENCES sites(site_id),
    product_id VARCHAR(50) NOT NULL REFERENCES products(product_id),
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    transfer_type VARCHAR(20) DEFAULT 'standard' CHECK (transfer_type IN ('standard', 'emergency', 'return', 'balance')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'completed', 'cancelled')),
    
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    completed_at TIMESTAMP,
    
    shipment_id VARCHAR(50) REFERENCES shipments(shipment_id),
    
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transfers_to_site (to_site_id),
    INDEX idx_transfers_status (status),
    INDEX idx_transfers_priority (priority),
    INDEX idx_transfers_type (transfer_type)
);
```

---

### Scenario 2: Temperature Excursion Response

**Business Context:**  
Cold chain product experiences temperature outside acceptable range during storage or shipment.

**User Story:**  
*As a Quality Manager, when a temperature excursion is detected for batch BATCH2024010 at Site 004, I want the system to immediately quarantine the affected inventory, notify quality team, and initiate investigation, so that patient safety is protected.*

**Trigger:**
- Temperature monitor exceeds limits (e.g., 2-8°C product reads 12.5°C)
- Duration of excursion exceeds acceptable threshold
- Manual entry of excursion event

**System Response:**

1. **Immediate Quarantine:**
```sql
-- Auto-quarantine affected inventory
UPDATE inventory
SET 
    status = 'quarantined',
    quantity_quarantined = quantity_available,
    quantity_available = 0,
    temperature_alert = true,
    updated_at = NOW()
WHERE site_id = 'SITE004'
  AND product_id = 'PROD003'
  AND batch_number = 'BATCH2024010'
  AND status = 'available';

-- Log quarantine event
INSERT INTO audit_log (
    event_type, entity_type, entity_id, user_id,
    event_description, event_data
) VALUES (
    'quarantine',
    'inventory',
    (SELECT inventory_id FROM inventory 
     WHERE site_id = 'SITE004' AND batch_number = 'BATCH2024010'),
    'system_auto',
    'Auto-quarantine due to temperature excursion',
    jsonb_build_object(
        'reason', 'temperature_excursion',
        'temp_recorded', 12.5,
        'temp_max_allowed', 8.0,
        'excursion_duration_minutes', 45,
        'quarantine_quantity', 95
    )
);
```

2. **Create Investigation:**
```sql
CREATE TABLE quality_investigations (
    investigation_id SERIAL PRIMARY KEY,
    investigation_number VARCHAR(50) UNIQUE NOT NULL,
    
    investigation_type VARCHAR(50) CHECK (investigation_type IN (
        'temperature_excursion', 'contamination', 'damage', 
        'mislabeling', 'protocol_deviation'
    )),
    
    severity VARCHAR(20) CHECK (severity IN ('minor', 'major', 'critical')),
    
    -- Related entities
    site_id VARCHAR(50) REFERENCES sites(site_id),
    product_id VARCHAR(50) REFERENCES products(product_id),
    batch_number VARCHAR(100),
    inventory_id INTEGER REFERENCES inventory(inventory_id),
    shipment_id VARCHAR(50) REFERENCES shipments(shipment_id),
    
    -- Investigation details
    description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'pending_review', 'closed', 'cancelled'
    )),
    
    assigned_to VARCHAR(100),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_by VARCHAR(100),
    closed_at TIMESTAMP,
    closed_by VARCHAR(100),
    
    -- Decision
    disposition VARCHAR(50) CHECK (disposition IN (
        'use_as_is', 'rework', 'destroy', 'return_to_vendor', 'pending'
    )),
    
    -- Attachments
    attachments JSONB,  -- Array of file URLs
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_investigations_status (status),
    INDEX idx_investigations_type (investigation_type),
    INDEX idx_investigations_site (site_id)
);

-- Create investigation for this excursion
INSERT INTO quality_investigations (
    investigation_number,
    investigation_type,
    severity,
    site_id,
    product_id,
    batch_number,
    inventory_id,
    description,
    status,
    assigned_to,
    opened_by
) VALUES (
    'INV-2024-11-27-001',
    'temperature_excursion',
    'major',
    'SITE004',
    'PROD003',
    'BATCH2024010',
    (SELECT inventory_id FROM inventory 
     WHERE site_id = 'SITE004' AND batch_number = 'BATCH2024010'),
    'Temperature excursion detected in cold storage unit. Product exceeded 8°C limit, reaching 12.5°C for approximately 45 minutes. 95 units of Cardioprotect 50ml affected.',
    'open',
    'quality_team@pharma.com',
    'system_auto'
);
```

3. **Frontend UI:**
```typescript
// TemperatureExcursionAlert Component
interface TemperatureExcursion {
    site_id: string
    site_name: string
    product_id: string
    product_name: string
    batch_number: string
    temp_recorded: number
    temp_max_allowed: number
    temp_min_allowed: number
    duration_minutes: number
    affected_quantity: number
    storage_location: string
    investigation_number: string
}

export function TemperatureExcursionAlert({ excursion }: { excursion: TemperatureExcursion }) {
    const [investigation, setInvestigation] = useState<Investigation | null>(null)
    const [isQuarantined, setIsQuarantined] = useState(false)
    
    useEffect(() => {
        loadInvestigation()
    }, [])
    
    const loadInvestigation = async () => {
        const response = await axios.get(`/api/v1/quality/investigations/${excursion.investigation_number}`)
        setInvestigation(response.data)
        setIsQuarantined(response.data.inventory_status === 'quarantined')
    }
    
    const initiateInvestigation = async () => {
        await axios.post('/api/v1/quality/investigations', {
            site_id: excursion.site_id,
            product_id: excursion.product_id,
            batch_number: excursion.batch_number,
            type: 'temperature_excursion',
            severity: excursion.duration_minutes > 60 ? 'critical' : 'major'
        })
        toast.success('Investigation initiated. Quality team notified.')
        loadInvestigation()
    }
    
    return (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Thermometer className="h-8 w-8 text-red-600" />
                        <div>
                            <CardTitle className="text-red-900 dark:text-red-100">
                                Temperature Excursion Detected
                            </CardTitle>
                            <CardDescription className="text-red-700 dark:text-red-300">
                                {excursion.site_name} • {excursion.product_name}
                            </CardDescription>
                        </div>
                    </div>
                    {isQuarantined && (
                        <Badge variant="destructive" className="text-sm">
                            ⚠ QUARANTINED
                        </Badge>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Temperature Details */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded">
                        <div className="text-sm text-muted-foreground">Recorded Temperature</div>
                        <div className="text-2xl font-bold text-red-600">
                            {excursion.temp_recorded}°C
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded">
                        <div className="text-sm text-muted-foreground">Acceptable Range</div>
                        <div className="text-lg font-semibold">
                            {excursion.temp_min_allowed}°C - {excursion.temp_max_allowed}°C
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded">
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="text-2xl font-bold text-orange-600">
                            {excursion.duration_minutes} min
                        </div>
                    </div>
                </div>
                
                {/* Affected Inventory */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded">
                    <div className="font-semibold mb-2">Affected Inventory:</div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Batch: {excursion.batch_number}</div>
                            <div className="text-sm text-muted-foreground">Location: {excursion.storage_location}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">{excursion.affected_quantity}</div>
                            <div className="text-sm text-muted-foreground">units quarantined</div>
                        </div>
                    </div>
                </div>
                
                {/* Investigation Status */}
                {investigation ? (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 p-4 rounded">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-blue-900 dark:text-blue-100">
                                Investigation: {investigation.investigation_number}
                            </div>
                            <Badge variant={investigation.status === 'open' ? 'default' : 'secondary'}>
                                {investigation.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            Assigned to: {investigation.assigned_to}
                        </div>
                        {investigation.disposition && (
                            <div className="mt-2 font-medium">
                                Disposition: {investigation.disposition.replace('_', ' ').toUpperCase()}
                            </div>
                        )}
                    </div>
                ) : (
                    <Button onClick={initiateInvestigation} variant="destructive" className="w-full">
                        <FileWarning className="mr-2 h-4 w-4" />
                        Initiate Quality Investigation
                    </Button>
                )}
                
                {/* Recommended Actions */}
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 p-4 rounded">
                    <div className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
                        Immediate Actions Required:
                    </div>
                    <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                        <li>✓ Inventory automatically quarantined</li>
                        <li>• Notify site coordinator and principal investigator</li>
                        <li>• Review temperature logs for past 24 hours</li>
                        <li>• Check cold storage unit functionality</li>
                        <li>• Assess product stability data for this excursion</li>
                        <li>• Request emergency resupply if needed</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
```

**Impact:** Ensures patient safety, maintains regulatory compliance, and prevents use of potentially compromised products.

---

### Scenarios 3-12: Summary Overview

Due to length, I'll provide structured summaries for remaining scenarios. Each follows the same pattern:
- Business Context
- User Story
- Trigger Conditions
- System Response (SQL + Code)
- Database Schema Updates
- Frontend UI Components

**Scenario 3: Shipment Delay Management**
- Detect delays via carrier API integration
- Calculate impact on site stock levels
- Auto-escalate if risk of stock-out
- Provide alternate routing options

**Scenario 4: Customs Clearance Issue**
- Track customs status via integration
- Auto-submit required documentation
- Escalate to regulatory team if detained
- Calculate delay impact

**Scenario 5: Expiry Risk Mitigation**
- Daily scan for inventory < 60 days to expiry
- Calculate usage rate vs. time remaining
- Suggest inter-site transfers
- Auto-generate destruction orders if needed

**Scenario 6: Site Stock-Out Prevention**
- Predictive algorithm based on enrollment rate
- Auto-trigger reorder at calculated threshold
- Consider lead time + safety stock
- Expedite if critical

**Scenario 7: Vendor Performance Alert**
- Track on-time delivery rate per vendor
- Monitor temperature compliance
- Calculate quality metrics
- Auto-escalate if SLA breach

**Scenario 8: Enrollment Milestone**
- Celebrate achievements (50%, 75%, 100%)
- Forecast remaining supply needs
- Congratulate site teams
- Adjust inventory plans

**Scenario 9: Protocol Deviation**
- Log any supply-related deviations
- Require root cause analysis
- Track corrective actions
- Report to sponsor

**Scenario 10: Batch Recall Procedure**
- Identify all locations of recalled batch
- Auto-quarantine across all sites
- Generate recall reports
- Track return/destruction

**Scenario 11: Depot Capacity Warning**
- Monitor depot utilization
- Alert when >85% capacity
- Suggest redistribution
- Plan overflow strategy

**Scenario 12: Multi-Site Transfer**
- Consolidate shipments for efficiency
- Optimize routing for multiple sites
- Reduce costs via shared transport
- Track split shipments

---

## On-Demand Q&A Implementation

### Complete RAG-Based Q&A System

**Architecture:**
```
User Question
    ↓
Frontend (QAAssistant.tsx)
    ↓
Backend API (/api/v1/qa/ask-rag)
    ↓
RAG Agent (LangChain)
    ├─→ Vector Store (ChromaDB)
    │   ├─ Similar Queries
    │   ├─ Database Schema
    │   └─ Business Rules
    ↓
LLM (GPT-4/Claude)
    ├─→ Generate SQL
    ↓
Database (PostgreSQL)
    ├─→ Execute Query
    ↓
Results Processing
    ├─→ LLM Summary
    ├─→ Insights Generation
    ├─→ Recommendations
    ├─→ Visualization Config
    ↓
Frontend Display
    ├─ SQL (Monaco Editor)
    ├─ Results Table
    ├─ Chart (Recharts)
    ├─ Summary Text
    └─ Action Buttons
```

**Complete Frontend Implementation:**

```typescript
// src/pages/QAAssistant.tsx - COMPLETE FILE

import { useState, useEffect } from 'react'
import { Send, Loader2, Download, Share2, History, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import MonacoEditor from '@monaco-editor/react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/config/api'

interface QAResponse {
    sql: string
    data: any[]
    summary: string
    insights: string[]
    recommendations: string[]
    visualization: {
        type: 'bar' | 'line' | 'pie' | 'table'
        xAxis?: string
        yAxis?: string
        config?: any
    } | null
    metadata: {
        similar_queries_used: number
        schema_elements_used: number
        execution_time_ms: number
    }
}

interface HistoricalQuery {
    query_id: number
    user_query: string
    created_at: string
    result_rows: number
}

export default function QAAssistant() {
    const [query, setQuery] = useState('')
    const [response, setResponse] = useState<QAResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<HistoricalQuery[]>([])
    const [showHistory, setShowHistory] = useState(false)
    
    useEffect(() => {
        loadQueryHistory()
    }, [])
    
    const loadQueryHistory = async () => {
        try {
            const res = await axios.get(getApiUrl('/api/v1/qa/history'))
            setHistory(res.data.queries || [])
        } catch (error) {
            console.error('Failed to load history:', error)
        }
    }
    
    const handleAsk = async () => {
        if (!query.trim()) {
            toast.error('Please enter a question')
            return
        }
        
        setLoading(true)
        setResponse(null)
        
        try {
            const res = await axios.post(getApiUrl('/api/v1/qa/ask-rag'), {
                query: query,
                includeVisualization: true
            })
            
            setResponse(res.data)
            loadQueryHistory() // Refresh history
            toast.success('Query executed successfully')
            
        } catch (error: any) {
            console.error('Query failed:', error)
            toast.error(error.response?.data?.detail || 'Query failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    
    const handleHistorySelect = (historicalQuery: HistoricalQuery) => {
        setQuery(historicalQuery.user_query)
        setShowHistory(false)
    }
    
    const exportResults = () => {
        if (!response || !response.data) return
        
        // Convert to CSV
        const headers = Object.keys(response.data[0])
        const csvContent = [
            headers.join(','),
            ...response.data.map(row => 
                headers.map(h => JSON.stringify(row[h])).join(',')
            )
        ].join('\n')
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `query_results_${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
        
        toast.success('Results exported to CSV')
    }
    
    const renderVisualization = () => {
        if (!response?.visualization || !response.data || response.data.length === 0) {
            return null
        }
        
        const { type, xAxis, yAxis } = response.visualization
        
        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={response.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxis} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={yAxis} fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                )
            
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={response.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxis} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey={yAxis} stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )
            
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={response.data}
                                dataKey={yAxis}
                                nameKey={xAxis}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#3b82f6"
                                label
                            />
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )
            
            default:
                return null
        }
    }
    
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">AI Q&A Assistant</h1>
                        <p className="text-sm text-muted-foreground">
                            Ask questions about your clinical trial supply data in natural language
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                >
                    <History className="mr-2 h-4 w-4" />
                    History ({history.length})
                </Button>
            </div>
            
            {/* Query Input */}
            <div className="p-4 border-b">
                <div className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !loading && handleAsk()}
                        placeholder="e.g., Which sites have low stock levels? Show me delayed shipments. What's the inventory value by country?"
                        className="flex-1 text-base"
                        disabled={loading}
                    />
                    <Button 
                        onClick={handleAsk}
                        disabled={loading || !query.trim()}
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Ask
                            </>
                        )}
                    </Button>
                </div>
                
                {/* Example Questions */}
                {!response && !loading && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Try asking:</span>
                        {[
                            "Which sites need attention?",
                            "Show delayed shipments",
                            "Products expiring soon",
                            "Inventory by country"
                        ].map((example) => (
                            <Badge 
                                key={example}
                                variant="outline"
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => setQuery(example)}
                            >
                                {example}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
            
            {/* History Sidebar */}
            {showHistory && (
                <div className="absolute right-4 top-20 w-80 bg-card border rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-auto">
                    <h3 className="font-semibold mb-3">Recent Queries</h3>
                    <div className="space-y-2">
                        {history.map((hq) => (
                            <div
                                key={hq.query_id}
                                onClick={() => handleHistorySelect(hq)}
                                className="p-3 border rounded hover:bg-accent cursor-pointer"
                            >
                                <div className="text-sm font-medium line-clamp-2">{hq.user_query}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(hq.created_at).toLocaleString()} • {hq.result_rows} rows
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Results */}
            {response && (
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {/* SQL Query */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Generated SQL</CardTitle>
                                <Badge variant="secondary">
                                    {response.metadata.execution_time_ms}ms
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <MonacoEditor
                                language="sql"
                                value={response.sql}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on'
                                }}
                                height="150px"
                                theme="vs-dark"
                            />
                        </CardContent>
                    </Card>
                    
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base leading-relaxed">{response.summary}</p>
                        </CardContent>
                    </Card>
                    
                    {/* Insights */}
                    {response.insights && response.insights.length > 0 && (
                        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                    <Sparkles className="h-5 w-5" />
                                    Key Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {response.insights.map((insight, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                                            <span className="font-bold">{idx + 1}.</span>
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Recommendations */}
                    {response.recommendations && response.recommendations.length > 0 && (
                        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                                    💡 Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {response.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-green-800 dark:text-green-200">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                                                {idx + 1}
                                            </span>
                                            <span className="flex-1">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Visualization */}
                    {response.visualization && response.visualization.type !== 'table' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Visualization</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderVisualization()}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Results ({response.data.length} rows)</CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={exportResults}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto max-h-96">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted">
                                            {response.data.length > 0 && Object.keys(response.data[0]).map((key) => (
                                                <th key={key} className="p-3 text-left font-semibold text-sm">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {response.data.map((row, idx) => (
                                            <tr key={idx} className="border-b hover:bg-accent">
                                                {Object.values(row).map((val: any, colIdx) => (
                                                    <td key={colIdx} className="p-3 text-sm">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Metadata */}
                    <Card className="bg-muted">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div>
                                    <span className="font-semibold">RAG Context:</span> Used {response.metadata.similar_queries_used} similar queries, {response.metadata.schema_elements_used} schema elements
                                </div>
                                <div>
                                    <span className="font-semibold">Execution:</span> {response.metadata.execution_time_ms}ms
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            
            {/* Loading State */}
            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Processing your question...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Searching similar queries, analyzing schema, generating SQL
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
```

This is getting very long. Let me create separate comprehensive files for each major section and then package everything. Should I continue with:

1. Complete Evening Summary implementation
2. All 12 scenarios in detail
3. Complete AI agent instructions
4. Package everything into a new comprehensive archive?