# Environment Configuration Guide

## Overview

The Carbon Project Management Platform uses environment variables for configuration across development, staging, and production environments.

## Quick Start

### Development Setup

1. **Copy example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with local values:**
   ```bash
   nano .env
   ```

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

### Production Setup

1. **Copy production template:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Fill in production values** (see sections below)

3. **Deploy with production env:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Required Variables

### Core Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | — | Environment: `development`, `production`, `test` |
| `PORT` | Yes | `5000` | Server port |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (32+ chars) |
| `CORS_ORIGIN` | Yes | — | Frontend origin for CORS |
| `STORAGE_PROVIDER` | Yes | `local` | Storage: `local` or `s3` |

### Frontend Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | — | Backend API URL |
| `VITE_MAPBOX_ACCESS_TOKEN` | Yes | — | Mapbox GL token |

## Database Configuration

### PostgreSQL Connection String

Format:
```
postgresql://[user[:password]@][host][:port][/database]
```

#### Local Development
```bash
DATABASE_URL=postgresql://cpms_user:cpms_password@localhost:5432/carbon_cpms_db
```

#### Docker Compose
```bash
DATABASE_URL=postgresql://cpms_user:cpms_password@postgres:5432/carbon_cpms_db
```

#### AWS RDS
```bash
DATABASE_URL=postgresql://user:password@cpms.xxxxx.us-east-1.rds.amazonaws.com:5432/carbon_db
```

#### Google Cloud SQL
```bash
DATABASE_URL=postgresql://user:password@35.x.x.x:5432/carbon_db
```

#### Azure Database for PostgreSQL
```bash
DATABASE_URL=postgresql://user@server:password@server.postgres.database.azure.com:5432/carbon_db
```

#### Supabase
```bash
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Authentication

### JWT Secret

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Unique per environment

**Generate secure secret:**
```bash
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Development (NOT secure, for dev only):**
```bash
JWT_SECRET=dev-secret-key-min-32-characters-long-change-for-production
```

**Production (MUST be secure):**
```bash
JWT_SECRET=your-secure-random-jwt-secret-minimum-32-characters-long
```

## CORS Configuration

### Single Origin (Recommended)

```bash
CORS_ORIGIN=https://yourdomain.com
```

### Multiple Origins

```bash
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com
```

### Wildcard (Development Only)

```bash
CORS_ORIGIN=http://localhost:*
```

## Storage Configuration

### Local Storage (Development)

```bash
STORAGE_PROVIDER=local
# Files stored in ./uploads directory
```

### S3 Storage (Production)

```bash
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=carbon-cpms-documents-prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_URL_EXPIRY=3600  # 1 hour
```

### S3 Setup

1. **Create IAM User:**
   ```bash
   # Create user with S3 access only
   aws iam create-user --user-name cpms-s3-user
   ```

2. **Attach S3 Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::carbon-cpms-documents-prod",
           "arn:aws:s3:::carbon-cpms-documents-prod/*"
         ]
       }
     ]
   }
   ```

3. **Create Access Key:**
   ```bash
   aws iam create-access-key --user-name cpms-s3-user
   ```

4. **Configure environment variables with Access Key ID and Secret**

## GIS Configuration

### Mapbox Token

1. **Get token from Mapbox:**
   - Visit https://account.mapbox.com/
   - Create new token with public scope
   - Copy token

2. **Set environment variable:**
   ```bash
   VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXIiLCJhIjoiY2xjMjA0YTU1MDA0OTN3cDJsdHRvYTZuaiJ9.EXAMPLE
   ```

### PostGIS (Optional)

Enable for advanced geographic operations:

```bash
USE_POSTGIS=true

# Requires PostgreSQL with PostGIS extension
# See docs/POSTGIS_SETUP.md for installation
```

## Optional Features

### Logging Level

```bash
# debug: Verbose logging (development)
LOG_LEVEL=debug

# info: Standard logging (production)
LOG_LEVEL=info

# warn: Only warnings and errors
LOG_LEVEL=warn

# error: Only errors
LOG_LEVEL=error
```

### Redis (Multi-Server Caching)

For distributed deployments:

```bash
REDIS_URL=redis://:password@redis-server.example.com:6379
```

### Error Tracking (Sentry)

```bash
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/123456
```

### APM Monitoring (New Relic)

```bash
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

