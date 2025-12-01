# Sally TSM: Quick Start Deployment Guide

**Ready to deploy in 3 steps!**

---

## Step 1: Deploy Backend to Railway (15 minutes)

### 1.1 Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
```

### 1.2 Add PostgreSQL Database
- Dashboard → New → Database → PostgreSQL
- Railway auto-configures `DATABASE_URL`

**Note:** Railway uses **PostgreSQL**, not CosmosDB

### 1.3 Set Environment Variables
```bash
# In Railway Dashboard → Variables
DATABASE_TYPE=postgres
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key  # Optional
GOOGLE_API_KEY=your-google-key     # Optional
CHROMA_PERSIST_DIR=/app/chroma_db
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 1.4 Deploy
```bash
railway up
```

### 1.5 Run Migrations
```bash
railway run python backend/database/migrations/deploy.py
```

**Backend URL:** `https://your-railway-app.railway.app`

---

## Step 2: Deploy Frontend to Vercel (10 minutes)

### 2.1 Import Repository
- Go to https://vercel.com/new
- Import your GitHub repository
- Framework: Vite
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

### 2.2 Set Environment Variables
```bash
VITE_API_URL=https://your-railway-app.railway.app
VITE_ENABLE_RAG=true
VITE_ENABLE_SCENARIOS=true
VITE_ENABLE_MORNING_BRIEF=true
VITE_ENABLE_EVENING_SUMMARY=true
```

### 2.3 Deploy
- Click "Deploy"
- Wait 2-3 minutes

**Frontend URL:** `https://your-vercel-app.vercel.app`

---

## Step 3: Test Everything (5 minutes)

### 3.1 Test Backend Health
```bash
curl https://your-railway-app.railway.app/health
curl https://your-railway-app.railway.app/api/v1/qa/health
```

### 3.2 Test Frontend
1. Open `https://your-vercel-app.vercel.app`
2. Click "On-Demand Q&A"
3. Ask: "What is the temperature excursion protocol?"
4. Check Morning Brief
5. Check Evening Summary
6. Test Clinical Scenarios

### 3.3 Ingest Knowledge Base (Optional)
```bash
curl -X POST https://your-railway-app.railway.app/api/v1/qa/ingest-documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Temperature excursions require immediate notification within 2 hours...",
        "source": "SOP-QA-008",
        "metadata": {"version": "1.0"}
      }
    ]
  }'
```

---

## Troubleshooting

### Backend not responding
```bash
# Check Railway logs
railway logs --tail 100

# Verify environment variables
railway variables
```

### Frontend 404 errors
- Check `VITE_API_URL` in Vercel settings
- Verify CORS in Railway backend (`ALLOWED_ORIGINS`)

### Database connection failed
```bash
# Test database connection
railway run python -c "import asyncpg; print('DB OK')"
```

---

## Cost Estimate

- **Railway:** $5-20/month (backend + PostgreSQL)
- **Vercel:** Free tier or $20/month (Pro)
- **OpenAI API:** ~$10-50/month (depending on usage)
- **Total:** ~$15-90/month

---

## Next Steps

1. ✅ Backend deployed on Railway
2. ✅ Frontend deployed on Vercel
3. ✅ Tests passing
4. [ ] Ingest knowledge base documents
5. [ ] Configure custom domain
6. [ ] Set up monitoring alerts
7. [ ] Train users

---

## Support

- **Railway Guide:** See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Vercel Guide:** See `VERCEL_DEPLOYMENT_GUIDE.md`
- **Complete Summary:** See `COMPLETE_IMPLEMENTATION_SUMMARY.md`
- **Testing:** See `TESTING_AND_DEMO_GUIDE.md`

---

**Om Namah Shivay**  
**Deployment Time:** ~30 minutes  
**Status:** Production Ready ✅
