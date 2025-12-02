"""
Demand Forecasting Service
Predicts future drug demand based on enrollment and dosing schedules
"""
import asyncpg
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta
import numpy as np


class DemandForecaster:
    """Forecast drug demand using time-series analysis"""
    
    def __init__(self, study_id: str, site_id: str, mode: str = "production"):
        self.study_id = study_id
        self.site_id = site_id
        self.mode = mode
        self.db_url = os.getenv("DATABASE_URL")
    
    async def forecast(self, horizon_days: int) -> Dict[str, Any]:
        """Generate demand forecast"""
        
        if self.mode == "demo":
            return self._generate_demo_forecast(horizon_days)
        
        # Production mode - actual database queries
        conn = await asyncpg.connect(self.db_url)
        
        try:
            # 1. Calculate enrollment rate
            enrollment_rate = await self._calculate_enrollment_rate(conn)
            
            # 2. Get dosing schedule
            dosing_schedule = await self._get_dosing_schedule(conn)
            
            # 3. Forecast demand
            forecast = await self._calculate_demand(
                conn, enrollment_rate, dosing_schedule, horizon_days
            )
            
            return {
                "forecast": forecast,
                "total_units": sum(day['units_required'] for day in forecast),
                "confidence": self._calculate_confidence(enrollment_rate)
            }
            
        finally:
            await conn.close()
    
    async def _calculate_enrollment_rate(self, conn) -> float:
        """Calculate average enrollment rate (subjects per week)"""
        query = """
        SELECT 
            DATE_TRUNC('week', enrollment_date) as week,
            COUNT(*) as enrollments
        FROM subjects
        WHERE site_id = $1 AND study_id = $2
          AND enrollment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY week
        ORDER BY week
        """
        
        rows = await conn.fetch(query, self.site_id, self.study_id)
        
        if not rows:
            return 0.5  # Default: 0.5 subjects per week
        
        # Exponential smoothing
        alpha = 0.3
        rates = [row['enrollments'] for row in rows]
        smoothed = rates[0]
        
        for rate in rates[1:]:
            smoothed = alpha * rate + (1 - alpha) * smoothed
        
        return smoothed
    
    async def _get_dosing_schedule(self, conn) -> Dict:
        """Get dosing schedule from study protocol"""
        # Simplified - in production, this would come from protocol data
        return {
            'frequency_weeks': 4,
            'kits_per_dose': 1,
            'treatment_duration_weeks': 52
        }
    
    async def _calculate_demand(
        self, conn, enrollment_rate, dosing_schedule, horizon_days
    ) -> List[Dict]:
        """Calculate daily demand forecast"""
        forecast = []
        start_date = datetime.now().date()
        
        for day in range(horizon_days):
            forecast_date = start_date + timedelta(days=day)
            
            # Projected new subjects
            week_num = day // 7
            projected_subjects = enrollment_rate * week_num
            
            # Calculate kits needed
            kits_needed = int(
                projected_subjects * 
                dosing_schedule['kits_per_dose'] / 
                dosing_schedule['frequency_weeks']
            )
            
            forecast.append({
                "date": forecast_date.isoformat(),
                "units_required": kits_needed,
                "projected_subjects": int(projected_subjects)
            })
        
        return forecast
    
    def _calculate_confidence(self, enrollment_rate: float) -> float:
        """Calculate forecast confidence score"""
        if enrollment_rate > 2:
            return 0.9
        elif enrollment_rate > 1:
            return 0.75
        else:
            return 0.6
    
    def _generate_demo_forecast(self, horizon_days: int) -> Dict[str, Any]:
        """Generate demo forecast data"""
        forecast = []
        start_date = datetime.now().date()
        base_demand = 10
        
        for day in range(horizon_days):
            # Add some variation
            variation = np.random.randint(-2, 3)
            units = max(0, base_demand + variation + (day // 7))
            
            forecast.append({
                "date": (start_date + timedelta(days=day)).isoformat(),
                "units_required": units,
                "projected_subjects": day // 7 + 5
            })
        
        return {
            "forecast": forecast,
            "total_units": sum(d['units_required'] for d in forecast),
            "confidence": 0.85
        }