### APM Monitoring (Datadog)

```bash
DD_API_KEY=your-datadog-api-key
```

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Environment Variables for All Secrets

```bash
# ❌ Bad: Hardcoded in code
const JWT_SECRET = "my-secret";

# ✅ Good: From environment
const JWT_SECRET = process.env.JWT_SECRET;
```

### 3. Use Secrets Manager in Production

**AWS Secrets Manager:**
```bash
# Fetch at startup
aws secretsmanager get-secret-value --secret-id cpms-production | jq
```

**HashiCorp Vault:**
```bash
# Fetch at startup
vault kv get secret/cpms/production
```

**Google Secret Manager:**
```bash
# Fetch at startup
gcloud secrets versions access latest --secret="cpms-production"
```

### 4. Rotate Secrets Regularly

```bash
# Monthly rotation recommended
1. Generate new secret
2. Update in secrets manager
3. Redeploy application
4. Monitor for errors
5. Archive old secret
```

### 5. Validate on Startup

The application validates all required environment variables on startup and exits if missing:

```bash
# Missing JWT_SECRET will cause startup to fail
# Check logs: [Boot] Failed to start server: ...
```

## Environment-Specific Configs

### Development

```bash
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
STORAGE_PROVIDER=local
JWT_SECRET=dev-secret (NOT secure)
LOG_LEVEL=debug
```

### Staging

```bash
NODE_ENV=production
CORS_ORIGIN=https://staging.yourdomain.com
STORAGE_PROVIDER=s3
JWT_SECRET=secure-random-secret
LOG_LEVEL=info
USE_POSTGIS=false
```

### Production

```bash
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
STORAGE_PROVIDER=s3
JWT_SECRET=secure-random-secret
LOG_LEVEL=info
USE_POSTGIS=false
DATABASE_URL=production-db-url (managed database)
```

## Validation on Startup

The application validates all required variables when it starts:

```bash
# Output
[Boot] Environment Configuration Loaded:
  📊 NODE_ENV: production
  🗄️  Database: postgresql://user:***@host:5432/db
  📁 Storage Provider: s3
     S3 Bucket: carbon-cpms-documents
     AWS Region: us-east-1
  🌐 CORS Origin: https://yourdomain.com
  🗺️  Mapbox Token: pk.eyJ1...E.EXAMPLE
```

If any required variable is missing:

```bash
[Boot] Failed to start server: HostNotFoundError
  1. DATABASE_URL is required
  2. JWT_SECRET must be at least 32 characters
  3. VITE_MAPBOX_ACCESS_TOKEN is required
```

## Troubleshooting

### "DATABASE_URL is required"

```bash
# Check if variable is set
echo $DATABASE_URL

# Set it
export DATABASE_URL=postgresql://user:pass@host/db

# Or in .env file
DATABASE_URL=postgresql://user:pass@host/db
```

### "JWT_SECRET must be at least 32 characters"

```bash
# Generate secure secret
openssl rand -base64 32

# Update .env
JWT_SECRET=generated-secret-here
```

### "CORS_ORIGIN does not match"

```bash
# If frontend is at http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# If frontend is at https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### "S3 authentication failed"

```bash
# Verify credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://your-bucket

# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_S3_BUCKET
```

## Deployment Checklist

- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all required variables
- [ ] Generate secure `JWT_SECRET` (32+ chars)
- [ ] Verify `DATABASE_URL` is production database
- [ ] Verify `CORS_ORIGIN` matches production domain
- [ ] Set `STORAGE_PROVIDER` to `s3` (or equivalent)
- [ ] Set AWS S3 credentials
- [ ] Set Mapbox token for GIS
- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=info` (or warn)
- [ ] Verify all vars with `npm run validate-env`
- [ ] Test application startup
- [ ] Monitor logs for 24 hours
- [ ] Set up log rotation and retention
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Enable performance monitoring (New Relic, etc.)

## References

- [Node.js Environment Variables](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [12 Factor App - Config](https://12factor.net/config)
- [Environment Variables Best Practices](https://www.12factor.net/config)
- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
