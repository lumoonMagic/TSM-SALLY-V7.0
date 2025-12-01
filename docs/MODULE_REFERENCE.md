# Sally TSM Agent - Module Reference

> **Purpose**: Comprehensive module documentation for AI code assistants (GitHub Copilot, VS Code extensions)  
> **Target Audience**: Developers, AI coding assistants, IDE integrations  
> **Last Updated**: November 25, 2025

---

## 📋 Document Structure

This document provides detailed information about every module, component, and file in the Sally TSM Agent project. Each entry includes:
- **Purpose**: What the module does
- **Dependencies**: Required imports and libraries
- **Exports**: Public functions, components, types
- **Usage**: How to use the module
- **Related Files**: Connected modules
- **AI Assistant Context**: Key information for code completion

---

## 🗂️ Module Categories

1. [Frontend Components](#frontend-components)
2. [Frontend Services](#frontend-services)
3. [Frontend Hooks](#frontend-hooks)
4. [Frontend Utilities](#frontend-utilities)
5. [Backend API](#backend-api)
6. [Database Layer](#database-layer)
7. [AI Services](#ai-services)
8. [Configuration](#configuration)

---

## 🎨 Frontend Components

### MorningBrief.tsx

**Location**: `src/components/MorningBrief.tsx`

**Purpose**: Main dashboard component displaying shipments & logistics overview with priorities and highlights

**Type**: React Functional Component

**Props**:
```typescript
interface MorningBriefProps {
  // No props - standalone component
}
```

**Key Features**:
- Displays priority action items (overdue goods, expedited shipments)
- Shows shipment highlights (delayed, due, overdue)
- Color-coded urgency indicators (red, yellow, green)
- Interactive cards with click handlers
- Responsive grid layout

**Dependencies**:
- `react` - useState, useEffect
- `lucide-react` - Icons (Package, AlertCircle, TrendingUp)
- `../lib/database` - fetchShipments, fetchInventory
- `../ui/card` - Card components

**State Management**:
```typescript
const [priorities, setPriorities] = useState<Priority[]>([])
const [highlights, setHighlights] = useState<Highlight[]>([])
const [loading, setLoading] = useState(true)
```

**Data Flow**:
1. Component mounts → useEffect triggers
2. Fetches shipments and inventory from IndexedDB
3. Processes data to generate priorities and highlights
4. Updates state and renders UI

**Example Usage**:
```tsx
import MorningBrief from '@/components/MorningBrief'

function Dashboard() {
  return <MorningBrief />
}
```

**Related Files**:
- `src/lib/database.ts` - Data fetching
- `src/types/database.ts` - Type definitions
- `src/components/ui/card.tsx` - UI components

**AI Assistant Notes**:
- This component should fetch real-time data when backend is connected
- Priority calculation logic is in `calculatePriorities()` function
- Color scheme: red (#ef4444), yellow (#f59e0b), green (#22c55e)

---

### OnDemandQA.tsx

**Location**: `src/components/OnDemandQA.tsx`

**Purpose**: AI-powered Q&A assistant for natural language queries about TSM data

**Type**: React Functional Component

**Props**: None

**Key Features**:
- Natural language input field
- Chat-style message display
- SQL query generation and execution
- Data visualization (tables and charts)
- Query suggestions
- Copy SQL to clipboard

**Dependencies**:
- `react` - useState, useRef, useEffect
- `lucide-react` - Send, Copy, Loader2, Database icons
- `../lib/aiService` - processQuery, executeSQLQuery
- `recharts` - BarChart, LineChart, PieChart
- `../ui/button`, `../ui/card` - UI components

**State Management**:
```typescript
const [messages, setMessages] = useState<Message[]>([])
const [input, setInput] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [sqlQuery, setSqlQuery] = useState<string | null>(null)
```

**Message Flow**:
1. User enters natural language query
2. `handleSend()` → adds user message to chat
3. `processQuery()` → AI service generates SQL
4. `executeSQLQuery()` → executes against IndexedDB
5. Results rendered as table or chart
6. AI response added to chat

**Query Processing**:
```typescript
// Example query transformation
"Show me low stock items" 
  → SELECT * FROM inventory WHERE quantity < reorder_point
  → Display results in table
```

**Chart Types**:
- **Bar Chart**: Quantity comparisons
- **Line Chart**: Trends over time
- **Pie Chart**: Distribution analysis

**Example Usage**:
```tsx
import OnDemandQA from '@/components/OnDemandQA'

function QAPage() {
  return (
    <div className="container">
      <OnDemandQA />
    </div>
  )
}
```

**AI Service Integration**:
```typescript
// In production mode with backend
const response = await fetch('/api/v1/qa/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: input })
})
```

**Related Files**:
- `src/lib/aiService.ts` - Query processing logic
- `src/lib/database.ts` - SQL execution
- `src/types/database.ts` - Data types

**AI Assistant Notes**:
- Query examples are defined in `QUERY_EXAMPLES` constant
- SQL generation uses pattern matching in demo mode
- In production, uses Gemini API via backend
- Chart type auto-selected based on data structure

---

### EndOfDaySummary.tsx

**Location**: `src/components/EndOfDaySummary.tsx`

**Purpose**: Daily summary dashboard showing completed actions, pending items, and key metrics

**Type**: React Functional Component

**Props**: None

**Key Features**:
- Summary statistics (completed, pending, total actions)
- Completed actions list with timestamps
- Pending tasks with priorities
- Progress indicators
- Date/time display

**Dependencies**:
- `react` - useState, useEffect
- `lucide-react` - CheckCircle, Clock, AlertTriangle
- `../lib/database` - fetchTasks
- `date-fns` - Date formatting

**State Management**:
```typescript
const [completedActions, setCompletedActions] = useState<Task[]>([])
const [pendingActions, setPendingActions] = useState<Task[]>([])
const [stats, setStats] = useState({ completed: 0, pending: 0, total: 0 })
```

**Data Aggregation**:
```typescript
// Calculates daily statistics
const calculateStats = (tasks: Task[]) => {
  return {
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    total: tasks.length
  }
}
```

**Example Usage**:
```tsx
import EndOfDaySummary from '@/components/EndOfDaySummary'

function DashboardPage() {
  return (
    <div className="space-y-6">
      <EndOfDaySummary />
    </div>
  )
}
```

**Related Files**:
- `src/lib/database.ts` - Task fetching
- `src/types/database.ts` - Task type definition

**AI Assistant Notes**:
- Tasks are filtered by current date
- Status calculation happens in real-time
- Color coding: green (completed), orange (pending), red (overdue)

---

### EmailDraftDialog.tsx

**Location**: `src/components/EmailDraftDialog.tsx`

**Purpose**: Dialog component for generating and displaying email drafts

**Type**: React Functional Component

**Props**:
```typescript
interface EmailDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailType: 'vendor' | 'internal' | 'customer'
  context?: {
    recipientName?: string
    subject?: string
    urgency?: 'low' | 'medium' | 'high'
    data?: any
  }
}
```

**Key Features**:
- Template-based email generation
- Context-aware content
- Copy to clipboard functionality
- Edit before sending
- Different templates for vendor/internal/customer emails

**Dependencies**:
- `react` - useState, useEffect
- `lucide-react` - Copy, Mail, Send
- `../ui/dialog` - Dialog components
- `../ui/button`, `../ui/textarea`

**Email Templates**:
```typescript
const templates = {
  vendor: `Dear {vendor_name},\n\nRegarding shipment {shipment_id}...`,
  internal: `Team,\n\nUrgent update on {topic}...`,
  customer: `Dear {customer_name},\n\nWe wanted to inform you...`
}
```

**State Management**:
```typescript
const [draftContent, setDraftContent] = useState('')
const [copied, setCopied] = useState(false)
```

**Example Usage**:
```tsx
import EmailDraftDialog from '@/components/EmailDraftDialog'

function Component() {
  const [dialogOpen, setDialogOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>Draft Email</Button>
      <EmailDraftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        emailType="vendor"
        context={{
          recipientName: "Vendor A",
          subject: "Overdue Shipment",
          urgency: "high"
        }}
      />
    </>
  )
}
```

**Related Files**:
- `src/lib/emailTemplates.ts` - Email templates
- `src/types/email.ts` - Email types

**AI Assistant Notes**:
- Template placeholders are replaced with context data
- In production mode, integrates with SMTP service
- Copy functionality uses Clipboard API

---

### ConfigurationCockpit.tsx

**Location**: `src/components/ConfigurationCockpit.tsx`

**Purpose**: Admin panel for configuring database connections, LLM settings, and system preferences

**Type**: React Functional Component

**Props**: None

**Key Features**:
- Database type selection (Postgres, MySQL, Oracle, MongoDB, SQLite)
- Connection string configuration
- Test database connection
- Gemini API key configuration
- System settings management

**Dependencies**:
- `react` - useState, useEffect
- `lucide-react` - Database, Key, Settings, CheckCircle
- `../ui/tabs`, `../ui/input`, `../ui/button`, `../ui/select`

**State Management**:
```typescript
const [databaseConfig, setDatabaseConfig] = useState({
  type: 'postgres',
  host: '',
  port: 5432,
  database: '',
  user: '',
  password: ''
})
const [geminiApiKey, setGeminiApiKey] = useState('')
const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
```

**API Integration**:
```typescript
// Test database connection
const testConnection = async () => {
  const response = await fetch('/api/v1/database/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(databaseConfig)
  })
  return await response.json()
}

// Save configuration
const saveConfig = async () => {
  await fetch('/api/v1/config/save', {
    method: 'POST',
    body: JSON.stringify({ database: databaseConfig, gemini: geminiApiKey })
  })
}
```

**Example Usage**:
```tsx
import ConfigurationCockpit from '@/components/ConfigurationCockpit'

function SettingsPage() {
  return (
    <div className="container">
      <h1>System Configuration</h1>
      <ConfigurationCockpit />
    </div>
  )
}
```

**Related Files**:
- `sally-backend/main.py` - API endpoints
- `sally-backend/database/manager.py` - Database manager

**AI Assistant Notes**:
- Configuration is stored in backend .env file
- Database passwords should be encrypted in transit
- Test connection validates credentials before saving

---

## 🔧 Frontend Services

### database.ts

**Location**: `src/lib/database.ts`

**Purpose**: IndexedDB wrapper for local data storage in demo mode

**Type**: Service Module

**Exports**:
```typescript
// Database initialization
export async function initDatabase(): Promise<IDBDatabase>

// Inventory operations
export async function fetchInventory(): Promise<Inventory[]>
export async function addInventory(item: Inventory): Promise<void>
export async function updateInventory(id: number, updates: Partial<Inventory>): Promise<void>

// Shipment operations
export async function fetchShipments(): Promise<Shipment[]>
export async function addShipment(shipment: Shipment): Promise<void>

// Site operations
export async function fetchSites(): Promise<Site[]>

// Study operations
export async function fetchStudies(): Promise<Study[]>

// Task operations
export async function fetchTasks(): Promise<Task[]>

// SQL query execution
export async function executeSQLQuery(query: string): Promise<any[]>
```

**Database Schema**:
```typescript
const DB_NAME = 'tsm_database'
const DB_VERSION = 1

const stores = {
  inventory: { keyPath: 'id', autoIncrement: true },
  shipments: { keyPath: 'id', autoIncrement: true },
  sites: { keyPath: 'id', autoIncrement: true },
  studies: { keyPath: 'id', autoIncrement: true },
  tasks: { keyPath: 'id', autoIncrement: true },
  vendors: { keyPath: 'id', autoIncrement: true }
}
```

**Mock Data Generation**:
```typescript
// Generates sample data for demo mode
export async function seedDatabase(): Promise<void> {
  const inventory = generateMockInventory(50)
  const shipments = generateMockShipments(30)
  const sites = generateMockSites(10)
  // ... seed all stores
}
```

**Query Execution**:
```typescript
// Executes SQL-like queries against IndexedDB
export async function executeSQLQuery(query: string): Promise<any[]> {
  const { table, filters, orderBy } = parseSQL(query)
  const data = await fetchFromStore(table)
  return applyFilters(data, filters).sort(orderBy)
}
```

**Example Usage**:
```typescript
import { initDatabase, fetchInventory } from '@/lib/database'

// Initialize on app start
await initDatabase()

// Fetch data
const inventory = await fetchInventory()
console.log(inventory) // Array of inventory items

// Query with SQL
const lowStock = await executeSQLQuery(
  'SELECT * FROM inventory WHERE quantity < 10 ORDER BY quantity ASC'
)
```

**Production Mode**:
In production, this module should switch to API calls:
```typescript
export async function fetchInventory(): Promise<Inventory[]> {
  if (import.meta.env.PROD) {
    const response = await fetch('/api/v1/inventory')
    return await response.json()
  } else {
    // IndexedDB for demo mode
    return await getFromIndexedDB('inventory')
  }
}
```

**Related Files**:
- `src/types/database.ts` - Type definitions
- `sally-backend/database/manager.py` - Production database

**AI Assistant Notes**:
- This is the ONLY data source in demo mode
- Must maintain backward compatibility with existing components
- SQL parser is simplified - supports basic SELECT queries only
- For production, implement API switch mechanism

---

### aiService.ts

**Location**: `src/lib/aiService.ts`

**Purpose**: AI query processing service for natural language to SQL conversion

**Type**: Service Module

**Exports**:
```typescript
// Process natural language query
export async function processQuery(question: string): Promise<AIResponse>

// Generate SQL from natural language
export async function generateSQL(question: string): Promise<string>

// Execute and format results
export async function executeAndFormat(query: string): Promise<FormattedResult>

// Get query suggestions
export function getQuerySuggestions(category?: string): string[]
```

**Type Definitions**:
```typescript
interface AIResponse {
  sql: string
  explanation: string
  results: any[]
  chartType?: 'bar' | 'line' | 'pie'
  visualization?: {
    xAxis: string
    yAxis: string
    data: any[]
  }
}
```

**Query Pattern Matching** (Demo Mode):
```typescript
const patterns = [
  {
    pattern: /low stock|inventory.*low|shortage/i,
    sql: 'SELECT * FROM inventory WHERE quantity < reorder_point',
    chartType: 'bar'
  },
  {
    pattern: /delayed shipment|overdue/i,
    sql: 'SELECT * FROM shipments WHERE status = "delayed"',
    chartType: 'table'
  },
  // ... more patterns
]
```

**Production Mode** (with Gemini):
```typescript
export async function processQuery(question: string): Promise<AIResponse> {
  if (import.meta.env.PROD && GEMINI_API_KEY) {
    // Call backend API
    const response = await fetch('/api/v1/qa/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })
    return await response.json()
  } else {
    // Use rule-based pattern matching
    return patternMatchQuery(question)
  }
}
```

**Example Usage**:
```typescript
import { processQuery, getQuerySuggestions } from '@/lib/aiService'

// Process user question
const result = await processQuery("Show me all low stock items")
console.log(result.sql) // SELECT * FROM inventory WHERE...
console.log(result.results) // Array of matching items
console.log(result.chartType) // 'bar'

// Get suggestions
const suggestions = getQuerySuggestions('inventory')
// ["Show me low stock items", "What is our total inventory value?", ...]
```

**Query Categories**:
- **Inventory**: Stock levels, reorder points, expiry
- **Shipments**: Status, delays, logistics
- **Sites**: Locations, capacity, performance
- **Studies**: Clinical trials, recruitment
- **Vendors**: Performance, reliability, issues

**Related Files**:
- `src/lib/database.ts` - Query execution
- `sally-backend/ai/gemini_agent.py` - Production AI agent

**AI Assistant Notes**:
- Demo mode uses regex patterns (fast, no API calls)
- Production mode uses Gemini for real AI understanding
- Always validate generated SQL before execution
- Chart type is inferred from query intent and result structure

---

### utils.ts

**Location**: `src/lib/utils.ts`

**Purpose**: Utility functions for common operations

**Type**: Utility Module

**Exports**:
```typescript
// Tailwind CSS class merging
export function cn(...inputs: ClassValue[]): string

// Date formatting
export function formatDate(date: Date | string, format?: string): string

// Currency formatting
export function formatCurrency(amount: number, currency?: string): string

// Status badge color
export function getStatusColor(status: string): string

// Urgency level
export function getUrgencyLevel(priority: number): 'low' | 'medium' | 'high'
```

**Implementation**:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, formatStr = 'MMM dd, yyyy') {
  return format(new Date(date), formatStr)
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export function getStatusColor(status: string): string {
  const colors = {
    'in-stock': 'bg-green-500',
    'low-stock': 'bg-yellow-500',
    'out-of-stock': 'bg-red-500',
    'in-transit': 'bg-blue-500',
    'delivered': 'bg-green-500',
    'delayed': 'bg-red-500'
  }
  return colors[status] || 'bg-gray-500'
}
```

**Example Usage**:
```typescript
import { cn, formatDate, formatCurrency, getStatusColor } from '@/lib/utils'

// Class merging
const buttonClass = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  'hover:bg-blue-600'
)

// Date formatting
const formattedDate = formatDate(new Date(), 'yyyy-MM-dd') // "2025-11-25"

// Currency
const price = formatCurrency(1234.56) // "$1,234.56"

// Status colors
const color = getStatusColor('low-stock') // "bg-yellow-500"
```

**Related Files**:
- All components use these utilities

**AI Assistant Notes**:
- `cn()` is critical for conditional Tailwind classes
- Date formatting uses date-fns library
- Add new utility functions here for reusability

---

## 🎣 Frontend Hooks

### use-toast.ts

**Location**: `src/hooks/use-toast.ts`

**Purpose**: Custom hook for toast notifications

**Type**: React Custom Hook

**Exports**:
```typescript
export function useToast(): {
  toast: (options: ToastOptions) => void
  toasts: Toast[]
  dismiss: (id: string) => void
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}
```

**Implementation**:
```typescript
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36)
    const newToast = { id, ...options }
    setToasts(prev => [...prev, newToast])

    if (options.duration !== Infinity) {
      setTimeout(() => dismiss(id), options.duration || 3000)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toast, toasts, dismiss }
}
```

**Example Usage**:
```typescript
import { useToast } from '@/hooks/use-toast'

function Component() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Data saved successfully',
      variant: 'success'
    })
  }

  const handleError = () => {
    toast({
      title: 'Error',
      description: 'Failed to save data',
      variant: 'error',
      duration: 5000
    })
  }

  return <Button onClick={handleSuccess}>Save</Button>
}
```

**Related Files**:
- `src/components/ui/sonner.tsx` - Toast UI component

---

### use-mobile.tsx

**Location**: `src/hooks/use-mobile.tsx`

**Purpose**: Detect mobile viewport for responsive design

**Type**: React Custom Hook

**Exports**:
```typescript
export function useMobile(): boolean
```

**Implementation**:
```typescript
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
```

**Example Usage**:
```typescript
import { useMobile } from '@/hooks/use-mobile'

function Navigation() {
  const isMobile = useMobile()

  return (
    <nav>
      {isMobile ? <MobileMenu /> : <DesktopMenu />}
    </nav>
  )
}
```

---

## 🗄️ Backend API

### main.py

**Location**: `sally-backend/main.py`

**Purpose**: FastAPI application entry point and API route definitions

**Type**: Python Module (FastAPI)

**Key Endpoints**:

#### Health Check
```python
@app.get("/api/v1/health")
async def health_check():
    """
    Health check endpoint
    Returns: {"status": "healthy", "timestamp": ISO datetime}
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }
```

#### Database Configuration
```python
@app.post("/api/v1/database/test-connection")
async def test_database_connection(config: DatabaseConfig):
    """
    Test database connection
    Body: DatabaseConfig (type, host, port, database, user, password)
    Returns: {"success": bool, "message": str}
    """
    manager = DatabaseManager(config)
    return await manager.test_connection()

@app.post("/api/v1/database/create-schema")
async def create_database_schema(schema: SchemaConfig):
    """
    Create database schema and optionally seed data
    Body: SchemaConfig (database_config, schema_definition, seed_data)
    Returns: {"success": bool, "message": str, "tables_created": int}
    """
    manager = DatabaseManager(schema.database_config)
    return await manager.create_schema(schema)
```

#### Q&A Assistant
```python
@app.post("/api/v1/qa/ask")
async def qa_ask(request: QARequest):
    """
    Process natural language question
    Body: {"question": str, "context": optional dict}
    Returns: {"sql": str, "explanation": str, "results": array, "chart_type": str}
    """
    agent = AIAgent(gemini_api_key=settings.GEMINI_API_KEY)
    return await agent.process_question(request.question)

@app.post("/api/v1/qa/execute")
async def qa_execute(request: ExecuteRequest):
    """
    Execute validated SQL query
    Body: {"sql": str}
    Returns: {"results": array, "row_count": int}
    """
    manager = DatabaseManager.get_instance()
    return await manager.execute_query(request.sql)
```

#### Inventory Management
```python
@app.get("/api/v1/inventory")
async def get_inventory(
    site_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """
    Get inventory items with optional filters
    Query params: site_id, status, limit
    Returns: List[Inventory]
    """
    manager = DatabaseManager.get_instance()
    return await manager.get_inventory(site_id, status, limit)
```

#### Dashboard Metrics
```python
@app.get("/api/v1/dashboard/metrics")
async def get_dashboard_metrics():
    """
    Get dashboard summary metrics
    Returns: {
        "total_studies": int,
        "active_sites": int,
        "critical_alerts": int,
        "inventory_value": float
    }
    """
    manager = DatabaseManager.get_instance()
    return await manager.get_dashboard_metrics()
```

**Middleware Configuration**:
```python
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url}")
    response = await call_next(request)
    return response
```

**Example Client Usage**:
```typescript
// Frontend API calls
const response = await fetch('/api/v1/qa/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: "Show me low stock items" })
})
const data = await response.json()
```

**Related Files**:
- `sally-backend/database/manager.py` - Database operations
- `sally-backend/ai/gemini_agent.py` - AI processing

**AI Assistant Notes**:
- All endpoints require CORS headers in production
- Error handling returns standardized error format
- Use Pydantic models for request/response validation

---

### manager.py

**Location**: `sally-backend/database/manager.py`

**Purpose**: Database connection and query management for multiple database types

**Type**: Python Class

**Supported Databases**:
- PostgreSQL
- MySQL / SQL Server
- Oracle
- MongoDB
- SQLite

**Class Definition**:
```python
class DatabaseManager:
    """
    Unified database manager supporting multiple database types
    """
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.connection = None
        self.engine = None
    
    async def connect(self) -> bool:
        """Establish database connection"""
        
    async def test_connection(self) -> dict:
        """Test if database is accessible"""
        
    async def execute_query(self, query: str) -> List[Dict]:
        """Execute SQL query and return results"""
        
    async def create_schema(self, schema: SchemaConfig) -> dict:
        """Create database tables from schema definition"""
        
    async def seed_data(self, table: str, data: List[Dict]) -> int:
        """Insert seed data into table"""
```

**PostgreSQL Implementation**:
```python
async def _connect_postgres(self):
    import psycopg2
    self.connection = psycopg2.connect(
        host=self.config.host,
        port=self.config.port,
        database=self.config.database,
        user=self.config.user,
        password=self.config.password
    )
    return True
```

**MongoDB Implementation**:
```python
async def _connect_mongodb(self):
    from pymongo import MongoClient
    self.connection = MongoClient(self.config.connection_string)
    self.db = self.connection[self.config.database]
    return True
```

**Query Execution**:
```python
async def execute_query(self, query: str) -> List[Dict]:
    """
    Execute query based on database type
    Handles SQL for relational DBs, MongoDB queries for NoSQL
    """
    if self.config.type == 'mongodb':
        return await self._execute_mongodb_query(query)
    else:
        return await self._execute_sql_query(query)
```

**Example Usage**:
```python
from sally_backend.database.manager import DatabaseManager
from sally_backend.models import DatabaseConfig

# PostgreSQL
config = DatabaseConfig(
    type='postgres',
    host='localhost',
    port=5432,
    database='tsm_db',
    user='admin',
    password='secret'
)

manager = DatabaseManager(config)
await manager.connect()

# Execute query
results = await manager.execute_query(
    "SELECT * FROM inventory WHERE quantity < 10"
)

# Create schema
schema = SchemaConfig(
    database_config=config,
    schema_definition={...},
    seed_data=True
)
await manager.create_schema(schema)
```

**Related Files**:
- `sally-backend/main.py` - API endpoints
- `sally-backend/models.py` - Pydantic models

**AI Assistant Notes**:
- Connection pooling is implemented for performance
- Queries are parameterized to prevent SQL injection
- MongoDB queries use aggregation pipeline
- Error handling includes connection retries

---

### gemini_agent.py

**Location**: `sally-backend/ai/gemini_agent.py`

**Purpose**: Gemini AI integration for natural language to SQL conversion

**Type**: Python Class

**Class Definition**:
```python
class GeminiAgent:
    """
    AI agent using Google Gemini for intelligent query processing
    """
    
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        self.api_key = api_key
        self.model = model
        self.client = None
        
    async def initialize(self):
        """Initialize Gemini API client"""
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        self.client = genai.GenerativeModel(self.model)
        
    async def generate_sql(
        self, 
        question: str, 
        schema: Dict[str, Any]
    ) -> SQLResponse:
        """
        Generate SQL query from natural language
        
        Args:
            question: User's natural language question
            schema: Database schema information
            
        Returns:
            SQLResponse with query, explanation, and metadata
        """
        
    async def process_question(
        self,
        question: str,
        context: Optional[Dict] = None
    ) -> AIResponse:
        """
        Full query processing pipeline:
        1. Generate SQL from question
        2. Validate SQL syntax
        3. Determine visualization type
        4. Return formatted response
        """
```

**Prompt Engineering**:
```python
def _build_prompt(self, question: str, schema: Dict) -> str:
    """Build prompt for Gemini"""
    return f"""
You are a SQL expert for a Trial Supply Management system.

Database Schema:
{json.dumps(schema, indent=2)}

User Question: {question}

Generate a SQL query to answer this question. Return JSON with:
{{
    "sql": "SELECT ...",
    "explanation": "This query will...",
    "chart_type": "bar|line|pie|table"
}}

Rules:
- Use only tables and columns from the schema
- Generate valid SQL syntax
- Consider performance (use LIMIT when appropriate)
- For aggregations, suggest appropriate chart type
"""
```

**Response Processing**:
```python
async def generate_sql(self, question: str, schema: Dict) -> SQLResponse:
    prompt = self._build_prompt(question, schema)
    
    response = await self.client.generate_content_async(prompt)
    result = json.loads(response.text)
    
    # Validate SQL
    is_valid = await self._validate_sql(result['sql'], schema)
    
    if not is_valid:
        raise SQLValidationError("Generated SQL is invalid")
    
    return SQLResponse(
        sql=result['sql'],
        explanation=result['explanation'],
        chart_type=result['chart_type'],
        confidence=0.95
    )
```

**Example Usage**:
```python
from sally_backend.ai.gemini_agent import GeminiAgent

agent = GeminiAgent(api_key=os.getenv('GEMINI_API_KEY'))
await agent.initialize()

# Process question
response = await agent.process_question(
    question="Show me all sites with low inventory",
    context={"user_role": "manager"}
)

print(response.sql)          # SELECT s.name, COUNT(i.id) AS low_items...
print(response.explanation)  # This query joins sites and inventory...
print(response.chart_type)   # bar
```

**Fallback Mechanism**:
```python
async def process_question(self, question: str) -> AIResponse:
    try:
        # Try Gemini API
        return await self._gemini_process(question)
    except Exception as e:
        logger.warning(f"Gemini API failed: {e}, using rule-based fallback")
        # Fallback to rule-based processing
        return await self._rule_based_process(question)
```

**Related Files**:
- `sally-backend/main.py` - API integration
- `sally-backend/database/manager.py` - Query execution

**AI Assistant Notes**:
- API key should be stored in environment variables
- Implement rate limiting for API calls
- Cache common queries to reduce API costs
- Gemini Pro is recommended for better accuracy

---

## 📝 Type Definitions

### database.ts (Types)

**Location**: `src/types/database.ts`

**Purpose**: TypeScript type definitions for all database entities

**Exports**:
```typescript
// Inventory
export interface Inventory {
  id: number
  product_name: string
  site_id: number
  site_name: string
  study_id: number
  study_name: string
  lot_number: string
  quantity: number
  reorder_point: number
  expiry_date: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'nearing-expiry' | 'excess-stock'
  last_updated: string
}

// Shipment
export interface Shipment {
  id: number
  shipment_id: string
  origin: string
  destination: string
  site_id: number
  status: 'in-transit' | 'delivered' | 'delayed' | 'pending'
  expected_date: string
  actual_date?: string
  carrier: string
  tracking_number: string
  items: ShipmentItem[]
  temperature_min?: number
  temperature_max?: number
  temperature_alerts?: number
}

export interface ShipmentItem {
  product_name: string
  quantity: number
  lot_number: string
}

// Site
export interface Site {
  id: number
  name: string
  location: string
  country: string
  type: 'clinical' | 'depot' | 'warehouse'
  status: 'active' | 'inactive'
  capacity: number
  current_inventory: number
  contact_name: string
  contact_email: string
  contact_phone: string
}

// Study
export interface Study {
  id: number
  study_id: string
  name: string
  phase: 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV'
  status: 'active' | 'paused' | 'completed'
  start_date: string
  end_date?: string
  total_sites: number
  enrolled_patients: number
  target_enrollment: number
}

// Task
export interface Task {
  id: number
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  due_date: string
  assigned_to?: string
  category: 'inventory' | 'shipment' | 'site' | 'study'
  related_id?: number
  created_at: string
  completed_at?: string
}

// Vendor
export interface Vendor {
  id: number
  name: string
  type: 'manufacturer' | 'distributor' | 'logistics'
  country: string
  reliability_score: number
  average_lead_time: number
  contact_name: string
  contact_email: string
  contact_phone: string
  status: 'active' | 'inactive'
}
```

**Usage in Components**:
```typescript
import type { Inventory, Shipment } from '@/types/database'

const inventory: Inventory = {
  id: 1,
  product_name: "Drug A",
  // ... other fields
}

const shipment: Shipment = {
  id: 1,
  shipment_id: "SH-2025-001",
  // ... other fields
}
```

**AI Assistant Notes**:
- These types MUST match backend database schema
- Use strict typing to catch errors at compile time
- Export all interfaces for reusability

---

## 🎨 Styling & Configuration

### tailwind.config.ts

**Location**: `tailwind.config.ts`

**Purpose**: Tailwind CSS configuration with custom Sally TSM theme

**Configuration**:
```typescript
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary green theme
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Main green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Dark theme colors
        dark: {
          50: '#1a5244',   // Dark green background
          100: '#164438',
          200: '#12362c',
          800: '#0a1f1a',
          900: '#051310',
        },
        // Status colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

**Theme Usage**:
```tsx
// Using theme colors
<div className="bg-primary-500 text-white">Primary</div>
<div className="bg-dark-50">Dark background</div>
<div className="text-success">Success message</div>
<div className="border-warning">Warning border</div>
```

**AI Assistant Notes**:
- Green color scheme (#22c55e, #1a5244) is brand identity
- Dark mode is always enabled (class strategy)
- Use semantic color names (primary, success, error)

---

## 📚 Documentation Files

### README.md

**Location**: `README.md`

**Purpose**: Project overview and quick start guide

**Contents**:
- Project description
- Features list
- Technology stack
- Quick start instructions
- Project structure
- Development workflow

---

### BACKEND_INTEGRATION_PLAN.md

**Location**: `BACKEND_INTEGRATION_PLAN.md`

**Purpose**: Detailed backend architecture and integration plan

**Contents**:
- System architecture diagram
- API endpoint specifications
- Database schema design
- Integration phases
- Testing strategy

---

## 🤖 AI Assistant Integration Tips

### For GitHub Copilot

**Context Files to Keep Open**:
1. `src/types/database.ts` - Type definitions
2. `src/lib/database.ts` - Data layer
3. `tailwind.config.ts` - Styling theme

**Code Patterns**:
```typescript
// Component pattern
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Inventory } from '@/types/database'

export function InventoryComponent() {
  const [data, setData] = useState<Inventory[]>([])
  // ... implementation
}

// API call pattern
const response = await fetch('/api/v1/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
const data = await response.json()

// Database query pattern
import { fetchInventory } from '@/lib/database'
const inventory = await fetchInventory()
```

### For VS Code Extensions

**Recommended Extensions**:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

**Settings** (`.vscode/settings.json`):
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## 📊 Module Dependency Graph

```
App.tsx
 ├── Layout (LayoutRevamped.tsx)
 │    ├── Sidebar Navigation
 │    └── Theme Provider
 ├── MorningBrief.tsx
 │    ├── database.ts (fetchShipments, fetchInventory)
 │    ├── types/database.ts
 │    └── ui/card.tsx
 ├── OnDemandQA.tsx
 │    ├── aiService.ts (processQuery)
 │    ├── database.ts (executeSQLQuery)
 │    ├── recharts (BarChart, LineChart)
 │    └── ui/button.tsx, ui/textarea.tsx
 ├── EndOfDaySummary.tsx
 │    ├── database.ts (fetchTasks)
 │    └── ui/card.tsx
 └── ConfigurationCockpit.tsx
      ├── Backend API calls
      └── ui/tabs.tsx, ui/input.tsx

Backend API (main.py)
 ├── database/manager.py
 │    ├── PostgreSQL driver
 │    ├── MySQL driver
 │    ├── Oracle driver
 │    └── MongoDB driver
 ├── ai/gemini_agent.py
 │    └── Google Gemini API
 └── models.py (Pydantic)

Services
 ├── aiService.ts → Backend /api/v1/qa/ask
 └── database.ts → IndexedDB (demo) or Backend API (production)
```

---

## 🔍 Quick Reference

### Common Tasks

**Add New Component**:
1. Create file in `src/components/ComponentName.tsx`
2. Define props interface
3. Import types from `src/types/database.ts`
4. Use UI components from `src/components/ui/`
5. Style with Tailwind classes

**Add New API Endpoint**:
1. Define route in `sally-backend/main.py`
2. Add Pydantic model in `sally-backend/models.py`
3. Implement logic in appropriate service
4. Test with `/docs` (Swagger UI)

**Modify Database Schema**:
1. Update `src/types/database.ts` (TypeScript)
2. Update `sally-backend/models.py` (Pydantic)
3. Update `src/lib/database.ts` (IndexedDB schema)
4. Create migration script if needed

**Add New Chart Type**:
1. Import from `recharts`
2. Process data in `aiService.ts`
3. Add chart rendering in `OnDemandQA.tsx`
4. Define visualization config

---

**This documentation is optimized for AI code assistants. Keep it updated when adding new modules or features.**
