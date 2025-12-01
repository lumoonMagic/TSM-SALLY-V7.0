# Sally TSM Agent - Cloud Deployment & Validation Guide

> **Purpose**: Validate and deploy Sally TSM Agent to cloud platforms for production testing
> **Last Updated**: November 25, 2025
> **Version**: 1.0.0

---

## 📋 Table of Contents

1. [Quick Cloud Validation Options](#quick-cloud-validation-options)
2. [Frontend Deployment (Recommended)](#frontend-deployment-recommended)
3. [Full-Stack Deployment](#full-stack-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Validation Checklist](#validation-checklist)
7. [Monitoring & Debugging](#monitoring--debugging)

---

## 🚀 Quick Cloud Validation Options

### Option 1: Vercel (EASIEST - Frontend Only)
**Best for**: Quick UI validation in demo mode  
**Time**: 5 minutes  
**Cost**: Free tier available  
**Features**: 
- ✅ Instant deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Demo mode works immediately (IndexedDB)

### Option 2: Railway (RECOMMENDED - Full Stack)
**Best for**: Complete application with backend + database  
**Time**: 15 minutes  
**Cost**: $5/month starter  
**Features**:
- ✅ Deploy frontend + backend together
- ✅ Managed PostgreSQL database included
- ✅ Environment variable management
- ✅ Auto-scaling
- ✅ Built-in monitoring

### Option 3: Render (Good Alternative)
**Best for**: Full-stack with separate services  
**Time**: 20 minutes  
**Cost**: Free tier available (slow startup)  
**Features**:
- ✅ Free PostgreSQL database
- ✅ Separate frontend/backend services
- ✅ Auto-deploy from Git

### Option 4: Google Cloud Run (Enterprise)
**Best for**: Production deployment with Oracle/enterprise DB  
**Time**: 30 minutes  
**Cost**: Pay-as-you-go  
**Features**:
- ✅ Containerized deployment
- ✅ Connect to any database (Oracle, MySQL, Postgres)
- ✅ Auto-scaling
- ✅ Enterprise-grade security

---

## 🎯 Frontend Deployment (Recommended)

### Deploy to Vercel (Fastest Validation)

#### Step 1: Prepare Project
```bash
# Navigate to project
cd sally-integration

# Ensure build works locally
npm install
npm run build

# Test build
npm run preview
```

#### Step 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? sally-tsm-agent
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Step 3: Deploy via Vercel Dashboard (Alternative)
1. Visit [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub (push your code to GitHub first)
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

**✅ Result**: Your frontend will be live at `https://sally-tsm-agent-xxx.vercel.app`

**Demo Mode Features Available**:
- ✅ Morning Brief dashboard
- ✅ Q&A Assistant (rule-based)
- ✅ End of Day Summary
- ✅ Email draft generation
- ✅ Data visualization
- ✅ All UI components

---

### Deploy to Netlify

#### Via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build project
npm run build

# Deploy
netlify deploy

# Follow prompts and note draft URL

# Deploy to production
netlify deploy --prod
```

#### Via Netlify Dashboard
1. Visit [netlify.com](https://netlify.com)
2. Drag and drop your `dist` folder
3. Or connect GitHub repository

**Configuration**:
- Build command: `npm run build`
- Publish directory: `dist`

---

## 🔧 Full-Stack Deployment

### Deploy to Railway (RECOMMENDED)

#### Step 1: Prepare Docker Configuration

Create `Dockerfile` in project root:
```dockerfile
# Frontend build stage
FROM node:18-alpine as frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend stage
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY sally-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY sally-backend/ ./sally-backend/

# Copy frontend build
COPY --from=frontend-build /app/dist ./static

# Expose port
EXPOSE 8000

# Start backend (serves frontend static files)
CMD ["python", "sally-backend/main.py"]
```

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Step 2: Deploy to Railway

1. **Via Railway Dashboard**:
   - Visit [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Railway auto-detects Dockerfile

2. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically creates DATABASE_URL

3. **Set Environment Variables**:
   ```bash
   # In Railway dashboard → Variables
   GEMINI_API_KEY=your_gemini_key_here
   DATABASE_TYPE=postgres
   # DATABASE_URL is auto-created by Railway
   PORT=8000
   ```

4. **Deploy**:
   - Railway automatically builds and deploys
   - Your app will be live at `https://sally-tsm-agent.railway.app`

#### Step 3: Verify Deployment
```bash
# Test API
curl https://your-app.railway.app/api/v1/health

# Test frontend
# Open browser to https://your-app.railway.app
```

---

### Deploy to Render

#### Step 1: Create `render.yaml`
```yaml
services:
  # Backend API
  - type: web
    name: sally-backend
    env: python
    region: oregon
    buildCommand: "cd sally-backend && pip install -r requirements.txt"
    startCommand: "cd sally-backend && python main.py"
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: sally-db
          property: connectionString
      - key: DATABASE_TYPE
        value: postgres
      - key: PORT
        value: 8000
    healthCheckPath: /api/v1/health

  # Frontend
  - type: web
    name: sally-frontend
    env: static
    region: oregon
    buildCommand: "npm ci && npm run build"
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  - name: sally-db
    databaseName: sally_tsm
    user: sally_user
    region: oregon
```

#### Step 2: Deploy via Render Dashboard
1. Visit [render.com](https://render.com)
2. Connect GitHub repository
3. Render auto-detects `render.yaml`
4. Click "Apply"
5. Set environment variables in dashboard

---

### Deploy to Google Cloud Run

#### Step 1: Prepare for Cloud Run

Create `cloudbuild.yaml`:
```yaml
steps:
  # Build frontend
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'build']
  
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/sally-tsm-agent', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sally-tsm-agent']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'sally-tsm-agent'
      - '--image=gcr.io/$PROJECT_ID/sally-tsm-agent'
      - '--platform=managed'
      - '--region=us-central1'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/sally-tsm-agent'
```

#### Step 2: Deploy
```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Submit build
gcloud builds submit --config cloudbuild.yaml

# Set environment variables
gcloud run services update sally-tsm-agent \
  --set-env-vars="GEMINI_API_KEY=your_key,DATABASE_TYPE=postgres,DATABASE_URL=your_db_url"
```

---

## 💾 Database Setup

### Option 1: Railway PostgreSQL (Easiest)
- ✅ **Automatic**: Added via Railway dashboard
- ✅ **Connection String**: Auto-injected as `DATABASE_URL`
- ✅ **Backup**: Automatic daily backups
- ✅ **Cost**: Free 512MB, $5/month for more

### Option 2: Render PostgreSQL (Free Tier)
- ✅ **Free 90 days**: Then requires upgrade
- ✅ **Auto-connection**: Via render.yaml
- ✅ **Region**: Choose closest to your users

### Option 3: Supabase (Managed Postgres)
1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string
4. Set as `DATABASE_URL` environment variable

**Connection String Format**:
```
postgresql://user:password@host:5432/database
```

### Option 4: Oracle Cloud (Enterprise)
For Oracle database integration:
1. Create Oracle Autonomous Database
2. Download wallet credentials
3. Set connection details in environment:
   ```bash
   DATABASE_TYPE=oracle
   ORACLE_USER=your_user
   ORACLE_PASSWORD=your_password
   ORACLE_DSN=your_connection_string
   ```

### Option 5: MongoDB Atlas (NoSQL)
1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Set environment:
   ```bash
   DATABASE_TYPE=mongodb
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sally_tsm
   ```

---

## ⚙️ Environment Configuration

### Required Environment Variables

#### Minimal (Demo Mode)
```bash
# No variables needed - uses IndexedDB
```

#### Production (With Backend)
```bash
# LLM Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_TYPE=postgres  # or mysql, oracle, mongodb, sqlite
DATABASE_URL=your_database_connection_string

# API Configuration (optional)
PORT=8000
API_BASE_URL=https://your-domain.com/api/v1
CORS_ORIGINS=https://your-frontend.vercel.app

# Security (production)
SECRET_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_here
```

### Setting Environment Variables

#### Vercel
```bash
# Via CLI
vercel env add GEMINI_API_KEY

# Or in dashboard: Settings → Environment Variables
```

#### Railway
- Dashboard → Variables → Add Variable

#### Render
- Dashboard → Environment → Add Environment Variable

#### Google Cloud Run
```bash
gcloud run services update sally-tsm-agent \
  --set-env-vars="KEY1=value1,KEY2=value2"
```

---

## ✅ Validation Checklist

### Frontend Validation (Demo Mode)

#### 1. UI Components
- [ ] Morning Brief loads and displays correctly
- [ ] Sidebar navigation works (mobile + desktop)
- [ ] Q&A Assistant interface renders
- [ ] End of Day Summary displays
- [ ] Email draft dialog opens and functions
- [ ] Theme (dark green) applies correctly
- [ ] Responsive design works on mobile

#### 2. Demo Functionality
- [ ] IndexedDB initializes with mock data
- [ ] Can query inventory data
- [ ] Can query shipment data
- [ ] Charts and visualizations render
- [ ] Email drafts generate
- [ ] Copy to clipboard works

#### 3. Performance
- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] Lighthouse score > 90

### Backend Validation (Production Mode)

#### 1. API Endpoints
```bash
# Health check
curl https://your-app.com/api/v1/health

# Database connection test
curl -X POST https://your-app.com/api/v1/database/test-connection \
  -H "Content-Type: application/json" \
  -d '{"database_type": "postgres", "host": "your-host"}'

# Q&A endpoint
curl -X POST https://your-app.com/api/v1/qa/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all inventory items"}'
```

#### 2. Database Connection
- [ ] Database connection succeeds
- [ ] Can query tables
- [ ] Can insert/update data
- [ ] Transactions work correctly

#### 3. AI Integration
- [ ] Gemini API connects successfully
- [ ] Natural language queries work
- [ ] SQL generation is accurate
- [ ] Response times acceptable (< 2s)

---

## 🔍 Monitoring & Debugging

### Frontend Monitoring

#### Vercel Analytics (Built-in)
- Visit: Vercel Dashboard → Analytics
- Monitors: Page views, performance, Web Vitals

#### Browser DevTools
```javascript
// Check IndexedDB
// Open DevTools → Application → IndexedDB → tsm_database

// Check for errors
console.log('Sally TSM Agent loaded');

// Performance
performance.now();
```

### Backend Monitoring

#### Railway Logs
```bash
# View logs in Railway dashboard
# Or via CLI
railway logs
```

#### Health Check Endpoint
```bash
# Add to main.py
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": await check_database_connection(),
        "gemini_api": check_gemini_connection()
    }
```

#### Error Tracking
Integrate Sentry for production:
```bash
pip install sentry-sdk

# In main.py
import sentry_sdk
sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0
)
```

---

## 🎯 Recommended Validation Path

### **Phase 1: Quick Frontend Validation (5 minutes)**
1. Deploy to Vercel (frontend only)
2. Test demo mode functionality
3. Verify UI components
4. Check mobile responsiveness

**Command**:
```bash
cd sally-integration
npm install
npm run build
vercel --prod
```

**Test URL**: `https://your-app.vercel.app`

### **Phase 2: Backend Integration (15 minutes)**
1. Deploy to Railway (frontend + backend)
2. Add PostgreSQL database
3. Set environment variables (Gemini API key)
4. Test API endpoints

**Expected Result**: Full application with real database

### **Phase 3: Production Database (Optional)**
1. Connect Oracle/MySQL/MongoDB if required
2. Load production data
3. Test with real queries
4. Performance optimization

---

## 🚨 Common Deployment Issues

### Issue 1: Build Fails
**Error**: `Module not found`
```bash
# Solution: Install dependencies
npm ci
npm run build
```

### Issue 2: Environment Variables Not Loading
**Error**: `GEMINI_API_KEY is not defined`
```bash
# Solution: Check environment variable format
# Railway/Render: Use dashboard
# Vercel: vercel env add GEMINI_API_KEY production
```

### Issue 3: Database Connection Fails
**Error**: `Connection refused`
```bash
# Solution: Verify DATABASE_URL format
# PostgreSQL: postgresql://user:pass@host:5432/db
# Check firewall/security group allows connections
```

### Issue 4: CORS Errors
**Error**: `Access-Control-Allow-Origin`
```python
# Solution: Update main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Cost Estimates

### Free Tier Deployment
- **Vercel**: Free (frontend demo mode)
- **Total**: $0/month

### Starter Deployment
- **Railway**: $5/month (frontend + backend + Postgres)
- **Total**: $5/month

### Production Deployment
- **Railway**: $20/month (scaled)
- **Supabase**: $25/month (database)
- **Total**: $45/month

### Enterprise Deployment
- **Google Cloud Run**: ~$50/month
- **Oracle Database**: ~$200/month
- **Total**: $250/month

---

## 🎉 Success Metrics

After deployment, you should see:

✅ **Frontend**:
- Application loads in < 3 seconds
- All UI components render correctly
- No console errors
- Mobile responsive

✅ **Backend**:
- API responds in < 500ms
- Database queries successful
- Gemini AI integration working
- No 500 errors

✅ **Demo Mode**:
- IndexedDB populated with mock data
- Q&A assistant responds to queries
- Visualizations render charts
- Email drafts generate

---

## 📞 Support Resources

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Render**: [render.com/docs](https://render.com/docs)
- **Google Cloud**: [cloud.google.com/run/docs](https://cloud.google.com/run/docs)

---

**Next Step**: Choose deployment option and follow the guide!

**Recommendation**: Start with **Vercel** for quick validation, then move to **Railway** for full-stack testing.
