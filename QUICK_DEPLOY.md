# Quick Deployment Checklist

## 5-Minute Deploy Summary

### Backend to Render

1. **Create Render account**: https://render.com
2. **Connect GitHub repo** to Render dashboard
3. **Create Web Service**:
   - Build: `cd server && npm run build`
   - Start: `cd server && npm start`
4. **Add Environment Variables** (see DEPLOYMENT_GUIDE.md):
   - `DATABASE_URL` (from Supabase)
   - `JWT_SECRET` (generate random)
   - `CORS_ORIGIN` (will update after frontend deploys)
5. **Deploy** - wait ~5 minutes
6. **Save your URL**: `https://carbondesk-api.onrender.com`

### Frontend to Vercel

1. **Create Vercel account**: https://vercel.com
2. **Import Git repository**
3. **Configure**:
   - Framework: Vite
   - Root: `./frontend`
   - Build: `npm run build`
4. **Add Environment Variables**:
   - `VITE_API_BASE_URL=https://carbondesk-api.onrender.com/api`
   - `VITE_MAPBOX_ACCESS_TOKEN=your_token`
5. **Deploy** - wait ~3 minutes
6. **Save your URL**: `https://your-app.vercel.app`

### Update Backend CORS

1. Go to Render dashboard
2. Select `carbondesk-api` service
3. Update `CORS_ORIGIN` to your Vercel URL
4. Save (triggers redeploy)

### Verify Deployment

```bash
# Backend health check
curl https://carbondesk-api.onrender.com/health
# Should return: {"status":"ok"}

# Frontend - open in browser
https://your-app.vercel.app
# Should load without errors
```

---

## Environment Variables Template

### Backend (.env.production)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
DB_HOST=db.PROJECT.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=PASSWORD
DB_SSL=true
JWT_SECRET=GENERATE_RANDOM_32_CHARS
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-app.vercel.app
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://carbondesk-api.onrender.com/api
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ...
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Render logs, verify DATABASE_URL |
| Frontend can't connect to API | Verify VITE_API_BASE_URL and backend CORS_ORIGIN |
| 502 Bad Gateway | Wait 2-3 minutes, Render may be starting |
| Build fails | Check build logs, ensure Node version 18+ |

---

## After Deployment

- [ ] Test login with test account
- [ ] Create a test project
- [ ] Upload a document
- [ ] Check GIS map functionality
- [ ] Run through MRV workflow
- [ ] Verify email notifications (if configured)

---

For detailed instructions, see **DEPLOYMENT_GUIDE.md**
