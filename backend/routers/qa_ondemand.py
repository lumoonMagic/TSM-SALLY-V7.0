"""
On-Demand Q&A Router with RAG
Natural language questions with SQL generation and vector search
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import asyncpg
import json
from datetime import datetime
import hashlib

router = APIRouter(prefix="/api/v1/qa", tags=["Q&A"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class QARequest(BaseModel):
    """Request model for Q&A"""
    question: str
    mode: str = "production"  # "demo" or "production"
    use_rag: bool = True
    max_results: int = 100


class QAResponse(BaseModel):
    """Response model for Q&A"""
    question: str
    answer: str
    sql_query: Optional[str] = None
    sql_executed: bool = False
    execution_time_ms: int = 0
    result_count: int = 0
    data: List[Dict[str, Any]] = []
    rag_context: List[str] = []
    sources: List[str] = []
    confidence_score: float = 0.0
    mode: str


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

async def generate_sql_from_question(question: str, conn: asyncpg.Connection) -> str:
    """
    Generate SQL query from natural language question
    Uses LLM or simple pattern matching
    """
    # TODO: Integrate with LLM (Gemini/OpenAI) for better SQL generation
    # For now, use pattern matching for common queries
    
    question_lower = question.lower()
    
    # Pattern 1: "how many..." queries
    if "how many sites" in question_lower and "low inventory" in question_lower:
        return "SELECT COUNT(*) as count FROM gold_sites WHERE inventory_status IN ('Low', 'Critical')"
    
    if "how many studies" in question_lower:
        return "SELECT COUNT(*) as count FROM gold_studies WHERE status = 'Active'"
    
    # Pattern 2: "which/what..." queries
    if "which shipments" in question_lower and "delayed" in question_lower:
        return """
            SELECT shipment_id, shipment_number, to_site_id, 
                   estimated_delivery_date, shipment_status, risk_level
            FROM gold_shipments 
            WHERE shipment_status = 'Delayed'
            ORDER BY estimated_delivery_date
        """
    
    if "which sites" in question_lower and ("low" in question_lower or "critical" in question_lower):
        return """
            SELECT site_id, site_name, study_id, country, 
                   inventory_status, last_shipment_date
            FROM gold_sites 
            WHERE inventory_status IN ('Low', 'Critical')
            ORDER BY inventory_status DESC, last_shipment_date
        """
    
    # Pattern 3: "show me..." queries
    if "show" in question_lower and "inventory" in question_lower:
        return """
            SELECT i.site_id, s.site_name, i.product_id, p.product_name,
                   i.quantity_on_hand, i.quantity_available, i.expiry_date,
                   i.days_until_expiry
            FROM gold_inventory i
            JOIN gold_sites s ON i.site_id = s.site_id
            JOIN gold_products p ON i.product_id = p.product_id
            WHERE i.quantity_available < 50
            ORDER BY i.days_until_expiry
            LIMIT 20
        """
    
    if "high risk" in question_lower and "shipment" in question_lower:
        return """
            SELECT shipment_id, shipment_number, to_site_id, 
                   risk_level, risk_score, shipment_status,
                   estimated_delivery_date
            FROM gold_shipments
            WHERE risk_level IN ('High', 'Critical')
            ORDER BY risk_score DESC
        """
    
    # Pattern 4: Enrollment queries
    if "enrollment" in question_lower:
        return """
            SELECT study_id, study_name, target_enrollment, 
                   current_enrollment, 
                   ROUND((current_enrollment::float / NULLIF(target_enrollment, 0)) * 100, 2) as enrollment_pct
            FROM gold_studies
            WHERE status = 'Active'
            ORDER BY enrollment_pct DESC
        """
    
    # Default: Return a safe query that shows system overview
    return """
        SELECT 
            'Studies' as entity_type,
            COUNT(*) as count
        FROM gold_studies
        UNION ALL
        SELECT 'Sites', COUNT(*) FROM gold_sites
        UNION ALL
        SELECT 'Products', COUNT(*) FROM gold_products
        UNION ALL
        SELECT 'Shipments', COUNT(*) FROM gold_shipments
    """


async def execute_sql_query(sql: str, conn: asyncpg.Connection, max_results: int = 100) -> tuple:
    """Execute SQL query safely and return results"""
    start_time = datetime.now()
    
    try:
        # Add LIMIT to prevent large result sets
        if "LIMIT" not in sql.upper():
            sql = sql.strip().rstrip(';') + f" LIMIT {max_results}"
        
        results = await conn.fetch(sql)
        
        # Convert to list of dicts
        data = [dict(row) for row in results]
        
        # Convert datetime objects to strings
        for row in data:
            for key, value in row.items():
                if isinstance(value, datetime):
                    row[key] = value.isoformat()
        
        end_time = datetime.now()
        execution_time = int((end_time - start_time).total_seconds() * 1000)
        
        return True, data, execution_time
        
    except Exception as e:
        end_time = datetime.now()
        execution_time = int((end_time - start_time).total_seconds() * 1000)
        return False, str(e), execution_time


async def get_rag_context(question: str, conn: asyncpg.Connection) -> List[str]:
    """
    Get relevant context from vector database for RAG
    Requires embeddings to be generated first
    """
    # TODO: Generate embedding for question using OpenAI/Gemini
    # TODO: Search similar documents using vector similarity
    
    # For now, return relevant table documentation
    context = []
    
    question_lower = question.lower()
    
    if "inventory" in question_lower:
        context.append("gold_inventory table contains site-level stock information")
    
    if "shipment" in question_lower:
        context.append("gold_shipments table tracks all supply deliveries")
    
    if "site" in question_lower:
        context.append("gold_sites table contains clinical trial site information")
    
    if "study" in question_lower:
        context.append("gold_studies table contains clinical trial information")
    
    return context


def generate_answer_from_data(question: str, data: List[Dict], rag_context: List[str]) -> str:
    """Generate natural language answer from query results"""
    if not data:
        return "No results found for your question."
    
    # Count queries
    if len(data) == 1 and 'count' in data[0]:
        count = data[0]['count']
        return f"There are {count} records matching your query."
    
    # List queries
    if len(data) <= 5:
        # Small result set - provide detailed answer
        return f"Found {len(data)} results. " + (
            f"Context: {'; '.join(rag_context)}" if rag_context else ""
        )
    else:
        # Large result set - provide summary
        return f"Found {len(data)} results. The data includes various records from the database."


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
    mode: str
):
    """Log Q&A query to database"""
    try:
        query = """
            INSERT INTO rag_queries 
            (question, sql_generated, sql_executed, execution_time_ms, 
             result_count, answer, rag_context, confidence_score, mode)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """
        await conn.execute(
            query,
            question, sql, executed, execution_time,
            result_count, answer, rag_context, confidence, mode
        )
    except Exception as e:
        print(f"Warning: Failed to log Q&A query: {e}")


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/ask", response_model=QAResponse)
async def ask_question(request: QARequest):
    """
    Ask a natural language question
    
    - Generates SQL from question
    - Optionally uses RAG for context
    - Executes query and returns results
    - Generates natural language answer
    """
    conn = await get_db_connection()
    
    try:
        # Get RAG context if enabled
        rag_context = []
        if request.use_rag:
            rag_context = await get_rag_context(request.question, conn)
        
        # Generate SQL from question
        sql_query = await generate_sql_from_question(request.question, conn)
        
        # Execute SQL
        success, result, execution_time = await execute_sql_query(
            sql_query, conn, request.max_results
        )
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Query execution failed: {result}"
            )
        
        data = result
        
        # Generate natural language answer
        answer = generate_answer_from_data(request.question, data, rag_context)
        
        # Calculate confidence (simple heuristic for now)
        confidence = 0.9 if len(data) > 0 else 0.3
        
        # Identify data sources
        sources = []
        if "FROM" in sql_query:
            # Extract table names from SQL
            import re
            tables = re.findall(r'FROM\s+(\w+)', sql_query, re.IGNORECASE)
            sources = list(set(tables))
        
        # Log query
        await log_qa_query(
            conn, request.question, sql_query, True,
            execution_time, len(data), answer, rag_context,
            confidence, request.mode
        )
        
        return QAResponse(
            question=request.question,
            answer=answer,
            sql_query=sql_query,
            sql_executed=True,
            execution_time_ms=execution_time,
            result_count=len(data),
            data=data[:50],  # Return max 50 rows in response
            rag_context=rag_context,
            sources=sources,
            confidence_score=confidence,
            mode=request.mode
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A error: {str(e)}")
    finally:
        await conn.close()


@router.get("/history", response_model=QAHistoryResponse)
async def get_qa_history(limit: int = 20, mode: Optional[str] = None):
    """Get Q&A query history"""
    conn = await get_db_connection()
    
    try:
        query = """
            SELECT query_id, question, answer, sql_generated,
                   result_count, confidence_score, mode,
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
    """Submit feedback on Q&A answer quality"""
    conn = await get_db_connection()
    
    try:
        query = """
            UPDATE rag_queries
            SET helpful_feedback = $1, user_comments = $2
            WHERE query_id = $3
        """
        await conn.execute(query, helpful, comments, query_id)
        
        return {
            "success": True,
            "message": "Feedback submitted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")
    finally:
        await conn.close()
