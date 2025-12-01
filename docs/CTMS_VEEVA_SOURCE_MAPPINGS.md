# CTMS/Veeva Source Mappings for Sally TSM Gold Layer

## 📋 Overview
This document maps Clinical Trial Management System (CTMS) fields, specifically Veeva Vault CTMS, to the Sally TSM Gold Layer database schema. It provides ETL extraction guidance for clinical trial operational data.

---

## 🎯 Data Source: Veeva Vault CTMS

### Primary Modules
1. **Study Management**
2. **Site Management** 
3. **Subject Management**
4. **Monitoring & Visits**
5. **Document Management**
6. **Financial Management**

---

## 📊 Mapping 1: Study Management → `gold_studies` Table

### Veeva CTMS Objects & Fields

| Veeva Object | Veeva Field | Gold Layer Field | Transformation |
|--------------|-------------|------------------|----------------|
| **Study** | `name__v` | `study_code` | Direct mapping |
| Study | `study_title__c` | `study_name` | Direct mapping |
| Study | `protocol_number__c` | `protocol_number` | Direct mapping |
| Study | `therapeutic_area__c` | `therapeutic_area` | Direct mapping |
| Study | `indication__c` | `indication` | Direct mapping |
| Study | `phase__c` | `study_phase` | Map: "Phase I" → "Phase 1" |
| Study | `study_type__c` | `study_type` | Direct mapping |
| Study | `randomization_type__c` | `randomization_type` | Direct mapping |
| Study | `blinding_type__c` | `blinding_type` | Direct mapping |
| Study | `sponsor__c` | `sponsor_name` | Direct mapping |
| Study | `study_status__c` | `study_status` | Map to standard statuses |
| Study | `planned_start_date__c` | `planned_start_date` | Date format conversion |
| Study | `actual_start_date__c` | `actual_start_date` | Date format conversion |
| Study | `planned_completion_date__c` | `planned_end_date` | Date format conversion |
| Study | `actual_completion_date__c` | `actual_end_date` | Date format conversion |
| Study | `planned_enrollment__c` | `target_enrollment` | Direct mapping |
| Study | `actual_enrollment__c` | `current_enrollment` | Direct mapping |
| Study | `number_of_sites__c` | `active_sites` | Direct mapping |
| Study | `number_of_countries__c` | `countries` | Direct mapping |
| Study | `regulatory_status__c` | `regulatory_status` | Direct mapping |
| Study | `primary_endpoint__c` | `primary_endpoint` | Direct mapping |

### ETL Query Example (Veeva Vault Query Language - VQL)
```sql
SELECT 
    name__v,
    study_title__c,
    protocol_number__c,
    phase__c,
    study_status__c,
    planned_enrollment__c,
    actual_enrollment__c,
    planned_start_date__c,
    actual_start_date__c
FROM study__v
WHERE study_status__c IN ('Active', 'Enrolling', 'Follow-up')
```

---

## 📊 Mapping 2: Site Management → `gold_sites` Table

### Veeva CTMS Objects & Fields

| Veeva Object | Veeva Field | Gold Layer Field | Transformation |
|--------------|-------------|------------------|----------------|
| **Study Site** | `name__v` | `site_number` | Direct mapping |
| Study Site | `site_name__c` | `site_name` | Direct mapping |
| Study Site | `study__c` | `study_id` | Lookup to study |
| Study Site | `investigator_name__c` | `principal_investigator` | Direct mapping |
| Study Site | `site_address__c` | `address` | Direct mapping |
| Study Site | `city__c` | `city` | Direct mapping |
| Study Site | `state_province__c` | `state` | Direct mapping |
| Study Site | `country__c` | `country` | Direct mapping |
| Study Site | `postal_code__c` | `postal_code` | Direct mapping |
| Study Site | `site_status__c` | `site_status` | Direct mapping |
| Study Site | `activation_date__c` | `activation_date` | Date conversion |
| Study Site | `initiation_visit_date__c` | `initiation_date` | Date conversion |
| Study Site | `planned_enrollment__c` | `enrollment_target` | Direct mapping |
| Study Site | `actual_enrollment__c` | `current_enrollment` | Direct mapping |
| Study Site | `enrollment_rate__c` | `enrollment_rate` | Direct mapping |
| Study Site | `last_subject_enrolled__c` | `last_enrollment_date` | Date conversion |
| Study Site | `close_out_date__c` | `closeout_date` | Date conversion |
| Study Site | `storage_facility_name__c` | `depot_name` | Direct mapping |
| Study Site | `depot_contact__c` | `depot_contact` | Direct mapping |

