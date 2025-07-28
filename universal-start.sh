#!/bin/bash

# 🚀 WhatsApp Advanced Web App - UNIVERSAL STARTER
# ================================================
# Works on ANY server, ANY environment!
# No port confusion, no complex setup needed

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🚀 WhatsApp Advanced Web App - Universal Start 🚀    ║"
echo "║                                                              ║"
echo "║           Works EVERYWHERE - No Port Issues!                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is available
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✅ Docker found! Using Docker deployment...${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Docker not found. Using traditional deployment...${NC}"
        return 1
    fi
}

# Docker deployment
docker_deploy() {
    echo -e "${BLUE}🐳 Starting Docker deployment...${NC}"
    
    # Stop existing containers
    echo -e "${YELLOW}   🛑 Stopping existing containers...${NC}"
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build and start
    echo -e "${YELLOW}   🏗️ Building and starting services...${NC}"
    docker-compose up --build -d
    
    # Wait for services
    echo -e "${YELLOW}   ⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check health
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Docker deployment successful!${NC}"
        echo -e "${GREEN}🌐 Access: http://localhost:3000${NC}"
        return 0
    else
        echo -e "${RED}❌ Docker deployment failed${NC}"
        return 1
    fi
}

# Traditional deployment
traditional_deploy() {
    echo -e "${BLUE}🔧 Starting traditional deployment...${NC}"
    
    # Kill existing processes
    echo -e "${YELLOW}   🛑 Stopping existing services...${NC}"
    pkill -f "node.*whatsapp-server.js" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    sleep 3
    
    # Create logs directory
    mkdir -p logs
    
    # Start PostgreSQL if available
    if command -v systemctl &> /dev/null; then
        echo -e "${YELLOW}   🗄️ Starting PostgreSQL...${NC}"
        sudo systemctl start postgresql 2>/dev/null || echo "PostgreSQL not available or already running"
    fi
    
    # Start backend
    echo -e "${YELLOW}   📱 Starting WhatsApp Backend...${NC}"
    cd server
    nohup node whatsapp-server.js > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo "BACKEND_PID=$BACKEND_PID" > .pids
    
    # Wait for backend
    sleep 5
    
    # Build frontend
    echo -e "${YELLOW}   🏗️ Building frontend...${NC}"
    npm run build > logs/build.log 2>&1 || {
        echo -e "${RED}❌ Build failed. Check logs/build.log${NC}"
        return 1
    }
    
    # Start frontend
    echo -e "${YELLOW}   🌐 Starting frontend...${NC}"
    PORT=3000 nohup npm start > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "FRONTEND_PID=$FRONTEND_PID" >> .pids
    
    # Wait for frontend
    sleep 10
    
    # Check health
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Traditional deployment successful!${NC}"
        echo -e "${GREEN}🌐 Access: http://localhost:3000${NC}"
        return 0
    else
        echo -e "${RED}❌ Traditional deployment failed${NC}"
        return 1
    fi
}

# Get server IP
get_server_ip() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}' || echo "localhost")
    echo -e "${BLUE}🌐 Server IP: ${GREEN}${SERVER_IP}${NC}"
}

# Show final results
show_results() {
    echo -e "\n${GREEN}🎉 DEPLOYMENT SUCCESSFUL! 🎉${NC}"
    echo -e "\n${BLUE}📱 Access your WhatsApp Advanced Web App:${NC}"
    echo -e "   🏠 Local:    ${GREEN}http://localhost:3000${NC}"
    echo -e "   🌐 Network:  ${GREEN}http://${SERVER_IP}:3000${NC}"
    echo -e "   📡 Backend:  ${CYAN}http://localhost:3001${NC}"
    
    echo -e "\n${BLUE}📋 Management:${NC}"
    if command -v docker-compose &> /dev/null; then
        echo -e "   📊 Status:   ${YELLOW}docker-compose ps${NC}"
        echo -e "   📄 Logs:     ${YELLOW}docker-compose logs -f${NC}"
        echo -e "   🛑 Stop:     ${YELLOW}docker-compose down${NC}"
    else
        echo -e "   📄 Logs:     ${YELLOW}tail -f logs/frontend.log logs/backend.log${NC}"
        echo -e "   🛑 Stop:     ${YELLOW}pkill -f whatsapp${NC}"
    fi
    echo -e "   🔄 Restart:  ${YELLOW}./universal-start.sh${NC}"
    
    echo -e "\n${PURPLE}💡 Pro Tips:${NC}"
    echo -e "   • Bookmark: ${GREEN}http://${SERVER_IP}:3000${NC}"
    echo -e "   • Always use port 3000 for frontend"
    echo -e "   • Always use port 3001 for backend"
    echo -e "   • This script works on ANY server!"
    
    echo -e "\n${GREEN}🎊 Ready to chat! Open your browser and start using WhatsApp! 🎊${NC}"
}

# Main execution
main() {
    get_server_ip
    
    # Try Docker first, fallback to traditional
    if check_docker && docker_deploy; then
        echo -e "${GREEN}✅ Docker deployment completed${NC}"
    elif traditional_deploy; then
        echo -e "${GREEN}✅ Traditional deployment completed${NC}"
    else
        echo -e "${RED}❌ Both deployment methods failed${NC}"
        echo -e "${YELLOW}💡 Try running: sudo apt update && sudo apt install -y nodejs npm postgresql${NC}"
        exit 1
    fi
    
    show_results
}

# Run main function
main "$@"
