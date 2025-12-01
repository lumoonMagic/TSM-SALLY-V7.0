# Sally TSM Agent - Complete File Structure Reference

> **Purpose**: Comprehensive file tree with descriptions for AI code assistants  
> **Last Updated**: November 25, 2025  
> **Version**: 1.0.0

---

## 📁 Project Root Structure

```
sally-integration/
├── 📂 public/                          # Static assets
├── 📂 src/                             # Frontend source code
├── 📂 sally-backend/                   # Backend Python/FastAPI
├── 📂 supabase/                        # Supabase configuration (optional)
├── 📄 package.json                     # Node.js dependencies
├── 📄 tsconfig.json                    # TypeScript configuration
├── 📄 vite.config.ts                   # Vite build configuration
├── 📄 tailwind.config.ts               # Tailwind CSS theme
├── 📄 components.json                  # Shadcn/UI configuration
├── 📄 .gitignore                       # Git ignore rules
└── 📄 README.md                        # Project documentation
```

---

## 🎨 Frontend Source (`src/`)

### Complete File Tree

```
src/
├── 📄 main.tsx                         # Application entry point
├── 📄 App.tsx                          # Main App component with routing
├── 📄 vite-env.d.ts                    # Vite environment types
├── 📄 index.css                        # Global styles
│
├── 📂 components/                      # React components
│   ├── 📄 MorningBrief.tsx            # Morning dashboard [MAIN COMPONENT]
│   ├── 📄 OnDemandQA.tsx              # Q&A Assistant [MAIN COMPONENT]
│   ├── 📄 EndOfDaySummary.tsx         # Daily summary [MAIN COMPONENT]
│   ├── 📄 EmailDraftDialog.tsx        # Email generation dialog
│   ├── 📄 ConfigurationCockpit.tsx    # System configuration panel
│   ├── 📄 ConfirmationDialog.tsx      # Generic confirmation dialog
│   │
│   └── 📂 ui/                         # Shadcn/UI components
│       ├── 📄 button.tsx              # Button component
│       ├── 📄 card.tsx                # Card layout component
│       ├── 📄 dialog.tsx              # Dialog/Modal component
│       ├── 📄 dropdown-menu.tsx       # Dropdown menu
│       ├── 📄 input.tsx               # Input field
│       ├── 📄 label.tsx               # Form label
│       ├── 📄 select.tsx              # Select dropdown
│       ├── 📄 separator.tsx           # Visual separator
│       ├── 📄 tabs.tsx                # Tab navigation
│       ├── 📄 textarea.tsx            # Multi-line input
│       ├── 📄 toast.tsx               # Toast notifications
│       ├── 📄 sonner.tsx              # Sonner toast provider
│       ├── 📄 radio-group.tsx         # Radio button group
│       └── 📄 ...                     # Other UI components
│
├── 📂 pages/                          # Page components
│   ├── 📄 Index.tsx                   # Home page
│   └── 📄 NotFound.tsx                # 404 page
│
├── 📂 lib/                            # Utility libraries
│   ├── 📄 database.ts                 # IndexedDB wrapper [CRITICAL]
│   ├── 📄 aiService.ts                # AI query processing [CRITICAL]
│   ├── 📄 utils.ts                    # General utilities
│   └── 📄 react-router-dom-proxy.tsx  # Router proxy
│
├── 📂 hooks/                          # Custom React hooks
│   ├── 📄 use-toast.ts                # Toast notification hook
│   └── 📄 use-mobile.tsx              # Mobile detection hook
│
├── 📂 types/                          # TypeScript type definitions
│   └── 📄 database.ts                 # Database entity types [CRITICAL]
│
└── 📂 styles/                         # Styling
    └── 📄 theme.ts                    # Theme configuration
```

---

## 🔧 Backend Source (`sally-backend/`)

### Complete File Tree

