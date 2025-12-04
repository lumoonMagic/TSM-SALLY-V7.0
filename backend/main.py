"""
Sally TSM Backend - Main Application Entry Point
FastAPI backend for Sally Trial Supply Management Agent
Supports: Multi-LLM providers, RAG, Vector DB, PostgreSQL

Phase 1A + 1B + 1C: Complete Implementation
Database Foundation + LLM Integration + Analytical Algorithms

✅ FIXED: Router import error handling + Evening Summary endpoint
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sally TSM Backend",
    description="AI-powered Trial Supply Management Backend with Multi-LLM support",
    version="7.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers with individual error handling
# This prevents one broken router from breaking the entire API

# Track loaded routers
loaded_routers = []
failed_routers = []

# Helper function to safely import and include routers
def safe_include_router(router_name, module_path, prefix, tags):
    """Safely import and include a router with error handling"""
    try:
        # Dynamic import
        parts = module_path.rsplit('.', 1)
        if len(parts) == 2:
            module = __import__(parts[0], fromlist=[parts[1]])
            router = getattr(module, parts[1])
        else:
            module = __import__(module_path)
            router = getattr(module, 'router')
        
        app.include_router(router, prefix=prefix, tags=tags)
        loaded_routers.append({
            "name": router_name,
            "prefix": prefix,
            "status": "loaded"
        })
        logger.info(f"✅ {router_name} router loaded at {prefix}")
        return True
    except Exception as e:
        failed_routers.append({
            "name": router_name,
            "prefix": prefix,
            "error": str(e)
        })
        logger.warning(f"⚠️ Failed to load {router_name}: {e}")
        return False

# Load routers one by one with error handling
logger.info("Loading routers...")

# Q&A with RAG
safe_include_router(
    "Q&A with RAG",
    "backend.routers.qa_rag_pure.router",
    "/api/v1/qa-pure",
    ["Q&A with RAG"]
)

# Morning Brief
safe_include_router(
    "Morning Brief",
    "backend.routers.morning_brief.router",
    "/api/v1/morning-brief",
    ["Morning Brief"]
)

# Evening Summary - FIXED to match frontend
safe_include_router(
    "Evening Summary",
    "backend.routers.evening_summary.router",
    "/api/v1/evening-summary",  # Keep original endpoint - frontend will be fixed
    ["Evening Summary"]
)

# Clinical Scenarios
safe_include_router(
    "Scenarios",
    "backend.routers.scenarios.router",
    "/api/v1/scenarios",
    ["Clinical Scenarios"]
)

# Settings
safe_include_router(
    "Settings",
    "backend.routers.settings.router",
    "/api/v1/settings",
    ["Settings"]
)

# Schema Management (Phase 1A)
safe_include_router(
    "Schema Management",
    "backend.routers.schema_management.router",
    "/api/v1/schema",
    ["Schema Management"]
)

# Q&A On-Demand (Phase 1B)
safe_include_router(
    "Q&A On-Demand",
    "backend.routers.qa_ondemand.router",
    "/api/v1/qa",
    ["Q&A On-Demand"]
)

# Analytics (Phase 1C)
safe_include_router(
    "Analytics",
    "backend.routers.analytics.router",
    "/api/v1/analytics",
    ["Analytics"]
)

# Reports (Phase 1D)
safe_include_router(
    "Reports",
    "backend.routers.reports.router",
    "/api/v1/reports",
    ["Reports"]
)

logger.info(f"✅ Loaded {len(loaded_routers)} routers successfully")
if failed_routers:
    logger.warning(f"⚠️ Failed to load {len(failed_routers)} routers")

# ============================================================================
# Root Endpoints
# ============================================================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check"""
    return {
        "name": "Sally TSM Backend",
        "version": "7.0",
        "status": "running",
        "phase": "1A + 1B + 1C - Complete Backend Implementation",
        "loaded_routers": loaded_routers,
        "failed_routers": failed_routers,
        "endpoints": {
            "health": "/api/v1/health",
            "docs": "/docs",
            "redoc": "/redoc",
            "schema": "/api/v1/schema",
            "qa_ondemand": "/api/v1/qa",
            "analytics": "/api/v1/analytics",
            "reports": "/api/v1/reports",
            "qa": "/api/v1/qa-pure",
            "morning_brief": "/api/v1/morning-brief",
            "evening_summary": "/api/v1/evening-summary",
            "scenarios": "/api/v1/scenarios",
            "settings": "/api/v1/settings"
        },
        "features": [
            "Multi-LLM Support (Gemini, OpenAI, Claude)",
            "Zero Cross-Dependencies",
            "Vector DB Selection (4 options)",
            "Application Mode (Demo/Production)",
            "Configuration Override System",
            "Database Schema Management (Phase 1A)",
            "On-Demand Q&A with RAG (Phase 1B)",
            "Analytical Algorithms (Phase 1C)"
        ]
    }

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    app_mode = os.getenv("APPLICATION_MODE", "demo")
    
    return {
        "status": "healthy",
        "version": "7.0",
        "phase": "1A + 1B + 1C",
        "application_mode": app_mode,
        "routers": {
            "loaded": len(loaded_routers),
            "failed": len(failed_routers),
            "details": loaded_routers
        },
        "database": {
            "configured": bool(os.getenv("DATABASE_URL")),
            "type": os.getenv("DATABASE_TYPE", "postgres")
        },
        "llm": {
            "configured_providers": [
                p for p in ["gemini", "openai", "anthropic"]
                if os.getenv(f"{'GOOGLE' if p == 'gemini' else p.upper()}_API_KEY")
            ],
            "default_provider": os.getenv("DEFAULT_LLM_PROVIDER", "gemini")
        },
        "vector_db": {
            "type": os.getenv("VECTOR_DB_TYPE", "postgres_pgvector"),
            "configured": True
        }
    }

