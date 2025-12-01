"""
Enhanced Q&A Router with RAG, LangChain, and Multi-LLM Support
Includes guardrailing, grounding, and comprehensive error handling
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging
from datetime import datetime

# LangChain imports
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.callbacks import get_openai_callback
from langchain.schema import Document

# Database imports
import asyncpg
import sqlite3

# Initialize router
router = APIRouter(prefix="/api/v1/qa", tags=["Q&A with RAG"])
logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================

class LLMConfig:
    """Multi-LLM provider configuration"""
    
    @staticmethod
    def get_llm(provider: str = "openai", model: str = None):
        """Initialize LLM based on provider with fallback"""
        try:
            if provider == "openai":
                return ChatOpenAI(
                    model=model or "gpt-4o-mini",
                    temperature=0.2,
                    api_key=os.getenv("OPENAI_API_KEY")
                )
            elif provider == "anthropic":
                return ChatAnthropic(
                    model=model or "claude-3-5-sonnet-20241022",
                    temperature=0.2,
                    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
                )
            elif provider == "gemini":
                return ChatGoogleGenerativeAI(
                    model=model or "gemini-1.5-flash",
                    temperature=0.2,
                    google_api_key=os.getenv("GOOGLE_API_KEY")
                )
            else:
                logger.warning(f"Unknown provider {provider}, falling back to OpenAI")
                return ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
        except Exception as e:
            logger.error(f"Failed to initialize {provider}: {e}")
            # Fallback to OpenAI
            return ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

# ==================== GUARDRAILS ====================

class SQLGuardrail:
    """SQL injection prevention and query validation"""
    
    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT",
        "UPDATE", "EXEC", "EXECUTE", "GRANT", "REVOKE"
    ]
    
    @classmethod
    def validate_sql(cls, sql: str) -> tuple[bool, str]:
        """Validate SQL query for safety"""
        sql_upper = sql.upper()
        
        # Check for forbidden keywords
        for keyword in cls.FORBIDDEN_KEYWORDS:
            if keyword in sql_upper:
                return False, f"Forbidden operation: {keyword}"
        
        # Must be SELECT only
        if not sql_upper.strip().startswith("SELECT"):
            return False, "Only SELECT queries are allowed"
        
        # Check for semicolons (multiple statements)
        if sql.count(";") > 1:
            return False, "Multiple statements not allowed"
        
        return True, "Valid"

class ResponseGuardrail:
    """Response validation and content filtering"""
    
    @staticmethod
    def validate_response(response: str) -> tuple[bool, str]:
        """Ensure response is appropriate and grounded"""
        
        # Check for hallucination indicators
        hallucination_phrases = [
            "i don't have access",
            "i cannot access",
            "as an ai",
            "i am not able to"
        ]
        
        response_lower = response.lower()
        if any(phrase in response_lower for phrase in hallucination_phrases):
            return False, "Response contains hallucination indicators"
        
        # Check minimum length
        if len(response.strip()) < 20:
            return False, "Response too short"
        
        return True, "Valid"

# ==================== GROUNDING PROMPT ====================

QA_PROMPT_TEMPLATE = """You are Sally, an AI assistant specialized in Clinical Trial Supply Management (CTSM).

Your role is to help users with:
- Inventory analysis and stock management
- Protocol compliance and regulatory requirements  
- Supply chain optimization
- Clinical trial logistics
- Emergency scenarios and SOP guidance

STRICT RULES:
1. ONLY answer questions related to clinical trial supply management
2. Base answers ONLY on the provided context below
3. If context doesn't contain the answer, say "I don't have that information in the current database"
4. For data queries, generate ONLY SELECT statements (no modifications)
5. Cite specific sources when possible
6. Do not speculate or make up information

Context from knowledge base:
{context}

User Question: {question}

Grounded Response:"""

QA_PROMPT = PromptTemplate(
    template=QA_PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)

# ==================== PYDANTIC MODELS ====================

class QARequest(BaseModel):
    """Q&A request with optional configuration"""
    question: str = Field(..., min_length=3, max_length=500)
    llm_provider: Optional[str] = Field(default="openai", pattern="^(openai|anthropic|gemini)$")
    llm_model: Optional[str] = None
    use_rag: Optional[bool] = True
    max_tokens: Optional[int] = Field(default=1000, ge=100, le=4000)

class SQLExecuteRequest(BaseModel):
    """SQL execution request with validation"""
    sql: str = Field(..., min_length=10, max_length=5000)

class QAResponse(BaseModel):
    """Structured Q&A response"""
    answer: str
    sql_query: Optional[str] = None
    chart_suggestion: Optional[str] = None
    sources: Optional[List[str]] = []
    confidence: Optional[float] = None
    tokens_used: Optional[int] = None
    provider: str
    timestamp: str

# ==================== VECTOR STORE SETUP ====================

class VectorStoreManager:
    """Manages ChromaDB vector store for RAG"""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.vector_store = None
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """Initialize or load ChromaDB"""
        persist_directory = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        
        try:
            self.vector_store = Chroma(
                collection_name="sally_clinical_docs",
                embedding_function=self.embeddings,
                persist_directory=persist_directory
            )
            logger.info("Vector store initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise
    
    def add_documents(self, documents: List[Document]):
        """Add documents to vector store"""
        try:
            self.vector_store.add_documents(documents)
            logger.info(f"Added {len(documents)} documents to vector store")
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise
    
    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Search for similar documents"""
        try:
            return self.vector_store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []

