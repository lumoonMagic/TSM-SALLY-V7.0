# 🚀 Complete Deployment Guide - Railway & Vercel
**Version:** 6.0  
**Date:** 2025-11-28  
**Status:** Production Ready

---

## 📋 Prerequisites

### Required:
- ✅ Railway account (https://railway.app)
- ✅ Vercel account (https://vercel.com)
- ✅ Google API key (for Gemini - FREE embeddings)
- ✅ Git repository (GitHub/GitLab/Bitbucket)

### Optional:
- OpenAI API key (if using OpenAI)
- Anthropic API key (if using Claude)

---

## 🎯 Deployment Architecture

```
┌─────────────────────┐
│   Vercel Frontend   │ (React + TypeScript)
│  User Interface     │
└──────────┬──────────┘
           │ HTTPS
           │ VITE_API_URL
           ▼
┌─────────────────────┐
│  Railway Backend    │ (FastAPI + Python)
│  API + Database     │
└─────────┬───────────┘
          │
          ├─── PostgreSQL Database
          └─── Vector Store (pgvector)
```

---

## 🔧 Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. **Go to Railway Dashboard:**
   - Visit https://railway.app/dashboard
   - Click "New Project"

2. **Add PostgreSQL Database:**
   - Click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Wait for provisioning (~1 minute)

### Step 2: Configure Database

1. **Enable pgvector Extension:**
   ```sql
   # Click on PostgreSQL service
   # Go to "Data" tab
   # Click "Connect"
   # Run in psql:
   CREATE EXTENSION IF NOT EXISTS vector;
   
   # Verify
   SELECT * FROM pg_extensions WHERE extname = 'vector';
   ```

2. **Note Connection Details:**
   - Railway automatically sets `DATABASE_URL`
   - No manual configuration needed

### Step 3: Deploy Backend

1. **Connect GitHub Repository:**
   - Click "+ New"
   - Select "GitHub Repo"
   - Choose your repository
   - Select `backend` directory as root

2. **Configure Build Settings:**

   **Method 1: Using Procfile (Recommended)**
   Create `Procfile` in project root:
   ```
   web: cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

   **Method 2: Using Railway.json**
   Create `railway.json`:
   ```json
   {
     "build": {
       "builder": "nixpacks",
       "buildCommand": "pip install -r requirements.txt"
     },
     "deploy": {
       "startCommand": "cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "on-failure",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Set Environment Variables:**

   Go to Railway project → Variables → Add these:

   ```bash
   # LLM Provider (Choose one or more)
   GOOGLE_API_KEY=your-google-api-key
   # OPENAI_API_KEY=your-openai-api-key
   # ANTHROPIC_API_KEY=your-anthropic-api-key
   
   # Default Provider
   DEFAULT_LLM_PROVIDER=gemini
   
   # Database (automatically set by Railway)
   # DATABASE_URL is automatically populated
   
   # Vector Store
   VECTOR_STORE_TYPE=pgvector
   
   # CORS (update after deploying frontend)
   ALLOWED_ORIGINS=*
   
   # Python environment
   PYTHON_VERSION=3.11
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build (~3-5 minutes)
   - Check logs for errors

### Step 4: Verify Backend Deployment

1. **Get Backend URL:**
   - Click on backend service
   - Copy the public URL (e.g., `https://sally-backend.railway.app`)

2. **Test Health Endpoint:**
   ```bash
   curl https://your-backend-url.railway.app/api/v1/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "database": {
       "connected": true,
       "type": "postgresql"
     },
     "ai": {
       "configured": true,
       "provider": "gemini"
     }
   }
   ```

---

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update Environment Variables:**
   Create `.env.production` in project root:
   ```bash
   VITE_API_URL=https://your-backend-url.railway.app
   ```

2. **Verify Build Configuration:**
   
   **Check `package.json`:**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

   **Check `vite.config.ts`:**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: 'dist',
       sourcemap: false,
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom', 'react-router-dom']
           }
         }
       }
     }
   })
   ```

### Step 2: Deploy to Vercel

1. **Connect Repository:**
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your Git repository
   - Select the repository

2. **Configure Build Settings:**
   
   **Framework Preset:** Vite
   
   **Build & Development Settings:**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables:**
   
   In Vercel project settings → Environment Variables:
   ```bash
   VITE_API_URL=https://your-backend-url.railway.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build (~2-3 minutes)

### Step 3: Update CORS in Railway

1. **Go to Railway Backend Variables:**
   - Update `ALLOWED_ORIGINS`:
   ```bash
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
   ```

2. **Redeploy Backend:**
   - Click "Deploy" in Railway
   - Wait for deployment

---

## 🔧 Part 3: Post-Deployment Configuration

### Step 1: Initialize Database Schema

1. **Create Tables:**
   Connect to Railway PostgreSQL and run schema:
   ```sql
   -- Run the database schema from DATABASE_SCHEMA.sql
   -- This creates all required tables
   ```

2. **Verify Tables:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Step 2: Configure via UI

1. **Open Frontend URL:**
   - Visit your Vercel deployment URL

2. **Go to Settings Panel:**
   - Click on Settings icon
   - Navigate to "LLM Provider" section

