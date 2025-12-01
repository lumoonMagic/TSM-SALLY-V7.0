# 🏭 SAP Source System Mappings for Clinical Trial Supply Chain

## Overview

This document provides **detailed field-level mappings** from SAP ERP tables to the Sally TSM Gold Layer database. Focuses on SAP modules relevant to pharmaceutical clinical trial supply management.

---

## 📋 SAP Modules Covered

1. **MM (Materials Management)** - Inventory, purchasing
2. **SD (Sales & Distribution)** - If sites treated as customers
3. **WM (Warehouse Management)** - Stock movements
4. **QM (Quality Management)** - Batch management, quality
5. **PP (Production Planning)** - Manufacturing (if applicable)

---

## 🗂️ Core SAP Tables for Clinical Supply

### 1. **Material Master Data**

#### **MARA** - General Material Data

**Purpose**: Master data for investigational products

| SAP Field | Description | Gold Layer Mapping | Data Type | Notes |
|-----------|-------------|-------------------|-----------|-------|
| `MATNR` | Material Number | `gold_products.material_number` | CHAR(40) | Primary key in SAP |
| `ERSDA` | Created On | `gold_products.created_date` | DATE | |
| `ERNAM` | Created By | `gold_products.created_by` | CHAR(12) | |
| `LAEDA` | Last Changed | `gold_products.last_updated_date` | DATE | |
| `AENAM` | Changed By | `gold_products.last_updated_by` | CHAR(12) | |
| `MTART` | Material Type | Used for filtering | CHAR(4) | 'ZMED' for investigational products |
| `MEINS` | Base Unit of Measure | `gold_products.unit_of_measure` | CHAR(3) | EA, PC, VL, etc. |
| `BRGEW` | Gross Weight | Used for shipping | DEC(13,3) | |
| `NTGEW` | Net Weight | Used for shipping | DEC(13,3) | |
| `GEWEI` | Weight Unit | | CHAR(3) | KG, LB |
| `VOLUM` | Volume | Used for shipping | DEC(13,3) | |
| `VOLEH` | Volume Unit | | CHAR(3) | |
| `LVORM` | Deletion Flag | `gold_products.is_active` | CHAR(1) | X = inactive |
| `LABOR` | Laboratory/Design Office | `gold_products.manufacturer` | CHAR(3) | |

**ETL Logic**:
```sql
-- Extract investigational products only
SELECT DISTINCT
    MATNR,
    ERSDA,
    ERNAM,
    LAEDA,
    AENAM,
    MTART,
    MEINS,
    BRGEW,
    NTGEW,
    GEWEI,
    VOLUM,
    VOLEH,
    CASE WHEN LVORM = 'X' THEN FALSE ELSE TRUE END as IS_ACTIVE
FROM MARA
WHERE MTART IN ('ZMED', 'ZIMP', 'ZCOMP') -- Custom material types for clinical products
  AND LVORM <> 'X' -- Not marked for deletion
```

---

#### **MARC** - Plant Data for Material

**Purpose**: Plant-specific material data (manufacturing site, lead times)

| SAP Field | Description | Gold Layer Mapping | Notes |
|-----------|-------------|-------------------|-------|
| `MATNR` | Material Number | `gold_products.material_number` | Join key |
| `WERKS` | Plant | `gold_products.manufacturing_site` | Manufacturing location |
| `PLIFZ` | Planned Delivery Time | `gold_products.lead_time_days` | In days |
| `DISMM` | MRP Type | | PD = MRP, VB = Manual |
| `BESKZ` | Procurement Type | | E = In-house, F = External |
| `SOBSL` | Special Procurement | | For clinical trials |
| `MINBE` | Reorder Point | `gold_products.minimum_order_quantity` | |
| `DISPO` | MRP Controller | | Responsible planner |
| `BSTMI` | Minimum Lot Size | `gold_products.minimum_order_quantity` | |
| `BSTMA` | Maximum Lot Size | | |
| `BSTFE` | Fixed Lot Size | `gold_products.standard_order_quantity` | |

