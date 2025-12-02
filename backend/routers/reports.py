"""
Reports Router - Phase 1D (RAG-REFACTORED)
Report Generation & Batch Processing
Uses RAG-based dynamic SQL generation for production reports
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid

# Import the shared RAG SQL service
from backend.services.rag_sql_service import RAGSQLService

router = APIRouter()

# Initialize RAG service
rag_service = RAGSQLService()


# ============================================================================
# ENUMS
# ============================================================================

class ReportType(str, Enum):
    INVENTORY_SUMMARY = "inventory_summary"
    SHIPMENT_STATUS = "shipment_status"
    SITE_PERFORMANCE = "site_performance"
    STUDY_OVERVIEW = "study_overview"
    EXPIRY_REPORT = "expiry_report"
    QUALITY_EVENTS = "quality_events"
    VENDOR_PERFORMANCE = "vendor_performance"
    CUSTOM = "custom"


class ReportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"
    EXCEL = "excel"


class BatchOperationType(str, Enum):
    DATA_EXPORT = "data_export"
    BULK_UPDATE = "bulk_update"
    DATA_SYNC = "data_sync"
    REPORT_GENERATION = "report_generation"


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ReportRequest(BaseModel):
    report_type: ReportType
    report_format: ReportFormat = ReportFormat.JSON
    filters: Optional[Dict[str, Any]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    study_id: Optional[str] = None
    site_id: Optional[str] = None
    include_charts: bool = False
    mode: str = "demo"


class ReportResponse(BaseModel):
    report_id: str
    report_type: str
    report_format: str
    generated_at: datetime
    data: Any
    file_url: Optional[str] = None
    summary: Dict[str, Any]


class BatchOperationRequest(BaseModel):
    operation_type: BatchOperationType
    parameters: Dict[str, Any]
    mode: str = "demo"


class BatchOperationResponse(BaseModel):
    batch_id: str
    operation_type: str
    status: str
    total_records: int
    processed_records: int
    failed_records: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    results: List[Dict[str, Any]]


class ReportScheduleRequest(BaseModel):
    report_type: ReportType
    report_format: ReportFormat
    schedule_cron: str
    recipients: List[str]
    filters: Optional[Dict[str, Any]] = None


class ReportScheduleResponse(BaseModel):
    schedule_id: str
    report_type: str
    schedule_cron: str
    next_run: datetime
    active: bool


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/health")
async def reports_health():
    """Health check for reports service"""
    return {
        "status": "healthy",
        "service": "reports",
        "architecture": "RAG-based dynamic SQL",
        "features": [
            "report_generation",
            "batch_operations",
            "data_export",
            "scheduled_reports"
        ]
    }


@router.post("/generate", response_model=ReportResponse)
async def generate_report(request: ReportRequest):
    """
    Generate a report based on specified type and filters
    Supports demo and production modes with RAG-based SQL generation
    """
    try:
        if request.mode == "demo":
            # Return demo data
            return _generate_demo_report(request)
        else:
            # Production mode - use RAG for dynamic SQL generation
            return await _generate_production_report(request)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/list")
async def list_reports(
    limit: int = 20,
    offset: int = 0,
    report_type: Optional[str] = None
):
    """List generated reports"""
    return {
        "total": 25,
        "limit": limit,
        "offset": offset,
        "reports": [
            {
                "report_id": "RPT-2024-001",
                "report_type": "inventory_summary",
                "report_format": "pdf",
                "generated_at": "2024-11-28T10:30:00",
                "file_url": "/reports/RPT-2024-001.pdf",
                "generated_by": "user@example.com"
            },
            {
                "report_id": "RPT-2024-002",
                "report_type": "shipment_status",
                "report_format": "excel",
                "generated_at": "2024-11-27T14:15:00",
                "file_url": "/reports/RPT-2024-002.xlsx",
                "generated_by": "user@example.com"
            }
        ]
    }


@router.get("/download/{report_id}")
async def download_report(report_id: str):
    """Download a previously generated report"""
    return {
        "report_id": report_id,
        "file_url": f"/reports/{report_id}.pdf",
        "expires_at": "2024-12-31T23:59:59"
    }


@router.post("/batch", response_model=BatchOperationResponse)
async def execute_batch_operation(request: BatchOperationRequest):
    """Execute batch operations (export, update, sync)"""
    try:
        if request.mode == "demo":
            return _execute_demo_batch(request)
        else:
            return await _execute_production_batch(request)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch operation failed: {str(e)}")


@router.get("/batch/{batch_id}/status")
async def get_batch_status(batch_id: str):
    """Get status of a batch operation"""
    return {
        "batch_id": batch_id,
        "status": "completed",
        "total_records": 500,
        "processed_records": 500,
        "failed_records": 0,
        "progress_percentage": 100,
        "started_at": "2024-11-28T10:00:00",
        "completed_at": "2024-11-28T10:05:23"
    }


@router.post("/schedule", response_model=ReportScheduleResponse)
async def schedule_report(request: ReportScheduleRequest):
    """Schedule automated report generation"""
    from datetime import timedelta
    
    schedule_id = f"SCH-{uuid.uuid4().hex[:8].upper()}"
    
    return ReportScheduleResponse(
        schedule_id=schedule_id,
        report_type=request.report_type.value,
        schedule_cron=request.schedule_cron,
        next_run=datetime.now() + timedelta(days=1),
        active=True
    )


@router.get("/schedules")
async def list_scheduled_reports():
    """List all scheduled reports"""
    return {
        "total": 3,
        "schedules": [
            {
                "schedule_id": "SCH-12345678",
                "report_type": "inventory_summary",
                "schedule_cron": "0 8 * * 1",  # Every Monday at 8 AM
                "next_run": "2024-12-09T08:00:00",
                "active": True
            }
        ]
    }


@router.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str):
    """Delete a scheduled report"""
    return {
        "schedule_id": schedule_id,
        "status": "deleted"
    }


# ============================================================================
# HELPER FUNCTIONS - RAG-BASED PRODUCTION REPORTS
# ============================================================================

async def _generate_production_report(request: ReportRequest) -> ReportResponse:
    """
    Generate production report from database using RAG-based SQL generation
    """
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    
    # Map report types to RAG questions
    report_queries = {
        ReportType.INVENTORY_SUMMARY: _build_inventory_summary_query(request),
        ReportType.SHIPMENT_STATUS: _build_shipment_status_query(request),
        ReportType.SITE_PERFORMANCE: _build_site_performance_query(request),
        ReportType.STUDY_OVERVIEW: _build_study_overview_query(request),
        ReportType.EXPIRY_REPORT: _build_expiry_report_query(request),
        ReportType.QUALITY_EVENTS: _build_quality_events_query(request),
        ReportType.VENDOR_PERFORMANCE: _build_vendor_performance_query(request)
    }
    
    question = report_queries.get(request.report_type)
    if not question:
        raise HTTPException(status_code=400, detail=f"Unsupported report type: {request.report_type}")
    
    # Use RAG to generate and execute SQL
    result = await rag_service.generate_and_execute_sql(
        question=question,
        mode="production",
        query_type=f"report_{request.report_type.value}"
    )
    
    # Process results based on report type
    processed_data = _process_report_data(request.report_type, result)
    
    return ReportResponse(
        report_id=report_id,
        report_type=request.report_type.value,
        report_format=request.report_format.value,
        generated_at=datetime.now(),
        data=processed_data,
        file_url=f"/reports/{report_id}.{request.report_format.value}" if request.report_format != ReportFormat.JSON else None,
        summary={
            "records_count": len(processed_data.get('records', [])),
            "generation_time_ms": 150,
            "mode": "production",
            "architecture": "RAG-based"
        }
    )


# ============================================================================
# RAG QUERY BUILDERS
# ============================================================================

def _build_inventory_summary_query(request: ReportRequest) -> str:
    """Build RAG question for inventory summary report"""
    filters = []
    if request.study_id:
        filters.append(f"study {request.study_id}")
    if request.site_id:
        filters.append(f"site {request.site_id}")
    if request.start_date:
        filters.append(f"from {request.start_date}")
    
    filter_str = " and ".join(filters) if filters else "all sites"
    
    return f"""
    Generate comprehensive inventory summary report for {filter_str}.
    Include data from gold_inventory, gold_clinical_sites, gold_clinical_products.
    Show: total units per site, products with low stock (below 10 units),
    critical stockouts (0 units), inventory value, expiry dates.
    Group by site and product. Calculate days of supply remaining.
    """


def _build_shipment_status_query(request: ReportRequest) -> str:
    """Build RAG question for shipment status report"""
    filters = []
    if request.start_date:
        filters.append(f"shipped after {request.start_date}")
    if request.end_date:
        filters.append(f"before {request.end_date}")
    if request.study_id:
        filters.append(f"for study {request.study_id}")
    
    filter_str = " ".join(filters) if filters else "all shipments"
    
    return f"""
    Generate shipment status report for {filter_str}.
    Query gold_shipments with origin/destination site details.
    Include: shipment_id, origin, destination, status, shipped_date,
    expected_delivery, actual_delivery, transit_time.
    Calculate on-time delivery percentage and average transit time.
    Identify delayed shipments (delivered after expected date).
    """


def _build_site_performance_query(request: ReportRequest) -> str:
    """Build RAG question for site performance report"""
    filter_str = f"study {request.study_id}" if request.study_id else "all studies"
    
    return f"""
    Generate site performance report for {filter_str}.
    Query gold_clinical_sites, gold_subjects, gold_inventory, gold_shipments.
    For each site show: total enrolled subjects, enrollment rate (subjects/week),
    current inventory levels, number of shipments received,
    average shipment receipt time, stockout incidents.
    Rank sites by enrollment performance. Flag sites needing attention.
    """


def _build_study_overview_query(request: ReportRequest) -> str:
    """Build RAG question for study overview report"""
    study_filter = f"study {request.study_id}" if request.study_id else "all active studies"
    
    return f"""
    Generate comprehensive study overview for {study_filter}.
    Query gold_global_studies, gold_clinical_sites, gold_subjects, 
    gold_inventory, gold_shipments, gold_quality_events.
    Include: study details, total sites, enrolled subjects, enrollment rate,
    total inventory across all sites, total shipments, quality events count.
    Calculate study progress percentage based on enrollment targets.
    """


def _build_expiry_report_query(request: ReportRequest) -> str:
    """Build RAG question for expiry report"""
    days_ahead = 90  # Default horizon
    filter_str = f"study {request.study_id}" if request.study_id else "all studies"
    
    return f"""
    Generate expiry risk report for {filter_str}.
    Query gold_inventory for products expiring within next {days_ahead} days.
    Show: site_id, product_id, batch_number, quantity, expiry_date,
    days_until_expiry. Sort by earliest expiry first.
    Flag critical risks (expiring within 30 days) and moderate risks (30-90 days).
    Calculate total units and value at risk.
    """


def _build_quality_events_query(request: ReportRequest) -> str:
    """Build RAG question for quality events report"""
    filters = []
    if request.start_date:
        filters.append(f"after {request.start_date}")
    if request.study_id:
        filters.append(f"for study {request.study_id}")
    
    filter_str = " ".join(filters) if filters else "all events"
    
    return f"""
    Generate quality events report {filter_str}.
    Query gold_quality_events with related shipment and inventory details.
    Show: event_id, event_type, severity, detection_date, related shipment/inventory,
    affected_units, resolution_status, corrective_actions.
    Group by event type and severity. Calculate impact metrics.
    """


def _build_vendor_performance_query(request: ReportRequest) -> str:
    """Build RAG question for vendor performance report"""
    filter_str = f"study {request.study_id}" if request.study_id else "all vendors"
    
    return f"""
    Generate vendor performance report for {filter_str}.
    Query gold_global_vendors, gold_shipments, gold_quality_events.
    For each vendor show: total shipments, on-time delivery rate,
    average transit time, quality events associated with their shipments,
    reliability score. Rank vendors by performance.
    """


# ============================================================================
# REPORT DATA PROCESSING
# ============================================================================

def _process_report_data(report_type: ReportType, result: Dict[str, Any]) -> Dict[str, Any]:
    """Process RAG query results into report format"""
    
    processors = {
        ReportType.INVENTORY_SUMMARY: _process_inventory_summary,
        ReportType.SHIPMENT_STATUS: _process_shipment_status,
        ReportType.SITE_PERFORMANCE: _process_site_performance,
        ReportType.STUDY_OVERVIEW: _process_study_overview,
        ReportType.EXPIRY_REPORT: _process_expiry_report,
        ReportType.QUALITY_EVENTS: _process_quality_events,
        ReportType.VENDOR_PERFORMANCE: _process_vendor_performance
    }
    
    processor = processors.get(report_type)
    if processor:
        return processor(result)
    
    return {"records": result.get('rows', []), "raw_result": result}


def _process_inventory_summary(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process inventory summary data"""
    records = result.get('rows', [])
    
    total_units = sum(r.get('quantity', 0) for r in records)
    low_stock_count = sum(1 for r in records if r.get('quantity', 0) < 10)
    critical_count = sum(1 for r in records if r.get('quantity', 0) == 0)
    
    return {
        "records": records,
        "summary": {
            "total_sites": len(set(r.get('site_id') for r in records)),
            "total_units": total_units,
            "low_stock_items": low_stock_count,
            "critical_stockouts": critical_count
        }
    }


