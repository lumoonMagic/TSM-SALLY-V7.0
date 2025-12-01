# Sally TSM Agent - Development Guide

> **Purpose**: Comprehensive guide for developers and AI code assistants  
> **Target Audience**: Developers, GitHub Copilot, VS Code extensions  
> **Last Updated**: November 25, 2025

---

## 🚀 Quick Start for Developers

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# 1. Clone/extract project
cd sally-integration

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd sally-backend
pip install -r requirements.txt
cd ..

# 4. Run in demo mode (no configuration needed)
npm run dev
# Open http://localhost:5173

# 5. Optional: Run backend for production mode
cd sally-backend
python main.py
# API at http://localhost:8000
```

---

## 🏗️ Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Components   │  │   Services   │  │  Hooks    │ │
│  │ (UI Layer)   │─▶│ (Business)   │─▶│ (State)   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────┐
│                Backend (FastAPI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  API Routes  │─▶│   Services   │─▶│ Database  │ │
│  │  (REST)      │  │  (Business)  │  │  Manager  │ │
│  └──────────────┘  └──────────────┘  └─────┬─────┘ │
│         │                                    │       │
│         │ Gemini AI                         │       │
│         ▼                                    ▼       │
│  ┌──────────────┐                    ┌───────────┐ │
│  │  AI Agent    │                    │ Database  │ │
│  │  (NL→SQL)    │                    │ (Prod)    │ │
│  └──────────────┘                    └───────────┘ │
└─────────────────────────────────────────────────────┘
                                                ▲
                                                │
                                         ┌──────┴──────┐
                                         │ PostgreSQL  │
                                         │ MySQL       │
                                         │ Oracle      │
                                         │ MongoDB     │
                                         └─────────────┘
```

### Data Flow

**Demo Mode** (Frontend Only):
```
User Input → React Component → aiService.ts → database.ts (IndexedDB) → UI Update
```

**Production Mode** (Full Stack):
```
User Input → React Component → API Call → FastAPI → Database Manager → Database
                                              ↓
                                         Gemini AI Agent
                                              ↓
                                         SQL Generation
                                              ↓
                                         Query Execution → Results → UI
```

---

## 📁 Project Structure Deep Dive

### Frontend Architecture

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Router & layout
├── components/                 # React components
│   ├── MorningBrief.tsx       # Dashboard
│   ├── OnDemandQA.tsx         # Q&A assistant
│   ├── EndOfDaySummary.tsx    # Daily summary
│   └── ui/                     # Reusable UI components
├── lib/                        # Core services
│   ├── database.ts            # Data layer (IndexedDB/API)
│   ├── aiService.ts           # AI query processing
│   └── utils.ts               # Utilities
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript definitions
└── styles/                     # Theme configuration
```

**Key Principles**:
1. **Separation of Concerns**: Components (UI) → Services (Business Logic) → Data Layer
2. **Type Safety**: Strict TypeScript everywhere
3. **Reusability**: Shared UI components in `ui/`
4. **State Management**: React hooks (useState, useEffect)
5. **Styling**: Tailwind CSS with custom theme

### Backend Architecture

```
sally-backend/
├── main.py                     # FastAPI app
├── models.py                   # Pydantic models
├── config.py                   # Configuration
├── database/                   # Database layer
│   ├── manager.py             # DB abstraction
│   └── adapters/              # DB-specific adapters
├── ai/                         # AI/LLM integration
│   ├── gemini_agent.py        # Gemini AI
│   └── prompt_templates.py    # Prompts
├── api/                        # API routes
│   ├── qa_routes.py           # Q&A endpoints
│   └── inventory_routes.py    # Inventory endpoints
└── services/                   # Business logic
    ├── inventory_service.py
    └── shipment_service.py
