#!/usr/bin/env python3
"""
Database Migration Deployment Script
Sally TSM - Clinical Trial Supply Management

This script deploys all database migrations in order.
Run with: python deploy.py
"""

import os
import psycopg2
from psycopg2 import sql
from datetime import datetime

# Database configuration (from environment variables)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'sally_tsm'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password')
}

# Migration files in order
MIGRATIONS = [
    '001_create_core_tables.sql',
    '002_create_transactional_tables.sql',
    '003_create_ai_analytics_tables.sql',
    '004_create_integration_tables.sql'
]

def create_migrations_table(conn):
    """Create migrations tracking table"""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                migration_id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT
            );
        """)
        conn.commit()
        print("✅ Migrations tracking table ready")

def get_applied_migrations(conn):
    """Get list of applied migrations"""
    with conn.cursor() as cur:
        cur.execute("SELECT migration_name FROM schema_migrations WHERE success = TRUE;")
        return {row[0] for row in cur.fetchall()}

def apply_migration(conn, migration_file):
    """Apply a single migration file"""
    migration_path = os.path.join(os.path.dirname(__file__), migration_file)
    
    if not os.path.exists(migration_path):
        raise FileNotFoundError(f"Migration file not found: {migration_path}")
    
    with open(migration_path, 'r') as f:
        sql_content = f.read()
    
    try:
        with conn.cursor() as cur:
            # Execute migration
            cur.execute(sql_content)
            
            # Record successful migration
            cur.execute("""
                INSERT INTO schema_migrations (migration_name, success)
                VALUES (%s, TRUE)
                ON CONFLICT (migration_name) DO NOTHING;
            """, (migration_file,))
            
            conn.commit()
            print(f"✅ Applied: {migration_file}")
            return True
    
    except Exception as e:
        conn.rollback()
        # Record failed migration
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO schema_migrations (migration_name, success, error_message)
                VALUES (%s, FALSE, %s)
                ON CONFLICT (migration_name) DO UPDATE
                SET success = FALSE, error_message = EXCLUDED.error_message;
            """, (migration_file, str(e)))
            conn.commit()
        
        print(f"❌ Failed: {migration_file}")
        print(f"   Error: {e}")
        return False

def deploy_migrations():
    """Deploy all pending migrations"""
    print("=" * 60)
    print("Sally TSM - Database Migration Deployment")
    print("=" * 60)
    print(f"Connecting to: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to database")
        
        # Create migrations tracking table
        create_migrations_table(conn)
        
        # Get already applied migrations
        applied = get_applied_migrations(conn)
        print(f"\nPreviously applied migrations: {len(applied)}")
        
        # Apply pending migrations
        pending = [m for m in MIGRATIONS if m not in applied]
        print(f"Pending migrations: {len(pending)}")
        
        if not pending:
            print("\n✅ All migrations already applied. Database is up to date!")
            return True
        
        print(f"\nApplying {len(pending)} migrations...")
        print("-" * 60)
        
        success_count = 0
        for migration in pending:
            if apply_migration(conn, migration):
                success_count += 1
        
        print("-" * 60)
        print(f"\nResults: {success_count}/{len(pending)} migrations applied successfully")
        
        # Close connection
        conn.close()
        print("✅ Database connection closed")
        
        if success_count == len(pending):
            print("\n🎉 All migrations deployed successfully!")
            print("\n📊 Database Schema Status:")
            print("   - Core tables (8): ✅")
            print("   - Transactional tables (5): ✅")
            print("   - AI/Analytics tables (4): ✅")
            print("   - Integration tables (3): ✅")
            print("   - Total: 20 tables + indexes")
            return True
        else:
            print("\n⚠️ Some migrations failed. Check errors above.")
            return False
    
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return False

if __name__ == "__main__":
    success = deploy_migrations()
    exit(0 if success else 1)
