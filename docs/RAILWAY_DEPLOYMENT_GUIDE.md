# Sally TSM: Railway Deployment Guide

## Overview
Deploy Sally TSM backend + PostgreSQL on Railway (not CosmosDB - Railway uses PostgreSQL)

---

## Prerequisites

- Railway account (https://railway.app/)
- GitHub repository (or Railway CLI)
- Environment variables ready

---

## Step 1: Create New Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

---

## Step 2: Add PostgreSQL Database

**Via Railway Dashboard:**
1. Go to your project
2. Click "New" → "Database" → "PostgreSQL"
3. Railway automatically provisions PostgreSQL instance
4. Database URL is available as `DATABASE_URL` environment variable

**Connection String Format:**
```
postgresql://user:password@host:port/database
```

**Note:** Railway does **NOT** support CosmosDB. Use PostgreSQL instead.

---

## Step 3: Configure Environment Variables

**In Railway Dashboard → Variables:**

```bash
# Database
DATABASE_TYPE=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-populated by Railway
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_DB=${{Postgres.PGDATABASE}}

# LLM Providers
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=your-google-api-key

# ChromaDB
CHROMA_PERSIST_DIR=/app/chroma_db

# App Configuration
ENVIRONMENT=production
PORT=8000
LOG_LEVEL=INFO

# CORS (for Vercel frontend)
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://sally-tsm.vercel.app
```

---

## Step 4: Create railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn backend.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Step 5: Create nixpacks.toml (Optional)

For better build optimization:

```toml
[phases.setup]
nixPkgs = ["python310", "postgresql"]

[phases.install]
cmds = [
  "pip install --upgrade pip",
  "pip install -r requirements.txt"
]

[phases.build]
cmds = ["python -c 'print(\"Build complete\")'"]

[start]
cmd = "uvicorn backend.main:app --host 0.0.0.0 --port $PORT --workers 4"
```

---

## Step 6: Deploy Database Schema

**After first deployment, run migrations:**

```bash
# Using Railway CLI
railway run python backend/database/migrations/deploy.py

# Or connect directly
railway connect Postgres
```

**Then run SQL migrations:**

```sql
\i backend/database/migrations/001_create_core_tables.sql
\i backend/database/migrations/002_create_transactional_tables.sql
\i backend/database/migrations/003_create_ai_analytics_tables.sql
\i backend/database/migrations/004_create_integration_tables.sql
```

---

## Step 7: Deploy Backend

**Option A: GitHub Integration (Recommended)**

1. Push code to GitHub
2. In Railway → Connect GitHub repo
3. Select branch (main/master)
4. Railway auto-deploys on push

**Option B: Railway CLI**

```bash
# Deploy current directory
railway up

# Or deploy specific service
railway up --service backend
```

---

## Step 8: Verify Deployment

```bash
# Check logs
railway logs

# Get deployment URL
railway domain

# Test health endpoint
curl https://your-railway-app.railway.app/health
curl https://your-railway-app.railway.app/api/v1/qa/health
```

---

## Step 9: Configure Custom Domain (Optional)

1. Railway Dashboard → Settings → Domains
2. Add custom domain: `api.sally-tsm.com`
3. Update DNS records:
   ```
   CNAME api -> your-railway-app.railway.app
   ```

---

## Database Management

### Access Database

```bash
# Via Railway CLI
railway connect Postgres

# Or get connection string
railway variables --service Postgres
```

### Backup Database

```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import backup
railway run psql $DATABASE_URL < backup.sql
```

### Monitor Database

Railway Dashboard shows:
- CPU usage
- Memory usage
- Storage usage
- Connection count

---

## Scaling Configuration

**Railway auto-scales based on:**
- Memory: Up to 8GB
- CPU: Up to 8 vCPUs
- Storage: PostgreSQL up to 100GB

**Pricing:** $5/month for 500 hours, then $0.01/hour

---

## Production Checklist

- [ ] PostgreSQL database provisioned
- [ ] All environment variables set
- [ ] Database migrations executed
- [ ] LLM API keys configured
- [ ] CORS origins include Vercel frontend
- [ ] Health endpoints responding
- [ ] Logs monitored for errors
- [ ] Database backups scheduled
- [ ] Custom domain configured (optional)
- [ ] Rate limiting enabled
- [ ] Security headers configured

---

## Troubleshooting

### Issue: Database connection failed

**Solution:**
```bash
# Check DATABASE_URL
railway variables | grep DATABASE

# Test connection
railway run python -c "import asyncpg; asyncpg.connect('$DATABASE_URL')"
```

### Issue: Module not found

**Solution:**
```bash
# Rebuild with dependencies
railway up --force
```

### Issue: ChromaDB persistence

**Solution:** Railway provides ephemeral storage. For persistent ChromaDB:
1. Use Railway Volumes (experimental)
2. Or use external vector DB (Pinecone, Weaviate)

---

## Monitoring & Logging

**View Logs:**
```bash
railway logs --tail 100
```

**Set up Alerts:**
1. Railway Dashboard → Settings → Notifications
2. Configure Slack/Discord/Email alerts
3. Set thresholds for CPU/Memory

---

## Cost Optimization

1. **Database:** Use PostgreSQL shared instance ($5/month)
2. **Backend:** Optimize worker count
3. **Monitoring:** Use Railway's free metrics
4. **Storage:** Clean up old ChromaDB embeddings

---

## Next Steps

After Railway deployment:
1. Get backend URL: `https://your-railway-app.railway.app`
2. Update Vercel environment variables
3. Test API endpoints
4. Monitor logs for errors
5. Set up CI/CD with GitHub Actions

---

## References

- Railway Documentation: https://docs.railway.app/
- PostgreSQL on Railway: https://docs.railway.app/databases/postgresql
- Deployment Best Practices: https://docs.railway.app/deploy/deployments
