# Production Deployment Setup Guide

## 🚀 What's Configured

### ✅ Completed Integrations
- **Sentry**: Error tracking and performance monitoring
- **Redis**: Rate limiting, caching, and session storage
- **Custom Email**: Outlook SMTP with uptrakk.com domain
- **Prometheus**: Metrics endpoint at `/metrics`
- **Structured Logging**: JSON logs with request IDs

---

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install & Start Redis

#### **Option A: Local Development (Ubuntu/WSL)**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

#### **Option B: Local Development (macOS)**
```bash
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

#### **Option C: Production (Cloud)**
- **Railway/Render**: Add Redis add-on ($5-10/mo)
- **Redis Cloud**: Free tier available (30MB)
- **AWS ElastiCache**: Production-grade managed Redis

Update `.env` with your Redis URL:
```env
REDIS_URL=redis://user:password@host:port/0
```

### 3. Get Your Sentry DSN

1. Log into your Sentry account
2. Go to **Settings** → **Projects** → **Uptrakk** (or create new project)
3. Copy the **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)
4. Add to `.env`:

```env
SENTRY_DSN=https://your-sentry-dsn-here
ENVIRONMENT=production  # or 'staging', 'development'
```

### 4. Run Database Migrations

Apply the security hardening changes (refresh tokens, email verification, etc.):

```bash
flask db migrate -m "Apply security hardening and new features"
flask db upgrade
```

### 5. Test Your Setup

```bash
# Start the server
python app.py
```

Visit `http://localhost:5000/health` - you should see:
```json
{
  "status": "ok",
  "service": "Uptrakk API",
  "database": "connected",
  "redis": "connected",
  "sentry": "enabled"
}
```

### 6. Test Sentry Integration

Trigger a test error:
```python
# Add this test endpoint temporarily
@app.route('/test-sentry')
def test_sentry():
    1/0  # This will trigger a Sentry error
```

Check your Sentry dashboard - the error should appear within seconds.

---

## 🔧 Configuration Reference

### Email Configuration (Already Set)
- **Provider**: Outlook SMTP
- **From Address**: hello@uptrakk.com
- **SMTP Settings**: Configured in `.env`

### Redis Usage
Your app now uses Redis for:
1. **Rate Limiting**: 200 requests/minute per IP
2. **Caching**: Dashboard endpoint cached for 2 minutes
3. **Session Storage**: Ready for future implementation

### Caching Examples

Add caching to any expensive endpoint:

```python
from database import cache

# Cache for 5 minutes
@cache.cached(timeout=300, key_prefix='user_stats')
def get_user_stats():
    # expensive query
    pass

# Cache per user
@cache.cached(timeout=120, key_prefix=lambda: f'profile_{g.user["id"]}')
def get_profile():
    pass

# Invalidate cache manually
cache.delete('user_stats')
cache.clear()  # Clear all cache
```

### Sentry Features

**Automatic Tracking:**
- All unhandled exceptions
- SQL query performance (with SqlalchemyIntegration)
- HTTP request performance (10% sampled)
- Python profiling (10% sampled)

**Manual Error Tracking:**
```python
import sentry_sdk

# Capture custom exception
try:
    risky_operation()
except Exception as e:
    sentry_sdk.capture_exception(e)

# Add context
with sentry_sdk.push_scope() as scope:
    scope.set_tag("payment_method", "stripe")
    scope.set_user({"id": user_id, "email": user_email})
    sentry_sdk.capture_message("Payment failed", level="error")
```

---

## 📊 Monitoring Setup (Next Step)

### Connect Grafana to Prometheus

Your `/metrics` endpoint exposes Prometheus metrics. To visualize:

1. **Install Prometheus** to scrape `/metrics`
2. **Connect Grafana** to Prometheus as data source
3. **Import dashboards** for:
   - Request rate & latency
   - Error rates
   - Database pool status
   - Redis hit/miss rates

Quick Docker setup:
```bash
# Create prometheus.yml
cat > prometheus.yml <<EOF
scrape_configs:
  - job_name: 'uptrakk'
    scrape_interval: 15s
    static_configs:
      - targets: ['host.docker.internal:5000']  # For local dev
    metrics_path: '/metrics'
EOF

# Start Prometheus & Grafana
docker run -d -p 9090:9090 -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
docker run -d -p 3001:3000 grafana/grafana
```

Visit Grafana at `http://localhost:3001` (admin/admin), add Prometheus data source: `http://host.docker.internal:9090`

---

## 🔐 Security Checklist

- [x] Refresh tokens with rotation
- [x] Email verification flow
- [x] Password reset with token hashing
- [x] Rate limiting with Redis
- [x] XSS sanitization on all inputs
- [x] Database indexes for performance
- [x] Structured logging with request IDs
- [x] Error tracking with Sentry
- [ ] HTTPS only (in production)
- [ ] Environment secrets in vault (not .env)
- [ ] CORS restricted to production domains
- [ ] Database backups configured

---

## 🚨 Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log  # Linux
tail -f /usr/local/var/log/redis.log  # macOS
```

### Email Not Sending
```bash
# Test SMTP connection
python -c "
import smtplib
server = smtplib.SMTP('smtp-mail.outlook.com', 587)
server.starttls()
server.login('admin@uptrakk.com', 'Uptrakk!2025')
print('✅ Email auth successful')
"
```

### Sentry Not Receiving Errors
- Verify `SENTRY_DSN` is set in `.env`
- Check Sentry project settings allow your environment
- Test with `/test-sentry` endpoint

---

## 📈 Next Steps

1. **OAuth Integration**: Google & Apple Sign-In
2. **Stripe Billing**: Subscription management
3. **Push Notifications**: APNs (iOS) & FCM (Android)
4. **GDPR Compliance**: Data export/deletion endpoints
5. **Background Jobs**: Celery with Redis for async tasks
6. **CI/CD Pipeline**: Automated tests + deployment
