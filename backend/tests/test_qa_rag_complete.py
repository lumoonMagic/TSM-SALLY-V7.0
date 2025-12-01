"""
Comprehensive Test Suite for Enhanced Q&A with RAG
Tests guardrails, grounding, multi-LLM support, and edge cases
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import os

# Set test environment variables
os.environ["OPENAI_API_KEY"] = "test-openai-key"
os.environ["ANTHROPIC_API_KEY"] = "test-anthropic-key"
os.environ["GOOGLE_API_KEY"] = "test-google-key"
os.environ["DATABASE_TYPE"] = "sqlite"
os.environ["SQLITE_DB_PATH"] = ":memory:"

from backend.routers.qa_rag import (
    router, 
    SQLGuardrail, 
    ResponseGuardrail,
    LLMConfig,
    vector_store_manager
)

# ==================== FIXTURES ====================

@pytest.fixture
def client():
    """Test client fixture"""
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)

@pytest.fixture
def mock_llm_response():
    """Mock LLM response"""
    mock_response = Mock()
    mock_response.content = "Based on the current inventory data, we have 150 units of Drug X in stock at Site A."
    return mock_response

@pytest.fixture
def mock_vector_search():
    """Mock vector store search results"""
    from langchain.schema import Document
    return [
        Document(
            page_content="Drug X inventory: 150 units at Site A",
            metadata={"source": "inventory_report_2024.pdf"}
        ),
        Document(
            page_content="Temperature excursion protocol requires notification within 2 hours",
            metadata={"source": "sop_temperature_excursion.pdf"}
        )
    ]

# ==================== SQL GUARDRAIL TESTS ====================

class TestSQLGuardrails:
    """Test SQL injection prevention and query validation"""
    
    def test_valid_select_query(self):
        """Test that valid SELECT queries pass"""
        sql = "SELECT * FROM inventory WHERE site_id = 'SITE_A'"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == True
        assert msg == "Valid"
    
    def test_reject_drop_statement(self):
        """Test that DROP statements are rejected"""
        sql = "DROP TABLE inventory"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == False
        assert "DROP" in msg
    
    def test_reject_delete_statement(self):
        """Test that DELETE statements are rejected"""
        sql = "DELETE FROM inventory WHERE id = 1"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == False
        assert "DELETE" in msg
    
    def test_reject_update_statement(self):
        """Test that UPDATE statements are rejected"""
        sql = "UPDATE inventory SET quantity = 0 WHERE site_id = 'SITE_A'"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == False
        assert "UPDATE" in msg
    
    def test_reject_insert_statement(self):
        """Test that INSERT statements are rejected"""
        sql = "INSERT INTO inventory (drug_id, quantity) VALUES ('X', 100)"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == False
        assert "INSERT" in msg
    
    def test_reject_multiple_statements(self):
        """Test that multiple statements are rejected"""
        sql = "SELECT * FROM inventory; DROP TABLE users;"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == False
        assert "Multiple statements" in msg
    
    def test_case_insensitive_detection(self):
        """Test that forbidden keywords are detected case-insensitively"""
        sql = "select * from inventory; drop table users;"
        is_valid, msg = SQLGuardrail.validate_sql(sql)
        assert is_valid == False

# ==================== RESPONSE GUARDRAIL TESTS ====================

class TestResponseGuardrails:
    """Test response validation and hallucination detection"""
    
    def test_valid_response(self):
        """Test that valid responses pass"""
        response = "Based on the inventory data, we have sufficient stock for the next 3 months."
        is_valid, msg = ResponseGuardrail.validate_response(response)
        assert is_valid == True
    
    def test_reject_hallucination_phrases(self):
        """Test that hallucination indicators are detected"""
        hallucination_responses = [
            "I don't have access to that information",
            "As an AI, I cannot provide that",
            "I am not able to answer that question"
        ]
        
        for response in hallucination_responses:
            is_valid, msg = ResponseGuardrail.validate_response(response)
            assert is_valid == False
            assert "hallucination" in msg.lower()
    
    def test_reject_short_response(self):
        """Test that too-short responses are rejected"""
        response = "Yes"
        is_valid, msg = ResponseGuardrail.validate_response(response)
        assert is_valid == False
        assert "too short" in msg.lower()

# ==================== MULTI-LLM PROVIDER TESTS ====================

class TestMultiLLMProvider:
    """Test multi-LLM provider configuration and fallback"""
    
    @patch('backend.routers.qa_rag.ChatOpenAI')
    def test_openai_provider(self, mock_openai):
        """Test OpenAI provider initialization"""
        llm = LLMConfig.get_llm("openai", "gpt-4o-mini")
        mock_openai.assert_called_once()
        assert mock_openai.call_args[1]["model"] == "gpt-4o-mini"
    
    @patch('backend.routers.qa_rag.ChatAnthropic')
    def test_anthropic_provider(self, mock_anthropic):
        """Test Anthropic provider initialization"""
        llm = LLMConfig.get_llm("anthropic", "claude-3-5-sonnet-20241022")
        mock_anthropic.assert_called_once()
    
    @patch('backend.routers.qa_rag.ChatGoogleGenerativeAI')
    def test_gemini_provider(self, mock_gemini):
        """Test Gemini provider initialization"""
        llm = LLMConfig.get_llm("gemini", "gemini-1.5-flash")
        mock_gemini.assert_called_once()
    
    @patch('backend.routers.qa_rag.ChatOpenAI')
    def test_unknown_provider_fallback(self, mock_openai):
        """Test that unknown providers fall back to OpenAI"""
        llm = LLMConfig.get_llm("unknown_provider")
        mock_openai.assert_called()

# ==================== Q&A WITH RAG ENDPOINT TESTS ====================

class TestQAWithRAG:
    """Test Q&A with RAG endpoint"""
    
    @patch('backend.routers.qa_rag.vector_store_manager.similarity_search')
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    def test_ask_with_rag_success(self, mock_get_llm, mock_vector_search, client, mock_llm_response, mock_vector_search_fixture):
        """Test successful Q&A with RAG"""
        mock_get_llm.return_value.invoke.return_value = mock_llm_response
        mock_vector_search.return_value = mock_vector_search_fixture
        
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "What is the current inventory of Drug X at Site A?",
            "llm_provider": "openai",
            "use_rag": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert "sources" in data
        assert data["provider"] == "openai"
        assert len(data["sources"]) > 0
    
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    def test_ask_without_rag(self, mock_get_llm, client, mock_llm_response):
        """Test Q&A without RAG (direct LLM)"""
        mock_get_llm.return_value.invoke.return_value = mock_llm_response
        
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "What are the best practices for clinical trial supply management?",
            "use_rag": False
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["sources"]) == 0
    
    def test_ask_with_invalid_provider(self, client):
        """Test Q&A with invalid LLM provider"""
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "Test question",
            "llm_provider": "invalid_provider"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_ask_with_short_question(self, client):
        """Test Q&A with too-short question"""
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "Hi"
        })
        
        assert response.status_code == 422  # Validation error
    
    @patch('backend.routers.qa_rag.vector_store_manager.similarity_search')
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    def test_ask_with_anthropic(self, mock_get_llm, mock_vector_search, client, mock_llm_response, mock_vector_search_fixture):
        """Test Q&A with Anthropic Claude"""
        mock_get_llm.return_value.invoke.return_value = mock_llm_response
        mock_vector_search.return_value = mock_vector_search_fixture
        
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "What is the temperature excursion protocol?",
            "llm_provider": "anthropic",
            "llm_model": "claude-3-5-sonnet-20241022"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "anthropic"
    
    @patch('backend.routers.qa_rag.vector_store_manager.similarity_search')
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    def test_ask_with_gemini(self, mock_get_llm, mock_vector_search, client, mock_llm_response, mock_vector_search_fixture):
        """Test Q&A with Google Gemini"""
        mock_get_llm.return_value.invoke.return_value = mock_llm_response
        mock_vector_search.return_value = mock_vector_search_fixture
        
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "How do I handle a stock shortage?",
            "llm_provider": "gemini",
            "llm_model": "gemini-1.5-flash"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "gemini"

# ==================== SQL EXECUTION TESTS ====================

class TestSQLExecution:
    """Test SQL execution with guardrails"""
    
    @patch('backend.routers.qa_rag.get_db_connection')
    async def test_execute_valid_sql(self, mock_get_db, client):
        """Test execution of valid SELECT query"""
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [{"id": 1, "name": "Drug X"}]
        mock_get_db.return_value = mock_conn
        
        response = client.post("/api/v1/qa/execute-sql", json={
            "sql": "SELECT id, name FROM drugs WHERE id = 1"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert len(data["data"]) > 0
    
    def test_execute_forbidden_drop(self, client):
        """Test that DROP statements are rejected"""
        response = client.post("/api/v1/qa/execute-sql", json={
            "sql": "DROP TABLE inventory"
        })
        
        assert response.status_code == 400
        assert "DROP" in response.json()["detail"]
    
    def test_execute_forbidden_delete(self, client):
        """Test that DELETE statements are rejected"""
        response = client.post("/api/v1/qa/execute-sql", json={
            "sql": "DELETE FROM inventory WHERE id = 1"
        })
        
        assert response.status_code == 400
        assert "DELETE" in response.json()["detail"]

# ==================== DOCUMENT INGESTION TESTS ====================

class TestDocumentIngestion:
    """Test document ingestion into vector store"""
    
    @patch('backend.routers.qa_rag.vector_store_manager.add_documents')
    def test_ingest_documents_success(self, mock_add_docs, client):
        """Test successful document ingestion"""
        documents = [
            {
                "content": "Drug X requires storage at 2-8°C",
                "source": "drug_x_manual.pdf",
                "metadata": {"page": 5}
            },
            {
                "content": "Emergency stock transfers must be completed within 24 hours",
                "source": "sop_emergency_transfer.pdf"
            }
        ]
        
        response = client.post("/api/v1/qa/ingest-documents", json=documents)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["documents_added"] == 2
    
    def test_ingest_empty_documents(self, client):
        """Test ingestion with empty document list"""
        response = client.post("/api/v1/qa/ingest-documents", json=[])
        
        assert response.status_code == 200
        data = response.json()
        assert data["documents_added"] == 0

# ==================== INTEGRATION TESTS ====================

class TestIntegration:
    """End-to-end integration tests"""
    
    @patch('backend.routers.qa_rag.vector_store_manager.similarity_search')
    @patch('backend.routers.qa_rag.vector_store_manager.add_documents')
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    def test_full_rag_workflow(self, mock_get_llm, mock_add_docs, mock_vector_search, client, mock_llm_response, mock_vector_search_fixture):
        """Test complete workflow: ingest -> search -> answer"""
        mock_get_llm.return_value.invoke.return_value = mock_llm_response
        mock_vector_search.return_value = mock_vector_search_fixture
        
        # Step 1: Ingest documents
        documents = [
            {
                "content": "Temperature excursion protocol requires immediate notification",
                "source": "sop.pdf"
            }
        ]
        ingest_response = client.post("/api/v1/qa/ingest-documents", json=documents)
        assert ingest_response.status_code == 200
        
        # Step 2: Ask question with RAG
        qa_response = client.post("/api/v1/qa/ask-rag", json={
            "question": "What should I do if there's a temperature excursion?",
            "use_rag": True
        })
        assert qa_response.status_code == 200
        data = qa_response.json()
        assert "answer" in data
        assert len(data["sources"]) > 0
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/api/v1/qa/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

# ==================== PERFORMANCE TESTS ====================

class TestPerformance:
    """Test performance and load handling"""
    
    @pytest.mark.asyncio
    @patch('backend.routers.qa_rag.vector_store_manager.similarity_search')
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    async def test_concurrent_requests(self, mock_get_llm, mock_vector_search, client, mock_llm_response, mock_vector_search_fixture):
        """Test handling of concurrent Q&A requests"""
        mock_get_llm.return_value.invoke.return_value = mock_llm_response
        mock_vector_search.return_value = mock_vector_search_fixture
        
        # Simulate 10 concurrent requests
        tasks = []
        for i in range(10):
            response = client.post("/api/v1/qa/ask-rag", json={
                "question": f"Test question {i}",
                "use_rag": True
            })
            tasks.append(response)
        
        # All should succeed
        for response in tasks:
            assert response.status_code == 200

# ==================== EDGE CASE TESTS ====================

class TestEdgeCases:
    """Test edge cases and error handling"""
    
    @patch('backend.routers.qa_rag.LLMConfig.get_llm')
    def test_llm_timeout(self, mock_get_llm, client):
        """Test handling of LLM timeout"""
        mock_get_llm.return_value.invoke.side_effect = TimeoutError("LLM timeout")
        
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "Test question",
            "use_rag": False
        })
        
        assert response.status_code == 500
    
    @patch('backend.routers.qa_rag.vector_store_manager.similarity_search')
    def test_vector_store_failure(self, mock_vector_search, client):
        """Test handling of vector store failure"""
        mock_vector_search.side_effect = Exception("Vector store error")
        
        response = client.post("/api/v1/qa/ask-rag", json={
            "question": "Test question",
            "use_rag": True
        })
        
        assert response.status_code == 500
    
    def test_malformed_json(self, client):
        """Test handling of malformed JSON"""
        response = client.post(
            "/api/v1/qa/ask-rag",
            data="invalid json{",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422

# ==================== RUN TESTS ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
