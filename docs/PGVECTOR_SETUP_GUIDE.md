# Sally TSM: PostgreSQL pgvector Setup Guide

**Use Railway's PostgreSQL as your vector database!**

---

## Why pgvector?

- ✅ Uses your existing Railway PostgreSQL
- ✅ No additional service needed
- ✅ Persistent storage
- ✅ Free (included with Railway)
- ✅ Scales well (millions of vectors)
- ✅ Easy to backup

---

## Step 1: Enable pgvector Extension

### On Railway PostgreSQL

```bash
# Connect to Railway PostgreSQL
railway connect Postgres

# Or use psql directly
psql $DATABASE_URL
```

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

## Step 2: Create Embeddings Tables

```sql
-- Create embeddings table
CREATE TABLE document_embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1536),  -- OpenAI text-embedding-3-small dimension
    metadata JSONB DEFAULT '{}',
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create metadata index
CREATE INDEX idx_document_metadata ON document_embeddings USING gin(metadata);
```

---

## Step 3: Update Backend Code

### Replace ChromaDB with PGVector

**File:** `backend/routers/qa_rag.py`

```python
# OLD: ChromaDB
# from langchain_community.vectorstores import Chroma

# NEW: PGVector
from langchain_community.vectorstores import PGVector
from langchain_openai import OpenAIEmbeddings
import os

# Initialize embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")
)

# Initialize PGVector store
vector_store = PGVector(
    collection_name="sally_clinical_docs",
    connection_string=os.getenv("DATABASE_URL"),  # Railway provides this
    embedding_function=embeddings,
    distance_strategy="cosine"  # or "euclidean", "max_inner_product"
)
```

---

## Step 4: Update VectorStoreManager Class

```python
class VectorStoreManager:
    """Manages PGVector store for RAG"""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.vector_store = None
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """Initialize PGVector store"""
        try:
            connection_string = os.getenv("DATABASE_URL")
            
            # PGVector automatically creates tables if they don't exist
            self.vector_store = PGVector(
                collection_name="sally_clinical_docs",
                connection_string=connection_string,
                embedding_function=self.embeddings,
                distance_strategy="cosine",
                pre_delete_collection=False  # Don't delete existing data
            )
            
            logger.info("PGVector store initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PGVector store: {e}")
            raise
    
    def add_documents(self, documents: List[Document]):
        """Add documents to vector store"""
        try:
            self.vector_store.add_documents(documents)
            logger.info(f"Added {len(documents)} documents to PGVector")
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise
    
    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Search for similar documents"""
        try:
            return self.vector_store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []
    
    def similarity_search_with_score(self, query: str, k: int = 4):
        """Search with similarity scores"""
        try:
            return self.vector_store.similarity_search_with_score(query, k=k)
        except Exception as e:
            logger.error(f"Similarity search with score failed: {e}")
            return []
```

---

## Step 5: Update Requirements

**File:** `requirements_complete.txt`

Add:
```txt
# PGVector support
pgvector==0.2.4
psycopg2-binary==2.9.9  # Already included
```

---

## Step 6: Test PGVector Setup

### Test Script

```python
# test_pgvector.py
import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import PGVector
from langchain.schema import Document

# Set environment variables
os.environ["DATABASE_URL"] = "postgresql://user:pass@host:5432/db"
os.environ["OPENAI_API_KEY"] = "sk-your-key"

# Initialize
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = PGVector(
    collection_name="test_collection",
    connection_string=os.getenv("DATABASE_URL"),
    embedding_function=embeddings
)

# Add test documents
docs = [
    Document(
        page_content="Temperature excursions require immediate notification within 2 hours.",
        metadata={"source": "SOP-QA-008", "page": 5}
    ),
    Document(
        page_content="Emergency stock transfers must be approved by the supply chain manager.",
        metadata={"source": "SOP-CSM-005", "page": 12}
    )
]

vector_store.add_documents(docs)
print("✅ Documents added successfully")

# Test similarity search
results = vector_store.similarity_search("What to do during temperature excursion?", k=2)
print(f"✅ Found {len(results)} similar documents:")
for doc in results:
    print(f"  - {doc.page_content[:100]}...")
```

### Run Test

```bash
# On Railway
railway run python test_pgvector.py

# Or locally
python test_pgvector.py
```

---

## Step 7: Migration from ChromaDB to PGVector

If you already have data in ChromaDB:

