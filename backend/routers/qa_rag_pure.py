"""
Enhanced Q&A Router with PURE Provider Implementation
Complete independence - no cross-dependencies between providers

OpenAI -> OpenAI chat + OpenAI embeddings
Gemini -> Gemini chat + Gemini embeddings (FREE)
Claude -> Claude chat + local embeddings (FREE)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging
from datetime import datetime

# LangChain imports
from langchain_community.vectorstores import Chroma, PGVector
from langchain.prompts import PromptTemplate
from langchain.schema import Document

# Import pure provider manager
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from backend.ai.pure_provider_manager import get_pure_provider, PureProviderManager

# Database imports
import asyncpg
import sqlite3

# Initialize router
router = APIRouter(tags=["Q&A with Pure Providers"])
logger = logging.getLogger(__name__)

# ==================== GUARDRAILS ====================

class SQLGuardrail:
    """SQL injection prevention"""
    FORBIDDEN_KEYWORDS = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE", "EXEC", "EXECUTE", "GRANT", "REVOKE"]
    
    @classmethod
    def validate_sql(cls, sql: str) -> tuple[bool, str]:
        sql_upper = sql.upper()
        for keyword in cls.FORBIDDEN_KEYWORDS:
            if keyword in sql_upper:
                return False, f"Forbidden operation: {keyword}"
        if not sql_upper.strip().startswith("SELECT"):
            return False, "Only SELECT queries allowed"
        if sql.count(";") > 1:
            return False, "Multiple statements not allowed"
        return True, "Valid"

class ResponseGuardrail:
    """Response validation"""
    @staticmethod
    def validate_response(response: str) -> tuple[bool, str]:
        hallucination_phrases = ["i don't have access", "i cannot access", "as an ai", "i am not able to"]
        if any(phrase in response.lower() for phrase in hallucination_phrases):
            return False, "Response contains hallucination indicators"
        if len(response.strip()) < 20:
            return False, "Response too short"
        return True, "Valid"

# ==================== PROMPT ====================

QA_PROMPT_TEMPLATE = """You are Sally, an AI assistant specialized in Clinical Trial Supply Management.

STRICT RULES:
1. ONLY answer questions related to clinical trial supply management
2. Base answers ONLY on the provided context below
3. If context doesn't contain answer, say "I don't have that information"
4. Generate ONLY SELECT statements for data queries
5. Cite sources
6. No speculation

Context: {context}
Question: {question}

Response:"""

QA_PROMPT = PromptTemplate(template=QA_PROMPT_TEMPLATE, input_variables=["context", "question"])

# ==================== MODELS ====================

class QARequest(BaseModel):
    """Q&A request"""
    question: str = Field(..., min_length=3, max_length=500)
    provider: str = Field(default="gemini", pattern="^(openai|gemini|google|anthropic)$")
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    use_rag: Optional[bool] = True

class QAResponse(BaseModel):
    """Q&A response"""
    answer: str
    sources: Optional[List[str]] = []
    provider: str
    chat_model: str
    embedding_model: str
    embedding_dimensions: int
    embedding_cost: str
    pure_provider: bool
    note: str
    timestamp: str

# ==================== VECTOR STORE ====================

class PureVectorStore:
    """Vector store with pure provider embeddings"""
    
    def __init__(self, provider: str, chat_model: Optional[str] = None, embedding_model: Optional[str] = None):
        # Get pure provider bundle
        self.chat, self.embeddings, self.metadata = get_pure_provider(provider, chat_model, embedding_model)
        self.provider = provider
        self.vector_store = None
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """Initialize vector store"""
        try:
            if os.getenv("USE_PGVECTOR", "false").lower() == "true":
                connection_string = os.getenv("DATABASE_URL")
                self.vector_store = PGVector(
                    collection_name=f"sally_docs_{self.provider}",  # Provider-specific collection
                    connection_string=connection_string,
                    embedding_function=self.embeddings,
                    distance_strategy="cosine"
                )
                logger.info(f"Using PGVector with {self.provider} embeddings")
            else:
                persist_directory = os.getenv("CHROMA_PERSIST_DIR", f"./chroma_db_{self.provider}")
                self.vector_store = Chroma(
                    collection_name=f"sally_docs_{self.provider}",  # Provider-specific collection
                    embedding_function=self.embeddings,
                    persist_directory=persist_directory
                )
                logger.info(f"Using ChromaDB with {self.provider} embeddings")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise
    
    def add_documents(self, documents: List[Document]):
        """Add documents"""
        self.vector_store.add_documents(documents)
        logger.info(f"Added {len(documents)} documents with {self.provider} embeddings")
    
    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Search similar documents"""
        try:
            return self.vector_store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

# ==================== DATABASE ====================

async def get_db_connection():
    """Get database connection"""
    db_type = os.getenv("DATABASE_TYPE", "sqlite")
    if db_type == "postgres":
        return await asyncpg.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", 5432)),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD"),
            database=os.getenv("POSTGRES_DB", "sally_tsm")
        )
    else:
        return sqlite3.connect(os.getenv("SQLITE_DB_PATH", "./sally_tsm.db"))

