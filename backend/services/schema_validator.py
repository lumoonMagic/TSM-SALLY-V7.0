"""
Schema Validator Service
Pre-deployment validation checks
"""
from typing import List, Dict, Any
import os


class SchemaValidator:
    """Validates schema before deployment"""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
    
    async def validate_all(self, db_connection) -> Dict[str, Any]:
        """Run all validation checks"""
        self.issues = []
        self.warnings = []
        
        # Check 1: Database connectivity
        await self._check_connectivity(db_connection)
        
        # Check 2: Existing tables
        await self._check_existing_tables(db_connection)
        
        # Check 3: Permissions
        await self._check_permissions(db_connection)
        
        # Check 4: Schema file exists
        self._check_schema_file()
        
        return {
            "valid": len(self.issues) == 0,
            "issues": self.issues,
            "warnings": self.warnings
        }
    
    async def _check_connectivity(self, conn):
        """Check database connection"""
        try:
            await conn.fetchval("SELECT 1")
        except Exception as e:
            self.issues.append(f"Database connection failed: {str(e)}")
    
    async def _check_existing_tables(self, conn):
        """Check for existing tables"""
        try:
            query = """
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public'
            """
            count = await conn.fetchval(query)
            if count > 0:
                self.warnings.append(f"{count} existing tables found. May cause conflicts.")
        except Exception as e:
            self.warnings.append(f"Could not check existing tables: {str(e)}")
    
    async def _check_permissions(self, conn):
        """Check database permissions"""
        try:
            await conn.execute("CREATE TABLE IF NOT EXISTS _test_perm (id INT)")
            await conn.execute("DROP TABLE _test_perm")
        except Exception as e:
            self.issues.append(f"Insufficient permissions: {str(e)}")
    
    def _check_schema_file(self):
        """Check if schema file exists"""
        schema_path = os.path.join(
            os.path.dirname(__file__),
            "../database/schema_postgresql.sql"
        )
        if not os.path.exists(schema_path):
            self.issues.append(f"Schema file not found: {schema_path}")
