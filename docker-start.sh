#!/bin/bash

# 🚀 WhatsApp Advanced Web App - Universal Docker Deployment
# Works on ANY server, ANY environment!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🚀 WhatsApp Advanced Web App - Docker Deploy 🚀      ║"
echo "║           Universal Solution - Works Everywhere!             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
check_docker() {
    echo -e "${BLUE}🔍 Checking Docker...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found! Installing...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}✅ Docker installed! Please logout and login again.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}📥 Installing Docker Compose...${NC}"
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    echo -e "${GREEN}✅ Docker ready!${NC}"
}

# Get IP
get_ip() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}' || echo "localhost")
    echo -e "${BLUE}🌐 Server IP: ${GREEN}${SERVER_IP}${NC}"
}

# Stop existing
stop_existing() {
    echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
    docker-compose down --remove-orphans 2>/dev/null || true
    docker ps -a --filter "name=whatsapp" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup done${NC}"
}

# Start services
start_services() {
    echo -e "${BLUE}🏗️ Building and starting...${NC}"
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Services started!${NC}"
}

# Wait for ready
wait_services() {
    echo -e "${BLUE}⏳ Waiting for services...${NC}"
    
    echo -e "${YELLOW}   🗄️ Database...${NC}"
    timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U whatsapp_user; do sleep 2; done'
    
    echo -e "${YELLOW}   📱 Backend...${NC}"
    timeout 120 bash -c 'until curl -s http://localhost:3001 > /dev/null; do sleep 3; done'
    
    echo -e "${YELLOW}   🌐 Frontend...${NC}"
    timeout 120 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 3; done'
    
    echo -e "${GREEN}✅ All ready!${NC}"
}

# Show results
show_results() {
    echo -e "\n${GREEN}🎉 SUCCESS! 🎉${NC}"
    echo -e "\n${BLUE}📱 Your WhatsApp App:${NC}"
    echo -e "   🌐 Local:   ${GREEN}http://localhost:3000${NC}"
    echo -e "   🌐 Network: ${GREEN}http://${SERVER_IP}:3000${NC}"
    echo -e "   📡 Backend: ${CYAN}http://localhost:3001${NC}"
    
    echo -e "\n${BLUE}📋 Commands:${NC}"
    echo -e "   📊 Status:  ${YELLOW}docker-compose ps${NC}"
    echo -e "   📄 Logs:    ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   🛑 Stop:    ${YELLOW}docker-compose down${NC}"
    echo -e "   🔄 Restart: ${YELLOW}./docker-start.sh${NC}"
    
    echo -e "\n${PURPLE}💡 Bookmark: ${GREEN}http://${SERVER_IP}:3000${NC}"
}

# Main
main() {
    check_docker
    get_ip
    stop_existing
    start_services
    wait_services
    show_results
    echo -e "\n${GREEN}🎊 Ready to chat! 🎊${NC}"
}

main "$@"