# Initialize vector store manager
vector_store_manager = VectorStoreManager()

# ==================== DATABASE CONNECTION ====================

async def get_db_connection():
    """Get database connection (PostgreSQL or SQLite)"""
    db_type = os.getenv("DATABASE_TYPE", "sqlite")
    
    if db_type == "postgres":
        conn = await asyncpg.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", 5432)),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD"),
            database=os.getenv("POSTGRES_DB", "sally_tsm")
        )
        return conn
    else:
        # SQLite for development
        conn = sqlite3.connect(os.getenv("SQLITE_DB_PATH", "./sally_tsm.db"))
        return conn

# ==================== API ENDPOINTS ====================

@router.post("/ask-rag", response_model=QAResponse)
async def ask_with_rag(request: QARequest):
    """
    Enhanced Q&A with RAG, guardrails, and grounding
    
    Test: pytest backend/tests/test_qa_rag.py::test_ask_with_rag
    """
    try:
        # Initialize LLM
        llm = LLMConfig.get_llm(request.llm_provider, request.llm_model)
        
        # Retrieve context from vector store
        if request.use_rag:
            relevant_docs = vector_store_manager.similarity_search(
                request.question, 
                k=4
            )
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            sources = [doc.metadata.get("source", "Unknown") for doc in relevant_docs]
        else:
            context = "No context available"
            sources = []
        
        # Generate prompt with grounding
        prompt = QA_PROMPT.format(context=context, question=request.question)
        
        # Track token usage
        with get_openai_callback() as cb:
            response = llm.invoke(prompt)
            tokens_used = cb.total_tokens if hasattr(cb, 'total_tokens') else None
        
        answer = response.content
        
        # Apply response guardrails
        is_valid, validation_msg = ResponseGuardrail.validate_response(answer)
        if not is_valid:
            logger.warning(f"Response validation failed: {validation_msg}")
            answer = "I apologize, but I need more context to provide a reliable answer. Could you please rephrase your question?"
        
        return QAResponse(
            answer=answer,
            sources=sources if request.use_rag else [],
            tokens_used=tokens_used,
            provider=request.llm_provider,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Q&A with RAG failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute-sql")
async def execute_sql(request: SQLExecuteRequest):
    """
    Execute SQL query with strict guardrails
    
    Test: pytest backend/tests/test_qa_rag.py::test_execute_sql_guardrails
    """
    try:
        # Validate SQL with guardrails
        is_valid, validation_msg = SQLGuardrail.validate_sql(request.sql)
        if not is_valid:
            raise HTTPException(
                status_code=400, 
                detail=f"SQL validation failed: {validation_msg}"
            )
        
        # Execute query
        conn = await get_db_connection()
        
        if isinstance(conn, asyncpg.Connection):
            rows = await conn.fetch(request.sql)
            result = [dict(row) for row in rows]
            await conn.close()
        else:
            cursor = conn.cursor()
            cursor.execute(request.sql)
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            result = [dict(zip(columns, row)) for row in rows]
            conn.close()
        
        return {
            "success": True,
            "data": result,
            "row_count": len(result)
        }
        
    except Exception as e:
        logger.error(f"SQL execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest-documents")
async def ingest_documents(documents: List[Dict[str, str]]):
    """
    Ingest documents into vector store for RAG
    
    Expected format: [{"content": "...", "source": "...", "metadata": {...}}]
    
    Test: pytest backend/tests/test_qa_rag.py::test_ingest_documents
    """
    try:
        docs = [
            Document(
                page_content=doc["content"],
                metadata={"source": doc.get("source", "Unknown"), **doc.get("metadata", {})}
            )
            for doc in documents
        ]
        
        vector_store_manager.add_documents(docs)
        
        return {
            "success": True,
            "documents_added": len(docs),
            "message": "Documents ingested successfully"
        }
        
    except Exception as e:
        logger.error(f"Document ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "vector_store": "initialized" if vector_store_manager.vector_store else "not initialized",
        "timestamp": datetime.utcnow().isoformat()
    }
