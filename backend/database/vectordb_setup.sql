-- ============================================================================
-- Sally TSM - PGVector Setup for RAG
-- Version: 1.0.0
-- Purpose: Enable vector search capabilities for RAG Q&A
-- Requires: PostgreSQL 14+ with pgvector extension
-- ============================================================================

-- Enable PGVector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to existing vector_documents table
ALTER TABLE vector_documents 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_vector_documents_embedding 
ON vector_documents 
USING hnsw (embedding vector_cosine_ops);

-- Alternative: IVFFlat index (faster build, slightly slower query)
-- CREATE INDEX IF NOT EXISTS idx_vector_documents_embedding 
-- ON vector_documents 
-- USING ivfflat (embedding vector_cosine_ops) 
-- WITH (lists = 100);

-- Function to search similar documents
CREATE OR REPLACE FUNCTION search_similar_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    document_id int,
    content text,
    document_type varchar,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vd.document_id,
        vd.content,
        vd.document_type,
        1 - (vd.embedding <=> query_embedding) as similarity,
        vd.metadata
    FROM vector_documents vd
    WHERE vd.embedding IS NOT NULL
        AND 1 - (vd.embedding <=> query_embedding) > match_threshold
    ORDER BY vd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get document by ID with embedding
CREATE OR REPLACE FUNCTION get_document_with_embedding(doc_id int)
RETURNS TABLE (
    document_id int,
    content text,
    embedding vector(1536),
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vd.document_id,
        vd.content,
        vd.embedding,
        vd.metadata
    FROM vector_documents vd
    WHERE vd.document_id = doc_id;
END;
$$;

-- Create table for RAG context cache (optional optimization)
CREATE TABLE IF NOT EXISTS rag_context_cache (
    cache_id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64) UNIQUE NOT NULL,
    query_text TEXT NOT NULL,
    context_documents JSONB NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_cache_hash ON rag_context_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_rag_cache_accessed ON rag_context_cache(last_accessed_at);

-- Function to cleanup old cache entries
CREATE OR REPLACE FUNCTION cleanup_rag_cache(days_old int DEFAULT 7)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM rag_context_cache
    WHERE last_accessed_at < NOW() - (days_old || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Update schema version
INSERT INTO schema_versions (version_number, description, applied_by)
VALUES ('1.1.0', 'PGVector setup for RAG functionality', 'system')
ON CONFLICT DO NOTHING;

-- Verify setup
DO $$
DECLARE
    extension_exists boolean;
    column_exists boolean;
    index_exists boolean;
BEGIN
    -- Check extension
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) INTO extension_exists;
    
    -- Check embedding column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vector_documents' 
        AND column_name = 'embedding'
    ) INTO column_exists;
    
    -- Check index
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'vector_documents' 
        AND indexname = 'idx_vector_documents_embedding'
    ) INTO index_exists;
    
    RAISE NOTICE 'PGVector Setup Complete!';
    RAISE NOTICE 'Extension enabled: %', extension_exists;
    RAISE NOTICE 'Embedding column added: %', column_exists;
    RAISE NOTICE 'Vector index created: %', index_exists;
    
    IF extension_exists AND column_exists AND index_exists THEN
        RAISE NOTICE '✅ All PGVector components ready!';
    ELSE
        RAISE WARNING '⚠️ Some components missing. Check logs.';
    END IF;
END $$;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON vector_documents TO your_app_user;
-- GRANT EXECUTE ON FUNCTION search_similar_documents TO your_app_user;
