"""
Schema Management Router
API endpoints for database schema deployment and management
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import asyncpg
from datetime import datetime

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SchemaDeployRequest(BaseModel):
    """Request model for schema deployment"""
    include_sample_data: bool = False
    applied_by: str = "api_user"
    

class SchemaValidationResponse(BaseModel):
    """Response model for schema validation"""
    valid: bool
    issues: List[str] = []
    warnings: List[str] = []
    table_count: int = 0
    estimated_deployment_time_seconds: int = 0


class SchemaStatusResponse(BaseModel):
    """Response model for schema status"""
    schema_deployed: bool
    current_version: Optional[str] = None
    table_count: int = 0
    total_records: int = 0
    last_deployment: Optional[str] = None
    tables: List[Dict[str, Any]] = []


class SchemaDeploymentResponse(BaseModel):
    """Response model for schema deployment"""
    success: bool
    message: str
    version: str
    tables_created: int
    sample_data_loaded: bool = False
    records_inserted: int = 0
    deployment_time_seconds: float


# ============================================================================
# DATABASE CONNECTION
# ============================================================================

async def get_db_connection():
    """Get database connection from environment"""
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

async def execute_sql_file(conn: asyncpg.Connection, file_path: str) -> Dict[str, Any]:
    """Execute SQL file and return results"""
    try:
        with open(file_path, 'r') as f:
            sql_content = f.read()
        
        start_time = datetime.now()
        
        # Execute SQL (PostgreSQL allows multiple statements)
        await conn.execute(sql_content)
        
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        
        return {
            "success": True,
            "execution_time": execution_time,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "execution_time": 0,
            "error": str(e)
        }


async def count_tables(conn: asyncpg.Connection) -> int:
    """Count number of tables in database"""
    query = """
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    """
    result = await conn.fetchval(query)
    return result


async def get_table_info(conn: asyncpg.Connection) -> List[Dict[str, Any]]:
    """Get information about all tables"""
    query = """
        SELECT 
            t.table_name,
            (SELECT COUNT(*) FROM information_schema.columns c 
             WHERE c.table_name = t.table_name) as column_count,
            pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as size
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    """
    try:
        results = await conn.fetch(query)
        tables = []
        
        for row in results:
            # Get row count for each table
            count_query = f"SELECT COUNT(*) FROM {row['table_name']}"
            try:
                row_count = await conn.fetchval(count_query)
            except:
                row_count = 0
            
            tables.append({
                "table_name": row['table_name'],
                "column_count": row['column_count'],
                "row_count": row_count,
                "size": row['size']
            })
        
        return tables
    except Exception as e:
        print(f"Error getting table info: {e}")
        return []


async def check_schema_exists(conn: asyncpg.Connection) -> bool:
    """Check if schema is already deployed"""
    try:
        count = await count_tables(conn)
        return count > 0
    except:
        return False


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/deploy", response_model=SchemaDeploymentResponse)
async def deploy_schema(request: SchemaDeployRequest):
    """
    Deploy complete database schema
    
    This endpoint:
    - Creates all 20+ tables
    - Sets up views and functions
    - Optionally loads sample data
    - Records schema version
    """
    conn = await get_db_connection()
    
    try:
        # Check if schema already exists
        if await check_schema_exists(conn):
            raise HTTPException(
                status_code=400,
                detail="Schema already deployed. Use /validate or drop existing tables first."
            )
        
        start_time = datetime.now()
        
        # Get SQL file path
        schema_file = os.path.join(
            os.path.dirname(__file__), 
            "../database/schema_postgresql.sql"
        )
        
        if not os.path.exists(schema_file):
            raise HTTPException(
                status_code=500,
                detail=f"Schema file not found: {schema_file}"
            )
        
        # Execute schema deployment
        result = await execute_sql_file(conn, schema_file)
        
        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Schema deployment failed: {result['error']}"
            )
        
        # Count created tables
        table_count = await count_tables(conn)
        
        # Load sample data if requested
        records_inserted = 0
        sample_data_loaded = False
        
        if request.include_sample_data:
            sample_file = os.path.join(
                os.path.dirname(__file__),
                "../database/sample_data.sql"
            )
            
            if os.path.exists(sample_file):
                sample_result = await execute_sql_file(conn, sample_file)
                if sample_result["success"]:
                    sample_data_loaded = True
                    # Count total records
                    tables = await get_table_info(conn)
                    records_inserted = sum(t['row_count'] for t in tables)
        
        end_time = datetime.now()
        deployment_time = (end_time - start_time).total_seconds()
        
        return SchemaDeploymentResponse(
            success=True,
            message="Schema deployed successfully",
            version="1.0.0",
            tables_created=table_count,
            sample_data_loaded=sample_data_loaded,
            records_inserted=records_inserted,
            deployment_time_seconds=deployment_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment error: {str(e)}")
    finally:
        await conn.close()


@router.post("/validate", response_model=SchemaValidationResponse)
async def validate_schema():
    """
    Validate schema before deployment
    
    Checks:
    - Database connectivity
    - Existing tables (warns if present)
    - Required permissions
    - Estimates deployment time
    """
    conn = await get_db_connection()
    
    try:
        issues = []
        warnings = []
        
        # Check if tables already exist
        existing_tables = await count_tables(conn)
        if existing_tables > 0:
            warnings.append(f"{existing_tables} tables already exist. Deployment will fail.")
            table_info = await get_table_info(conn)
            existing_names = [t['table_name'] for t in table_info]
            warnings.append(f"Existing tables: {', '.join(existing_names[:5])}" + 
                          ("..." if len(existing_names) > 5 else ""))
        
        # Check schema file exists
        schema_file = os.path.join(
            os.path.dirname(__file__),
            "../database/schema_postgresql.sql"
        )
        
        if not os.path.exists(schema_file):
            issues.append(f"Schema file not found: {schema_file}")
        
        # Check database permissions (try to create/drop a test table)
        try:
            await conn.execute("CREATE TABLE IF NOT EXISTS _test_permissions (id INT)")
            await conn.execute("DROP TABLE IF EXISTS _test_permissions")
        except Exception as e:
            issues.append(f"Insufficient database permissions: {str(e)}")
        
        # Estimate deployment time (based on file size and complexity)
        estimated_time = 30  # Base estimate: 30 seconds for schema
        if existing_tables == 0:
            estimated_time += 10  # Additional time for clean deployment
        
        return SchemaValidationResponse(
            valid=len(issues) == 0,
            issues=issues,
            warnings=warnings,
            table_count=20,  # Expected table count
            estimated_deployment_time_seconds=estimated_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")
    finally:
        await conn.close()


@router.get("/status", response_model=SchemaStatusResponse)
async def get_schema_status():
    """
    Get current schema deployment status
    
    Returns:
    - Whether schema is deployed
    - Current version
    - Table count and row counts
    - Last deployment timestamp
    """
    conn = await get_db_connection()
    
    try:
        schema_deployed = await check_schema_exists(conn)
        
        if not schema_deployed:
            return SchemaStatusResponse(
                schema_deployed=False,
                current_version=None,
                table_count=0,
                total_records=0,
                last_deployment=None,
                tables=[]
            )
        
        # Get current version
        version_query = """
            SELECT version_number, applied_at 
            FROM schema_versions 
            ORDER BY applied_at DESC 
            LIMIT 1
        """
        try:
            version_row = await conn.fetchrow(version_query)
            current_version = version_row['version_number'] if version_row else "unknown"
            last_deployment = version_row['applied_at'].isoformat() if version_row else None
        except:
            current_version = "unknown"
            last_deployment = None
        
        # Get table information
        tables = await get_table_info(conn)
        table_count = len(tables)
        total_records = sum(t['row_count'] for t in tables)
        
        return SchemaStatusResponse(
            schema_deployed=True,
            current_version=current_version,
            table_count=table_count,
            total_records=total_records,
            last_deployment=last_deployment,
            tables=tables
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check error: {str(e)}")
    finally:
        await conn.close()


@router.post("/sample-data")
async def load_sample_data():
    """
    Load sample data into deployed schema
    
    Requires schema to be deployed first
    """
    conn = await get_db_connection()
    
    try:
        # Check if schema exists
        if not await check_schema_exists(conn):
            raise HTTPException(
                status_code=400,
                detail="Schema not deployed. Deploy schema first using /deploy"
            )
        
        # Get sample data file
        sample_file = os.path.join(
            os.path.dirname(__file__),
            "../database/sample_data.sql"
        )
        
        if not os.path.exists(sample_file):
            raise HTTPException(
                status_code=500,
                detail=f"Sample data file not found: {sample_file}"
            )
        
        start_time = datetime.now()
        
        # Execute sample data
        result = await execute_sql_file(conn, sample_file)
        
        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Sample data loading failed: {result['error']}"
            )
        
        # Count loaded records
        tables = await get_table_info(conn)
        total_records = sum(t['row_count'] for t in tables)
        
        end_time = datetime.now()
        loading_time = (end_time - start_time).total_seconds()
        
        return {
            "success": True,
            "message": "Sample data loaded successfully",
            "records_inserted": total_records,
            "loading_time_seconds": loading_time,
            "tables_populated": len([t for t in tables if t['row_count'] > 0])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sample data loading error: {str(e)}")
    finally:
        await conn.close()


@router.get("/tables")
async def list_tables():
    """
    List all tables with row counts and sizes
    """
    conn = await get_db_connection()
    
    try:
        tables = await get_table_info(conn)
        
        return {
            "total_tables": len(tables),
            "total_records": sum(t['row_count'] for t in tables),
            "tables": tables
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing tables: {str(e)}")
    finally:
        await conn.close()


@router.get("/download")
async def download_schema():
    """
    Download current schema DDL
    
    Returns the SQL file content for backup/review
    """
    try:
        schema_file = os.path.join(
            os.path.dirname(__file__),
            "../database/schema_postgresql.sql"
        )
        
        if not os.path.exists(schema_file):
            raise HTTPException(status_code=404, detail="Schema file not found")
        
        with open(schema_file, 'r') as f:
            schema_content = f.read()
        
        return {
            "filename": "schema_postgresql.sql",
            "content": schema_content,
            "version": "1.0.0",
            "size_bytes": len(schema_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")
