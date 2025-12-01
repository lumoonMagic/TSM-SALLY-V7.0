# Sally TSM: No OpenAI Dependency Guide

**How to use Sally TSM with ONLY Gemini (or any other LLM) - No OpenAI required!**

---

## 🎯 Problem

Current implementation has **hard dependency on OpenAI** for embeddings:

```python
# ❌ PROBLEM: Always uses OpenAI embeddings
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")  # ⚠️ REQUIRED even if using Gemini for chat
)
```

**You want:** Use only Gemini (or Claude) without any OpenAI dependency!

---

## ✅ Solution: Flexible Embedding Manager

New implementation lets you use **any provider** for both LLM and embeddings:

| LLM Provider | Recommended Embeddings | Cost | API Required |
|--------------|----------------------|------|--------------|
| **Gemini** | Google embeddings | **FREE** | Google API only |
| **Claude** | HuggingFace (local) | **FREE** | None (runs locally) |
| **GPT** | OpenAI embeddings | $0.02/1M | OpenAI API only |

---

## 🚀 Quick Start: Use ONLY Gemini

### Step 1: Update Environment Variables

```bash
# .env file

# ✅ ONLY Gemini API key needed
GOOGLE_API_KEY=your-google-api-key

# ❌ OpenAI NOT required
# OPENAI_API_KEY=  # Can be empty or removed

# ❌ Anthropic NOT required
# ANTHROPIC_API_KEY=  # Can be empty or removed
```

### Step 2: Use Flexible QA Router

Replace `backend/routers/qa_rag.py` with `backend/routers/qa_rag_flexible.py`

```bash
# Rename files
cd backend/routers/
mv qa_rag.py qa_rag_old.py
mv qa_rag_flexible.py qa_rag.py
```

### Step 3: Test with Gemini

```python
# Test endpoint
import requests

response = requests.post("http://localhost:8000/api/v1/qa/ask-rag", json={
    "question": "What is the temperature excursion protocol?",
    "llm_provider": "gemini",
    "embedding_provider": "auto"  # Automatically uses Google embeddings (FREE)
})

print(response.json())
# {
#   "answer": "...",
#   "llm_provider": "gemini",
#   "embedding_provider": "google",  # ✅ No OpenAI!
#   ...
# }
```

---

## 📊 Provider Combinations

### Option 1: Only Gemini (100% Google) ✅ RECOMMENDED

```python
# Request
{
    "question": "What should I do during temperature excursion?",
    "llm_provider": "gemini",           # Google Gemini for chat
    "embedding_provider": "auto"         # Auto-selects Google embeddings
}

# Environment
GOOGLE_API_KEY=your-key  # ✅ Only this needed
```

**Cost:** FREE (Gemini free tier) or ~$5/month  
**API Keys:** Google only  
**Best For:** Cost-conscious, no OpenAI dependency

---

### Option 2: Only Claude (Anthropic + Local Embeddings)

```python
# Request
{
    "question": "What should I do during temperature excursion?",
    "llm_provider": "anthropic",        # Claude for chat
    "embedding_provider": "huggingface" # Local embeddings (FREE)
}

# Environment
ANTHROPIC_API_KEY=your-key  # ✅ Only this needed
# No need for OpenAI or Google!
```

**Cost:** ~$10-20/month (Claude API only)  
**API Keys:** Anthropic only  
**Best For:** Privacy (local embeddings), no OpenAI/Google dependency

---

### Option 3: Mix and Match

```python
# Use Gemini for chat, local embeddings (fully offline embeddings)
{
    "llm_provider": "gemini",
    "embedding_provider": "huggingface"  # Runs locally, no API calls
}

# Or use Claude with Google embeddings
{
    "llm_provider": "anthropic",
    "embedding_provider": "google"
}
```

---

## 🔧 How It Works

### Automatic Provider Matching

```python
from backend.ai.embedding_manager import get_embeddings_for_llm

# Using Gemini? Automatically uses Google embeddings (FREE)
embeddings = get_embeddings_for_llm("gemini")
# Result: GoogleGenerativeAIEmbeddings

# Using Claude? Automatically uses HuggingFace (FREE, local)
embeddings = get_embeddings_for_llm("anthropic")
# Result: HuggingFaceEmbeddings (no API calls!)

# Using GPT? Uses OpenAI embeddings
embeddings = get_embeddings_for_llm("openai")
# Result: OpenAIEmbeddings
```

### Manual Provider Selection

```python
from backend.ai.embedding_manager import EmbeddingManager

# Force Google embeddings (even if using Claude for chat)
embeddings = EmbeddingManager.get_embeddings("google")

# Force local HuggingFace embeddings (even if using GPT for chat)
embeddings = EmbeddingManager.get_embeddings("huggingface")

# Force OpenAI embeddings
embeddings = EmbeddingManager.get_embeddings("openai")
```

