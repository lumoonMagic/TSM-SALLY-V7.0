# Sally TSM: Quick Reference Guide
## Common Tasks & Code Snippets

**Version:** 2.0.0  
**Last Updated:** 2024-11-27

---

## 🔧 Common Development Tasks

### Fix Database Connection (Issue #1)

**Files to modify:**
```
src/config/api.ts          ← CREATE
src/pages/DatabaseConfig.tsx  ← UPDATE
backend/main.py            ← UPDATE
.env                       ← UPDATE
```

**Quick code snippet:**
```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
}
```

**Time:** 4 hours

---

### Enable Theme System (Issue #2)

**Files to modify:**
```
src/components/ThemeProvider.tsx  ← CREATE
src/main.tsx                      ← UPDATE
src/styles/globals.css            ← UPDATE
```

**Quick code snippet:**
```typescript
// Wrap app with ThemeProvider
<ThemeProvider>
  <App />
</ThemeProvider>
```

**Time:** 6 hours

---

### Deploy Database Schema

**Command:**
```bash
# Connect to PostgreSQL
psql -h your-host -U your-user -d your-database

# Run DDL
\i public/schema/default_postgresql.sql

# Load seed data
\i public/schema/seed_data.sql
```

**Files needed:**
- `public/schema/default_postgresql.sql`
- `public/schema/seed_data.sql`

**Time:** 2 hours

---

### Implement RAG Q&A

**Backend dependencies:**
```bash
pip install langchain==0.1.0 \
            langchain-openai==0.0.2 \
            chromadb==0.4.18 \
            sentence-transformers==2.2.2
```

**Files to create:**
```
backend/services/vector_store.py
backend/services/rag_agent.py
```

**Code location:** MASTER_APPLICATION_BLUEPRINT.md → Feature 2

**Time:** 30 hours

---

### Deploy to Vercel (Frontend)

**Commands:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add VITE_API_URL
```

**Time:** 2 hours

---

### Deploy to Railway (Backend)

**Steps:**
1. Create Railway account
2. New Project → Deploy from GitHub
3. Add PostgreSQL service
4. Add Redis service (for Celery)
5. Set environment variables
6. Deploy!

**Environment variables:**
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...
```

**Time:** 3 hours

---

## 📊 Database Queries

### Get Sites Needing Attention

```sql
SELECT 
    site_id,
    site_name,
    (
        CASE WHEN quantity_available < reorder_point THEN 30 ELSE 0 END +
        CASE WHEN days_until_expiry < 30 THEN 20 ELSE 0 END
    ) as attention_score
FROM sites
JOIN inventory USING (site_id)
WHERE attention_score > 0
ORDER BY attention_score DESC;
```

---

### Get Critical Alerts

```sql
SELECT *
FROM alerts
WHERE status = 'active'
  AND severity = 'critical'
ORDER BY created_at DESC;
```

---

### Get Delayed Shipments

```sql
SELECT *
FROM shipments
WHERE status = 'delayed'
  AND days_delayed > 5
ORDER BY priority DESC, days_delayed DESC;
```

---

## 🎨 UI Components

### Create Metric Card

```typescript
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  alert?: boolean
}

export function MetricCard({ title, value, icon, trend, alert }: MetricCardProps) {
  return (
    <div className={`
      bg-card border rounded-lg p-6
      ${alert ? 'border-destructive' : 'border-border'}
    `}>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {trend && (
        <div className="text-sm text-muted-foreground mt-1">{trend}</div>
      )}
    </div>
  )
}
```

---

### Create Alert Card

```typescript
interface AlertCardProps {
  alert: Alert
  onAcknowledge: (id: number) => void
}

export function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  return (
    <div className={`
      border-l-4 rounded p-4
      ${alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
        alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
        'border-yellow-500 bg-yellow-50'}
    `}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{alert.alert_title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {alert.alert_message}
          </p>
        </div>
        <button
          onClick={() => onAcknowledge(alert.alert_id)}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
        >
          Acknowledge
        </button>
      </div>
      {alert.recommended_action && (
        <div className="mt-3 p-2 bg-white rounded text-sm">
          <strong>Recommended Action:</strong> {alert.recommended_action}
        </div>
      )}
    </div>
  )
}
```

---

## 🤖 AI Prompts

### Generate Morning Brief

**LLM Prompt:**
```
You are an AI assistant for clinical trial supply chain managers.
Generate a concise morning brief for {date}.

Yesterday's Metrics:
{metrics}

Current Alerts:
{alerts}

Key Insights:
{insights}

Write a brief executive summary (3-4 sentences) highlighting:
1. Overall status (improving/declining/stable)
2. Most critical issue requiring immediate attention
3. Positive developments
4. Recommended priority action for today

Keep it professional, clear, and action-oriented.
```

---

### Generate SQL from Question

**LLM Prompt:**
```
You are an expert SQL query generator for clinical trial supply management systems.

User Question: {question}

Similar Past Queries:
{similar_queries}

Relevant Database Schema:
{relevant_schema}

Generate a safe, efficient SQL query to answer the user's question.

Requirements:
- Use only SELECT statements (no INSERT, UPDATE, DELETE)
- Join tables properly using foreign keys
- Include appropriate WHERE clauses
- Use aggregate functions where appropriate
- Format results with meaningful aliases
- Add LIMIT clause if query might return many rows

SQL Query:
```

---

## 🧪 Testing Commands

### Run Frontend Tests

```bash
npm test
npm run test:coverage
```

---

### Run Backend Tests

```bash
pytest
pytest --cov=backend tests/
```

---

### Test Database Connection

```bash
curl -X POST http://localhost:8000/api/v1/database/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "type": "postgresql",
    "host": "your-host",
    "port": 5432,
    "database": "your-db",
    "username": "your-user",
    "password": "your-password"
  }'
```

---

## 🔍 Debugging

### Frontend Debug

```typescript
// Enable React DevTools
// Check browser console for errors
console.log('API URL:', import.meta.env.VITE_API_URL)

// Check Axios requests
axios.interceptors.request.use(request => {
  console.log('Starting Request', request)
  return request
})

axios.interceptors.response.use(response => {
  console.log('Response:', response)
  return response
})
```

---

### Backend Debug

```python
# Enable FastAPI debug mode
import logging
logging.basicConfig(level=logging.DEBUG)

# Log SQL queries
from sqlalchemy import create_engine
engine = create_engine(DATABASE_URL, echo=True)  # echo=True logs SQL

# Test endpoint directly
curl http://localhost:8000/api/v1/database/status
```

---

## 📦 Dependency Updates

### Frontend

```bash
# Update all dependencies
npm update

# Update specific package
npm install react@latest

# Check outdated
npm outdated
```

---

### Backend

```bash
# Update all dependencies
pip install --upgrade -r requirements.txt

# Update specific package
pip install --upgrade langchain

# Check outdated
pip list --outdated
```

---

## 🚀 Production Checklist

### Before Deploying

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] API keys secured (not in code)
- [ ] Error logging enabled (Sentry)
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Rollback plan prepared

---

### After Deploying

- [ ] Health checks passing
- [ ] Database connection works
- [ ] AI features functional
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Team notified
- [ ] User guide published

---

## 📞 Quick Links

- **Main Blueprint:** MASTER_APPLICATION_BLUEPRINT.md
- **Database Schema:** DATABASE_SCHEMA_COMPLETE.md
- **Implementation Plan:** IMPLEMENTATION_ROADMAP.md
- **Start Guide:** 00_START_HERE.md

---

**END OF QUICK REFERENCE**
