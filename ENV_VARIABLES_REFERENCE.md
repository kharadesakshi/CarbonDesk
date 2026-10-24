# Environment Variables Reference

Complete reference for all environment variables used in both backend and frontend.

## Backend Variables

### Required Variables

#### Application Config
| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | `production` | Environment (development, production, test) |
| `PORT` | number | `3000` | Port for API server |
| `LOG_LEVEL` | string | `info` | Logging level (debug, info, warn, error) |

#### Database Config
| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | string | `postgresql://user:pass@host:5432/db` | Full database connection string |
| `DB_HOST` | string | `db.supabase.co` | Database host |
| `DB_PORT` | number | `5432` | Database port |
| `DB_NAME` | string | `postgres` | Database name |
| `DB_USER` | string | `postgres` | Database user |
| `DB_PASSWORD` | string | `strong_password` | Database password |
| `DB_SSL` | boolean | `true` | Use SSL connection |

#### Authentication Config
| Variable | Type | Min Length | Description |
|----------|------|-----------|-------------|
| `JWT_SECRET` | string | 32 chars | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | string | - | JWT expiration time (e.g., `7d`, `24h`) |

#### Storage Config
| Variable | Type | Options | Description |
|----------|------|---------|-------------|
| `STORAGE_PROVIDER` | string | `local`, `s3` | Storage backend |
| `LOCAL_STORAGE_PATH` | string | Path | Directory for local file storage |
| `MAX_FILE_SIZE` | number | Bytes | Max upload file size (default: 10MB) |
| `ALLOWED_MIME_TYPES` | string | Comma-separated | Allowed file MIME types |

#### CORS Config
| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `CORS_ORIGIN` | string | `https://app.vercel.app` | Allowed origin for CORS |

### Optional Variables

#### AWS S3 Configuration (if using S3 storage)
| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | string | `AKIA...` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | string | `aws_secret...` | AWS secret key |
| `AWS_REGION` | string | `us-east-1` | AWS region |
| `AWS_S3_BUCKET` | string | `carbon-bucket` | S3 bucket name |

#### Email Configuration (future enhancement)
| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `SMTP_HOST` | string | `smtp.gmail.com` | Email server host |
| `SMTP_PORT` | number | `587` | Email server port |
| `SMTP_USER` | string | `email@gmail.com` | Email account username |
| `SMTP_PASSWORD` | string | `password` | Email account password |
| `FROM_EMAIL` | string | `noreply@carbon.com` | Sender email address |

---

## Frontend Variables

### Required Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `VITE_API_BASE_URL` | string | `https://api.onrender.com/api` | Backend API base URL |
| `VITE_MAPBOX_ACCESS_TOKEN` | string | `pk.eyJ1IjoiXXX...` | Mapbox API token |

### Optional Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `VITE_LOG_LEVEL` | string | `info` | Frontend logging level |
| `VITE_API_TIMEOUT` | number | `30000` | API request timeout (ms) |

---

## Environment Files

### Backend

#### Development (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carbon_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carbon_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=dev_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

#### Production (.env.production)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@db.PROJECT.supabase.co:5432/postgres
DB_HOST=db.PROJECT.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=STRONG_PASSWORD
DB_SSL=true
JWT_SECRET=GENERATE_RANDOM_32_CHAR_SECRET_HERE
JWT_EXPIRES_IN=7d
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=/var/data/uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
CORS_ORIGIN=https://your-app.vercel.app
LOG_LEVEL=info
```

### Frontend

#### Development (.env)
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiWU9VUl9VU0VSTkFNRSIsImEiOiJZT1VSX1RPS0VOIn0.EXAMPLE
```

#### Production (.env.production)
```
VITE_API_BASE_URL=https://carbondesk-api.onrender.com/api
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiWU9VUl9VU0VSTkFNRSIsImEiOiJZT1VSX1RPS0VOIn0.EXAMPLE
```

---

## How to Generate Secure Values

### JWT_SECRET
Generate a cryptographically secure random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

# Using OpenSSL
openssl rand -hex 32

# Output example:
# f4c3e5b2a1d8f7g6h9i2j3k4l5m6n7o8p9q0r1s2
```

### Database Password
Generate a strong database password:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"

# Output example:
# aB1cD2eF3gH4iJ5kL6=

# Using OpenSSL
openssl rand -base64 24

# Output example:
# xY9zW8vU7tS6rQ5pO4nM3lK2jI=
```

---

## Validation Rules

### Database Connection String
- Format: `postgresql://user:password@host:port/database`
- Must be a valid PostgreSQL connection string
- SSL should be true for remote connections

### JWT Secret
- Minimum 32 characters
- Should contain mix of alphanumeric and special characters
- Should be unique per environment
- Never commit to version control

### CORS Origin
- Must include protocol (http:// or https://)
- Must match exactly with frontend domain
- Use full domain for production
- For development: `http://localhost:5173`
- For production: `https://app.yourdomain.com`

### File Size
- Measured in bytes
- 10485760 = 10 MB
- 5242880 = 5 MB
- 104857600 = 100 MB

### MIME Types
- Comma-separated list
- Common types:
  - PDF: `application/pdf`
  - Images: `image/jpeg`, `image/png`, `image/gif`
  - Word: `application/msword`
  - Excel: `application/vnd.ms-excel`

---

## Environment Variable Sources

### For Development
- `.env` file in project root
- Loaded automatically by dotenv

### For Render
- Environment section in Render dashboard
- Set for each service independently
- Can be marked as sensitive (hidden in logs)

### For Vercel
- Environment Variables section in project settings
- Can scope to specific deployment type (production, preview, development)
- Automatically injected at build time

---

## Debugging Environment Variables

### Backend
Check what environment variables are loaded:

```javascript
// In server.ts or app.ts
const envConfig = getEnvConfig();
console.log('Environment Config:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  // Don't log sensitive values like passwords!
});
```

### Frontend
Check frontend environment:

```javascript
// In main.tsx or any component
console.log('Frontend Config:', {
  API_BASE: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});
```

---

## Common Mistakes

❌ **Don't**:
- Commit `.env` files to git
- Use weak JWT secrets
- Share database passwords
- Use HTTP for production CORS origin
- Hardcode API URLs in code

✅ **Do**:
- Use `.env.example` as template
- Generate strong random secrets
- Store sensitive values in deployment platform
- Use HTTPS for all production endpoints
- Use environment variables for all configuration

---

## References

- [Node.js dotenv](https://github.com/motdotla/dotenv)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [JWT.io](https://jwt.io/)
- [Mapbox Access Tokens](https://docs.mapbox.com/api/accounts/tokens/)

---

**Last Updated**: October 2026
**Version**: 1.0.0
