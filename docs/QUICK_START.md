# 🚀 Quick Start Guide: Connect Frontend to Backend

## What This Fixes

**Problem**: Your Sally TSM app saves database settings to browser localStorage but doesn't connect to the Railway backend.

**Solution**: This integration connects your Vercel frontend to Railway backend API, enabling:
- ✅ Real PostgreSQL database queries
- ✅ Gemini AI-powered SQL generation
- ✅ Production mode operation
- ✅ Backend configuration management

---

## ⚡ 3-Step Quick Setup

### **Step 1: Add Environment File (2 minutes)**

In your GitHub repo (`github.com/lumoonMagic/sally-tsm-agent`):

1. Click "Add file" → "Create new file"
2. Name: `.env.production`
3. Content:
```env
VITE_API_BASE_URL=https://sally-tsm-agent-production.up.railway.app
VITE_MODE=production
```
4. Commit to main branch

### **Step 2: Add Two New Files (5 minutes)**

**File 1:** `src/lib/configApi.ts`
- Path in sandbox: `/home/user/sally-integration/src/lib/configApi.ts`
- Copy to GitHub: `src/lib/configApi.ts`
- Purpose: API service for backend communication

**File 2:** `src/lib/mode.ts`
- Path in sandbox: `/home/user/sally-integration/src/lib/mode.ts`
- Copy to GitHub: `src/lib/mode.ts`
- Purpose: Detect demo vs production mode

### **Step 3: Update ConfigurationCockpit (15 minutes)**

**File to modify:** `src/components/ConfigurationCockpit.tsx`

**See detailed instructions in:** `CONFIGURATION_COCKPIT_UPDATE.md`

**Key changes:**
1. Add imports: `import { configureDatabaseApi, configureLLMApi, getConfigStatus } from '@/lib/configApi'`
2. Replace `handleConfigSave` with `handleDatabaseSave` and `handleLLMSave`
3. Update save buttons to use new handlers

---

## 🧪 Test Your Integration

### **1. Verify Backend is Running**
```bash
curl https://sally-tsm-agent-production.up.railway.app/api/v1/health
```

Expected: `{ "status": "healthy", "database": { "connected": true } }`

### **2. Test Frontend**
1. Go to: https://sally-tsm-agent.vercel.app
2. Open Configuration Cockpit
3. Open browser DevTools Console
4. Look for: "Sally TSM Configuration Cockpit loaded: { mode: 'production' }"

### **3. Test Configuration Flow**
1. Go to Database Setup tab
2. Settings should already be connected (Railway automatically provides DATABASE_URL)
3. Click "Test Connection"
4. Should see: "Connection Successful" ✅

### **4. Test Backend Status**
- Backend Status panel should show:
  - Database: "Connected (postgresql)" ✅
  - LLM: "Configured (gemini)" ✅

---

## 📊 Before vs After

### **Before (Demo Mode)**
```
User changes settings
    ↓
Saves to localStorage (browser only)
    ↓
Uses IndexedDB sample data
    ↓
No backend connection
```

### **After (Production Mode)**
```
User changes settings
    ↓
Saves to localStorage + POST to Railway API
    ↓
Railway backend connects to PostgreSQL
    ↓
Returns success/failure
    ↓
UI shows real connection status
```

---

## ✅ Success Checklist

Your integration is working when:

- [ ] Vercel app loads without errors
- [ ] Browser console shows "Production Mode"
- [ ] Configuration Cockpit shows Backend Status panel
- [ ] Database status: "Connected (postgresql)"
- [ ] LLM status: "Configured (gemini)"
- [ ] Save buttons show loading spinner
- [ ] Network tab shows POST to Railway API
- [ ] Backend responds with success
- [ ] Q&A Assistant uses real database (not demo data)

---

## 🔥 Common Issues

### **Issue: Still in Demo Mode**
**Fix:** 
1. Check `.env.production` exists in GitHub root
2. Verify Vercel redeployed after adding file
3. Clear browser cache and reload

### **Issue: CORS Error**
**Fix:** Backend CORS is already configured for `*.vercel.app`
- Check Railway logs for actual error
- Verify URL is exactly: `https://sally-tsm-agent-production.up.railway.app`

### **Issue: Backend Not Responding**
**Fix:**
1. Check Railway service status (should be "Active")
2. Check Railway deployment logs
3. Verify `GEMINI_API_KEY` is set in Railway
4. Test manually: `curl https://sally-tsm-agent-production.up.railway.app/api/v1/health`

---

## 📚 Documentation Structure

```
sally-integration/
├── QUICK_START.md (this file) ⭐ Start here
├── BACKEND_INTEGRATION_COMPLETE_GUIDE.md 📖 Full guide
├── DATABASE_SETTINGS_FLOW.md 🔍 Detailed flow explanation
├── CONFIGURATION_COCKPIT_UPDATE.md 🔧 Component update instructions
├── MODULE_REFERENCE.md 📑 Component reference
├── API_REFERENCE.md 🌐 Backend API reference
├── DEVELOPMENT_GUIDE.md 👨‍💻 Development workflow
└── src/lib/
    ├── configApi.ts ✨ New file to add
    └── mode.ts ✨ New file to add
```

---

## 🎯 What To Do Right Now

1. **Add `.env.production`** to GitHub (2 min)
2. **Copy 2 files** (`configApi.ts`, `mode.ts`) to GitHub (5 min)
3. **Update `ConfigurationCockpit.tsx`** following `CONFIGURATION_COCKPIT_UPDATE.md` (15 min)
4. **Push to GitHub** → Vercel auto-deploys (2 min)
5. **Test the integration** (5 min)

**Total time: ~30 minutes** ⏱️

---

## 🎉 Result

After completing these steps:
- ✅ Your Vercel frontend will connect to Railway backend
- ✅ Database settings will persist to PostgreSQL
- ✅ Gemini AI will process queries through backend API
- ✅ Q&A Assistant will query real database
- ✅ Production mode fully operational

---

## 💡 Pro Tips

1. **Keep browser DevTools open** - Console and Network tabs are your friends
2. **Check Railway logs** - Real-time backend monitoring
3. **Test incrementally** - Verify each step before moving forward
4. **Use the documentation** - All details are in the guide files

---

## 🆘 Need More Help?

- **Full detailed guide:** `BACKEND_INTEGRATION_COMPLETE_GUIDE.md`
- **Flow explanation:** `DATABASE_SETTINGS_FLOW.md`
- **Component updates:** `CONFIGURATION_COCKPIT_UPDATE.md`
- **API reference:** `API_REFERENCE.md`

---

**Ready to integrate? Let's go! 🚀**

Start with Step 1: Add `.env.production` to GitHub! ✨
