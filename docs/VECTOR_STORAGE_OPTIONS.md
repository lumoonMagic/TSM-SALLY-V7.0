# Sally TSM: Vector Storage Options Comparison

**Complete guide to vector database choices for RAG**

---

## 🎯 Quick Recommendation

**For Railway Deployment: Use PostgreSQL + pgvector**

---

## 📊 Option Comparison Table

| Feature | ChromaDB (Current) | PGVector | Pinecone | Weaviate | Qdrant |
|---------|-------------------|----------|----------|----------|---------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Moderate | ⭐ Easy | ⭐⭐⭐ Complex | ⭐⭐ Moderate |
| **Railway Integration** | ⚠️ Needs Volume | ✅ Built-in | ⚠️ External | ⚠️ Separate | ⚠️ Separate |
| **Persistence** | ⚠️ Ephemeral | ✅ PostgreSQL | ✅ Cloud | ✅ Cloud/Self | ✅ Cloud/Self |
| **Cost (Railway)** | Free + $5 volume | **Free** | $0-70/mo | $50+/mo | $0-25/mo |
| **Scalability** | 100K docs | 10M+ docs | 100M+ docs | 10M+ docs | 10M+ docs |
| **Speed (1M vectors)** | Fast | Very Fast | Very Fast | Very Fast | Very Fast |
| **Backup** | Manual | ✅ Auto | ✅ Auto | Manual | ✅ Auto |
| **LangChain Support** | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| **Best For** | Development | **Production** | Enterprise | Advanced | Performance |

---

## 🔍 Detailed Comparison

### **Option 1: ChromaDB (Current Implementation)**

#### What It Is
- Embedded vector database
- Stores vectors in local files
- No external service needed

#### How It Works
```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = Chroma(
    collection_name="sally_clinical_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_db"  # Local storage
)
```

#### Data Flow
```
User uploads document
    ↓
Document → Chunks (512 tokens each)
    ↓
Chunks → OpenAI API → Embeddings (1536-dim vectors)
    ↓
Vectors → ChromaDB (./chroma_db/ folder)
    ↓
When user asks question:
    Question → Embedding → Similarity search → Top 4 docs → LLM context
```

#### Pros
- ✅ Simple setup (already implemented)
- ✅ No external dependencies
- ✅ Works offline
- ✅ Free

#### Cons
- ⚠️ Railway ephemeral storage (data lost on redeploy)
- ⚠️ Requires Railway Volume ($5/mo) for persistence
- ⚠️ Single-server only (no distributed)
- ⚠️ Limited to ~100K documents

#### Cost
- **Railway:** $0 (or +$5/mo for persistent volume)

#### Use Case
- Development/testing
- Small-scale deployments
- Quick prototypes

---

### **Option 2: PostgreSQL + pgvector (✅ RECOMMENDED)**

#### What It Is
- PostgreSQL extension for vector operations
- Uses your existing Railway database
- Native SQL support

#### How It Works
```python
from langchain_community.vectorstores import PGVector

vector_store = PGVector(
    collection_name="sally_clinical_docs",
    connection_string=os.getenv("DATABASE_URL"),  # Railway provides
    embedding_function=embeddings,
    distance_strategy="cosine"
)
```

#### Database Schema
```sql
CREATE TABLE document_embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536),  -- OpenAI embedding size
    metadata JSONB,
    source TEXT,
    created_at TIMESTAMP
);

-- Fast similarity search with index
CREATE INDEX ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

#### Data Flow
```
Document upload
    ↓
Chunks → OpenAI embeddings
    ↓
Store in PostgreSQL:
    INSERT INTO document_embeddings (content, embedding, metadata)
    VALUES ('text...', '[0.12, -0.45, ...]', '{"source": "SOP-001"}')
    ↓
Question asked:
    SELECT content, 1 - (embedding <=> query_embedding) AS similarity
    FROM document_embeddings
    ORDER BY embedding <=> query_embedding
    LIMIT 4;