### ETL Query Example
```sql
SELECT 
    ss.name__v,
    ss.site_name__c,
    ss.study__c,
    ss.investigator_name__c,
    ss.country__c,
    ss.site_status__c,
    ss.actual_enrollment__c,
    ss.planned_enrollment__c,
    s.protocol_number__c
FROM study_site__v ss
JOIN study__v s ON ss.study__c = s.id
WHERE ss.site_status__c IN ('Active', 'Screening', 'Enrolling')
```

---

## 📊 Mapping 3: Subject Management → `gold_subjects` Table

### Veeva CTMS Objects & Fields

| Veeva Object | Veeva Field | Gold Layer Field | Transformation |
|--------------|-------------|------------------|----------------|
| **Subject** | `name__v` | `subject_number` | Direct mapping |
| Subject | `study_site__c` | `site_id` | Lookup to site |
| Subject | `subject_id__c` | `subject_id` | Direct mapping |
| Subject | `screening_number__c` | `screening_number` | Direct mapping |
| Subject | `randomization_number__c` | `randomization_number` | Direct mapping |
| Subject | `treatment_arm__c` | `treatment_arm` | Direct mapping |
| Subject | `subject_status__c` | `subject_status` | Direct mapping |
| Subject | `enrollment_date__c` | `enrollment_date` | Date conversion |
| Subject | `randomization_date__c` | `randomization_date` | Date conversion |
| Subject | `screening_date__c` | `screening_date` | Date conversion |
| Subject | `completion_date__c` | `completion_date` | Date conversion |
| Subject | `early_termination_date__c` | `withdrawal_date` | Date conversion |
| Subject | `withdrawal_reason__c` | `withdrawal_reason` | Direct mapping |
| Subject | `age_at_enrollment__c` | `age` | Direct mapping |
| Subject | `gender__c` | `gender` | Direct mapping |
| Subject | `weight__c` | `weight_kg` | Direct mapping |
| Subject | `height__c` | `height_cm` | Direct mapping |

### ETL Query Example
```sql
SELECT 
    sub.name__v,
    sub.subject_id__c,
    sub.study_site__c,
    sub.treatment_arm__c,
    sub.subject_status__c,
    sub.enrollment_date__c,
    sub.randomization_date__c,
    ss.name__v as site_number,
    s.protocol_number__c
FROM subject__v sub
JOIN study_site__v ss ON sub.study_site__c = ss.id
JOIN study__v s ON ss.study__c = s.id
WHERE sub.subject_status__c IN ('Enrolled', 'Active', 'Screening')
```

---

## 📊 Mapping 4: IRT Integration → `gold_dispensations` & `gold_randomizations`

### IRT System Fields (Generic IVRS/IWRS)

| IRT Field | Gold Layer Table | Gold Layer Field | Notes |
|-----------|------------------|------------------|-------|
| `subject_id` | `gold_dispensations` | `subject_id` | Cross-reference |
| `randomization_id` | `gold_randomizations` | `randomization_id` | Unique ID |
| `randomization_date` | `gold_randomizations` | `randomization_date` | Timestamp |
| `treatment_arm` | `gold_randomizations` | `treatment_arm` | Arm assignment |
| `stratification_factors` | `gold_randomizations` | `stratification_factors` | JSON field |
| `dispensation_id` | `gold_dispensations` | `dispensation_id` | Unique ID |
| `dispensation_date` | `gold_dispensations` | `dispensation_date` | Timestamp |
| `medication_kit_id` | `gold_dispensations` | `kit_number` | Kit identifier |
| `medication_name` | `gold_dispensations` | `product_name` | Product |
| `dosage` | `gold_dispensations` | `dosage` | Dose amount |
| `quantity_dispensed` | `gold_dispensations` | `quantity` | Units dispensed |
| `return_date` | `gold_dispensations` | `return_date` | If returned |
| `destruction_date` | `gold_dispensations` | `destruction_date` | If destroyed |

### IRT API Integration Example
```python
# Example IRT API call (pseudo-code)
import requests

irt_api_url = "https://irt-system.com/api/v2/dispensations"
headers = {"Authorization": f"Bearer {irt_token}"}
params = {
    "study_id": "ABC-123",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
}

response = requests.get(irt_api_url, headers=headers, params=params)
dispensation_data = response.json()

# Transform and load to gold_dispensations
for record in dispensation_data['results']:
    gold_dispensation = {
        'dispensation_id': record['dispensation_id'],
        'subject_id': record['subject_id'],
        'site_id': lookup_site_id(record['site_number']),
        'study_id': lookup_study_id(record['study_code']),
        'kit_number': record['medication_kit_id'],
        'product_name': record['medication_name'],
        'dosage': record['dosage'],
        'quantity': record['quantity_dispensed'],
        'dispensation_date': parse_date(record['dispensation_date'])
    }
    insert_into_gold_dispensations(gold_dispensation)
```

