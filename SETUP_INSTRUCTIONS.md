# Setup Instructions for Carbon Project Management Platform

## Current Status

✅ **Frontend**: Built successfully and ready to run  
✅ **Backend**: Built successfully, requires database configuration  
✅ **All code**: Compiled with 0 TypeScript errors  

## Next Steps

### Step 1: Set Up Database (Choose One Option)

#### Option A: Supabase (Recommended for Production)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up for free account
   - Create new project

2. **Get Connection String**
   - In Supabase Dashboard, go to: **Settings → Database → Connection Strings**
   - Copy the URI (PostgreSQL)
   - It looks like: `postgresql://postgres:[PASSWORD]@host.supabase.co:5432/postgres`

3. **Update `.env` File**
   - Open `server/.env`
   - Replace `DATABASE_URL` line:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@host.supabase.co:5432/postgres
   ```

#### Option B: Local PostgreSQL (Development Only)

1. **Install PostgreSQL**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Or use: `choco install postgresql` (if Chocolatey installed)
   - Or use: `brew install postgresql` (if on Mac)

2. **Create Database**
   ```bash
   createdb carbon_project
   ```

3. **Update `.env` File**
   - `server/.env` already has this configured:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carbon_project
   ```
   - If PostgreSQL password is different, update accordingly

### Step 2: Verify Backend Setup

```bash
cd server
npm install  # First time only
npm run dev
```

**Success looks like:**
```
> carbondesk-cpms-server@1.0.0 dev
> npm run build && node dist/server.js

> carbondesk-cpms-server@1.0.0 build
> tsc

[DB] Testing database connection...
[DB] Connected successfully.
[DB] Running migrations...
[DB] Migrations complete.
[Server] CarbonDesk CPMS API listening on http://localhost:3000
```

### Step 3: Verify Frontend Setup

In **new terminal window**:

```bash
cd frontend
npm install  # First time only
npm run dev
```

**Success looks like:**
```
> carbondesk-cpms-frontend@0.1.0 dev
> vite

  VITE v8.2.1  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 4: Open in Browser

1. Go to **http://localhost:5173**
2. Click **"Get Started"** or **"Sign Up"**
3. Register with email & password
4. Test the application

## Environment Files Created

### Backend - `server/.env`
```env
PORT=3000                    # API port
NODE_ENV=development         # Environment
DATABASE_URL=...             # PostgreSQL connection
JWT_SECRET=...               # JWT signing key
STORAGE_PROVIDER=local       # local or s3
LOCAL_STORAGE_PATH=./uploads # File upload directory
CORS_ORIGIN=http://localhost:5173  # Frontend URL
```

### Frontend - `.env` (if needed)
Create `frontend/.env` if Mapbox GIS doesn't work:
```env
VITE_API_URL=http://localhost:3000/api
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

**Get Mapbox token:**
1. Go to https://account.mapbox.com/tokens/
2. Create new token with default scopes
3. Paste into `.env`

## Troubleshooting

### Backend fails to start: "ConnectionRefusedError"
**Problem**: Database not running or connection string incorrect

**Solution:**
- **Supabase**: Verify DATABASE_URL is correct (copy from Supabase settings)
- **Local PostgreSQL**: Ensure PostgreSQL is running
  - Windows: Start PostgreSQL service
  - Mac: `brew services start postgresql`
  - Linux: `sudo service postgresql start`

### Frontend build fails: "Module not found"
**Problem**: Dependencies not installed

**Solution:**
```bash
cd frontend
rm -r node_modules
npm install
npm run dev
```

### Port 3000 or 5173 already in use
**Problem**: Another service is using the port

**Solution for Backend:**
- Edit `server/.env`: `PORT=3001`
- Also update frontend `.env`: `VITE_API_URL=http://localhost:3001/api`

**Solution for Frontend:**
- Vite will automatically use next available port (5174, 5175...)

### Mapbox map not showing on GIS page
**Problem**: Mapbox token not configured

**Solution:**
1. Get free token from https://account.mapbox.com/tokens/
2. Create `frontend/.env`:
   ```env
   VITE_MAPBOX_ACCESS_TOKEN=pk_...
   ```
3. Restart frontend dev server

### Login fails or API errors
**Problem**: Backend not running

**Solution:**
1. Verify backend is running: Check terminal should show port 3000
2. Check `server/.env` is configured correctly
3. Check database connection works

## Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:3000/health
# Should return 200 OK
```

### Frontend Check
- Open http://localhost:5173 in browser
- Should see landing page
- Register → should work without errors

### API Check
After login, create a project:
- Should see "New Project" button
- Fill form → Submit
- Should redirect to project details

## Optional: Mapbox Configuration

Skip if you don't need GIS mapping features.

1. **Get Free Mapbox Token**
   - Go to https://account.mapbox.com (create account if needed)
   - Go to **Tokens**
   - Create new token with "public" scope
   - Copy token

2. **Add to Frontend**
   - Create/edit `frontend/.env`:
   ```env
   VITE_MAPBOX_ACCESS_TOKEN=pk_your_token_here
   ```

3. **Restart Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test GIS**
   - Create/open project
   - Go to "GIS" tab
   - Map should appear

## Commands Reference

### Frontend
```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production (creates dist/)
npm run preview   # Preview production build
```

### Backend
```bash
npm run dev       # Start dev server (compiles TS + runs)
npm run build     # Compile TypeScript only (creates dist/)
npm start         # Run pre-compiled backend (dist/server.js)
npm run migrate   # Run database migrations (if needed)
```

## Project URLs

When running locally:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

## Documentation Files

For more info, see:
- **README.md** - Full technical documentation
- **QUICKSTART.md** - Quick start version of this guide
- **BUILD_VERIFICATION.md** - Build verification report
- **PROJECT_COMPLETE.md** - Project summary

## Support

If you encounter issues:

1. Check **Troubleshooting** section above
2. Verify `.env` files are configured
3. Ensure both backend and frontend are running
4. Check browser console for frontend errors
5. Check terminal output for backend errors

## Next: Start Developing!

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Browser
# Open http://localhost:5173
```

Happy coding! 🚀
