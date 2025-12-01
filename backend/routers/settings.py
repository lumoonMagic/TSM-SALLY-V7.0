"""
Settings & Configuration Router
Handles UI settings, LLM provider configuration, and connection testing
All connection tests go through API layer to avoid CORS issues
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os
import logging
from datetime import datetime

# Database imports
import asyncpg
import sqlite3

# LLM validation
from backend.ai.pure_provider_manager import PureProviderManager, get_pure_provider

router = APIRouter(prefix="/api/v1/settings", tags=["Settings & Configuration"])
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class LLMProviderSettings(BaseModel):
    """LLM provider configuration from UI"""
    provider: str = Field(..., pattern="^(openai|gemini|google|anthropic)$")
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    temperature: Optional[float] = Field(default=0.2, ge=0.0, le=2.0)
    api_key: Optional[str] = Field(default=None, description="API key (optional, can use env var)")

class DatabaseSettings(BaseModel):
    """Database configuration from UI"""
    database_type: str = Field(..., pattern="^(sqlite|postgres|postgresql)$")
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    connection_string: Optional[str] = None

class VectorStoreSettings(BaseModel):
    """Vector store configuration from UI"""
    vector_store_type: str = Field(..., pattern="^(chromadb|pgvector)$")
    persist_directory: Optional[str] = None

class AppSettings(BaseModel):
    """Complete application settings from UI"""
    llm_provider: LLMProviderSettings
    database: DatabaseSettings
    vector_store: VectorStoreSettings
    features: Optional[Dict[str, bool]] = {
        "rag_enabled": True,
        "scenarios_enabled": True,
        "morning_brief_enabled": True,
        "evening_summary_enabled": True
    }

class ConnectionTestResult(BaseModel):
    """Connection test result"""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str

# ==================== LLM PROVIDER ENDPOINTS ====================

@router.get("/llm-providers")
async def get_available_providers():
    """
    Get list of available LLM providers
    Used by UI to populate provider dropdown
    """
    providers = PureProviderManager.list_providers()
    
    # Check which providers are configured
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
        "recommended": "gemini",  # FREE embeddings
        "note": "Each provider uses ONLY its own capabilities - no cross-dependencies"
    }

@router.post("/llm-provider/test")
async def test_llm_provider(settings: LLMProviderSettings) -> ConnectionTestResult:
    """
    Test LLM provider connection through API layer (no CORS issues)
    Validates API key, tests chat and embeddings
    
    Example:
        POST /api/v1/settings/llm-provider/test
        {
            "provider": "gemini",
            "api_key": "your-key"
        }
    """
    try:
        # Set API key temporarily for testing
        if settings.api_key:
            env_key = f"{settings.provider.upper()}_API_KEY"
            if settings.provider in ["gemini", "google"]:
                env_key = "GOOGLE_API_KEY"
            original_key = os.getenv(env_key)
            os.environ[env_key] = settings.api_key
        
        # Get pure provider bundle
        chat, embeddings, metadata = get_pure_provider(
            provider=settings.provider,
            chat_model=settings.chat_model,
            embedding_model=settings.embedding_model
        )
        
        # Test embeddings
        test_text = "Connection test"
        embedding_vector = embeddings.embed_query(test_text)
        
        # Test chat (simple prompt to avoid cost)
        test_response = chat.invoke("Say 'OK' if you can read this.")
        
        # Restore original key
        if settings.api_key and original_key:
            os.environ[env_key] = original_key
        
        return ConnectionTestResult(
            success=True,
            message=f"✅ {settings.provider.upper()} connection successful",
            details={
                "provider": settings.provider,
                "chat_model": metadata["chat_model"],
                "embedding_model": metadata["embedding_model"],
                "embedding_dimensions": metadata["embedding_dimensions"],
                "embedding_cost": metadata["embedding_cost"],
                "chat_response": test_response.content[:50],
                "embedding_vector_size": len(embedding_vector)
            },
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"LLM provider test failed: {e}")
        return ConnectionTestResult(
            success=False,
            message=f"❌ {settings.provider.upper()} connection failed: {str(e)}",
            details={"error": str(e)},
            timestamp=datetime.utcnow().isoformat()
        )

@router.post("/llm-provider/validate")
async def validate_llm_provider(settings: LLMProviderSettings):
    """
    Validate LLM provider configuration (lightweight, no API calls)
    
    Example:
        POST /api/v1/settings/llm-provider/validate
        {
            "provider": "gemini"
        }
    """
    result = PureProviderManager.validate_provider_setup(settings.provider)
    return result

# ==================== DATABASE ENDPOINTS ====================

@router.post("/database/test")
async def test_database_connection(settings: DatabaseSettings) -> ConnectionTestResult:
    """
    Test database connection through API layer (avoids CORS issues)
    
    Example:
        POST /api/v1/settings/database/test
        {
            "database_type": "postgres",
            "host": "containers-us-west-123.railway.app",
            "port": 5432,
            "database": "railway",
            "username": "postgres",
            "password": "your-password"
        }
    """
    try:
        if settings.database_type in ["postgres", "postgresql"]:
            # Test PostgreSQL connection
            conn = await asyncpg.connect(
                host=settings.host,
                port=settings.port or 5432,
                user=settings.username,
                password=settings.password,
                database=settings.database,
                timeout=10  # 10 second timeout
            )
            
            # Test query
            version = await conn.fetchval("SELECT version()")
            
            # Check for pgvector extension
            pgvector_installed = await conn.fetchval(
                "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector'"
            )
            
            # Get database size
            db_size = await conn.fetchval(
                f"SELECT pg_size_pretty(pg_database_size('{settings.database}'))"
            )
            
            await conn.close()
            
            return ConnectionTestResult(
                success=True,
                message="✅ PostgreSQL connection successful",
                details={
                    "database_type": "PostgreSQL",
                    "version": version.split()[1],
                    "database": settings.database,
                    "host": settings.host,
                    "port": settings.port,
                    "pgvector_installed": pgvector_installed > 0,
                    "database_size": db_size
                },
                timestamp=datetime.utcnow().isoformat()
            )
            
        elif settings.database_type == "sqlite":
            # Test SQLite connection
            db_path = settings.connection_string or "./sally_tsm.db"
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Test query
            cursor.execute("SELECT sqlite_version()")
            version = cursor.fetchone()[0]
            
            # Get database size
            import os as os_module
            db_size = os_module.path.getsize(db_path) if os_module.path.exists(db_path) else 0
            
            conn.close()
            
            return ConnectionTestResult(
                success=True,
                message="✅ SQLite connection successful",
                details={
                    "database_type": "SQLite",
                    "version": version,
                    "database_path": db_path,
                    "database_size_bytes": db_size
                },
                timestamp=datetime.utcnow().isoformat()
            )
            
        else:
            raise ValueError(f"Unsupported database type: {settings.database_type}")
            
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return ConnectionTestResult(
            success=False,
            message=f"❌ Database connection failed: {str(e)}",
            details={"error": str(e)},
            timestamp=datetime.utcnow().isoformat()
        )

@router.post("/database/initialize")
async def initialize_database(settings: DatabaseSettings):
    """
    Initialize database with schema (runs migrations)
    
    Example:
        POST /api/v1/settings/database/initialize
        {
            "database_type": "postgres",
            "host": "...",
            ...
        }
    """
    try:
        # Connect to database
        if settings.database_type in ["postgres", "postgresql"]:
            conn = await asyncpg.connect(
                host=settings.host,
                port=settings.port or 5432,
                user=settings.username,
                password=settings.password,
                database=settings.database
            )
            
            # Check if tables exist
            tables = await conn.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            
            existing_tables = [t["table_name"] for t in tables]
            
            if len(existing_tables) > 0:
                await conn.close()
                return {
                    "success": True,
                    "message": f"Database already initialized with {len(existing_tables)} tables",
                    "existing_tables": existing_tables
                }
            
            # Run migrations (simplified - in production, use proper migration tool)
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            
            await conn.close()
            
            return {
                "success": True,
                "message": "Database initialized successfully",
                "note": "Run full migrations with: railway run python backend/database/migrations/deploy.py"
            }
            
        else:
            return {
                "success": False,
                "error": "Database initialization only supported for PostgreSQL"
            }
            
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== VECTOR STORE ENDPOINTS ====================

@router.post("/vector-store/test")
async def test_vector_store(settings: VectorStoreSettings, llm_settings: LLMProviderSettings) -> ConnectionTestResult:
    """
    Test vector store connection through API layer
    
    Example:
        POST /api/v1/settings/vector-store/test
        {
            "vector_store_type": "pgvector",
            "llm_provider": {
                "provider": "gemini"
            }
        }
    """
    try:
        # Get embeddings
        chat, embeddings, metadata = get_pure_provider(llm_settings.provider)
        
        # Test embedding generation
        test_text = "Vector store connection test"
        vector = embeddings.embed_query(test_text)
        
        if settings.vector_store_type == "pgvector":
            # Test PGVector connection
            connection_string = os.getenv("DATABASE_URL")
            if not connection_string:
                raise ValueError("DATABASE_URL not set for PGVector")
            
            from langchain_community.vectorstores import PGVector
            
            # Try to connect
            vector_store = PGVector(
                collection_name="test_collection",
                connection_string=connection_string,
                embedding_function=embeddings
            )
            
            return ConnectionTestResult(
                success=True,
                message="✅ PGVector connection successful",
                details={
                    "vector_store_type": "PGVector",
                    "embedding_provider": llm_settings.provider,
                    "embedding_dimensions": len(vector),
                    "embedding_model": metadata["embedding_model"]
                },
                timestamp=datetime.utcnow().isoformat()
            )
            
        elif settings.vector_store_type == "chromadb":
            # Test ChromaDB
            from langchain_community.vectorstores import Chroma
            
            persist_dir = settings.persist_directory or "./chroma_db"
            
            vector_store = Chroma(
                collection_name="test_collection",
                embedding_function=embeddings,
                persist_directory=persist_dir
            )
            
            return ConnectionTestResult(
                success=True,
                message="✅ ChromaDB connection successful",
                details={
                    "vector_store_type": "ChromaDB",
                    "embedding_provider": llm_settings.provider,
                    "embedding_dimensions": len(vector),
                    "embedding_model": metadata["embedding_model"],
                    "persist_directory": persist_dir
                },
                timestamp=datetime.utcnow().isoformat()
            )
            
        else:
            raise ValueError(f"Unsupported vector store: {settings.vector_store_type}")
            
    except Exception as e:
        logger.error(f"Vector store test failed: {e}")
        return ConnectionTestResult(
            success=False,
            message=f"❌ Vector store test failed: {str(e)}",
            details={"error": str(e)},
            timestamp=datetime.utcnow().isoformat()
        )

# ==================== APPLICATION SETTINGS ====================

@router.get("/app-settings")
async def get_app_settings():
    """
    Get current application settings
    Used by UI to populate settings form
    """
    return {
        "llm_provider": {
            "provider": os.getenv("DEFAULT_LLM_PROVIDER", "gemini"),
            "configured_providers": [
                p for p in ["openai", "gemini", "anthropic"]
                if os.getenv(f"{p.upper()}_API_KEY" if p != "gemini" else "GOOGLE_API_KEY")
            ]
        },
        "database": {
            "type": os.getenv("DATABASE_TYPE", "sqlite"),
            "host": os.getenv("POSTGRES_HOST"),
            "port": os.getenv("POSTGRES_PORT"),
            "database": os.getenv("POSTGRES_DB")
        },
        "vector_store": {
            "type": os.getenv("VECTOR_STORE_TYPE", "chromadb"),
            "pgvector_available": os.getenv("DATABASE_URL") is not None
        },
        "features": {
            "rag_enabled": os.getenv("ENABLE_RAG", "true").lower() == "true",
            "scenarios_enabled": os.getenv("ENABLE_SCENARIOS", "true").lower() == "true",
            "morning_brief_enabled": os.getenv("ENABLE_MORNING_BRIEF", "true").lower() == "true",
            "evening_summary_enabled": os.getenv("ENABLE_EVENING_SUMMARY", "true").lower() == "true"
        }
    }

@router.post("/app-settings")
async def save_app_settings(settings: AppSettings):
    """
    Save application settings (persists to environment or config file)
    
    Note: In production, this should persist to a config file or database
    For now, returns instructions for updating environment variables
    """
    
    # Generate environment variable instructions
    env_vars = []
    
    # LLM provider
    provider = settings.llm_provider.provider
    env_vars.append(f"DEFAULT_LLM_PROVIDER={provider}")
    
    if settings.llm_provider.api_key:
        if provider in ["gemini", "google"]:
            env_vars.append(f"GOOGLE_API_KEY={settings.llm_provider.api_key}")
        elif provider == "openai":
            env_vars.append(f"OPENAI_API_KEY={settings.llm_provider.api_key}")
        elif provider == "anthropic":
            env_vars.append(f"ANTHROPIC_API_KEY={settings.llm_provider.api_key}")
    
    # Database
    env_vars.append(f"DATABASE_TYPE={settings.database.database_type}")
    if settings.database.database_type in ["postgres", "postgresql"]:
        env_vars.append(f"POSTGRES_HOST={settings.database.host}")
        env_vars.append(f"POSTGRES_PORT={settings.database.port or 5432}")
        env_vars.append(f"POSTGRES_DB={settings.database.database}")
        env_vars.append(f"POSTGRES_USER={settings.database.username}")
        env_vars.append(f"POSTGRES_PASSWORD={settings.database.password}")
    
    # Vector store
    env_vars.append(f"VECTOR_STORE_TYPE={settings.vector_store.vector_store_type}")
    if settings.vector_store.vector_store_type == "chromadb":
        env_vars.append(f"CHROMA_PERSIST_DIR={settings.vector_store.persist_directory or './chroma_db'}")
    
    # Features
    for feature, enabled in settings.features.items():
        env_vars.append(f"{feature.upper()}={str(enabled).lower()}")
    
    return {
        "success": True,
        "message": "Settings validated",
        "environment_variables": env_vars,
        "note": "Update these environment variables in Railway/Vercel dashboard or .env file"
    }

@router.get("/health")
async def settings_health():
    """Health check for settings API"""
    return {
        "status": "healthy",
        "endpoints": [
            "GET /api/v1/settings/llm-providers",
            "POST /api/v1/settings/llm-provider/test",
            "POST /api/v1/settings/database/test",
            "POST /api/v1/settings/vector-store/test",
            "GET /api/v1/settings/app-settings"
        ],
        "note": "All connection tests go through API layer - no CORS issues"
    }