```
sally-backend/
├── 📄 main.py                         # FastAPI app entry point [CRITICAL]
├── 📄 requirements.txt                # Python dependencies
├── 📄 models.py                       # Pydantic data models
├── 📄 config.py                       # Configuration settings
│
├── 📂 database/                       # Database layer
│   ├── 📄 __init__.py
│   ├── 📄 manager.py                  # Database manager [CRITICAL]
│   ├── 📄 postgres_adapter.py         # PostgreSQL adapter
│   ├── 📄 mysql_adapter.py            # MySQL adapter
│   ├── 📄 oracle_adapter.py           # Oracle adapter
│   ├── 📄 mongodb_adapter.py          # MongoDB adapter
│   └── 📄 sqlite_adapter.py           # SQLite adapter
│
├── 📂 ai/                             # AI/LLM integration
│   ├── 📄 __init__.py
│   ├── 📄 gemini_agent.py             # Gemini AI agent [CRITICAL]
│   ├── 📄 prompt_templates.py         # AI prompt templates
│   └── 📄 sql_validator.py            # SQL validation utilities
│
├── 📂 api/                            # API routes
│   ├── 📄 __init__.py
│   ├── 📄 database_routes.py          # Database endpoints
│   ├── 📄 qa_routes.py                # Q&A endpoints
│   ├── 📄 inventory_routes.py         # Inventory endpoints
│   └── 📄 dashboard_routes.py         # Dashboard endpoints
│
├── 📂 services/                       # Business logic
│   ├── 📄 __init__.py
│   ├── 📄 inventory_service.py        # Inventory operations
│   ├── 📄 shipment_service.py         # Shipment operations
│   └── 📄 email_service.py            # Email generation
│
└── 📂 utils/                          # Utilities
    ├── 📄 __init__.py
    ├── 📄 logger.py                   # Logging configuration
    ├── 📄 validators.py               # Input validation
    └── 📄 formatters.py               # Data formatting
```

---

## 📄 Detailed File Descriptions

### Frontend Entry Points

#### `src/main.tsx` ⭐
**Purpose**: Application entry point, renders React app  
**Type**: TypeScript React  
**Key Imports**: React, ReactDOM, App, index.css  
**Function**: Mounts React app to DOM  
**AI Context**: This is where the app starts. Modify for global providers or analytics.

```typescript
// Key code structure
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**When to modify**:
- Adding global providers (Redux, Context)
- Adding analytics tracking
- Adding error boundaries

---

#### `src/App.tsx` ⭐⭐⭐
**Purpose**: Main app component with routing and layout  
**Type**: TypeScript React Component  
**Key Features**: React Router, Layout wrapper, Route definitions  
**AI Context**: Define all app routes here. Add new pages by creating route entries.

```typescript
// Key structure
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/morning-brief" element={<MorningBrief />} />
          <Route path="/qa-assistant" element={<OnDemandQA />} />
          // ... more routes
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
```

**When to modify**:
- Adding new pages/routes
- Changing layout structure
- Adding route guards/authentication

**Related Files**:
- `src/components/Layout.tsx` - Layout wrapper
- All page components

---

### Core Components

#### `src/components/MorningBrief.tsx` ⭐⭐⭐
**Lines of Code**: ~300  
**Purpose**: Morning dashboard with priorities and highlights  
**Dependencies**: react, lucide-react, database.ts, ui/card  
**Data Sources**: IndexedDB (shipments, inventory)  
**State**: priorities[], highlights[], loading  
**Renders**: Priority cards, highlight cards, action buttons  
**AI Context**: Main dashboard component. Modify to add new metrics or change layout.

**Key Functions**:
```typescript
// Calculate priorities from data
function calculatePriorities(shipments, inventory): Priority[]

// Calculate highlights
function calculateHighlights(shipments): Highlight[]

// Handle priority click
function handlePriorityClick(priority: Priority): void
```

**Styling**: Dark green theme, responsive grid, card-based  
**Performance**: Fetches data on mount, caches in state  
**Error Handling**: Graceful fallback if data fetch fails

**Customization Points**:
- Priority calculation logic (line ~50)
- Highlight filters (line ~80)
- Card design (line ~150)
- Action handlers (line ~200)

---

#### `src/components/OnDemandQA.tsx` ⭐⭐⭐
**Lines of Code**: ~450  
**Purpose**: AI-powered Q&A assistant with natural language queries  
**Dependencies**: react, recharts, aiService.ts, database.ts  
**Data Sources**: AI service, IndexedDB  
**State**: messages[], input, isLoading, visualization  
**Renders**: Chat interface, data tables, charts  
**AI Context**: Main AI interaction component. Extend for new query types or chart types.

**Key Functions**:
```typescript
// Send user query
async function handleSend(): Promise<void>

// Process AI response
async function processQuery(question: string): Promise<AIResponse>

