"""
Enhanced Settings & Configuration Router
- Vector DB selection (PostgreSQL/Cosmos/Google Cloud)
- Backend API URL configuration
- Configuration override system (env vars vs UI)
- Demo Mode vs Production Mode
- Complete UI configuration cockpit
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List, Literal
import os
import logging
from datetime import datetime

# Database imports
import asyncpg
import sqlite3

# LLM validation
from backend.ai.pure_provider_manager import PureProviderManager, get_pure_provider

router = APIRouter(tags=["Enhanced Settings & Configuration"])
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class VectorDBConfig(BaseModel):
    """Vector database configuration"""
    vector_db_type: Literal["postgres_pgvector", "cosmos_db", "google_cloud_vertex", "chromadb"] = Field(
        default="postgres_pgvector",
        description="Vector database type"
    )
    
    # PostgreSQL pgvector (default)
    postgres_host: Optional[str] = None
    postgres_port: Optional[int] = 5432
    postgres_database: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    
    # Cosmos DB
    cosmos_endpoint: Optional[str] = None
    cosmos_key: Optional[str] = None
    cosmos_database_name: Optional[str] = None
    cosmos_container_name: Optional[str] = None
    
    # Google Cloud Vertex AI
    google_project_id: Optional[str] = None
    google_location: Optional[str] = "us-central1"
    vertex_index_id: Optional[str] = None
    vertex_endpoint_id: Optional[str] = None
    
    # ChromaDB (local)
    chroma_persist_directory: Optional[str] = "./chroma_db"

class LLMProviderConfig(BaseModel):
    """LLM provider configuration"""
    provider: Literal["gemini", "openai", "claude"] = Field(default="gemini")
    api_key: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)

class DatabaseConfig(BaseModel):
    """Operational database configuration"""
    database_type: Literal["postgres", "sqlite"] = Field(default="postgres")
    host: Optional[str] = None
    port: Optional[int] = 5432
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    connection_string: Optional[str] = None

class BackendAPIConfig(BaseModel):
    """Backend API configuration"""
    api_url: str = Field(..., description="Backend API URL")
    api_timeout: int = Field(default=30, description="API timeout in seconds")
    enable_cors: bool = Field(default=True)
    allowed_origins: List[str] = Field(default=["*"])

class ConfigurationOverride(BaseModel):
    """Configuration override settings"""
    use_env_vars: bool = Field(
        default=False, 
        description="If true, use environment variables. If false, use UI settings"
    )
    override_llm: bool = Field(default=False, description="Override LLM config from UI")
    override_database: bool = Field(default=False, description="Override database config from UI")
    override_vector_db: bool = Field(default=False, description="Override vector DB config from UI")

class ApplicationMode(BaseModel):
    """Application mode configuration"""
    mode: Literal["demo", "production"] = Field(default="demo")
    demo_data_enabled: bool = Field(default=True)
    demo_llm_responses: bool = Field(default=True)
    demo_database: bool = Field(default=True)

class CompleteAppSettings(BaseModel):
    """Complete application settings"""
    application_mode: ApplicationMode
    configuration_override: ConfigurationOverride
    backend_api: BackendAPIConfig
    llm_provider: LLMProviderConfig
    database: DatabaseConfig
    vector_db: VectorDBConfig
    features: Dict[str, bool] = Field(default={
        "rag_enabled": True,
        "scenarios_enabled": True,
        "morning_brief_enabled": True,
        "evening_summary_enabled": True
    })

class ConnectionTestResult(BaseModel):
    """Connection test result"""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str

# ==================== APPLICATION MODE ====================

@router.get("/mode")
async def get_application_mode():
    """Get current application mode (Demo vs Production)"""
    mode = os.getenv("APPLICATION_MODE", "demo")
    
    return {
        "mode": mode,
        "is_demo": mode == "demo",
        "is_production": mode == "production",
        "description": "Demo mode uses mock data. Production mode uses real configurations.",
        "demo_features": {
            "mock_llm_responses": mode == "demo",
            "mock_database": mode == "demo",
            "sample_data": mode == "demo"
        }
    }

@router.post("/mode/switch")
async def switch_application_mode(mode: Literal["demo", "production"]):
    """Switch between Demo and Production mode"""
    try:
        # In production, this should update a persistent configuration
        os.environ["APPLICATION_MODE"] = mode
        
        if mode == "production":
            # Verify all required configurations are set
            required_checks = []
            
            # Check LLM provider
            if not any([os.getenv("GOOGLE_API_KEY"), os.getenv("OPENAI_API_KEY"), os.getenv("ANTHROPIC_API_KEY")]):
                required_checks.append("LLM API key required for production mode")
            
            # Check database
            if not os.getenv("DATABASE_URL"):
                required_checks.append("Database connection required for production mode")
            
            if required_checks:
                return {
                    "success": False,
                    "message": "Cannot switch to production mode",
                    "missing_configurations": required_checks
                }
        
        return {
            "success": True,
            "mode": mode,
            "message": f"Switched to {mode} mode",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Mode switch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CONFIGURATION OVERRIDE ====================

@router.get("/override-status")
async def get_override_status():
    """Get current configuration override status"""
    return {
        "env_vars_available": {
            "google_api_key": bool(os.getenv("GOOGLE_API_KEY")),
            "openai_api_key": bool(os.getenv("OPENAI_API_KEY")),
            "anthropic_api_key": bool(os.getenv("ANTHROPIC_API_KEY")),
            "database_url": bool(os.getenv("DATABASE_URL")),
            "vector_db_config": bool(os.getenv("VECTOR_DB_TYPE"))
        },
        "override_settings": {
            "use_env_vars": os.getenv("USE_ENV_VARS", "false").lower() == "true",
            "override_llm": os.getenv("OVERRIDE_LLM", "false").lower() == "true",
            "override_database": os.getenv("OVERRIDE_DATABASE", "false").lower() == "true",
            "override_vector_db": os.getenv("OVERRIDE_VECTOR_DB", "false").lower() == "true"
        },
        "note": "Environment variables will override UI settings when enabled"
    }

@router.post("/override-settings")
async def update_override_settings(override: ConfigurationOverride):
    """Update configuration override settings"""
    try:
        # In production, persist these to a config file or database
        os.environ["USE_ENV_VARS"] = str(override.use_env_vars).lower()
        os.environ["OVERRIDE_LLM"] = str(override.override_llm).lower()
        os.environ["OVERRIDE_DATABASE"] = str(override.override_database).lower()
        os.environ["OVERRIDE_VECTOR_DB"] = str(override.override_vector_db).lower()
        
        return {
            "success": True,
            "message": "Override settings updated",
            "settings": override.dict()
        }
    except Exception as e:
        logger.error(f"Override settings update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== BACKEND API CONFIGURATION ====================

@router.get("/backend-api")
async def get_backend_api_config():
    """Get backend API configuration"""
    return {
        "api_url": os.getenv("BACKEND_API_URL", "http://localhost:8000"),
        "api_timeout": int(os.getenv("API_TIMEOUT", "30")),
        "enable_cors": os.getenv("ENABLE_CORS", "true").lower() == "true",
        "allowed_origins": os.getenv("ALLOWED_ORIGINS", "*").split(",")
    }

@router.post("/backend-api")
async def update_backend_api_config(config: BackendAPIConfig):
    """Update backend API configuration"""
    try:
        os.environ["BACKEND_API_URL"] = config.api_url
        os.environ["API_TIMEOUT"] = str(config.api_timeout)
        os.environ["ENABLE_CORS"] = str(config.enable_cors).lower()
        os.environ["ALLOWED_ORIGINS"] = ",".join(config.allowed_origins)
        
        return {
            "success": True,
            "message": "Backend API configuration updated",
            "config": config.dict()
        }
    except Exception as e:
        logger.error(f"Backend API config update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== VECTOR DB CONFIGURATION ====================

@router.get("/vector-db/options")
async def get_vector_db_options():
    """Get available vector database options"""
    return {
        "options": [
            {
                "id": "postgres_pgvector",
                "name": "PostgreSQL + pgvector",
                "description": "Use PostgreSQL with pgvector extension (RECOMMENDED)",
                "cost": "Included with PostgreSQL",
                "performance": "Excellent",
                "setup_complexity": "Low",
                "required_fields": [
                    "postgres_host",
                    "postgres_port",
                    "postgres_database",
                    "postgres_user",
                    "postgres_password"
                ],
                "recommended": True
            },
            {
                "id": "cosmos_db",
                "name": "Azure Cosmos DB",
                "description": "Azure Cosmos DB with vector search",
                "cost": "$15-50/month",
                "performance": "Excellent",
                "setup_complexity": "Medium",
                "required_fields": [
                    "cosmos_endpoint",
                    "cosmos_key",
                    "cosmos_database_name",
                    "cosmos_container_name"
                ],
                "recommended": False,
                "note": "Requires Azure subscription"
            },
            {
                "id": "google_cloud_vertex",
                "name": "Google Cloud Vertex AI",
                "description": "Vertex AI Vector Search",
                "cost": "$20-50/month",
                "performance": "Excellent",
                "setup_complexity": "Medium",
                "required_fields": [
                    "google_project_id",
                    "google_location",
                    "vertex_index_id",
                    "vertex_endpoint_id"
                ],
                "recommended": False,
                "note": "Requires Google Cloud project"
            },
            {
                "id": "chromadb",
                "name": "ChromaDB (Local)",
                "description": "Local ChromaDB storage",
                "cost": "Free",
                "performance": "Good",
                "setup_complexity": "Low",
                "required_fields": [
                    "chroma_persist_directory"
                ],
                "recommended": False,
                "note": "Requires persistent volume in production"
            }
        ],
        "default": "postgres_pgvector",
        "note": "PostgreSQL + pgvector is recommended for most use cases"
    }

@router.get("/vector-db/current")
async def get_current_vector_db():
    """Get current vector database configuration"""
    vector_db_type = os.getenv("VECTOR_DB_TYPE", "postgres_pgvector")
    
    config = {
        "vector_db_type": vector_db_type,
        "configured": True
    }
    
    if vector_db_type == "postgres_pgvector":
        config.update({
            "postgres_host": os.getenv("POSTGRES_HOST"),
            "postgres_port": int(os.getenv("POSTGRES_PORT", "5432")),
            "postgres_database": os.getenv("POSTGRES_DB"),
            "postgres_user": os.getenv("POSTGRES_USER")
        })
    elif vector_db_type == "cosmos_db":
        config.update({
            "cosmos_endpoint": os.getenv("COSMOS_ENDPOINT"),
            "cosmos_database_name": os.getenv("COSMOS_DATABASE_NAME"),
            "cosmos_container_name": os.getenv("COSMOS_CONTAINER_NAME")
        })
    elif vector_db_type == "google_cloud_vertex":
        config.update({
            "google_project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "google_location": os.getenv("GOOGLE_LOCATION", "us-central1"),
            "vertex_index_id": os.getenv("VERTEX_INDEX_ID"),
            "vertex_endpoint_id": os.getenv("VERTEX_ENDPOINT_ID")
        })
    elif vector_db_type == "chromadb":
        config.update({
            "chroma_persist_directory": os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        })
    
    return config

@router.post("/vector-db/test")
async def test_vector_db_connection(config: VectorDBConfig) -> ConnectionTestResult:
    """Test vector database connection"""
    try:
        if config.vector_db_type == "postgres_pgvector":
            # Test PostgreSQL connection
            conn = await asyncpg.connect(
                host=config.postgres_host,
                port=config.postgres_port,
                user=config.postgres_user,
                password=config.postgres_password,
                database=config.postgres_database,
                timeout=10
            )
            
            # Check for pgvector extension
            has_vector = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
            )
            
            await conn.close()
            
            if not has_vector:
                return ConnectionTestResult(
                    success=False,
                    message="pgvector extension not enabled",
                    details={"hint": "Run: CREATE EXTENSION vector;"},
                    timestamp=datetime.utcnow().isoformat()
                )
            
            return ConnectionTestResult(
                success=True,
                message="✅ PostgreSQL + pgvector connection successful",
                details={
                    "vector_db_type": "postgres_pgvector",
                    "host": config.postgres_host,
                    "database": config.postgres_database,
                    "pgvector_enabled": True
                },
                timestamp=datetime.utcnow().isoformat()
            )
            
        elif config.vector_db_type == "cosmos_db":
            # Test Cosmos DB connection
            # TODO: Implement Cosmos DB connection test
            return ConnectionTestResult(
                success=False,
                message="Cosmos DB testing not yet implemented",
                details={"note": "Requires Azure SDK implementation"},
                timestamp=datetime.utcnow().isoformat()
            )
            
        elif config.vector_db_type == "google_cloud_vertex":
            # Test Vertex AI connection
            # TODO: Implement Vertex AI connection test
            return ConnectionTestResult(
                success=False,
                message="Vertex AI testing not yet implemented",
                details={"note": "Requires Google Cloud SDK implementation"},
                timestamp=datetime.utcnow().isoformat()
            )
            
        elif config.vector_db_type == "chromadb":
            # Test ChromaDB
            import chromadb
            client = chromadb.PersistentClient(path=config.chroma_persist_directory)
            
            return ConnectionTestResult(
                success=True,
                message="✅ ChromaDB connection successful",
                details={
                    "vector_db_type": "chromadb",
                    "persist_directory": config.chroma_persist_directory
                },
                timestamp=datetime.utcnow().isoformat()
            )
            
    except Exception as e:
        logger.error(f"Vector DB connection test failed: {e}")
        return ConnectionTestResult(
            success=False,
            message=f"Connection failed: {str(e)}",
            timestamp=datetime.utcnow().isoformat()
        )

@router.post("/vector-db/configure")
async def configure_vector_db(config: VectorDBConfig):
    """Configure vector database"""
    try:
        # Save configuration
        os.environ["VECTOR_DB_TYPE"] = config.vector_db_type
        
        if config.vector_db_type == "postgres_pgvector":
            if config.postgres_host:
                os.environ["POSTGRES_HOST"] = config.postgres_host
            if config.postgres_port:
                os.environ["POSTGRES_PORT"] = str(config.postgres_port)
            if config.postgres_database:
                os.environ["POSTGRES_DB"] = config.postgres_database
            if config.postgres_user:
                os.environ["POSTGRES_USER"] = config.postgres_user
            if config.postgres_password:
                os.environ["POSTGRES_PASSWORD"] = config.postgres_password
                
        elif config.vector_db_type == "cosmos_db":
            if config.cosmos_endpoint:
                os.environ["COSMOS_ENDPOINT"] = config.cosmos_endpoint
            if config.cosmos_key:
                os.environ["COSMOS_KEY"] = config.cosmos_key
            if config.cosmos_database_name:
                os.environ["COSMOS_DATABASE_NAME"] = config.cosmos_database_name
            if config.cosmos_container_name:
                os.environ["COSMOS_CONTAINER_NAME"] = config.cosmos_container_name
                
        elif config.vector_db_type == "google_cloud_vertex":
            if config.google_project_id:
                os.environ["GOOGLE_PROJECT_ID"] = config.google_project_id
            if config.google_location:
                os.environ["GOOGLE_LOCATION"] = config.google_location
            if config.vertex_index_id:
                os.environ["VERTEX_INDEX_ID"] = config.vertex_index_id
            if config.vertex_endpoint_id:
                os.environ["VERTEX_ENDPOINT_ID"] = config.vertex_endpoint_id
                
        elif config.vector_db_type == "chromadb":
            if config.chroma_persist_directory:
                os.environ["CHROMA_PERSIST_DIR"] = config.chroma_persist_directory
        
        return {
            "success": True,
            "message": f"Vector DB configured: {config.vector_db_type}",
            "config": config.dict(exclude_none=True)
        }
        
    except Exception as e:
        logger.error(f"Vector DB configuration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== COMPLETE SETTINGS ====================

@router.get("/complete")
async def get_complete_settings():
    """Get complete application settings"""
    return {
        "application_mode": await get_application_mode(),
        "override_status": await get_override_status(),
        "backend_api": await get_backend_api_config(),
        "llm_providers": await get_available_providers(),
        "database": await get_database_config(),
        "vector_db": await get_current_vector_db()
    }

@router.post("/complete")
async def save_complete_settings(settings: CompleteAppSettings):
    """Save complete application settings"""
    try:
        results = {
            "mode": await switch_application_mode(settings.application_mode.mode),
            "override": await update_override_settings(settings.configuration_override),
            "backend_api": await update_backend_api_config(settings.backend_api),
            "vector_db": await configure_vector_db(settings.vector_db)
        }
        
        return {
            "success": True,
            "message": "Complete settings saved",
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Complete settings save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== HEALTH CHECK ====================

@router.get("/health")
async def settings_health():
    """Health check for enhanced settings API"""
    return {
        "status": "healthy",
        "features": [
            "Application Mode (Demo/Production)",
            "Configuration Override System",
            "Backend API Configuration",
            "Vector DB Selection (PostgreSQL/Cosmos/Google Cloud/ChromaDB)",
            "Complete Settings Management"
        ],
        "endpoints": [
            "GET /api/v1/settings/mode",
            "POST /api/v1/settings/mode/switch",
            "GET /api/v1/settings/override-status",
            "POST /api/v1/settings/override-settings",
            "GET /api/v1/settings/backend-api",
            "POST /api/v1/settings/backend-api",
            "GET /api/v1/settings/vector-db/options",
            "GET /api/v1/settings/vector-db/current",
            "POST /api/v1/settings/vector-db/test",
            "POST /api/v1/settings/vector-db/configure",
            "GET /api/v1/settings/complete",
            "POST /api/v1/settings/complete"
        ],
        "note": "All configuration changes can be done via UI - no code editing required"
    }

# Reuse existing functions from settings.py
async def get_available_providers():
    """Get list of available LLM providers"""
    providers = PureProviderManager.list_providers()
    
    configured = []
    if os.getenv("OPENAI_API_KEY"):
        configured.append("openai")
    if os.getenv("GOOGLE_API_KEY"):
        configured.append("gemini")
    if os.getenv("ANTHROPIC_API_KEY"):
        configured.append("anthropic")
    
    return {
        "providers": providers,
        "configured": configured,
        "recommended": "gemini"
    }

async def get_database_config():
    """Get current database configuration"""
    return {
        "type": os.getenv("DATABASE_TYPE", "postgres"),
        "host": os.getenv("POSTGRES_HOST"),
        "port": os.getenv("POSTGRES_PORT"),
        "database": os.getenv("POSTGRES_DB"),
        "connected": bool(os.getenv("DATABASE_URL"))
    }
