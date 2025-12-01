# ConfigurationCockpit Component Update

## Changes Needed to Enable Backend Integration

This document outlines the changes needed in `src/components/ConfigurationCockpit.tsx` to properly save configuration to the backend.

### 1. Add New Imports

Replace the existing imports section with:

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  Brain, 
  TestTube, 
  Save, 
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { 
  configureDatabaseApi, 
  configureLLMApi, 
  getConfigStatus,
  testBackendConnection
} from '@/lib/configApi';
import { isProductionMode, getModeInfo } from '@/lib/mode';
```

### 2. Add State Variables

After the existing state declarations, add:

```typescript
const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
const [dataModelFile, setDataModelFile] = useState<File | null>(null);
const [backendStatus, setBackendStatus] = useState<{
  database: { connected: boolean; type: string | null };
  llm: { configured: boolean; provider: string | null };
} | null>(null);
const [isSavingDatabase, setIsSavingDatabase] = useState(false);
const [isSavingLLM, setIsSavingLLM] = useState(false);
```

### 3. Replace handleConfigSave with Database-Specific Handler

Replace the existing `handleConfigSave` function with:

```typescript
const handleDatabaseSave = async () => {
  setIsSavingDatabase(true);
  
  try {
    // 1. Save to localStorage (for client-side persistence)
    updateConfig({ 
      databaseType: config.databaseType, 
      databaseConfig: config.databaseConfig 
    });
    
    // 2. Check if backend is available
    if (!isProductionMode()) {
      toast({
        title: "Configuration Saved Locally",
        description: "Settings saved to browser. Enable production mode to connect to backend.",
      });
      setIsSavingDatabase(false);
      return;
    }
    
    // 3. Call backend API
    const result = await configureDatabaseApi({
      type: config.databaseType === 'sqlite' ? 'sqlite' : 
            config.databaseType === 'postgres' ? 'postgresql' :
            config.databaseType === 'mysql' ? 'mysql' : 'postgresql',
      database: config.databaseConfig.database || 'tsm_database',
      host: config.databaseConfig.host,
      port: config.databaseConfig.port,
      username: config.databaseConfig.username,
      password: config.databaseConfig.password,
    });
    
    if (result.success) {
      toast({
        title: "Database Connected",
        description: "Successfully connected to your database.",
      });
      // Refresh backend status
      await refreshBackendStatus();
      setTestConnection('success');
    } else {
      toast({
        title: "Connection Failed",
        description: result.error || "Could not connect to database",
        variant: "destructive"
      });
      setTestConnection('error');
    }
  } catch (error) {
    console.error('Database configuration error:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to configure database",
      variant: "destructive"
    });
    setTestConnection('error');
  } finally {
    setIsSavingDatabase(false);
  }
};
```

### 4. Add LLM Configuration Handler

Add this new function:

```typescript
const handleLLMSave = async () => {
  setIsSavingLLM(true);
  
  try {
    // 1. Save to localStorage
    updateConfig({ 
      llmProvider: config.llmProvider, 
      llmApiKey: config.llmApiKey 
    });
    
    // 2. Check if backend is available
    if (!isProductionMode()) {
      toast({
        title: "Configuration Saved Locally",
        description: "Settings saved to browser. Enable production mode to connect to backend.",
      });
      setIsSavingLLM(false);
      return;
    }
    
    // 3. Skip if using local mode
    if (config.llmProvider === 'local') {
      toast({
        title: "Demo Mode Active",
        description: "Using local processing. Select a provider and add API key for production use.",
      });
      setIsSavingLLM(false);
      return;
    }
    
    // 4. Call backend API
    const result = await configureLLMApi({
      provider: config.llmProvider,
      api_key: config.llmApiKey,
      model: config.llmProvider === 'gemini' ? 'gemini-pro' : undefined,
    });
    
    if (result.success) {
      toast({
        title: "LLM Configured",
        description: `Successfully configured ${config.llmProvider}`,
      });
      // Refresh backend status
      await refreshBackendStatus();
    } else {
      toast({
        title: "Configuration Failed",
        description: result.error || "Invalid API key",
        variant: "destructive"
      });
    }
  } catch (error) {
    console.error('LLM configuration error:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to configure LLM",
      variant: "destructive"
    });
  } finally {
    setIsSavingLLM(false);
  }
};
```

### 5. Add Backend Status Refresh Function

```typescript
const refreshBackendStatus = async () => {
  try {
    const status = await getConfigStatus();
    setBackendStatus(status);
  } catch (error) {
    console.error('Failed to get backend status:', error);
  }
};
```

### 6. Add useEffect to Check Backend on Mount

Add this after the state declarations:

```typescript
useEffect(() => {
  // Check backend status on mount
  if (isProductionMode()) {
    refreshBackendStatus();
  }
  
  // Log mode information for debugging
  const modeInfo = getModeInfo();
  console.log('Sally TSM Configuration Cockpit loaded:', modeInfo);
}, []);
```

### 7. Update Test Connection Handler

Replace the existing `handleTestConnection` with:

```typescript
const handleTestConnection = async () => {
  setTestConnection('testing');
  
  try {
    // Check if backend is available
    const backendAvailable = await testBackendConnection();
    
    if (!backendAvailable) {
      setTestConnection('error');
      toast({
        title: "Backend Unavailable",
        description: "Cannot connect to backend API. Check if backend is deployed.",
        variant: "destructive",
      });
      return;
    }
    
    // Test database connection via backend
    const result = await configureDatabaseApi({
      type: config.databaseType === 'postgres' ? 'postgresql' : config.databaseType,
      database: config.databaseConfig.database || 'tsm_database',
      host: config.databaseConfig.host,
      port: config.databaseConfig.port,
      username: config.databaseConfig.username,
      password: config.databaseConfig.password,
    });
    
    if (result.success) {
      setTestConnection('success');
      toast({
        title: "Connection Successful",
        description: "Database connection established successfully.",
      });
    } else {
      setTestConnection('error');
      toast({
        title: "Connection Failed",
        description: result.error || "Please check your database configuration.",
        variant: "destructive",
      });
    }
  } catch (error) {
    setTestConnection('error');
    toast({
      title: "Connection Error",
      description: error instanceof Error ? error.message : "Failed to test connection",
      variant: "destructive",
    });
  }
};
```

### 8. Update Save Button in Database Tab

Find this line in the Database tab (around line 350):

```typescript
<Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
```

Replace with:

```typescript
<Button 
  onClick={handleDatabaseSave} 
  disabled={isSavingDatabase}
  className="bg-green-600 hover:bg-green-700"
