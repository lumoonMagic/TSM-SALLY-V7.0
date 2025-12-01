# How Database Settings Are Saved from UI

## Current Implementation Overview

Your Sally TSM application has **two distinct modes** of operation:

### 1. **Demo Mode (Currently Active)**
- Uses **localStorage** (browser local storage) for configuration
- Uses **IndexedDB** for sample data
- Everything stays **client-side** only
- **No backend connection required**

### 2. **Production Mode (Requires Backend)**
- Uses **Railway backend API** for database operations
- Connects to **PostgreSQL** (or other databases)
- Requires **backend deployment** and API configuration

---

## Current Settings Storage Architecture

### **Frontend Configuration Storage**

**Location:** `src/contexts/AppContext.tsx`

```typescript
// Configuration is saved to localStorage when user clicks "Save"
const updateConfig = (newConfig: Partial<AppContextType['config']>) => {
  const updatedConfig = { ...config, ...newConfig };
  setConfig(updatedConfig);
  
  // Save to localStorage (browser storage)
  localStorage.setItem('sally-tsm-config', JSON.stringify(updatedConfig));
};
```

**Configuration includes:**
- `llmProvider`: 'local' | 'openai' | 'anthropic' | 'gemini'
- `llmApiKey`: API key for LLM
- `databaseType`: 'sqlite' | 'postgres' | 'mysql' | 'mssql'
- `databaseConfig`: { host, port, database, username, password }
- `theme`: Theme settings
- `emailConfig`: Email settings

**Storage mechanism:**
- **localStorage** (`sally-tsm-config` key)
- Persists across browser sessions
- **Client-side only** - never leaves the browser

---

## Why Settings Don't Persist to Backend (Current Issue)

### **The Problem:**
When you change database settings in the UI:
1. ✅ Settings are saved to **localStorage** (browser)
2. ❌ Settings are **NOT sent to the Railway backend**
3. ❌ UI doesn't **switch from demo mode to production mode**
4. ❌ Backend configuration endpoints are **not being called**

### **Root Cause:**
The `ConfigurationCockpit.tsx` component currently:
```typescript
const handleConfigSave = () => {
  // Only shows a toast notification
  toast({
    title: "Configuration Saved",
    description: "Your settings have been successfully updated.",
  });
  // ❌ Does NOT call backend API
  // ❌ Does NOT test connection
  // ❌ Does NOT switch modes
};
```

---

## How Backend API Should Be Called

### **Backend Configuration Endpoints (Already Built)**

#### 1. **Configure Database** (`/api/v1/config/database`)
```typescript
// POST request
{
  "type": "postgresql",
  "host": "your-host",
  "port": 5432,
  "database": "your-database",
  "username": "your-username",
  "password": "your-password"
}

// Response
{
  "success": true,
  "message": "Successfully connected to postgresql database"
}
```

#### 2. **Configure LLM** (`/api/v1/config/llm`)
```typescript
// POST request
{
  "provider": "gemini",
  "api_key": "your-api-key",
  "model": "gemini-pro"
}

// Response
{
  "success": true,
  "message": "Successfully configured gemini"
}
```

#### 3. **Check Configuration Status** (`/api/v1/config/status`)
```typescript
// GET request - returns current status
{
  "database": {
    "connected": true,
    "type": "postgresql",
    "status": "connected"
  },
  "llm": {
    "configured": true,
    "provider": "gemini",
    "status": "ready"
  }
}
```

---

## What Needs to Be Fixed

### **Step 1: Create API Service for Configuration**

Create `src/lib/configApi.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function configureDatabaseApi(config: {
  type: 'postgresql' | 'mysql' | 'oracle' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/config/database`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return response.json();
}

