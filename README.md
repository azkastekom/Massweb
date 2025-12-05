# Mass Marketing SEO System - Setup Guide

## Quick Start

### Backend
1. Copy `.env.example` to `.env` and configure:
   - MySQL credentials
   - S3/MinIO credentials and endpoint
   - Redis connection

2. Create database:
   ```sql
   CREATE DATABASE massweb;
   ```

3. Start backend:
   ```bash
   cd backend
   npm run start:dev
   ```

### Frontend
1. Create `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## System Status

### ✅ Backend (Complete)
- All API endpoints functional
- Database entities and migrations ready
- Background job processing configured
- S3 uploads working (AWS-compatible)
- Template rendering with Handlebars
- Delayed publishing mechanism

### ⏳ Frontend (API Client Ready)
- API client with TypeScript types created
- Dependencies installed
- UI pages need to be built

## Environment Variables

### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=massweb

# S3 (use endpoint for MinIO/Wasabi)
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=massweb-uploads
AWS_S3_ENDPOINT=http://localhost:9000  # Optional: for MinIO

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
VITE_API_URL=http://localhost:3001/api
```

## Testing the Backend

You can test the backend endpoints using curl or Postman:

```bash
# Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "template": "<h1>{{title}}</h1>",
    "publishDelaySeconds": 5
  }'

# List projects
curl http://localhost:3001/api/projects

# Upload CSV (replace PROJECT_ID)
curl -X POST http://localhost:3001/api/csv/projects/PROJECT_ID/upload \
  -F "file=@your-file.csv"

# Generate content
curl -X POST http://localhost:3001/api/content-generator/projects/PROJECT_ID/generate-sync
```

## Next: Build Frontend UI

The backend is ready. Focus on building:
1. Project list page
2. Create project form with template editor
3. CSV upload interface
4. Content management pages
5. Publish job monitoring

See `walkthrough.md` for full documentation.