**ETL Logic**:
```sql
-- Extract plant-specific product data
SELECT 
    m.MATNR,
    m.WERKS as PLANT_CODE,
    w.NAME1 as PLANT_NAME, -- Join to T001W for plant name
    m.PLIFZ as LEAD_TIME_DAYS,
    m.MINBE as MIN_ORDER_QTY,
    m.BSTFE as STD_ORDER_QTY,
    m.DISPO as MRP_CONTROLLER
FROM MARC m
LEFT JOIN T001W w ON m.WERKS = w.WERKS
WHERE m.MATNR IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED', 'ZIMP'))
```

---

#### **MAKT** - Material Descriptions

**Purpose**: Material text descriptions in multiple languages

| SAP Field | Description | Gold Layer Mapping |
|-----------|-------------|-------------------|
| `MATNR` | Material Number | `gold_products.material_number` |
| `SPRAS` | Language Key | Use for multi-language support |
| `MAKTX` | Material Description | `gold_products.product_name` |
| `MAKTG` | Material Description (40 char) | `gold_products.product_code` |

**ETL Logic**:
```sql
-- Get English descriptions (or primary language)
SELECT 
    MATNR,
    MAKTX as PRODUCT_NAME,
    MAKTG as PRODUCT_CODE
FROM MAKT
WHERE SPRAS = 'E' -- English
  AND MATNR IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED'))
```

---

### 2. **Batch Management**

#### **MCH1** - Batches (Header)

**Purpose**: Batch master data for lot/batch numbers

| SAP Field | Description | Gold Layer Mapping | Notes |
|-----------|-------------|-------------------|-------|
| `MATNR` | Material Number | `gold_products.material_number` | |
| `CHARG` | Batch Number | `gold_inventory.batch_number` | Primary batch identifier |
| `ERSDA` | Created On | Batch creation date | |
| `HSDAT` | Manufacturing Date | `gold_inventory.manufacturing_date` | |
| `VFDAT` | Expiration Date | `gold_inventory.expiry_date` | **Critical for tracking** |
| `LICHA` | Vendor Batch | External batch number | |

**ETL Logic**:
```sql
-- Extract batch information
SELECT 
    MATNR,
    CHARG as BATCH_NUMBER,
    HSDAT as MANUFACTURING_DATE,
    VFDAT as EXPIRY_DATE,
    ERSDA as CREATED_DATE,
    LICHA as VENDOR_BATCH
FROM MCH1
WHERE MATNR IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED'))
  AND VFDAT >= CURRENT_DATE -- Only active batches
ORDER BY VFDAT ASC
```

---

#### **MCHA** - Batches (Stock Level)

**Purpose**: Batch stock at storage location level

| SAP Field | Description | Gold Layer Mapping |
|-----------|-------------|-------------------|
| `MATNR` | Material Number | Link to product |
| `WERKS` | Plant | Link to site/depot |
| `LGORT` | Storage Location | `gold_inventory.storage_location` |
| `CHARG` | Batch Number | `gold_inventory.batch_number` |
| `CLABS` | Unrestricted Stock | `gold_inventory.quantity_on_hand` |
| `CINSM` | Quality Inspection | `gold_inventory.quantity_quarantine` |
| `CSPEM` | Blocked Stock | Part of quarantine |
| `CRETM` | Returns Stock | |
| `CUMLM` | Stock Transfer | In-transit stock |

**ETL Logic**:
```sql
-- Calculate inventory quantities by batch
SELECT 
    mc.MATNR,
    mc.WERKS as PLANT_CODE,
    mc.LGORT as STORAGE_LOCATION,
    mc.CHARG as BATCH_NUMBER,
    mc.CLABS as QTY_AVAILABLE,
    mc.CINSM as QTY_QUALITY_INSPECTION,
    mc.CSPEM as QTY_BLOCKED,
    (mc.CLABS + mc.CINSM + mc.CSPEM) as TOTAL_QUANTITY,
    mb.HSDAT as MFG_DATE,
    mb.VFDAT as EXPIRY_DATE
FROM MCHA mc
INNER JOIN MCH1 mb 
    ON mc.MATNR = mb.MATNR 
    AND mc.CHARG = mb.CHARG
WHERE mc.MATNR IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED'))
  AND (mc.CLABS > 0 OR mc.CINSM > 0 OR mc.CSPEM > 0)
```

