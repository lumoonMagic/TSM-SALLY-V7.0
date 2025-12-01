# Analytical Algorithms for Sally TSM

## 📋 Overview
Advanced analytical algorithms for clinical trial supply management insights. These algorithms process data from the Gold Layer to provide actionable intelligence for trial supply managers.

---

## 🎯 Algorithm Categories

1. **Demand Forecasting**
2. **Inventory Optimization**
3. **Shipment Risk Assessment**
4. **Enrollment Prediction**
5. **Supply Anomaly Detection**
6. **Waste Minimization**

---

## 📊 Algorithm 1: Demand Forecasting

### Purpose
Predict future drug demand at site level based on enrollment rates, dosing schedules, and historical consumption patterns.

### Input Data
- Subject enrollment history
- Dosing regimen from protocol
- Dispensation history
- Visit schedules
- Historical consumption rates

### Algorithm

```python
"""
Demand Forecasting Algorithm
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

class DemandForecaster:
    """
    Forecasts drug demand using time-series analysis and
    protocol-driven dosing calculations
    """
    
    def __init__(self, study_id: str, site_id: str):
        self.study_id = study_id
        self.site_id = site_id
    
    def forecast_demand(self, 
                       forecast_horizon_days: int = 90) -> pd.DataFrame:
        """
        Forecast drug demand for specified horizon
        
        Args:
            forecast_horizon_days: Number of days to forecast
        
        Returns:
            DataFrame with daily demand forecast
        """
        # 1. Get historical enrollment rate
        enrollment_rate = self._calculate_enrollment_rate()
        
        # 2. Get dosing schedule from protocol
        dosing_schedule = self._get_dosing_schedule()
        
        # 3. Get current subjects and their treatment status
        active_subjects = self._get_active_subjects()
        
        # 4. Forecast new enrollments
        forecasted_subjects = self._forecast_enrollments(
            enrollment_rate, 
            forecast_horizon_days
        )
        
        # 5. Calculate drug requirements
        demand_forecast = self._calculate_drug_requirements(
            active_subjects,
            forecasted_subjects,
            dosing_schedule,
            forecast_horizon_days
        )
        
        # 6. Add safety stock buffer
        demand_forecast = self._apply_safety_buffer(demand_forecast)
        
        return demand_forecast
    
    def _calculate_enrollment_rate(self) -> float:
        """
        Calculate average enrollment rate (subjects per week)
        using exponential smoothing for recent trend
        """
        query = f"""
        SELECT 
            DATE_TRUNC('week', enrollment_date) as week,
            COUNT(*) as enrollments
        FROM gold_subjects
        WHERE site_id = '{self.site_id}'
          AND study_id = '{self.study_id}'
          AND enrollment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY week
        ORDER BY week
        """
        
        enrollments = pd.read_sql(query, self.db_connection)
        
        if enrollments.empty:
            return 0.5  # Default assumption: 0.5 subjects per week
        
        # Apply exponential smoothing (alpha = 0.3)
        alpha = 0.3
        rates = enrollments['enrollments'].values
        smoothed_rate = rates[0]
        
        for rate in rates[1:]:
            smoothed_rate = alpha * rate + (1 - alpha) * smoothed_rate
        
        return smoothed_rate
    
    def _get_dosing_schedule(self) -> Dict:
        """
        Get dosing schedule from study protocol
        """
        # This would come from protocol data or study configuration
        # Example structure:
        return {
            'treatment_arm_A': {
                'screening': {'dose': 0, 'kits': 0},
                'day_1': {'dose': 100, 'kits': 1},
                'week_2': {'dose': 100, 'kits': 1},
                'week_4': {'dose': 100, 'kits': 1},
                'week_8': {'dose': 100, 'kits': 1},
                'week_12': {'dose': 100, 'kits': 1},
                # ... continues for full treatment duration
                'frequency_weeks': 4,  # Dosing every 4 weeks
                'total_duration_weeks': 52  # 1 year treatment
            },
            'treatment_arm_B': {
                'screening': {'dose': 0, 'kits': 0},
                'day_1': {'dose': 200, 'kits': 2},
                'week_2': {'dose': 200, 'kits': 2},
                'week_4': {'dose': 200, 'kits': 2},
                # ... 
                'frequency_weeks': 4,
                'total_duration_weeks': 52
            },
            'placebo': {
                'screening': {'dose': 0, 'kits': 0},
                'day_1': {'dose': 0, 'kits': 1},
                'week_2': {'dose': 0, 'kits': 1},
                # ...
                'frequency_weeks': 4,
                'total_duration_weeks': 52
            }
        }
    
    def _get_active_subjects(self) -> pd.DataFrame:
        """Get currently active subjects"""
        query = f"""
        SELECT 
            subject_id,
            treatment_arm,
            enrollment_date,
            CURRENT_DATE - enrollment_date as days_in_study,
            subject_status
        FROM gold_subjects
        WHERE site_id = '{self.site_id}'
          AND study_id = '{self.study_id}'
          AND subject_status IN ('Enrolled', 'Active')
        """
        
        return pd.read_sql(query, self.db_connection)
    
    def _forecast_enrollments(self, 
                             enrollment_rate: float,
                             horizon_days: int) -> pd.DataFrame:
        """
        Forecast new subject enrollments
        
        Args:
            enrollment_rate: Subjects per week
            horizon_days: Forecast horizon
        
        Returns:
            DataFrame with forecasted enrollments
        """
        forecast_weeks = int(np.ceil(horizon_days / 7))
        
        # Apply randomness to enrollment rate (Poisson distribution)
        forecasted = []
        current_date = datetime.now()
        
        for week in range(forecast_weeks):
            # Poisson distribution around expected rate
            expected_enrollments = np.random.poisson(enrollment_rate)
            
            for _ in range(expected_enrollments):
                # Random day within the week
                days_offset = week * 7 + np.random.randint(0, 7)
                enrollment_date = current_date + timedelta(days=days_offset)
                
                # Assign treatment arm (randomization ratio: 1:1:1)
                treatment_arm = np.random.choice(
                    ['treatment_arm_A', 'treatment_arm_B', 'placebo'],
                    p=[0.33, 0.33, 0.34]
                )
                
                forecasted.append({
                    'subject_id': f'FORECAST_{week}_{_}',
                    'enrollment_date': enrollment_date,
                    'treatment_arm': treatment_arm,
                    'days_in_study': 0
                })
        
        return pd.DataFrame(forecasted)
    
    def _calculate_drug_requirements(self,
                                    active_subjects: pd.DataFrame,
                                    forecasted_subjects: pd.DataFrame,
                                    dosing_schedule: Dict,
                                    horizon_days: int) -> pd.DataFrame:
        """
        Calculate daily drug kit requirements
        """
        # Combine active and forecasted subjects
        all_subjects = pd.concat([active_subjects, forecasted_subjects])
        
        # Generate daily forecast
        forecast_dates = pd.date_range(
            start=datetime.now(),
            periods=horizon_days,
            freq='D'
        )
        
        daily_demand = []
        
        for date in forecast_dates:
            date_demand = {
                'date': date,
                'treatment_arm_A': 0,
                'treatment_arm_B': 0,
                'placebo': 0
            }
            
            for _, subject in all_subjects.iterrows():
                # Calculate subject's day in study on this date
                days_in_study = (date - subject['enrollment_date']).days
                
                if days_in_study < 0:
                    continue  # Not yet enrolled
                
                treatment_arm = subject['treatment_arm']
                arm_schedule = dosing_schedule.get(treatment_arm, {})
                
                # Check if this is a dosing day
                frequency_weeks = arm_schedule.get('frequency_weeks', 4)
                frequency_days = frequency_weeks * 7
                
                # Dosing occurs on day 1, then every frequency_days
                if days_in_study == 0 or (days_in_study % frequency_days == 0):
                    # Check if still within treatment duration
                    total_duration = arm_schedule.get('total_duration_weeks', 52) * 7
                    
                    if days_in_study <= total_duration:
                        kits_needed = arm_schedule.get('day_1', {}).get('kits', 1)
                        date_demand[treatment_arm] += kits_needed
            
            daily_demand.append(date_demand)
        
        return pd.DataFrame(daily_demand)
    
    def _apply_safety_buffer(self, 
                            demand_forecast: pd.DataFrame,
                            buffer_percentage: float = 0.20) -> pd.DataFrame:
        """
        Apply safety stock buffer (default 20%)
        """
        for arm in ['treatment_arm_A', 'treatment_arm_B', 'placebo']:
            demand_forecast[f'{arm}_with_buffer'] = (
                demand_forecast[arm] * (1 + buffer_percentage)
            ).apply(np.ceil)
        
        return demand_forecast

# Usage Example
forecaster = DemandForecaster(study_id='STUDY-123', site_id='SITE-001')
forecast = forecaster.forecast_demand(forecast_horizon_days=90)

print(forecast.head())
"""
Output:
        date  treatment_arm_A  treatment_arm_B  placebo  ...with_buffer
0 2024-12-19                3                2        2              4
1 2024-12-20                0                1        0              1
2 2024-12-21                2                2        1              3
...
"""
```

