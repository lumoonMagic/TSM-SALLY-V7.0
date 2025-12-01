# Sally TSM: Vercel Deployment Guide

## Overview
Deploy Sally TSM frontend (React + Vite) on Vercel

---

## Prerequisites

- Vercel account (https://vercel.com/)
- GitHub repository
- Railway backend deployed and URL available

---

## Step 1: Prepare Frontend for Deployment

### Update Environment Configuration

Create `.env.production`:

```bash
# Backend API URL (from Railway)
VITE_API_URL=https://your-railway-app.railway.app

# LLM Configuration (optional - backend handles this)
VITE_DEFAULT_LLM_PROVIDER=openai

# Feature Flags
VITE_ENABLE_RAG=true
VITE_ENABLE_SCENARIOS=true
VITE_ENABLE_MORNING_BRIEF=true
VITE_ENABLE_EVENING_SUMMARY=true

# Analytics (optional)
VITE_GA_ID=your-google-analytics-id
```

### Update vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Step 2: Create vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-railway-app.railway.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (or wherever package.json is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add Environment Variables (see Step 4)
5. Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

---

## Step 4: Configure Environment Variables

**In Vercel Dashboard → Settings → Environment Variables:**

```bash
# Backend API
VITE_API_URL=https://your-railway-app.railway.app

# Feature Flags
VITE_ENABLE_RAG=true
VITE_ENABLE_SCENARIOS=true
VITE_ENABLE_MORNING_BRIEF=true
VITE_ENABLE_EVENING_SUMMARY=true

# Optional: Analytics
VITE_GA_ID=G-XXXXXXXXXX

# Optional: Sentry Error Tracking
VITE_SENTRY_DSN=https://your-sentry-dsn
```

**Important:** Set these for all environments (Production, Preview, Development)

---

## Step 5: Update CORS in Railway Backend

In Railway environment variables, add your Vercel URL:

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://sally-tsm.vercel.app
```

**Backend CORS Configuration (main.py):**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Step 6: Configure Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add domain: `sally-tsm.com`
3. Update DNS:
   ```
   A     @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```
4. SSL certificate auto-generated

---

## Step 7: Verify Deployment

```bash
# Get deployment URL
vercel ls

# Test frontend
curl https://your-vercel-app.vercel.app

# Test API proxy
curl https://your-vercel-app.vercel.app/api/health
```

**Manual Testing:**
1. Open https://your-vercel-app.vercel.app
2. Test On-Demand Q&A
3. Test Morning Brief generation
4. Test Evening Summary
5. Check browser console for errors

---

## Step 8: Performance Optimization

### Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

**Update src/main.tsx:**
```typescript
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

### Enable Vercel Speed Insights

```bash
npm install @vercel/speed-insights
```

```typescript
import { SpeedInsights } from '@vercel/speed-insights/react';

// Add to App.tsx
<SpeedInsights />
```

---

## Step 9: Configure Build Settings

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

**Vercel Build Settings:**
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node Version: `18.x`

---

## Production Checklist

- [ ] Backend API URL configured
- [ ] Environment variables set
- [ ] CORS configured in backend
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Error tracking enabled (Sentry)
- [ ] Build succeeds without errors
- [ ] All features working (Q&A, Morning Brief, Scenarios)
- [ ] Mobile responsive tested
- [ ] Performance score > 90 (Lighthouse)
- [ ] Security headers configured

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring & Analytics

### Vercel Dashboard Metrics

- **Deployment Frequency:** Track via Dashboard
- **Build Time:** Optimize if > 2 minutes
- **Bundle Size:** Keep < 1MB
- **Core Web Vitals:**
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### Error Tracking with Sentry

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

---

## Troubleshooting

### Issue: API calls failing

**Solution:**
1. Check `VITE_API_URL` in Vercel env vars
2. Verify CORS in Railway backend
3. Check browser console for errors

### Issue: Build fails

**Solution:**
```bash
# Clear cache
vercel --force

# Check build logs
vercel logs your-deployment-url
```

### Issue: Slow load times

**Solution:**
1. Enable code splitting in vite.config.ts
2. Lazy load routes
3. Optimize images (use WebP)
4. Enable compression

---

## Cost Optimization

**Vercel Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Generous build minutes

**Pro Plan ($20/month):**
- 1TB bandwidth
- Advanced analytics
- Password protection
- 50 GB-hours compute

---

## Next Steps

After Vercel deployment:
1. Share public URL with stakeholders
2. Monitor Analytics dashboard
3. Set up error alerts
4. Configure staging environment
5. Enable preview deployments for PRs

---

## References

- Vercel Documentation: https://vercel.com/docs
- Vite Guide: https://vitejs.dev/guide/
- React Deployment: https://react.dev/learn/deployment
