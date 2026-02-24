#!/bin/bash

# PeakPath Deployment Script
# This script builds and pushes Docker images to ECR, then deploys to ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="peakpath"
AWS_REGION="eu-north-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECR Repository URLs (will be set by Terraform outputs)
BACKEND_ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend"
FRONTEND_ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend"

echo -e "${GREEN}Starting PeakPath deployment...${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command_exists aws; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists terraform; then
    echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed!${NC}"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push backend image
echo -e "${YELLOW}Building backend Docker image...${NC}"
cd backend
docker build -t ${PROJECT_NAME}-backend .
docker tag ${PROJECT_NAME}-backend:latest ${BACKEND_ECR_URL}:latest

echo -e "${YELLOW}Pushing backend image to ECR...${NC}"
docker push ${BACKEND_ECR_URL}:latest

# Build and push frontend image
echo -e "${YELLOW}Building frontend Docker image...${NC}"
cd ../frontend
docker build -t ${PROJECT_NAME}-frontend .
docker tag ${PROJECT_NAME}-frontend:latest ${FRONTEND_ECR_URL}:latest

echo -e "${YELLOW}Pushing frontend image to ECR...${NC}"
docker push ${FRONTEND_ECR_URL}:latest

# Update ECS services
echo -e "${YELLOW}Updating ECS services...${NC}"
cd ../terraform

# Get cluster and service names from Terraform outputs
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
BACKEND_SERVICE=$(terraform output -raw backend_service_name)
FRONTEND_SERVICE=$(terraform output -raw frontend_service_name)

# Force new deployment
aws ecs update-service --cluster ${CLUSTER_NAME} --service ${BACKEND_SERVICE} --force-new-deployment --region ${AWS_REGION}
aws ecs update-service --cluster ${CLUSTER_NAME} --service ${FRONTEND_SERVICE} --force-new-deployment --region ${AWS_REGION}

# Wait for services to stabilize
echo -e "${YELLOW}Waiting for services to stabilize...${NC}"
aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${BACKEND_SERVICE} --region ${AWS_REGION}
aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${FRONTEND_SERVICE} --region ${AWS_REGION}

# Get application URL
APP_URL=$(terraform output -raw application_url)

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Application URL: ${APP_URL}${NC}"
echo -e "${GREEN}Health check: ${APP_URL}/health${NC}"

# Optional: Run health check
echo -e "${YELLOW}Running health check...${NC}"
sleep 30  # Wait for services to be ready
if curl -f "${APP_URL}/health" >/dev/null 2>&1; then
    echo -e "${GREEN}Health check passed!${NC}"
else
    echo -e "${YELLOW}Health check failed. The application might still be starting up.${NC}"
    echo -e "${YELLOW}Please check the ECS service logs in the AWS console.${NC}"
fi