>
  {isSavingDatabase ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="h-4 w-4 mr-2" />
      Save Database Configuration
    </>
  )}
</Button>
```

### 9. Update Save Button in LLM Tab

Find this line in the LLM tab (around line 205):

```typescript
<Button onClick={handleConfigSave} className="bg-green-600 hover:bg-green-700">
```

Replace with:

```typescript
<Button 
  onClick={handleLLMSave} 
  disabled={isSavingLLM}
  className="bg-green-600 hover:bg-green-700"
>
  {isSavingLLM ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="h-4 w-4 mr-2" />
      Save LLM Configuration
    </>
  )}
</Button>
```

### 10. Add Backend Status Display (Optional)

Add this above the Tabs component to show current backend status:

```typescript
{backendStatus && (
  <Card className="bg-slate-800 border-slate-700 mb-6">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Info className="h-5 w-5 text-blue-400" />
        Backend Status
      </CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-sm text-slate-400 mb-1">Database</div>
        <div className="flex items-center gap-2">
          {backendStatus.database.connected ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span className="text-white">
            {backendStatus.database.connected 
              ? `Connected (${backendStatus.database.type})`
              : 'Not Connected'}
          </span>
        </div>
      </div>
      <div>
        <div className="text-sm text-slate-400 mb-1">LLM</div>
        <div className="flex items-center gap-2">
          {backendStatus.llm.configured ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span className="text-white">
            {backendStatus.llm.configured 
              ? `Configured (${backendStatus.llm.provider})`
              : 'Not Configured'}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Summary of Changes

1. ✅ Added imports for API service and mode detection
2. ✅ Added state for backend status tracking
3. ✅ Created `handleDatabaseSave()` to call backend API
4. ✅ Created `handleLLMSave()` to configure LLM
5. ✅ Added backend status refresh functionality
6. ✅ Updated test connection to use backend
7. ✅ Added loading states for save buttons
8. ✅ Added backend status display panel

## Testing After Implementation

1. **Start the app**: `npm run dev`
2. **Open Configuration Cockpit**
3. **Configure database settings**
4. **Click "Save Database Configuration"**
5. **Check browser console for**:
   - Mode information logs
   - API request/response
   - Any errors
6. **Check Network tab in DevTools**:
   - POST request to `/api/v1/config/database`
   - Response from Railway backend
7. **Verify backend status panel updates**

## Files Modified

- `src/components/ConfigurationCockpit.tsx` (this file)

## New Files Created

- `src/lib/configApi.ts` (API service)
- `src/lib/mode.ts` (Mode detection)

## Environment Variables Required

Create `.env.production` in project root:

```env
VITE_API_BASE_URL=https://sally-tsm-agent-production.up.railway.app
VITE_MODE=production
```

After adding this file, commit and push to GitHub. Vercel will auto-deploy with production settings.
