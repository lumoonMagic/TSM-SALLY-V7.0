# Sally TSM: Pure Provider Implementation

## 🎯 **Your Requirement: Complete LLM Independence**

**What You Want:**
- Choose OpenAI → uses **ONLY** OpenAI (chat + embeddings)
- Choose Gemini → uses **ONLY** Gemini (chat + embeddings)
- Choose Claude → uses **ONLY** Claude capabilities
- **NO cross-dependencies between providers!**

---

## ✅ **Solution: Pure Provider Manager**

Each provider is **completely independent** - uses only its own native capabilities.

---

## 📊 **Provider Implementations**

| Provider | Chat | Embeddings | API Keys Required | Cost/Month | Cross-Deps |
|----------|------|------------|-------------------|------------|------------|
| **OpenAI** | GPT-4o-mini | text-embedding-3-small | OpenAI only | ~$15 | ❌ None |
| **Gemini** ✅ | Gemini-1.5-flash | Gemini embedding-001 | Google only | ~$5 (FREE tier) | ❌ None |
| **Claude** | Claude-3.5-sonnet | Local HuggingFace | Anthropic only | ~$15 | ❌ None |

---

## 🚀 **Quick Start**

### Step 1: Choose Your Provider

```bash
# .env file - Choose ONE provider

# Option 1: Pure OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Option 2: Pure Gemini (RECOMMENDED - FREE embeddings)
GOOGLE_API_KEY=your-google-api-key

# Option 3: Pure Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Step 2: Use Pure Implementation

```bash
# Copy pure implementation
cp backend/ai/pure_provider_manager.py backend/ai/
cp backend/routers/qa_rag_pure.py backend/routers/qa_rag.py
```

### Step 3: Test

```python
# Test with Gemini (100% Google, no OpenAI)
import requests

response = requests.post("http://localhost:8000/api/v1/qa/ask-rag", json={
    "question": "What is the temperature excursion protocol?",
    "provider": "gemini"
})

print(response.json())
# {
#   "answer": "...",
#   "provider": "gemini",
#   "chat_model": "gemini-1.5-flash",
#   "embedding_model": "models/embedding-001",
#   "pure_provider": true,
#   "note": "Using 100% Google - chat and embeddings from same provider (FREE)"
# }
```

---

## 🔍 **How It Works**

### Pure OpenAI Implementation

```python
from backend.ai.pure_provider_manager import get_pure_provider

# Get pure OpenAI bundle
chat, embeddings, metadata = get_pure_provider("openai")

# Result:
# chat = ChatOpenAI(model="gpt-4o-mini")
# embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
# metadata = {
#     "provider": "openai",
#     "chat_model": "gpt-4o-mini",
#     "embedding_model": "text-embedding-3-small",
#     "embedding_dimensions": 1536,
#     "embedding_cost": "$0.02/1M tokens",
#     "pure_provider": True,
#     "cross_dependencies": None,  # ✅ NO CROSS-DEPS!
#     "note": "Using 100% OpenAI"
# }
```

### Pure Gemini Implementation

```python
# Get pure Gemini bundle
chat, embeddings, metadata = get_pure_provider("gemini")

# Result:
# chat = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
# embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
# metadata = {
#     "provider": "gemini",
#     "chat_model": "gemini-1.5-flash",
#     "embedding_model": "models/embedding-001",
#     "embedding_dimensions": 768,
#     "embedding_cost": "FREE",  # ✅ FREE!
#     "pure_provider": True,
#     "cross_dependencies": None,  # ✅ NO CROSS-DEPS!
#     "note": "Using 100% Google (FREE)"
# }
```

### Pure Claude Implementation

```python
# Get pure Claude bundle
chat, embeddings, metadata = get_pure_provider("anthropic")

# Result:
# chat = ChatAnthropic(model="claude-3-5-sonnet")
# embeddings = HuggingFaceEmbeddings(model="all-MiniLM-L6-v2")  # Local, FREE
# metadata = {
#     "provider": "anthropic",
#     "chat_model": "claude-3-5-sonnet",
#     "embedding_model": "all-MiniLM-L6-v2",
#     "embedding_dimensions": 384,
#     "embedding_cost": "FREE (local)",  # ✅ FREE! Runs locally
#     "pure_provider": True,
#     "cross_dependencies": None,  # ✅ NO CROSS-DEPS!
#     "note": "Claude chat + local embeddings (no external API)"
# }
```

---

## 🎓 **Technical Details**

### What Makes It "Pure"?

#### ❌ OLD (Mixed Dependencies):
```python
# Problem: Using Gemini for chat but OpenAI for embeddings
chat = ChatGoogleGenerativeAI(...)  # Google API
embeddings = OpenAIEmbeddings(...)  # ⚠️ Still needs OpenAI API!

