# ETL Implementation Guide for Sally TSM Gold Layer

## 📋 Overview
Comprehensive ETL (Extract, Transform, Load) implementation guide for building data pipelines from SAP, Veeva CTMS, and IRT systems into the Sally TSM Gold Layer database.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SOURCE SYSTEMS                               │
├─────────────────────────────────────────────────────────────────┤
│  SAP ERP          │  Veeva CTMS       │  IRT System (IWRS)      │
│  - Materials      │  - Studies        │  - Randomization        │
│  - Purchasing     │  - Sites          │  - Dispensation         │
│  - Inventory      │  - Subjects       │  - Drug Assignment      │
│  - Shipments      │  - Visits         │  - Returns              │
└──────┬────────────┴─────────┬─────────┴──────────┬──────────────┘
       │                      │                     │
       ▼                      ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                     STAGING LAYER (PostgreSQL)                    │
│  - Raw data from sources (minimal transformation)                │
│  - Temporary storage for validation                              │
│  - Audit trail and lineage tracking                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                  TRANSFORMATION ENGINE (Python)                   │
│  - Data cleansing and validation                                 │
│  - Business rules application                                    │
│  - Data enrichment and calculations                              │
│  - Foreign key resolution                                        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     GOLD LAYER (PostgreSQL)                       │
│  - Normalized clinical trial supply chain data                   │
│  - Analytics-ready dimensional model                             │
│  - Ready for Sally AI queries                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Core Components
- **Programming Language:** Python 3.11+
- **Database:** PostgreSQL 14+
- **ETL Framework:** Apache Airflow (recommended) or custom scheduler
- **Data Validation:** Great Expectations
- **API Integration:** `requests`, `oauthlib`
- **SAP Integration:** `pyrfc` (SAP NetWeaver RFC SDK)
- **Database ORM:** SQLAlchemy

### Required Python Packages
```bash
pip install apache-airflow==2.7.3
pip install sqlalchemy==2.0.23
pip install psycopg2-binary==2.9.9
pip install requests==2.31.0
pip install great-expectations==0.18.3
pip install pandas==2.1.3
pip install pyrfc  # For SAP RFC connections
pip install python-dotenv==1.0.0
pip install pyodbc  # For ODBC connections (if needed)
```

---

## 📁 Project Structure

```
sally-etl/
├── config/
│   ├── connections.yaml          # Database and API connections
│   ├── mappings/
│   │   ├── sap_mappings.yaml
│   │   ├── veeva_mappings.yaml
│   │   └── irt_mappings.yaml
│   └── schedules.yaml            # ETL job schedules
├── dags/                         # Airflow DAGs (if using Airflow)
│   ├── sap_to_gold.py
│   ├── veeva_to_gold.py
│   └── irt_to_gold.py
├── extractors/
│   ├── __init__.py
│   ├── sap_extractor.py
│   ├── veeva_extractor.py
│   └── irt_extractor.py
├── transformers/
│   ├── __init__.py
│   ├── base_transformer.py
│   ├── study_transformer.py
│   ├── site_transformer.py
│   ├── inventory_transformer.py
│   └── shipment_transformer.py
├── loaders/
│   ├── __init__.py
│   └── gold_loader.py
├── validators/
│   ├── __init__.py
│   └── data_quality.py
├── models/
│   ├── __init__.py
│   ├── staging_models.py
│   └── gold_models.py
├── utils/
│   ├── __init__.py
│   ├── logger.py
│   ├── config_manager.py
│   └── error_handler.py
├── tests/
│   ├── test_extractors.py
│   ├── test_transformers.py
│   └── test_loaders.py
├── logs/
├── requirements.txt
├── .env
└── README.md
```

---

## 🔌 Step 1: Connection Configuration

### `config/connections.yaml`
```yaml
# SAP ERP Connection
sap:
  type: "rfc"
  host: "sap.company.com"
  sysnr: "00"
  client: "100"
  user: "${SAP_USER}"
  password: "${SAP_PASSWORD}"
  language: "EN"

# Veeva Vault CTMS Connection
veeva:
  type: "rest_api"
  base_url: "https://company.veevavault.com"
  api_version: "v23.1"
  username: "${VEEVA_USER}"
  password: "${VEEVA_PASSWORD}"

# IRT System Connection (Example: Medidata RTSM)
irt:
  type: "rest_api"
  base_url: "https://irt-api.company.com"
  api_key: "${IRT_API_KEY}"
  study_id: "ABC-123"

# Staging Database
staging_db:
  type: "postgresql"
  host: "staging-db.company.com"
  port: 5432
  database: "sally_staging"
  user: "${STAGING_DB_USER}"
  password: "${STAGING_DB_PASSWORD}"

# Gold Layer Database
gold_db:
  type: "postgresql"
  host: "gold-db.company.com"
  port: 5432
  database: "sally_gold"
  user: "${GOLD_DB_USER}"
  password: "${GOLD_DB_PASSWORD}"
```

