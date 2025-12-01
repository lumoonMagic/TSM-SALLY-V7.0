# 🌐 Google Cloud Vector Database Integration Guide

This guide covers integrating Google Cloud vector database services with the Sally TSM application.

---

## 🚀 Google Cloud Vector Storage Options

### Option 1: Vertex AI Vector Search (RECOMMENDED)
**Best for:** Production-scale, managed vector search

#### **Features:**
- ✅ Fully managed by Google Cloud
- ✅ Native integration with Vertex AI
- ✅ Automatic scaling
- ✅ High performance (millisecond latency)
- ✅ Multi-region support
- ✅ Built-in monitoring

#### **Pricing:**
- Index storage: $0.25/GB/month
- Query: $0.50 per 1M queries
- Free tier: Not available

#### **Setup Steps:**

**1. Enable Vertex AI API:**
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable compute.googleapis.com
```

**2. Create Vector Index:**
```python
from google.cloud import aiplatform

# Initialize Vertex AI
aiplatform.init(
    project="YOUR_PROJECT_ID",
    location="us-central1"
)

# Create index
index = aiplatform.MatchingEngineIndex.create(
    display_name="sally-tsm-vector-index",
    description="Clinical trial supply management documents",
    dimensions=768,  # For Gemini embeddings
    distance_measure_type="DOT_PRODUCT_DISTANCE",
    shard_size="SHARD_SIZE_SMALL"
)
```

**3. Update Backend Configuration:**

Add to `backend/ai/vertex_ai_vector_store.py`:
```python
"""
Vertex AI Vector Search Integration
"""
from google.cloud import aiplatform
from langchain.vectorstores.base import VectorStore
from typing import List, Tuple

class VertexAIVectorStore(VectorStore):
    def __init__(
        self,
        project_id: str,
        location: str,
        index_id: str,
        endpoint_id: str,
        embeddings
    ):
        self.project_id = project_id
        self.location = location
        self.index_id = index_id
        self.endpoint_id = endpoint_id
        self.embeddings = embeddings
        
        aiplatform.init(project=project_id, location=location)
        self.index = aiplatform.MatchingEngineIndex(index_id)
        self.endpoint = aiplatform.MatchingEngineIndexEndpoint(endpoint_id)
    
    def add_texts(
        self,
        texts: List[str],
        metadatas: List[dict] = None,
        **kwargs
    ) -> List[str]:
        """Add texts to index"""
        embeddings = self.embeddings.embed_documents(texts)
        
        # Convert to Vertex AI format
        datapoints = []
        for i, (text, embedding) in enumerate(zip(texts, embeddings)):
            datapoint = {
                "datapoint_id": f"doc_{i}",
                "feature_vector": embedding,
                "restricts": metadatas[i] if metadatas else {}
            }
            datapoints.append(datapoint)
        
        # Batch upsert
        self.index.upsert_datapoints(datapoints)
        return [dp["datapoint_id"] for dp in datapoints]
    
    def similarity_search(
        self,
        query: str,
        k: int = 4,
        **kwargs
    ) -> List[Tuple[str, float]]:
        """Search for similar documents"""
        query_embedding = self.embeddings.embed_query(query)
        
        # Query endpoint
        response = self.endpoint.find_neighbors(
            deployed_index_id=self.index_id,
            queries=[query_embedding],
            num_neighbors=k
        )
        
        return [(n.id, n.distance) for n in response[0]]
```

**4. Update Environment Variables:**
```bash
# Railway/Vercel environment variables
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
VERTEX_AI_INDEX_ID=your-index-id
VERTEX_AI_ENDPOINT_ID=your-endpoint-id
VECTOR_STORE_TYPE=vertex_ai
```

**5. Update Requirements:**
Add to `requirements.txt`:
```
google-cloud-aiplatform>=1.38.0
```

---

### Option 2: Cloud SQL for PostgreSQL + pgvector
**Best for:** Cost-effective, familiar PostgreSQL interface

#### **Features:**
- ✅ Managed PostgreSQL by Google Cloud
- ✅ pgvector extension support
- ✅ Automatic backups
- ✅ High availability
- ✅ Regional replication
- ✅ Lower cost than Vertex AI

#### **Pricing:**
- Database: $0.0175/hour (db-f1-micro)
- Storage: $0.17/GB/month
- Free tier: None (but cheapest option)

#### **Setup Steps:**

**1. Create Cloud SQL Instance:**
```bash
# Create PostgreSQL instance
gcloud sql instances create sally-tsm-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_PASSWORD

# Create database
gcloud sql databases create sally_tsm \
  --instance=sally-tsm-db

# Get connection name
gcloud sql instances describe sally-tsm-db \
  --format="value(connectionName)"
# Output: project-id:region:instance-name
```

**2. Enable pgvector Extension:**
```sql
-- Connect to database
psql "host=/cloudsql/PROJECT:REGION:INSTANCE dbname=sally_tsm user=postgres"

-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**3. Update Backend Configuration:**

Update `.env`:
```bash
# Cloud SQL connection (using Unix socket)
DATABASE_URL=postgresql://postgres:PASSWORD@/sally_tsm?host=/cloudsql/PROJECT:REGION:INSTANCE

# Or use Public IP (if enabled)
DATABASE_URL=postgresql://postgres:PASSWORD@PUBLIC_IP:5432/sally_tsm

# Vector store
VECTOR_STORE_TYPE=pgvector
```

**4. Use Existing pgvector Integration:**
The application already supports pgvector. Just set `VECTOR_STORE_TYPE=pgvector` and it will work with Cloud SQL.