# Result: Need BOTH Google AND OpenAI keys
```

#### ✅ NEW (Pure):
```python
# Pure Gemini: Everything Google
chat = ChatGoogleGenerativeAI(...)  # Google API
embeddings = GoogleGenerativeAIEmbeddings(...)  # ✅ Google API (FREE)

# Result: Only need Google key!
```

---

## 📋 **API Examples**

### Example 1: Ingest Documents (Pure Gemini)

```bash
curl -X POST http://localhost:8000/api/v1/qa/ingest-documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [{
      "content": "Temperature excursions require notification within 2 hours.",
      "source": "SOP-QA-008"
    }],
    "provider": "gemini"
  }'

# Response:
{
  "success": true,
  "documents_added": 1,
  "provider": "gemini",
  "chat_model": "gemini-1.5-flash",
  "embedding_model": "models/embedding-001",
  "embedding_cost": "FREE",  # ✅ FREE!
  "pure_provider": true,  # ✅ Pure implementation
  "note": "Using 100% Google - chat and embeddings from same provider (FREE)"
}
```

### Example 2: Ask Question (Pure OpenAI)

```bash
curl -X POST http://localhost:8000/api/v1/qa/ask-rag \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What should I do during temperature excursion?",
    "provider": "openai"
  }'

# Response:
{
  "answer": "According to the protocol, temperature excursions require...",
  "sources": ["SOP-QA-008"],
  "provider": "openai",
  "chat_model": "gpt-4o-mini",
  "embedding_model": "text-embedding-3-small",
  "embedding_dimensions": 1536,
  "embedding_cost": "$0.02/1M tokens",
  "pure_provider": true,  # ✅ Pure OpenAI
  "note": "Using 100% OpenAI - chat and embeddings from same provider"
}
```

### Example 3: Ask Question (Pure Claude)

```bash
curl -X POST http://localhost:8000/api/v1/qa/ask-rag \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What should I do during temperature excursion?",
    "provider": "anthropic"
  }'

# Response:
{
  "answer": "Based on the SOP, you must...",
  "sources": ["SOP-QA-008"],
  "provider": "anthropic",
  "chat_model": "claude-3-5-sonnet-20241022",
  "embedding_model": "all-MiniLM-L6-v2",
  "embedding_dimensions": 384,
  "embedding_cost": "FREE (local)",  # ✅ Runs locally!
  "pure_provider": true,
  "note": "Claude chat + local embeddings (no external API for embeddings)"
}
```

### Example 4: List Available Providers

```bash
curl http://localhost:8000/api/v1/qa/providers

# Response:
{
  "providers": {
    "openai": {
      "name": "OpenAI",
      "chat_models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
      "embedding_models": ["text-embedding-3-small", "text-embedding-3-large"],
      "embedding_cost": "$0.02/1M tokens",
      "native_embeddings": true,  # ✅ Has native embeddings
      "requires_api_key": "OPENAI_API_KEY"
    },
    "gemini": {
      "name": "Google Gemini",
      "chat_models": ["gemini-1.5-pro", "gemini-1.5-flash"],
      "embedding_models": ["models/embedding-001", "models/text-embedding-004"],
      "embedding_cost": "FREE",  # ✅ FREE!
      "native_embeddings": true,  # ✅ Has native embeddings
      "requires_api_key": "GOOGLE_API_KEY"
    },
    "anthropic": {
      "name": "Anthropic Claude",
      "chat_models": ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
      "embedding_models": ["all-MiniLM-L6-v2"],  # Local HuggingFace
      "embedding_cost": "FREE (local)",
      "native_embeddings": false,  # Uses local embeddings
      "requires_api_key": "ANTHROPIC_API_KEY"
    }
  },
  "note": "Each provider uses ONLY its own native capabilities - no cross-dependencies"
}
```

### Example 5: Validate Provider Setup

```bash
curl http://localhost:8000/api/v1/qa/provider/gemini/validate

# Response (if configured):
{
  "valid": true,
  "provider": "Google Gemini",
  "chat_models": ["gemini-1.5-pro", "gemini-1.5-flash"],
  "embedding_cost": "FREE",
  "native_embeddings": true
}

