# 🚀 Sally TSM Agent - Backend Integration Plan

## 📋 **Executive Summary**

This document outlines the integration of Sally's React frontend with a production-ready FastAPI backend while **preserving** the existing IndexedDB demo functionality.

**Key Principle**: **Dual-Mode Architecture**
- **Demo Mode**: Uses IndexedDB (current implementation, untouched)
- **Production Mode**: Uses real databases + Gemini AI (new implementation)

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Sally UI (React + TypeScript)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           Configuration Cockpit (Enhanced)               │ │
│  │  • Mode Toggle: Demo ↔ Production                       │ │
│  │  • Database Config (PostgreSQL/Oracle/MySQL/SQLite)     │ │
│  │  • LLM Config (Gemini API)                              │ │
│  └─────────────────────┬────────────────────────────────────┘ │
│                        │                                        │
│  ┌─────────────────────▼────────────────────────────────────┐ │
│  │         Data Service Layer (NEW - Smart Router)         │ │
│  │  • Routes queries based on mode                         │ │
│  │  • Demo → IndexedDB                                     │ │
│  │  • Production → Backend API                             │ │
│  └─────────────────────┬────────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ (Production Mode Only)
                         │
┌────────────────────────▼──────────────────────────────────────┐
│              Backend API (FastAPI + Python)                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           API Endpoints                              │    │
│  │  POST /api/v1/query/ask                             │    │
│  │  POST /api/v1/query/execute                         │    │
│  │  POST /api/v1/config/database                       │    │
│  │  POST /api/v1/config/llm                            │    │
│  │  GET  /api/v1/data/sites                            │    │
│  │  GET  /api/v1/data/inventory                        │    │
│  │  GET  /api/v1/data/shipments                        │    │
│  └─────────────────────┬────────────────────────────────┘    │
│                        │                                       │
│  ┌─────────────────────▼────────────────────────────────┐    │
│  │        Gemini AI Agent                               │    │
│  │  • Natural language → SQL conversion                 │    │
│  │  • Schema-aware query generation                     │    │
│  │  • Safety validation                                 │    │
│  └─────────────────────┬────────────────────────────────┘    │
│                        │                                       │
│  ┌─────────────────────▼────────────────────────────────┐    │
│  │        Database Manager                              │    │
│  │  • Connection pooling                                │    │
│  │  • Query execution                                   │    │
│  │  • Transaction management                            │    │
│  └─────────────────────┬────────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼──────┐              ┌──────────▼──────┐
│  IndexedDB   │              │  Real Database  │
│  (Demo)      │              │  (Production)   │
│  • Untouched │              │  • PostgreSQL   │
│  • Local     │              │  • MySQL        │
│  • Fast      │              │  • Oracle       │
└──────────────┘              │  • SQLite       │
                              └─────────────────┘
```

---

## 📦 **Phase 1: Backend Setup (FastAPI)**

### **1.1 Create Backend Structure**

```
sally-backend/
├── main.py                 # FastAPI application entry
├── requirements.txt        # Python dependencies
├── config.py              # Configuration management
├── models.py              # Pydantic models
├── database/
│   ├── __init__.py
│   ├── manager.py         # Database connection manager
│   ├── postgresql.py      # PostgreSQL adapter
│   ├── mysql.py           # MySQL adapter
│   ├── oracle.py          # Oracle adapter
│   └── sqlite.py          # SQLite adapter
├── ai/
│   ├── __init__.py
│   ├── gemini_agent.py    # Gemini AI integration
│   └── query_processor.py # Query processing logic
└── api/
    ├── __init__.py
    ├── query.py           # Query endpoints
    ├── config.py          # Configuration endpoints
    └── data.py            # Data CRUD endpoints
```

### **1.2 Core Dependencies**

```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.4.2
python-dotenv==1.0.0

# Database drivers
psycopg2-binary==2.9.9      # PostgreSQL
pymysql==1.1.0              # MySQL
cx-Oracle==8.3.0            # Oracle
aiosqlite==0.19.0           # SQLite async

# Google Gemini
google-generativeai==0.3.1

# Utilities
python-jose[cryptography]==3.3.0  # JWT
passlib[bcrypt]==1.7.4           # Password hashing
python-multipart==0.0.6          # File uploads
aiofiles==23.2.1                 # Async file operations
```

---

## 📦 **Phase 2: Frontend Data Service Layer**

### **2.1 Create Data Service**

```typescript
// src/services/dataService.ts

import { 
  Site, Inventory, Shipment, Study, Vendor, Task,
  getAllSites as getLocalSites,
  getAllInventory as getLocalInventory,
  // ... other IndexedDB imports
} from '../lib/database';

export type OperationMode = 'demo' | 'production';

export class DataService {
  private mode: OperationMode = 'demo';
  private apiBaseUrl: string = 'http://localhost:8000/api/v1';

