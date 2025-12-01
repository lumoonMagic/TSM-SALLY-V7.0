# 🔧 Backend Database Connection Fix

## Problem Summary

1. ✅ Backend API exists and works
2. ✅ UI sends correct parameters
3. ❌ Backend can't resolve `postgres.railway.internal` hostname
4. ❌ Backend doesn't auto-connect from `DATABASE_URL` on startup

## Root Causes

### **Issue 1: Railway Private Network Not Enabled**

**Error:** `could not translate host name "postgres.railway.internal" to address`

**Cause:** Services not properly linked via Shared Variables

**Solution:** Use Railway Shared Variables (you discovered this!)

### **Issue 2: Backend Doesn't Auto-Connect**

**Current behavior:** Backend only connects when you call `/api/v1/config/database`

**Problem:** If you have `DATABASE_URL` set, backend should connect automatically on startup

---

## ✅ Complete Fix

### **Step 1: Set Up Railway Shared Variables**

**In Railway Dashboard:**

1. **Go to your Project** (not individual service)
2. **Click "Settings"** or look for "Shared Variables"
3. **Link Postgres service** to your backend service
4. **In Backend Service Variables**, set:
   ```
   DATABASE_URL = ${{ Postgres.DATABASE_URL }}
   ```

This resolves to something like:
```
postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

### **Step 2: Update Backend to Auto-Connect on Startup**

**File:** `sally-backend/main.py`

**Find the `startup_event` function (around line 393):**

```python
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("="*60)
    logger.info("Sally TSM Backend Starting...")
    logger.info("="*60)
    
    if gemini_api_key:
        logger.info("✓ Gemini API key found")
    else:
        logger.warning("⚠ Gemini API key not configured")
    
    logger.info("="*60)
```

**Replace with:**

```python
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("="*60)
    logger.info("Sally TSM Backend Starting...")
    logger.info("="*60)
    
    # Check Gemini API key
    if gemini_api_key:
        logger.info("✓ Gemini API key found")
    else:
        logger.warning("⚠ Gemini API key not configured")
    
    # Auto-connect to database if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        logger.info("✓ DATABASE_URL found, attempting connection...")
        try:
            # Parse DATABASE_URL (format: postgresql://user:pass@host:port/dbname)
            from urllib.parse import urlparse
            parsed = urlparse(database_url)
            
            db_config = {
                'type': 'postgresql',  # or detect from scheme
                'host': parsed.hostname,
                'port': parsed.port or 5432,
                'database': parsed.path.lstrip('/'),
                'username': parsed.username,
                'password': parsed.password
            }
            
            success = await db_manager.connect(db_config)
            if success:
                logger.info("✓ Database connected successfully")
            else:
                logger.warning("⚠ Database connection failed")
        except Exception as e:
            logger.error(f"⚠ Database connection error: {str(e)}")
    else:
        logger.warning("⚠ DATABASE_URL not configured")
    
    logger.info("="*60)
```

### **Step 3: Add URL Parsing Import**

**At the top of `main.py` (around line 10), add:**

```python
from urllib.parse import urlparse
```

---

## Alternative: Use Connection String Directly

If you want to keep the hardcoded URL working, **use asyncpg's connection string directly**:

**Modify `sally-backend/database/manager.py`:**

Add a new method:

```python
async def connect_from_url(self, database_url: str) -> bool:
    """
    Connect using a database URL string
    
    Args:
        database_url: Full database connection URL
        
    Returns:
        bool: True if connection successful
    """
    try:
        logger.info(f"Connecting using DATABASE_URL...")
        
        # asyncpg can use connection string directly
        self.connection = await asyncpg.create_pool(
            database_url,
            min_size=1,
            max_size=10
        )
        
        self.db_type = 'postgresql'
        logger.info("Successfully connected via DATABASE_URL")
        return True
        
    except Exception as e:
        logger.error(f"Connection failed: {str(e)}")
        self.connection = None
        return False