---

## 📊 Mapping 5: Visit & Monitoring → `gold_visits` Table

### Veeva CTMS Objects & Fields

| Veeva Object | Veeva Field | Gold Layer Field | Transformation |
|--------------|-------------|------------------|----------------|
| **Study Visit** | `name__v` | `visit_number` | Direct mapping |
| Study Visit | `subject__c` | `subject_id` | Lookup |
| Study Visit | `visit_name__c` | `visit_name` | Direct mapping |
| Study Visit | `visit_type__c` | `visit_type` | Direct mapping |
| Study Visit | `visit_date__c` | `visit_date` | Date conversion |
| Study Visit | `visit_status__c` | `visit_status` | Direct mapping |
| Study Visit | `visit_window_start__c` | `window_start` | Date conversion |
| Study Visit | `visit_window_end__c` | `window_end` | Date conversion |
| Study Visit | `protocol_deviation__c` | `protocol_deviation` | Boolean conversion |
| Study Visit | `deviation_description__c` | `deviation_notes` | Direct mapping |

---

## 📊 Mapping 6: Drug Supply → `gold_inventory` & `gold_shipments`

### Veeva CTMS Objects & Fields (if available)

| Veeva Object | Veeva Field | Gold Layer Table | Gold Layer Field |
|--------------|-------------|------------------|------------------|
| **Drug Supply** | `product_name__c` | `gold_inventory` | `product_name` |
| Drug Supply | `batch_number__c` | `gold_inventory` | `batch_number` |
| Drug Supply | `site__c` | `gold_inventory` | `site_id` |
| Drug Supply | `quantity_received__c` | `gold_inventory` | `quantity` |
| Drug Supply | `expiry_date__c` | `gold_inventory` | `expiry_date` |
| Drug Supply | `temperature_log__c` | `gold_inventory` | `temperature_range` |
| Drug Supply | `storage_location__c` | `gold_inventory` | `storage_location` |
| **Shipment** | `shipment_id__c` | `gold_shipments` | `shipment_number` |
| Shipment | `tracking_number__c` | `gold_shipments` | `tracking_number` |
| Shipment | `shipped_date__c` | `gold_shipments` | `shipped_date` |
| Shipment | `delivered_date__c` | `gold_shipments` | `delivered_date` |
| Shipment | `shipment_status__c` | `gold_shipments` | `shipment_status` |

**Note:** If Veeva CTMS doesn't have drug supply tracking, integrate with dedicated IRT/IWRS or depot management systems.

---

## 🔄 ETL Process Flow

### 1. **Extract Phase**
```python
# Veeva Vault API Example
import requests

vault_api_url = "https://your-vault.veevavault.com/api/v23.1/query"
vault_session_id = "your_session_id"

headers = {
    "Authorization": f"Bearer {vault_session_id}",
    "Content-Type": "application/json"
}

vql_query = """
SELECT 
    name__v,
    study_title__c,
    phase__c,
    study_status__c,
    actual_enrollment__c
FROM study__v
WHERE study_status__c = 'Active'
"""

payload = {"q": vql_query}
response = requests.post(vault_api_url, headers=headers, json=payload)
studies_data = response.json()
```

### 2. **Transform Phase**
```python
def transform_study_data(veeva_study):
    """Transform Veeva study data to Gold Layer format"""
    return {
        'study_code': veeva_study['name__v'],
        'study_name': veeva_study['study_title__c'],
        'study_phase': map_phase(veeva_study['phase__c']),
        'study_status': map_status(veeva_study['study_status__c']),
        'current_enrollment': veeva_study['actual_enrollment__c'],
        'created_at': datetime.now(),
        'updated_at': datetime.now()
    }

def map_phase(veeva_phase):
    """Map Veeva phase format to standard format"""
    phase_mapping = {
        'Phase I': 'Phase 1',
        'Phase II': 'Phase 2',
        'Phase III': 'Phase 3',
        'Phase IV': 'Phase 4'
    }
    return phase_mapping.get(veeva_phase, veeva_phase)

def map_status(veeva_status):
    """Map Veeva status to standard status"""
    status_mapping = {
        'Active': 'Active',
        'Enrolling': 'Recruiting',
        'Follow-up': 'Active',
        'Closed': 'Completed',
        'On Hold': 'Suspended'
    }
    return status_mapping.get(veeva_status, 'Unknown')
```

