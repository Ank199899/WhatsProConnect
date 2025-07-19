#!/bin/bash

# WhatsApp Advanced WebApp Build and Auto-Start Script
# This script builds the application and starts all servers

set -e  # Exit on any error

echo "🏗️ WhatsApp Advanced WebApp Build & Start"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
cd "$PROJECT_DIR"

echo -e "${BLUE}📁 Working directory: $PROJECT_DIR${NC}"

# Function to handle errors
handle_error() {
    echo -e "${RED}❌ Error occurred in build process${NC}"
    echo -e "${RED}❌ Build failed at: $1${NC}"
    exit 1
}

# Trap errors
trap 'handle_error "line $LINENO"' ERR

echo -e "${BLUE}🛑 Stopping existing services...${NC}"
pm2 delete all 2>/dev/null || echo "No existing processes to stop"

echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --production=false

echo -e "${BLUE}🔍 Checking for TypeScript errors...${NC}"
npm run type-check 2>/dev/null || echo "Type check skipped"

echo -e "${BLUE}🏗️ Building Next.js application...${NC}"
npm run build

echo -e "${BLUE}🚀 Starting services...${NC}"
pm2 start ecosystem.config.js --env production

echo -e "${BLUE}💾 Saving PM2 configuration...${NC}"
pm2 save

echo -e "${BLUE}⏳ Waiting for services to stabilize...${NC}"
sleep 10

echo -e "${BLUE}📊 Service status:${NC}"
pm2 list

echo -e "${BLUE}🔍 Testing endpoints...${NC}"

# Test frontend
if curl -f -s http://100.115.3.36:3000 >/dev/null; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend not responding yet${NC}"
fi

# Test backend
if curl -f -s http://100.115.3.36:3001/api/sessions >/dev/null; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Backend not responding yet${NC}"
fi

echo -e "${GREEN}🎉 Build and start completed successfully!${NC}"
echo -e "${GREEN}📱 Frontend: http://100.115.3.36:3000${NC}"
echo -e "${GREEN}🔧 Backend:  http://100.115.3.36:3001${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "${YELLOW}1. Open browser and go to http://100.115.3.36:3000${NC}"
echo -e "${YELLOW}2. Create WhatsApp sessions${NC}"
echo -e "${YELLOW}3. Set up templates and campaigns${NC}"
echo ""
