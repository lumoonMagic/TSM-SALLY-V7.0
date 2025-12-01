# 🚀 Sally TSM Backend

AI-powered Trial Supply Management Backend with **Google Gemini** integration.

## ✨ Features

- **Multi-Database Support**: PostgreSQL, MySQL, Oracle, SQLite
- **Gemini AI Integration**: Natural language to SQL conversion
- **Safety-First**: Query validation and SQL injection protection
- **Fast API**: Modern async Python framework
- **Easy Configuration**: Dynamic database and LLM setup via API

---

## 📋 Prerequisites

- Python 3.9+
- pip or conda
- Database server (PostgreSQL, MySQL, Oracle, or SQLite)
- Google Gemini API key

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd sally-backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
nano .env
```

**Get Gemini API Key**: https://makersuite.google.com/app/apikey

### 3. Start Server

```bash
python main.py
```

Server will start on `http://localhost:8000`

### 4. Test API

Open browser to: `http://localhost:8000/docs`

You'll see the interactive API documentation (Swagger UI)

---

## 🔧 Configuration

### Option 1: Environment Variables

Edit `.env` file:

```bash
GEMINI_API_KEY=your_api_key_here
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sally_tsm
DB_USER=postgres
DB_PASSWORD=your_password
```

### Option 2: API Configuration (Recommended)

Use the Configuration API endpoints to set up dynamically:

**Configure Database:**
```bash
curl -X POST http://localhost:8000/api/v1/config/database \
  -H "Content-Type: application/json" \
  -d '{
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "sally_tsm",
    "username": "postgres",
    "password": "your_password"
  }'
```

**Configure Gemini:**
```bash
curl -X POST http://localhost:8000/api/v1/config/llm \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "api_key": "your_gemini_api_key",
    "model": "gemini-pro"
  }'
```

---

## 📡 API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /api/v1/health` - Detailed status

### Configuration
- `POST /api/v1/config/database` - Configure database
- `POST /api/v1/config/llm` - Configure Gemini AI
- `GET /api/v1/config/status` - Get current configuration

### Query Processing
- `POST /api/v1/query/ask` - Natural language → SQL
- `POST /api/v1/query/execute` - Execute SQL query

### Data Endpoints
- `GET /api/v1/data/sites` - Get all sites
- `GET /api/v1/data/inventory` - Get inventory
- `GET /api/v1/data/shipments` - Get shipments
- `GET /api/v1/data/studies` - Get studies
- `GET /api/v1/data/vendors` - Get vendors
- `GET /api/v1/data/tasks` - Get tasks

---

## 💡 Usage Examples

### Example 1: Natural Language Query

```bash
curl -X POST http://localhost:8000/api/v1/query/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me all sites with low inventory",
    "include_visualization": true
  }'
```

**Response:**
```json
{
  "success": true,
  "sql": "SELECT * FROM sites WHERE inventory_level < 10",
  "explanation": "Query retrieves sites with inventory below threshold",
  "requires_approval": true
}
```

### Example 2: Execute Approved Query

```bash
curl -X POST http://localhost:8000/api/v1/query/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sql_query": "SELECT * FROM sites WHERE inventory_level < 10",
    "include_visualization": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {"site_id": "S001", "name": "Boston Medical", "inventory_level": 5},
    {"site_id": "S002", "name": "Chicago Research", "inventory_level": 8}
  ],
  "visualization": {
    "type": "bar",
    "x_axis": "name",
    "y_axis": "inventory_level"
  },
  "row_count": 2
}
```

---

## 🗄️ Database Setup

### PostgreSQL

```sql
CREATE DATABASE sally_tsm;

CREATE TABLE sites (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(20),
    investigator VARCHAR(255),
    enrollment_target INTEGER,
    current_enrollment INTEGER,
    last_shipment TIMESTAMP
);

-- Add more tables as needed
```

### MySQL

```sql
CREATE DATABASE sally_tsm;
USE sally_tsm;

CREATE TABLE sites (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(20),
    investigator VARCHAR(255),
    enrollment_target INT,
    current_enrollment INT,
    last_shipment DATETIME
);
```

### SQLite

No setup needed! Just specify the database file path:
```bash
DB_TYPE=sqlite
DB_NAME=./sally_tsm.db
```

---

## 🔒 Security Features

1. **SQL Injection Protection**
   - Query validation before execution
   - Only SELECT queries allowed
   - Dangerous keywords blocked

2. **API Key Protection**
   - Environment variables for sensitive data
   - No keys in code or logs

3. **Query Safety Validation**
   - Automatic checks for:
     - DROP, DELETE, UPDATE, INSERT
     - System commands
     - Multiple statements
     - SQL injection patterns

---

## 🧪 Testing

### Test Gemini Connection

```bash
curl http://localhost:8000/api/v1/health
```

### Test Database Connection

```bash
curl -X POST http://localhost:8000/api/v1/config/database \
  -H "Content-Type: application/json" \
  -d '{"type": "sqlite", "database": "./test.db"}'
```

---

## 📊 Project Structure

```
sally-backend/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
├── README.md              # This file
├── database/
│   ├── __init__.py
│   └── manager.py         # Database connection manager
└── ai/
    ├── __init__.py
    └── gemini_agent.py    # Gemini AI integration
```

---

## 🐛 Troubleshooting

### Issue: "Gemini API not configured"

**Solution**: Add your API key to `.env`:
```bash
GEMINI_API_KEY=your_key_here
```

### Issue: "Database connection failed"

**Solution**: Check database credentials and ensure server is running:
```bash
# PostgreSQL
psql -U postgres -h localhost -d sally_tsm

# MySQL
mysql -u root -p -h localhost sally_tsm
```

### Issue: "Module not found"

**Solution**: Install dependencies:
```bash
pip install -r requirements.txt
```

---

## 📝 Development

### Run in Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### View Logs

Logs are printed to console. To save to file:
```bash
python main.py > sally_backend.log 2>&1
```

---

## 🚢 Deployment

### Using Docker (Future)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### Using Systemd

Create `/etc/systemd/system/sally-backend.service`:
```ini
[Unit]
Description=Sally TSM Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sally-backend
ExecStart=/usr/bin/python3 main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 📚 Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## 🆘 Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review logs for error messages
3. Ensure all environment variables are set

---

## 📄 License

Proprietary - Sally TSM Agent

---

**Version**: 1.0.0  
**Last Updated**: 2024-11-25