---

### 3. **Stock/Inventory Movement**

#### **MCHB** - Batch Stocks

**Purpose**: Real-time batch stock by valuation type

| SAP Field | Description | Gold Layer Usage |
|-----------|-------------|------------------|
| `MATNR` | Material Number | Product identifier |
| `WERKS` | Plant | Site/depot |
| `LGORT` | Storage Location | Storage area |
| `CHARG` | Batch Number | Batch identifier |
| `CLABS` | Unrestricted Use | Available quantity |
| `CUMLM` | Stock in Transfer | In-transit |
| `CINSM` | Quality Inspection | QC hold |
| `CSPEM` | Blocked Stock | Quarantine |
| `CRETM` | Return Stock | |
| `ERSDA` | Created On | |

---

#### **MSEG** - Material Document: Item Segment

**Purpose**: All goods movements (receipts, issues, transfers)

| SAP Field | Description | Gold Layer Usage | Movement Types |
|-----------|-------------|------------------|----------------|
| `MBLNR` | Material Document | Transaction ID | |
| `MJAHR` | Material Doc Year | | |
| `ZEILE` | Item | Line number | |
| `BWART` | Movement Type | Determines transaction type | 101=GR, 261=Goods Issue, 311=Transfer |
| `MATNR` | Material | Product | |
| `WERKS` | Plant | Site | |
| `LGORT` | Storage Location | | |
| `CHARG` | Batch | | |
| `MENGE` | Quantity | Transaction qty | |
| `MEINS` | UOM | | |
| `BUDAT` | Posting Date | Transaction date | |
| `LIFNR` | Vendor | Supplier | |
| `KUNNR` | Customer | If site is customer | |
| `SOBKZ` | Special Stock | Clinical trial stock = 'K' | |

**Key Movement Types for Clinical Trials**:
- `101` - Goods Receipt from Purchase Order
- `261` - Goods Issue to Clinical Trial (consumption)
- `311` - Transfer Posting (depot to site)
- `551` - Scrapping (destruction)
- `122` - Returns to Vendor

**ETL Logic**:
```sql
-- Track all movements for clinical products
SELECT 
    m.MBLNR || '-' || m.MJAHR || '-' || m.ZEILE as MOVEMENT_ID,
    m.BUDAT as POSTING_DATE,
    m.BWART as MOVEMENT_TYPE,
    CASE 
        WHEN m.BWART = '101' THEN 'Receipt'
        WHEN m.BWART = '261' THEN 'Issue'
        WHEN m.BWART = '311' THEN 'Transfer'
        WHEN m.BWART = '551' THEN 'Scrapping'
        ELSE 'Other'
    END as MOVEMENT_DESCRIPTION,
    m.MATNR as MATERIAL_NUMBER,
    m.CHARG as BATCH_NUMBER,
    m.WERKS as PLANT,
    m.LGORT as STORAGE_LOCATION,
    m.MENGE as QUANTITY,
    m.MEINS as UOM,
    m.LIFNR as VENDOR,
    m.KUNNR as CUSTOMER_SITE,
    m.XBLNR as REFERENCE_DOC,
    h.USNAM as POSTED_BY -- From MKPF header
FROM MSEG m
LEFT JOIN MKPF h ON m.MBLNR = h.MBLNR AND m.MJAHR = h.MJAHR
WHERE m.MATNR IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED'))
  AND m.BUDAT >= '2024-01-01' -- Date range for incremental load
ORDER BY m.BUDAT DESC
```

---

### 4. **Purchase Orders (If Applicable)**

#### **EKKO** - Purchasing Document Header

**Purpose**: Purchase orders for clinical supplies from CMOs

| SAP Field | Description | Gold Layer Usage |
|-----------|-------------|------------------|
| `EBELN` | Purchase Order Number | Order tracking |
| `BUKRS` | Company Code | |
| `BSTYP` | Document Category | 'F' = Purchase Order |
| `BSART` | Document Type | |
| `LIFNR` | Vendor | `gold_vendors.vendor_code` |
| `BEDAT` | Purchase Order Date | |
| `KDATB` | Validity Start | |
| `KDATE` | Validity End | |
| `WAERS` | Currency | |