// Render visualization
function renderVisualization(data, type): JSX.Element

// Copy SQL to clipboard
function copySQLToClipboard(sql: string): void
```

**Chart Types Supported**:
- Bar Chart (quantity comparisons)
- Line Chart (trends)
- Pie Chart (distributions)
- Table (detailed data)

**Query Examples**:
```typescript
const QUERY_EXAMPLES = [
  "Show me low stock items",
  "What shipments are delayed?",
  "Total inventory value by site",
  "Shipment trends this month"
]
```

**Customization Points**:
- Query suggestions (line ~30)
- Chart rendering logic (line ~250)
- Message formatting (line ~350)

---

#### `src/components/EndOfDaySummary.tsx` ⭐⭐
**Lines of Code**: ~200  
**Purpose**: Daily summary with completed and pending tasks  
**Dependencies**: react, date-fns, database.ts  
**Data Sources**: IndexedDB (tasks)  
**State**: completedActions[], pendingActions[], stats  
**Renders**: Statistics cards, task lists  
**AI Context**: End of day reporting. Modify for custom metrics.

**Key Functions**:
```typescript
// Fetch today's tasks
async function fetchTodayTasks(): Promise<Task[]>

// Calculate statistics
function calculateStats(tasks: Task[]): Stats

// Format task display
function formatTask(task: Task): JSX.Element
```

---

#### `src/components/EmailDraftDialog.tsx` ⭐⭐
**Lines of Code**: ~250  
**Purpose**: Email template generation with copy functionality  
**Dependencies**: react, ui/dialog, ui/textarea  
**Props**: open, onOpenChange, emailType, context  
**State**: draftContent, copied  
**Renders**: Modal dialog with editable email draft  
**AI Context**: Email generation. Add new templates or integrate with SMTP.

**Email Types**:
- `vendor` - Communication with suppliers
- `internal` - Team alerts and updates
- `customer` - Patient/customer notifications

**Template Variables**:
```typescript
{vendor_name}, {shipment_id}, {due_date}, {urgency}, 
{product_name}, {quantity}, {site_name}
```

**Customization Points**:
- Email templates (line ~40)
- Variable substitution (line ~100)
- SMTP integration (line ~150)

---

### Core Services

#### `src/lib/database.ts` ⭐⭐⭐⭐⭐
**Lines of Code**: ~600  
**Purpose**: IndexedDB wrapper for local data storage (demo mode)  
**Critical**: YES - All data flows through this  
**Dependencies**: None (native IndexedDB)  
**Exports**: 20+ functions for CRUD operations  
**AI Context**: PRIMARY data layer in demo mode. Switch to API calls for production.

**Database Schema**:
```typescript
Stores: inventory, shipments, sites, studies, tasks, vendors
Indexes: site_id, status, date fields
```

**Key Functions**:
```typescript
// Initialize database
async function initDatabase(): Promise<IDBDatabase>

// Fetch operations
async function fetchInventory(filters?): Promise<Inventory[]>
async function fetchShipments(filters?): Promise<Shipment[]>
async function fetchTasks(filters?): Promise<Task[]>

// CRUD operations
async function addInventory(item: Inventory): Promise<number>
async function updateInventory(id: number, updates): Promise<void>
async function deleteInventory(id: number): Promise<void>

// SQL query execution (simplified)
async function executeSQLQuery(query: string): Promise<any[]>

// Mock data generation
async function seedDatabase(): Promise<void>
```

**Production Mode Switch**:
```typescript
// Current (demo)
export async function fetchInventory() {
  return await getFromIndexedDB('inventory')
}

// Production (with backend)
export async function fetchInventory() {
  if (import.meta.env.PROD && API_AVAILABLE) {
    const response = await fetch('/api/v1/inventory')
    return await response.json()
  }
  return await getFromIndexedDB('inventory')
}
```

**Customization Points**:
- Add new stores (line ~50)
- Modify schema (line ~80)
- Add API switch logic (line ~500)

---

#### `src/lib/aiService.ts` ⭐⭐⭐⭐
**Lines of Code**: ~400  
**Purpose**: AI query processing - natural language to SQL  
**Critical**: YES - Powers Q&A assistant  
**Dependencies**: database.ts  
**Modes**: Rule-based (demo), Gemini AI (production)  
**AI Context**: Query processing logic. Extend patterns or integrate with backend.

**Query Patterns** (Demo Mode):
```typescript
const patterns = [
  {
    keywords: ['low stock', 'shortage', 'inventory low'],
    sql: 'SELECT * FROM inventory WHERE quantity < reorder_point',
    chartType: 'bar'
  },
  {
    keywords: ['delayed', 'overdue shipment'],
    sql: 'SELECT * FROM shipments WHERE status = "delayed"',
    chartType: 'table'
  },
  // ... 20+ patterns
]
```

**Key Functions**:
```typescript
// Main processing pipeline
async function processQuery(question: string): Promise<AIResponse>