3. **Configure Provider:**
   - Select "Gemini" (recommended for FREE embeddings)
   - Enter Google API key
   - Click "Test Connection"
   - Should see "✅ Connection successful"

4. **Configure Database:**
   - Database should auto-connect via Railway `DATABASE_URL`
   - Click "Test Database Connection"
   - Should see "✅ Database connected"

### Step 3: Test Features

1. **Test Q&A:**
   - Go to Q&A tab
   - Ask: "What is clinical trial supply management?"
   - Should get AI response

2. **Test Morning Brief:**
   - Go to Morning Brief tab
   - Click "Generate"
   - Should see daily briefing

3. **Test Scenarios:**
   - Go to Scenarios tab
   - Select a scenario
   - Should see recommendations

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend Build Fails

**Error:** `ModuleNotFoundError: No module named 'xxx'`

**Solution:**
1. Check `requirements.txt` includes all dependencies
2. Verify Python version in environment variables
3. Check Railway build logs

### Issue 2: Frontend Build Fails

**Error:** `Module not found: Can't resolve 'xxx'`

**Solution:**
1. Run `npm install` locally
2. Check `package.json` dependencies
3. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Issue 3: CORS Error in Browser

**Error:** `Access to fetch at 'xxx' from origin 'xxx' has been blocked by CORS policy`

**Solution:**
1. Update `ALLOWED_ORIGINS` in Railway
2. Redeploy backend
3. Clear browser cache

### Issue 4: Database Connection Failed

**Error:** `could not connect to server`

**Solution:**
1. Verify `DATABASE_URL` is set in Railway
2. Check PostgreSQL service is running
3. Verify pgvector extension is enabled

### Issue 5: LLM Provider Test Fails

**Error:** `Invalid API key`

**Solution:**
1. Verify API key is correct
2. Check API key has required permissions
3. Ensure environment variable is set correctly

---

## 📊 Performance Optimization

### Backend Optimization:

1. **Enable Caching:**
   ```python
   # Add to backend/config.py
   CACHE_TTL = 3600  # 1 hour
   ```

2. **Connection Pooling:**
   ```python
   # Already configured in database manager
   ```

3. **Async Operations:**
   ```python
   # Already using async/await pattern
   ```

### Frontend Optimization:

1. **Code Splitting:**
   ```typescript
   // Already configured in vite.config.ts
   ```

2. **Image Optimization:**
   ```bash
   # Use WebP format for images
   ```

3. **Enable Compression:**
   ```json
   // Add to vercel.json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Content-Encoding",
             "value": "gzip"
           }
         ]
       }
     ]
   }
   ```

---

## 📈 Monitoring & Maintenance

### Railway Monitoring:

1. **View Logs:**
   - Click on service
   - Go to "Deployments"
   - Click on latest deployment
   - View logs in real-time

2. **Resource Usage:**
   - Check CPU usage
   - Check memory usage
   - Monitor database connections

### Vercel Monitoring:

1. **Analytics:**
   - Go to project → Analytics
   - View page views, performance metrics

2. **Deployment Logs:**
   - Go to Deployments tab
   - Click on deployment
   - View build and runtime logs

---

## 💰 Cost Estimation

### Development (Free Tier):
- **Railway:** $5/month (includes PostgreSQL)
- **Vercel:** Free
- **Google Gemini:** Free embeddings
- **Total:** $5/month

### Production (Small):
- **Railway:** $5-20/month
- **Vercel:** $20/month (Pro plan)
- **Google Gemini:** Free embeddings
- **Total:** $25-40/month

### Production (Medium):
- **Railway:** $20-50/month
- **Vercel:** $20/month
- **Google Gemini:** Free embeddings
- **Total:** $40-70/month

---

## 🔐 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use different keys for dev/prod
   - Rotate API keys regularly

2. **CORS Configuration:**
   - Set specific origins in production
   - Don't use wildcard (`*`) in production

3. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

4. **API Rate Limiting:**
   - Implement rate limiting in backend
   - Monitor API usage

---

## 🧪 Testing Deployment

### Test Checklist:

- [ ] Backend health endpoint responds
- [ ] Database connection successful
- [ ] Frontend loads without errors
- [ ] LLM provider connects successfully
- [ ] Q&A feature works
- [ ] Morning Brief generates
- [ ] Scenarios load correctly
- [ ] Settings panel functions
- [ ] No CORS errors in browser console
- [ ] API responses are fast (<2 seconds)

### Test Commands:

```bash
# Test backend health
curl https://your-backend.railway.app/api/v1/health

# Test LLM providers
curl https://your-backend.railway.app/api/v1/settings/llm-providers

# Test database connection (from backend logs)
# Check Railway logs for "✓ Database connected successfully"
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

## 🎯 Quick Reference Commands

### Local Development:

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Frontend
npm install
npm run dev
```

### Testing:

```bash
# Run backend tests
pytest backend/tests/ -v

# Run frontend tests (if configured)
npm test
```

### Deployment:

```bash
# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Deploy updates"
git push origin main
```

---

## ✅ Deployment Complete!

Your Sally TSM application is now deployed and running!

- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-backend.railway.app
- **Status:** Production Ready

---

**Om Namah Shivay! 🙏**