  setMode(mode: OperationMode) {
    this.mode = mode;
    console.log(`Data service switched to ${mode} mode`);
  }

  setApiUrl(url: string) {
    this.apiBaseUrl = url;
  }

  // Sites
  async getSites(): Promise<Site[]> {
    if (this.mode === 'demo') {
      return getLocalSites();
    }
    
    const response = await fetch(`${this.apiBaseUrl}/data/sites`);
    if (!response.ok) throw new Error('Failed to fetch sites');
    return response.json();
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    if (this.mode === 'demo') {
      return getLocalInventory();
    }
    
    const response = await fetch(`${this.apiBaseUrl}/data/inventory`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  }

  // AI Query Processing
  async processQuery(query: string): Promise<any> {
    if (this.mode === 'demo') {
      // Use existing AIQueryService
      const { AIQueryService } = await import('../lib/aiService');
      const service = new AIQueryService();
      await service.initialize();
      return service.processQuery(query);
    }
    
    // Production: Call backend API
    const response = await fetch(`${this.apiBaseUrl}/query/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, include_visualization: true })
    });
    
    if (!response.ok) throw new Error('Query processing failed');
    return response.json();
  }

  // Execute SQL (Production only)
  async executeSQL(sql: string): Promise<any> {
    if (this.mode === 'demo') {
      throw new Error('SQL execution not available in demo mode');
    }
    
    const response = await fetch(`${this.apiBaseUrl}/query/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql_query: sql, include_visualization: true })
    });
    
    if (!response.ok) throw new Error('SQL execution failed');
    return response.json();
  }

  // Configuration
  async configureDatabase(config: any): Promise<boolean> {
    const response = await fetch(`${this.apiBaseUrl}/config/database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) return false;
    const result = await response.json();
    return result.success;
  }

  async configureLLM(config: any): Promise<boolean> {
    const response = await fetch(`${this.apiBaseUrl}/config/llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) return false;
    const result = await response.json();
    return result.success;
  }
}

// Singleton instance
export const dataService = new DataService();
```

---

## 📦 **Phase 3: Enhanced Configuration Cockpit**

### **3.1 Add Mode Toggle**

```typescript
// In ConfigurationCockpit.tsx - Add to state
const [operationMode, setOperationMode] = useState<'demo' | 'production'>('demo');

// Add UI Section
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Operation Mode</h3>
  
  <div className="flex gap-4">
    <Button
      variant={operationMode === 'demo' ? 'default' : 'outline'}
      onClick={() => {
        setOperationMode('demo');
        dataService.setMode('demo');
        toast.success('Switched to Demo Mode (IndexedDB)');
      }}
    >
      🎯 Demo Mode
    </Button>
    
    <Button
      variant={operationMode === 'production' ? 'default' : 'outline'}
      onClick={() => {
        setOperationMode('production');
        dataService.setMode('production');
        toast.success('Switched to Production Mode');
      }}
    >
      🚀 Production Mode
    </Button>
  </div>
  
  <Alert>
    <AlertDescription>
      {operationMode === 'demo' 
        ? '📍 Using local IndexedDB with mock data (no backend required)'
        : '📍 Using real database and Gemini AI (requires backend configuration)'}
    </AlertDescription>
  </Alert>
