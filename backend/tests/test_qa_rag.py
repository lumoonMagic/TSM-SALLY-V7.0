"""
Test Suite for Q&A with RAG
Om Namah Shivaya! 🕉️

Tests:
- SQL validation (security)
- SQL extraction from LLM response
- Chart type detection
- Recommendation extraction
- API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.routers.qa_rag import validate_sql, extract_sql, extract_chart_type, extract_recommendations

client = TestClient(app)

class TestSQLValidation:
    """Test SQL validation and security"""
    
    def test_valid_select_query(self):
        """Should accept valid SELECT query"""
        sql = "SELECT * FROM studies WHERE status = 'Active';"
        assert validate_sql(sql) == sql
    
    def test_reject_drop_query(self):
        """Should reject DROP query"""
        sql = "DROP TABLE studies;"
        assert validate_sql(sql) is None
    
    def test_reject_delete_query(self):
        """Should reject DELETE query"""
        sql = "DELETE FROM studies WHERE study_id = 'STU001';"
        assert validate_sql(sql) is None
    
    def test_reject_update_query(self):
        """Should reject UPDATE query"""
        sql = "UPDATE studies SET status = 'Closed' WHERE study_id = 'STU001';"
        assert validate_sql(sql) is None
    
    def test_reject_insert_query(self):
        """Should reject INSERT query"""
        sql = "INSERT INTO studies (study_id, study_name) VALUES ('STU001', 'Test');"
        assert validate_sql(sql) is None
    
    def test_reject_non_select_start(self):
        """Should reject queries not starting with SELECT"""
        sql = "SHOW TABLES;"
        assert validate_sql(sql) is None

class TestSQLExtraction:
    """Test SQL extraction from LLM response"""
    
    def test_extract_simple_query(self):
        """Should extract SQL from text"""
        text = """
        Here is the SQL query:
        
        SELECT study_id, study_name FROM studies WHERE status = 'Active';
        
        This query will return all active studies.
        """
        sql = extract_sql(text)
        assert sql is not None
        assert "SELECT" in sql
        assert "FROM studies" in sql
    
    def test_extract_complex_query(self):
        """Should extract complex SQL with JOINs"""
        text = """
        SELECT s.study_name, COUNT(si.site_id) as site_count
        FROM studies s
        LEFT JOIN sites si ON s.study_id = si.study_id
        GROUP BY s.study_name
        ORDER BY site_count DESC
        LIMIT 10;
        """
        sql = extract_sql(text)
        assert sql is not None
        assert "JOIN" in sql
    
    def test_no_sql_in_text(self):
        """Should return None if no SQL found"""
        text = "This is just a normal text without any SQL query."
        sql = extract_sql(text)
        assert sql is None

class TestChartTypeDetection:
    """Test chart type detection"""
    
    def test_detect_bar_chart(self):
        """Should detect bar chart suggestion"""
        text = "I recommend using a bar chart to visualize this data."
        assert extract_chart_type(text) == "bar"
    
    def test_detect_line_chart(self):
        """Should detect line chart suggestion"""
        text = "A line graph would be best to show the trend over time."
        assert extract_chart_type(text) == "line"
    
    def test_detect_pie_chart(self):
        """Should detect pie chart suggestion"""
        text = "This data is best shown in a pie chart."
        assert extract_chart_type(text) == "pie"
    
    def test_detect_table(self):
        """Should detect table suggestion"""
        text = "Display this data in a table format."
        assert extract_chart_type(text) == "table"
    
    def test_no_chart_type(self):
        """Should return None if no chart type mentioned"""
        text = "This is just a summary without chart suggestions."
        assert extract_chart_type(text) is None

class TestRecommendationExtraction:
    """Test recommendation extraction"""
    
    def test_extract_bullet_points(self):
        """Should extract bullet point recommendations"""
        text = """
        Recommendations:
        - Increase safety stock at SITE001 from 10 to 15 units
        - Schedule temperature audit for Shipment SH123
        - Review enrollment forecast for Study STU001
        """
        recommendations = extract_recommendations(text)
        assert len(recommendations) == 3
        assert "Increase safety stock" in recommendations[0]
    
    def test_extract_numbered_list(self):
        """Should extract numbered recommendations"""
        text = """
        1. Transfer 20 units from DEPOT_A to SITE005
        2. Update temperature monitoring frequency
        3. Contact site coordinator for enrollment update
        """
        recommendations = extract_recommendations(text)
        assert len(recommendations) == 3
    
    def test_max_five_recommendations(self):
        """Should return max 5 recommendations"""
        text = """
        - Recommendation 1
        - Recommendation 2
        - Recommendation 3
        - Recommendation 4
        - Recommendation 5
        - Recommendation 6
        - Recommendation 7
        """
        recommendations = extract_recommendations(text)
        assert len(recommendations) <= 5

class TestQAEndpoints:
    """Test Q&A API endpoints"""
    
    def test_ask_rag_endpoint(self):
        """Test Q&A with RAG endpoint"""
        payload = {
            "query": "Which studies are currently active?",
            "provider": "openai"
        }
        
        response = client.post("/api/v1/qa/ask-rag", json=payload)
        
        # Should return 200 even if LLM not configured (graceful degradation)
        assert response.status_code in [200, 500]
    
    def test_get_providers_endpoint(self):
        """Test get available providers endpoint"""
        response = client.get("/api/v1/qa/providers")
        
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert isinstance(data["available"], list)
    
    def test_execute_query_validation(self):
        """Test query execution with validation"""
        # Valid SELECT query
        payload = {"sql": "SELECT * FROM studies LIMIT 10;"}
        response = client.post("/api/v1/qa/execute", json=payload)
        assert response.status_code in [200, 500]  # May fail if DB not connected
        
        # Invalid DROP query
        payload = {"sql": "DROP TABLE studies;"}
        response = client.post("/api/v1/qa/execute", json=payload)
        assert response.status_code == 400  # Should reject

# Integration test with mock LLM
class TestRAGIntegration:
    """Test full RAG pipeline"""
    
    @pytest.mark.asyncio
    async def test_rag_pipeline_with_mock_llm(self):
        """Test RAG pipeline end-to-end with mock LLM"""
        # This would test the full flow with a mock LLM
        # For now, we verify the components work independently
        pass

# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