### 3. **Load Phase**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database connection
engine = create_engine('postgresql://user:pass@host:5432/sally_gold')
Session = sessionmaker(bind=engine)
session = Session()

def load_study_to_gold(transformed_study):
    """Load transformed study data to gold layer"""
    from models import GoldStudy
    
    # Check if study exists
    existing_study = session.query(GoldStudy).filter_by(
        study_code=transformed_study['study_code']
    ).first()
    
    if existing_study:
        # Update existing
        for key, value in transformed_study.items():
            setattr(existing_study, key, value)
    else:
        # Insert new
        new_study = GoldStudy(**transformed_study)
        session.add(new_study)
    
    session.commit()
```

---

## 📊 Data Refresh Strategy

### Incremental Load Approach
```python
def incremental_load_subjects():
    """Load only new or updated subjects since last ETL run"""
    
    # Get last ETL timestamp
    last_etl_run = get_last_etl_timestamp('subjects')
    
    # VQL query for incremental data
    vql_query = f"""
    SELECT 
        name__v,
        subject_id__c,
        study_site__c,
        subject_status__c,
        modified_date__v
    FROM subject__v
    WHERE modified_date__v > '{last_etl_run}'
    """
    
    # Extract
    subjects = extract_from_veeva(vql_query)
    
    # Transform & Load
    for subject in subjects:
        transformed = transform_subject_data(subject)
        load_subject_to_gold(transformed)
    
    # Update ETL timestamp
    update_etl_timestamp('subjects', datetime.now())
```

### Full Refresh Schedule
- **Daily:** Subjects, Visits, Dispensations
- **Weekly:** Sites, Studies, Inventory
- **Monthly:** Historical data reconciliation

---

## 🔐 Authentication & Access

### Veeva Vault Authentication
```python
import requests

def get_veeva_session_id(username, password, vault_url):
    """Authenticate and get session ID"""
    auth_url = f"{vault_url}/api/v23.1/auth"
    
    payload = {
        "username": username,
        "password": password
    }
    
    response = requests.post(auth_url, data=payload)
    auth_data = response.json()
    
    if auth_data['responseStatus'] == 'SUCCESS':
        return auth_data['sessionId']
    else:
        raise Exception(f"Authentication failed: {auth_data['errors']}")

# Usage
vault_url = "https://your-vault.veevavault.com"
session_id = get_veeva_session_id(
    username="your_username",
    password="your_password",
    vault_url=vault_url
)
```

---

## 📈 Data Quality Checks

### Validation Rules
```python
def validate_subject_data(subject_data):
    """Validate subject data before loading to gold layer"""
    errors = []
    
    # Required fields check
    required_fields = ['subject_id', 'site_id', 'study_id', 'enrollment_date']
    for field in required_fields:
        if not subject_data.get(field):
            errors.append(f"Missing required field: {field}")
    
    # Date range check
    if subject_data.get('enrollment_date'):
        if subject_data['enrollment_date'] > datetime.now():
            errors.append("Enrollment date cannot be in future")
    
    # Status validation
    valid_statuses = ['Screening', 'Enrolled', 'Active', 'Completed', 'Withdrawn']
    if subject_data.get('subject_status') not in valid_statuses:
        errors.append(f"Invalid subject status: {subject_data.get('subject_status')}")
    
    return errors

# Usage in ETL
for subject in subjects_data:
    validation_errors = validate_subject_data(subject)
    if validation_errors:
        log_etl_error('subjects', subject['subject_id'], validation_errors)
    else:
        load_subject_to_gold(subject)
```

---

## 🎯 Next Steps

1. **Obtain Veeva Vault Access:**
   - Request API credentials
   - Get VQL query permissions
   - Identify custom fields in your Veeva instance

2. **Map Custom Fields:**
   - Document organization-specific custom fields
   - Update mappings accordingly

3. **IRT System Integration:**
   - Identify IRT vendor (Almac, Oracle, Medidata)
   - Obtain API documentation
   - Map randomization & dispensation data

4. **Build ETL Pipeline:**
   - Implement extraction scripts
   - Build transformation logic
   - Set up automated scheduling

5. **Testing:**
   - Validate data mappings
   - Test incremental loads
   - Verify data quality

---

## 📞 Support & Resources

- **Veeva Vault API Documentation:** https://developer.veevavault.com/
- **VQL Reference Guide:** https://developer.veevavault.com/vql/
- **Sally TSM Support:** Refer to main documentation

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-19  
**Author:** Sally TSM Integration Team