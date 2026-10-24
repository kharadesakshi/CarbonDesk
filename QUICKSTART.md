# Quick Start Guide

Get the Carbon Project Management Platform running locally in 5 minutes.

## Prerequisites
- Node.js 16+ installed
- Supabase account (free tier works)
- Mapbox account (free tier works)

## 1. Prepare Environment Files

### Backend - Create `server/.env`

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@host.supabase.co:5432/postgres?schema=public
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRY=7d
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
CORS_ORIGIN=http://localhost:5173
```

### Frontend - Create `.env` in frontend directory

```bash
cd frontend
cat > .env << EOF
VITE_API_URL=http://localhost:3000/api
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
EOF
```

## 2. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../frontend
npm install
```

## 3. Database Setup

### Option A: Supabase (Easiest)

1. Create free project at https://supabase.com
2. Copy connection string: Settings → Database → Connection String → URI
3. Paste into `server/.env` as `DATABASE_URL`
4. Run migrations:

```bash
cd server
npm run migrate
```

### Option B: Local PostgreSQL

```bash
# Create database
createdb carbon_project

# Update server/.env
DATABASE_URL=postgresql://localhost/carbon_project

# Run migrations
cd server
npm run migrate
```

## 4. Start Development Servers

### Terminal 1 - Backend
```bash
cd server
npm run dev
```
Should show: `Server running on port 3000`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Should show: `Local: http://localhost:5173`

## 5. Open in Browser

Go to: **http://localhost:5173**

## 6. First Time Use

1. **Register**: Create account with email/password
2. **Create Project**: Click "New Project" on dashboard
3. **Add Participants**: Go to project → Participants tab
4. **Upload Documents**: Go to project → Documents tab
5. **Map Boundary**: Go to project → GIS tab

## Common Issues

### Database connection fails
```
Check DATABASE_URL in server/.env
Verify PostgreSQL is running
Check Supabase connection string
```

### Port 3000 already in use
```
Edit server/.env: PORT=3001
Update frontend .env: VITE_API_URL=http://localhost:3001/api
```

### Mapbox not showing
```
Edit frontend/.env: Add VITE_MAPBOX_ACCESS_TOKEN from mapbox.com
```

### Build fails
```
cd server && npm run build    # Should show dist/ folder created
cd frontend && npm run build  # Should show dist/ folder created
```

## Next Steps

- See [README.md](./README.md) for full documentation
- See [API docs](./README.md#api-documentation) for endpoint reference
- Deploy guide in README.md

## Support

Troubleshooting section in README.md has solutions for common problems.
