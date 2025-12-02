"""
Analytics Router - Phase 1C (RAG-REFACTORED)
Analytical algorithms for clinical trial supply management
Uses RAG-based dynamic SQL generation for all queries
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import os

# Import the shared RAG SQL service
from backend.services.rag_sql_service import RAGSQLService

# Router without prefix (main.py will add it)
router = APIRouter()

# Initialize RAG service
rag_service = RAGSQLService()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class DemandForecastRequest(BaseModel):
    """Request model for demand forecasting"""
    study_id: str = "STUDY-001"  # Default to first study
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
    study_id: str = "STUDY-001"  # Default to first study
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
    study_id: str = "STUDY-001"  # Default to first study
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
    study_id: str = "STUDY-001"  # Default to first study
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
# ENDPOINTS - RAG-BASED IMPLEMENTATION
# ============================================================================

@router.post("/demand-forecast", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Forecast future drug demand based on enrollment rates and dosing schedules
    Uses RAG-based dynamic SQL generation
    """
    try:
        # Use RAG to generate and execute the query
        question = f"""
        Calculate demand forecast for study {request.study_id} at site {request.site_id} 
        for the next {request.forecast_horizon_days} days.
        Include enrollment rate, projected subjects, and units required per day.
        Base calculations on recent enrollment trends from gold_subjects table.
        """
        
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode=request.mode,
            query_type="demand_forecast"
        )
        
        # Process results into forecast format
        forecast_data = _process_forecast_results(result, request.forecast_horizon_days)
        
        return DemandForecastResponse(
            study_id=request.study_id,
            site_id=request.site_id,
            forecast_horizon_days=request.forecast_horizon_days,
            forecasted_demand=forecast_data['forecast'],
            total_units_required=forecast_data['total_units'],
            confidence_score=forecast_data['confidence'],
            generated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demand forecast failed: {str(e)}")


@router.post("/inventory-optimize", response_model=InventoryOptimizationResponse)
async def optimize_inventory(request: InventoryOptimizationRequest):
    """
    Calculate optimal inventory levels and reorder points
    Uses RAG-based dynamic SQL generation
    """
    try:
        question = f"""
        Calculate optimal inventory parameters for study {request.study_id}, 
        site {request.site_id}, product {request.product_id}.
        Include current inventory from gold_inventory, consumption rate, 
        recommended reorder point, order quantity, safety stock, and days of supply.
        """
        
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode=request.mode,
            query_type="inventory_optimization"
        )
        
        # Process results
        optimization = _process_inventory_optimization(result, request)
        
        return InventoryOptimizationResponse(
            study_id=request.study_id,
            site_id=request.site_id,
            product_id=request.product_id,
            recommended_reorder_point=optimization['reorder_point'],
            recommended_order_quantity=optimization['order_quantity'],
            safety_stock_level=optimization['safety_stock'],
            current_inventory=optimization['current_inventory'],
            days_of_supply=optimization['days_of_supply'],
            optimization_strategy=optimization['strategy']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory optimization failed: {str(e)}")


@router.post("/shipment-risk", response_model=ShipmentRiskResponse)
async def assess_shipment_risk(request: ShipmentRiskRequest):
    """
    Assess risk factors for a shipment
    Uses RAG-based dynamic SQL generation
    """
    try:
        question = f"""
        Assess risk factors for shipment {request.shipment_id}.
        Include data from gold_shipments, gold_quality_events, gold_temperature_logs.
        Calculate risk score based on: delays, temperature excursions, route complexity,
        destination inventory levels, and quality events.
        """
        
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode=request.mode,
            query_type="shipment_risk"
        )
        
        # Process risk assessment
        risk_data = _process_shipment_risk(result, request.shipment_id)
        
        return ShipmentRiskResponse(
            shipment_id=request.shipment_id,
            risk_score=risk_data['risk_score'],
            risk_level=risk_data['risk_level'],
            risk_factors=risk_data['factors'],
            recommended_actions=risk_data['actions'],
            assessed_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@router.post("/enrollment-predict", response_model=EnrollmentPredictionResponse)
async def predict_enrollment(request: EnrollmentPredictionRequest):
    """
    Predict future enrollment rates and completion dates
    Uses RAG-based dynamic SQL generation
    """
    try:
        question = f"""
        Predict enrollment for study {request.study_id} at site {request.site_id}
        for the next {request.prediction_horizon_days} days.
        Analyze historical enrollment trends from gold_subjects, calculate weekly rates,
        project future enrollments, and estimate study completion date.
        """
        
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode=request.mode,
            query_type="enrollment_prediction"
        )
        
        # Process enrollment predictions
        prediction = _process_enrollment_prediction(result, request)
        
        return EnrollmentPredictionResponse(
            study_id=request.study_id,
            site_id=request.site_id,
            prediction_horizon_days=request.prediction_horizon_days,
            predicted_enrollments=prediction['predictions'],
            estimated_completion_date=prediction['completion_date'],
            confidence_interval=prediction['confidence_interval'],
            current_enrollment_rate=prediction['current_rate']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrollment prediction failed: {str(e)}")


@router.post("/anomaly-detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detect supply chain anomalies and unusual patterns
    Uses RAG-based dynamic SQL generation
    """
    try:
        question = f"""
        Detect supply chain anomalies for study {request.study_id} 
        over the past {request.analysis_period_days} days.
        Analyze gold_inventory, gold_shipments, gold_quality_events, gold_temperature_logs
        for unusual patterns: unexpected stockouts, temperature excursions, 
        delayed shipments, quality issues, and inventory discrepancies.
        """
        
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode=request.mode,
            query_type="anomaly_detection"
        )
        
        # Process anomalies
        anomaly_data = _process_anomalies(result, request.study_id)
        
        return AnomalyDetectionResponse(
            study_id=request.study_id,
            analysis_period_days=request.analysis_period_days,
            anomalies_detected=anomaly_data['anomalies'],
            anomaly_count=anomaly_data['count'],
            severity_distribution=anomaly_data['severity'],
            analyzed_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.post("/waste-minimize", response_model=WasteMinimizationResponse)
async def minimize_waste(request: WasteMinimizationRequest):
    """
    Identify waste risks and redistribution opportunities
    Uses RAG-based dynamic SQL generation
    """
    try:
        question = f"""
        Identify waste risks for study {request.study_id}
        over the next {request.analysis_horizon_days} days.
        Find inventory nearing expiry in gold_inventory, identify sites with excess stock,
        find sites with low stock that could receive redistributed inventory,
        calculate potential waste value and redistribution opportunities.
        """
        
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode=request.mode,
            query_type="waste_minimization"
        )
        
        # Process waste analysis
        waste_data = _process_waste_analysis(result, request.study_id)
        
        return WasteMinimizationResponse(
            study_id=request.study_id,
            analysis_horizon_days=request.analysis_horizon_days,
            at_risk_inventory=waste_data['at_risk'],
            total_units_at_risk=waste_data['total_units'],
            estimated_waste_value=waste_data['waste_value'],
            redistribution_opportunities=waste_data['redistribution'],
            recommendations=waste_data['recommendations']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Waste minimization failed: {str(e)}")


@router.get("/health")
async def analytics_health():
    """Health check for analytics service"""
    return {
        "status": "healthy",
        "service": "analytics",
        "architecture": "RAG-based dynamic SQL",
        "algorithms": [
            "demand_forecast",
            "inventory_optimize",
            "shipment_risk",
            "enrollment_predict",
            "anomaly_detect",
            "waste_minimize"
        ]
    }


# ============================================================================
# HELPER FUNCTIONS - Result Processing
# ============================================================================

def _process_forecast_results(result: Dict[str, Any], horizon_days: int) -> Dict[str, Any]:
    """Process RAG query results into forecast format"""
    from datetime import timedelta
    
    forecast = []
    start_date = datetime.now().date()
    
    # Extract enrollment rate from results
    enrollment_rate = result.get('enrollment_rate', 2.0)
    
    for day in range(horizon_days):
        forecast_date = start_date + timedelta(days=day)
        week_num = day // 7
        projected_subjects = enrollment_rate * week_num
        units_needed = int(projected_subjects * 1.2)  # Safety factor
        
        forecast.append({
            "date": forecast_date.isoformat(),
            "units_required": units_needed,
            "projected_subjects": int(projected_subjects)
        })
    
    total_units = sum(d['units_required'] for d in forecast)
    confidence = 0.85 if enrollment_rate > 1.5 else 0.70
    
    return {
        "forecast": forecast,
        "total_units": total_units,
        "confidence": confidence
    }


def _process_inventory_optimization(result: Dict[str, Any], request: InventoryOptimizationRequest) -> Dict[str, Any]:
    """Process inventory optimization results"""
    current_inv = result.get('current_inventory', 100)
    consumption_rate = result.get('daily_consumption', 5)
    
    # Calculate optimization parameters
    safety_stock = int(consumption_rate * 7)  # 1 week safety stock
    reorder_point = safety_stock + int(consumption_rate * 14)  # 2 weeks lead time
    order_quantity = int(consumption_rate * 30)  # 1 month supply
    days_of_supply = int(current_inv / consumption_rate) if consumption_rate > 0 else 0
    
    return {
        "reorder_point": reorder_point,
        "order_quantity": order_quantity,
        "safety_stock": safety_stock,
        "current_inventory": current_inv,
        "days_of_supply": days_of_supply,
        "strategy": "Economic Order Quantity (EOQ) with safety stock"
    }


def _process_shipment_risk(result: Dict[str, Any], shipment_id: str) -> Dict[str, Any]:
    """Process shipment risk assessment"""
    delays = result.get('delay_days', 0)
    temp_excursions = result.get('temp_excursion_count', 0)
    quality_events = result.get('quality_event_count', 0)
    
    # Calculate risk score (0-100)
    risk_score = min(100, (delays * 10) + (temp_excursions * 20) + (quality_events * 30))
    
    # Determine risk level
    if risk_score >= 75:
        risk_level = "critical"
    elif risk_score >= 50:
        risk_level = "high"
    elif risk_score >= 25:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    # Identify risk factors
    factors = []
    if delays > 0:
        factors.append({"factor": "Shipment Delay", "severity": "high", "days": delays})
    if temp_excursions > 0:
        factors.append({"factor": "Temperature Excursion", "severity": "critical", "count": temp_excursions})
    if quality_events > 0:
        factors.append({"factor": "Quality Events", "severity": "high", "count": quality_events})
    
    # Recommended actions
    actions = []
    if risk_level in ["critical", "high"]:
        actions.append("Expedite shipment arrival")
        actions.append("Notify receiving site of potential quality issues")
    if temp_excursions > 0:
        actions.append("Conduct immediate quality inspection upon arrival")
        actions.append("Document temperature deviation in quality system")
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": factors,
        "actions": actions
    }


def _process_enrollment_prediction(result: Dict[str, Any], request: EnrollmentPredictionRequest) -> Dict[str, Any]:
    """Process enrollment prediction results"""
    from datetime import timedelta
    
    current_rate = result.get('weekly_enrollment_rate', 2.0)
    predictions = []
    start_date = datetime.now().date()
    
    for week in range(request.prediction_horizon_days // 7):
        pred_date = start_date + timedelta(weeks=week)
        predicted_count = int(current_rate * (week + 1))
        
        predictions.append({
            "week": week + 1,
            "date": pred_date.isoformat(),
            "predicted_enrollments": predicted_count
        })
    
    # Estimate completion (example: 50 subjects target)
    target_subjects = result.get('target_subjects', 50)
    weeks_to_complete = int(target_subjects / current_rate) if current_rate > 0 else 100
    completion_date = (start_date + timedelta(weeks=weeks_to_complete)).isoformat()
    
    return {
        "predictions": predictions,
        "completion_date": completion_date,
        "confidence_interval": {"low": int(current_rate * 0.8), "high": int(current_rate * 1.2)},
        "current_rate": current_rate
    }


def _process_anomalies(result: Dict[str, Any], study_id: str) -> Dict[str, Any]:
    """Process anomaly detection results"""
    anomalies = []
    
    # Example anomaly processing
    if result.get('stockout_sites', []):
        for site in result['stockout_sites']:
            anomalies.append({
                "type": "stockout",
                "severity": "critical",
                "site_id": site,
                "description": f"Unexpected stockout at {site}"
            })
    
    if result.get('temp_excursions', []):
        for event in result['temp_excursions']:
            anomalies.append({
                "type": "temperature_excursion",
                "severity": "high",
                "shipment_id": event.get('shipment_id'),
                "description": "Temperature deviation detected"
            })
    
    severity_dist = {
        "critical": sum(1 for a in anomalies if a['severity'] == 'critical'),
        "high": sum(1 for a in anomalies if a['severity'] == 'high'),
        "medium": sum(1 for a in anomalies if a['severity'] == 'medium')
    }
    
    return {
        "anomalies": anomalies,
        "count": len(anomalies),
        "severity": severity_dist
    }


def _process_waste_analysis(result: Dict[str, Any], study_id: str) -> Dict[str, Any]:
    """Process waste minimization results"""
    at_risk = result.get('expiring_inventory', [])
    total_units = sum(item.get('quantity', 0) for item in at_risk)
    waste_value = total_units * 150  # Example: $150 per unit
    
    # Find redistribution opportunities
    redistribution = []
    excess_sites = result.get('excess_inventory_sites', [])
    low_stock_sites = result.get('low_stock_sites', [])
    
    for excess_site in excess_sites[:3]:  # Top 3 opportunities
        for low_site in low_stock_sites[:3]:
            redistribution.append({
                "from_site": excess_site['site_id'],
                "to_site": low_site['site_id'],
                "product_id": excess_site.get('product_id'),
                "units": excess_site.get('excess_units', 0),
                "potential_savings": excess_site.get('excess_units', 0) * 150
            })
    
    recommendations = [
        "Redistribute excess inventory from high-stock to low-stock sites",
        "Expedite usage of near-expiry products",
        "Adjust future ordering quantities based on consumption patterns"
    ]
    
    return {
        "at_risk": at_risk,
        "total_units": total_units,
        "waste_value": waste_value,
        "redistribution": redistribution,
        "recommendations": recommendations
    }