### `.env` File
```bash
# SAP Credentials
SAP_USER=etl_service_account
SAP_PASSWORD=your_secure_password

# Veeva Credentials
VEEVA_USER=api_user@company.com
VEEVA_PASSWORD=your_secure_password

# IRT Credentials
IRT_API_KEY=your_api_key_here

# Database Credentials
STAGING_DB_USER=sally_staging_user
STAGING_DB_PASSWORD=staging_password
GOLD_DB_USER=sally_gold_user
GOLD_DB_PASSWORD=gold_password
```

---

## 📊 Step 2: Extractor Implementation

### `extractors/sap_extractor.py`
```python
"""SAP ERP Data Extractor"""
from typing import List, Dict, Any
from pyrfc import Connection
import logging

logger = logging.getLogger(__name__)

class SAPExtractor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection = None
    
    def connect(self):
        """Establish SAP RFC connection"""
        try:
            self.connection = Connection(
                ashost=self.config['host'],
                sysnr=self.config['sysnr'],
                client=self.config['client'],
                user=self.config['user'],
                passwd=self.config['password'],
                lang=self.config['language']
            )
            logger.info("SAP connection established successfully")
        except Exception as e:
            logger.error(f"SAP connection failed: {str(e)}")
            raise
    
    def extract_materials(self, material_types: List[str]) -> List[Dict]:
        """
        Extract materials from SAP MARA and MARC tables
        
        Args:
            material_types: List of material types (e.g., ['ZMED', 'FERT'])
        
        Returns:
            List of material records
        """
        if not self.connection:
            self.connect()
        
        try:
            # Execute RFC function module (or direct table read)
            result = self.connection.call(
                'RFC_READ_TABLE',
                QUERY_TABLE='MARA',
                DELIMITER='|',
                OPTIONS=[
                    {'TEXT': f"MTART IN ('{\"', '\".join(material_types)}')"}
                ],
                FIELDS=[
                    {'FIELDNAME': 'MATNR'},  # Material Number
                    {'FIELDNAME': 'MTART'},  # Material Type
                    {'FIELDNAME': 'MATKL'},  # Material Group
                    {'FIELDNAME': 'MEINS'},  # Base Unit
                    {'FIELDNAME': 'BRGEW'},  # Gross Weight
                    {'FIELDNAME': 'SPART'},  # Division
                ]
            )
            
            # Parse result
            materials = []
            for row in result['DATA']:
                fields = row['WA'].split('|')
                materials.append({
                    'material_number': fields[0].strip(),
                    'material_type': fields[1].strip(),
                    'material_group': fields[2].strip(),
                    'base_unit': fields[3].strip(),
                    'gross_weight': fields[4].strip(),
                    'division': fields[5].strip()
                })
            
            logger.info(f"Extracted {len(materials)} materials from SAP")
            return materials
            
        except Exception as e:
            logger.error(f"Material extraction failed: {str(e)}")
            raise
    
    def extract_purchase_orders(self, start_date: str, end_date: str) -> List[Dict]:
        """
        Extract purchase orders from SAP EKKO and EKPO tables
        
        Args:
            start_date: Start date (YYYYMMDD)
            end_date: End date (YYYYMMDD)
        
        Returns:
            List of purchase order records
        """
        if not self.connection:
            self.connect()
        
        try:
            # Extract header data (EKKO)
            headers = self.connection.call(
                'RFC_READ_TABLE',
                QUERY_TABLE='EKKO',
                OPTIONS=[
                    {'TEXT': f"AEDAT >= '{start_date}'"},
                    {'TEXT': f"AND AEDAT <= '{end_date}'"}
                ],
                FIELDS=[
                    {'FIELDNAME': 'EBELN'},  # PO Number
                    {'FIELDNAME': 'LIFNR'},  # Vendor
                    {'FIELDNAME': 'BEDAT'},  # PO Date
                    {'FIELDNAME': 'EKORG'},  # Purchasing Org
                    {'FIELDNAME': 'EKGRP'},  # Purchasing Group
                ]
            )
            
            # Extract item data (EKPO) - simplified example
            po_data = []
            for header_row in headers['DATA']:
                fields = header_row['WA'].split('|')
                po_number = fields[0].strip()
                
                # Get items for this PO
                items = self.connection.call(
                    'RFC_READ_TABLE',
                    QUERY_TABLE='EKPO',
                    OPTIONS=[
                        {'TEXT': f"EBELN = '{po_number}'"}
                    ],
                    FIELDS=[
                        {'FIELDNAME': 'EBELP'},  # Item number
                        {'FIELDNAME': 'MATNR'},  # Material
                        {'FIELDNAME': 'MENGE'},  # Quantity
                        {'FIELDNAME': 'MEINS'},  # Unit
                        {'FIELDNAME': 'NETPR'},  # Net price
                    ]
                )
                
                for item_row in items['DATA']:
                    item_fields = item_row['WA'].split('|')
                    po_data.append({
                        'po_number': po_number,
                        'vendor_number': fields[1].strip(),
                        'po_date': fields[2].strip(),
                        'purchasing_org': fields[3].strip(),
                        'purchasing_group': fields[4].strip(),
                        'item_number': item_fields[0].strip(),
                        'material_number': item_fields[1].strip(),
                        'quantity': item_fields[2].strip(),
                        'unit': item_fields[3].strip(),
                        'net_price': item_fields[4].strip()
                    })
            
            logger.info(f"Extracted {len(po_data)} PO items from SAP")
            return po_data
            
        except Exception as e:
            logger.error(f"Purchase order extraction failed: {str(e)}")
            raise
    
    def extract_inventory(self, plant_codes: List[str]) -> List[Dict]:
        """
        Extract inventory data from SAP MARD table
        
        Args:
            plant_codes: List of plant codes
        
        Returns:
            List of inventory records
        """
        if not self.connection:
            self.connect()
        
        try:
            result = self.connection.call(
                'RFC_READ_TABLE',
                QUERY_TABLE='MARD',
                OPTIONS=[
                    {'TEXT': f"WERKS IN ('{\"', '\".join(plant_codes)}')"}
                ],
                FIELDS=[
                    {'FIELDNAME': 'MATNR'},  # Material
                    {'FIELDNAME': 'WERKS'},  # Plant
                    {'FIELDNAME': 'LGORT'},  # Storage Location
                    {'FIELDNAME': 'LABST'},  # Unrestricted Stock
                    {'FIELDNAME': 'INSME'},  # Quality Inspection Stock
                    {'FIELDNAME': 'SPEME'},  # Blocked Stock
                ]
            )
            
            inventory = []
            for row in result['DATA']:
                fields = row['WA'].split('|')
                inventory.append({
                    'material_number': fields[0].strip(),
                    'plant': fields[1].strip(),
                    'storage_location': fields[2].strip(),
                    'unrestricted_stock': fields[3].strip(),
                    'quality_inspection_stock': fields[4].strip(),
                    'blocked_stock': fields[5].strip()
                })
            
            logger.info(f"Extracted {len(inventory)} inventory records from SAP")
            return inventory
            
        except Exception as e:
            logger.error(f"Inventory extraction failed: {str(e)}")
            raise
    
    def close(self):
        """Close SAP connection"""
        if self.connection:
            self.connection.close()
            logger.info("SAP connection closed")
```

