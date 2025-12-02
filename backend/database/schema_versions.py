"""
Schema Version Management
Tracks database schema versions and migrations
"""
from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel


class SchemaVersion(BaseModel):
    """Schema version model"""
    version_id: Optional[int] = None
    version_number: str
    description: str
    applied_at: Optional[datetime] = None
    applied_by: str
    rollback_sql: Optional[str] = None


class SchemaVersionManager:
    """Manages schema versions and migrations"""
    
    CURRENT_VERSION = "1.0.0"
    
    def __init__(self, db_connection):
        """
        Initialize schema version manager
        
        Args:
            db_connection: Database connection pool
        """
        self.db = db_connection
    
    async def get_current_version(self) -> Optional[SchemaVersion]:
        """Get the current schema version from database"""
        query = """
            SELECT version_id, version_number, description, 
                   applied_at, applied_by, rollback_sql
            FROM schema_versions
            ORDER BY applied_at DESC
            LIMIT 1
        """
        try:
            result = await self.db.fetchrow(query)
            if result:
                return SchemaVersion(
                    version_id=result['version_id'],
                    version_number=result['version_number'],
                    description=result['description'],
                    applied_at=result['applied_at'],
                    applied_by=result['applied_by'],
                    rollback_sql=result['rollback_sql']
                )
            return None
        except Exception as e:
            print(f"Error getting current version: {e}")
            return None
    
    async def get_all_versions(self) -> List[SchemaVersion]:
        """Get all schema versions"""
        query = """
            SELECT version_id, version_number, description,
                   applied_at, applied_by, rollback_sql
            FROM schema_versions
            ORDER BY applied_at DESC
        """
        try:
            results = await self.db.fetch(query)
            return [
                SchemaVersion(
                    version_id=row['version_id'],
                    version_number=row['version_number'],
                    description=row['description'],
                    applied_at=row['applied_at'],
                    applied_by=row['applied_by'],
                    rollback_sql=row['rollback_sql']
                )
                for row in results
            ]
        except Exception as e:
            print(f"Error getting versions: {e}")
            return []
    
    async def record_version(
        self,
        version_number: str,
        description: str,
        applied_by: str = "system",
        rollback_sql: Optional[str] = None
    ) -> bool:
        """
        Record a new schema version
        
        Args:
            version_number: Version number (e.g., "1.0.0")
            description: Description of changes
            applied_by: Who applied the schema
            rollback_sql: SQL to rollback this version (optional)
            
        Returns:
            True if successful, False otherwise
        """
        query = """
            INSERT INTO schema_versions 
            (version_number, description, applied_by, rollback_sql)
            VALUES ($1, $2, $3, $4)
            RETURNING version_id
        """
        try:
            result = await self.db.fetchrow(
                query,
                version_number,
                description,
                applied_by,
                rollback_sql
            )
            return result is not None
        except Exception as e:
            print(f"Error recording version: {e}")
            return False
    
    async def validate_version(self, expected_version: str) -> bool:
        """
        Validate that current schema matches expected version
        
        Args:
            expected_version: Expected version number
            
        Returns:
            True if versions match, False otherwise
        """
        current = await self.get_current_version()
        if not current:
            return False
        return current.version_number == expected_version
    
    async def check_schema_exists(self) -> bool:
        """Check if schema_versions table exists"""
        query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'schema_versions'
            )
        """
        try:
            result = await self.db.fetchval(query)
            return result
        except Exception as e:
            print(f"Error checking schema: {e}")
            return False
    
    def get_version_history_summary(self, versions: List[SchemaVersion]) -> Dict:
        """Generate summary of version history"""
        if not versions:
            return {
                "total_versions": 0,
                "current_version": None,
                "first_deployment": None,
                "last_deployment": None
            }
        
        return {
            "total_versions": len(versions),
            "current_version": versions[0].version_number if versions else None,
            "first_deployment": versions[-1].applied_at if versions else None,
            "last_deployment": versions[0].applied_at if versions else None,
            "versions": [
                {
                    "version": v.version_number,
                    "description": v.description,
                    "applied_at": v.applied_at.isoformat() if v.applied_at else None,
                    "applied_by": v.applied_by
                }
                for v in versions
            ]
        }