```

#### Pros
- ✅ Uses existing Railway PostgreSQL (no extra service)
- ✅ Persistent storage (automatic backups)
- ✅ SQL queries for analytics
- ✅ Scales to millions of vectors
- ✅ Free (included with Railway database)
- ✅ Familiar PostgreSQL tooling
- ✅ ACID compliance

#### Cons
- ⚠️ Requires pgvector extension
- ⚠️ Slightly slower than specialized vector DBs (still very fast)
- ⚠️ Manual index optimization for large datasets

#### Cost
- **Railway:** $0 (uses existing PostgreSQL database)

#### Use Case
- **Production deployments on Railway** ✅
- Cost-sensitive projects
- Need SQL integration
- Up to 10M+ documents

---

### **Option 3: Pinecone**

#### What It Is
- Managed cloud vector database
- Purpose-built for vector search
- Serverless architecture

#### How It Works
```python
from langchain_community.vectorstores import Pinecone
import pinecone

pinecone.init(
    api_key=os.getenv("PINECONE_API_KEY"),
    environment="us-west1-gcp"
)

vector_store = Pinecone.from_documents(
    documents,
    embeddings,
    index_name="sally-clinical-docs"
)
```

#### Data Flow
```
Document → Embeddings → Pinecone Cloud
    ↓
Query → Pinecone API → Similarity results
    ↓
No self-hosting needed
```

#### Pros
- ✅ Fully managed (no ops)
- ✅ Scales automatically
- ✅ Very fast (sub-10ms queries)
- ✅ 1M vectors free tier
- ✅ Global distribution

#### Cons
- ⚠️ External dependency
- ⚠️ Costs after 1M vectors (~$70/mo)
- ⚠️ Requires internet connection
- ⚠️ Vendor lock-in

#### Cost
- **Free Tier:** 1M vectors, 1 index
- **Standard:** $70/mo for 5M vectors
- **Enterprise:** Custom pricing

#### Use Case
- Large-scale (1M+ documents)
- Need global distribution
- Budget for managed service

---

### **Option 4: Weaviate**

#### What It Is
- Open-source vector database
- GraphQL API
- Can self-host or use cloud

#### How It Works
```python
from langchain_community.vectorstores import Weaviate
import weaviate

client = weaviate.Client(
    url="https://your-weaviate-cluster.weaviate.network",
    auth_client_secret=weaviate.AuthApiKey(api_key="...")
)

vector_store = Weaviate(
    client=client,
    index_name="SallyClinicalDocs",
    text_key="content",
    embedding=embeddings
)
```

#### Pros
- ✅ Open source (can self-host)
- ✅ GraphQL API
- ✅ Multi-modal (text, images, audio)
- ✅ Built-in vectorization
- ✅ Advanced filtering

#### Cons
- ⚠️ Complex setup
- ⚠️ Requires separate container/service
- ⚠️ Steeper learning curve
- ⚠️ Cloud pricing starts at $50/mo

#### Cost
- **Self-hosted:** Railway container (~$10/mo)
- **Cloud:** $50-200/mo

#### Use Case
- Advanced graph relationships
- Multi-modal data
- Custom vectorization

---

### **Option 5: Qdrant**

#### What It Is
- High-performance vector database
- Written in Rust
- Open source + cloud

#### How It Works
```python
from langchain_community.vectorstores import Qdrant
from qdrant_client import QdrantClient

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

vector_store = Qdrant(
    client=client,
    collection_name="sally_clinical_docs",
    embeddings=embeddings
)
```

#### Pros
- ✅ Very fast (Rust performance)
- ✅ Open source
- ✅ Generous free tier (1GB)
- ✅ Advanced filtering
- ✅ Can self-host on Railway

#### Cons
- ⚠️ Requires separate service
- ⚠️ Smaller ecosystem than Pinecone

#### Cost
- **Free Tier:** 1GB storage
- **Cloud:** $25-100/mo
- **Self-hosted:** Railway container (~$10/mo)

#### Use Case
- High-performance requirements
- Advanced filtering needs
- Budget-friendly cloud option

---

## 💰 Cost Comparison (Monthly)

| Solution | Railway | Service | Embeddings | Total |
|----------|---------|---------|------------|-------|
| **ChromaDB** | $5 (volume) | $0 | ~$5 | **$10** |
| **PGVector** ✅ | $0 | $0 | ~$5 | **$5** |
| **Pinecone** | $0 | $0-70 | ~$5 | **$5-75** |
| **Weaviate** | $10 | $0-50 | ~$5 | **$15-65** |
| **Qdrant** | $10 | $0-25 | ~$5 | **$15-40** |

**Winner: PGVector** (uses existing Railway PostgreSQL)

---

## 🚀 How Embeddings Work

### 1. Text Chunking
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,  # 512 tokens per chunk
    chunk_overlap=50  # 50 token overlap
)

chunks = splitter.split_text(document_text)
# Result: ["Temperature excursions...", "Immediate notification...", ...]
```