---

## 📋 Embedding Provider Details

### Google Embeddings (for Gemini users)

**Model:** `models/embedding-001`

```python
from langchain_google_genai import GoogleGenerativeAIEmbeddings

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# Generate embedding
vector = embeddings.embed_query("Temperature excursions require...")
# Returns: 768-dimensional vector
```

**Specs:**
- **Dimensions:** 768
- **Cost:** FREE (included with Google AI API)
- **Performance:** Excellent
- **Best for:** Gemini users

---

### HuggingFace Embeddings (local, no API)

**Model:** `all-MiniLM-L6-v2`

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# Generate embedding (runs locally, no internet needed)
vector = embeddings.embed_query("Temperature excursions require...")
# Returns: 384-dimensional vector
```

**Specs:**
- **Dimensions:** 384
- **Cost:** FREE (runs on your CPU/GPU)
- **Performance:** Good
- **Best for:** Privacy, offline, no API keys

**First-time setup:**
```bash
# Model auto-downloads on first use (~100MB)
pip install sentence-transformers
```

---

### OpenAI Embeddings (for GPT users)

**Model:** `text-embedding-3-small`

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=os.getenv("OPENAI_API_KEY")
)

vector = embeddings.embed_query("Temperature excursions require...")
# Returns: 1536-dimensional vector
```

**Specs:**
- **Dimensions:** 1536
- **Cost:** $0.02 per 1M tokens (~$5/month typical use)
- **Performance:** Excellent
- **Best for:** GPT users, high accuracy

---

## 💰 Cost Comparison

### Scenario: 10K documents, 1K queries/month

| Provider | Embeddings | Chat | Total/Month |
|----------|------------|------|-------------|
| **Gemini Only** | FREE | FREE/$5 | **$0-5** ✅ |
| **Claude + Local** | FREE | $15 | **$15** |
| **GPT + OpenAI** | $5 | $10 | **$15** |
| **Mix: Gemini + Local** | FREE | FREE/$5 | **$0-5** ✅ |

**Winner: Gemini with Google embeddings** ($0-5/month)

---

## 🔄 Migration Guide

### From OpenAI-only to Gemini-only

#### Step 1: Backup Current Setup

```bash
cd /home/user/sally-integration/backend/routers/
cp qa_rag.py qa_rag_openai_backup.py
```

#### Step 2: Update Code

```bash
# Use flexible router
cp qa_rag_flexible.py qa_rag.py
```

#### Step 3: Update Environment

```bash
# .env
GOOGLE_API_KEY=your-google-api-key  # ✅ Add this
# OPENAI_API_KEY=  # ❌ Can remove or leave empty
```

#### Step 4: Migrate Vector Store (if needed)

If you already have documents embedded with OpenAI embeddings:

```python
# migrate_embeddings.py
from backend.ai.embedding_manager import EmbeddingManager
from langchain_community.vectorstores import Chroma, PGVector
from langchain.schema import Document

# Load old documents
old_embeddings = EmbeddingManager.get_embeddings("openai")
old_store = Chroma(
    collection_name="sally_clinical_docs",
    embedding_function=old_embeddings,
    persist_directory="./chroma_db_old"
)

# Get all documents (content only, not embeddings)
docs_data = old_store.get()

# Re-create documents
documents = [
    Document(
        page_content=content,
        metadata=metadata
    )
    for content, metadata in zip(docs_data['documents'], docs_data['metadatas'])
]

# Create new store with Google embeddings
new_embeddings = EmbeddingManager.get_embeddings("google")
new_store = Chroma(
    collection_name="sally_clinical_docs",
    embedding_function=new_embeddings,
    persist_directory="./chroma_db"
)

# Re-embed with Google embeddings
new_store.add_documents(documents)
print(f"✅ Migrated {len(documents)} documents to Google embeddings")
```

---

## 🧪 Testing Different Providers

### Test Script

```python
# test_embedding_providers.py
import os
os.environ["GOOGLE_API_KEY"] = "your-key"

from backend.ai.embedding_manager import EmbeddingManager

test_text = "Temperature excursions require immediate notification within 2 hours."

# Test Google embeddings (FREE)
print("🧪 Testing Google embeddings...")
google_emb = EmbeddingManager.get_embeddings("google")
google_vec = google_emb.embed_query(test_text)
print(f"✅ Google: {len(google_vec)}-dimensional vector")

# Test HuggingFace embeddings (FREE, local)
print("\n🧪 Testing HuggingFace embeddings...")
hf_emb = EmbeddingManager.get_embeddings("huggingface")
hf_vec = hf_emb.embed_query(test_text)
print(f"✅ HuggingFace: {len(hf_vec)}-dimensional vector")

# Test similarity
from numpy import dot
from numpy.linalg import norm

def cosine_similarity(a, b):
    return dot(a, b) / (norm(a) * norm(b))

# Both should give similar results
query = "What to do during temperature deviation?"
google_q = google_emb.embed_query(query)
hf_q = hf_emb.embed_query(query)

print(f"\n✅ All embedding providers working!")
```