```python
# migrate_chromadb_to_pgvector.py
from langchain_community.vectorstores import Chroma, PGVector
from langchain_openai import OpenAIEmbeddings
import os

# Load from ChromaDB
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
chroma_store = Chroma(
    collection_name="sally_clinical_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

# Get all documents
all_docs = chroma_store.get()

# Initialize PGVector
pgvector_store = PGVector(
    collection_name="sally_clinical_docs",
    connection_string=os.getenv("DATABASE_URL"),
    embedding_function=embeddings
)

# Migrate documents
from langchain.schema import Document

documents = [
    Document(
        page_content=content,
        metadata=metadata
    )
    for content, metadata in zip(all_docs['documents'], all_docs['metadatas'])
]

pgvector_store.add_documents(documents)
print(f"✅ Migrated {len(documents)} documents from ChromaDB to PGVector")
```

---

## Performance Comparison

| Feature | ChromaDB | PGVector |
|---------|----------|----------|
| **Setup** | Simple | Requires extension |
| **Storage** | File-based | PostgreSQL |
| **Persistence** | ⚠️ Ephemeral on Railway | ✅ Persistent |
| **Backup** | Manual | ✅ Auto with PostgreSQL |
| **Scaling** | Single server | ✅ PostgreSQL scaling |
| **Cost** | Free | Free (Railway PostgreSQL) |
| **Speed (1M vectors)** | Fast | Very fast |
| **Railway Integration** | ⚠️ Requires volume | ✅ Built-in |

---

## Similarity Search Methods

### 1. Cosine Similarity (Recommended)

```python
vector_store = PGVector(
    ...,
    distance_strategy="cosine"  # Range: -1 to 1 (1 = identical)
)
```

### 2. Euclidean Distance

```python
distance_strategy="euclidean"  # Lower = more similar
```

### 3. Max Inner Product

```python
distance_strategy="max_inner_product"  # Higher = more similar
```

---

## Advanced Features

### Filter by Metadata

```python
# Search only in specific source
results = vector_store.similarity_search(
    "temperature excursion protocol",
    k=4,
    filter={"source": "SOP-QA-008"}
)
```

### Search with Score Threshold

```python
# Only return results with similarity > 0.8
results = vector_store.similarity_search_with_score(
    "emergency transfer",
    k=10
)
filtered = [(doc, score) for doc, score in results if score > 0.8]
```

---

## Monitoring & Maintenance

### Check Vector Store Size

```sql
SELECT 
    COUNT(*) as document_count,
    pg_size_pretty(pg_total_relation_size('document_embeddings')) as table_size
FROM document_embeddings;
```

### View Recent Documents

```sql
SELECT 
    id,
    LEFT(content, 100) as content_preview,
    source,
    created_at
FROM document_embeddings
ORDER BY created_at DESC
LIMIT 10;
```

### Search Performance

```sql
-- Create index for better performance
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For large datasets (>1M vectors), increase lists
WITH (lists = 1000);
```

---

## Troubleshooting

### Issue: pgvector extension not found

```bash
# Check if pgvector is available
railway run psql $DATABASE_URL -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"

# If not available, contact Railway support or use ChromaDB
```

### Issue: Slow similarity search

```sql
-- Rebuild index with more lists
DROP INDEX IF EXISTS document_embeddings_embedding_idx;
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);

-- Vacuum and analyze
VACUUM ANALYZE document_embeddings;
```

### Issue: Connection errors

```python
# Add connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

connection_string = os.getenv("DATABASE_URL")
vector_store = PGVector(
    collection_name="sally_clinical_docs",
    connection_string=connection_string,
    embedding_function=embeddings,
    engine_kwargs={"poolclass": NullPool}  # Prevent connection pool issues
)
```

---

## Cost Comparison

| Vector DB | Setup | Storage | Compute | Total/Month |
|-----------|-------|---------|---------|-------------|
| **PGVector** | Free | $0 (Railway) | $0 | **$0** |
| ChromaDB | Free | $5 (Volume) | $0 | $5 |
| Pinecone | Free | Free (1M) | $0 | Free (limited) |
| Weaviate | Free | $25 | $25 | $50 |

**Winner: PGVector** (uses existing Railway PostgreSQL)

---

## Final Recommendation

✅ **Use PGVector on Railway PostgreSQL**

**Reasons:**
1. No additional cost
2. Persistent storage
3. Easy backup with PostgreSQL
4. Scales well (millions of vectors)
5. No external dependencies
6. Railway-optimized

---

## Next Steps

1. Enable pgvector extension on Railway
2. Run migration SQL script
3. Update backend code to use PGVector
4. Test document ingestion
5. Deploy to Railway

---

**Questions? See:**
- PGVector Docs: https://github.com/pgvector/pgvector
- LangChain PGVector: https://python.langchain.com/docs/integrations/vectorstores/pgvector
