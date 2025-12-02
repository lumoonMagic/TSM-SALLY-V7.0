"""
Sally TSM Backend - Main Application Entry Point
FastAPI backend for Sally Trial Supply Management Agent
Supports: Multi-LLM providers, RAG, Vector DB, PostgreSQL

UPDATED: Phase 1A - Schema Management Router Added
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

# Import routers - KEEP EXISTING PATTERN
try:
    from backend.routers import (
        qa_rag_pure, 
        morning_brief, 
        scenarios, 
        settings, 
        evening_summary,
        schema_management  # Phase 1A - NEW
    )
    
    # Include routers - KEEP EXISTING PATTERN (with prefix and tags)
    app.include_router(qa_rag_pure.router, prefix="/api/v1/qa-pure", tags=["Q&A with RAG"])
    app.include_router(morning_brief.router, prefix="/api/v1/morning-brief", tags=["Morning Brief"])
    app.include_router(evening_summary.router, prefix="/api/v1", tags=["Evening Summary"])
    app.include_router(scenarios.router, prefix="/api/v1/scenarios", tags=["Clinical Scenarios"])
    app.include_router(settings.router, prefix="/api/v1/settings", tags=["Settings"])
    app.include_router(schema_management.router, prefix="/api/v1/schema", tags=["Schema Management"])  # Phase 1A - NEW
    
    logger.info("✅ All routers loaded successfully")
except Exception as e:
    logger.error(f"⚠️ Error loading routers: {e}")

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
        "endpoints": {
            "health": "/api/v1/health",
            "docs": "/docs",
            "redoc": "/redoc",
            "qa": "/api/v1/qa-pure",
            "morning_brief": "/api/v1/morning-brief",
            "evening_summary": "/api/v1/evening-summary",
            "scenarios": "/api/v1/scenarios",
            "settings": "/api/v1/settings",
            "schema": "/api/v1/schema"  # Phase 1A - NEW
        },
        "features": [
            "Multi-LLM Support (Gemini, OpenAI, Claude)",
            "Zero Cross-Dependencies",
            "Vector DB Selection (4 options)",
            "Application Mode (Demo/Production)",
            "Configuration Override System",
            "Database Schema Management"  # Phase 1A - NEW
        ]
    }

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    app_mode = os.getenv("APPLICATION_MODE", "demo")
    
    return {
        "status": "healthy",
        "version": "7.0",
        "application_mode": app_mode,
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
        "release_date": "2025-11-28",
        "features": [
            "Application Mode (Demo/Production)",
            "Vector DB Selection (4 options)",
            "Configuration Override System",
            "Backend API Configuration",
            "Enhanced UI Configuration Cockpit",
            "Database Schema Management (Phase 1A)"  # NEW
        ]
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
    logger.info("Sally TSM Backend Starting...")
    logger.info("=" * 80)
    
    # Check application mode
    app_mode = os.getenv("APPLICATION_MODE", "demo")
    logger.info(f"Application Mode: {app_mode.upper()}")
    
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
    logger.info("✅ Sally TSM Backend Ready!")
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