---

### Option 3: AlloyDB for PostgreSQL + pgvector
**Best for:** High-performance, mission-critical applications

#### **Features:**
- ✅ 4x faster than standard PostgreSQL
- ✅ Native pgvector support
- ✅ Columnar engine for analytics
- ✅ High availability
- ✅ Advanced security

#### **Pricing:**
- Cluster: $0.40/hour
- Storage: $0.35/GB/month
- More expensive but higher performance

#### **Setup Steps:**

**1. Create AlloyDB Cluster:**
```bash
# Create cluster
gcloud alloydb clusters create sally-tsm-cluster \
  --region=us-central1 \
  --password=YOUR_PASSWORD \
  --network=default

# Create instance
gcloud alloydb instances create sally-tsm-primary \
  --cluster=sally-tsm-cluster \
  --region=us-central1 \
  --instance-type=PRIMARY \
  --cpu-count=2
```

**2. Connect and Configure:**
```sql
-- Connect via Cloud SQL Proxy
./cloud-sql-proxy --alloydb \
  PROJECT:REGION:CLUSTER:INSTANCE

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
```

**3. Update Configuration:**
Same as Cloud SQL configuration above.

---

## 🔄 Switching from Current Setup to Google Cloud

### Migration Path:

**Current Setup:**
- PostgreSQL (Railway)
- ChromaDB (local)

**Target Setup:**
- Cloud SQL/AlloyDB (Google Cloud)
- Vertex AI Vector Search OR pgvector

### Migration Steps:

**1. Export Current Data:**
```bash
# Export PostgreSQL data
pg_dump -h railway-host -U postgres -d database > backup.sql

# Export ChromaDB vectors (if needed)
# This depends on your current implementation
```

**2. Import to Google Cloud:**
```bash
# Import to Cloud SQL
gcloud sql import sql sally-tsm-db gs://your-bucket/backup.sql \
  --database=sally_tsm
```

**3. Re-index Vectors:**
```python
# If using Vertex AI, re-embed and index all documents
# If using pgvector, vectors are already in PostgreSQL
```

---

## 💰 Cost Comparison

### Monthly Cost Estimates (for small-medium workload):

| Option | Storage | Queries | Total |
|--------|---------|---------|-------|
| **Vertex AI Vector Search** | $15 | $5 | **$20/month** |
| **Cloud SQL + pgvector** | $12 | $3 | **$15/month** |
| **AlloyDB + pgvector** | $290 | $5 | **$295/month** |
| **Railway PostgreSQL** (current) | $5 | $0 | **$5/month** |

### Recommendations by Use Case:

1. **Development/Testing:** Railway PostgreSQL + pgvector ($5/month)
2. **Production (Small):** Cloud SQL + pgvector ($15/month)
3. **Production (Large):** Vertex AI Vector Search ($20-50/month)
4. **Enterprise:** AlloyDB + Vertex AI ($300+/month)

---

## 🔧 Implementation in Code

### Update `backend/ai/pure_provider_manager.py`:

Add Google Cloud vector store option:
```python
def get_vector_store(provider: str, embeddings):
    """Get vector store based on configuration"""
    vector_store_type = os.getenv("VECTOR_STORE_TYPE", "chromadb")
    
    if vector_store_type == "vertex_ai":
        from backend.ai.vertex_ai_vector_store import VertexAIVectorStore
        return VertexAIVectorStore(
            project_id=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION"),
            index_id=os.getenv("VERTEX_AI_INDEX_ID"),
            endpoint_id=os.getenv("VERTEX_AI_ENDPOINT_ID"),
            embeddings=embeddings
        )
    elif vector_store_type == "pgvector":
        # Existing pgvector implementation
        return get_pgvector_store(embeddings)
    else:
        # ChromaDB
        return Chroma(
            embedding_function=embeddings,
            persist_directory=os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        )
```

---

## 🎯 Recommended Setup for Google Cloud

### Best Configuration:
1. **LLM:** Google Gemini (FREE embeddings)
2. **Database:** Cloud SQL for PostgreSQL
3. **Vector Store:** pgvector (in Cloud SQL)
4. **Cost:** $15-20/month
5. **Performance:** Excellent
6. **Scalability:** Good

### Why This Setup?
- ✅ Everything in Google Cloud (unified management)
- ✅ FREE embeddings with Gemini
- ✅ Familiar PostgreSQL interface
- ✅ No vendor lock-in (can migrate to other PostgreSQL)
- ✅ Cost-effective

---

## 📚 Additional Resources

- [Vertex AI Vector Search Documentation](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [AlloyDB Documentation](https://cloud.google.com/alloydb/docs)

---

## 🚀 Quick Start with Google Cloud

```bash
# 1. Setup Google Cloud
gcloud init
gcloud auth login

# 2. Create Cloud SQL instance
gcloud sql instances create sally-tsm-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_PASSWORD

# 3. Create database
gcloud sql databases create sally_tsm --instance=sally-tsm-db

# 4. Enable pgvector
gcloud sql connect sally-tsm-db --user=postgres
# In psql: CREATE EXTENSION vector;

# 5. Get connection string
gcloud sql instances describe sally-tsm-db

# 6. Update Railway environment variables
DATABASE_URL=postgresql://postgres:PASSWORD@/sally_tsm?host=/cloudsql/PROJECT:REGION:INSTANCE
VECTOR_STORE_TYPE=pgvector

# 7. Deploy and test!
```

---

**Om Namah Shivay! 🙏**