// Pattern matching (demo)
function matchQueryPattern(question: string): Pattern | null

// SQL generation (production with Gemini)
async function generateSQL(question: string): Promise<string>

// Determine chart type
function suggestChartType(data: any[], query: string): ChartType

// Format results for display
function formatResults(data: any[]): FormattedResult
```

**Production Integration**:
```typescript
async function processQuery(question: string): Promise<AIResponse> {
  if (BACKEND_AVAILABLE) {
    // Call backend Gemini API
    const response = await fetch('/api/v1/qa/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    })
    return await response.json()
  } else {
    // Use rule-based patterns
    return patternMatchQuery(question)
  }
}
```

**Customization Points**:
- Add query patterns (line ~50)
- Modify chart selection (line ~200)
- Add API integration (line ~300)

---

### Type Definitions

#### `src/types/database.ts` ⭐⭐⭐⭐⭐
**Lines of Code**: ~150  
**Purpose**: TypeScript interfaces for all database entities  
**Critical**: YES - Defines data contracts  
**Dependencies**: None  
**Exports**: 10+ interfaces  
**AI Context**: MUST match backend schema. Update when adding fields.

**All Interfaces**:
```typescript
interface Inventory { ... }      // 15 fields
interface Shipment { ... }       // 12 fields + items[]
interface ShipmentItem { ... }   // 3 fields
interface Site { ... }           // 11 fields
interface Study { ... }          // 10 fields
interface Task { ... }           // 12 fields
interface Vendor { ... }         // 10 fields
```

**Usage Example**:
```typescript
import type { Inventory, Shipment } from '@/types/database'

const inventory: Inventory = {
  id: 1,
  product_name: "Drug A",
  quantity: 50,
  // ... TypeScript ensures all required fields
}
```

**When to modify**:
- Adding new fields to entities
- Creating new entity types
- Changing field types

**Validation**: TypeScript compile-time type checking

---

### Backend Core

#### `sally-backend/main.py` ⭐⭐⭐⭐⭐
**Lines of Code**: ~400  
**Purpose**: FastAPI application entry point with all routes  
**Critical**: YES - Backend API server  
**Dependencies**: FastAPI, SQLAlchemy, Pydantic  
**Exports**: FastAPI app instance  
**AI Context**: Define all API endpoints here. Follow RESTful conventions.

**Server Setup**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sally TSM API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**API Routes**:
```python
# Health check
@app.get("/api/v1/health")
async def health_check()

# Database
@app.post("/api/v1/database/test-connection")
async def test_connection(config: DatabaseConfig)

@app.post("/api/v1/database/create-schema")
async def create_schema(schema: SchemaConfig)

# Q&A
@app.post("/api/v1/qa/ask")
async def qa_ask(request: QARequest)

@app.post("/api/v1/qa/execute")
async def qa_execute(request: ExecuteRequest)

# Inventory
@app.get("/api/v1/inventory")
async def get_inventory(site_id: Optional[int], status: Optional[str])

@app.post("/api/v1/inventory")
async def create_inventory(item: Inventory)

# Dashboard
@app.get("/api/v1/dashboard/metrics")
async def get_metrics()
```

**Error Handling**:
```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)}
    )
