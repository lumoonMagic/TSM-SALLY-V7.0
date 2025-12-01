# Deploy Sally TSM Agent Without GitHub

> **Quick Guide**: Deploy to cloud platforms without using GitHub  
> **Last Updated**: November 25, 2025

---

## 🎯 Fastest Options (No GitHub, No CLI)

### Option 1: Netlify Drag-and-Drop ⚡ EASIEST (30 seconds)

**Steps**:
```bash
# 1. Build project locally
cd sally-integration
npm install
npm run build
```

**Then**:
1. Visit [netlify.com](https://netlify.com)
2. Sign up (free)
3. **Drag and drop the `dist` folder** onto the dashboard
4. Done! ✅

**Result**: Live at `https://random-name.netlify.app`

**Demo Features Available**:
- ✅ Morning Brief dashboard
- ✅ Q&A Assistant
- ✅ End of Day Summary
- ✅ All UI components
- ✅ IndexedDB data storage

---

### Option 2: Surge.sh ⚡ SUPER SIMPLE (1 minute)

```bash
# 1. Install Surge globally
npm install -g surge

# 2. Build project
cd sally-integration
npm install
npm run build

# 3. Deploy
cd dist
surge

# Login when prompted (creates account)
# Your site: https://your-subdomain.surge.sh
```

**Result**: Instant deployment, custom subdomain

---

## 🚀 CLI Options (No GitHub Required)

### Option 3: Vercel CLI (5 minutes)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login
# Opens browser to login/signup

# 3. Deploy from project folder
cd sally-integration
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Project name? sally-tsm-agent
# - Continue? Yes

# 4. Deploy to production
vercel --prod
```

**Features**:
- ✅ HTTPS automatically
- ✅ Global CDN
- ✅ Custom domains
- ✅ Environment variables

**Result**: `https://sally-tsm-agent.vercel.app`

---

### Option 4: Netlify CLI (5 minutes)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build project
cd sally-integration
npm install
npm run build

# 3. Login
netlify login

# 4. Deploy
netlify deploy

# Note the draft URL, test it

# 5. Deploy to production
netlify deploy --prod
```

**Result**: `https://random-name.netlify.app`

---

### Option 5: Railway CLI - Full Stack (15 minutes)

**For complete app with backend + database**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# Or on Mac:
brew install railway

# 2. Login
railway login

# 3. Create new project
cd sally-integration
railway init

# 4. Deploy
railway up

# 5. Add PostgreSQL database (optional)
railway add postgresql

# 6. Set environment variables
railway variables set GEMINI_API_KEY=your_key_here

# 7. Get your app URL
railway domain
```

**Result**: Full-stack app at `https://your-app.railway.app`

**Includes**:
- ✅ Backend API
- ✅ PostgreSQL database
- ✅ Environment variables
- ✅ Auto-scaling

---

## 🐳 Docker Deployment (Any Platform)

### Build Docker Image

```bash
cd sally-integration

# Create Dockerfile (already included)
# Build image
docker build -t sally-tsm-agent .

# Test locally
docker run -p 8000:8000 sally-tsm-agent

# Open http://localhost:8000
```

### Deploy to Any Cloud

**Google Cloud Run**:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/sally-tsm-agent
gcloud run deploy --image gcr.io/PROJECT_ID/sally-tsm-agent
```

**AWS ECS, Azure Container Instances**: Similar Docker push process

---

## 📊 Comparison

| Method | Time | Cost | Backend | Database | Difficulty |
|--------|------|------|---------|----------|------------|
| Netlify Drag-Drop | 30s | FREE | ❌ | ❌ | ⭐ Easiest |
| Surge.sh | 1m | FREE | ❌ | ❌ | ⭐ Easy |
| Vercel CLI | 5m | FREE | ❌ | ❌ | ⭐⭐ Easy |
| Netlify CLI | 5m | FREE | ❌ | ❌ | ⭐⭐ Easy |
| Railway CLI | 15m | $5/mo | ✅ | ✅ | ⭐⭐⭐ Medium |
| Docker + GCP | 30m | Pay/use | ✅ | ✅ | ⭐⭐⭐⭐ Advanced |

---

## 🎯 My Recommendation

### For Quick Demo (Just Frontend)
**Use Netlify Drag-and-Drop**:
1. `npm run build`
2. Drag `dist` folder to netlify.com
3. Share URL with team ✅

### For Professional Deployment
**Use Vercel CLI**:
```bash
npm install -g vercel
cd sally-integration
vercel --prod
```
No GitHub needed! ✅

### For Full Application (Backend + DB)
**Use Railway CLI**:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway add postgresql
```
Complete app with database! ✅

---

## ⚙️ Environment Variables (Production Mode)

If deploying backend, set these variables:

**Vercel**:
```bash
vercel env add GEMINI_API_KEY
```

**Netlify**:
```bash
netlify env:set GEMINI_API_KEY your_key_here
```

**Railway**:
```bash
railway variables set GEMINI_API_KEY=your_key_here
railway variables set DATABASE_TYPE=postgres
```

**Surge** (frontend only - no env vars needed)

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Timeout
```bash
# Increase timeout for Vercel
vercel --prod --timeout 300s
```

### CLI Not Found
```bash
# Install globally with sudo (Mac/Linux)
sudo npm install -g vercel

# Or use npx (no install needed)
npx vercel --prod
```

---

## ✅ Validation Checklist

After deployment, verify:

- [ ] Site loads without errors
- [ ] Morning Brief displays data
- [ ] Q&A Assistant accepts input
- [ ] Charts render correctly
- [ ] Mobile view works
- [ ] HTTPS enabled
- [ ] Custom domain (optional)

---

## 🎉 You're Live!

Choose your platform, follow the steps, and your Sally TSM Agent will be deployed without needing GitHub!

**Fastest Path**: Build → Drag to Netlify → Done in 30 seconds! 🚀
