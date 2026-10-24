# Deployment Guide - Carbon Project Management Platform

## Overview

This guide covers containerized deployment using Docker and Docker Compose for development and production environments.

## Quick Start (Development)

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Start All Services

```bash
# Clone or navigate to project root
cd carbon_project

# Set environment variables
cp .env.example .env
export VITE_MAPBOX_ACCESS_TOKEN=your_token_here

# Build and start services
docker-compose up -d

# Initialize database (first time only)
docker-compose exec backend npm run migrate

# Verify services are running
docker-compose ps
```

### Access Applications

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:5432 (user: cpms_user, password: cpms_password)

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
# Stop running services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove all data (CAREFUL!)
docker-compose down -v
```

## Production Deployment

### Prerequisites

- Docker registry access (Docker Hub, ECR, GCR, etc.)
- Kubernetes cluster or container orchestration platform
- SSL/TLS certificates
- Production-grade database (RDS, Cloud SQL, managed PostgreSQL)
- Object storage for documents (S3, GCS, Azure Blob Storage)

### Building Images for Production

#### Build Backend Image

```bash
cd server

# Build image
docker build -t carbondesk/cpms-backend:latest .

# Tag for registry
docker tag carbondesk/cpms-backend:latest your-registry/cpms-backend:latest

# Push to registry
docker push your-registry/cpms-backend:latest
```

#### Build Frontend Image

```bash
cd frontend

# Build image
docker build -t carbondesk/cpms-frontend:latest .

# Tag for registry
docker tag carbondesk/cpms-frontend:latest your-registry/cpms-frontend:latest

# Push to registry
docker push your-registry/cpms-frontend:latest
```

### Production Environment Variables

Create `.env.production`:

```bash
# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db:5432/carbon_cpms_db
JWT_SECRET=your-secure-32-char-minimum-secret
CORS_ORIGIN=https://yourdomain.com
STORAGE_PROVIDER=s3

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=carbon-cpms-documents
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/cpms-backend:latest
    container_name: cpms-backend-prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
      STORAGE_PROVIDER: s3
      AWS_REGION: ${AWS_REGION}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    ports:
      - "5000:5000"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  frontend:
    image: your-registry/cpms-frontend:latest
    container_name: cpms-frontend-prod
    environment:
      VITE_API_URL: ${VITE_API_URL}
      VITE_MAPBOX_ACCESS_TOKEN: ${VITE_MAPBOX_ACCESS_TOKEN}
    ports:
      - "3000:3000"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Start production deployment:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

### Prerequisites

- kubectl configured
- Kubernetes cluster (1.20+)
- Helm 3.0+ (optional)

### Deployment Files

Create `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpms-backend
  labels:
    app: cpms-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cpms-backend
  template:
    metadata:
      labels:
        app: cpms-backend
    spec:
      containers:
      - name: cpms-backend
        image: your-registry/cpms-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cpms-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: cpms-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

Create `k8s/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpms-frontend
  labels:
    app: cpms-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cpms-frontend
  template:
    metadata:
      labels:
        app: cpms-frontend
    spec:
      containers:
      - name: cpms-frontend
        image: your-registry/cpms-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: VITE_API_URL
          value: "https://api.yourdomain.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

Deploy to Kubernetes:

```bash
# Create secrets
kubectl create secret generic cpms-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=jwt-secret=$JWT_SECRET

# Deploy
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check status
kubectl get deployments
kubectl get pods
```

## Health Checks

Both services provide health check endpoints:

```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

## Monitoring & Logging

### Container Logs

```bash
# View logs
docker logs -f cpms-backend
docker logs -f cpms-frontend
docker logs -f cpms-postgres

# Filter by time
docker logs --since 10m cpms-backend

# Save logs to file
docker logs cpms-backend > backend.log
```

### Kubernetes Logs

```bash
# View pod logs
kubectl logs -f deployment/cpms-backend

# View previous logs (if container crashed)
kubectl logs --previous pod/cpms-backend-xyz

# View logs from all replicas
kubectl logs -l app=cpms-backend -f
```

## Security Best Practices

### 1. Use Environment Variables

Never hardcode secrets:

```bash
# ✅ Good: Use env vars
docker run -e JWT_SECRET=$JWT_SECRET image

# ❌ Bad: Hardcoded in Dockerfile
ENV JWT_SECRET=my-secret
```

### 2. Non-Root User

Both Dockerfiles run as non-root user for security.

### 3. Health Checks

Services include health checks for automatic restart on failure.

### 4. Network Policies

Restrict traffic between services:

```yaml
# Only backend can talk to database
# Only frontend can talk to backend
# Frontend is publicly accessible
```

### 5. SSL/TLS

Use reverse proxy (nginx, traefik) with SSL certificates:

```bash
# Let's Encrypt with Certbot
certbot certonly --standalone -d yourdomain.com
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend to 3 replicas
docker-compose up -d --scale backend=3

# Kubernetes
kubectl scale deployment cpms-backend --replicas=3
```

### Load Balancing

Add nginx reverse proxy for load balancing:

```nginx
upstream backend {
  server backend:5000;
  server backend2:5000;
  server backend3:5000;
}

server {
  location /api/ {
    proxy_pass http://backend;
  }
}
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs cpms-backend

# Verify environment variables
docker inspect cpms-backend | grep Env

# Test manually
docker run -it cpms-backend /bin/sh
```

### Database connection error

```bash
# Verify database is running
docker-compose ps postgres

# Check logs
docker logs cpms-postgres

# Test connection
docker-compose exec backend psql $DATABASE_URL
```

### Performance issues

```bash
# Check resource usage
docker stats

# Check disk space
docker system df

# Clean up unused images/containers
docker system prune -a
```

## Backup & Recovery

### Database Backup

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump \
  -U cpms_user carbon_cpms_db > backup.sql

# Restore
docker-compose exec -T postgres psql \
  -U cpms_user carbon_cpms_db < backup.sql
```

### Volume Backup

```bash
# Backup uploads
docker run --rm -v cpms-uploads:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads.tar.gz -C /data .
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For deployment issues:
1. Check container logs
2. Verify environment variables
3. Check database connectivity
4. Review health check endpoints
5. Consult service documentation in `/docs`