```

**Customization Points**:
- Add new endpoints (anywhere)
- Modify CORS origins (line ~20)
- Add authentication middleware (line ~30)

---

#### `sally-backend/database/manager.py` ⭐⭐⭐⭐⭐
**Lines of Code**: ~800  
**Purpose**: Unified database manager for all database types  
**Critical**: YES - Database abstraction layer  
**Supported**: PostgreSQL, MySQL, Oracle, MongoDB, SQLite  
**Dependencies**: psycopg2, pymysql, cx_Oracle, pymongo, sqlite3  
**AI Context**: Add new database type by creating adapter class.

**Class Structure**:
```python
class DatabaseManager:
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.adapter = self._create_adapter()
    
    def _create_adapter(self):
        """Factory pattern for database adapters"""
        if self.config.type == 'postgres':
            return PostgresAdapter(self.config)
        elif self.config.type == 'mysql':
            return MySQLAdapter(self.config)
        # ... other adapters
    
    async def connect(self) -> bool:
        return await self.adapter.connect()
    
    async def execute_query(self, query: str) -> List[Dict]:
        return await self.adapter.execute(query)
    
    async def test_connection(self) -> Dict:
        """Test if database is accessible"""
    
    async def create_schema(self, schema: Dict) -> Dict:
        """Create tables from schema definition"""
    
    async def seed_data(self, table: str, data: List[Dict]) -> int:
        """Insert mock/seed data"""
```

**Database Adapters**:
```python
class PostgresAdapter:
    async def connect(self):
        self.conn = psycopg2.connect(...)
    
    async def execute(self, query: str):
        cursor = self.conn.cursor()
        cursor.execute(query)
        return cursor.fetchall()

class MongoDBAdapter:
    async def connect(self):
        self.client = MongoClient(...)
    
    async def execute(self, query: Dict):
        # MongoDB query format
        collection = self.client[db][collection]
        return list(collection.find(query))
```

**Customization Points**:
- Add new database type (create new adapter)
- Modify connection pooling (line ~100)
- Add query caching (line ~400)

---

#### `sally-backend/ai/gemini_agent.py` ⭐⭐⭐⭐⭐
**Lines of Code**: ~500  
**Purpose**: Gemini AI integration for natural language to SQL  
**Critical**: YES - AI brain of the system  
**Dependencies**: google-generativeai  
**API**: Google Gemini API  
**AI Context**: Modify prompts to improve SQL generation accuracy.

**Class Structure**:
```python
class GeminiAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = None
        self.schema_context = {}
    
    async def initialize(self):
        """Initialize Gemini API client"""
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def generate_sql(
        self, 
        question: str, 
        schema: Dict
    ) -> SQLResponse:
        """Generate SQL from natural language"""
        prompt = self._build_prompt(question, schema)
        response = await self.model.generate_content_async(prompt)
        return self._parse_response(response)
    
    def _build_prompt(self, question: str, schema: Dict) -> str:
        """Construct prompt for Gemini"""
        return f"""
        You are a SQL expert for a Trial Supply Management system.
        
        Schema: {json.dumps(schema)}
        Question: {question}
        
        Generate SQL query and explanation...
        """
    
    async def process_question(self, question: str) -> AIResponse:
        """Full pipeline: generate SQL, validate, execute"""
```

**Prompt Engineering**:
```python
SYSTEM_PROMPT = """
You are an expert SQL developer for a pharmaceutical trial supply 
management system. Generate accurate, efficient SQL queries.

Rules:
1. Use only tables/columns from provided schema
2. Always include LIMIT for safety
3. Suggest appropriate chart type (bar, line, pie, table)
4. Explain query in simple terms

Output JSON: {"sql": "...", "explanation": "...", "chart_type": "..."}
"""
```

**Customization Points**:
- Modify system prompt (line ~50)
- Add SQL validation rules (line ~200)
- Customize response parsing (line ~350)
- Add query optimization (line ~450)

---

## 📦 Configuration Files

### `package.json`
**Purpose**: Node.js project configuration and dependencies  
**Critical**: YES - Defines all frontend dependencies  
**Key Sections**: scripts, dependencies, devDependencies

```json
{
  "name": "sally-tsm-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.55.0"
  }
}
```

**When to modify**:
- Adding new npm packages: `npm install package-name`
- Updating dependencies: `npm update`
- Adding custom scripts

---

### `tsconfig.json`
**Purpose**: TypeScript compiler configuration  
**Critical**: YES - Defines TypeScript behavior  
**Key Settings**: target, module, paths

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**Path Aliases**:
```typescript
// Instead of: import { Button } from '../../../components/ui/button'
// Use: import { Button } from '@/components/ui/button'
```

---

### `vite.config.ts`
**Purpose**: Vite build tool configuration  
**Critical**: YES - Controls build process  
**Key Settings**: plugins, resolve, server

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

**Customization Points**:
- Change dev server port (line ~11)
- Add API proxy for backend (line ~13)
- Modify build output (line ~20)

---

### `tailwind.config.ts`
**Purpose**: Tailwind CSS theme configuration  
**Critical**: YES - Defines design system  
**Key Sections**: colors, fonts, spacing

```typescript
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* green shades */ },
        dark: { /* dark theme */ },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