### `extractors/veeva_extractor.py`
```python
"""Veeva Vault CTMS Data Extractor"""
import requests
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class VeevaExtractor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.base_url = config['base_url']
        self.api_version = config['api_version']
        self.session_id = None
    
    def authenticate(self):
        """Authenticate and get session ID"""
        auth_url = f"{self.base_url}/api/{self.api_version}/auth"
        
        payload = {
            "username": self.config['username'],
            "password": self.config['password']
        }
        
        try:
            response = requests.post(auth_url, data=payload)
            response.raise_for_status()
            
            auth_data = response.json()
            
            if auth_data['responseStatus'] == 'SUCCESS':
                self.session_id = auth_data['sessionId']
                logger.info("Veeva authentication successful")
            else:
                raise Exception(f"Authentication failed: {auth_data.get('errors')}")
                
        except Exception as e:
            logger.error(f"Veeva authentication failed: {str(e)}")
            raise
    
    def execute_vql(self, query: str) -> List[Dict]:
        """
        Execute VQL query and return results
        
        Args:
            query: VQL query string
        
        Returns:
            List of records
        """
        if not self.session_id:
            self.authenticate()
        
        query_url = f"{self.base_url}/api/{self.api_version}/query"
        
        headers = {
            "Authorization": self.session_id,
            "Content-Type": "application/json"
        }
        
        payload = {"q": query}
        
        try:
            response = requests.post(query_url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if result['responseStatus'] == 'SUCCESS':
                records = result['data']
                logger.info(f"VQL query returned {len(records)} records")
                return records
            else:
                raise Exception(f"VQL query failed: {result.get('errors')}")
                
        except Exception as e:
            logger.error(f"VQL query execution failed: {str(e)}")
            raise
    
    def extract_studies(self) -> List[Dict]:
        """Extract study data from Veeva"""
        query = """
        SELECT 
            name__v,
            study_title__c,
            protocol_number__c,
            phase__c,
            study_status__c,
            planned_enrollment__c,
            actual_enrollment__c,
            planned_start_date__c,
            actual_start_date__c,
            sponsor__c,
            therapeutic_area__c
        FROM study__v
        WHERE study_status__c IN ('Active', 'Enrolling', 'Follow-up')
        """
        
        return self.execute_vql(query)
    
    def extract_sites(self, study_id: str = None) -> List[Dict]:
        """Extract site data from Veeva"""
        query = """
        SELECT 
            name__v,
            site_name__c,
            study__c,
            investigator_name__c,
            country__c,
            site_status__c,
            actual_enrollment__c,
            planned_enrollment__c,
            activation_date__c
        FROM study_site__v
        WHERE site_status__c IN ('Active', 'Screening', 'Enrolling')
        """
        
        if study_id:
            query += f" AND study__c = '{study_id}'"
        
        return self.execute_vql(query)
    
    def extract_subjects(self, start_date: str = None) -> List[Dict]:
        """Extract subject data from Veeva"""
        query = """
        SELECT 
            name__v,
            subject_id__c,
            study_site__c,
            treatment_arm__c,
            subject_status__c,
            enrollment_date__c,
            randomization_date__c,
            modified_date__v
        FROM subject__v
        WHERE subject_status__c IN ('Enrolled', 'Active', 'Screening')
        """
        
        if start_date:
            query += f" AND modified_date__v > '{start_date}'"
        
        return self.execute_vql(query)
```

