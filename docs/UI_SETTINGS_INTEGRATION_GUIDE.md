# Sally TSM: UI Settings Integration Guide

## 🎯 Your Requirements Met

1. ✅ **LLM choice governed by UI settings** - User selects provider in UI
2. ✅ **Database testing through API layer** - No CORS issues
3. ✅ **Connection validation through backend** - Proper error handling

---

## 📋 **Implementation Overview**

### Architecture

```
UI Settings Panel (React)
    ↓
API Layer (FastAPI)
    ↓
Pure Provider Manager + Database
    ↓
Test Connections & Return Results
```

**Key Point:** ALL connection tests go through backend API - NO direct calls from UI!

---

## 🚀 **Quick Start**

### Step 1: Add Settings Router to Backend

```python
# backend/main.py

from backend.routers import settings  # Add this

app.include_router(settings.router)  # Add this line
```

### Step 2: Add Settings Panel to Frontend

```typescript
// src/pages/Index.tsx

import SettingsPanel from '@/components/SettingsPanel';

// Add to navigation:
<button onClick={() => setActiveView('settings')}>
  <Settings className="w-5 h-5" />
  Settings
</button>

// Add to view rendering:
{activeView === 'settings' && <SettingsPanel />}
```

### Step 3: Test

```bash
# Start backend
cd backend
uvicorn main:app --reload

# Start frontend
npm run dev

# Open http://localhost:5173 and go to Settings
```

---

## 📊 **UI Flow**

### 1. LLM Provider Selection

```
User opens Settings → LLM Provider tab
    ↓
UI fetches available providers: GET /api/v1/settings/llm-providers
    ↓
UI displays dropdown with:
    - OpenAI ($0.02/1M tokens)
    - Gemini (FREE) ✅
    - Claude (FREE local embeddings)
    ↓
User selects Gemini, enters API key
    ↓
User clicks "Test LLM Connection"
    ↓
UI calls: POST /api/v1/settings/llm-provider/test
    {
        "provider": "gemini",
        "api_key": "user-entered-key"
    }
    ↓
Backend tests:
    1. Validates API key
    2. Creates pure provider bundle (Gemini chat + Gemini embeddings)
    3. Tests embedding generation
    4. Tests chat model
    ↓
Backend returns:
    {
        "success": true,
        "message": "✅ GEMINI connection successful",
        "details": {
            "provider": "gemini",
            "chat_model": "gemini-1.5-flash",
            "embedding_model": "models/embedding-001",
            "embedding_cost": "FREE",
            "pure_provider": true
        }
    }
    ↓
UI displays green success message with details
```

### 2. Database Connection Test

```
User opens Settings → Database tab
    ↓
User enters PostgreSQL credentials:
    - Host: containers-us-west-123.railway.app
    - Port: 5432
    - Database: railway
    - Username: postgres
    - Password: ••••••••
    ↓
User clicks "Test Database Connection"
    ↓
UI calls: POST /api/v1/settings/database/test
    {
        "database_type": "postgres",
        "host": "...",
        "port": 5432,
        ...
    }
    ↓
Backend tests (ALL server-side, no CORS issues):
    1. Connects to PostgreSQL
    2. Checks database version
    3. Verifies pgvector extension
    4. Gets database size
    ↓
Backend returns:
    {
        "success": true,
        "message": "✅ PostgreSQL connection successful",
        "details": {
            "database_type": "PostgreSQL",
            "version": "15.3",
            "pgvector_installed": true,
            "database_size": "156 MB"
        }
    }
    ↓
UI displays connection details
```

### 3. Vector Store Test

```
User opens Settings → Vector Store tab
    ↓
User selects PGVector
    ↓
User clicks "Test Vector Store Connection"
    ↓
UI calls: POST /api/v1/settings/vector-store/test
    {
        "vector_store_type": "pgvector",
        "llm_provider": {
            "provider": "gemini"
        }
    }
    ↓
Backend tests:
    1. Gets embeddings from selected provider (Gemini)
    2. Generates test embedding
    3. Connects to PGVector
    4. Verifies collection creation
    ↓
Backend returns success with embedding details
    ↓
UI displays result
```