```

**Then in `main.py` startup:**

```python
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("="*60)
    logger.info("Sally TSM Backend Starting...")
    logger.info("="*60)
    
    if gemini_api_key:
        logger.info("✓ Gemini API key found")
    else:
        logger.warning("⚠ Gemini API key not configured")
    
    # Auto-connect to database
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        logger.info("✓ DATABASE_URL found")
        success = await db_manager.connect_from_url(database_url)
        if success:
            logger.info("✓ Database connected")
        else:
            logger.warning("⚠ Database connection failed")
    else:
        logger.warning("⚠ DATABASE_URL not set")
    
    logger.info("="*60)
```

---

## About UI Configuration

### **Current Issue:**

When you configure database via UI:
1. Frontend calls `/api/v1/config/database`
2. Backend receives: `host`, `port`, `database`, `username`, `password`
3. Backend tries to connect using these parameters
4. **Fails if hostname can't be resolved**

### **Why `postgres.railway.internal` Fails:**

This hostname **only works** within Railway's private network, and only if:
- ✅ Services are properly linked
- ✅ Shared variables are configured

### **Solutions for UI Configuration:**

**Option 1: Don't use UI for Railway Postgres**
- Just set `DATABASE_URL` in Railway
- Backend auto-connects on startup
- UI shows connection status (read-only)

**Option 2: Use Public Hostname in UI**
- Get public hostname from Postgres service
- Format: `postgres.railway.app:XXXXX`
- Enter this in UI instead of internal hostname

**Option 3: Disable UI Configuration, Use Environment Only**
- Remove database config form from UI
- Only show connection status
- All configuration via Railway variables

---

## Recommended Configuration

### **For Railway Deployment:**

1. **In Railway Project → Shared Variables:**
   - Link Postgres service to Backend service

2. **In Backend Service Variables:**
   ```
   DATABASE_URL = ${{ Postgres.DATABASE_URL }}
   GEMINI_API_KEY = your-key
   DATABASE_TYPE = postgres
   PORT = 8000
   ```

3. **Backend auto-connects on startup** (with the fix above)

4. **UI Configuration:**
   - Shows connection status ✅
   - Doesn't allow changing connection (or optional)
   - Uses environment variables, not UI input

---

## Testing

### **After Applying Fix:**

1. **Deploy to Railway** with updated `main.py`

2. **Check Railway Logs:**
   ```
   Sally TSM Backend Starting...
   ✓ Gemini API key found
   ✓ DATABASE_URL found, attempting connection...
   ✓ Database connected successfully
   ```

3. **Test API:**
   ```bash
   curl https://sally-tsm-agent-production.up.railway.app/api/v1/health
   ```
   
   Should return:
   ```json
   {
     "status": "healthy",
     "database": {
       "connected": true,
       "type": "postgresql"
     }
   }
   ```

---

## Summary

### **Problems:**
1. ❌ Backend doesn't auto-connect from `DATABASE_URL`
2. ❌ UI tries to use `postgres.railway.internal` which doesn't resolve
3. ❌ Services not properly linked in Railway

### **Solutions:**
1. ✅ Use Railway Shared Variables for Postgres
2. ✅ Add auto-connect code in `startup_event`
3. ✅ Backend connects from `DATABASE_URL` on startup
4. ✅ UI shows status, doesn't need configuration

### **Next Steps:**
1. Update `main.py` with auto-connect code
2. Configure Railway Shared Variables
3. Deploy and test
4. UI will show "Connected" automatically

---

## Files to Update

1. **`sally-backend/main.py`**
   - Add `urlparse` import
   - Update `startup_event` function
   - Add auto-connect from `DATABASE_URL`

2. **Optional: `sally-backend/database/manager.py`**
   - Add `connect_from_url` method
   - Simplifies connection string usage

---

**Result:** Backend automatically connects to Postgres on startup using `DATABASE_URL`, no UI configuration needed! ✅
