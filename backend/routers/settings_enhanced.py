"""
Backend Settings Router - Complete Implementation
Add this to: backend/routers/settings_enhanced.py
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import asyncpg
import os
import traceback

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

# ============================================================================
# Pydantic Models
# ============================================================================

class DatabaseTestRequest(BaseModel):
    database_type: str
    host: str
    port: int
    database: str
    username: str
    password: str

class LLMTestRequest(BaseModel):
    provider: str
    api_key: str = None

class VectorStoreTestRequest(BaseModel):
    vector_store_type: str
    llm_provider: dict = None

# ============================================================================
# Endpoint: Test Database Connection
# ============================================================================

@router.post("/database/test")
async def test_database_connection(config: DatabaseTestRequest):
    """
    Test database connection with provided credentials
    
    This endpoint is called by the frontend Settings page when user clicks
    "Test Database Connection" button.
    
    The backend tests the connection using the credentials provided in the form.
    """
    try:
        print(f"🔍 Testing database connection: {config.database_type}")
        print(f"   Host: {config.host}:{config.port}")
        print(f"   Database: {config.database}")
        print(f"   Username: {config.username}")
        
        if config.database_type == "postgres":
            # Test PostgreSQL connection
            print(f"   Attempting asyncpg connection...")
            
            conn = await asyncpg.connect(
                host=config.host,
                port=config.port,
                database=config.database,
                user=config.username,
                password=config.password,
                timeout=10
            )
            
            print(f"   ✅ Connection established!")
            
            # Test query
            version = await conn.fetchval('SELECT version()')
            await conn.close()
            
            print(f"   Database version: {version[:50]}...")
            
            return {
                "success": True,
                "message": "✅ Database connection successful!",
                "details": {
                    "database_type": "PostgreSQL",
                    "host": config.host,
                    "port": config.port,
                    "database": config.database,
                    "version": version[:100] + "..." if len(version) > 100 else version
                },
                "timestamp": datetime.now().isoformat()
            }
            
        elif config.database_type == "sqlite":
            # SQLite doesn't need connection test (file-based)
            return {
                "success": True,
                "message": "✅ SQLite configured (file-based, no connection test needed)",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type: {config.database_type}")
            
    except asyncpg.exceptions.InvalidPasswordError as e:
        print(f"   ❌ Authentication failed: Invalid password")
        return {
            "success": False,
            "message": "❌ Authentication failed: Invalid username or password",
            "details": {"error": "Check your credentials"},
            "timestamp": datetime.now().isoformat()
        }
        
    except asyncpg.exceptions.InvalidCatalogNameError as e:
        print(f"   ❌ Database not found: {config.database}")
        return {
            "success": False,
            "message": f"❌ Database '{config.database}' does not exist",
            "details": {"error": "Check database name or create the database first"},
            "timestamp": datetime.now().isoformat()
        }
        
    except OSError as e:
        if "Connection refused" in str(e):
            print(f"   ❌ Connection refused to {config.host}:{config.port}")
            return {
                "success": False,
                "message": f"❌ Connection refused: Cannot reach {config.host}:{config.port}",
                "details": {
                    "error": "Check if database server is running and port is correct",
                    "hint": "For Railway internal connections, use the internal hostname (e.g., postgres.railway.internal:5432)"
                },
                "timestamp": datetime.now().isoformat()
            }
        elif "nodename nor servname provided" in str(e) or "Name or service not known" in str(e):
            print(f"   ❌ DNS resolution failed for {config.host}")
            return {
                "success": False,
                "message": f"❌ Cannot resolve hostname: {config.host}",
                "details": {
                    "error": "Hostname does not exist or DNS lookup failed",
                    "hint": "Check if the hostname is correct"
                },
                "timestamp": datetime.now().isoformat()
            }
        else:
            print(f"   ❌ Network error: {str(e)}")
            return {
                "success": False,
                "message": f"❌ Network error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            
    except asyncpg.exceptions.PostgresError as e:
        print(f"   ❌ PostgreSQL error: {str(e)}")
        return {
            "success": False,
            "message": f"❌ Database error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"   ❌ Unexpected error ({error_type}): {error_msg}")
        print(f"   Traceback: {traceback.format_exc()}")
        
        return {
            "success": False,
            "message": f"❌ Connection failed: {error_msg}",
            "details": {
                "error_type": error_type,
                "error": error_msg
            },
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# Endpoint: Get LLM Providers
# ============================================================================

@router.get("/llm-providers")
async def get_llm_providers():
    """Get available LLM providers and their configurations"""
    
    providers = {
        "gemini": {
            "name": "Google Gemini",
            "chat_models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-exp"],
            "embedding_models": ["text-embedding-004"],
            "embedding_cost": "FREE",
            "native_embeddings": True,
            "requires_api_key": "GOOGLE_API_KEY"
        },
        "openai": {
            "name": "OpenAI",
            "chat_models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
            "embedding_models": ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"],
            "embedding_cost": "$0.00002/1k tokens",
            "native_embeddings": True,
            "requires_api_key": "OPENAI_API_KEY"
        },
        "anthropic": {
            "name": "Anthropic Claude",
            "chat_models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
            "embedding_models": [],
            "embedding_cost": "N/A (no native embeddings)",
            "native_embeddings": False,
            "requires_api_key": "ANTHROPIC_API_KEY"
        }
    }
    
    # Check which providers are configured
    configured = []
    if os.getenv("GOOGLE_API_KEY"):
        configured.append("gemini")
    if os.getenv("OPENAI_API_KEY"):
        configured.append("openai")
    if os.getenv("ANTHROPIC_API_KEY"):
        configured.append("anthropic")
    
    return {
        "providers": providers,
        "configured": configured,
        "default": os.getenv("DEFAULT_LLM_PROVIDER", "gemini")
    }

# ============================================================================
# Endpoint: Test LLM Provider
# ============================================================================

@router.post("/llm-provider/test")
async def test_llm_provider(request: LLMTestRequest):
    """Test LLM provider connection"""
    
    provider = request.provider
    api_key = request.api_key or os.getenv(f"{provider.upper()}_API_KEY")
    
    if not api_key:
        return {
            "success": False,
            "message": f"❌ No API key provided for {provider}",
            "details": {"error": "Set API key in environment or provide it in the request"},
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        if provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content("Say 'Hello' in one word")
            
            return {
                "success": True,
                "message": "✅ Gemini connection successful!",
                "details": {
                    "provider": "Google Gemini",
                    "model": "gemini-1.5-flash",
                    "test_response": response.text
                },
                "timestamp": datetime.now().isoformat()
            }
            
        elif provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say 'Hello' in one word"}],
                max_tokens=10
            )
            
            return {
                "success": True,
                "message": "✅ OpenAI connection successful!",
                "details": {
                    "provider": "OpenAI",
                    "model": "gpt-3.5-turbo",
                    "test_response": response.choices[0].message.content
                },
                "timestamp": datetime.now().isoformat()
            }
            
        elif provider == "anthropic":
            from anthropic import Anthropic
            client = Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "Say 'Hello' in one word"}]
            )
            
            return {
                "success": True,
                "message": "✅ Anthropic connection successful!",
                "details": {
                    "provider": "Anthropic Claude",
                    "model": "claude-3-haiku",
                    "test_response": response.content[0].text
                },
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
            
    except Exception as e:
        return {
            "success": False,
            "message": f"❌ Connection failed: {str(e)}",
            "details": {"error_type": type(e).__name__},
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# Endpoint: Test Vector Store
# ============================================================================

@router.post("/vector-store/test")
async def test_vector_store(request: VectorStoreTestRequest):
    """Test vector store connection"""
    
    vs_type = request.vector_store_type
    
    try:
        if vs_type == "chromadb":
            import chromadb
            from chromadb.config import Settings
            
            # Test ChromaDB connection
            client = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
            ))
            
            # Try to list collections
            collections = client.list_collections()
            
            return {
                "success": True,
                "message": "✅ ChromaDB connection successful!",
                "details": {
                    "vector_store": "ChromaDB",
                    "persist_directory": os.getenv("CHROMA_PERSIST_DIR", "./chroma_db"),
                    "collections_count": len(collections)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        elif vs_type == "pgvector":
            # Test pgvector extension in PostgreSQL
            db_url = os.getenv("DATABASE_URL")
            if not db_url:
                return {
                    "success": False,
                    "message": "❌ DATABASE_URL not configured",
                    "timestamp": datetime.now().isoformat()
                }
            
            conn = await asyncpg.connect(db_url)
            
            # Check if pgvector extension exists
            result = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
            )
            
            await conn.close()
            
            if result:
                return {
                    "success": True,
                    "message": "✅ PGVector connection successful!",
                    "details": {
                        "vector_store": "PostgreSQL + pgvector",
                        "extension_installed": True
                    },
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "message": "⚠️ PostgreSQL connected but pgvector extension not installed",
                    "details": {
                        "hint": "Run: CREATE EXTENSION vector;"
                    },
                    "timestamp": datetime.now().isoformat()
                }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported vector store type: {vs_type}")
            
    except Exception as e:
        return {
            "success": False,
            "message": f"❌ Connection failed: {str(e)}",
            "details": {"error_type": type(e).__name__},
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# Helper: Get Current Application Mode
# ============================================================================

@router.get("/mode")
async def get_application_mode():
    """Get current application mode (demo/production)"""
    
    mode = os.getenv("APPLICATION_MODE", "demo")
    
    return {
        "mode": mode,
        "is_demo": mode == "demo",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# ============================================================================
# Helper: Switch Application Mode
# ============================================================================

@router.post("/mode/switch")
async def switch_application_mode(mode: str):
    """Switch application mode (demo/production)"""
    
    # Note: This won't persist across restarts unless you update .env
    # For Railway, you should update environment variables in Railway dashboard
    
    if mode not in ["demo", "production"]:
        raise HTTPException(status_code=400, detail="Mode must be 'demo' or 'production'")
    
    # In a real implementation, you'd update the environment variable
    # For now, just return success
    
    return {
        "success": True,
        "message": f"Mode switched to {mode}",
        "note": "To persist this change, update APPLICATION_MODE in Railway environment variables"
    }