export async function configureLLMApi(config: {
  provider: 'gemini' | 'openai' | 'claude';
  api_key: string;
  model?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/config/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return response.json();
}

export async function getConfigStatus() {
  const response = await fetch(`${API_BASE_URL}/api/v1/config/status`);
  return response.json();
}
```

### **Step 2: Update ConfigurationCockpit Component**

In `src/components/ConfigurationCockpit.tsx`:

```typescript
import { configureDatabaseApi, configureLLMApi, getConfigStatus } from '@/lib/configApi';

// Replace handleConfigSave for Database tab
const handleDatabaseSave = async () => {
  try {
    // 1. Save to localStorage (already working)
    updateConfig({ databaseType: config.databaseType, databaseConfig: config.databaseConfig });
    
    // 2. Call backend API
    const result = await configureDatabaseApi({
      type: config.databaseType,
      ...config.databaseConfig
    });
    
    if (result.success) {
      toast({
        title: "Database Connected",
        description: "Successfully connected to your database.",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: result.error || "Could not connect to database",
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to configure database",
      variant: "destructive"
    });
  }
};

// Replace handleConfigSave for LLM tab
const handleLLMSave = async () => {
  try {
    // 1. Save to localStorage
    updateConfig({ llmProvider: config.llmProvider, llmApiKey: config.llmApiKey });
    
    // 2. Call backend API
    const result = await configureLLMApi({
      provider: config.llmProvider,
      api_key: config.llmApiKey
    });
    
    if (result.success) {
      toast({
        title: "LLM Configured",
        description: `Successfully configured ${config.llmProvider}`,
      });
    } else {
      toast({
        title: "Configuration Failed",
        description: result.error || "Invalid API key",
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to configure LLM",
      variant: "destructive"
    });
  }
};
```

### **Step 3: Add Mode Detection**

In `src/lib/database.ts` (or create `src/lib/mode.ts`):

```typescript
export const isProductionMode = (): boolean => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const mode = import.meta.env.VITE_MODE;
  
  // Production if:
  // 1. VITE_API_BASE_URL is set
  // 2. VITE_MODE is 'production'
  return !!(apiBaseUrl && mode === 'production');
};

export const getDatabaseType = (): 'demo' | 'production' => {
  return isProductionMode() ? 'production' : 'demo';
};
```

### **Step 4: Update Query Components**

Modify components like `DataVisualizationPanel`, `QAAssistantPanel` to check mode:

```typescript
import { isProductionMode } from '@/lib/mode';

// In query execution
const executeQuery = async () => {
  if (isProductionMode()) {
    // Call Railway backend API
    const response = await fetch(`${API_BASE_URL}/api/v1/query/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql_query: approvedSQL })
    });
    const result = await response.json();
    setData(result.data);
  } else {
    // Use IndexedDB demo data
    const demoData = await db.getAll('sites');
    setData(demoData);
  }
};
```

---

## Complete Flow Diagram

### **Demo Mode (Current):**
```
User Changes Settings
       ↓
updateConfig() called
       ↓
localStorage.setItem('sally-tsm-config', config)
       ↓
✅ Settings saved to browser
❌ No backend involved
❌ Still in demo mode
```

### **Production Mode (After Fix):**
```
User Changes Database Settings
       ↓
handleDatabaseSave() called
       ↓
1. Save to localStorage (updateConfig)
2. POST to /api/v1/config/database
       ↓
Railway Backend receives config
       ↓
Backend tests PostgreSQL connection
       ↓
Backend returns success/failure
       ↓
UI shows connection status
       ↓
✅ Settings saved to localStorage
✅ Backend connected to database
✅ Production mode activated
```

---

## Environment Variables Required

### **Frontend (.env.production)**
```env
VITE_API_BASE_URL=https://sally-tsm-agent-production.up.railway.app
VITE_MODE=production
```

### **Backend (Railway Environment Variables)**
```env
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=${{ Postgres.DATABASE_URL }}
DATABASE_TYPE=postgres
PORT=8000
```

---

## Testing the Complete Flow

### **1. Test Backend API Directly**
```bash
# Test database configuration
curl -X POST https://sally-tsm-agent-production.up.railway.app/api/v1/config/database \
  -H "Content-Type: application/json" \
  -d '{
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "tsm_db",
    "username": "user",
    "password": "pass"
  }'

# Check configuration status
curl https://sally-tsm-agent-production.up.railway.app/api/v1/config/status
```

### **2. Test from Vercel Frontend**
1. Go to https://sally-tsm-agent.vercel.app
2. Open **Configuration Cockpit**
3. Configure Database settings
4. Click **Save Database Configuration**
5. Open browser DevTools → Network tab
6. Verify POST request to Railway API
7. Check response for success/failure

### **3. Verify Production Mode**
```javascript
// In browser console
localStorage.getItem('sally-tsm-config')
// Should show saved database config

// Check if API is reachable
fetch('https://sally-tsm-agent-production.up.railway.app/api/v1/health')
  .then(r => r.json())
  .then(console.log)
// Should show: { status: "healthy", database: { connected: true } }
```

---

## Summary

### **Current State:**
- ✅ Settings UI exists and looks good
- ✅ Backend API endpoints are built
- ✅ localStorage saves settings in browser
- ❌ UI doesn't call backend API
- ❌ Configuration never reaches Railway
- ❌ App stays in demo mode

### **What You Need To Do:**
1. **Create `.env.production` in GitHub** with `VITE_API_BASE_URL`
2. **Create `src/lib/configApi.ts`** with API call functions
3. **Update `ConfigurationCockpit.tsx`** to call backend API
4. **Add mode detection** to switch between demo/production
5. **Test configuration flow** end-to-end
6. **Deploy to Vercel** (auto-deploy on push)

### **Expected Result After Fix:**
- User configures database settings → Settings saved to Railway backend
- Backend connects to PostgreSQL → Returns success/failure
- Frontend switches to production mode → All queries go through Railway API
- Data comes from real database → Not IndexedDB demo data
- Gemini AI processes queries → Returns real SQL and insights

---

## Quick Action Plan

1. **Today:** Create `.env.production` in GitHub with Railway URL
2. **Today:** Add `configApi.ts` to call backend
3. **Today:** Update `ConfigurationCockpit.tsx` to use API
4. **Tomorrow:** Test end-to-end configuration flow
5. **Tomorrow:** Verify production mode works with real database

The architecture is **99% complete** - you just need to connect the frontend configuration UI to the backend API endpoints! 🚀