---

## 🔄 Step 3: Transformer Implementation

### `transformers/base_transformer.py`
```python
"""Base Transformer Class"""
from abc import ABC, abstractmethod
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class BaseTransformer(ABC):
    """Base class for all transformers"""
    
    def __init__(self):
        self.validation_errors = []
    
    @abstractmethod
    def transform(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform source data to target format"""
        pass
    
    def validate(self, data: Dict[str, Any], rules: Dict[str, Any]) -> bool:
        """
        Validate data against rules
        
        Args:
            data: Data to validate
            rules: Validation rules
        
        Returns:
            True if valid, False otherwise
        """
        is_valid = True
        
        # Check required fields
        for field in rules.get('required_fields', []):
            if field not in data or data[field] is None:
                self.validation_errors.append(f"Missing required field: {field}")
                is_valid = False
        
        # Check data types
        for field, expected_type in rules.get('field_types', {}).items():
            if field in data and data[field] is not None:
                if not isinstance(data[field], expected_type):
                    self.validation_errors.append(
                        f"Invalid type for {field}: expected {expected_type}, "
                        f"got {type(data[field])}"
                    )
                    is_valid = False
        
        # Check value ranges
        for field, value_range in rules.get('value_ranges', {}).items():
            if field in data and data[field] is not None:
                if 'min' in value_range and data[field] < value_range['min']:
                    self.validation_errors.append(
                        f"{field} value {data[field]} below minimum {value_range['min']}"
                    )
                    is_valid = False
                if 'max' in value_range and data[field] > value_range['max']:
                    self.validation_errors.append(
                        f"{field} value {data[field]} above maximum {value_range['max']}"
                    )
                    is_valid = False
        
        return is_valid
    
    def clean_string(self, value: str) -> str:
        """Clean string value"""
        if value is None:
            return None
        return value.strip()
    
    def parse_date(self, date_str: str, format: str = '%Y-%m-%d') -> str:
        """Parse date string to standard format"""
        from datetime import datetime
        
        if not date_str:
            return None
        
        try:
            dt = datetime.strptime(date_str, format)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            logger.warning(f"Invalid date format: {date_str}")
            return None
```

