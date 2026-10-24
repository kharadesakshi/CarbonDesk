   # Carbon Project Management Platform - Deployment Guide

Complete step-by-step instructions for deploying the backend to Render and frontend to Vercel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
6. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts
- **Render** account: https://render.com (for backend)
- **Vercel** account: https://vercel.com (for frontend)
- **GitHub** account with repository access
- **Supabase** account or PostgreSQL database (for production database)
- **Mapbox** account (optional, for map functionality)

### Local Requirements
- Node.js 18+ installed
- Git configured and set up
- GitHub CLI (optional but recommended)

### Repository Setup
- Push all code to a GitHub repository
- Ensure `.gitignore` includes sensitive files (`.env`, `node_modules`, etc.)
- Create a `main` branch for production deployments

---

## Backend Deployment (Render)

### Step 1: Prepare the Repository

1. Ensure all code is committed and pushed to GitHub:
```bash
cd carbon_project
git status
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

2. Verify the backend structure:
```bash
ls -la server/
# Should see: src/, dist/, package.json, Dockerfile, tsconfig.json
```

### Step 2: Set Up Database (Supabase or PostgreSQL)

#### Option A: Using Supabase (Recommended)

1. Go to https://supabase.com and sign up/log in
2. Create a new project:
   - Project Name: `carbondesk-production`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
3. Once created, go to **Settings** → **Database**
4. Copy the connection details:
   - Host: `db.XXXX.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: Your chosen password

#### Option B: Using External PostgreSQL
- Have your PostgreSQL connection string ready
- Format: `postgresql://user:password@host:port/database`

### Step 3: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository:
   - Click "Connect account" and authorize GitHub
   - Select your `carbon_project` repository
   - Branch: `main`

4. Configure the service:
   - **Name**: `carbondesk-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Standard (start with free tier if available)

5. Click **Create Web Service**

### Step 4: Add Environment Variables

Once the service is created, go to **Environment** section and add these variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.XXXX.supabase.co:5432/postgres
DB_HOST=db.XXXX.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_SSL=true
JWT_SECRET=YOUR_STRONG_SECRET_MIN_32_CHARS_CHANGE_THIS_GENERATE_RANDOM
JWT_EXPIRES_IN=7d
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=/var/data/uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
CORS_ORIGIN=https://your-frontend-domain.vercel.app
LOG_LEVEL=info
```

**Important**: 
- Generate a strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Replace `YOUR_PASSWORD` with your actual database password
- Replace `your-frontend-domain` with your Vercel domain (you'll get this from Step 5)

### Step 5: Monitor Deployment

1. Go to **Events** tab to watch the deployment
2. Check **Logs** for any errors
3. Once deployed, you'll see a URL like: `https://carbondesk-api.onrender.com`
4. **Save this URL** - you'll need it for the frontend

### Step 6: Verify Backend Health

```bash
curl https://carbondesk-api.onrender.com/health
# Should return: {"status":"ok"}
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare the Frontend

1. Build locally to verify no errors:
```bash
cd frontend
npm run build
# Should succeed with no errors
```

2. Commit changes:
```bash
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. **Import Git Repository**:
   - Search for your `carbon_project` repository
   - Click **Import**

4. **Configure Project**:
   - Framework: **Vite**
   - Root Directory: `./frontend`
   - Build Command: `npm run build` (should auto-detect)
   - Output Directory: `dist` (should auto-detect)

### Step 3: Add Environment Variables

In the **Environment Variables** section, add:

```
VITE_API_BASE_URL=https://carbondesk-api.onrender.com/api
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiWU9VUl9VU0VSTkFNRSIsImEiOiJZT1VSX1RPS0VOIn0.EXAMPLE
```

**Important**:
- Replace `carbondesk-api.onrender.com` with your actual Render backend URL from Step 5
- Get Mapbox token from: https://account.mapbox.com/tokens/

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (typically 2-5 minutes)
3. Once complete, you'll see your domain: `https://your-project.vercel.app`
4. **Save this URL** - you'll use it to update backend CORS

### Step 5: Verify Frontend

1. Visit your deployed frontend URL
2. Test login functionality
3. Verify API calls are working (check Network tab in browser DevTools)

---

## Post-Deployment Configuration

### Step 1: Update Backend CORS

1. Go back to Render dashboard
2. Select your `carbondesk-api` service
3. Go to **Environment**
4. Update `CORS_ORIGIN`:
```
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```
5. Click **Save Changes** (this will trigger a redeploy)

### Step 2: Update Frontend API URL (if using custom domain)

If using a custom domain for backend:

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Edit `VITE_API_BASE_URL` to point to your custom domain
5. Redeploy by pushing a commit to `main`

### Step 3: Configure Custom Domains (Optional)

#### For Render Backend
1. In Render dashboard, select your service
2. Go to **Settings** → **Custom Domain**
3. Add your domain (e.g., `api.carbondesk.com`)
4. Add DNS records as instructed

#### For Vercel Frontend
1. In Vercel dashboard, select your project
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `app.carbondesk.com`)
4. Add DNS records as instructed

