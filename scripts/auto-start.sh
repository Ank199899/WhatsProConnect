#!/bin/bash

# WhatsApp Advanced WebApp Auto-Start Script
# This script automatically starts all servers after build/restart

set -e  # Exit on any error

echo "🚀 WhatsApp Advanced WebApp Auto-Start Script"
echo "================================================"

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

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service on port $port...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}✅ $service is running on port $port${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts - waiting...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service failed to start on port $port after $max_attempts attempts${NC}"
    return 1
}

# Function to check PM2 process status
check_pm2_process() {
    local process_name=$1
    if pm2 describe "$process_name" >/dev/null 2>&1; then
        local status=$(pm2 describe "$process_name" | grep "status" | head -1 | awk '{print $4}')
        if [ "$status" = "online" ]; then
            return 0  # Process is online
        fi
    fi
    return 1  # Process is not online
}

echo -e "${BLUE}🔍 Checking current PM2 processes...${NC}"
pm2 list

echo -e "${BLUE}🛑 Stopping existing processes...${NC}"
pm2 delete all 2>/dev/null || echo "No existing processes to stop"

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --production

echo -e "${BLUE}🏗️ Building application...${NC}"
npm run build

echo -e "${BLUE}🚀 Starting services with PM2...${NC}"
pm2 start ecosystem.config.js --env production

echo -e "${BLUE}💾 Saving PM2 configuration...${NC}"
pm2 save

echo -e "${BLUE}🔧 Setting up PM2 startup...${NC}"
pm2 startup systemd -u admin1 --hp /home/admin1 2>/dev/null || echo "PM2 startup already configured"

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 5

# Check if services are running
echo -e "${BLUE}🔍 Verifying services...${NC}"

if check_pm2_process "whatsapp-nextjs"; then
    echo -e "${GREEN}✅ Frontend (Next.js) is running${NC}"
else
    echo -e "${RED}❌ Frontend (Next.js) failed to start${NC}"
fi

if check_pm2_process "whatsapp-server"; then
    echo -e "${GREEN}✅ Backend (WhatsApp Server) is running${NC}"
else
    echo -e "${RED}❌ Backend (WhatsApp Server) failed to start${NC}"
fi

# Wait for ports to be available
wait_for_port 3000 "Frontend"
wait_for_port 3001 "Backend"

echo -e "${BLUE}📊 Final PM2 status:${NC}"
pm2 list

echo -e "${GREEN}🎉 Auto-start completed!${NC}"
echo -e "${GREEN}📱 Frontend: http://100.115.3.36:3000${NC}"
echo -e "${GREEN}🔧 Backend:  http://100.115.3.36:3001${NC}"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo -e "${YELLOW}   pm2 list          - Show all processes${NC}"
echo -e "${YELLOW}   pm2 logs          - Show all logs${NC}"
echo -e "${YELLOW}   pm2 restart all   - Restart all processes${NC}"
echo -e "${YELLOW}   pm2 stop all      - Stop all processes${NC}"
echo ""