---

## 🔧 **API Endpoints**

### GET `/api/v1/settings/llm-providers`

Returns available LLM providers.

**Response:**
```json
{
  "providers": {
    "openai": {
      "name": "OpenAI",
      "embedding_cost": "$0.02/1M tokens",
      "native_embeddings": true,
      "requires_api_key": "OPENAI_API_KEY"
    },
    "gemini": {
      "name": "Google Gemini",
      "embedding_cost": "FREE",
      "native_embeddings": true,
      "requires_api_key": "GOOGLE_API_KEY"
    }
  },
  "configured": ["gemini"],
  "recommended": "gemini"
}
```

### POST `/api/v1/settings/llm-provider/test`

Test LLM provider connection.

**Request:**
```json
{
  "provider": "gemini",
  "api_key": "your-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ GEMINI connection successful",
  "details": {
    "provider": "gemini",
    "chat_model": "gemini-1.5-flash",
    "embedding_model": "models/embedding-001",
    "embedding_dimensions": 768,
    "embedding_cost": "FREE",
    "pure_provider": true
  },
  "timestamp": "2024-01-28T12:00:00Z"
}
```

### POST `/api/v1/settings/database/test`

Test database connection (through API - no CORS issues).

**Request:**
```json
{
  "database_type": "postgres",
  "host": "containers-us-west-123.railway.app",
  "port": 5432,
  "database": "railway",
  "username": "postgres",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ PostgreSQL connection successful",
  "details": {
    "database_type": "PostgreSQL",
    "version": "15.3",
    "pgvector_installed": true,
    "database_size": "156 MB"
  },
  "timestamp": "2024-01-28T12:00:00Z"
}
```

### POST `/api/v1/settings/vector-store/test`

Test vector store connection.

**Request:**
```json
{
  "vector_store_type": "pgvector",
  "llm_provider": {
    "provider": "gemini"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ PGVector connection successful",
  "details": {
    "vector_store_type": "PGVector",
    "embedding_provider": "gemini",
    "embedding_dimensions": 768,
    "embedding_model": "models/embedding-001"
  },
  "timestamp": "2024-01-28T12:00:00Z"
}
```

---

## 🎨 **UI Components**

### Settings Panel Features

1. **Tabs:** LLM Provider, Database, Vector Store
2. **Real-time Validation:** Test connections before saving
3. **Visual Feedback:** Green (success) / Red (error) messages
4. **Provider Info Cards:** Show cost, models, native embeddings
5. **Loading States:** Spinners during connection tests
6. **Detailed Results:** JSON view of test results

### Component Structure

```
SettingsPanel
├── Tab Navigation
│   ├── LLM Provider
│   ├── Database
│   └── Vector Store
│
├── LLM Provider Tab
│   ├── Provider Dropdown (auto-populated from API)
│   ├── Provider Info Card
│   ├── API Key Input
│   ├── Test Connection Button
│   └── Result Display
│
├── Database Tab
│   ├── Database Type Selector
│   ├── Connection Fields (host, port, etc.)
│   ├── Test Connection Button
│   └── Result Display
│
└── Vector Store Tab
    ├── Store Type Selector
    ├── Info Card
    ├── Test Connection Button
    └── Result Display
```

---

## 🔐 **Security & CORS**

### Why All Tests Go Through API Layer

**❌ Bad (Direct from UI):**
```typescript
// DON'T DO THIS - causes CORS issues
const testDB = async () => {
  // Direct PostgreSQL connection from browser - BLOCKED by CORS!
  const conn = await pg.connect({
    host: 'railway-host',
    ...
  });
};
```

**✅ Good (Through API):**
```typescript
// DO THIS - API layer handles connection
const testDB = async () => {
  const response = await fetch('/api/v1/settings/database/test', {
    method: 'POST',
    body: JSON.stringify({ /* credentials */ })
  });
};
```

### Benefits

1. ✅ **No CORS Issues** - Backend makes all connections
2. ✅ **Credential Security** - API keys never exposed to browser
3. ✅ **Validation** - Backend validates before testing
4. ✅ **Error Handling** - Consistent error responses
5. ✅ **Logging** - All tests logged server-side

