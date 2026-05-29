# Deployment Runbook — trade.aiorkesta.com

## Overview

trade.aiorkesta.com is deployed as a containerized application with nginx reverse proxy. The infrastructure is designed for reliability and security given the real-money trading risk.

## Architecture

```
Internet → nginx (SSL termination, rate limiting) → Node.js app (port 3000)
```

## Prerequisites

- Docker & Docker Compose installed on the deployment target
- SSL certificates for trade.aiorkesta.com in `deploy/certs/`
- Environment variables configured (see Environment section)

## Environment Variables

Required environment variables (store in `.env` or secrets manager):

```bash
NODE_ENV=production
ETORO_API_URL=https://api-portal.etoro.com
# Add others as the app is built
```

## Deployment Methods

### Method 1: Docker Compose (Recommended for initial deployment)

```bash
# On the deployment server
git clone https://github.com/jonathan-ruiz/trade-aiorkesta.git
cd trade-aiorkesta

# Place SSL certificates
mkdir -p deploy/certs
# Copy fullchain.pem and privkey.pem to deploy/certs/

# Build and start
docker-compose up -d --build

# Verify
docker-compose ps
docker-compose logs -f web
curl https://trade.aiorkesta.com/api/health
```

### Method 2: Manual Docker Build

```bash
# Build image
docker build -t trade-aiorkesta:latest .

# Run container
docker run -d \
  --name trade-aiorkesta \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  trade-aiorkesta:latest
```

### Method 3: CI/CD Automated Deployment (Planned)

GitHub Actions workflow will:
1. Build and test on PR
2. Build Docker image on main branch merge
3. Push to container registry
4. Deploy to production server via SSH

## Health Checks

### Application Health

```bash
curl https://trade.aiorkesta.com/api/health
```

Expected response: `200 OK`

### Container Health

```bash
docker-compose ps
# web container should show "Up" and "healthy"
```

### Nginx Health

```bash
docker-compose logs nginx
# Check for errors
```

## Monitoring

### Log Access

```bash
# Application logs
docker-compose logs -f web

# Nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

### Metrics to Monitor

- Response times (nginx access log)
- Error rates (nginx error log, app logs)
- Container resource usage: `docker stats`
- SSL certificate expiry

## Common Issues

### Issue: Container won't start

**Symptom:** `docker-compose ps` shows container as "Exited"

**Debug:**
```bash
docker-compose logs web
# Check for startup errors
```

**Common causes:**
- Missing environment variables
- Port 3000 already in use
- Build failures

**Fix:**
- Check `.env` file
- `lsof -i :3000` to find conflicting process
- Rebuild: `docker-compose up -d --build`

### Issue: SSL certificate errors

**Symptom:** Browser shows "Certificate invalid"

**Debug:**
```bash
openssl x509 -in deploy/certs/fullchain.pem -text -noout
# Check expiry, domain name
```

**Fix:**
- Renew certificate (use certbot or your CA)
- Restart nginx: `docker-compose restart nginx`

### Issue: High memory usage

**Symptom:** Container OOM kills

**Debug:**
```bash
docker stats
```

**Fix:**
- Add memory limits to docker-compose.yml:
  ```yaml
  services:
    web:
      mem_limit: 1g
      mem_reservation: 512m
  ```
- Investigate memory leaks in app code

### Issue: Rate limiting too aggressive

**Symptom:** Legitimate requests getting 429 errors

**Fix:**
- Adjust `rate=10r/s` in `deploy/nginx.conf`
- Increase `burst=20` for API endpoints
- Reload nginx: `docker-compose exec nginx nginx -s reload`

## Rollback Procedure

### Rollback to previous image

```bash
# List available images
docker images trade-aiorkesta

# Stop current
docker-compose down

# Edit docker-compose.yml to use specific tag
# image: trade-aiorkesta:previous-tag

# Start
docker-compose up -d
```

### Rollback via git

```bash
# Find last known good commit
git log --oneline

# Checkout
git checkout <commit-hash>

# Rebuild and deploy
docker-compose up -d --build
```

## Security Checklist

- [ ] SSL certificates valid and auto-renewal configured
- [ ] Environment variables stored securely (not in git)
- [ ] Rate limiting configured on API endpoints
- [ ] Security headers enabled in nginx
- [ ] Container running as non-root user (trader:1001)
- [ ] Regular security updates: `docker-compose pull && docker-compose up -d`
- [ ] Firewall rules: only 80/443 exposed to internet
- [ ] Audit logs monitoring enabled

## Scaling Considerations

When traffic increases:

1. **Horizontal scaling:** Run multiple web containers behind nginx load balancer
2. **Database:** Add dedicated database service (Postgres/MongoDB)
3. **Redis:** Add for session storage and caching
4. **CDN:** Use Cloudflare or similar for static assets

## Contact

Issues or questions? Tag @morgan-devops-engineer in #general or create an issue.