# Response (if NOT configured):
{
  "valid": false,
  "error": "GOOGLE_API_KEY not set",
  "fix": "Set environment variable: GOOGLE_API_KEY=your-key"
}
```

---

## 💰 **Cost Comparison**

### Scenario: 10K documents, 1K queries/month

| Provider | Chat | Embeddings | Total/Month |
|----------|------|------------|-------------|
| **Pure Gemini** ✅ | $5 | **FREE** | **$5** |
| **Pure OpenAI** | $10 | $5 | **$15** |
| **Pure Claude** | $15 | **FREE (local)** | **$15** |

**Winner: Pure Gemini** ($5/month with FREE embeddings)

---

## 🔧 **Environment Setup**

### For Pure Gemini (Recommended)

```bash
# .env
GOOGLE_API_KEY=your-google-api-key  # ✅ Only this!

# ❌ NOT needed:
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
```

### For Pure OpenAI

```bash
# .env
OPENAI_API_KEY=sk-your-openai-key  # ✅ Only this!

# ❌ NOT needed:
# GOOGLE_API_KEY=
# ANTHROPIC_API_KEY=
```

### For Pure Claude

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-your-key  # ✅ Only this!

# ❌ NOT needed:
# OPENAI_API_KEY=
# GOOGLE_API_KEY=
```

---

## 📦 **Dependencies**

### For Pure Gemini

```txt
# Core
fastapi==0.104.1
langchain==0.1.0

# Gemini ONLY
langchain-google-genai==0.0.5  ✅
google-generativeai==0.3.1      ✅

# Vector store
chromadb==0.4.18  # or pgvector

# ❌ NOT needed:
# langchain-openai
# openai
# langchain-anthropic
# anthropic
```

### For Pure OpenAI

```txt
# Core
fastapi==0.104.1
langchain==0.1.0

# OpenAI ONLY
langchain-openai==0.0.2  ✅
openai==1.6.1             ✅

# Vector store
chromadb==0.4.18

# ❌ NOT needed:
# langchain-google-genai
# google-generativeai
```

### For Pure Claude

```txt
# Core
fastapi==0.104.1
langchain==0.1.0

# Claude ONLY
langchain-anthropic==0.1.0  ✅
anthropic==0.8.0             ✅

# Local embeddings
sentence-transformers==2.2.2  ✅

# Vector store
chromadb==0.4.18

# ❌ NOT needed:
# langchain-openai
# langchain-google-genai
```

---

## ✅ **Verification**

### Test Pure Implementation

```python
# test_pure.py
from backend.ai.pure_provider_manager import get_pure_provider

# Test Gemini
chat, emb, meta = get_pure_provider("gemini")
print(f"Provider: {meta['provider']}")
print(f"Chat: {meta['chat_model']}")
print(f"Embeddings: {meta['embedding_model']}")
print(f"Pure: {meta['pure_provider']}")
print(f"Cross-deps: {meta['cross_dependencies']}")  # Should be None
print(f"Note: {meta['note']}")

# Expected output:
# Provider: gemini
# Chat: gemini-1.5-flash
# Embeddings: models/embedding-001
# Pure: True
# Cross-deps: None  ✅ NO CROSS-DEPENDENCIES!
# Note: Using 100% Google - chat and embeddings from same provider (FREE)
```

---

## 🎯 **Summary**

### What You Get:

1. ✅ **Complete Independence** - Each provider uses ONLY its own capabilities
2. ✅ **No Cross-Dependencies** - Choose one provider, need only one API key
3. ✅ **Cost Savings** - Gemini embeddings are FREE
4. ✅ **Flexibility** - Switch providers anytime, no code changes
5. ✅ **Pure Implementation** - Zero mixing between providers

### Provider-Specific Collections:

Each provider gets its own vector store collection:
- OpenAI: `sally_docs_openai`
- Gemini: `sally_docs_gemini`
- Claude: `sally_docs_anthropic`

**No interference** between providers!

---

## 📚 **Files Created**

1. **[pure_provider_manager.py](computer:///home/user/sally-integration/backend/ai/pure_provider_manager.py)** - Pure provider implementation
2. **[qa_rag_pure.py](computer:///home/user/sally-integration/backend/routers/qa_rag_pure.py)** - Updated QA router
3. **[PURE_PROVIDER_GUIDE.md](computer:///home/user/sally-integration/PURE_PROVIDER_GUIDE.md)** - This guide

---

## ✅ **Final Recommendation**

**Use Pure Gemini:**
- 100% Google (chat + embeddings)
- FREE embeddings
- No OpenAI dependency
- $5/month total cost
- Single API key needed

---

**Ready to use Sally TSM with complete LLM independence!** 🚀
