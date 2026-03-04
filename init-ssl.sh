#!/bin/bash

# PeakPath — First-time SSL setup with Let's Encrypt
# Run this ONCE on your Hetzner VPS after the first deploy.
# Prerequisites: domain DNS A record pointing to this server's IP.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -f .env ]; then
    echo -e "${RED}.env file not found!${NC}"
    exit 1
fi
source .env

if [ -z "${DOMAIN}" ] || [ -z "${CERT_EMAIL}" ]; then
    echo -e "${RED}DOMAIN and CERT_EMAIL must be set in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Starting Nginx in HTTP-only mode for ACME challenge...${NC}"

# Temporarily replace the SSL config with HTTP-only so Nginx can start without certs
cat > nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'PeakPath — waiting for SSL setup';
        add_header Content-Type text/plain;
    }
}
EOF

docker compose up -d nginx

echo -e "${YELLOW}Step 2: Requesting SSL certificate from Let's Encrypt...${NC}"
docker compose run --rm --entrypoint certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${CERT_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}"

echo -e "${YELLOW}Step 3: Restoring full Nginx config with SSL...${NC}"

# Restore the production config with the real domain
cat > nginx/conf.d/default.conf <<EOF
# HTTP — redirect to HTTPS, except ACME challenge for Certbot
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /usr/share/nginx/html;
    index index.html;

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy backend health check
    location /health {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Proxy Prometheus metrics
    location /metrics {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # React SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo -e "${YELLOW}Step 4: Restarting all services...${NC}"
docker compose down
docker compose up -d

echo ""
echo -e "${GREEN}=== SSL setup complete ===${NC}"
echo -e "${GREEN}https://${DOMAIN} is now live with Let's Encrypt!${NC}"
echo -e "${GREEN}Certificates will auto-renew via the certbot container.${NC}"