### `transformers/inventory_transformer.py`
```python
"""Inventory Data Transformer"""
from .base_transformer import BaseTransformer
from typing import Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class InventoryTransformer(BaseTransformer):
    def __init__(self):
        super().__init__()
        self.validation_rules = {
            'required_fields': ['product_name', 'site_id', 'quantity'],
            'field_types': {
                'quantity': (int, float),
                'site_id': str,
                'product_name': str
            },
            'value_ranges': {
                'quantity': {'min': 0}
            }
        }
    
    def transform_from_sap(self, sap_data: Dict[str, Any], 
                          site_mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Transform SAP inventory data to gold layer format
        
        Args:
            sap_data: Raw SAP inventory record
            site_mapping: Mapping from SAP plant to site_id
        
        Returns:
            Transformed inventory record
        """
        # Map SAP plant to site_id
        plant = sap_data.get('plant')
        site_id = site_mapping.get(plant)
        
        if not site_id:
            logger.warning(f"No site mapping found for plant {plant}")
            site_id = f"UNKNOWN_PLANT_{plant}"
        
        # Transform data
        transformed = {
            'site_id': site_id,
            'product_name': self.clean_string(sap_data.get('material_number')),
            'batch_number': self.clean_string(sap_data.get('batch_number')),
            'quantity': float(sap_data.get('unrestricted_stock', 0)),
            'quality_inspection_qty': float(sap_data.get('quality_inspection_stock', 0)),
            'blocked_qty': float(sap_data.get('blocked_stock', 0)),
            'storage_location': self.clean_string(sap_data.get('storage_location')),
            'expiry_date': self.parse_date(sap_data.get('expiry_date'), '%Y%m%d'),
            'status': self._determine_status(sap_data),
            'temperature_range': sap_data.get('temperature_range', '2-8°C'),
            'last_updated': datetime.now().isoformat(),
            'source_system': 'SAP'
        }
        
        # Validate
        if not self.validate(transformed, self.validation_rules):
            logger.error(f"Validation failed for inventory: {self.validation_errors}")
            self.validation_errors = []
            return None
        
        return transformed
    
    def _determine_status(self, sap_data: Dict[str, Any]) -> str:
        """Determine inventory status based on SAP data"""
        unrestricted = float(sap_data.get('unrestricted_stock', 0))
        blocked = float(sap_data.get('blocked_stock', 0))
        quality_inspection = float(sap_data.get('quality_inspection_stock', 0))
        
        if unrestricted > 0:
            return 'Available'
        elif quality_inspection > 0:
            return 'In Quality Control'
        elif blocked > 0:
            return 'Blocked'
        else:
            return 'Out of Stock'
```

---

## 💾 Step 4: Loader Implementation

### `loaders/gold_loader.py`
```python
"""Gold Layer Data Loader"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class GoldLoader:
    def __init__(self, connection_string: str):
        self.engine = create_engine(connection_string)
        self.Session = sessionmaker(bind=self.engine)
    
    def load_inventory(self, inventory_records: List[Dict[str, Any]], 
                      batch_size: int = 1000):
        """
        Load inventory records to gold layer
        
        Args:
            inventory_records: List of transformed inventory records
            batch_size: Number of records to insert per batch
        """
        from models.gold_models import GoldInventory
        
        session = self.Session()
        loaded_count = 0
        failed_count = 0
        
        try:
            for i in range(0, len(inventory_records), batch_size):
                batch = inventory_records[i:i + batch_size]
                
                for record in batch:
                    try:
                        # Check if record exists
                        existing = session.query(GoldInventory).filter_by(
                            site_id=record['site_id'],
                            product_name=record['product_name'],
                            batch_number=record['batch_number']
                        ).first()
                        
                        if existing:
                            # Update existing record
                            for key, value in record.items():
                                setattr(existing, key, value)
                        else:
                            # Insert new record
                            new_record = GoldInventory(**record)
                            session.add(new_record)
                        
                        loaded_count += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to load record: {str(e)}")
                        failed_count += 1
                        continue
                
                # Commit batch
                session.commit()
                logger.info(f"Loaded batch of {len(batch)} records")
            
            logger.info(f"Load complete: {loaded_count} loaded, {failed_count} failed")
            
        except Exception as e:
            session.rollback()
            logger.error(f"Load failed: {str(e)}")
            raise
        finally:
            session.close()
```

---

## 📅 Step 5: Orchestration with Apache Airflow