---

## 📊 Algorithm 2: Inventory Optimization (Economic Order Quantity)

### Purpose
Determine optimal order quantity and reorder points to minimize total inventory costs while maintaining service levels.

### Algorithm

```python
"""
Economic Order Quantity (EOQ) with Safety Stock
"""
import numpy as np
from scipy import stats

class InventoryOptimizer:
    """
    Calculate optimal inventory levels using EOQ model
    with safety stock for demand variability
    """
    
    def __init__(self, product_name: str, site_id: str):
        self.product_name = product_name
        self.site_id = site_id
    
    def calculate_optimal_inventory(self) -> Dict:
        """
        Calculate EOQ, reorder point, and safety stock
        
        Returns:
            Dictionary with optimization results
        """
        # 1. Get input parameters
        params = self._get_inventory_parameters()
        
        # 2. Calculate EOQ
        eoq = self._calculate_eoq(
            annual_demand=params['annual_demand'],
            order_cost=params['order_cost'],
            holding_cost_rate=params['holding_cost_rate'],
            unit_cost=params['unit_cost']
        )
        
        # 3. Calculate safety stock
        safety_stock = self._calculate_safety_stock(
            lead_time_days=params['lead_time_days'],
            demand_std_dev=params['demand_std_dev'],
            service_level=params['service_level']
        )
        
        # 4. Calculate reorder point
        reorder_point = self._calculate_reorder_point(
            lead_time_days=params['lead_time_days'],
            daily_demand=params['daily_demand'],
            safety_stock=safety_stock
        )
        
        # 5. Calculate total annual cost
        total_cost = self._calculate_total_cost(
            annual_demand=params['annual_demand'],
            eoq=eoq,
            order_cost=params['order_cost'],
            holding_cost_rate=params['holding_cost_rate'],
            unit_cost=params['unit_cost'],
            safety_stock=safety_stock
        )
        
        return {
            'product_name': self.product_name,
            'site_id': self.site_id,
            'economic_order_quantity': int(np.ceil(eoq)),
            'reorder_point': int(np.ceil(reorder_point)),
            'safety_stock': int(np.ceil(safety_stock)),
            'annual_demand': params['annual_demand'],
            'total_annual_cost': total_cost,
            'orders_per_year': params['annual_demand'] / eoq,
            'days_of_supply': (eoq / params['daily_demand'])
        }
    
    def _get_inventory_parameters(self) -> Dict:
        """Get inventory parameters from historical data"""
        
        # Query historical demand
        query = f"""
        SELECT 
            AVG(daily_dispensations) as avg_daily_demand,
            STDDEV(daily_dispensations) as demand_std_dev
        FROM (
            SELECT 
                DATE(dispensation_date) as date,
                COUNT(*) as daily_dispensations
            FROM gold_dispensations
            WHERE site_id = '{self.site_id}'
              AND product_name = '{self.product_name}'
              AND dispensation_date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY date
        ) daily_stats
        """
        
        demand_stats = pd.read_sql(query, self.db_connection).iloc[0]
        
        # Get product costs (from configuration or cost table)
        cost_query = f"""
        SELECT 
            unit_cost,
            order_cost,
            lead_time_days
        FROM gold_product_costs
        WHERE product_name = '{self.product_name}'
        """
        
        costs = pd.read_sql(cost_query, self.db_connection).iloc[0]
        
        return {
            'daily_demand': demand_stats['avg_daily_demand'],
            'annual_demand': demand_stats['avg_daily_demand'] * 365,
            'demand_std_dev': demand_stats['demand_std_dev'],
            'unit_cost': costs['unit_cost'],
            'order_cost': costs['order_cost'],  # Cost per order
            'holding_cost_rate': 0.25,  # 25% of unit cost per year
            'lead_time_days': costs['lead_time_days'],
            'service_level': 0.95  # 95% service level
        }
    
    def _calculate_eoq(self,
                      annual_demand: float,
                      order_cost: float,
                      holding_cost_rate: float,
                      unit_cost: float) -> float:
        """
        Calculate Economic Order Quantity
        
        EOQ = sqrt((2 * D * S) / H)
        where:
        D = annual demand
        S = order cost
        H = holding cost per unit per year
        """
        holding_cost = unit_cost * holding_cost_rate
        
        eoq = np.sqrt((2 * annual_demand * order_cost) / holding_cost)
        
        return eoq
    
    def _calculate_safety_stock(self,
                                lead_time_days: float,
                                demand_std_dev: float,
                                service_level: float) -> float:
        """
        Calculate safety stock based on service level
        
        SS = Z * σ * sqrt(L)
        where:
        Z = Z-score for service level
        σ = standard deviation of daily demand
        L = lead time in days
        """
        # Get Z-score for desired service level
        z_score = stats.norm.ppf(service_level)
        
        # Calculate safety stock
        safety_stock = z_score * demand_std_dev * np.sqrt(lead_time_days)
        
        return safety_stock
    
    def _calculate_reorder_point(self,
                                lead_time_days: float,
                                daily_demand: float,
                                safety_stock: float) -> float:
        """
        Calculate reorder point
        
        ROP = (Average daily demand * Lead time) + Safety stock
        """
        reorder_point = (daily_demand * lead_time_days) + safety_stock
        
        return reorder_point
    
    def _calculate_total_cost(self,
                             annual_demand: float,
                             eoq: float,
                             order_cost: float,
                             holding_cost_rate: float,
                             unit_cost: float,
                             safety_stock: float) -> float:
        """
        Calculate total annual inventory cost
        
        TC = (D/Q)*S + (Q/2)*H + SS*H
        where:
        D = annual demand
        Q = order quantity (EOQ)
        S = order cost
        H = holding cost per unit
        SS = safety stock
        """
        holding_cost = unit_cost * holding_cost_rate
        
        ordering_cost = (annual_demand / eoq) * order_cost
        holding_cost_eoq = (eoq / 2) * holding_cost
        holding_cost_safety = safety_stock * holding_cost
        
        total_cost = ordering_cost + holding_cost_eoq + holding_cost_safety
        
        return total_cost

# Usage Example
optimizer = InventoryOptimizer(
    product_name='Drug X 100mg',
    site_id='SITE-001'
)

result = optimizer.calculate_optimal_inventory()
print(result)
"""
Output:
{
    'product_name': 'Drug X 100mg',
    'site_id': 'SITE-001',
    'economic_order_quantity': 120,
    'reorder_point': 45,
    'safety_stock': 15,
    'annual_demand': 1200,
    'total_annual_cost': 15750.50,
    'orders_per_year': 10,
    'days_of_supply': 36
}
"""
```