---

### `sally-backend/requirements.txt`
**Purpose**: Python dependencies for backend  
**Critical**: YES - Defines all backend dependencies

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
python-dotenv==1.0.0

# Database drivers
psycopg2-binary==2.9.9
pymysql==1.1.0
cx-Oracle==8.3.0
pymongo==4.6.0

# AI
google-generativeai==0.3.0

# Utilities
python-dateutil==2.8.2
```

**Installation**:
```bash
pip install -r requirements.txt
```

---

## 🔍 File Categories

### Critical Files (Must Understand)
1. `src/lib/database.ts` - Data layer
2. `src/lib/aiService.ts` - AI processing
3. `src/types/database.ts` - Type definitions
4. `sally-backend/main.py` - API server
5. `sally-backend/database/manager.py` - Database manager
6. `sally-backend/ai/gemini_agent.py` - AI agent

### Main Components (User-Facing)
1. `src/components/MorningBrief.tsx` - Dashboard
2. `src/components/OnDemandQA.tsx` - Q&A assistant
3. `src/components/EndOfDaySummary.tsx` - Daily summary
4. `src/components/EmailDraftDialog.tsx` - Email generation
5. `src/components/ConfigurationCockpit.tsx` - Configuration

### Configuration Files
1. `package.json` - Node dependencies
2. `tsconfig.json` - TypeScript config
3. `vite.config.ts` - Build config
4. `tailwind.config.ts` - Styling config
5. `sally-backend/requirements.txt` - Python dependencies

### Documentation Files
1. `README.md` - Project overview
2. `BACKEND_INTEGRATION_PLAN.md` - Architecture
3. `MODULE_REFERENCE.md` - Module documentation
4. `FILE_STRUCTURE.md` - This file
5. `CLOUD_DEPLOYMENT_GUIDE.md` - Deployment instructions

---

## 🎯 Quick Navigation

### Adding New Feature Checklist

**Frontend Feature**:
1. ✅ Create component in `src/components/`
2. ✅ Add types in `src/types/database.ts`
3. ✅ Add data functions in `src/lib/database.ts`
4. ✅ Add route in `src/App.tsx`
5. ✅ Style with Tailwind classes

**Backend Feature**:
1. ✅ Add endpoint in `sally-backend/main.py`
2. ✅ Add Pydantic model in `sally-backend/models.py`
3. ✅ Implement logic in appropriate service file
4. ✅ Add database operations in `manager.py`
5. ✅ Test with `/docs` (Swagger UI)

**Database Change**:
1. ✅ Update TypeScript types in `src/types/database.ts`
2. ✅ Update Pydantic models in `sally-backend/models.py`
3. ✅ Update IndexedDB schema in `src/lib/database.ts`
4. ✅ Create migration script if needed

---

## 📊 File Statistics

```
Frontend:
  Total files: ~70
  TypeScript: ~50 files
  React components: ~30 files
  Total lines: ~8,000

Backend:
  Total files: ~25
  Python files: ~20
  Total lines: ~3,500

Configuration:
  Total files: ~10

Documentation:
  Total files: ~8
  Total lines: ~5,000

Grand Total:
  ~110 files
  ~17,000 lines of code
```

---

## 🤖 AI Assistant Quick Reference

### Find Files By Feature

**Q&A Assistant**: 
- `src/components/OnDemandQA.tsx`
- `src/lib/aiService.ts`
- `sally-backend/ai/gemini_agent.py`

**Dashboard**:
- `src/components/MorningBrief.tsx`
- `src/components/EndOfDaySummary.tsx`

**Data Management**:
- `src/lib/database.ts`
- `sally-backend/database/manager.py`

**Configuration**:
- `src/components/ConfigurationCockpit.tsx`
- `sally-backend/config.py`

**Styling**:
- `src/index.css`
- `tailwind.config.ts`
- `src/components/ui/` (all UI components)

---

**This file structure guide is optimized for AI code assistants to quickly locate and understand files in the Sally TSM Agent project.**