#### **EKPO** - Purchasing Document Items

| SAP Field | Description | Gold Layer Usage |
|-----------|-------------|------------------|
| `EBELN` | Purchase Order | |
| `EBELP` | Item Number | |
| `MATNR` | Material | Product link |
| `MENGE` | Order Quantity | |
| `MEINS` | UOM | |
| `NETPR` | Net Price | Unit cost |
| `PEINH` | Price Unit | |
| `EINDT` | Delivery Date | Expected receipt |
| `WERKS` | Plant | Receiving location |

---

### 5. **Delivery/Shipment (If Sites are Customers)**

#### **LIKP** - SD Delivery Header

**Purpose**: Deliveries to clinical sites (if using SD module)

| SAP Field | Description | Gold Layer Mapping |
|-----------|-------------|-------------------|
| `VBELN` | Delivery Number | `gold_shipments.shipment_number` |
| `ERDAT` | Created On | |
| `ERZET` | Created Time | |
| `ERNAM` | Created By | |
| `LFDAT` | Delivery Date | `gold_shipments.actual_ship_date` |
| `WADAT` | Goods Issue Date | |
| `KUNNR` | Customer (Site) | `gold_sites.site_id` |
| `KUNAG` | Sold-To Party | |
| `VSTEL` | Shipping Point | Depot/warehouse |
| `ROUTE` | Route | |
| `LFART` | Delivery Type | |
| `ZUKRL` | Date/Time Promised | `gold_shipments.expected_delivery_date` |
| `WADAT_IST` | Actual GI Date | |

#### **LIPS** - SD Delivery Items

| SAP Field | Description | Gold Layer Mapping |
|-----------|-------------|-------------------|
| `VBELN` | Delivery | Shipment ID |
| `POSNR` | Item | Line number |
| `MATNR` | Material | Product |
| `LFIMG` | Delivery Quantity | `gold_shipment_items.quantity` |
| `VRKME` | Sales UOM | |
| `CHARG` | Batch | `gold_shipment_items.batch_number` |
| `WERKS` | Plant | |
| `LGORT` | Storage Location | |
| `VGBEL` | Reference Document | Sales order |
| `VGPOS` | Reference Item | |

**ETL Logic for Shipments**:
```sql
-- Extract delivery/shipment data
SELECT 
    h.VBELN as DELIVERY_NUMBER,
    h.LFDAT as DELIVERY_DATE,
    h.WADAT_IST as GOODS_ISSUE_DATE,
    h.KUNNR as CUSTOMER_CODE,
    kna.NAME1 as CUSTOMER_NAME, -- From KNA1
    h.VSTEL as SHIPPING_POINT,
    h.ROUTE as ROUTE,
    h.ZUKRL as PROMISED_DATE,
    i.POSNR as ITEM_NUMBER,
    i.MATNR as MATERIAL,
    i.CHARG as BATCH,
    i.LFIMG as QUANTITY,
    i.VRKME as UOM,
    -- Delivery status from VBUK
    s.WBSTK as GOODS_MOVEMENT_STATUS,
    s.GBSTK as OVERALL_STATUS
FROM LIKP h
INNER JOIN LIPS i ON h.VBELN = i.VBELN
LEFT JOIN KNA1 kna ON h.KUNNR = kna.KUNNR
LEFT JOIN VBUK s ON h.VBELN = s.VBELN
WHERE i.MATNR IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED'))
  AND h.LFDAT >= '2024-01-01'
ORDER BY h.LFDAT DESC
```

---

## 🔄 ETL Extraction Strategies

### **Full Load vs Incremental**

#### **Full Load (Initial)**:
```sql
-- One-time load of all relevant data
SELECT * FROM <table>
WHERE <material_filter>
  AND <active_flag_check>
```

#### **Incremental Load (Daily)**:
```sql
-- Delta based on change dates
SELECT * FROM <table>
WHERE (LAEDA >= :LAST_LOAD_DATE  -- Last changed date
   OR ERSDA >= :LAST_LOAD_DATE)  -- Created date
  AND <material_filter>
```