### Step 4: Set Up SSL/TLS

Both Render and Vercel automatically provide SSL certificates via Let's Encrypt.

### Step 5: Enable Automatic Deployments

Both platforms automatically deploy when you push to `main` branch.

To disable auto-deploy:
- **Render**: Settings → **Auto-Deploy** → Disable
- **Vercel**: Settings → **Git** → Disable

---

## Monitoring & Troubleshooting

### Backend Logs (Render)

1. Go to Render dashboard
2. Select your `carbondesk-api` service
3. Click **Logs** tab
4. View real-time logs

### Frontend Logs (Vercel)

1. Go to Vercel dashboard
2. Select your project
3. Click **Analytics** or **Monitoring**
4. View deployment logs and performance metrics

### Common Issues

#### Issue: 500 Error on Backend
- Check Render logs for database connection errors
- Verify all environment variables are set
- Ensure database user has correct permissions

#### Issue: Frontend shows "Cannot connect to API"
- Verify `VITE_API_BASE_URL` is correct
- Check backend `CORS_ORIGIN` matches frontend URL
- Ensure backend is running (check Render logs)

#### Issue: Migrations not running
- Backend runs migrations on startup
- If stuck, check database connectivity
- Restart the service from Render dashboard

#### Issue: Slow performance
- Render free tier has limited resources
- Upgrade to Standard plan for better performance
- Check frontend bundle size: `npm run build` and review output

### Performance Optimization

#### Frontend
- Bundle is automatically minified and optimized by Vite
- Current size: ~2.3MB (acceptable for initial load)
- Chunks are split for better caching

#### Backend
- API responses are cached where applicable
- Database queries are optimized
- Consider upgrading database for better performance

---

## Monitoring Setup

### Render Monitoring
- Built-in logging available
- Metrics available in paid plans
- Health check configured at `/health`

### Vercel Monitoring
- Free tier includes basic analytics
- View response times and error rates
- 90-day data retention

### Recommended Monitoring Stack (Optional)
- **Sentry** (error tracking): https://sentry.io
- **LogRocket** (frontend monitoring): https://logrocket.com
- **Datadog** (infrastructure): https://www.datadoghq.com

---

## Rollback Procedures

### Rollback Backend (Render)

1. Go to Render dashboard
2. Select your `carbondesk-api` service
3. Go to **Deployments** tab
4. Find the previous successful deployment
5. Click **... menu** → **Redeploy**
6. Confirm redeploy

### Rollback Frontend (Vercel)

1. Go to Vercel dashboard
2. Select your project
3. Go to **Deployments** tab
4. Find the previous successful deployment
5. Click **... menu** → **Redeploy**
6. Confirm redeploy

### Database Rollback

If you need to rollback database migrations:

```bash
# Connect to your Supabase or PostgreSQL
psql postgresql://user:password@host:port/database

# Check current schema
\dt  # List tables
\du  # List users

# If needed, restore from backup
# Most platforms keep daily backups
```

---

## Scaling & Performance

### Horizontal Scaling
- **Frontend**: Vercel handles auto-scaling
- **Backend**: Upgrade Render plan for better resources

### Vertical Scaling
- Increase Render plan to Standard/Professional
- Upgrade database resources on Supabase

### Caching Strategy
- Frontend: Vercel CDN automatically caches
- Backend: Redis caching available (optional enhancement)

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters, randomly generated)
- [ ] Database password is strong
- [ ] No secrets in git repository
- [ ] CORS_ORIGIN set to specific frontend domain
- [ ] SSL/TLS enabled (automatic on both platforms)
- [ ] Regular backups enabled on database
- [ ] API rate limiting configured (optional enhancement)
- [ ] Environment variables not logged

---

## Support & Help

### Render Support
- Documentation: https://render.com/docs
- Dashboard: https://dashboard.render.com
- Status: https://status.render.com

### Vercel Support
- Documentation: https://vercel.com/docs
- Dashboard: https://vercel.com/dashboard
- Status: https://www.vercelstatus.com

### Application Support
- GitHub Issues: Report bugs and feature requests
- Email: support@carbondesk.local

---

## Maintenance Schedule

### Weekly
- Check logs for errors
- Verify health check endpoints
- Monitor database usage

### Monthly
- Review performance metrics
- Update dependencies (if needed)
- Test backup/restore procedures

### Quarterly
- Security audit
- Performance optimization review
- Cost analysis

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Build succeeds without warnings
- [ ] Environment variables configured
- [ ] Database migrated successfully
- [ ] CORS settings correct
- [ ] SSL certificates ready
- [ ] Backups enabled
- [ ] Monitoring configured
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

---

**Last Updated**: October 2026
**Version**: 1.0.0
**Status**: Ready for Production
