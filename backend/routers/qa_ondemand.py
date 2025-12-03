"""
On-Demand Q&A Router with LLM-Powered RAG
Natural language questions with dynamic SQL generation via Gemini 2.5 Flash
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import asyncpg
import json
from datetime import datetime
import hashlib

# Import the enhanced RAG service
from backend.services.rag_sql_service import get_rag_service
from backend.config import get_config

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class QARequest(BaseModel):
    """Request model for Q&A"""
    question: str
    mode: str = "production"  # "demo" or "production"
    use_rag: bool = True
    max_results: int = 100
    filters: Optional[Dict[str, Any]] = None  # Optional filters (study_id, site_id, etc.)


class QAResponse(BaseModel):
    """Enhanced response model for Q&A with LLM insights"""
    question: str
    answer: str  # Natural language answer
    
    # SQL details
    sql_query: Optional[str] = None
    sql_executed: bool = False
    execution_time_ms: int = 0
    result_count: int = 0
    
    # LLM-enhanced response
    text_summary: Optional[str] = None  # Natural language summary
    insights: List[str] = []  # Key insights from data
    visualizations: List[Dict[str, Any]] = []  # Recommended charts
    recommendations: List[str] = []  # Actionable recommendations
    kpis: List[Dict[str, Any]] = []  # Calculated KPIs
    
    # Raw data
    data: List[Dict[str, Any]] = []
    
    # Metadata
    rag_context: List[str] = []
    sources: List[str] = []
    confidence_score: float = 0.0
    mode: str
    llm_enabled: bool = False


class QAHistoryResponse(BaseModel):
    """Response model for Q&A history"""
    total_queries: int
    queries: List[Dict[str, Any]]


# ============================================================================
# DATABASE CONNECTION
# ============================================================================

async def get_db_connection():
    """Get database connection"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    
    try:
        conn = await asyncpg.connect(database_url)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def log_qa_query(
    conn: asyncpg.Connection,
    question: str,
    sql: str,
    executed: bool,
    execution_time: int,
    result_count: int,
    answer: str,
    rag_context: List[str],
    confidence: float,
    mode: str,
    llm_enabled: bool = False
):
    """Log Q&A query to database"""
    try:
        # Check if table exists first
        check_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'rag_queries'
            )
        """
        table_exists = await conn.fetchval(check_query)
        
        if not table_exists:
            # Create table if it doesn't exist
            create_query = """
                CREATE TABLE IF NOT EXISTS rag_queries (
                    query_id SERIAL PRIMARY KEY,
                    question TEXT NOT NULL,
                    sql_generated TEXT,
                    sql_executed BOOLEAN DEFAULT false,
                    execution_time_ms INTEGER,
                    result_count INTEGER,
                    answer TEXT,
                    rag_context TEXT[],
                    confidence_score DECIMAL(3,2),
                    mode VARCHAR(20),
                    llm_enabled BOOLEAN DEFAULT false,
                    helpful_feedback BOOLEAN,
                    user_comments TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            await conn.execute(create_query)
        
        # Insert query log
        insert_query = """
            INSERT INTO rag_queries 
            (question, sql_generated, sql_executed, execution_time_ms, 
             result_count, answer, rag_context, confidence_score, mode, llm_enabled)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """
        await conn.execute(
            insert_query,
            question, sql, executed, execution_time,
            result_count, answer, rag_context, confidence, mode, llm_enabled
        )
    except Exception as e:
        print(f"⚠️ Warning: Failed to log Q&A query: {e}")


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/ask", response_model=QAResponse)
async def ask_question(request: QARequest):
    """
    Ask a natural language question with LLM-powered response
    
    Features:
    - Dynamic SQL generation for ANY question (via Gemini 2.5 Flash)
    - LLM-generated insights and recommendations
    - Visualization recommendations
    - Natural language summaries
    - Backward compatible with pattern-based fallback
    
    Examples:
    - "Show me sites with temperature excursions in last 30 days"
    - "Which studies have enrollment below 50% of target?"
    - "Find products expiring in next month"
    - ANY question you can think of!
    """
    # Get configuration
    config = get_config()
    llm_enabled = config.llm.enabled
    
    # Get RAG service (now LLM-powered!)
    rag_service = get_rag_service()
    
    # Database connection for logging
    conn = await get_db_connection()
    
    try:
        # Step 1: Generate and execute SQL using LLM-powered RAG service
        query_result = await rag_service.generate_and_execute_sql(
            question=request.question,
            mode=request.mode,
            query_type=None,  # Let LLM figure it out
            filters=request.filters
        )
        
        # Check for errors
        if "error" in query_result:
            raise HTTPException(
                status_code=400,
                detail=f"Query execution failed: {query_result['error']}"
            )
        
        # Extract results
        sql_query = query_result.get("query_used", "")
        data = query_result.get("rows", [])
        result_count = query_result.get("row_count", 0)
        execution_time = 0  # Not tracked in current implementation
        
        # Step 2: Format response with insights (if LLM enabled and requested)
        if llm_enabled and config.rag.enable_response_formatting:
            formatted_response = await rag_service.format_response_with_insights(
                query_results=query_result,
                question=request.question
            )
            
            # Extract formatted components
            text_summary = formatted_response.get("text_summary", "")
            insights = formatted_response.get("insights", [])
            visualizations = formatted_response.get("visualizations", [])
            recommendations = formatted_response.get("recommendations", [])
            kpis = formatted_response.get("kpis", [])
            
            # Use text summary as answer
            answer = text_summary if text_summary else f"Query returned {result_count} results."
            confidence = 0.9 if result_count > 0 else 0.5
            
        else:
            # Basic response without LLM formatting
            text_summary = None
            insights = []
            visualizations = []
            recommendations = []
            kpis = []
            answer = f"Query returned {result_count} results."
            confidence = 0.7 if result_count > 0 else 0.3
        
        # Step 3: Identify data sources from SQL
        sources = []
        if sql_query and "FROM" in sql_query.upper():
            import re
            # Extract table names (with gold_ prefix)
            tables = re.findall(r'FROM\s+(gold_\w+)', sql_query, re.IGNORECASE)
            tables.extend(re.findall(r'JOIN\s+(gold_\w+)', sql_query, re.IGNORECASE))
            sources = list(set(tables))
        
        # Step 4: Get RAG context (currently just indicates data model was used)
        rag_context = []
        if request.use_rag and llm_enabled:
            rag_context = [
                "Data model metadata used for query understanding",
                "Business rules applied for accurate results",
                "Schema context provided to LLM"
            ]
        
        # Step 5: Log query
        await log_qa_query(
            conn, request.question, sql_query, True,
            execution_time, result_count, answer, rag_context,
            confidence, request.mode, llm_enabled
        )
        
        # Step 6: Return enhanced response
        return QAResponse(
            question=request.question,
            answer=answer,
            sql_query=sql_query,
            sql_executed=True,
            execution_time_ms=execution_time,
            result_count=result_count,
            text_summary=text_summary,
            insights=insights,
            visualizations=visualizations,
            recommendations=recommendations,
            kpis=kpis,
            data=data[:50],  # Return max 50 rows in response (full data available via export)
            rag_context=rag_context,
            sources=sources,
            confidence_score=confidence,
            mode=request.mode,
            llm_enabled=llm_enabled
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A error: {str(e)}")
    finally:
        await conn.close()


@router.get("/history", response_model=QAHistoryResponse)
async def get_qa_history(limit: int = 20, mode: Optional[str] = None):
    """
    Get Q&A query history
    
    Parameters:
    - limit: Maximum number of queries to return (default: 20)
    - mode: Filter by mode ("demo" or "production", optional)
    """
    conn = await get_db_connection()
    
    try:
        # Check if table exists
        check_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'rag_queries'
            )
        """
        table_exists = await conn.fetchval(check_query)
        
        if not table_exists:
            # Return empty history if table doesn't exist yet
            return QAHistoryResponse(
                total_queries=0,
                queries=[]
            )
        
        # Build query
        query = """
            SELECT query_id, question, answer, sql_generated,
                   result_count, confidence_score, mode, llm_enabled,
                   created_at
            FROM rag_queries
        """
        
        if mode:
            query += f" WHERE mode = '{mode}'"
        
        query += f" ORDER BY created_at DESC LIMIT {limit}"
        
        results = await conn.fetch(query)
        
        queries = []
        for row in results:
            queries.append({
                "query_id": row['query_id'],
                "question": row['question'],
                "answer": row['answer'],
                "sql_generated": row['sql_generated'],
                "result_count": row['result_count'],
                "confidence_score": float(row['confidence_score']) if row['confidence_score'] else 0.0,
                "mode": row['mode'],
                "llm_enabled": row.get('llm_enabled', False),
                "created_at": row['created_at'].isoformat()
            })
        
        return QAHistoryResponse(
            total_queries=len(queries),
            queries=queries
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")
    finally:
        await conn.close()


@router.post("/feedback")
async def submit_feedback(query_id: int, helpful: bool, comments: Optional[str] = None):
    """
    Submit feedback on Q&A answer quality
    
    Parameters:
    - query_id: ID of the query to provide feedback on
    - helpful: Whether the answer was helpful (true/false)
    - comments: Optional text comments
    """
    conn = await get_db_connection()
    
    try:
        query = """
            UPDATE rag_queries
            SET helpful_feedback = $1, user_comments = $2
            WHERE query_id = $3
        """
        result = await conn.execute(query, helpful, comments, query_id)
        
        return {
            "success": True,
            "message": "Feedback submitted successfully",
            "query_id": query_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")
    finally:
        await conn.close()


@router.get("/health")
async def qa_health():
    """Health check for Q&A service"""
    config = get_config()
    rag_service = get_rag_service()
    
    return {
        "service": "qa_ondemand",
        "status": "healthy",
        "llm_enabled": config.llm.enabled,
        "llm_provider": config.llm.provider if config.llm.enabled else "none",
        "llm_model": config.llm.model if config.llm.enabled else "none",
        "rag_features": {
            "response_formatting": config.rag.enable_response_formatting,
            "insights": config.rag.enable_insights,
            "visualizations": config.rag.enable_visualizations,
            "embeddings": config.rag.enable_embeddings
        },
        "timestamp": datetime.now().isoformat()
    }