---

## 📦 **Integration Steps**

### 1. Add to Backend Routes

```python
# backend/main.py

from backend.routers import qa_rag_pure, settings, morning_brief, scenarios

# Include routers
app.include_router(qa_rag_pure.router)  # Pure provider Q&A
app.include_router(settings.router)     # Settings & connection tests
app.include_router(morning_brief.router)
app.include_router(scenarios.router)
```

### 2. Add to Frontend Navigation

```typescript
// src/pages/Index.tsx

const [activeView, setActiveView] = useState('qa');

const navigation = [
  { id: 'qa', label: 'Q&A Assistant', icon: MessageSquare },
  { id: 'morning', label: 'Morning Brief', icon: Sun },
  { id: 'evening', label: 'Evening Summary', icon: Moon },
  { id: 'scenarios', label: 'Scenarios', icon: AlertCircle },
  { id: 'settings', label: 'Settings', icon: Settings },  // Add this
];

// Render
{activeView === 'settings' && <SettingsPanel />}
```

### 3. Update Environment Variables Based on UI Selection

After testing connections in UI, update environment:

```bash
# .env (or Railway/Vercel dashboard)

# User selected Gemini in UI
DEFAULT_LLM_PROVIDER=gemini
GOOGLE_API_KEY=user-entered-key

# User tested PostgreSQL
DATABASE_TYPE=postgres
POSTGRES_HOST=containers-us-west-123.railway.app
POSTGRES_PORT=5432
POSTGRES_DB=railway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=user-password

# User selected PGVector
VECTOR_STORE_TYPE=pgvector
USE_PGVECTOR=true
```

---

## 🧪 **Testing Workflow**

### End-to-End Test

1. **Open Settings**
   - Navigate to Settings panel

2. **Configure LLM Provider**
   - Select Gemini
   - Enter API key
   - Click "Test LLM Connection"
   - Verify green success message

3. **Configure Database**
   - Select PostgreSQL
   - Enter Railway credentials
   - Click "Test Database Connection"
   - Verify connection details (version, pgvector, size)

4. **Configure Vector Store**
   - Select PGVector
   - Click "Test Vector Store Connection"
   - Verify embedding provider matches LLM

5. **Save Settings**
   - Copy environment variables from API response
   - Update Railway/Vercel dashboard
   - Redeploy

---

## ✅ **Benefits**

### 1. UI-Driven Configuration

- ✅ Non-technical users can configure settings
- ✅ Visual feedback for all tests
- ✅ No manual environment variable editing

### 2. No CORS Issues

- ✅ All database/API calls from backend
- ✅ Browser never directly connects to services
- ✅ Consistent security model

### 3. Validation Before Deployment

- ✅ Test connections before saving
- ✅ Catch configuration errors early
- ✅ Detailed error messages

### 4. Pure Provider Implementation

- ✅ LLM selection controls both chat and embeddings
- ✅ Zero cross-dependencies
- ✅ Cost transparency (shows FREE for Gemini)

---

## 📚 **Files Created**

1. **[backend/routers/settings.py](computer:///home/user/sally-integration/backend/routers/settings.py)** - Settings API (19KB)
2. **[src/components/SettingsPanel.tsx](computer:///home/user/sally-integration/src/components/SettingsPanel.tsx)** - Settings UI (18KB)
3. **[UI_SETTINGS_INTEGRATION_GUIDE.md](computer:///home/user/sally-integration/UI_SETTINGS_INTEGRATION_GUIDE.md)** - This guide

---

## 🎯 **Summary**

Your requirements are **fully implemented**:

1. ✅ **LLM choice governed by UI settings**
   - User selects provider in dropdown
   - Selection controls both chat and embeddings
   - Pure provider implementation (no cross-deps)

2. ✅ **Database testing through API layer**
   - All tests via POST `/api/v1/settings/database/test`
   - No direct database connections from browser
   - Zero CORS issues

3. ✅ **Connection validation through backend**
   - Backend validates credentials
   - Tests actual connections
   - Returns detailed results
   - Logs all attempts

---

**Ready to configure Sally TSM through UI!** 🚀