</div>
```

---

## 📦 **Phase 4: Backend Implementation**

### **4.1 Main API (main.py)**

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

from database.manager import DatabaseManager
from ai.gemini_agent import GeminiAgent

load_dotenv()

app = FastAPI(title="Sally TSM Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
db_manager = DatabaseManager()
ai_agent = GeminiAgent(api_key=os.getenv("GEMINI_API_KEY", ""))

# Models
class QueryRequest(BaseModel):
    query: str
    include_visualization: bool = True

class ExecuteRequest(BaseModel):
    sql_query: str
    include_visualization: bool = True

class DatabaseConfigRequest(BaseModel):
    type: str  # postgresql, mysql, oracle, sqlite
    host: Optional[str] = None
    port: Optional[int] = None
    database: str
    username: Optional[str] = None
    password: Optional[str] = None

class LLMConfigRequest(BaseModel):
    provider: str  # gemini, openai, claude
    api_key: str
    model: Optional[str] = "gemini-pro"

# Endpoints
@app.get("/")
async def root():
    return {
        "name": "Sally TSM Backend",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/v1/query/ask")
async def process_query(request: QueryRequest):
    """Process natural language query with Gemini"""
    try:
        # Get database schema
        schema = await db_manager.get_schema()
        
        # Generate SQL with Gemini
        result = await ai_agent.generate_sql(request.query, schema)
        
        return {
            "success": True,
            "sql": result["sql"],
            "explanation": result["explanation"],
            "requires_approval": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/query/execute")
async def execute_query(request: ExecuteRequest):
    """Execute approved SQL query"""
    try:
        # Validate query safety
        if not ai_agent.is_safe_query(request.sql_query):
            raise HTTPException(status_code=400, detail="Unsafe query detected")
        
        # Execute query
        data = await db_manager.execute_query(request.sql_query)
        
        # Generate visualization if requested
        visualization = None
        if request.include_visualization and data:
            visualization = await ai_agent.suggest_visualization(data)
        
        return {
            "success": True,
            "data": data,
            "visualization": visualization,
            "row_count": len(data) if data else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/config/database")
async def configure_database(config: DatabaseConfigRequest):
    """Configure database connection"""
    try:
        # Test connection
        success = await db_manager.connect(config.dict())
        
        if success:
            # Save configuration (encrypted in production)
            await save_config("database", config.dict())
            return {"success": True, "message": "Database connected successfully"}
        else:
            return {"success": False, "error": "Connection failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/config/llm")
async def configure_llm(config: LLMConfigRequest):
    """Configure LLM provider"""
    try:
        global ai_agent
        
        # Test API key
        ai_agent = GeminiAgent(api_key=config.api_key)
        success = await ai_agent.test_connection()
        
        if success:
            await save_config("llm", config.dict())
            return {"success": True, "message": "LLM configured successfully"}
        else:
            return {"success": False, "error": "Invalid API key"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/data/sites")
async def get_sites():
    """Get all sites"""
    try:
        data = await db_manager.execute_query("SELECT * FROM sites")
        return data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/data/inventory")
async def get_inventory():
    """Get all inventory"""
    try:
        data = await db_manager.execute_query("SELECT * FROM inventory")
        return data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/data/shipments")
async def get_shipments():
    """Get all shipments"""
    try:
        data = await db_manager.execute_query("SELECT * FROM shipments")
        return data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def save_config(config_type: str, config_data: dict):
    """Save configuration (implement proper encryption for production)"""
    # TODO: Implement secure configuration storage
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 📦 **Phase 5: Gemini AI Agent**

```python
# ai/gemini_agent.py

import google.generativeai as genai
import json
import re
from typing import Dict, List, Any