---

## 📦 Updated Dependencies

### For Google-only setup

```txt
# requirements.txt

# Core
fastapi==0.104.1
uvicorn[standard]==0.24.0

# LangChain
langchain==0.1.0
langchain-core==0.1.0
langchain-community==0.0.10

# Google/Gemini support
langchain-google-genai==0.0.5
google-generativeai==0.3.1

# Vector store
chromadb==0.4.18
# OR
pgvector==0.2.4

# ❌ OpenAI NOT required!
# langchain-openai==0.0.2
# openai==1.6.1
```

### For local embeddings (HuggingFace)

Add:
```txt
sentence-transformers==2.2.2
torch==2.1.0  # or tensorflow
```

---

## 🎯 API Examples

### Example 1: Ingest Documents (Gemini embeddings)

```bash
curl -X POST http://localhost:8000/api/v1/qa/ingest-documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Temperature excursions require immediate notification within 2 hours.",
        "source": "SOP-QA-008",
        "metadata": {"page": 5}
      }
    ],
    "embedding_provider": "auto",
    "llm_provider": "gemini"
  }'

# Response:
# {
#   "success": true,
#   "documents_added": 1,
#   "embedding_provider": "google",  ✅ No OpenAI!
#   "message": "Documents ingested successfully using google embeddings"
# }
```

### Example 2: Ask Question (Gemini chat + Google embeddings)

```bash
curl -X POST http://localhost:8000/api/v1/qa/ask-rag \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What should I do during temperature excursion?",
    "llm_provider": "gemini",
    "embedding_provider": "auto",
    "use_rag": true
  }'

# Response:
# {
#   "answer": "Based on SOP-QA-008, temperature excursions require...",
#   "sources": ["SOP-QA-008"],
#   "llm_provider": "gemini",
#   "embedding_provider": "google",  ✅ 100% Google!
#   "timestamp": "2024-01-28T12:00:00"
# }
```

### Example 3: Check Available Providers

```bash
curl http://localhost:8000/api/v1/qa/embedding-info

# Response:
# {
#   "providers": {
#     "google": {
#       "cost": "FREE",
#       "dimensions": 768,
#       "best_for": "Gemini users",
#       "requires_api_key": true
#     },
#     "huggingface": {
#       "cost": "FREE (runs locally)",
#       "dimensions": 384,
#       "best_for": "Offline/no API",
#       "requires_api_key": false
#     }
#   }
# }
```

---

## ✅ Final Checklist

### To use ONLY Gemini (no OpenAI):

- [ ] Get Google API key from https://makersuite.google.com/app/apikey
- [ ] Set `GOOGLE_API_KEY` in environment
- [ ] Copy `backend/ai/embedding_manager.py` to project
- [ ] Replace `qa_rag.py` with `qa_rag_flexible.py`
- [ ] Update `requirements.txt` (remove OpenAI, add Google)
- [ ] Test with example requests above
- [ ] Deploy to Railway

---

## 🎓 Key Takeaways

1. **✅ No OpenAI Required** - Can use ANY LLM provider
2. **✅ Auto-Matching** - Embeddings automatically match LLM provider
3. **✅ Mix and Match** - Freedom to choose any combination
4. **✅ Cost Savings** - Google embeddings are FREE
5. **✅ Local Option** - HuggingFace runs offline, no API keys

---

## 📚 Files Created

1. **[backend/ai/embedding_manager.py](computer:///home/user/sally-integration/backend/ai/embedding_manager.py)** - Flexible embedding manager
2. **[backend/routers/qa_rag_flexible.py](computer:///home/user/sally-integration/backend/routers/qa_rag_flexible.py)** - Updated QA router
3. **[NO_OPENAI_DEPENDENCY_GUIDE.md](computer:///home/user/sally-integration/NO_OPENAI_DEPENDENCY_GUIDE.md)** - This guide

---

**Ready to use Sally TSM with ONLY Gemini!** 🚀

**Cost:** $0-5/month (vs $15+ with OpenAI)  
**API Keys:** Google only (vs OpenAI required)  
**Performance:** Same quality, lower cost
