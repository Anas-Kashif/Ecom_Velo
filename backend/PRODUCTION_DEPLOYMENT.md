# Production Deployment Guide

## Overview
This guide covers deploying the e-commerce backend to production with HTTPS, monitoring, and CI/CD.

## Table of Contents
1. [HTTPS Configuration](#https-configuration)
2. [Production Monitoring](#production-monitoring)
3. [Environment Setup](#environment-setup)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Health Checks](#health-checks)
6. [Security Best Practices](#security-best-practices)

---

## HTTPS Configuration

### Option 1: Let's Encrypt (Recommended for Production)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificate location
# Cert: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# Key: /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Auto-renewal (automatic via systemd)
sudo systemctl enable certbot.timer
```

### Option 2: Self-Signed Certificate (Development Only)

```bash
# Generate self-signed certificate
npm run ssl:generate

# This creates certificates in ./certs/ directory
# Cert: ./certs/cert.pem
# Key: ./certs/key.pem
```

### Option 3: Purchased SSL Certificate

1. Purchase SSL certificate from providers like Comodo, DigiCert, etc.
2. Copy certificate files to server
3. Update paths in environment variables

---

## Production Monitoring

### Health Check Endpoints

**Basic Health Check** (public)
```
GET /health
```

Returns:
- Server status (healthy, degraded, unhealthy)
- Database connection status
- CPU and memory usage
- Request metrics
- Uptime

**Detailed Monitoring** (admin)
```
GET /api/monitoring/stats
```

Returns:
- Performance statistics (last 5 minutes)
- Error metrics
- System health
- Request patterns

---

## Environment Setup

### 1. Create Production Environment File

```bash
cp .env.production.example .env.production
```

### 2. Configure Environment Variables

```bash
# Edit .env.production with your values
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
DATABASE_URL=postgresql://user:password@host:5432/ecom_production
JWT_SECRET=your-secure-random-key
```

### 3. Install Production Dependencies

```bash
npm install --production
npm run build
```

---

## SSL Certificate Setup

### Configure in .env.production

```bash
# HTTPS Settings
HTTPS_ENABLED=true
HTTPS_PORT=443        # Standard HTTPS port
HTTP_PORT=80          # For HTTP to HTTPS redirect
HTTPS_REDIRECT_HTTP=true

# SSL Certificate Paths
SSL_CERT_PATH=/path/to/your/certificate.crt
SSL_KEY_PATH=/path/to/your/private.key
```

### Verify Certificate

```bash
# Check certificate expiration
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL configuration
curl -I https://yourdomain.com

# Verify certificate chain
openssl s_client -connect yourdomain.com:443
```

---

## Running in Production

### With PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name "ecom-backend" --env production

# Monitor
pm2 monit

# View logs
pm2 logs ecom-backend

# Enable auto-restart on reboot
pm2 startup
pm2 save
```

### With Systemd

Create `/etc/systemd/system/ecom-backend.service`:

```ini
[Unit]
Description=E-commerce Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/www-data/ecom-backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/ecom-backend.log
StandardError=append:/var/log/ecom-backend-error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ecom-backend
sudo systemctl start ecom-backend
sudo systemctl status ecom-backend

# View logs
sudo journalctl -u ecom-backend -f
```

### With Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist
COPY .env.production ./

EXPOSE 443 80

CMD ["node", "dist/server.js"]
```

```bash
# Build and run
docker build -t ecom-backend:latest .
docker run -d \
  --name ecom-backend \
  -e HTTPS_ENABLED=true \
  -e SSL_CERT_PATH=/etc/ssl/certs/cert.pem \
  -e SSL_KEY_PATH=/etc/ssl/private/key.pem \
  -v /etc/ssl/certs:/etc/ssl/certs:ro \
  -v /etc/ssl/private:/etc/ssl/private:ro \
  -p 443:443 \
  -p 80:80 \
  ecom-backend:latest
```

---

## Health Checks

### Manual Health Check

```bash
curl https://yourdomain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-26T10:30:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": true,
    "memory": true,
    "disk": true,
    "responseTime": true
  },
  "metrics": {
    "memoryUsage": 45,
    "cpuUsage": 12,
    "requestCount": 1250,
    "errorCount": 3,
    "averageResponseTime": 125
  }
}
```

### Automated Health Checks

Set up monitoring services to periodically check:
- `/health` - Basic health
- `/api/monitoring/stats` - Detailed metrics

---

## Security Best Practices

### 1. HTTPS/TLS
- ✅ Always use HTTPS in production
- ✅ Use strong cipher suites
- ✅ Enable HSTS (automatically configured)
- ✅ Redirect HTTP to HTTPS

### 2. Security Headers (Auto-enabled)
- `Strict-Transport-Security` - Force HTTPS
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection` - Enable XSS filter
- `Content-Security-Policy` - Prevent script injection
- `Referrer-Policy` - Control referrer information
- `Permissions-Policy` - Restrict browser features

### 3. Authentication & Authorization
- ✅ Use JWT tokens with > 24hr expiration
- ✅ Implement role-based access control (RBAC)
- ✅ Hash passwords with bcryptjs
- ✅ Enforce strong password policies

### 4. Database Security
- ✅ Use environment variables for credentials
- ✅ Enable database backups
- ✅ Use connection pooling
- ✅ Restrict database access to application server

### 5. API Security
- ✅ Rate limiting on critical endpoints
- ✅ Input validation and sanitization
- ✅ Error messages don't expose sensitive info
- ✅ CORS properly configured

### 6. Monitoring & Logging
- ✅ Monitor CPU and memory usage
- ✅ Track error rates and response times
- ✅ Alert on anomalies
- ✅ Centralized logging

### 7. Backups & Disaster Recovery
- ✅ Daily database backups
- ✅ Test restore procedures
- ✅ Document recovery procedures
- ✅ Multi-region backup strategy

---

## Troubleshooting

### Certificate Not Found
```bash
# Check certificate files exist and are readable
ls -la /etc/ssl/certs/
ls -la /etc/ssl/private/

# Fix permissions
sudo chmod 644 /etc/ssl/certs/cert.pem
sudo chmod 600 /etc/ssl/private/key.pem
```

### Connection Refused on HTTPS Port
```bash
# If port 443 requires sudo, use higher port
HTTPS_PORT=8443

# Or use sudo for port 443
sudo node dist/server.js
```

### SSL Certificate Validation Errors
```bash
# Verify certificate chain
openssl verify -CAfile chain.pem cert.pem

# Test with curl
curl -vI --cacert ca-bundle.crt https://yourdomain.com
```

---

## Deployment Checklist

- [ ] SSL certificate obtained and installed
- [ ] .env.production configured correctly
- [ ] Database migrated and seeded
- [ ] Build successful: `npm run build`
- [ ] Health check passing
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Backups scheduled
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Support

For issues or questions, refer to:
- Backend README: [backend/README.md](../README.md)
- Environment Variables: [.env.production.example](.env.production.example)
- Health Monitoring: `GET /api/monitoring/stats`
