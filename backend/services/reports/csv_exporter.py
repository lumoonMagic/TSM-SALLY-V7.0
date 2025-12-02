"""
CSV Exporter Service
Handles CSV file generation and export
"""
import csv
import io
from typing import List, Dict, Any
from datetime import datetime


class CSVExporter:
    """Service for exporting data to CSV format"""
    
    @staticmethod
    def export_to_csv(data: List[Dict[str, Any]], columns: List[str] = None) -> str:
        """
        Export data to CSV format
        
        Args:
            data: List of dictionaries containing the data
            columns: Optional list of column names to include
            
        Returns:
            CSV string
        """
        if not data:
            return ""
        
        # Use all keys from first row if columns not specified
        if columns is None:
            columns = list(data[0].keys())
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns, extrasaction='ignore')
        
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()
    
    @staticmethod
    def export_inventory_csv(inventory_data: Dict[str, Any]) -> str:
        """Export inventory data to CSV"""
        inventory_list = inventory_data.get('by_site', [])
        
        columns = [
            'site_id', 'site_name', 'total_units', 
            'available_units', 'status', 'days_of_supply'
        ]
        
        return CSVExporter.export_to_csv(inventory_list, columns)
    
    @staticmethod
    def export_shipments_csv(shipment_data: Dict[str, Any]) -> str:
        """Export shipment data to CSV"""
        shipments = shipment_data.get('shipments', [])
        
        columns = [
            'shipment_id', 'shipment_number', 'from', 'to',
            'status', 'priority', 'shipped_date', 'eta', 'carrier', 'tracking'
        ]
        
        return CSVExporter.export_to_csv(shipments, columns)
    
    @staticmethod
    def export_sites_csv(site_data: Dict[str, Any]) -> str:
        """Export site performance data to CSV"""
        sites = site_data.get('sites', [])
        
        columns = [
            'site_id', 'site_name', 'country', 'enrollment_rate',
            'current_enrollment', 'target_enrollment', 'progress_percentage',
            'inventory_status', 'performance_score'
        ]
        
        return CSVExporter.export_to_csv(sites, columns)
