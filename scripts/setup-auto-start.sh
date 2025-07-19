#!/bin/bash

# WhatsApp Advanced WebApp Auto-Start Setup Script
# This script sets up automatic startup for the application

set -e  # Exit on any error

echo "⚙️ WhatsApp Advanced WebApp Auto-Start Setup"
echo "============================================"

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

# Make scripts executable
echo -e "${BLUE}🔧 Making scripts executable...${NC}"
chmod +x scripts/auto-start.sh
chmod +x scripts/build-and-start.sh
chmod +x scripts/setup-auto-start.sh

# Setup PM2 startup
echo -e "${BLUE}🚀 Setting up PM2 startup...${NC}"
pm2 startup systemd -u admin1 --hp /home/admin1 2>/dev/null || echo "PM2 startup already configured"

# Start services
echo -e "${BLUE}🏗️ Building and starting services...${NC}"
./scripts/build-and-start.sh

# Save PM2 configuration
echo -e "${BLUE}💾 Saving PM2 configuration...${NC}"
pm2 save

# Create systemd service (optional - requires sudo)
echo -e "${YELLOW}📋 Systemd service file created at: scripts/whatsapp-webapp.service${NC}"
echo -e "${YELLOW}To install systemd service (optional), run:${NC}"
echo -e "${YELLOW}  sudo cp scripts/whatsapp-webapp.service /etc/systemd/system/${NC}"
echo -e "${YELLOW}  sudo systemctl daemon-reload${NC}"
echo -e "${YELLOW}  sudo systemctl enable whatsapp-webapp${NC}"
echo -e "${YELLOW}  sudo systemctl start whatsapp-webapp${NC}"

# Create cron job for auto-restart (optional)
echo -e "${BLUE}⏰ Setting up cron job for health check...${NC}"
CRON_JOB="*/5 * * * * cd $PROJECT_DIR && npm run pm2:status >/dev/null 2>&1 || npm run auto-start >/dev/null 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "npm run pm2:status"; then
    echo -e "${YELLOW}⚠️ Cron job already exists${NC}"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Cron job added for health check${NC}"
fi

# Create aliases in bashrc
echo -e "${BLUE}🔗 Setting up command aliases...${NC}"
BASHRC_FILE="/home/admin1/.bashrc"

# Aliases to add
ALIASES="
# WhatsApp WebApp aliases
alias wa-start='cd $PROJECT_DIR && npm run auto-start'
alias wa-stop='cd $PROJECT_DIR && npm run pm2:stop'
alias wa-restart='cd $PROJECT_DIR && npm run pm2:restart'
alias wa-status='cd $PROJECT_DIR && npm run pm2:status'
alias wa-logs='cd $PROJECT_DIR && npm run pm2:logs'
alias wa-build='cd $PROJECT_DIR && npm run build-start'
"

# Check if aliases already exist
if grep -q "WhatsApp WebApp aliases" "$BASHRC_FILE" 2>/dev/null; then
    echo -e "${YELLOW}⚠️ Aliases already exist in .bashrc${NC}"
else
    echo "$ALIASES" >> "$BASHRC_FILE"
    echo -e "${GREEN}✅ Aliases added to .bashrc${NC}"
fi

echo -e "${GREEN}🎉 Auto-start setup completed!${NC}"
echo ""
echo -e "${GREEN}📋 Available commands:${NC}"
echo -e "${GREEN}  npm run auto-start     - Start all services${NC}"
echo -e "${GREEN}  npm run build-start   - Build and start${NC}"
echo -e "${GREEN}  npm run pm2:status    - Check status${NC}"
echo -e "${GREEN}  npm run pm2:logs      - View logs${NC}"
echo -e "${GREEN}  npm run pm2:restart   - Restart all${NC}"
echo -e "${GREEN}  npm run pm2:stop      - Stop all${NC}"
echo ""
echo -e "${GREEN}📋 New shell aliases (after 'source ~/.bashrc'):${NC}"
echo -e "${GREEN}  wa-start    - Start services${NC}"
echo -e "${GREEN}  wa-stop     - Stop services${NC}"
echo -e "${GREEN}  wa-restart  - Restart services${NC}"
echo -e "${GREEN}  wa-status   - Check status${NC}"
echo -e "${GREEN}  wa-logs     - View logs${NC}"
echo -e "${GREEN}  wa-build    - Build and start${NC}"
echo ""
echo -e "${YELLOW}💡 Services will now auto-start on system boot!${NC}"
echo -e "${YELLOW}💡 Health check runs every 5 minutes via cron${NC}"
echo -e "${YELLOW}💡 Run 'source ~/.bashrc' to use new aliases${NC}"
echo ""
