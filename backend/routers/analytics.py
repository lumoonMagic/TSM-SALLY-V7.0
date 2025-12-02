"""
Analytics Router - Phase 1C
Analytical algorithms for clinical trial supply management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import os

# Router without prefix (main.py will add it)
router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class DemandForecastRequest(BaseModel):
    """Request model for demand forecasting"""
    study_id: str
    site_id: str
    forecast_horizon_days: int = 90
    mode: str = "production"


class DemandForecastResponse(BaseModel):
    """Response model for demand forecast"""
    study_id: str
    site_id: str
    forecast_horizon_days: int
    forecasted_demand: List[Dict[str, Any]]
    total_units_required: int
    confidence_score: float
    generated_at: str


class InventoryOptimizationRequest(BaseModel):
    """Request model for inventory optimization"""
    study_id: str
    site_id: str
    product_id: str
    mode: str = "production"


class InventoryOptimizationResponse(BaseModel):
    """Response model for inventory optimization"""
    study_id: str
    site_id: str
    product_id: str
    recommended_reorder_point: int
    recommended_order_quantity: int
    safety_stock_level: int
    current_inventory: int
    days_of_supply: int
    optimization_strategy: str


class ShipmentRiskRequest(BaseModel):
    """Request model for shipment risk assessment"""
    shipment_id: str
    mode: str = "production"


class ShipmentRiskResponse(BaseModel):
    """Response model for shipment risk"""
    shipment_id: str
    risk_score: float
    risk_level: str  # "low", "medium", "high", "critical"
    risk_factors: List[Dict[str, Any]]
    recommended_actions: List[str]
    assessed_at: str


class EnrollmentPredictionRequest(BaseModel):
    """Request model for enrollment prediction"""
    study_id: str
    site_id: str
    prediction_horizon_days: int = 180
    mode: str = "production"


class EnrollmentPredictionResponse(BaseModel):
    """Response model for enrollment prediction"""
    study_id: str
    site_id: str
    prediction_horizon_days: int
    predicted_enrollments: List[Dict[str, Any]]
    estimated_completion_date: Optional[str]
    confidence_interval: Dict[str, int]
    current_enrollment_rate: float


class AnomalyDetectionRequest(BaseModel):
    """Request model for anomaly detection"""
    study_id: str
    analysis_period_days: int = 30
    mode: str = "production"


class AnomalyDetectionResponse(BaseModel):
    """Response model for anomaly detection"""
    study_id: str
    analysis_period_days: int
    anomalies_detected: List[Dict[str, Any]]
    anomaly_count: int
    severity_distribution: Dict[str, int]
    analyzed_at: str


class WasteMinimizationRequest(BaseModel):
    """Request model for waste minimization"""
    study_id: str
    analysis_horizon_days: int = 90
    mode: str = "production"


class WasteMinimizationResponse(BaseModel):
    """Response model for waste minimization"""
    study_id: str
    analysis_horizon_days: int
    at_risk_inventory: List[Dict[str, Any]]
    total_units_at_risk: int
    estimated_waste_value: float
    redistribution_opportunities: List[Dict[str, Any]]
    recommendations: List[str]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/demand-forecast", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Forecast future drug demand based on enrollment rates and dosing schedules
    """
    try:
        from backend.services.analytics.demand_forecasting import DemandForecaster
        
        forecaster = DemandForecaster(
            study_id=request.study_id,
            site_id=request.site_id,
            mode=request.mode
        )
        
        result = await forecaster.forecast(request.forecast_horizon_days)
        
        return DemandForecastResponse(
            study_id=request.study_id,
            site_id=request.site_id,
            forecast_horizon_days=request.forecast_horizon_days,
            forecasted_demand=result['forecast'],
            total_units_required=result['total_units'],
            confidence_score=result['confidence'],
            generated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demand forecast failed: {str(e)}")


@router.post("/inventory-optimize", response_model=InventoryOptimizationResponse)
async def optimize_inventory(request: InventoryOptimizationRequest):
    """
    Calculate optimal inventory levels and reorder points
    """
    try:
        from backend.services.analytics.inventory_optimization import InventoryOptimizer
        
        optimizer = InventoryOptimizer(
            study_id=request.study_id,
            site_id=request.site_id,
            product_id=request.product_id,
            mode=request.mode
        )
        
        result = await optimizer.optimize()
        
        return InventoryOptimizationResponse(
            study_id=request.study_id,
            site_id=request.site_id,
            product_id=request.product_id,
            recommended_reorder_point=result['reorder_point'],
            recommended_order_quantity=result['order_quantity'],
            safety_stock_level=result['safety_stock'],
            current_inventory=result['current_inventory'],
            days_of_supply=result['days_of_supply'],
            optimization_strategy=result['strategy']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory optimization failed: {str(e)}")


@router.post("/shipment-risk", response_model=ShipmentRiskResponse)
async def assess_shipment_risk(request: ShipmentRiskRequest):
    """
    Assess risk factors for a shipment
    """
    try:
        from backend.services.analytics.shipment_risk import ShipmentRiskAssessor
        
        assessor = ShipmentRiskAssessor(
            shipment_id=request.shipment_id,
            mode=request.mode
        )
        
        result = await assessor.assess()
        
        return ShipmentRiskResponse(
            shipment_id=request.shipment_id,
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            risk_factors=result['factors'],
            recommended_actions=result['actions'],
            assessed_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@router.post("/enrollment-predict", response_model=EnrollmentPredictionResponse)
async def predict_enrollment(request: EnrollmentPredictionRequest):
    """
    Predict future enrollment rates and completion dates
    """
    try:
        from backend.services.analytics.enrollment_prediction import EnrollmentPredictor
        
        predictor = EnrollmentPredictor(
            study_id=request.study_id,
            site_id=request.site_id,
            mode=request.mode
        )
        
        result = await predictor.predict(request.prediction_horizon_days)
        
        return EnrollmentPredictionResponse(
            study_id=request.study_id,
            site_id=request.site_id,
            prediction_horizon_days=request.prediction_horizon_days,
            predicted_enrollments=result['predictions'],
            estimated_completion_date=result['completion_date'],
            confidence_interval=result['confidence_interval'],
            current_enrollment_rate=result['current_rate']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrollment prediction failed: {str(e)}")


@router.post("/anomaly-detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detect supply chain anomalies and unusual patterns
    """
    try:
        from backend.services.analytics.anomaly_detection import AnomalyDetector
        
        detector = AnomalyDetector(
            study_id=request.study_id,
            mode=request.mode
        )
        
        result = await detector.detect(request.analysis_period_days)
        
        return AnomalyDetectionResponse(
            study_id=request.study_id,
            analysis_period_days=request.analysis_period_days,
            anomalies_detected=result['anomalies'],
            anomaly_count=result['count'],
            severity_distribution=result['severity'],
            analyzed_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.post("/waste-minimize", response_model=WasteMinimizationResponse)
async def minimize_waste(request: WasteMinimizationRequest):
    """
    Identify waste risks and redistribution opportunities
    """
    try:
        from backend.services.analytics.waste_minimization import WasteMinimizer
        
        minimizer = WasteMinimizer(
            study_id=request.study_id,
            mode=request.mode
        )
        
        result = await minimizer.analyze(request.analysis_horizon_days)
        
        return WasteMinimizationResponse(
            study_id=request.study_id,
            analysis_horizon_days=request.analysis_horizon_days,
            at_risk_inventory=result['at_risk'],
            total_units_at_risk=result['total_units'],
            estimated_waste_value=result['waste_value'],
            redistribution_opportunities=result['redistribution'],
            recommendations=result['recommendations']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Waste minimization failed: {str(e)}")


@router.get("/health")
async def analytics_health():
    """Health check for analytics service"""
    return {
        "status": "healthy",
        "service": "analytics",
        "algorithms": [
            "demand_forecast",
            "inventory_optimize",
            "shipment_risk",
            "enrollment_predict",
            "anomaly_detect",
            "waste_minimize"
        ]
    }
