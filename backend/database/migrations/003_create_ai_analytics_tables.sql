-- Migration 003: Create AI/Analytics Tables
-- Sally TSM - Clinical Trial Supply Management
-- Created: 2024-11-28
-- Database: PostgreSQL 17.7+

-- 14. QA_queries table - Q&A Assistant history
CREATE TABLE IF NOT EXISTS qa_queries (
    query_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    query_text TEXT NOT NULL,
    generated_sql TEXT,
    results_count INTEGER,
    chart_type VARCHAR(50),
    summary TEXT,
    recommendations JSONB,
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5)
);

-- 15. Morning_briefs table - Stored morning briefs
CREATE TABLE IF NOT EXISTS morning_briefs (
    brief_id SERIAL PRIMARY KEY,
    brief_date DATE NOT NULL UNIQUE,
    executive_summary TEXT,
    key_insights JSONB,
    priority_sites JSONB,
    critical_alerts JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(100),
    llm_prompt_tokens INTEGER,
    llm_completion_tokens INTEGER
);

-- 16. Evening_summaries table - Stored evening summaries
CREATE TABLE IF NOT EXISTS evening_summaries (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,
    achievements JSONB,
    metrics_vs_targets JSONB,
    issues_resolved JSONB,
    tomorrow_priorities JSONB,
    overnight_monitors JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(100),
    llm_prompt_tokens INTEGER,
    llm_completion_tokens INTEGER
);

-- 17. RAG_documents table - Vector embeddings for RAG
CREATE TABLE IF NOT EXISTS rag_documents (
    document_id SERIAL PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_content TEXT NOT NULL,
    embedding_vector VECTOR(1536),  -- OpenAI embeddings dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_indexed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chunk_index INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qa_queries_user_id ON qa_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_queries_created_at ON qa_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_morning_briefs_date ON morning_briefs(brief_date DESC);
CREATE INDEX IF NOT EXISTS idx_evening_summaries_date ON evening_summaries(summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_rag_documents_type ON rag_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_rag_documents_name ON rag_documents(document_name);

-- Create vector similarity search index (requires pgvector extension)
-- Uncomment if pgvector extension is installed:
-- CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding ON rag_documents USING ivfflat (embedding_vector vector_cosine_ops);

-- Migration complete
-- AI/Analytics tables (14-17) created with indexes