class GeminiAgent:
    def __init__(self, api_key: str):
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    async def test_connection(self) -> bool:
        """Test Gemini API connection"""
        if not self.model:
            return False
        
        try:
            response = await self.model.generate_content_async("Hello")
            return bool(response.text)
        except Exception:
            return False
    
    async def generate_sql(self, query: str, schema: Dict) -> Dict[str, str]:
        """Generate SQL from natural language"""
        if not self.model:
            raise Exception("Gemini API not configured")
        
        prompt = f"""You are a SQL expert for a Trial Supply Management system.

Database Schema:
{json.dumps(schema, indent=2)}

User Question: {query}

Generate a safe SELECT SQL query to answer this question.
Only return the SQL query and a brief explanation.

Format your response exactly as:
SQL: <your sql query here>
EXPLANATION: <brief explanation>
"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            # Parse response
            sql_match = re.search(r'SQL:\s*(.+?)(?=EXPLANATION:|$)', text, re.DOTALL)
            exp_match = re.search(r'EXPLANATION:\s*(.+)', text, re.DOTALL)
            
            sql = sql_match.group(1).strip() if sql_match else ""
            explanation = exp_match.group(1).strip() if exp_match else ""
            
            # Clean SQL
            sql = sql.replace('```sql', '').replace('```', '').strip()
            
            return {
                "sql": sql,
                "explanation": explanation
            }
        except Exception as e:
            raise Exception(f"Failed to generate SQL: {str(e)}")
    
    def is_safe_query(self, sql: str) -> bool:
        """Validate SQL query safety"""
        sql_lower = sql.lower().strip()
        
        # Only allow SELECT
        if not sql_lower.startswith('select'):
            return False
        
        # Block dangerous keywords
        dangerous = ['drop', 'delete', 'truncate', 'alter', 'create', 
                    'insert', 'update', 'grant', 'revoke', 'exec']
        
        for keyword in dangerous:
            if keyword in sql_lower:
                return False
        
        return True
    
    async def suggest_visualization(self, data: List[Dict]) -> Dict:
        """Suggest appropriate visualization for data"""
        if not data:
            return None
        
        # Simple heuristics for now
        # In production, could use Gemini to suggest visualization
        
        columns = list(data[0].keys())
        
        # If we have numerical data and categories
        if len(columns) >= 2:
            return {
                "type": "bar",
                "x_axis": columns[0],
                "y_axis": columns[1],
                "title": f"{columns[1]} by {columns[0]}"
            }
        
        return None
```

---

## 📦 **Phase 6: Database Manager**

```python
# database/manager.py

import asyncpg  # PostgreSQL
import aiomysql  # MySQL
import cx_Oracle  # Oracle
import aiosqlite  # SQLite
from typing import Optional, Dict, List, Any

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.db_type = None
        self.config = None
    
    async def connect(self, config: Dict) -> bool:
        """Connect to database based on type"""
        self.config = config
        self.db_type = config['type']
        
        try:
            if self.db_type == 'postgresql':
                self.connection = await asyncpg.create_pool(
                    host=config['host'],
                    port=config['port'],
                    database=config['database'],
                    user=config['username'],
                    password=config['password']
                )
            elif self.db_type == 'mysql':
                self.connection = await aiomysql.create_pool(
                    host=config['host'],
                    port=config['port'],
                    db=config['database'],
                    user=config['username'],
                    password=config['password']
                )
            elif self.db_type == 'sqlite':
                self.connection = await aiosqlite.connect(config['database'])
            # Add Oracle support as needed
            
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False
    
    async def execute_query(self, sql: str) -> List[Dict]:
        """Execute SELECT query"""
        if not self.connection:
            raise Exception("Database not connected")
        
        try:
            if self.db_type == 'postgresql':
                async with self.connection.acquire() as conn:
                    rows = await conn.fetch(sql)
                    return [dict(row) for row in rows]
            
            elif self.db_type == 'mysql':
                async with self.connection.acquire() as conn:
                    async with conn.cursor(aiomysql.DictCursor) as cursor:
                        await cursor.execute(sql)
                        rows = await cursor.fetchall()
                        return rows
            
            elif self.db_type == 'sqlite':
                async with self.connection.execute(sql) as cursor:
                    rows = await cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description]
                    return [dict(zip(columns, row)) for row in rows]
            
            return []
        except Exception as e:
            raise Exception(f"Query execution failed: {str(e)}")
    
    async def get_schema(self) -> Dict:
        """Get database schema"""
        schema = {"tables": []}
        
        try:
            if self.db_type == 'postgresql':
                sql = """
                    SELECT table_name, column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public'
                    ORDER BY table_name, ordinal_position
                """
            elif self.db_type == 'mysql':
                sql = """
                    SELECT table_name, column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE()
                    ORDER BY table_name, ordinal_position
                """
            elif self.db_type == 'sqlite':
                sql = "SELECT name FROM sqlite_master WHERE type='table'"
            
            # Execute and build schema
            # Implementation depends on database type
            
        except Exception as e:
            print(f"Schema retrieval failed: {e}")
        
        return schema
```

---

## 📦 **Phase 7: Integration Testing**

### **7.1 Test Scenarios**

1. **Demo Mode (IndexedDB)**
   - ✅ All existing functionality works
   - ✅ No backend required
   - ✅ Fast local queries
   - ✅ Offline capable

2. **Production Mode (PostgreSQL + Gemini)**
   - ✅ Configure database connection
   - ✅ Configure Gemini API key
   - ✅ Natural language → SQL conversion
   - ✅ Execute queries on real database
   - ✅ Data visualization

3. **Mode Switching**
   - ✅ Switch from Demo → Production
   - ✅ Switch from Production → Demo
   - ✅ Configuration persists

---

## 📦 **Phase 8: Deployment**

### **8.1 Environment Variables**

```bash
# .env
GEMINI_API_KEY=your_gemini_api_key_here

# Database (when using Production mode)
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sally_tsm
DB_USER=postgres
DB_PASSWORD=your_password

# API
API_HOST=0.0.0.0
API_PORT=8000
```

### **8.2 Start Backend**

```bash
cd sally-backend
pip install -r requirements.txt
python main.py
```

### **8.3 Start Frontend**

```bash
cd sally-integration
npm install
npm run dev
```

---

## ✅ **Success Criteria**

- [x] IndexedDB demo mode continues working (no changes)
- [ ] Backend API responds to requests
- [ ] Gemini AI generates SQL queries
- [ ] Database connections work for PostgreSQL/MySQL/Oracle
- [ ] Configuration UI saves settings
- [ ] Mode switching works seamlessly
- [ ] Data flows correctly in both modes
- [ ] Error handling works properly
- [ ] Documentation is complete

---

## 📊 **Timeline**

- **Backend Setup**: 2-3 hours
- **Frontend Integration**: 1-2 hours
- **Testing**: 1 hour
- **Documentation**: 30 minutes
- **Total**: ~5-6 hours

---

## 🎯 **Next Steps**

1. ✅ Review this plan
2. ⏳ Implement backend (in progress)
3. ⏳ Create data service layer
4. ⏳ Update Configuration Cockpit
5. ⏳ Test both modes
6. ⏳ Deploy and validate

---

**Status**: 🚧 Ready to implement  
**Last Updated**: 2024-11-25
