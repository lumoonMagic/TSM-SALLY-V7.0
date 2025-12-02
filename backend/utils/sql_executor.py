"""
Safe SQL Execution Utility
"""
from typing import Any, Dict, List, Optional
import asyncpg


class SQLExecutor:
    """Execute SQL safely with error handling"""
    
    def __init__(self, connection: asyncpg.Connection):
        self.conn = connection
    
    async def execute_file(self, file_path: str) -> Dict[str, Any]:
        """Execute SQL from file"""
        try:
            with open(file_path, 'r') as f:
                sql = f.read()
            
            await self.conn.execute(sql)
            
            return {
                "success": True,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def execute_query(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute query and return results"""
        try:
            results = await self.conn.fetch(query, *args)
            return [dict(row) for row in results]
        except Exception as e:
            raise Exception(f"Query execution failed: {str(e)}")
    
    async def execute_scalar(self, query: str, *args) -> Any:
        """Execute query and return single value"""
        try:
            return await self.conn.fetchval(query, *args)
        except Exception as e:
            raise Exception(f"Scalar query failed: {str(e)}")
