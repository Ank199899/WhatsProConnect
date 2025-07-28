#!/bin/bash

# 🚀 ONE-CLICK START - SABSE SIMPLE SOLUTION
# Bas ek command: ./one-click-start.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Project path
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250722_160758"

echo -e "${PURPLE}🚀 WhatsApp One-Click Starter${NC}"
echo -e "${BLUE}Starting everything automatically...${NC}"
echo ""

# Go to project directory
cd "$PROJECT_DIR"

# Stop existing processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pm2 stop all 2>/dev/null || true
pkill -f "whatsapp" 2>/dev/null || true

# Start services
echo -e "${YELLOW}🚀 Starting WhatsApp services...${NC}"
pm2 start ecosystem.config.js --env production

# Wait for startup
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

# Check status
echo -e "${YELLOW}🔍 Checking status...${NC}"
if ss -tulpn | grep -q ":3008" && ss -tulpn | grep -q ":3006"; then
    echo ""
    echo -e "${GREEN}✅ SUCCESS! WhatsApp system is running!${NC}"
    echo ""
    echo -e "${BLUE}📱 Frontend: http://100.115.3.36:3008${NC}"
    echo -e "${BLUE}🔧 Backend:  http://100.115.3.36:3006${NC}"
    echo ""
    echo -e "${GREEN}🎯 Ready to use! Open the frontend URL in your browser.${NC}"
else
    echo -e "${RED}❌ Some services failed to start. Check with: pm2 logs${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo -e "  pm2 status    - Check processes"
echo -e "  pm2 logs      - View logs"
echo -e "  pm2 restart all - Restart services"