---

## 📊 Algorithm 3: Shipment Risk Assessment

### Purpose
Assess risk of shipment delays and recommend mitigation actions.

### Algorithm

```python
"""
Shipment Risk Scoring Algorithm
"""
from datetime import datetime, timedelta
import numpy as np

class ShipmentRiskAssessor:
    """
    Calculate risk scores for shipments based on multiple factors
    """
    
    RISK_WEIGHTS = {
        'delay_risk': 0.30,
        'temperature_risk': 0.25,
        'customs_risk': 0.20,
        'urgency_risk': 0.15,
        'route_risk': 0.10
    }
    
    def assess_shipment_risk(self, shipment_id: str) -> Dict:
        """
        Calculate comprehensive risk score for shipment
        
        Returns:
            Dictionary with risk assessment and recommendations
        """
        # Get shipment data
        shipment = self._get_shipment_data(shipment_id)
        
        # Calculate individual risk components
        delay_risk = self._calculate_delay_risk(shipment)
        temperature_risk = self._calculate_temperature_risk(shipment)
        customs_risk = self._calculate_customs_risk(shipment)
        urgency_risk = self._calculate_urgency_risk(shipment)
        route_risk = self._calculate_route_risk(shipment)
        
        # Calculate overall risk score (0-100)
        overall_risk = (
            delay_risk * self.RISK_WEIGHTS['delay_risk'] +
            temperature_risk * self.RISK_WEIGHTS['temperature_risk'] +
            customs_risk * self.RISK_WEIGHTS['customs_risk'] +
            urgency_risk * self.RISK_WEIGHTS['urgency_risk'] +
            route_risk * self.RISK_WEIGHTS['route_risk']
        ) * 100
        
        # Determine risk level
        risk_level = self._classify_risk_level(overall_risk)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            overall_risk,
            {
                'delay_risk': delay_risk,
                'temperature_risk': temperature_risk,
                'customs_risk': customs_risk,
                'urgency_risk': urgency_risk,
                'route_risk': route_risk
            },
            shipment
        )
        
        return {
            'shipment_id': shipment_id,
            'overall_risk_score': round(overall_risk, 2),
            'risk_level': risk_level,
            'risk_components': {
                'delay_risk': round(delay_risk * 100, 2),
                'temperature_risk': round(temperature_risk * 100, 2),
                'customs_risk': round(customs_risk * 100, 2),
                'urgency_risk': round(urgency_risk * 100, 2),
                'route_risk': round(route_risk * 100, 2)
            },
            'recommendations': recommendations
        }
    
    def _calculate_delay_risk(self, shipment: Dict) -> float:
        """
        Calculate delay risk based on carrier performance
        and current transit status
        
        Returns: Risk score 0-1
        """
        # Get carrier's historical on-time delivery rate
        carrier_performance = self._get_carrier_performance(
            shipment['vendor']
        )
        
        # Calculate expected vs actual transit time
        days_in_transit = (datetime.now() - shipment['shipped_date']).days
        expected_days = shipment['expected_delivery_days']
        
        # Risk increases as we approach/exceed expected delivery
        transit_ratio = days_in_transit / expected_days
        
        if transit_ratio < 0.7:
            transit_risk = 0.1  # Low risk - on track
        elif transit_ratio < 1.0:
            transit_risk = 0.3  # Medium risk - approaching deadline
        elif transit_ratio < 1.2:
            transit_risk = 0.7  # High risk - late
        else:
            transit_risk = 1.0  # Critical risk - severely delayed
        
        # Combine carrier performance and transit status
        delay_risk = (
            (1 - carrier_performance['on_time_rate']) * 0.4 +
            transit_risk * 0.6
        )
        
        return delay_risk
    
    def _calculate_temperature_risk(self, shipment: Dict) -> float:
        """
        Calculate temperature excursion risk
        
        Returns: Risk score 0-1
        """
        # Get temperature monitoring data
        temp_data = self._get_temperature_logs(shipment['shipment_id'])
        
        if temp_data.empty:
            return 0.5  # Unknown - medium risk
        
        # Define acceptable range (2-8°C for typical biologics)
        min_temp = 2
        max_temp = 8
        
        # Calculate excursion metrics
        excursions = temp_data[
            (temp_data['temperature'] < min_temp) |
            (temp_data['temperature'] > max_temp)
        ]
        
        if excursions.empty:
            return 0.1  # Low risk - no excursions
        
        # Calculate severity
        excursion_duration = len(excursions) / len(temp_data)
        max_deviation = max(
            abs(excursions['temperature'].min() - min_temp),
            abs(excursions['temperature'].max() - max_temp)
        )
        
        # Risk based on duration and severity
        duration_risk = min(excursion_duration * 2, 1.0)
        severity_risk = min(max_deviation / 10, 1.0)
        
        temperature_risk = (duration_risk + severity_risk) / 2
        
        return temperature_risk
    
    def _calculate_customs_risk(self, shipment: Dict) -> float:
        """
        Calculate customs clearance risk
        
        Returns: Risk score 0-1
        """
        # Check if shipment is international
        if not shipment['is_international']:
            return 0.0  # No customs risk for domestic
        
        # Get destination country customs data
        customs_data = self._get_customs_complexity(
            shipment['destination_country']
        )
        
        # Risk factors:
        # 1. Country complexity score
        # 2. Documentation completeness
        # 3. Historical clearance time
        
        country_risk = customs_data['complexity_score']  # 0-1
        doc_completeness = shipment.get('documentation_complete', 0.8)
        doc_risk = 1 - doc_completeness
        
        # Check if currently in customs
        if shipment['current_status'] == 'In Customs':
            days_in_customs = (
                datetime.now() - shipment['customs_entry_date']
            ).days
            
            # Risk increases with time in customs
            if days_in_customs > 7:
                time_risk = 1.0
            elif days_in_customs > 3:
                time_risk = 0.7
            else:
                time_risk = 0.3
        else:
            time_risk = 0.2  # Baseline risk before customs
        
        customs_risk = (
            country_risk * 0.4 +
            doc_risk * 0.3 +
            time_risk * 0.3
        )
        
        return customs_risk
    
    def _calculate_urgency_risk(self, shipment: Dict) -> float:
        """
        Calculate urgency risk based on site inventory levels
        
        Returns: Risk score 0-1
        """
        # Get current site inventory for shipped products
        site_inventory = self._get_site_inventory(
            shipment['site_id'],
            shipment['contents']
        )
        
        # Get site's consumption rate
        consumption_rate = self._get_consumption_rate(
            shipment['site_id'],
            shipment['contents']
        )
        
        # Calculate days of supply remaining
        if consumption_rate > 0:
            days_of_supply = site_inventory / consumption_rate
        else:
            days_of_supply = 999  # No consumption - low urgency
        
        # Risk based on remaining supply
        if days_of_supply > 30:
            urgency_risk = 0.1  # Low urgency
        elif days_of_supply > 14:
            urgency_risk = 0.3  # Medium urgency
        elif days_of_supply > 7:
            urgency_risk = 0.7  # High urgency
        else:
            urgency_risk = 1.0  # Critical urgency
        
        return urgency_risk
    
    def _calculate_route_risk(self, shipment: Dict) -> float:
        """
        Calculate route/geopolitical risk
        
        Returns: Risk score 0-1
        """
        # Get route information
        origin = shipment['origin_country']
        destination = shipment['destination_country']
        
        # Check for high-risk regions or routes
        route_risk_data = self._get_route_risk_factors(origin, destination)
        
        risk_factors = {
            'political_stability': route_risk_data['political_risk'],  # 0-1
            'weather_events': route_risk_data['weather_risk'],  # 0-1
            'infrastructure_quality': 1 - route_risk_data['infrastructure_score']  # 0-1
        }
        
        # Average of risk factors
        route_risk = np.mean(list(risk_factors.values()))
        
        return route_risk
    
    def _classify_risk_level(self, risk_score: float) -> str:
        """Classify overall risk level"""
        if risk_score < 25:
            return 'LOW'
        elif risk_score < 50:
            return 'MEDIUM'
        elif risk_score < 75:
            return 'HIGH'
        else:
            return 'CRITICAL'
    
    def _generate_recommendations(self,
                                 overall_risk: float,
                                 risk_components: Dict,
                                 shipment: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Delay risk recommendations
        if risk_components['delay_risk'] > 0.6:
            recommendations.append(
                "Contact carrier for shipment status update and ETA confirmation"
            )
            recommendations.append(
                "Prepare contingency shipment if delay exceeds 48 hours"
            )
        
        # Temperature risk recommendations
        if risk_components['temperature_risk'] > 0.5:
            recommendations.append(
                "URGENT: Review temperature logs and assess product integrity"
            )
            recommendations.append(
                "Prepare product replacement if excursions exceed protocol limits"
            )
        
        # Customs risk recommendations
        if risk_components['customs_risk'] > 0.6:
            recommendations.append(
                "Engage customs broker to expedite clearance"
            )
            recommendations.append(
                "Verify all required documentation is complete and submitted"
            )
        
        # Urgency risk recommendations
        if risk_components['urgency_risk'] > 0.7:
            recommendations.append(
                "CRITICAL: Site inventory low - consider emergency supply"
            )
            recommendations.append(
                "Notify site of potential supply disruption"
            )
        
        # Route risk recommendations
        if risk_components['route_risk'] > 0.6:
            recommendations.append(
                "Monitor route for weather/political disruptions"
            )
            recommendations.append(
                "Consider alternative routing for future shipments"
            )
        
        # Overall high risk
        if overall_risk > 75:
            recommendations.append(
                "ESCALATE: High-risk shipment requires immediate attention"
            )
            recommendations.append(
                "Schedule daily status review until delivered"
            )
        
        return recommendations

# Usage Example
assessor = ShipmentRiskAssessor()
risk_assessment = assessor.assess_shipment_risk('SHIP-12345')

print(risk_assessment)
"""
Output:
{
    'shipment_id': 'SHIP-12345',
    'overall_risk_score': 68.5,
    'risk_level': 'HIGH',
    'risk_components': {
        'delay_risk': 75.0,
        'temperature_risk': 45.0,
        'customs_risk': 80.0,
        'urgency_risk': 70.0,
        'route_risk': 40.0
    },
    'recommendations': [
        'Contact carrier for shipment status update...',
        'Engage customs broker to expedite clearance',
        'CRITICAL: Site inventory low...',
        ...
    ]
}
"""
```

