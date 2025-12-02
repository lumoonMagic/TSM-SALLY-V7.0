"""
Natural Language to SQL Generator
Converts user questions to SQL queries using Gemini LLM
"""
from typing import Optional, Dict, Any
import os
import google.generativeai as genai
import json
from datetime import datetime


class NLToSQLGenerator:
    """Natural Language to SQL Generator using Gemini"""
    
    def __init__(self):
        """Initialize Gemini API"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')
    
    
    async def generate_sql(
        self, 
        question: str, 
        schema_context: Optional[str] = None,
        rag_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate SQL query from natural language question
        
        Args:
            question: User's natural language question
            schema_context: Database schema information
            rag_context: RAG-retrieved context
        
        Returns:
            Dict with sql_query, explanation, confidence_score
        """
        
        # Build prompt with schema and RAG context
        prompt = self._build_prompt(question, schema_context, rag_context)
        
        try:
            # Generate SQL using Gemini
            response = await self._call_gemini(prompt)
            
            # Parse response
            result = self._parse_response(response)
            
            return {
                "sql_query": result.get("sql_query", ""),
                "explanation": result.get("explanation", ""),
                "confidence_score": result.get("confidence_score", 0.0),
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "sql_query": "",
                "explanation": f"Failed to generate SQL: {str(e)}",
                "confidence_score": 0.0,
                "error": str(e)
            }
    
    
    def _build_prompt(
        self, 
        question: str, 
        schema_context: Optional[str], 
        rag_context: Optional[str]
    ) -> str:
        """Build comprehensive prompt for SQL generation"""
        
        prompt = f"""You are a PostgreSQL expert. Convert this question to a SQL query.

**USER QUESTION:**
{question}

**DATABASE SCHEMA:**
{schema_context or "No schema context provided"}

**RELEVANT CONTEXT (from RAG):**
{rag_context or "No additional context"}

**INSTRUCTIONS:**
1. Generate a valid PostgreSQL query
2. Use JOINs where necessary
3. Apply proper filters and aggregations
4. Return results in a clear format
5. Limit results to 100 rows unless specified
6. Respond ONLY in JSON format

**RESPONSE FORMAT:**
{{
  "sql_query": "SELECT ...",
  "explanation": "This query retrieves...",
  "confidence_score": 0.95
}}
"""
        return prompt
    
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API with retry logic"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API call failed: {str(e)}")
    
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini response and extract SQL query"""
        try:
            # Try to parse as JSON
            response_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            # Parse JSON
            result = json.loads(response_text)
            
            return {
                "sql_query": result.get("sql_query", ""),
                "explanation": result.get("explanation", ""),
                "confidence_score": float(result.get("confidence_score", 0.0))
            }
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract SQL directly
            if "SELECT" in response_text.upper():
                sql_query = self._extract_sql_from_text(response_text)
                return {
                    "sql_query": sql_query,
                    "explanation": "SQL extracted from unstructured response",
                    "confidence_score": 0.5
                }
            else:
                raise Exception(f"Failed to parse SQL response: {str(e)}")
    
    
    def _extract_sql_from_text(self, text: str) -> str:
        """Extract SQL query from plain text response"""
        # Find SELECT statement
        start_idx = text.upper().find("SELECT")
        if start_idx == -1:
            return ""
        
        # Find end of SQL (semicolon or end of text)
        end_idx = text.find(";", start_idx)
        if end_idx == -1:
            end_idx = len(text)
        
        sql_query = text[start_idx:end_idx].strip()
        return sql_query


# ============================================================================
# SCHEMA CONTEXT BUILDER
# ============================================================================

class SchemaContextBuilder:
    """Build schema context for SQL generation"""
    
    @staticmethod
    async def get_schema_context(db_pool) -> str:
        """Get database schema information"""
        try:
            async with db_pool.acquire() as conn:
                # Get table information
                tables_query = """
                SELECT 
                    table_name,
                    (SELECT COUNT(*) FROM information_schema.columns 
                     WHERE table_name = t.table_name) as column_count
                FROM information_schema.tables t
                WHERE table_schema = 'public'
                ORDER BY table_name;
                """
                tables = await conn.fetch(tables_query)
                
                # Get column information for each table
                schema_text = "**AVAILABLE TABLES:**\n\n"
                for table in tables[:10]:  # Limit to first 10 tables
                    table_name = table['table_name']
                    schema_text += f"- {table_name} ({table['column_count']} columns)\n"
                    
                    # Get columns
                    columns_query = f"""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                    ORDER BY ordinal_position
                    LIMIT 10;
                    """
                    columns = await conn.fetch(columns_query)
                    for col in columns:
                        schema_text += f"  - {col['column_name']} ({col['data_type']})\n"
                    schema_text += "\n"
                
                return schema_text
                
        except Exception as e:
            return f"Failed to retrieve schema: {str(e)}"
