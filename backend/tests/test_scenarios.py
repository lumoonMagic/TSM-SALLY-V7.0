"""
Test Suite for Clinical Trial Scenarios
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import os

os.environ["OPENAI_API_KEY"] = "test-key"

from backend.routers.scenarios import router, SCENARIOS

@pytest.fixture
def client():
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)

class TestScenariosList:
    """Test scenario listing"""
    
    def test_list_scenarios(self, client):
        """Test that all 12 scenarios are listed"""
        response = client.get("/api/v1/scenarios/list")
        
        assert response.status_code == 200
        data = response.json()
        assert "scenarios" in data
        assert len(data["scenarios"]) == 12
        
        # Verify structure
        scenario = data["scenarios"][0]
        assert "scenario_id" in scenario
        assert "name" in scenario
        assert "description" in scenario
        assert "severity" in scenario
    
    def test_scenario_ids_format(self, client):
        """Test that scenario IDs follow SCENARIO_XX format"""
        response = client.get("/api/v1/scenarios/list")
        data = response.json()
        
        for scenario in data["scenarios"]:
            assert scenario["scenario_id"].startswith("SCENARIO_")
            assert len(scenario["scenario_id"]) == 12  # SCENARIO_XX

class TestScenarioDetails:
    """Test scenario details endpoint"""
    
    def test_get_scenario_details(self, client):
        """Test retrieving specific scenario details"""
        response = client.get("/api/v1/scenarios/SCENARIO_01/details")
        
        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "SCENARIO_01"
        assert data["name"] == "Emergency Stock Transfer (SOS)"
        assert "triggers" in data
    
    def test_get_invalid_scenario(self, client):
        """Test retrieving non-existent scenario"""
        response = client.get("/api/v1/scenarios/SCENARIO_99/details")
        assert response.status_code == 404

class TestScenarioAnalysis:
    """Test scenario analysis with AI"""
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_analyze_scenario_01(self, mock_llm, client):
        """Test analysis of Emergency Stock Transfer scenario"""
        # Mock LLM response
        mock_response = Mock()
        mock_response.content = "Emergency stock transfer analysis..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        response = client.post("/api/v1/scenarios/analyze", json={
            "scenario_id": "SCENARIO_01",
            "context": {
                "site_id": "SITE_A",
                "drug_id": "DRUG_X",
                "current_stock": 5,
                "critical_threshold": 10,
                "patient_visit_date": "2024-02-15"
            },
            "llm_provider": "openai"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "SCENARIO_01"
        assert data["scenario_name"] == "Emergency Stock Transfer (SOS)"
        assert data["severity"] == "critical"
        assert len(data["recommended_actions"]) > 0
        assert len(data["sop_references"]) > 0
        assert "compliance_notes" in data
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_analyze_scenario_02(self, mock_llm, client):
        """Test analysis of Temperature Excursion scenario"""
        mock_response = Mock()
        mock_response.content = "Temperature excursion analysis..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        response = client.post("/api/v1/scenarios/analyze", json={
            "scenario_id": "SCENARIO_02",
            "context": {
                "shipment_id": "SHP_12345",
                "temp_min": "-5",
                "temp_max": "12",
                "excursion_duration": "2 hours",
                "product_type": "frozen"
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "SCENARIO_02"
        assert data["severity"] == "critical"
        
        # Check for specific actions
        action_titles = [action["title"] for action in data["recommended_actions"]]
        assert "Quarantine Affected Product" in action_titles
    
    def test_analyze_invalid_scenario(self, client):
        """Test analysis with invalid scenario ID"""
        response = client.post("/api/v1/scenarios/analyze", json={
            "scenario_id": "INVALID_ID",
            "context": {}
        })
        
        assert response.status_code == 422  # Validation error (regex pattern)
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_analyze_all_scenarios(self, mock_llm, client):
        """Test that all 12 scenarios can be analyzed"""
        mock_response = Mock()
        mock_response.content = "Scenario analysis..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        for scenario_id in SCENARIOS.keys():
            response = client.post("/api/v1/scenarios/analyze", json={
                "scenario_id": scenario_id,
                "context": {"test": "data"}
            })
            
            assert response.status_code == 200

class TestScenarioActions:
    """Test scenario recommended actions"""
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_action_priorities(self, mock_llm, client):
        """Test that actions have valid priorities"""
        mock_response = Mock()
        mock_response.content = "Actions..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        response = client.post("/api/v1/scenarios/analyze", json={
            "scenario_id": "SCENARIO_01",
            "context": {}
        })
        
        data = response.json()
        valid_priorities = ["critical", "high", "medium", "low"]
        
        for action in data["recommended_actions"]:
            assert action["priority"] in valid_priorities
            assert "action_id" in action
            assert "title" in action
            assert "description" in action
            assert "estimated_time" in action
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_sop_references(self, mock_llm, client):
        """Test that SOP references are provided"""
        mock_response = Mock()
        mock_response.content = "SOPs..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        response = client.post("/api/v1/scenarios/analyze", json={
            "scenario_id": "SCENARIO_01",
            "context": {}
        })
        
        data = response.json()
        assert len(data["sop_references"]) > 0
        assert any("SOP" in ref for ref in data["sop_references"])

class TestScenarioSimulation:
    """Test scenario simulation for training"""
    
    def test_simulate_scenario(self, client):
        """Test scenario simulation mode"""
        response = client.post("/api/v1/scenarios/SCENARIO_01/simulate", json={
            "stock_level": 5,
            "critical_threshold": 10,
            "time_to_visit": "48 hours"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["simulation_mode"] == True
        assert data["scenario_id"] == "SCENARIO_01"
        assert "outcome" in data
    
    def test_simulate_invalid_scenario(self, client):
        """Test simulation with invalid scenario"""
        response = client.post("/api/v1/scenarios/SCENARIO_99/simulate", json={})
        assert response.status_code == 404

class TestScenarioCompliance:
    """Test compliance and regulatory aspects"""
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_compliance_notes_present(self, mock_llm, client):
        """Test that compliance notes are provided for critical scenarios"""
        mock_response = Mock()
        mock_response.content = "Compliance..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        # Test critical scenarios
        for scenario_id in ["SCENARIO_01", "SCENARIO_02"]:
            response = client.post("/api/v1/scenarios/analyze", json={
                "scenario_id": scenario_id,
                "context": {}
            })
            
            data = response.json()
            assert data["compliance_notes"] is not None
            assert len(data["compliance_notes"]) > 0

class TestScenarioIntegration:
    """Integration tests for scenarios"""
    
    @patch('backend.routers.scenarios.LLMConfig.get_llm')
    def test_end_to_end_scenario_workflow(self, mock_llm, client):
        """Test complete scenario workflow"""
        mock_response = Mock()
        mock_response.content = "Workflow test..."
        mock_llm.return_value.invoke.return_value = mock_response
        
        # Step 1: List scenarios
        list_response = client.get("/api/v1/scenarios/list")
        assert list_response.status_code == 200
        
        # Step 2: Get scenario details
        details_response = client.get("/api/v1/scenarios/SCENARIO_01/details")
        assert details_response.status_code == 200
        
        # Step 3: Analyze scenario
        analyze_response = client.post("/api/v1/scenarios/analyze", json={
            "scenario_id": "SCENARIO_01",
            "context": {"site_id": "SITE_A"}
        })
        assert analyze_response.status_code == 200
        
        # Step 4: Simulate scenario
        simulate_response = client.post("/api/v1/scenarios/SCENARIO_01/simulate", json={
            "test_mode": True
        })
        assert simulate_response.status_code == 200

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