### **Change Data Capture (CDC)**:

SAP Tables to monitor for changes:
- `CDHDR` - Change Document Header
- `CDPOS` - Change Document Items

```sql
-- Track changes to material master
SELECT 
    c.OBJECTCLAS,
    c.OBJECTID,
    c.CHANGENR,
    c.UDATE as CHANGE_DATE,
    c.UTIME as CHANGE_TIME,
    c.USERNAME,
    p.TABNAME,
    p.FNAME as FIELD_NAME,
    p.CHNGIND as CHANGE_TYPE, -- U=Update, I=Insert, D=Delete
    p.VALUE_NEW,
    p.VALUE_OLD
FROM CDHDR c
INNER JOIN CDPOS p ON c.CHANGENR = p.CHANGENR
WHERE c.OBJECTCLAS = 'MATERIAL'
  AND c.UDATE >= :LAST_LOAD_DATE
  AND c.OBJECTID IN (SELECT MATNR FROM MARA WHERE MTART IN ('ZMED'))
ORDER BY c.UDATE DESC, c.UTIME DESC
```

---

## 📊 Key SAP Tables Summary

| Module | Table | Description | Gold Layer Entity |
|--------|-------|-------------|-------------------|
| MM | MARA | Material Master | `gold_products` |
| MM | MARC | Plant Data | `gold_products` |
| MM | MAKT | Material Description | `gold_products` |
| MM | MCH1 | Batch Master | `gold_inventory` |
| MM | MCHA | Batch Stock | `gold_inventory` |
| MM | MCHB | Batch Valuation | `gold_inventory` |
| MM | MSEG | Material Document | Movement history |
| MM | MKPF | Material Document Header | Movement header |
| MM | EKKO | PO Header | Purchase orders |
| MM | EKPO | PO Items | Purchase order items |
| SD | LIKP | Delivery Header | `gold_shipments` |
| SD | LIPS | Delivery Items | `gold_shipment_items` |
| SD | VBUK | Delivery Status | Shipment status |
| SD | KNA1 | Customer Master | `gold_sites` (if customers) |
| SD | KNVV | Customer Sales Data | |

---

## 🔐 SAP Authorization Requirements

**Minimum Required Authorizations**:

- `S_TABU_DIS` - Table Display Authorization
- `S_RFC` - RFC Authorization (for remote calls)
- Display access to:
  - Material Master (MM01/MM03)
  - Stock Overview (MMBE)
  - Batch Information (MSC3N)
  - Delivery Display (VL03N)
  - Purchase Order Display (ME23N)

---

## 🛠️ Recommended Extraction Method

### **Option 1: SAP Standard Extractors (DataSource)**

Use SAP Business Warehouse extractors:
- `0MATERIAL_ATTR` - Material master
- `0MAT_PLANT_ATTR` - Plant data
- `0MATERIAL_TEXT` - Descriptions
- `2LIS_03_BX` - Batch data
- `2LIS_03_BF` - Stock movements

### **Option 2: Custom ABAP RFC Function**

Create custom RFC-enabled function module:
```abap
FUNCTION Z_GET_CLINICAL_MATERIALS
  TABLES
    IT_MATERIALS TYPE TABLE OF <material_structure>
    IT_INVENTORY TYPE TABLE OF <inventory_structure>
  EXCEPTIONS
    NO_DATA_FOUND
```

### **Option 3: Direct Database Connection**

Use SAP HANA/database views (requires appropriate licensing):
```sql
CREATE VIEW Z_CLINICAL_INVENTORY AS
SELECT 
    m.MATNR,
    m.MTART,
    mc.WERKS,
    mc.LGORT,
    mc.CHARG,
    mc.CLABS,
    mb.VFDAT
FROM MARA m
INNER JOIN MCHA mc ON m.MATNR = mc.MATNR
INNER JOIN MCH1 mb ON mc.MATNR = mb.MATNR AND mc.CHARG = mb.CHARG
WHERE m.MTART IN ('ZMED', 'ZIMP')
```

---

**Next Document**: CTMS/Veeva Vault Source Mappings