# ==================== API ENDPOINTS ====================

@router.post("/ask-rag", response_model=QAResponse)
async def ask_with_rag(request: QARequest):
    """
    Q&A with PURE provider implementation - no cross-dependencies
    
    Examples:
        # Pure OpenAI
        {
            "question": "What is the temperature protocol?",
            "provider": "openai"
        }
        # Uses: OpenAI chat + OpenAI embeddings
        
        # Pure Gemini
        {
            "question": "What is the temperature protocol?",
            "provider": "gemini"
        }
        # Uses: Gemini chat + Gemini embeddings (FREE)
        
        # Pure Claude
        {
            "question": "What is the temperature protocol?",
            "provider": "anthropic"
        }
        # Uses: Claude chat + local embeddings (FREE)
    """
    try:
        # Get pure provider bundle
        vector_store = PureVectorStore(
            provider=request.provider,
            chat_model=request.chat_model,
            embedding_model=request.embedding_model
        )
        
        # Retrieve context
        if request.use_rag:
            relevant_docs = vector_store.similarity_search(request.question, k=4)
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            sources = [doc.metadata.get("source", "Unknown") for doc in relevant_docs]
        else:
            context = "No context available"
            sources = []
        
        # Generate response
        prompt = QA_PROMPT.format(context=context, question=request.question)
        response = vector_store.chat.invoke(prompt)
        answer = response.content
        
        # Validate response
        is_valid, validation_msg = ResponseGuardrail.validate_response(answer)
        if not is_valid:
            logger.warning(f"Response validation failed: {validation_msg}")
            answer = "I need more context to provide a reliable answer. Please rephrase your question."
        
        return QAResponse(
            answer=answer,
            sources=sources if request.use_rag else [],
            provider=request.provider,
            chat_model=vector_store.metadata["chat_model"],
            embedding_model=vector_store.metadata["embedding_model"],
            embedding_dimensions=vector_store.metadata["embedding_dimensions"],
            embedding_cost=vector_store.metadata["embedding_cost"],
            pure_provider=vector_store.metadata["pure_provider"],
            note=vector_store.metadata["note"],
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Q&A failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest-documents")
async def ingest_documents(
    documents: List[Dict[str, str]],
    provider: str = "gemini",
    chat_model: Optional[str] = None,
    embedding_model: Optional[str] = None
):
    """
    Ingest documents with PURE provider embeddings
    
    Example:
        # Use Gemini embeddings (FREE)
        {
            "documents": [{
                "content": "Temperature excursions require...",
                "source": "SOP-QA-008"
            }],
            "provider": "gemini"
        }
        # Result: Gemini embeddings only, no OpenAI
    """
    try:
        vector_store = PureVectorStore(provider, chat_model, embedding_model)
        
        docs = [
            Document(
                page_content=doc["content"],
                metadata={"source": doc.get("source", "Unknown"), **doc.get("metadata", {})}
            )
            for doc in documents
        ]
        
        vector_store.add_documents(docs)
        
        return {
            "success": True,
            "documents_added": len(docs),
            "provider": provider,
            "chat_model": vector_store.metadata["chat_model"],
            "embedding_model": vector_store.metadata["embedding_model"],
            "embedding_cost": vector_store.metadata["embedding_cost"],
            "pure_provider": True,
            "note": vector_store.metadata["note"]
        }
        
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/providers")
async def list_providers():
    """List all available pure providers"""
    return {
        "providers": PureProviderManager.list_providers(),
        "note": "Each provider uses ONLY its own native capabilities - no cross-dependencies"
    }

@router.get("/provider/{provider}/validate")
async def validate_provider(provider: str):
    """Validate provider setup"""
    return PureProviderManager.validate_provider_setup(provider)

@router.post("/execute-sql")
async def execute_sql(sql: str):
    """Execute SQL with guardrails"""
    try:
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"SQL validation failed: {msg}")
        
        conn = await get_db_connection()
        
        if isinstance(conn, asyncpg.Connection):
            rows = await conn.fetch(sql)
            result = [dict(row) for row in rows]
            await conn.close()
        else:
            cursor = conn.cursor()
            cursor.execute(sql)
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            result = [dict(zip(columns, row)) for row in rows]
            conn.close()
        
        return {"success": True, "data": result, "row_count": len(result)}
        
    except Exception as e:
        logger.error(f"SQL execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check"""
    configured_providers = []
    if os.getenv("OPENAI_API_KEY"):
        configured_providers.append("openai")
    if os.getenv("GOOGLE_API_KEY"):
        configured_providers.append("gemini")
    if os.getenv("ANTHROPIC_API_KEY"):
        configured_providers.append("anthropic")
    
    return {
        "status": "healthy",
        "implementation": "pure_providers",
        "configured_providers": configured_providers,
        "note": "Each provider uses ONLY its own capabilities - zero cross-dependencies",
        "timestamp": datetime.utcnow().isoformat()
    }
