# Sally TSM Agent - API Reference

> **Purpose**: Complete API documentation for frontend-backend integration  
> **Target Audience**: Frontend developers, AI code assistants  
> **Base URL**: `http://localhost:8000` (development) / `https://your-domain.com` (production)  
> **Last Updated**: November 25, 2025

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Health Check](#health-check)
3. [Database Management](#database-management)
4. [Q&A Assistant](#qa-assistant)
5. [Inventory Management](#inventory-management)
6. [Shipment Management](#shipment-management)
7. [Dashboard Metrics](#dashboard-metrics)
8. [Configuration](#configuration)
9. [Error Responses](#error-responses)
10. [TypeScript Integration](#typescript-integration)

---

## 🔐 Authentication

**Status**: Not yet implemented (planned for v1.1)

**Planned Implementation**:
```typescript
// Future authentication
headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

**Current**: All endpoints are open (development only)

---

## 🏥 Health Check

### GET `/api/v1/health`

Check if API server is running and healthy.

**Request**:
```bash
curl -X GET http://localhost:8000/api/v1/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-25T10:30:00.000Z",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "type": "postgres"
  }
}
```

**Status Codes**:
- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service is down

**TypeScript**:
```typescript
interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  database?: {
    connected: boolean
    type: string
  }
}

const checkHealth = async (): Promise<HealthResponse> => {
  const response = await fetch('/api/v1/health')
  return await response.json()
}
```

---

## 🗄️ Database Management

### POST `/api/v1/database/test-connection`

Test database connection before saving configuration.

**Request Body**:
```json
{
  "database_type": "postgres",
  "host": "localhost",
  "port": 5432,
  "database": "tsm_db",
  "user": "admin",
  "password": "secret123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Connection successful",
  "latency_ms": 45,
  "version": "PostgreSQL 15.3"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Connection failed: Password authentication failed",
  "error_code": "AUTH_FAILED"
}
```

**Status Codes**:
- `200 OK` - Connection successful
- `400 Bad Request` - Invalid configuration
- `500 Internal Server Error` - Connection failed

**TypeScript**:
```typescript
interface DatabaseConfig {
  database_type: 'postgres' | 'mysql' | 'oracle' | 'mongodb' | 'sqlite'
  host: string
  port: number
  database: string
  user: string
  password: string
}

interface TestConnectionResponse {
  success: boolean
  message: string
  latency_ms?: number
  version?: string
  error_code?: string
}

const testConnection = async (
  config: DatabaseConfig
): Promise<TestConnectionResponse> => {
  const response = await fetch('/api/v1/database/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  return await response.json()
}
```

---

### POST `/api/v1/database/create-schema`

Create database schema and optionally seed with sample data.

**Request Body**:
```json
{
  "database_config": {
    "database_type": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "tsm_db",
    "user": "admin",
    "password": "secret123"
  },
  "schema_definition": {
    "inventory": {
      "id": "SERIAL PRIMARY KEY",
      "product_name": "VARCHAR(255)",
      "quantity": "INTEGER",
      "site_id": "INTEGER"
    },
    "shipments": {
      "id": "SERIAL PRIMARY KEY",
      "shipment_id": "VARCHAR(50)",
      "status": "VARCHAR(50)"
    }
  },
  "seed_data": true,
  "record_count": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Schema created successfully",
  "tables_created": ["inventory", "shipments", "sites", "studies"],
  "records_seeded": {
    "inventory": 50,
    "shipments": 30,
    "sites": 10,
    "studies": 5
  },
  "duration_ms": 1250
}
```

**Status Codes**:
- `201 Created` - Schema created successfully
- `400 Bad Request` - Invalid schema definition
- `409 Conflict` - Tables already exist
- `500 Internal Server Error` - Creation failed

**TypeScript**:
```typescript
interface SchemaConfig {
  database_config: DatabaseConfig
  schema_definition: Record<string, Record<string, string>>
  seed_data: boolean
  record_count?: number
}

interface CreateSchemaResponse {
  success: boolean
  message: string
  tables_created: string[]
  records_seeded?: Record<string, number>
  duration_ms: number
}

const createSchema = async (
  config: SchemaConfig
): Promise<CreateSchemaResponse> => {
  const response = await fetch('/api/v1/database/create-schema', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  return await response.json()
}
```

---

## 💬 Q&A Assistant

### POST `/api/v1/qa/ask`

Process natural language question and generate SQL query.

**Request Body**:
```json
{
  "question": "Show me all inventory items with low stock",
  "context": {
    "user_role": "manager",
    "site_id": 3
  }
}
```

**Response**:
```json
{
  "sql": "SELECT product_name, quantity, reorder_point, site_name FROM inventory WHERE quantity < reorder_point ORDER BY quantity ASC LIMIT 50",
  "explanation": "This query finds all inventory items where the current quantity is below the reorder point, indicating low stock. Results are sorted by quantity (lowest first) to prioritize critical items.",
  "chart_type": "bar",
  "confidence": 0.95,
  "execution_time_ms": 234,
  "suggested_actions": [
    "Review reorder points",
    "Contact suppliers for low stock items",
    "Check historical usage patterns"
  ]
}
```

**Status Codes**:
- `200 OK` - Query generated successfully
- `400 Bad Request` - Invalid question format
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Generation failed

**TypeScript**:
```typescript
interface QARequest {
  question: string
  context?: {
    user_role?: string
    site_id?: number
    [key: string]: any
  }
}

interface QAResponse {
  sql: string
  explanation: string
  chart_type: 'bar' | 'line' | 'pie' | 'table'
  confidence: number
  execution_time_ms: number
  suggested_actions?: string[]
}

const askQuestion = async (request: QARequest): Promise<QAResponse> => {
  const response = await fetch('/api/v1/qa/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return await response.json()
}

// Usage example
const result = await askQuestion({
  question: "What shipments are delayed?",
  context: { user_role: "logistics_manager" }
})

console.log(result.sql)
console.log(result.explanation)
```

---

### POST `/api/v1/qa/execute`

Execute validated SQL query and return results.

**Request Body**:
```json
{
  "sql": "SELECT product_name, quantity FROM inventory WHERE quantity < 10",
  "limit": 100,
  "format": "json"
}
```

**Response**:
```json
{
  "results": [
    {
      "product_name": "Drug A - 10mg",
      "quantity": 5
    },
    {
      "product_name": "Drug B - 25mg",
      "quantity": 8
    }
  ],
  "row_count": 2,
  "execution_time_ms": 45,
  "columns": ["product_name", "quantity"]
}
```

**Status Codes**:
- `200 OK` - Query executed successfully
- `400 Bad Request` - Invalid SQL syntax
- `403 Forbidden` - Unsafe SQL detected
- `500 Internal Server Error` - Execution failed

**TypeScript**:
```typescript
interface ExecuteRequest {
  sql: string
  limit?: number
  format?: 'json' | 'csv'
}

interface ExecuteResponse {
  results: Record<string, any>[]
  row_count: number
  execution_time_ms: number
  columns: string[]
}

const executeQuery = async (
  request: ExecuteRequest
): Promise<ExecuteResponse> => {
  const response = await fetch('/api/v1/qa/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return await response.json()
}
```

---

## 📦 Inventory Management

### GET `/api/v1/inventory`

Get inventory items with optional filtering.

**Query Parameters**:
```
site_id: number (optional)
status: string (optional) - "in-stock" | "low-stock" | "out-of-stock"
study_id: number (optional)
limit: number (default: 100, max: 1000)
offset: number (default: 0)
sort_by: string (default: "id")
sort_order: string (default: "asc") - "asc" | "desc"
```

**Request**:
```bash
curl -X GET "http://localhost:8000/api/v1/inventory?site_id=3&status=low-stock&limit=50"
```

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "product_name": "Drug A - 10mg",
      "site_id": 3,
      "site_name": "Memorial Hospital",
      "study_id": 101,
      "study_name": "Phase III Oncology",
      "lot_number": "LOT-2025-001",
      "quantity": 5,
      "reorder_point": 10,
      "expiry_date": "2026-03-15",
      "status": "low-stock",
      "last_updated": "2025-11-25T10:00:00Z"
    }
  ],
  "total_count": 1,
  "page": 1,
  "page_size": 50,
  "has_next": false
}
```

**Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `500 Internal Server Error` - Query failed

**TypeScript**:
```typescript
interface InventoryFilters {
  site_id?: number
  status?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'nearing-expiry'
  study_id?: number
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface Inventory {
  id: number
  product_name: string
  site_id: number
  site_name: string
  study_id: number
  study_name: string
  lot_number: string
  quantity: number
  reorder_point: number
  expiry_date: string
  status: string
  last_updated: string
}

interface InventoryResponse {
  items: Inventory[]
  total_count: number
  page: number
  page_size: number
  has_next: boolean
}

const getInventory = async (
  filters?: InventoryFilters
): Promise<InventoryResponse> => {
  const params = new URLSearchParams(
    Object.entries(filters || {}).map(([k, v]) => [k, String(v)])
  )
  
  const response = await fetch(`/api/v1/inventory?${params}`)
  return await response.json()
}

// Usage
const lowStock = await getInventory({
  status: 'low-stock',
  site_id: 3,
  limit: 50
})
```

---

### POST `/api/v1/inventory`

Create new inventory item.

**Request Body**:
```json
{
  "product_name": "Drug C - 50mg",
  "site_id": 3,
  "study_id": 101,
  "lot_number": "LOT-2025-050",
  "quantity": 100,
  "reorder_point": 20,
  "expiry_date": "2026-12-31"
}
```

**Response**:
```json
{
  "id": 123,
  "product_name": "Drug C - 50mg",
  "site_id": 3,
  "site_name": "Memorial Hospital",
  "study_id": 101,
  "study_name": "Phase III Oncology",
  "lot_number": "LOT-2025-050",
  "quantity": 100,
  "reorder_point": 20,
  "expiry_date": "2026-12-31",
  "status": "in-stock",
  "last_updated": "2025-11-25T10:30:00Z",
  "created_at": "2025-11-25T10:30:00Z"
}
```

**Status Codes**:
- `201 Created` - Item created successfully
- `400 Bad Request` - Invalid data
- `409 Conflict` - Duplicate lot number
- `500 Internal Server Error` - Creation failed

**TypeScript**:
```typescript
interface CreateInventoryRequest {
  product_name: string
  site_id: number
  study_id: number
  lot_number: string
  quantity: number
  reorder_point: number
  expiry_date: string
}

const createInventory = async (
  item: CreateInventoryRequest
): Promise<Inventory> => {
  const response = await fetch('/api/v1/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to create inventory: ${response.status}`)
  }
  
  return await response.json()
}
```

---

### PUT `/api/v1/inventory/{id}`

Update existing inventory item.

**Request**:
```bash
curl -X PUT http://localhost:8000/api/v1/inventory/123 \
  -H "Content-Type: application/json" \
  -d '{"quantity": 75, "status": "in-stock"}'
```

**Request Body**:
```json
{
  "quantity": 75,
  "status": "in-stock"
}
```

**Response**:
```json
{
  "id": 123,
  "product_name": "Drug C - 50mg",
  "quantity": 75,
  "status": "in-stock",
  "last_updated": "2025-11-25T11:00:00Z"
}
```

**Status Codes**:
- `200 OK` - Updated successfully
- `400 Bad Request` - Invalid data
- `404 Not Found` - Item not found
- `500 Internal Server Error` - Update failed

---

### DELETE `/api/v1/inventory/{id}`

Delete inventory item.

**Request**:
```bash
curl -X DELETE http://localhost:8000/api/v1/inventory/123
```

**Response**:
```json
{
  "success": true,
  "message": "Inventory item deleted",
  "id": 123
}
```

**Status Codes**:
- `200 OK` - Deleted successfully
- `404 Not Found` - Item not found
- `500 Internal Server Error` - Deletion failed

---

## 🚚 Shipment Management

### GET `/api/v1/shipments`

Get shipments with optional filtering.

**Query Parameters**:
```
status: string (optional) - "in-transit" | "delivered" | "delayed" | "pending"
site_id: number (optional)
from_date: string (optional) - ISO 8601 date
to_date: string (optional) - ISO 8601 date
limit: number (default: 100)
offset: number (default: 0)
```

**Request**:
```bash
curl -X GET "http://localhost:8000/api/v1/shipments?status=delayed&limit=20"
```

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "shipment_id": "SH-2025-001",
      "origin": "Central Depot",
      "destination": "Memorial Hospital",
      "site_id": 3,
      "status": "delayed",
      "expected_date": "2025-11-20",
      "actual_date": null,
      "delay_days": 5,
      "carrier": "FedEx",
      "tracking_number": "FX123456789",
      "items": [
        {
          "product_name": "Drug A - 10mg",
          "quantity": 50,
          "lot_number": "LOT-2025-001"
        }
      ],
      "temperature_min": 2,
      "temperature_max": 8,
      "temperature_alerts": 0,
      "created_at": "2025-11-15T08:00:00Z",
      "last_updated": "2025-11-25T10:00:00Z"
    }
  ],
  "total_count": 1,
  "summary": {
    "in_transit": 15,
    "delayed": 3,
    "delivered": 102,
    "pending": 5
  }
}
```

**TypeScript**:
```typescript
interface ShipmentFilters {
  status?: 'in-transit' | 'delivered' | 'delayed' | 'pending'
  site_id?: number
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

interface Shipment {
  id: number
  shipment_id: string
  origin: string
  destination: string
  site_id: number
  status: string
  expected_date: string
  actual_date?: string
  delay_days?: number
  carrier: string
  tracking_number: string
  items: ShipmentItem[]
  temperature_min?: number
  temperature_max?: number
  temperature_alerts?: number
  created_at: string
  last_updated: string
}

interface ShipmentItem {
  product_name: string
  quantity: number
  lot_number: string
}

interface ShipmentsResponse {
  items: Shipment[]
  total_count: number
  summary: {
    in_transit: number
    delayed: number
    delivered: number
    pending: number
  }
}

const getShipments = async (
  filters?: ShipmentFilters
): Promise<ShipmentsResponse> => {
  const params = new URLSearchParams(
    Object.entries(filters || {}).map(([k, v]) => [k, String(v)])
  )
  
  const response = await fetch(`/api/v1/shipments?${params}`)
  return await response.json()
}
```

---

## 📊 Dashboard Metrics

### GET `/api/v1/dashboard/metrics`

Get summary metrics for dashboard display.

**Request**:
```bash
curl -X GET http://localhost:8000/api/v1/dashboard/metrics
```

**Response**:
```json
{
  "total_studies": 25,
  "active_sites": 42,
  "critical_alerts": 7,
  "inventory_value": 2456789.50,
  "shipments": {
    "in_transit": 15,
    "delayed": 3,
    "delivered_today": 8
  },
  "inventory": {
    "total_items": 5432,
    "low_stock": 12,
    "nearing_expiry": 5,
    "out_of_stock": 2
  },
  "recent_actions": [
    {
      "id": 1,
      "title": "Reorder Drug A",
      "type": "inventory",
      "priority": "high",
      "status": "pending",
      "due_date": "2025-11-26"
    }
  ],
  "timestamp": "2025-11-25T10:00:00Z"
}
```

**Status Codes**:
- `200 OK` - Success
- `500 Internal Server Error` - Failed to retrieve metrics

**TypeScript**:
```typescript
interface DashboardMetrics {
  total_studies: number
  active_sites: number
  critical_alerts: number
  inventory_value: number
  shipments: {
    in_transit: number
    delayed: number
    delivered_today: number
  }
  inventory: {
    total_items: number
    low_stock: number
    nearing_expiry: number
    out_of_stock: number
  }
  recent_actions: RecentAction[]
  timestamp: string
}

interface RecentAction {
  id: number
  title: string
  type: 'inventory' | 'shipment' | 'site' | 'study'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  due_date: string
}

const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch('/api/v1/dashboard/metrics')
  return await response.json()
}
```

---

## ⚙️ Configuration

### GET `/api/v1/config/status`

Get current system configuration status.

**Response**:
```json
{
  "database": {
    "type": "postgres",
    "connected": true,
    "host": "localhost",
    "port": 5432
  },
  "llm": {
    "provider": "gemini",
    "model": "gemini-pro",
    "configured": true,
    "api_key_present": true
  },
  "mode": "production",
  "version": "1.0.0"
}
```

---

## ❌ Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "timestamp": "2025-11-25T10:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `AI_SERVICE_ERROR` | 500 | AI service unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 🔗 TypeScript Integration

### Complete API Client Example

```typescript
// api-client.ts
class SallyAPIClient {
  private baseURL: string
  
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL
  }
  
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'API request failed')
    }
    
    return await response.json()
  }
  
  // Health
  async checkHealth(): Promise<HealthResponse> {
    return this.request('/api/v1/health')
  }
  
  // Q&A
  async askQuestion(question: string, context?: any): Promise<QAResponse> {
    return this.request('/api/v1/qa/ask', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    })
  }
  
  async executeQuery(sql: string): Promise<ExecuteResponse> {
    return this.request('/api/v1/qa/execute', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    })
  }
  
  // Inventory
  async getInventory(filters?: InventoryFilters): Promise<InventoryResponse> {
    const params = new URLSearchParams(
      Object.entries(filters || {}).map(([k, v]) => [k, String(v)])
    )
    return this.request(`/api/v1/inventory?${params}`)
  }
  
  async createInventory(item: CreateInventoryRequest): Promise<Inventory> {
    return this.request('/api/v1/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }
  
  // Shipments
  async getShipments(filters?: ShipmentFilters): Promise<ShipmentsResponse> {
    const params = new URLSearchParams(
      Object.entries(filters || {}).map(([k, v]) => [k, String(v)])
    )
    return this.request(`/api/v1/shipments?${params}`)
  }
  
  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.request('/api/v1/dashboard/metrics')
  }
  
  // Database
  async testConnection(config: DatabaseConfig): Promise<TestConnectionResponse> {
    return this.request('/api/v1/database/test-connection', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }
}

// Usage
const api = new SallyAPIClient()

// Q&A
const answer = await api.askQuestion("Show me low stock items")
console.log(answer.sql, answer.explanation)

// Inventory
const inventory = await api.getInventory({ status: 'low-stock' })
console.log(inventory.items)

// Dashboard
const metrics = await api.getDashboardMetrics()
console.log(metrics.critical_alerts)
```

---

## 📚 React Hooks for API Integration

```typescript
// hooks/useAPI.ts
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await api.getDashboardMetrics()
        setMetrics(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [])
  
  return { metrics, loading, error }
}

export function useInventory(filters?: InventoryFilters) {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true)
        const data = await api.getInventory(filters)
        setInventory(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInventory()
  }, [JSON.stringify(filters)])
  
  return { inventory, loading, error, refetch: () => fetchInventory() }
}

// Usage in component
function DashboardComponent() {
  const { metrics, loading, error } = useDashboardMetrics()
  
  if (loading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return (
    <div>
      <h1>Critical Alerts: {metrics?.critical_alerts}</h1>
      <h2>Total Studies: {metrics?.total_studies}</h2>
    </div>
  )
}
```

---

## 🎯 Quick Reference

### Base URL
```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-production-domain.com'
  : 'http://localhost:8000'
```

### Common Headers
```typescript
const headers = {
  'Content-Type': 'application/json',
  // Future: 'Authorization': `Bearer ${token}`
}
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/v1/endpoint')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }
  const data = await response.json()
} catch (error) {
  console.error('API error:', error)
  // Show user-friendly error message
}
```

---

**This API reference is optimized for AI code assistants and provides complete TypeScript integration examples.**