@app.get("/api/v1/version", tags=["Health"])
async def version():
    """Get API version"""
    return {
        "version": "7.0",
        "phase": "1A + 1B + 1C",
        "release_date": "2025-12-02",
        "routers_loaded": len(loaded_routers),
        "features": [
            "Application Mode (Demo/Production)",
            "Vector DB Selection (4 options)",
            "Configuration Override System",
            "Backend API Configuration",
            "Enhanced UI Configuration Cockpit",
            "Database Schema Management (Phase 1A)",
            "On-Demand Q&A with RAG (Phase 1B)",
            "Analytical Algorithms (Phase 1C)"
        ]
    }

@app.get("/api/v1/router-status", tags=["Health"])
async def router_status():
    """Check which routers are loaded"""
    return {
        "total_routers": len(loaded_routers) + len(failed_routers),
        "loaded": {
            "count": len(loaded_routers),
            "routers": loaded_routers
        },
        "failed": {
            "count": len(failed_routers),
            "routers": failed_routers
        }
    }

# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc)
        }
    )

# ============================================================================
# Startup Event
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("=" * 80)
    logger.info("Sally TSM Backend Starting... (Phase 1A + 1B + 1C)")
    logger.info("=" * 80)
    
    # Check application mode
    app_mode = os.getenv("APPLICATION_MODE", "demo")
    logger.info(f"Application Mode: {app_mode.upper()}")
    
    # Log router status
    logger.info(f"✅ Loaded {len(loaded_routers)} routers")
    if failed_routers:
        logger.warning(f"⚠️ Failed to load {len(failed_routers)} routers:")
        for router in failed_routers:
            logger.warning(f"   - {router['name']}: {router['error']}")
    
    # Check LLM providers
    providers = []
    if os.getenv("GOOGLE_API_KEY"):
        providers.append("Gemini")
    if os.getenv("OPENAI_API_KEY"):
        providers.append("OpenAI")
    if os.getenv("ANTHROPIC_API_KEY"):
        providers.append("Claude")
    
    if providers:
        logger.info(f"✓ LLM Providers configured: {', '.join(providers)}")
    else:
        logger.warning("⚠ No LLM providers configured (Demo mode)")
    
    # Check database
    if os.getenv("DATABASE_URL"):
        logger.info("✓ Database URL configured")
    else:
        logger.warning("⚠ No database configured (Demo mode)")
    
    # Check vector DB
    vector_db_type = os.getenv("VECTOR_DB_TYPE", "postgres_pgvector")
    logger.info(f"✓ Vector DB type: {vector_db_type}")
    
    logger.info("=" * 80)
    logger.info("✅ Sally TSM Backend Ready! (Phase 1A + 1B + 1C)")
    logger.info("=" * 80)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Sally TSM Backend shutting down...")

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "production") == "development",
        log_level="info"
    )