### `dags/sap_to_gold.py`
```python
"""Airflow DAG for SAP to Gold Layer ETL"""
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
sys.path.append('/path/to/sally-etl')

from extractors.sap_extractor import SAPExtractor
from transformers.inventory_transformer import InventoryTransformer
from loaders.gold_loader import GoldLoader
from utils.config_manager import load_config

default_args = {
    'owner': 'sally-etl',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'sap_inventory_to_gold',
    default_args=default_args,
    description='Extract SAP inventory data and load to gold layer',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    catchup=False
)

def extract_sap_inventory(**context):
    """Extract inventory from SAP"""
    config = load_config()
    extractor = SAPExtractor(config['sap'])
    
    plant_codes = ['1000', '2000', '3000']  # Your plant codes
    inventory_data = extractor.extract_inventory(plant_codes)
    
    extractor.close()
    
    # Push to XCom for next task
    context['ti'].xcom_push(key='sap_inventory', value=inventory_data)

def transform_inventory(**context):
    """Transform inventory data"""
    # Pull from XCom
    sap_inventory = context['ti'].xcom_pull(key='sap_inventory')
    
    config = load_config()
    site_mapping = config['mappings']['sap_plant_to_site']
    
    transformer = InventoryTransformer()
    
    transformed_data = []
    for record in sap_inventory:
        transformed = transformer.transform_from_sap(record, site_mapping)
        if transformed:
            transformed_data.append(transformed)
    
    # Push to XCom
    context['ti'].xcom_push(key='transformed_inventory', value=transformed_data)

def load_to_gold(**context):
    """Load to gold layer"""
    transformed_data = context['ti'].xcom_pull(key='transformed_inventory')
    
    config = load_config()
    connection_string = (
        f"postgresql://{config['gold_db']['user']}:"
        f"{config['gold_db']['password']}@"
        f"{config['gold_db']['host']}:"
        f"{config['gold_db']['port']}/"
        f"{config['gold_db']['database']}"
    )
    
    loader = GoldLoader(connection_string)
    loader.load_inventory(transformed_data)

# Define tasks
extract_task = PythonOperator(
    task_id='extract_sap_inventory',
    python_callable=extract_sap_inventory,
    provide_context=True,
    dag=dag
)

transform_task = PythonOperator(
    task_id='transform_inventory',
    python_callable=transform_inventory,
    provide_context=True,
    dag=dag
)

load_task = PythonOperator(
    task_id='load_to_gold',
    python_callable=load_to_gold,
    provide_context=True,
    dag=dag
)

# Set task dependencies
extract_task >> transform_task >> load_task
```

---

## ✅ Step 6: Data Quality Checks

### `validators/data_quality.py`
```python
"""Data Quality Validation using Great Expectations"""
import great_expectations as ge
from great_expectations.dataset import SqlAlchemyDataset
import logging

logger = logging.getLogger(__name__)

def validate_gold_inventory(connection_string: str):
    """Validate gold inventory data quality"""
    
    # Connect to database
    dataset = SqlAlchemyDataset(
        'gold_inventory',
        engine=connection_string
    )
    
    # Define expectations
    dataset.expect_column_values_to_not_be_null('site_id')
    dataset.expect_column_values_to_not_be_null('product_name')
    dataset.expect_column_values_to_be_between('quantity', min_value=0, max_value=100000)
    dataset.expect_column_values_to_be_in_set(
        'status',
        value_set=['Available', 'In Quality Control', 'Blocked', 'Out of Stock']
    )
    dataset.expect_column_values_to_match_regex(
        'batch_number',
        regex=r'^[A-Z0-9]{6,12}$'
    )
    
    # Validate
    results = dataset.validate()
    
    if results['success']:
        logger.info("Data quality validation passed")
    else:
        logger.error("Data quality validation failed")
        for result in results['results']:
            if not result['success']:
                logger.error(f"Failed: {result['expectation_config']['expectation_type']}")
    
    return results
```

---

## 🎯 Next Steps

1. **Set up infrastructure:**
   - Provision PostgreSQL databases (staging & gold)
   - Install Apache Airflow
   - Configure network access to SAP, Veeva, IRT

2. **Implement extractors:**
   - Start with one data source (e.g., SAP inventory)
   - Test extraction thoroughly
   - Add error handling and logging

3. **Build transformers:**
   - Implement transformation logic
   - Add data quality checks
   - Test with real data samples

4. **Deploy loaders:**
   - Set up database connections
   - Implement upsert logic
   - Add performance optimization

5. **Schedule ETL jobs:**
   - Create Airflow DAGs
   - Set up monitoring and alerting
   - Test end-to-end pipeline

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-19