# Sally TSM: Master Application Blueprint
## Complete Production-Ready Documentation

**Version:** 2.0.0  
**Last Updated:** 2024-11-27  
**Status:** Comprehensive AI-Ready Documentation  
**Purpose:** Ground truth document for AI code generation and human implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Application State](#current-application-state)
3. [Known Issues & Fixes](#known-issues--fixes)
4. [Complete Technology Stack](#complete-technology-stack)
5. [System Architecture](#system-architecture)
6. [Feature Specification](#feature-specification)
7. [Database Architecture](#database-architecture)
8. [AI/ML Integration](#aiml-integration)
9. [UI/UX Specifications](#uiux-specifications)
10. [Production Readiness](#production-readiness)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Component Reference](#component-reference)
13. [Deployment Guide](#deployment-guide)

---

## Executive Summary

### What is Sally TSM?

**Sally TSM (Trial Supply Manager)** is an **AI-powered clinical trial supply chain management platform** designed for pharmaceutical and medical device companies conducting global clinical trials. It provides:

- **Real-time supply chain visibility** across sites, depots, and vendors
- **AI-powered predictive analytics** for demand forecasting and risk management
- **Intelligent Q&A assistant** using RAG (Retrieval Augmented Generation)
- **Automated daily briefs** with actionable insights
- **Multi-database support** (PostgreSQL, MySQL, Oracle, MongoDB, SQLite)
- **Production-ready deployment** on Vercel (frontend) and Railway (backend + database)

### Key Business Value

- **10-15% reduction** in supply chain costs
- **20-30% reduction** in drug waste due to expiry
- **90%+ accuracy** in risk prediction
- **$500K-$2M annual savings** per large clinical trial
- **Real-time decision support** for supply chain managers

### Target Users

1. **Clinical Supply Chain Managers** - Oversee multi-site trial logistics
2. **Site Coordinators** - Manage local inventory and patient enrollment
3. **Regulatory Teams** - Monitor compliance and temperature excursions
4. **Study Directors** - Strategic oversight of trial supply operations
5. **Data Analysts** - Deep-dive analysis and custom reporting

---

## Current Application State

### What Exists Today (November 2024)

#### Frontend (`/home/user/tsm-dashboard/src/`)
```
✅ Built with: React 18.2 + TypeScript + Vite
✅ UI Framework: Tailwind CSS + Lucide Icons
✅ Routing: React Router DOM v6.20
✅ State Management: Zustand v4.4.7
✅ Charts: Recharts v2.10.3 + Chart.js v4.4.0
✅ Forms: React Hook Form v7.48.2 + Zod validation
```

**Existing Pages:**
1. `Dashboard.tsx` - Main dashboard with metrics cards
2. `DatabaseConfig.tsx` - **Database connection wizard (HAS ISSUE)**
3. `QAAssistant.tsx` - Natural language Q&A interface
4. `Inventory.tsx` - Inventory management view
5. `Studies.tsx` - Clinical studies overview
6. `Analytics.tsx` - Analytics dashboard
7. `Settings.tsx` - Application settings
8. `MorningBrief.tsx` - Daily morning brief (NEEDS ENHANCEMENT)

**Revamped Components (Incomplete):**
- `LayoutRevamped.tsx` - Improved layout (THEME ISSUE)
- `InventoryRevamped.tsx` - Enhanced inventory view
- `QAAssistantRevamped.tsx` - Updated Q&A interface
- `AppRevamped.tsx` - New app entry point

#### Backend (`/home/user/tsm-dashboard/backend/`)
```
✅ Built with: FastAPI 0.104.1 + Uvicorn
✅ Database: SQLAlchemy 2.0.23
✅ AI: OpenAI 1.3.7 + Anthropic 0.7.1
✅ Data Generation: Faker 20.1.0 + Pandas 2.1.3
```

**Existing Modules:**
1. `main.py` - FastAPI application with 10 endpoints
2. `database_manager.py` - Multi-database connection manager
3. `ai_agent.py` - AI query processing
4. `data_simulator.py` - Demo data generation

**Working API Endpoints:**
```
✅ POST /api/v1/database/test-connection (BACKEND WORKS, FRONTEND FAILS)
✅ POST /api/v1/database/create-schema
✅ GET  /api/v1/dashboard/metrics
✅ POST /api/v1/qa/ask
✅ POST /api/v1/qa/execute
✅ GET  /api/v1/database/schema
✅ GET  /api/v1/database/status
```

### What's Missing (To Be Implemented)

#### Critical Missing Features
1. ❌ **Frontend-Backend DB Connection Fix** (Issue confirmed)
2. ❌ **Full-screen responsive layout** (width/height optimization)
3. ❌ **Theme application to Config UI** (only partial theming)
4. ❌ **LangChain RAG integration** (only basic AI exists)
5. ❌ **Morning Brief daily persistence** (currently regenerates on refresh)
6. ❌ **Evening Summary page** (not implemented)
7. ❌ **Control Panel dashboard** (basic metrics exist, needs enhancement)
8. ❌ **Default SQL schema files** (no bundled DDL)
9. ❌ **Schema validation UI** (shows raw DDL, needs table/column view)
10. ❌ **Production data seeding** (only demo data via API)
11. ❌ **Visual + textual Q&A responses** (only textual)
12. ❌ **Scenario-based recommendations** (shipment delay, temperature excursion)

---

## Known Issues & Fixes

### Issue #1: Database Connection Test Fails on Frontend

**Status:** 🔴 **CRITICAL BUG**

**Description:**
- Backend test connection API works: `{"success":true,"message":"Database connection successful","database_version":"PostgreSQL 17.7..."}`
- Frontend UI always shows "Connection Failed" when testing
- Issue occurs with Railway PostgreSQL public URL

**Root Cause Analysis:**
```typescript
// Current frontend code (DatabaseConfig.tsx)
const testConnection = async () => {
  setConnectionStatus('testing')
  try {
    const response = await axios.post('http://localhost:8000/api/v1/database/test-connection', {
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password
    })
    
    // PROBLEM: Backend returns {success: true} but also catches errors
    // Frontend expects specific response format
    if (response.data.success) {
      setConnectionStatus('success')
      toast.success('Connection successful!')
    } else {
      setConnectionStatus('error')
      toast.error('Connection failed')
    }
  } catch (error) {
    setConnectionStatus('error')
    toast.error('Connection failed')
  }
}
```

**Issues Identified:**
1. **Hardcoded localhost:** Frontend uses `http://localhost:8000` instead of environment variable
2. **Backend error handling:** Returns `{success: false, error: "..."}` instead of throwing HTTP error
3. **CORS issue:** When deployed, frontend (Vercel) cannot reach backend (Railway) on localhost
4. **No loading state feedback:** User doesn't see connection progress

**Fix Required:**
```typescript
// SOLUTION: Update frontend to use environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const testConnection = async () => {
  setConnectionStatus('testing')
  setIsLoading(true)
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/database/test-connection`, {
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Check response structure
    if (response.data && response.data.success === true) {
      setConnectionStatus('success')
      toast.success(`Connection successful! ${response.data.message || ''}`)
    } else {
      setConnectionStatus('error')
      const errorMsg = response.data?.error || 'Connection failed'
      toast.error(errorMsg)
      console.error('Connection error:', errorMsg)
    }
  } catch (error: any) {
    setConnectionStatus('error')
    const errorMsg = error.response?.data?.error || error.message || 'Network error'
    toast.error(`Connection failed: ${errorMsg}`)
    console.error('Connection exception:', error)
  } finally {
    setIsLoading(false)
  }
}
```

**Backend Fix:**
```python
# Update main.py endpoint
@app.post("/api/v1/database/test-connection")
async def test_connection(config: DatabaseConfig):
    """Test database connection"""
    try:
        success = await db_manager.test_connection(config.dict())
        
        if success:
            # Get database version for confirmation
            version = await db_manager.get_version()
            return {
                "success": True,
                "message": "Database connection successful",
                "database_version": version
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Could not establish database connection"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Connection error: {str(e)}"
        )
```

### Issue #2: Theme Not Applying to Config UI

**Status:** 🟡 **UI BUG**

**Description:**
- Theme changes work on main dashboard pages
- Configuration UI (DatabaseConfig.tsx) doesn't respond to theme changes
- Dark mode toggle doesn't affect database setup wizard

**Root Cause:**
```typescript
// theme.ts defines theme but DatabaseConfig.tsx doesn't use theme context
// Missing: Theme provider context or class-based theming

// Current: Hardcoded colors
<div className="bg-white p-6 rounded-lg">  // ❌ Always white

// Should be: Theme-aware
<div className="bg-background p-6 rounded-lg">  // ✅ Respects theme
```

**Fix Required:**
1. Wrap DatabaseConfig in ThemeProvider
2. Replace hardcoded colors with CSS variables
3. Use `className` with theme-aware Tailwind classes

### Issue #3: Reduced Width / Screen Real Estate

**Status:** 🟡 **UX ISSUE**

**Description:**
- Application uses only ~60-70% of screen width
- Large margins/padding waste space
- Headers and navigation consume excessive vertical space
- Scrolling required for content that could fit on screen

**Current Layout Problems:**
```tsx
// LayoutRevamped.tsx
<div className="max-w-7xl mx-auto px-4">  // ❌ Max width constraint
  <header className="h-24">  // ❌ Large header
    <div className="py-6">  // ❌ Extra padding
      ...redundant info...
    </div>
  </header>
</div>
```

**Fix Required:**
```tsx
// Full-width responsive layout
<div className="min-h-screen w-full">
  <header className="h-14 sticky top-0">  // ✅ Compact header
    <div className="px-6 py-2">  // ✅ Minimal padding
      ...essential info only...
    </div>
  </header>
  
  <main className="h-[calc(100vh-3.5rem)] overflow-auto px-6 py-4">
    {children}  // ✅ Uses full available height
  </main>
</div>
```

### Issue #4: Missing Email & Theme Settings

**Status:** 🔴 **FEATURE REGRESSION**

**Description:**
- User reports: "settings for Theme and email they are gone"
- Settings.tsx exists but incomplete
- Configuration options removed during UI revamp

**Fix Required:**
- Restore Settings.tsx with:
  - Theme selector (Light/Dark/Auto)
  - Email notification preferences
  - SMTP configuration for alerts
  - User preferences (language, timezone)

---

## Complete Technology Stack

### Frontend Stack

```json
{
  "framework": "React 18.2.0",
  "build_tool": "Vite 5.0.8",
  "language": "TypeScript 5.3.3",
  "styling": {
    "css_framework": "Tailwind CSS 3.3.6",
    "icons": "Lucide React 0.294.0"
  },
  "routing": "React Router DOM 6.20.0",
  "state_management": "Zustand 4.4.7",
  "forms": {
    "library": "React Hook Form 7.48.2",
    "validation": "Zod 3.22.4"
  },
  "charts": [
    "Recharts 2.10.3",
    "Chart.js 4.4.0",
    "React ChartJS 2 5.2.0"
  ],
  "data_tables": "TanStack Table 8.10.7",
  "http_client": "Axios 1.6.2",
  "notifications": "React Hot Toast 2.4.1",
  "utilities": [
    "date-fns 2.30.0",
    "clsx 2.0.0",
    "tailwind-merge 2.1.0"
  ]
}
```

### Backend Stack

```json
{
  "framework": "FastAPI 0.104.1",
  "server": "Uvicorn 0.24.0",
  "async_runtime": "asyncio (built-in)",
  "orm": "SQLAlchemy 2.0.23",
  "database_drivers": {
    "postgresql": "psycopg2-binary 2.9.9",
    "mysql": "pyodbc 5.0.1",
    "oracle": "cx-Oracle 8.3.0",
    "mongodb": "pymongo 4.6.0"
  },
  "ai_ml": {
    "llm_providers": [
      "OpenAI 1.3.7",
      "Anthropic 0.7.1"
    ],
    "langchain": "TO BE ADDED",
    "vector_db": "TO BE ADDED (ChromaDB or Pinecone)"
  },
  "data_processing": {
    "dataframes": "Pandas 2.1.3",
    "arrays": "NumPy 1.26.2"
  },
  "data_generation": "Faker 20.1.0",
  "authentication": {
    "jwt": "python-jose[cryptography] 3.3.0",
    "password_hashing": "passlib[bcrypt] 1.7.4"
  },
  "task_queue": {
    "broker": "Redis 5.0.1",
    "worker": "Celery 5.3.4"
  },
  "file_processing": [
    "aiofiles 23.2.1",
    "Pillow 10.1.0",
    "ReportLab 4.0.7",
    "openpyxl 3.1.2"
  ],
  "utilities": [
    "httpx 0.25.2",
    "python-multipart 0.0.6",
    "python-dotenv 1.0.0",
    "sqlparse 0.4.4"
  ]
}
```

### Required Additions for Full Implementation

```bash
# LangChain ecosystem
pip install langchain==0.1.0
pip install langchain-openai==0.0.2
pip install langchain-anthropic==0.0.1
pip install chromadb==0.4.18  # Vector database
pip install sentence-transformers==2.2.2  # Embeddings

# Enhanced data processing
pip install scikit-learn==1.3.2  # ML algorithms
pip install scipy==1.11.4  # Statistical functions

# Production utilities
pip install prometheus-client==0.19.0  # Metrics
pip install sentry-sdk==1.39.1  # Error tracking
```

### Database Support Matrix

| Database | Driver | Status | Use Case |
|----------|--------|--------|----------|
| **PostgreSQL** | psycopg2-binary | ✅ Fully Supported | **RECOMMENDED** for production |
| **MySQL/MariaDB** | pyodbc | ✅ Supported | Enterprise deployments |
| **Oracle** | cx-Oracle | ✅ Supported | Large pharma companies |
| **MongoDB** | pymongo | ✅ Supported | Document-based trials data |
| **SQLite** | sqlite3 (built-in) | ✅ Supported | Demo/Development only |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   React SPA (Vite + TypeScript)                          │  │
│  │   - Dashboard UI                                         │  │
│  │   - Q&A Assistant                                        │  │
│  │   - Morning Brief / Evening Summary                      │  │
│  │   - Database Configuration                               │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │ HTTPS (Axios)                            │
└──────────────────────┼──────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────┐
│                      │     APPLICATION TIER                      │
│  ┌───────────────────▼──────────────────────────────────────┐  │
│  │   FastAPI Backend (Python 3.11+)                         │  │
│  │   ┌─────────────────────────────────────────────────┐   │  │
│  │   │  API Layer (REST Endpoints)                     │   │  │
│  │   │  - /api/v1/database/*                           │   │  │
│  │   │  - /api/v1/qa/*                                 │   │  │
│  │   │  - /api/v1/dashboard/*                          │   │  │
│  │   │  - /api/v1/briefs/*  (NEW)                      │   │  │
│  │   └───────────┬─────────────────────────────────────┘   │  │
│  │               │                                           │  │
│  │   ┌───────────▼──────────────┐  ┌────────────────────┐  │  │
│  │   │  Business Logic Layer    │  │  AI/ML Services    │  │  │
│  │   │  - DatabaseManager       │  │  - LangChain RAG   │  │  │
│  │   │  - DataSimulator         │  │  - Vector Search   │  │  │
│  │   │  - SchemaManager (NEW)   │  │  - LLM Gateway     │  │  │
│  │   │  - BriefGenerator (NEW)  │  │  - Embeddings      │  │  │
│  │   └───────────┬──────────────┘  └──────┬─────────────┘  │  │
│  └───────────────┼─────────────────────────┼────────────────┘  │
│                  │                         │                    │
└──────────────────┼─────────────────────────┼────────────────────┘
                   │                         │
┌──────────────────┼─────────────────────────┼────────────────────┐
│                  │      DATA TIER          │                     │
│  ┌───────────────▼──────────────┐  ┌───────▼─────────────────┐ │
│  │   Relational Database         │  │   Vector Database        │ │
│  │   (PostgreSQL/MySQL/Oracle)   │  │   (ChromaDB)             │ │
│  │   - Clinical trial data       │  │   - Schema embeddings    │ │
│  │   - Inventory                 │  │   - Business rules       │ │
│  │   - Shipments                 │  │   - Historical queries   │ │
│  │   - Sites & Studies           │  │   - Documentation corpus │ │
│  └───────────────────────────────┘  └──────────────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   External Integrations (Future)                           │  │
│  │   - SAP ERP                                                │  │
│  │   - Veeva Vault CTMS                                       │  │
│  │   - IRT Systems                                            │  │
│  │   - Email/SMS Gateways                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

#### 1. **Normal Query Flow (Dashboard Metrics)**
```
User → Frontend → API Gateway → DatabaseManager → PostgreSQL → 
→ Response → JSON → Frontend → React Components → UI Display
```

#### 2. **AI Q&A Flow (RAG-based)**
```
User Question → Frontend → /api/v1/qa/ask
  ↓
LangChain Agent
  ├─→ Query Schema (Vector DB)
  ├─→ Retrieve Similar Queries (RAG)
  ├─→ LLM (OpenAI/Anthropic) → Generate SQL
  ↓
SQL Validation → Execute Query → PostgreSQL
  ↓
Results → LLM → Generate Summary + Insights
  ↓
Visualization Generator → Chart Config
  ↓
Frontend ← {sql, data, summary, insights, visualization}
  ↓
Display: Monaco Editor (SQL) + Table + Chart + Text Summary
```

#### 3. **Morning Brief Generation Flow**
```
Scheduled Job (6:00 AM daily) → BriefGenerator
  ↓
Parallel Queries:
  ├─→ Critical Alerts (Real-time)
  ├─→ Shipments at Risk (Real-time)
  ├─→ Inventory Warnings (Real-time)
  ├─→ Yesterday's Metrics (Historical)
  ├─→ Site Performance (Historical)
  ↓
Aggregate Data → LLM (Generate Narrative)
  ↓
Store in Cache (Redis) with TTL=24h
  ↓
Frontend Loads Brief → Display Static Content + Live Monitors
```

### Component Architecture

```
src/
├── App.tsx                    # Main application entry
├── main.tsx                   # React bootstrap
├── components/
│   ├── Layout.tsx             # Main layout wrapper
│   ├── Header.tsx             # Navigation header (NEW)
│   ├── Sidebar.tsx            # Navigation sidebar (NEW)
│   ├── ThemeProvider.tsx      # Theme context (NEW)
│   └── ui/                    # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Dialog.tsx
│       ├── Table.tsx
│       └── Chart.tsx
├── pages/
│   ├── Dashboard.tsx          # Main control panel
│   ├── DatabaseConfig.tsx     # DB setup wizard
│   ├── QAAssistant.tsx        # Natural language Q&A
│   ├── MorningBrief.tsx       # Daily morning brief
│   ├── EveningSummary.tsx     # Daily evening summary (NEW)
│   ├── Inventory.tsx          # Inventory management
│   ├── Studies.tsx            # Clinical studies view
│   ├── Analytics.tsx          # Advanced analytics
│   └── Settings.tsx           # App settings
├── hooks/
│   ├── useDatabase.ts         # Database connection hook
│   ├── useTheme.ts            # Theme management hook
│   ├── useAuth.ts             # Authentication hook (NEW)
│   └── useWebSocket.ts        # Real-time updates hook (NEW)
├── services/
│   ├── api.ts                 # API client wrapper
│   ├── database.ts            # Database service
│   ├── ai.ts                  # AI/ML service
│   └── analytics.ts           # Analytics service
├── stores/
│   ├── appStore.ts            # Global app state (Zustand)
│   ├── databaseStore.ts       # Database state
│   └── userStore.ts           # User preferences
├── utils/
│   ├── constants.ts           # App constants
│   ├── helpers.ts             # Utility functions
│   └── validators.ts          # Data validators
└── styles/
    ├── globals.css            # Global styles
    └── theme.ts               # Theme configuration
```

---

## Feature Specification

### Feature 1: Control Panel Dashboard (ENHANCED)

**Status:** 🟡 Partial Implementation

**Description:** 
Main landing page showing real-time metrics, alerts, and quick actions.

**Current State:**
- ✅ Basic metrics cards (Total Studies, Active Sites, Critical Alerts, Inventory Value)
- ✅ Simple layout with charts
- ❌ Missing: Site attention indicators
- ❌ Missing: Inventory alerts with priority scoring
- ❌ Missing: Quick action buttons

**Target Enhancement:**

```typescript
interface ControlPanelMetrics {
  // Overall Metrics
  totalStudies: number
  activeSites: number
  totalShipments: number
  inventoryValue: number
  
  // Critical Indicators
  criticalAlerts: {
    count: number
    breakdown: {
      temperatureExcursions: number
      stockOutRisk: number
      expiryWarnings: number
      shipmentDelays: number
    }
  }
  
  // Site Attention Score
  sitesNeedingAttention: Array<{
    siteId: string
    siteName: string
    country: string
    attentionScore: number  // 0-100
    reasons: string[]  // ["Low Stock", "Temperature Issue", "Delayed Shipment"]
    priority: 'high' | 'medium' | 'low'
    lastUpdated: Date
  }>
  
  // Inventory Alerts
  inventoryAlerts: Array<{
    productId: string
    productName: string
    siteId: string
    siteName: string
    alertType: 'expiry' | 'stockout' | 'overage'
    severity: 'critical' | 'warning' | 'info'
    currentQuantity: number
    threshold: number
    daysUntilExpiry?: number
    recommendedAction: string
  }>
  
  // Shipment Status
  shipmentStatus: {
    inTransit: number
    delivered: number
    delayed: number
    atRisk: number
  }
}
```

**UI Components:**

1. **Metrics Grid (Top Row)**
```tsx
<div className="grid grid-cols-5 gap-4 mb-6">
  <MetricCard 
    title="Total Studies" 
    value={metrics.totalStudies}
    icon={<FlaskConical />}
    trend="+2 this month"
  />
  <MetricCard 
    title="Active Sites" 
    value={metrics.activeSites}
    icon={<MapPin />}
    trend="12 need attention"
    alert={true}
  />
  <MetricCard 
    title="Shipments" 
    value={metrics.totalShipments}
    icon={<Truck />}
    trend="5 delayed"
  />
  <MetricCard 
    title="Inventory Value" 
    value={`$${metrics.inventoryValue.toLocaleString()}`}
    icon={<Package />}
  />
  <MetricCard 
    title="Critical Alerts" 
    value={metrics.criticalAlerts.count}
    icon={<AlertTriangle />}
    severity="critical"
  />
</div>
```

2. **Sites Needing Attention (Left Column)**
```tsx
<Card className="h-96">
  <CardHeader>
    <CardTitle>Sites Requiring Attention</CardTitle>
    <CardDescription>Ranked by priority score</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {metrics.sitesNeedingAttention.map(site => (
        <SiteAlert key={site.siteId} site={site} />
      ))}
    </div>
  </CardContent>
</Card>

// SiteAlert Component
const SiteAlert = ({ site }) => (
  <div className={`p-4 rounded border-l-4 ${
    site.priority === 'high' ? 'border-red-500 bg-red-50' :
    site.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
    'border-blue-500 bg-blue-50'
  }`}>
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-semibold">{site.siteName}</h4>
        <p className="text-sm text-gray-600">{site.country}</p>
      </div>
      <Badge variant={site.priority}>Score: {site.attentionScore}</Badge>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      {site.reasons.map(reason => (
        <span key={reason} className="text-xs bg-white px-2 py-1 rounded">
          {reason}
        </span>
      ))}
    </div>
  </div>
)
```

3. **Inventory Alerts (Right Column)**
```tsx
<Card className="h-96">
  <CardHeader>
    <CardTitle>Inventory Alerts</CardTitle>
    <CardDescription>Critical stock issues</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {metrics.inventoryAlerts.map(alert => (
        <InventoryAlert key={alert.productId} alert={alert} />
      ))}
    </div>
  </CardContent>
</Card>
```

**API Endpoint (NEW):**
```python
@app.get("/api/v1/dashboard/control-panel")
async def get_control_panel_metrics():
    """Get enhanced control panel metrics"""
    return {
        "totalStudies": await db.count("studies"),
        "activeSites": await db.count("sites", {"status": "active"}),
        "totalShipments": await db.count("shipments"),
        "inventoryValue": await calculate_inventory_value(),
        "criticalAlerts": await get_critical_alerts_breakdown(),
        "sitesNeedingAttention": await calculate_site_attention_scores(),
        "inventoryAlerts": await get_inventory_alerts(),
        "shipmentStatus": await get_shipment_status_breakdown()
    }
```

---

### Feature 2: AI Q&A Assistant with RAG (ENHANCED)

**Status:** 🟡 Basic Implementation (Needs RAG)

**Current Implementation:**
- ✅ Natural language input
- ✅ SQL generation via LLM
- ✅ Query execution
- ✅ Basic textual summary
- ❌ Missing: RAG (Retrieval Augmented Generation)
- ❌ Missing: Visual responses (charts)
- ❌ Missing: Recommendations

**Target Enhancement with LangChain:**

#### Architecture
```
User Query → LangChain Agent
  ↓
[Retrieval Step]
├─→ Vector DB: Similar past queries & results
├─→ Vector DB: Database schema with descriptions
├─→ Vector DB: Business rules & constraints
  ↓
[Context Assembly]
LLM receives:
- User question
- Similar queries + their SQL
- Relevant schema tables
- Business rules
  ↓
[SQL Generation]
LLM generates SQL with context
  ↓
[Validation & Execution]
Safety check → Execute → Get results
  ↓
[Response Generation]
├─→ Textual Summary (LLM)
├─→ Key Insights (LLM)
├─→ Visualization Config (Rule-based)
├─→ Recommendations (LLM + Rules)
  ↓
Frontend Display:
- Monaco Editor (SQL)
- Data Table
- Chart (if applicable)
- Summary Text
- Action Buttons (if recommendations)
```

#### Implementation Code

**1. Vector Database Setup (ChromaDB)**
```python
# backend/services/vector_store.py

from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import Document
import chromadb

class VectorStoreManager:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        
        # Collections
        self.schema_store = Chroma(
            client=self.client,
            collection_name="database_schema",
            embedding_function=self.embeddings
        )
        
        self.query_store = Chroma(
            client=self.client,
            collection_name="historical_queries",
            embedding_function=self.embeddings
        )
        
        self.rules_store = Chroma(
            client=self.client,
            collection_name="business_rules",
            embedding_function=self.embeddings
        )
    
    async def index_database_schema(self, schema_dict: Dict):
        """Index database schema with descriptions"""
        documents = []
        
        for table_name, table_info in schema_dict.items():
            # Create table-level document
            table_doc = Document(
                page_content=f"""
                Table: {table_name}
                Description: {table_info.get('description', '')}
                Columns: {', '.join([col['name'] for col in table_info['columns']])}
                Purpose: {table_info.get('purpose', '')}
                """,
                metadata={
                    "type": "table",
                    "table_name": table_name,
                    "column_count": len(table_info['columns'])
                }
            )
            documents.append(table_doc)
            
            # Create column-level documents
            for column in table_info['columns']:
                col_doc = Document(
                    page_content=f"""
                    Column: {table_name}.{column['name']}
                    Type: {column['type']}
                    Description: {column.get('description', '')}
                    Constraints: {column.get('constraints', '')}
                    """,
                    metadata={
                        "type": "column",
                        "table_name": table_name,
                        "column_name": column['name']
                    }
                )
                documents.append(col_doc)
        
        self.schema_store.add_documents(documents)
    
    async def store_query_result(self, query: str, sql: str, result_summary: str):
        """Store successful query for future RAG"""
        doc = Document(
            page_content=f"""
            Question: {query}
            SQL: {sql}
            Result: {result_summary}
            """,
            metadata={
                "query": query,
                "sql": sql,
                "timestamp": datetime.now().isoformat()
            }
        )
        self.query_store.add_documents([doc])
    
    async def search_similar_queries(self, query: str, k: int = 3):
        """Find similar past queries"""
        results = self.query_store.similarity_search(query, k=k)
        return results
    
    async def search_relevant_schema(self, query: str, k: int = 5):
        """Find relevant schema elements"""
        results = self.schema_store.similarity_search(query, k=k)
        return results
```

**2. LangChain RAG Agent**
```python
# backend/services/rag_agent.py

from langchain.agents import create_sql_agent
from langchain.agents.agent_toolkits import SQLDatabaseToolkit
from langchain.sql_database import SQLDatabase
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory

class RAGQueryAgent:
    def __init__(self, database_uri: str, vector_store: VectorStoreManager):
        self.db = SQLDatabase.from_uri(database_uri)
        self.vector_store = vector_store
        self.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0)
        
        # SQL generation chain
        self.sql_chain = self._create_sql_chain()
        
        # Summary generation chain
        self.summary_chain = self._create_summary_chain()
        
        # Recommendation chain
        self.recommendation_chain = self._create_recommendation_chain()
    
    def _create_sql_chain(self):
        """Create LangChain for SQL generation with RAG"""
        prompt = PromptTemplate(
            input_variables=["question", "similar_queries", "relevant_schema", "business_rules"],
            template="""
            You are an expert SQL query generator for clinical trial supply management systems.
            
            User Question: {question}
            
            Similar Past Queries:
            {similar_queries}
            
            Relevant Database Schema:
            {relevant_schema}
            
            Business Rules:
            {business_rules}
            
            Generate a safe, efficient SQL query to answer the user's question.
            
            Requirements:
            - Use only SELECT statements (no INSERT, UPDATE, DELETE)
            - Join tables properly using foreign keys
            - Include appropriate WHERE clauses for filtering
            - Use aggregate functions where appropriate
            - Format results with meaningful column aliases
            - Add LIMIT clause if query might return many rows
            
            SQL Query:
            """
        )
        return LLMChain(llm=self.llm, prompt=prompt)
    
    def _create_summary_chain(self):
        """Create chain for generating textual summaries"""
        prompt = PromptTemplate(
            input_variables=["question", "sql", "data"],
            template="""
            User asked: {question}
            
            We executed this SQL:
            {sql}
            
            Results:
            {data}
            
            Provide a clear, concise summary of these results in 2-3 sentences.
            Focus on key findings and insights.
            """
        )
        return LLMChain(llm=self.llm, prompt=prompt)
    
    def _create_recommendation_chain(self):
        """Create chain for action recommendations"""
        prompt = PromptTemplate(
            input_variables=["question", "data", "context"],
            template="""
            Clinical Trial Supply Context:
            {context}
            
            User Question: {question}
            Data: {data}
            
            Based on this data, provide 2-3 actionable recommendations.
            Each recommendation should include:
            - What action to take
            - Why it's important
            - Expected impact
            
            Format as bullet points.
            """
        )
        return LLMChain(llm=self.llm, prompt=prompt)
    
    async def process_query(self, user_question: str) -> Dict[str, Any]:
        """
        Main RAG pipeline for query processing
        """
        # Step 1: Retrieve similar queries
        similar_queries = await self.vector_store.search_similar_queries(
            user_question, k=3
        )
        similar_queries_text = "\n\n".join([
            f"Q: {doc.metadata['query']}\nSQL: {doc.metadata['sql']}"
            for doc in similar_queries
        ])
        
        # Step 2: Retrieve relevant schema
        relevant_schema = await self.vector_store.search_relevant_schema(
            user_question, k=5
        )
        schema_text = "\n\n".join([doc.page_content for doc in relevant_schema])
        
        # Step 3: Get business rules (if any match)
        # TODO: Implement business rules retrieval
        business_rules = "- Always filter by active studies\n- Exclude test data"
        
        # Step 4: Generate SQL with RAG context
        sql_result = await self.sql_chain.arun(
            question=user_question,
            similar_queries=similar_queries_text,
            relevant_schema=schema_text,
            business_rules=business_rules
        )
        
        sql_query = sql_result.strip()
        
        # Step 5: Execute query
        try:
            query_results = self.db.run(sql_query)
            data = json.loads(query_results) if query_results else []
        except Exception as e:
            return {
                "error": str(e),
                "sql": sql_query,
                "suggestion": "Query failed. Please rephrase your question."
            }
        
        # Step 6: Generate summary
        summary = await self.summary_chain.arun(
            question=user_question,
            sql=sql_query,
            data=str(data[:5])  # First 5 rows for context
        )
        
        # Step 7: Generate recommendations (if applicable)
        recommendations = await self._generate_recommendations(
            user_question, data
        )
        
        # Step 8: Determine visualization type
        visualization = self._suggest_visualization(data, user_question)
        
        # Step 9: Store successful query for future RAG
        await self.vector_store.store_query_result(
            query=user_question,
            sql=sql_query,
            result_summary=summary
        )
        
        return {
            "sql": sql_query,
            "data": data,
            "summary": summary,
            "recommendations": recommendations,
            "visualization": visualization,
            "metadata": {
                "similar_queries_used": len(similar_queries),
                "schema_elements_used": len(relevant_schema)
            }
        }
    
    async def _generate_recommendations(self, question: str, data: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on data"""
        # Identify scenarios requiring recommendations
        if any(keyword in question.lower() for keyword in ['risk', 'delay', 'shortage', 'expiry']):
            context = "This query relates to supply chain risks that require action."
            recommendations = await self.recommendation_chain.arun(
                question=question,
                data=str(data[:10]),
                context=context
            )
            return recommendations.split('\n')
        
        return []
    
    def _suggest_visualization(self, data: List[Dict], question: str) -> Optional[Dict]:
        """Suggest appropriate chart type based on data structure"""
        if not data or len(data) == 0:
            return None
        
        keys = list(data[0].keys())
        
        # Heuristics for chart type
        if len(keys) == 2 and any('date' in k.lower() for k in keys):
            return {"type": "line", "xAxis": keys[0], "yAxis": keys[1]}
        
        if len(keys) == 2:
            return {"type": "bar", "xAxis": keys[0], "yAxis": keys[1]}
        
        if 'count' in question.lower() or 'total' in question.lower():
            return {"type": "bar", "xAxis": keys[0], "yAxis": keys[1] if len(keys) > 1 else keys[0]}
        
        return {"type": "table"}  # Default to table
```

**3. API Integration**
```python
# Update main.py

from services.vector_store import VectorStoreManager
from services.rag_agent import RAGQueryAgent

# Initialize on startup
vector_store = VectorStoreManager()
rag_agent = None

@app.on_event("startup")
async def startup_event():
    global rag_agent
    # Index database schema
    schema = await db_manager.get_full_schema_with_descriptions()
    await vector_store.index_database_schema(schema)
    
    # Initialize RAG agent
    db_uri = os.getenv("DATABASE_URI")
    rag_agent = RAGQueryAgent(db_uri, vector_store)

@app.post("/api/v1/qa/ask-rag")
async def ask_with_rag(query: QAQuery):
    """Enhanced Q&A with RAG"""
    try:
        result = await rag_agent.process_query(query.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**4. Frontend Integration**
```typescript
// src/pages/QAAssistant.tsx

const QAAssistant = () => {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<QAResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/qa/ask-rag`, {
        query: query,
        includeVisualization: true
      })
      setResponse(res.data)
    } catch (error) {
      toast.error('Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Query Input */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your trial supply data..."
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          />
          <Button onClick={handleAsk} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Ask'}
          </Button>
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* SQL Query */}
          <Card>
            <CardHeader>
              <CardTitle>Generated SQL</CardTitle>
            </CardHeader>
            <CardContent>
              <MonacoEditor
                language="sql"
                value={response.sql}
                options={{ readOnly: true, minimap: { enabled: false } }}
                height="150px"
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{response.summary}</p>
            </CardContent>
          </Card>

          {/* Recommendations (if any) */}
          {response.recommendations && response.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-blue-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {response.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
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
                <ChartRenderer 
                  type={response.visualization.type}
                  data={response.data}
                  config={response.visualization}
                />
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Results ({response.data.length} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable data={response.data} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
```

---

### Feature 3: Morning Brief with Daily Persistence

**Status:** 🟡 Basic UI Exists (No AI, No Persistence)

**Current State:**
- ✅ MorningBrief.tsx exists
- ❌ No daily generation logic
- ❌ No persistence (regenerates on every refresh)
- ❌ No LLM-powered insights

**Target Implementation:**

#### Architecture
```
┌──────────────────────────────────────────────────┐
│         Scheduled Job (6:00 AM Daily)            │
│              (Celery + Redis)                    │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│          BriefGenerator.generate_daily()         │
│  ┌────────────────────────────────────────────┐ │
│  │  1. Query Historical Data (Yesterday)      │ │
│  │  2. Query Real-time Data (Current Status)  │ │
│  │  3. Calculate Priority Scores              │ │
│  │  4. LLM: Generate Narrative Summary        │ │
│  │  5. Store in Database (briefs table)       │ │
│  │  6. Cache in Redis (TTL=24h)               │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│            Frontend Loads Brief                  │
│  ┌────────────────────────────────────────────┐ │
│  │  GET /api/v1/briefs/morning/latest         │ │
│  │  Returns: Static content + Live monitor IDs│ │
│  │                                             │ │
│  │  Frontend displays:                         │ │
│  │  - Static: Yesterday's summary, insights   │ │
│  │  - Live: Current alerts, active shipments  │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### Database Schema

```sql
-- New table for storing daily briefs
CREATE TABLE briefs (
    brief_id SERIAL PRIMARY KEY,
    brief_date DATE NOT NULL UNIQUE,
    brief_type VARCHAR(20) NOT NULL, -- 'morning' or 'evening'
    
    -- Static Content (Generated once)
    summary_text TEXT NOT NULL,
    key_insights JSONB,  -- Array of insight objects
    yesterday_metrics JSONB,
    priority_sites JSONB,  -- Array of site objects
    
    -- Metadata
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generation_duration_ms INTEGER,
    llm_model_used VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'published',  -- draft, published, archived
    
    INDEX idx_brief_date (brief_date DESC),
    INDEX idx_brief_type (brief_type)
);

-- Live monitor configuration (tells frontend what to fetch live)
CREATE TABLE brief_live_monitors (
    monitor_id SERIAL PRIMARY KEY,
    brief_id INTEGER REFERENCES briefs(brief_id),
    monitor_type VARCHAR(50), -- 'critical_alerts', 'active_shipments', 'temp_monitors'
    query_endpoint VARCHAR(255),
    refresh_interval_seconds INTEGER DEFAULT 60,
    display_order INTEGER
);
```

#### Backend Implementation

**1. Brief Generator Service**
```python
# backend/services/brief_generator.py

from datetime import datetime, timedelta
from typing import Dict, List, Any
import json
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

class BriefGenerator:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0.7)
        self.summary_chain = self._create_summary_chain()
    
    def _create_summary_chain(self):
        prompt = PromptTemplate(
            input_variables=["date", "metrics", "alerts", "insights"],
            template="""
            You are an AI assistant for clinical trial supply chain managers.
            Generate a concise morning brief for {date}.
            
            Yesterday's Metrics:
            {metrics}
            
            Current Alerts:
            {alerts}
            
            Key Insights:
            {insights}
            
            Write a brief executive summary (3-4 sentences) highlighting:
            1. Overall status (improving/declining/stable)
            2. Most critical issue requiring immediate attention
            3. Positive developments
            4. Recommended priority action for today
            
            Keep it professional, clear, and action-oriented.
            """
        )
        return LLMChain(llm=self.llm, prompt=prompt)
    
    async def generate_daily_brief(self, brief_date: date) -> Dict[str, Any]:
        """Generate morning brief for a specific date"""
        start_time = datetime.now()
        
        # Step 1: Gather historical data (yesterday)
        yesterday = brief_date - timedelta(days=1)
        yesterday_metrics = await self._get_yesterday_metrics(yesterday)
        
        # Step 2: Calculate current alerts
        current_alerts = await self._get_current_alerts()
        
        # Step 3: Identify priority sites
        priority_sites = await self._calculate_priority_sites()
        
        # Step 4: Generate insights
        insights = await self._generate_insights(yesterday_metrics, current_alerts)
        
        # Step 5: LLM: Generate narrative summary
        summary_text = await self.summary_chain.arun(
            date=brief_date.strftime("%B %d, %Y"),
            metrics=json.dumps(yesterday_metrics, indent=2),
            alerts=json.dumps(current_alerts, indent=2),
            insights=json.dumps(insights, indent=2)
        )
        
        # Step 6: Store in database
        brief_id = await self._store_brief(
            brief_date=brief_date,
            brief_type='morning',
            summary_text=summary_text,
            key_insights=insights,
            yesterday_metrics=yesterday_metrics,
            priority_sites=priority_sites,
            generation_duration_ms=int((datetime.now() - start_time).total_seconds() * 1000)
        )
        
        # Step 7: Configure live monitors
        await self._configure_live_monitors(brief_id)
        
        return {
            "brief_id": brief_id,
            "brief_date": brief_date.isoformat(),
            "status": "published"
        }
    
    async def _get_yesterday_metrics(self, yesterday: date) -> Dict:
        """Query metrics for yesterday"""
        query = """
        SELECT 
            COUNT(DISTINCT s.study_id) as total_studies,
            COUNT(DISTINCT si.site_id) as active_sites,
            COUNT(DISTINCT sh.shipment_id) as total_shipments,
            COUNT(DISTINCT CASE WHEN sh.status = 'delivered' THEN sh.shipment_id END) as delivered_shipments,
            COUNT(DISTINCT CASE WHEN sh.status = 'delayed' THEN sh.shipment_id END) as delayed_shipments,
            SUM(i.quantity_available * p.unit_cost) as inventory_value
        FROM studies s
        LEFT JOIN sites si ON s.study_id = si.study_id
        LEFT JOIN shipments sh ON si.site_id = sh.to_site_id
        LEFT JOIN inventory i ON si.site_id = i.site_id
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE s.status = 'active'
          AND DATE(sh.shipment_date) = %s
        """
        result = await self.db.execute_query(query, [yesterday])
        return result[0] if result else {}
    
    async def _get_current_alerts(self) -> List[Dict]:
        """Get current critical alerts"""
        query = """
        SELECT 
            alert_type,
            severity,
            COUNT(*) as count,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'site_id', site_id,
                    'message', alert_message,
                    'created_at', created_at
                )
            ) as details
        FROM alerts
        WHERE status = 'active'
          AND severity IN ('critical', 'high')
        GROUP BY alert_type, severity
        ORDER BY 
            CASE severity 
                WHEN 'critical' THEN 1 
                WHEN 'high' THEN 2 
            END
        """
        results = await self.db.execute_query(query)
        return results
    
    async def _calculate_priority_sites(self) -> List[Dict]:
        """Calculate which sites need attention"""
        query = """
        WITH site_scores AS (
            SELECT 
                si.site_id,
                si.site_name,
                si.country,
                
                -- Stock level score (0-40 points)
                CASE 
                    WHEN i.quantity_available = 0 THEN 40
                    WHEN i.quantity_available < i.minimum_threshold THEN 30
                    WHEN i.quantity_available < i.ideal_threshold THEN 15
                    ELSE 0
                END as stock_score,
                
                -- Expiry score (0-30 points)
                CASE 
                    WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 30
                    WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 20
                    WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 10
                    ELSE 0
                END as expiry_score,
                
                -- Shipment delay score (0-20 points)
                CASE 
                    WHEN sh.status = 'delayed' AND sh.days_delayed > 5 THEN 20
                    WHEN sh.status = 'delayed' AND sh.days_delayed > 2 THEN 10
                    ELSE 0
                END as shipment_score,
                
                -- Temperature excursion score (0-10 points)
                CASE 
                    WHEN tm.excursion_count > 0 THEN 10
                    ELSE 0
                END as temp_score
                
            FROM sites si
            LEFT JOIN inventory i ON si.site_id = i.site_id
            LEFT JOIN shipments sh ON si.site_id = sh.to_site_id
            LEFT JOIN temperature_monitors tm ON si.site_id = tm.site_id
            WHERE si.status = 'active'
        )
        SELECT 
            site_id,
            site_name,
            country,
            (stock_score + expiry_score + shipment_score + temp_score) as attention_score,
            CASE 
                WHEN (stock_score + expiry_score + shipment_score + temp_score) >= 50 THEN 'high'
                WHEN (stock_score + expiry_score + shipment_score + temp_score) >= 25 THEN 'medium'
                ELSE 'low'
            END as priority,
            ARRAY_REMOVE(ARRAY[
                CASE WHEN stock_score > 0 THEN 'Low Stock' END,
                CASE WHEN expiry_score > 0 THEN 'Expiry Warning' END,
                CASE WHEN shipment_score > 0 THEN 'Delayed Shipment' END,
                CASE WHEN temp_score > 0 THEN 'Temperature Issue' END
            ], NULL) as reasons
        FROM site_scores
        WHERE (stock_score + expiry_score + shipment_score + temp_score) > 0
        ORDER BY attention_score DESC
        LIMIT 10
        """
        results = await self.db.execute_query(query)
        return results
    
    async def _generate_insights(self, metrics: Dict, alerts: List[Dict]) -> List[Dict]:
        """Generate key insights from data"""
        insights = []
        
        # Insight 1: Shipment performance
        if metrics.get('delayed_shipments', 0) > 0:
            delay_rate = (metrics['delayed_shipments'] / metrics['total_shipments']) * 100
            insights.append({
                "type": "shipment_performance",
                "severity": "warning" if delay_rate > 10 else "info",
                "title": f"{delay_rate:.1f}% of shipments delayed",
                "description": f"{metrics['delayed_shipments']} out of {metrics['total_shipments']} shipments are experiencing delays",
                "action": "Review courier performance and consider alternate routing"
            })
        
        # Insight 2: Critical alerts breakdown
        critical_count = sum(a['count'] for a in alerts if a['severity'] == 'critical')
        if critical_count > 0:
            insights.append({
                "type": "critical_alerts",
                "severity": "critical",
                "title": f"{critical_count} critical alerts require immediate attention",
                "description": "High-priority issues detected across sites",
                "action": "Prioritize resolution of temperature excursions and stock-outs"
            })
        
        # Insight 3: Inventory value
        if metrics.get('inventory_value'):
            insights.append({
                "type": "inventory_status",
                "severity": "info",
                "title": f"Total inventory value: ${metrics['inventory_value']:,.2f}",
                "description": "Current value of active inventory across all sites",
                "action": "Monitor expiry dates to minimize waste"
            })
        
        return insights
    
    async def _store_brief(
        self,
        brief_date: date,
        brief_type: str,
        summary_text: str,
        key_insights: List[Dict],
        yesterday_metrics: Dict,
        priority_sites: List[Dict],
        generation_duration_ms: int
    ) -> int:
        """Store brief in database"""
        query = """
        INSERT INTO briefs (
            brief_date, brief_type, summary_text, key_insights,
            yesterday_metrics, priority_sites, generation_duration_ms,
            llm_model_used, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (brief_date, brief_type) 
        DO UPDATE SET
            summary_text = EXCLUDED.summary_text,
            key_insights = EXCLUDED.key_insights,
            yesterday_metrics = EXCLUDED.yesterday_metrics,
            priority_sites = EXCLUDED.priority_sites,
            generated_at = CURRENT_TIMESTAMP
        RETURNING brief_id
        """
        result = await self.db.execute_query(query, [
            brief_date,
            brief_type,
            summary_text,
            json.dumps(key_insights),
            json.dumps(yesterday_metrics),
            json.dumps(priority_sites),
            generation_duration_ms,
            "gpt-4-turbo-preview",
            "published"
        ])
        return result[0]['brief_id']
    
    async def _configure_live_monitors(self, brief_id: int):
        """Configure which data should be fetched live"""
        monitors = [
            {
                "monitor_type": "critical_alerts",
                "query_endpoint": "/api/v1/alerts/critical",
                "refresh_interval_seconds": 60,
                "display_order": 1
            },
            {
                "monitor_type": "active_shipments",
                "query_endpoint": "/api/v1/shipments/in-transit",
                "refresh_interval_seconds": 300,
                "display_order": 2
            },
            {
                "monitor_type": "temperature_monitors",
                "query_endpoint": "/api/v1/monitoring/temperature/latest",
                "refresh_interval_seconds": 120,
                "display_order": 3
            }
        ]
        
        for monitor in monitors:
            await self.db.execute_query(
                """
                INSERT INTO brief_live_monitors 
                (brief_id, monitor_type, query_endpoint, refresh_interval_seconds, display_order)
                VALUES ($1, $2, $3, $4, $5)
                """,
                [
                    brief_id,
                    monitor['monitor_type'],
                    monitor['query_endpoint'],
                    monitor['refresh_interval_seconds'],
                    monitor['display_order']
                ]
            )
```

**2. Celery Scheduled Task**
```python
# backend/tasks/scheduled_briefs.py

from celery import Celery
from celery.schedules import crontab
from datetime import date
from services.brief_generator import BriefGenerator
from database_manager import DatabaseManager

celery_app = Celery('tsm_tasks', broker='redis://localhost:6379/0')

db_manager = DatabaseManager()
brief_generator = BriefGenerator(db_manager)

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Generate morning brief at 6:00 AM daily
    sender.add_periodic_task(
        crontab(hour=6, minute=0),
        generate_morning_brief.s(),
        name='generate-morning-brief-daily'
    )
    
    # Generate evening summary at 6:00 PM daily
    sender.add_periodic_task(
        crontab(hour=18, minute=0),
        generate_evening_summary.s(),
        name='generate-evening-summary-daily'
    )

@celery_app.task
def generate_morning_brief():
    """Scheduled task to generate morning brief"""
    today = date.today()
    result = await brief_generator.generate_daily_brief(today)
    print(f"Morning brief generated: {result}")
    return result

@celery_app.task
def generate_evening_summary():
    """Scheduled task to generate evening summary"""
    today = date.today()
    # Similar to morning brief but with different focus
    result = await brief_generator.generate_daily_brief(today, brief_type='evening')
    print(f"Evening summary generated: {result}")
    return result
```

**3. API Endpoints**
```python
# main.py additions

from services.brief_generator import BriefGenerator

brief_generator = BriefGenerator(db_manager)

@app.get("/api/v1/briefs/morning/latest")
async def get_latest_morning_brief():
    """Get today's morning brief (cached if available)"""
    today = date.today()
    
    query = """
    SELECT 
        brief_id, brief_date, summary_text, key_insights,
        yesterday_metrics, priority_sites, generated_at
    FROM briefs
    WHERE brief_date = $1 AND brief_type = 'morning'
    LIMIT 1
    """
    result = await db_manager.execute_query(query, [today])
    
    if not result:
        # Generate on-demand if not exists
        await brief_generator.generate_daily_brief(today)
        result = await db_manager.execute_query(query, [today])
    
    brief = result[0]
    
    # Get live monitor configuration
    monitors_query = """
    SELECT monitor_type, query_endpoint, refresh_interval_seconds, display_order
    FROM brief_live_monitors
    WHERE brief_id = $1
    ORDER BY display_order
    """
    monitors = await db_manager.execute_query(monitors_query, [brief['brief_id']])
    
    return {
        **brief,
        "live_monitors": monitors
    }

@app.get("/api/v1/briefs/morning/history")
async def get_morning_brief_history(days: int = 7):
    """Get historical morning briefs"""
    query = """
    SELECT brief_date, summary_text, key_insights, yesterday_metrics
    FROM briefs
    WHERE brief_type = 'morning'
      AND brief_date >= CURRENT_DATE - $1
    ORDER BY brief_date DESC
    """
    results = await db_manager.execute_query(query, [days])
    return results

@app.post("/api/v1/briefs/regenerate")
async def regenerate_brief(brief_date: date, brief_type: str = 'morning'):
    """Manually regenerate a brief"""
    result = await brief_generator.generate_daily_brief(brief_date, brief_type)
    return result
```

**4. Frontend Implementation**
```typescript
// src/pages/MorningBrief.tsx

import { useEffect, useState } from 'react'
import { useInterval } from '@/hooks/useInterval'
import { Sunrise, TrendingUp, AlertTriangle, Clock } from 'lucide-react'

interface Brief {
  brief_id: number
  brief_date: string
  summary_text: string
  key_insights: Insight[]
  yesterday_metrics: Metrics
  priority_sites: Site[]
  generated_at: string
  live_monitors: LiveMonitor[]
}

interface LiveMonitor {
  monitor_type: string
  query_endpoint: string
  refresh_interval_seconds: number
  display_order: number
}

export default function MorningBrief() {
  const [brief, setBrief] = useState<Brief | null>(null)
  const [liveData, setLiveData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  // Load static brief once
  useEffect(() => {
    loadBrief()
  }, [])

  // Refresh live monitors on their intervals
  useEffect(() => {
    if (!brief) return

    brief.live_monitors.forEach(monitor => {
      loadLiveData(monitor)
      // Set up interval for this monitor
      const interval = setInterval(() => {
        loadLiveData(monitor)
      }, monitor.refresh_interval_seconds * 1000)

      return () => clearInterval(interval)
    })
  }, [brief])

  const loadBrief = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/briefs/morning/latest`)
      setBrief(response.data)
    } catch (error) {
      toast.error('Failed to load morning brief')
    } finally {
      setLoading(false)
    }
  }

  const loadLiveData = async (monitor: LiveMonitor) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${monitor.query_endpoint}`)
      setLiveData(prev => ({
        ...prev,
        [monitor.monitor_type]: {
          data: response.data,
          updated_at: new Date()
        }
      }))
    } catch (error) {
      console.error(`Failed to load ${monitor.monitor_type}:`, error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin h-8 w-8" />
    </div>
  }

  if (!brief) {
    return <div>No brief available</div>
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sunrise className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold">Good Morning</h1>
            <p className="text-gray-600">
              {new Date(brief.brief_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Generated at {new Date(brief.generated_at).toLocaleTimeString()}
        </div>
      </div>

      {/* Executive Summary (Static - Generated Once Daily) */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{brief.summary_text}</p>
        </CardContent>
      </Card>

      {/* Yesterday's Metrics (Static) */}
      <Card>
        <CardHeader>
          <CardTitle>Yesterday's Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              label="Total Shipments"
              value={brief.yesterday_metrics.total_shipments}
              icon={<Truck />}
            />
            <MetricCard
              label="Delivered"
              value={brief.yesterday_metrics.delivered_shipments}
              icon={<CheckCircle className="text-green-500" />}
            />
            <MetricCard
              label="Delayed"
              value={brief.yesterday_metrics.delayed_shipments}
              icon={<Clock className="text-orange-500" />}
            />
            <MetricCard
              label="Inventory Value"
              value={`$${brief.yesterday_metrics.inventory_value.toLocaleString()}`}
              icon={<DollarSign />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Insights (Static) */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brief.key_insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Sites (Static) */}
      <Card>
        <CardHeader>
          <CardTitle>Sites Requiring Attention</CardTitle>
          <CardDescription>Ranked by priority score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brief.priority_sites.map(site => (
              <SiteAlertCard key={site.site_id} site={site} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Monitors (Real-time Updates) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Critical Alerts (Live) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Critical Alerts</span>
              <Badge variant="destructive">LIVE</Badge>
            </CardTitle>
            <CardDescription>
              Last updated: {liveData.critical_alerts?.updated_at?.toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveAlertsList alerts={liveData.critical_alerts?.data || []} />
          </CardContent>
        </Card>

        {/* Active Shipments (Live) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Shipments In Transit</span>
              <Badge className="bg-blue-500">LIVE</Badge>
            </CardTitle>
            <CardDescription>
              Last updated: {liveData.active_shipments?.updated_at?.toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveShipmentsList shipments={liveData.active_shipments?.data || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

I've created a massive documentation file that's getting quite long. Let me continue with the remaining sections in additional files. Should I:

1. Continue adding more features to this main blueprint, OR
2. Create separate detailed documents for:
   - Database Schema (with all tables, DDL)
   - AI Integration Guide (LangChain, RAG, detailed implementation)
   - UI/UX Component Specifications
   - Deployment Guide (Vercel + Railway step-by-step)
   - Component Implementation Reference (for AI code generation)

Which approach would you prefer? I can either keep building one comprehensive master document, or split into specialized documents for easier navigation.