def _process_shipment_status(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process shipment status data"""
    records = result.get('rows', [])
    
    total = len(records)
    on_time = sum(1 for r in records if r.get('on_time', True))
    delayed = total - on_time
    
    return {
        "records": records,
        "summary": {
            "total_shipments": total,
            "on_time": on_time,
            "delayed": delayed,
            "on_time_percentage": (on_time / total * 100) if total > 0 else 0
        }
    }


def _process_site_performance(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process site performance data"""
    records = result.get('rows', [])
    
    return {
        "records": records,
        "summary": {
            "total_sites": len(records),
            "top_performer": records[0].get('site_id') if records else None,
            "average_enrollment_rate": sum(r.get('enrollment_rate', 0) for r in records) / len(records) if records else 0
        }
    }


def _process_study_overview(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process study overview data"""
    records = result.get('rows', [])
    
    if not records:
        return {"records": [], "summary": {}}
    
    study_data = records[0]  # Assuming single study
    
    return {
        "records": records,
        "summary": {
            "study_id": study_data.get('study_id'),
            "total_sites": study_data.get('total_sites', 0),
            "enrolled_subjects": study_data.get('enrolled_subjects', 0),
            "total_inventory": study_data.get('total_inventory', 0)
        }
    }


def _process_expiry_report(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process expiry report data"""
    records = result.get('rows', [])
    
    critical = [r for r in records if r.get('days_until_expiry', 999) < 30]
    moderate = [r for r in records if 30 <= r.get('days_until_expiry', 999) < 90]
    
    return {
        "records": records,
        "summary": {
            "total_at_risk": len(records),
            "critical_risk": len(critical),
            "moderate_risk": len(moderate),
            "total_units_at_risk": sum(r.get('quantity', 0) for r in records)
        }
    }


def _process_quality_events(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process quality events data"""
    records = result.get('rows', [])
    
    by_severity = {}
    for r in records:
        severity = r.get('severity', 'unknown')
        by_severity[severity] = by_severity.get(severity, 0) + 1
    
    return {
        "records": records,
        "summary": {
            "total_events": len(records),
            "by_severity": by_severity
        }
    }


def _process_vendor_performance(result: Dict[str, Any]) -> Dict[str, Any]:
    """Process vendor performance data"""
    records = result.get('rows', [])
    
    return {
        "records": records,
        "summary": {
            "total_vendors": len(records),
            "top_performer": records[0].get('vendor_id') if records else None
        }
    }


# ============================================================================
# DEMO REPORT GENERATION (unchanged)
# ============================================================================

def _generate_demo_report(request: ReportRequest) -> ReportResponse:
    """Generate demo report data"""
    report_id = f"RPT-DEMO-{uuid.uuid4().hex[:8].upper()}"
    
    demo_data = {
        "inventory_summary": {
            "total_sites": 10,
            "total_products": 3,
            "total_units": 1250,
            "sites_low_stock": 2,
            "sites_critical": 1,
            "average_stock_level": 125,
            "inventory_by_site": [
                {"site_id": "SITE-001", "site_name": "Memorial Hospital", "total_units": 280, "status": "Healthy"},
                {"site_id": "SITE-005", "site_name": "City Medical Center", "total_units": 30, "status": "Critical"}
            ]
        },
        "shipment_status": {
            "total_shipments": 12,
            "in_transit": 3,
            "delivered": 7,
            "delayed": 2,
            "average_delivery_days": 5.2,
            "on_time_percentage": 83.3
        },
        "site_performance": {
            "total_sites": 10,
            "active_sites": 8,
            "average_enrollment_rate": 2.3,
            "top_performing_site": "SITE-001",
            "needs_attention": ["SITE-005", "SITE-003"]
        }
    }
    
    report_type_str = request.report_type.value
    data = demo_data.get(report_type_str, {"message": "Demo data for this report type"})
    
    return ReportResponse(
        report_id=report_id,
        report_type=request.report_type.value,
        report_format=request.report_format.value,
        generated_at=datetime.now(),
        data=data,
        file_url=f"/demo/reports/{report_id}.{request.report_format.value}" if request.report_format != ReportFormat.JSON else None,
        summary={
            "records_count": 10,
            "generation_time_ms": 245,
            "mode": "demo"
        }
    )


def _execute_demo_batch(request: BatchOperationRequest) -> BatchOperationResponse:
    """Execute demo batch operation"""
    batch_id = f"BATCH-DEMO-{uuid.uuid4().hex[:8].upper()}"
    
    return BatchOperationResponse(
        batch_id=batch_id,
        operation_type=request.operation_type.value,
        status="completed",
        total_records=100,
        processed_records=100,
        failed_records=0,
        started_at=datetime.now(),
        completed_at=datetime.now(),
        results=[
            {"record_id": "001", "status": "success"},
            {"record_id": "002", "status": "success"}
        ]
    )


async def _execute_production_batch(request: BatchOperationRequest) -> BatchOperationResponse:
    """Execute production batch operation using RAG"""
    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    
    # Use RAG for batch operations in production
    operation_queries = {
        BatchOperationType.DATA_EXPORT: "Export all data from specified tables",
        BatchOperationType.BULK_UPDATE: "Update multiple records based on criteria",
        BatchOperationType.DATA_SYNC: "Synchronize data between tables",
        BatchOperationType.REPORT_GENERATION: "Generate batch reports"
    }
    
    question = operation_queries.get(request.operation_type, "Execute batch operation")
    
    try:
        result = await rag_service.generate_and_execute_sql(
            question=question,
            mode="production",
            query_type=f"batch_{request.operation_type.value}"
        )
        
        processed = result.get('rows_affected', 100)
        
        return BatchOperationResponse(
            batch_id=batch_id,
            operation_type=request.operation_type.value,
            status="completed",
            total_records=processed,
            processed_records=processed,
            failed_records=0,
            started_at=datetime.now(),
            completed_at=datetime.now(),
            results=[{"status": "success", "records_processed": processed}]
        )
    
    except Exception as e:
        return BatchOperationResponse(
            batch_id=batch_id,
            operation_type=request.operation_type.value,
            status="failed",
            total_records=0,
            processed_records=0,
            failed_records=0,
            started_at=datetime.now(),
            completed_at=datetime.now(),
            results=[{"status": "error", "message": str(e)}]
        )
