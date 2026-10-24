# PostgreSQL Local Setup for Development

## Option A: PostgreSQL Installed (Recommended)

### Step 1: Verify PostgreSQL is Installed

```bash
psql --version
```

If installed, you should see: `psql (PostgreSQL) 12.x` or similar

### Step 2: Start PostgreSQL Service

#### Windows
1. Open Services (services.msc)
2. Find "PostgreSQL" service
3. Right-click → Start

Or from PowerShell (admin):
```powershell
Start-Service postgresql-x64-15
```

#### Mac
```bash
brew services start postgresql
```

#### Linux
```bash
sudo service postgresql start
```

### Step 3: Create Database

```bash
createdb carbon_project
```

If this fails with "role postgres does not exist", use:
```bash
sudo -u postgres createdb carbon_project
```

### Step 4: Verify Connection

```bash
psql -U postgres -d carbon_project -c "SELECT version();"
```

You should see the PostgreSQL version.

---

## Option B: PostgreSQL Not Installed? (Docker)

### Step 1: Install Docker

- **Windows**: https://www.docker.com/products/docker-desktop
- **Mac**: https://www.docker.com/products/docker-desktop
- **Linux**: `sudo apt-get install docker.io`

### Step 2: Start PostgreSQL Container

```bash
docker run --name carbon-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=carbon_project \
  -p 5432:5432 \
  -d postgres:15
```

### Step 3: Verify Connection

```bash
psql -U postgres -h localhost -d carbon_project -c "SELECT version();"
```

Password: `postgres`

---

## Option C: Use pgAdmin (GUI Tool)

If you prefer a graphical interface:

1. Go to https://www.pgadmin.org/download/
2. Download pgAdmin 4
3. Install and run
4. Create new local connection to `localhost:5432`
5. Username: `postgres`, Password: `postgres`
6. Create database named `carbon_project`

---

## Verify Everything Works

After setting up PostgreSQL:

1. **Test connection**:
   ```bash
   psql -U postgres -d carbon_project
   ```

2. **Should see**:
   ```
   psql (12.x or higher)
   Type "help" for help.

   carbon_project=#
   ```

3. **Exit**:
   ```
   \q
   ```

---

## Backend Should Now Work

```bash
cd server
npm run dev
```

You should see:
```
[DB] Testing database connection...
[DB] Connected successfully.
[DB] Running migrations...
[DB] Migrations complete.
[Server] CarbonDesk CPMS API listening on http://localhost:3000
```

---

## Troubleshooting

### Error: "psql: command not found"
**Solution**: PostgreSQL not in PATH or not installed
- Windows: Add PostgreSQL bin folder to PATH
- Mac/Linux: Install PostgreSQL via package manager

### Error: "password authentication failed"
**Solution**: Default password is `postgres`
- If you set a different password, update `.env`:
  ```env
  DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/carbon_project
  ```

### Error: "could not connect to server"
**Solution**: PostgreSQL service not running
- Check if service is running (see Step 2 above)
- Try restarting the service

### Error: "database does not exist"
**Solution**: Create the database
```bash
createdb carbon_project
```

### Port 5432 already in use
**Solution**: Change PostgreSQL port in `.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/carbon_project
```
Then configure PostgreSQL to use port 5433.

---

## Quick Reference

| Task | Command |
|------|---------|
| Start PostgreSQL | `Start-Service postgresql-x64-15` (Windows) |
| Create database | `createdb carbon_project` |
| Connect to DB | `psql -U postgres -d carbon_project` |
| List databases | `\l` (in psql) |
| Exit psql | `\q` |
| Test backend | `cd server && npm run dev` |

---

Done? Go back to running the backend:
```bash
cd server
npm run dev
```
