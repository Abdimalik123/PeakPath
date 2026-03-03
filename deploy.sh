#!/bin/bash

# PeakPath Deployment Script — Hetzner VPS
# Usage: ./deploy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}.env file not found! Copy .env.example and fill in your values.${NC}"
    exit 1
fi
source .env

# Validate required env vars
for var in DOMAIN DB_PASSWORD SECRET_KEY; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Missing required env var: ${var}${NC}"
        exit 1
    fi
done

echo -e "${GREEN}Starting PeakPath deployment on Hetzner...${NC}"

# Replace domain placeholder in Nginx config
echo -e "${YELLOW}Configuring Nginx for domain: ${DOMAIN}...${NC}"
sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" nginx/conf.d/default.conf

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker compose build
docker compose up -d

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}Running health check...${NC}"
if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend health check passed!${NC}"
else
    echo -e "${YELLOW}Backend not responding yet. Check logs: docker compose logs backend${NC}"
fi

echo ""
echo -e "${GREEN}=== Deployment complete ===${NC}"
echo -e "${GREEN}App: https://${DOMAIN}${NC}"
echo -e "${GREEN}Health: https://${DOMAIN}/health${NC}"
echo -e "${GREEN}Metrics: https://${DOMAIN}/metrics${NC}"
echo ""
echo -e "${YELLOW}If this is a first deploy, run: ./init-ssl.sh${NC}"
