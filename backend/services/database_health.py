"""
Database Health Monitoring Service
"""
from typing import Dict, Any
import asyncpg


class DatabaseHealthMonitor:
    """Monitor database health and performance"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def check_health(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        return {
            "connection": await self._check_connection(),
            "tables": await self._check_tables(),
            "indexes": await self._check_indexes(),
            "disk_space": await self._check_disk_space()
        }
    
    async def _check_connection(self) -> Dict[str, Any]:
        """Check database connection"""
        try:
            await self.db.fetchval("SELECT 1")
            return {"status": "healthy", "message": "Connection OK"}
        except Exception as e:
            return {"status": "unhealthy", "message": str(e)}
    
    async def _check_tables(self) -> Dict[str, Any]:
        """Check table health"""
        try:
            query = """
                SELECT COUNT(*) as table_count,
                       SUM(pg_total_relation_size(quote_ident(table_name)::regclass)) as total_size
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """
            result = await self.db.fetchrow(query)
            return {
                "status": "healthy",
                "table_count": result['table_count'],
                "total_size_mb": result['total_size'] / (1024 * 1024) if result['total_size'] else 0
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _check_indexes(self) -> Dict[str, Any]:
        """Check index health"""
        try:
            query = """
                SELECT COUNT(*) as index_count
                FROM pg_indexes
                WHERE schemaname = 'public'
            """
            count = await self.db.fetchval(query)
            return {"status": "healthy", "index_count": count}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space"""
        try:
            query = "SELECT pg_database_size(current_database()) as db_size"
            size = await self.db.fetchval(query)
            return {
                "status": "healthy",
                "database_size_mb": size / (1024 * 1024)
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