### 2. Embedding Generation
```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Convert text to vector
vector = embeddings.embed_query("Temperature excursions require...")
# Result: [0.123, -0.456, 0.789, ..., 0.234]  # 1536 numbers
```

### 3. Similarity Calculation

**Cosine Similarity:**
```python
import numpy as np

def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)

# Example
query_vec = embeddings.embed_query("What to do during excursion?")
doc_vec = embeddings.embed_query("Temperature excursions require notification")

similarity = cosine_similarity(query_vec, doc_vec)
# Result: 0.87 (87% similar)
```

### 4. Retrieval
```python
# Find top 4 most similar documents
results = vector_store.similarity_search(
    query="What to do during temperature excursion?",
    k=4
)

# Use as context for LLM
context = "\n\n".join([doc.page_content for doc in results])
```

---

## 🎯 Embedding Model Options

| Model | Provider | Dimensions | Cost per 1M tokens | Quality |
|-------|----------|------------|-------------------|---------|
| **text-embedding-3-small** ✅ | OpenAI | 1536 | $0.02 | Excellent |
| text-embedding-3-large | OpenAI | 3072 | $0.13 | Best |
| text-embedding-ada-002 | OpenAI | 1536 | $0.10 | Good |
| voyage-02 | Voyage AI | 1024 | $0.10 | Excellent |
| embed-english-v3.0 | Cohere | 1024 | $0.10 | Excellent |
| **all-MiniLM-L6-v2** | HuggingFace | 384 | Free | Good |

**Current: text-embedding-3-small** (best balance of cost/quality)

---

## 📈 Scale Recommendations

| Documents | Vectors | Recommended Solution |
|-----------|---------|---------------------|
| < 10K | < 100K | ChromaDB |
| 10K - 100K | 100K - 1M | **PGVector** ✅ |
| 100K - 1M | 1M - 10M | PGVector or Pinecone |
| 1M+ | 10M+ | Pinecone or Qdrant |

---

## 🔧 Implementation Checklist

### For PGVector (Recommended)

- [ ] Enable pgvector extension on Railway PostgreSQL
- [ ] Create embeddings table with vector column
- [ ] Update `backend/routers/qa_rag.py` to use PGVector
- [ ] Add `pgvector==0.2.4` to requirements
- [ ] Test document ingestion
- [ ] Verify similarity search
- [ ] Deploy to Railway

### For ChromaDB (Current)

- [ ] Create Railway Volume for `/app/chroma_db`
- [ ] Update environment variable: `CHROMA_PERSIST_DIR=/app/chroma_db`
- [ ] Deploy to Railway
- [ ] No code changes needed (already implemented)

---

## 🎓 Key Concepts

### What is a Vector?
- Array of numbers representing text meaning
- Example: `[0.12, -0.45, 0.78, ...]` (1536 numbers)
- Similar meanings = similar vectors

### What is Similarity Search?
- Find documents with vectors closest to query vector
- Uses cosine similarity (angle between vectors)
- Returns top K most similar results

### What is RAG (Retrieval-Augmented Generation)?
1. **Retrieve:** Find relevant documents using vector search
2. **Augment:** Add documents as context to LLM prompt
3. **Generate:** LLM creates answer based on context

---

## 📚 Further Reading

- PGVector Docs: https://github.com/pgvector/pgvector
- LangChain Vector Stores: https://python.langchain.com/docs/modules/data_connection/vectorstores/
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Pinecone Docs: https://docs.pinecone.io/

---

## ✅ Final Recommendation

**For Sally TSM on Railway: Use PostgreSQL + pgvector**

**Reasons:**
1. ✅ No additional cost (uses existing database)
2. ✅ Persistent storage (automatic backups)
3. ✅ Scales to 10M+ vectors
4. ✅ Easy to maintain
5. ✅ No external dependencies

**See:** `PGVECTOR_SETUP_GUIDE.md` for implementation steps