```

**Key Principles**:
1. **Clean Architecture**: Routes → Services → Database
2. **Database Abstraction**: Support multiple DB types
3. **Type Validation**: Pydantic for request/response
4. **Error Handling**: Consistent error responses
5. **API Documentation**: Auto-generated with FastAPI

---

## 🔧 Development Workflows

### Adding a New Feature

#### Frontend Feature (e.g., "Vendor Management")

**Step 1: Create Types**
```typescript
// src/types/database.ts
export interface Vendor {
  id: number
  name: string
  type: 'manufacturer' | 'distributor' | 'logistics'
  reliability_score: number
  contact_email: string
  status: 'active' | 'inactive'
}
```

**Step 2: Add Data Layer**
```typescript
// src/lib/database.ts
export async function fetchVendors(): Promise<Vendor[]> {
  if (import.meta.env.PROD) {
    // Production: API call
    const response = await fetch('/api/v1/vendors')
    return await response.json()
  } else {
    // Demo: IndexedDB
    const db = await initDatabase()
    const tx = db.transaction('vendors', 'readonly')
    const store = tx.objectStore('vendors')
    return await store.getAll()
  }
}
```

**Step 3: Create Component**
```typescript
// src/components/VendorManagement.tsx
import { useState, useEffect } from 'react'
import { fetchVendors } from '@/lib/database'
import type { Vendor } from '@/types/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const data = await fetchVendors()
        setVendors(data)
      } catch (error) {
        console.error('Failed to load vendors:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadVendors()
  }, [])
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vendor Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map(vendor => (
          <Card key={vendor.id}>
            <CardHeader>
              <CardTitle>{vendor.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Type: {vendor.type}</p>
              <p>Reliability: {vendor.reliability_score}/100</p>
              <p>Status: {vendor.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Add Route**
```typescript
// src/App.tsx
import { VendorManagement } from './components/VendorManagement'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/vendors" element={<VendorManagement />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Step 5: Add Navigation**
```typescript
// src/components/Layout.tsx
<nav>
  {/* Existing nav items */}
  <Link to="/vendors">Vendors</Link>
</nav>
```

#### Backend Feature

**Step 1: Create Pydantic Model**
```python
# sally-backend/models.py
from pydantic import BaseModel, EmailStr
from typing import Literal

class Vendor(BaseModel):
    id: int
    name: str
    type: Literal['manufacturer', 'distributor', 'logistics']
    reliability_score: int
    contact_email: EmailStr
    status: Literal['active', 'inactive']

class CreateVendorRequest(BaseModel):
    name: str
    type: Literal['manufacturer', 'distributor', 'logistics']
    contact_email: EmailStr
```

**Step 2: Add Database Operations**
```python
# sally-backend/services/vendor_service.py
from typing import List
from ..models import Vendor
from ..database.manager import DatabaseManager

class VendorService:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    async def get_vendors(self) -> List[Vendor]:
        query = "SELECT * FROM vendors WHERE status = 'active'"
        results = await self.db.execute_query(query)
        return [Vendor(**row) for row in results]
    
    async def create_vendor(self, vendor: CreateVendorRequest) -> Vendor:
        query = """
        INSERT INTO vendors (name, type, contact_email, status)
        VALUES (?, ?, ?, 'active')
        RETURNING *
        """
        result = await self.db.execute_query(query, [
            vendor.name, vendor.type, vendor.contact_email
        ])
        return Vendor(**result[0])
```

**Step 3: Add API Routes**
```python
# sally-backend/main.py
from .services.vendor_service import VendorService
from .models import Vendor, CreateVendorRequest

vendor_service = VendorService(db_manager)

@app.get("/api/v1/vendors", response_model=List[Vendor])
async def get_vendors():
    """Get all active vendors"""
    return await vendor_service.get_vendors()

@app.post("/api/v1/vendors", response_model=Vendor, status_code=201)
async def create_vendor(vendor: CreateVendorRequest):
    """Create new vendor"""
    return await vendor_service.create_vendor(vendor)
```

**Step 4: Test with Swagger**
```bash
# Run backend
python sally-backend/main.py

# Open browser
http://localhost:8000/docs

# Test GET /api/v1/vendors
# Test POST /api/v1/vendors
```

---

## 🧪 Testing

### Frontend Testing

**Component Testing with React Testing Library**:
```typescript
// src/components/__tests__/MorningBrief.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MorningBrief } from '../MorningBrief'
import * as database from '@/lib/database'

jest.mock('@/lib/database')

describe('MorningBrief', () => {
  it('displays priorities and highlights', async () => {
    // Mock data
    const mockShipments = [/* ... */]
    jest.spyOn(database, 'fetchShipments').mockResolvedValue(mockShipments)
    
    render(<MorningBrief />)
    
    await waitFor(() => {
      expect(screen.getByText('Priorities')).toBeInTheDocument()
      expect(screen.getByText('Highlights')).toBeInTheDocument()
    })
  })
})
```

**Run Tests**:
```bash
npm test
npm test -- --coverage
```

### Backend Testing

**API Testing with pytest**:
```python
# sally-backend/tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_inventory():
    response = client.get("/api/v1/inventory")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)

def test_qa_ask():
    response = client.post(
        "/api/v1/qa/ask",
        json={"question": "Show me low stock items"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "sql" in data
    assert "explanation" in data
```

**Run Tests**:
```bash
cd sally-backend
pytest
pytest --cov=. --cov-report=html
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Best Practices

**Color Usage**:
```tsx
// Primary green theme
<div className="bg-primary-500 text-white">Primary Action</div>

// Dark theme
<div className="bg-dark-50 text-gray-100">Dark Background</div>

// Status colors
<span className="text-success">Success</span>
<span className="text-warning">Warning</span>
<span className="text-error">Error</span>
```

**Responsive Design**:
```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

**Component Variants**:
```tsx
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

function Button({ variant = 'primary', size = 'md', ...props }) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        {
          'bg-primary-500 hover:bg-primary-600': variant === 'primary',
          'bg-gray-500 hover:bg-gray-600': variant === 'secondary',
          'bg-red-500 hover:bg-red-600': variant === 'danger',
        },
        {
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        }
      )}
      {...props}
    />
  )
}
```

### Theme Customization

**Modify Theme Colors**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Add custom brand colors
        brand: {
          primary: '#1a5244',
          secondary: '#22c55e',
          accent: '#f59e0b',
        },
      },
    },
  },
}
```

**Use in Components**:
```tsx
<div className="bg-brand-primary text-white">
  Custom Brand Color
</div>
```

---

## 🔒 Security Best Practices

### Frontend Security

**XSS Prevention**:
```typescript
// BAD: Don't use dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD: Let React sanitize
<div>{userInput}</div>

// If HTML is needed, use DOMPurify
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(htmlContent) 
}} />
```

**API Key Protection**:
```typescript
// Store in .env
VITE_API_BASE_URL=http://localhost:8000

// Access in code
const apiUrl = import.meta.env.VITE_API_BASE_URL

// NEVER commit .env files
// Add to .gitignore
```

### Backend Security

**SQL Injection Prevention**:
```python
# BAD: String interpolation
query = f"SELECT * FROM users WHERE id = {user_id}"

# GOOD: Parameterized queries
query = "SELECT * FROM users WHERE id = ?"
result = await db.execute_query(query, [user_id])
```

**Input Validation**:
```python
from pydantic import BaseModel, validator

class InventoryCreate(BaseModel):
    quantity: int
    
    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
```

**Environment Variables**:
```python
# sally-backend/.env
DATABASE_URL=postgresql://user:pass@localhost/db
GEMINI_API_KEY=your_key_here
SECRET_KEY=your_secret_key

# Load in config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    secret_key: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 🐛 Debugging Tips

### Frontend Debugging

**Browser DevTools**:
```typescript
// Add breakpoints in code
debugger

// Console logging
console.log('Component rendered:', data)
console.table(arrayData)
console.time('Operation')
// ... operation
console.timeEnd('Operation')
```

**React DevTools**:
1. Install React DevTools browser extension
2. Inspect component props and state
3. Profile performance

**Network Inspection**:
```typescript
// Log all API calls
const originalFetch = window.fetch
window.fetch = async (...args) => {
  console.log('API Call:', args[0])
  const response = await originalFetch(...args)
  console.log('API Response:', response.status)
  return response
}
```

### Backend Debugging

**Python Debugger**:
```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use VS Code breakpoints
# Click left of line number
```

**Logging**:
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.get("/api/v1/endpoint")
async def endpoint():
    logger.debug("Endpoint called")
    logger.info("Processing request")
    logger.warning("Potential issue")
    logger.error("Error occurred")
```

**FastAPI Debug Mode**:
```python
# main.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="debug"
    )
```

---

## 📚 Code Patterns & Best Practices

### React Patterns

**Custom Hooks for Data Fetching**:
```typescript
// src/hooks/useInventory.ts
export function useInventory(filters?: InventoryFilters) {
  const [data, setData] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await fetchInventory(filters)
        if (mounted) setData(result)
      } catch (err) {
        if (mounted) setError(err as Error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [JSON.stringify(filters)])
  
  return { data, loading, error }
}
```

**Error Boundaries**:
```typescript
import { Component, ReactNode } from 'react'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>
    }
    return this.props.children
  }
}
```

### Python Patterns

**Dependency Injection**:
```python
# services/base.py
class BaseService:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

# services/inventory_service.py
class InventoryService(BaseService):
    async def get_low_stock(self):
        return await self.db.execute_query(
            "SELECT * FROM inventory WHERE quantity < reorder_point"
        )

# main.py
db_manager = DatabaseManager(config)
inventory_service = InventoryService(db_manager)
```

**Async/Await**:
```python
# Always use async for I/O operations
async def fetch_data():
    # Database query
    result = await db.execute_query("SELECT ...")
    
    # API call
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com")
    
    return result
```

---

## 🚀 Performance Optimization

### Frontend Performance

**Code Splitting**:
```typescript
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const MorningBrief = lazy(() => import('./components/MorningBrief'))
const OnDemandQA = lazy(() => import('./components/OnDemandQA'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/morning-brief" element={<MorningBrief />} />
        <Route path="/qa" element={<OnDemandQA />} />
      </Routes>
    </Suspense>
  )
}
```

**Memoization**:
```typescript
import { useMemo, useCallback } from 'react'

function Component({ data }) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item))
  }, [data])
  
  // Memoize callbacks
  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])
  
  return <div onClick={handleClick}>{processedData}</div>
}
```

### Backend Performance

**Database Connection Pooling**:
```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)
```

**Caching**:
```python
from functools import lru_cache
from cachetools import TTLCache

# In-memory cache
cache = TTLCache(maxsize=100, ttl=300)  # 5 minutes

@lru_cache(maxsize=128)
def get_static_data():
    # Expensive operation
    return data

# Async cache
from aiocache import cached

@cached(ttl=60)
async def get_dashboard_metrics():
    return await fetch_metrics()
```

---

## 📖 Resources for AI Assistants

### Key Files to Reference

**For UI/Component Questions**:
- `src/components/ui/` - Reusable UI components
- `tailwind.config.ts` - Theme configuration
- `src/types/database.ts` - Type definitions

**For Data/API Questions**:
- `src/lib/database.ts` - Frontend data layer
- `src/lib/aiService.ts` - AI query processing
- `sally-backend/main.py` - API endpoints
- `API_REFERENCE.md` - Complete API documentation

**For Architecture Questions**:
- `MODULE_REFERENCE.md` - Module documentation
- `FILE_STRUCTURE.md` - File organization
- This file - Development patterns

### Common Tasks Quick Reference

| Task | Frontend | Backend |
|------|----------|---------|
| Add route | `src/App.tsx` | `sally-backend/main.py` |
| Add type | `src/types/database.ts` | `sally-backend/models.py` |
| Fetch data | `src/lib/database.ts` | `sally-backend/services/` |
| Style component | Tailwind classes | N/A |
| Add API endpoint | N/A | `@app.get/post()` |

---

**This development guide provides comprehensive patterns and practices for building Sally TSM Agent features with AI assistance.**
