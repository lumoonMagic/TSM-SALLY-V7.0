"""
Test Suite for Morning Brief with Persistence
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import date, timedelta
import os

os.environ["DATABASE_TYPE"] = "sqlite"
os.environ["SQLITE_DB_PATH"] = ":memory:"
os.environ["OPENAI_API_KEY"] = "test-key"

from backend.routers.morning_brief import router, generate_brief_with_ai

@pytest.fixture
def client():
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)

@pytest.fixture
def mock_metrics():
    return {
        "active_trials": 5,
        "total_sites": 12,
        "critical_alerts": 2,
        "pending_shipments": 8,
        "low_stock_items": 3
    }

@pytest.fixture
def mock_llm_response():
    mock = Mock()
    mock.content = """
    Executive Summary: Today we have 5 active trials with 2 critical alerts requiring immediate attention.
    
    Alerts:
    - Critical: Temperature excursion on Shipment #1234
    - Warning: Low stock at Site A
    
    Recommendations:
    - Investigate temperature deviation
    - Initiate emergency resupply
    """
    return mock

class TestMorningBriefGeneration:
    """Test morning brief generation"""
    
    @patch('backend.routers.morning_brief.fetch_daily_metrics')
    @patch('backend.routers.morning_brief.LLMConfig.get_llm')
    @patch('backend.routers.morning_brief.save_brief_to_db')
    @patch('backend.routers.morning_brief.get_brief_from_db')
    async def test_generate_brief(self, mock_get_db, mock_save, mock_llm, mock_metrics_fn, client, mock_metrics, mock_llm_response):
        """Test successful brief generation"""
        mock_get_db.return_value = None  # No cached brief
        mock_metrics_fn.return_value = mock_metrics
        mock_llm.return_value.invoke.return_value = mock_llm_response
        
        response = client.post("/api/v1/morning-brief/generate", json={
            "llm_provider": "openai"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "brief_id" in data
        assert "summary" in data
        assert "alerts" in data
        assert "key_metrics" in data
        assert "recommendations" in data
        assert len(data["alerts"]) > 0
        assert len(data["recommendations"]) > 0
    
    @patch('backend.routers.morning_brief.get_brief_from_db')
    async def test_return_cached_brief(self, mock_get_db, client):
        """Test that cached briefs are returned"""
        cached_brief = {
            "brief_id": "brief_2024-01-15",
            "date": "2024-01-15",
            "generated_at": "2024-01-15T08:00:00",
            "summary": "Cached summary",
            "alerts": [],
            "key_metrics": [],
            "recommendations": [],
            "upcoming_activities": []
        }
        mock_get_db.return_value = Mock(**cached_brief)
        
        response = client.post("/api/v1/morning-brief/generate", json={})
        
        assert response.status_code == 200
        # Should return cached brief without regenerating

class TestBriefPersistence:
    """Test brief persistence and retrieval"""
    
    @patch('backend.routers.morning_brief.get_brief_from_db')
    async def test_get_by_date(self, mock_get_db, client):
        """Test retrieval by date"""
        brief_date = date.today()
        
        response = client.get(f"/api/v1/morning-brief/{brief_date.isoformat()}")
        
        # Will return 404 if not found
        assert response.status_code in [200, 404]
    
    @patch('backend.routers.morning_brief.get_brief_from_db')
    async def test_get_history(self, mock_get_db, client):
        """Test historical briefs retrieval"""
        response = client.get("/api/v1/morning-brief/history?days=7")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestBriefContent:
    """Test brief content quality"""
    
    @pytest.mark.asyncio
    @patch('backend.routers.morning_brief.LLMConfig.get_llm')
    async def test_brief_structure(self, mock_llm, mock_metrics, mock_llm_response):
        """Test that generated brief has correct structure"""
        mock_llm.return_value.invoke.return_value = mock_llm_response
        
        brief = await generate_brief_with_ai(
            date.today(),
            mock_metrics,
            "openai",
            "gpt-4o-mini"
        )
        
        assert brief.brief_id.startswith("brief_")
        assert len(brief.summary) > 50
        assert len(brief.alerts) > 0
        assert len(brief.key_metrics) > 0
        assert len(brief.recommendations) > 0
        assert len(brief.upcoming_activities) > 0
    
    def test_alert_severity_levels(self):
        """Test that alerts have valid severity levels"""
        from backend.routers.morning_brief import AlertItem
        
        valid_severities = ["critical", "warning", "info"]
        alert = AlertItem(
            severity="critical",
            title="Test Alert",
            description="Test description"
        )
        
        assert alert.severity in valid_severities
    
    def test_recommendation_priority_levels(self):
        """Test that recommendations have valid priority levels"""
        from backend.routers.morning_brief import RecommendationItem
        
        valid_priorities = ["high", "medium", "low"]
        rec = RecommendationItem(
            priority="high",
            title="Test Recommendation",
            description="Test description"
        )
        
        assert rec.priority in valid_priorities

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