---

## 📊 Algorithm 4: Enrollment Prediction Model

### Purpose
Predict study enrollment trajectory using machine learning.

### Algorithm

```python
"""
Enrollment Prediction using ARIMA Time Series Model
"""
from statsmodels.tsa.arima.model import ARIMA
import pandas as pd
import numpy as np

class EnrollmentPredictor:
    """
    Predict study enrollment using time series analysis
    """
    
    def predict_enrollment(self,
                          study_id: str,
                          forecast_months: int = 12) -> Dict:
        """
        Predict enrollment for specified horizon
        
        Args:
            study_id: Study identifier
            forecast_months: Number of months to forecast
        
        Returns:
            Dictionary with predictions and confidence intervals
        """
        # 1. Get historical enrollment data
        enrollment_history = self._get_enrollment_history(study_id)
        
        # 2. Prepare time series
        ts_data = self._prepare_time_series(enrollment_history)
        
        # 3. Fit ARIMA model
        model = self._fit_arima_model(ts_data)
        
        # 4. Generate forecast
        forecast = self._generate_forecast(model, forecast_months)
        
        # 5. Calculate study completion date
        completion_prediction = self._predict_completion_date(
            study_id,
            forecast
        )
        
        return {
            'study_id': study_id,
            'historical_enrollment': enrollment_history,
            'forecast': forecast,
            'completion_prediction': completion_prediction,
            'model_metrics': {
                'aic': model.aic,
                'bic': model.bic,
                'rmse': self._calculate_rmse(model)
            }
        }
    
    def _fit_arima_model(self, ts_data: pd.Series):
        """
        Fit ARIMA model to time series data
        ARIMA(p,d,q) parameters selected based on AIC
        """
        # Try different parameter combinations
        best_aic = np.inf
        best_model = None
        
        for p in range(0, 3):
            for d in range(0, 2):
                for q in range(0, 3):
                    try:
                        model = ARIMA(ts_data, order=(p, d, q))
                        fitted_model = model.fit()
                        
                        if fitted_model.aic < best_aic:
                            best_aic = fitted_model.aic
                            best_model = fitted_model
                    except:
                        continue
        
        return best_model
    
    def _generate_forecast(self, model, forecast_months: int) -> pd.DataFrame:
        """Generate forecast with confidence intervals"""
        
        forecast_result = model.forecast(steps=forecast_months)
        
        # Get confidence intervals
        forecast_ci = model.get_forecast(steps=forecast_months).conf_int()
        
        forecast_df = pd.DataFrame({
            'month': pd.date_range(
                start=model.data.dates[-1],
                periods=forecast_months + 1,
                freq='M'
            )[1:],
            'predicted_enrollments': forecast_result,
            'lower_bound': forecast_ci.iloc[:, 0],
            'upper_bound': forecast_ci.iloc[:, 1]
        })
        
        # Cumulative enrollment
        forecast_df['cumulative_enrollment'] = forecast_df[
            'predicted_enrollments'
        ].cumsum()
        
        return forecast_df
```

---

## 🎯 Implementation Notes

1. **Database Integration:** All algorithms query the Gold Layer database
2. **Real-time vs Batch:** Run risk assessment real-time; forecasting/optimization daily
3. **Machine Learning:** Consider more advanced ML models (Random Forest, LSTM) for better accuracy
4. **Monitoring:** Track algorithm performance and retrain models regularly
5. **Alerts:** Generate automated alerts when risk thresholds exceeded

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-19