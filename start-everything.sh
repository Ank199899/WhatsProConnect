#!/bin/bash

# 🚀 SINGLE COMMAND STARTUP - ULTIMATE SOLUTION
# Bas ek command se sab kuch start!

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250722_160758"

print_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                🚀 WHATSAPP ULTIMATE LAUNCHER                 ║${NC}"
    echo -e "${PURPLE}║                   Single Command Solution                    ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Quick start function
quick_start() {
    print_header
    print_info "Starting WhatsApp Ultimate System..."
    
    cd "$PROJECT_DIR"
    
    # Stop any existing processes
    print_info "Stopping existing processes..."
    pm2 stop all 2>/dev/null || true
    pkill -f "whatsapp" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    
    # Start with PM2
    print_info "Starting services with PM2..."
    pm2 start ecosystem.config.js --env production
    
    # Wait for startup
    print_info "Waiting for services to initialize..."
    sleep 15
    
    # Check status
    print_info "Checking service status..."
    
    local frontend_status="❌ Offline"
    local backend_status="❌ Offline"
    
    if ss -tulpn | grep -q ":3008"; then
        frontend_status="✅ Online"
    fi
    
    if ss -tulpn | grep -q ":3006"; then
        backend_status="✅ Online"
    fi
    
    # Display results
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    🎉 STARTUP COMPLETE!                      ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📊 SERVICE STATUS:${NC}"
    echo -e "   Frontend (Port 3008): $frontend_status"
    echo -e "   Backend (Port 3006):  $backend_status"
    echo ""
    echo -e "${YELLOW}🌐 ACCESS URLS:${NC}"
    echo -e "   ${GREEN}Main App:${NC} http://100.115.3.36:3008"
    echo -e "   ${GREEN}API:${NC}      http://100.115.3.36:3006"
    echo ""
    echo -e "${YELLOW}📋 USEFUL COMMANDS:${NC}"
    echo -e "   ${BLUE}pm2 status${NC}   - Check PM2 processes"
    echo -e "   ${BLUE}pm2 logs${NC}     - View live logs"
    echo -e "   ${BLUE}pm2 restart all${NC} - Restart all services"
    echo -e "   ${BLUE}pm2 stop all${NC}    - Stop all services"
    echo ""
    
    if [[ "$frontend_status" == *"Online"* ]] && [[ "$backend_status" == *"Online"* ]]; then
        print_success "All services are running successfully!"
        echo -e "${GREEN}🎯 Ready to use! Open http://100.115.3.36:3008 in your browser${NC}"
    else
        print_warning "Some services may not be running properly. Check logs with 'pm2 logs'"
    fi
}

# Install auto-start system
install_auto_start() {
    print_header
    print_info "Installing Ultimate Auto-Start System..."
    
    # Make auto-start script executable
    chmod +x "$PROJECT_DIR/auto-start-ultimate.sh"
    
    # Run the installation
    "$PROJECT_DIR/auto-start-ultimate.sh" install
}

# Show help
show_help() {
    echo -e "${CYAN}🚀 WhatsApp Ultimate Launcher${NC}"
    echo ""
    echo -e "${YELLOW}USAGE:${NC}"
    echo -e "  $0 [COMMAND]"
    echo ""
    echo -e "${YELLOW}COMMANDS:${NC}"
    echo -e "  ${GREEN}start${NC}        - Quick start all services (DEFAULT)"
    echo -e "  ${GREEN}install${NC}      - Install complete auto-start system"
    echo -e "  ${GREEN}stop${NC}         - Stop all services"
    echo -e "  ${GREEN}restart${NC}      - Restart all services"
    echo -e "  ${GREEN}status${NC}       - Check service status"
    echo -e "  ${GREEN}logs${NC}         - View live logs"
    echo -e "  ${GREEN}help${NC}         - Show this help"
    echo ""
    echo -e "${YELLOW}EXAMPLES:${NC}"
    echo -e "  $0                # Quick start (default)"
    echo -e "  $0 start          # Quick start"
    echo -e "  $0 install        # Install auto-start system"
    echo -e "  $0 status         # Check status"
    echo ""
    echo -e "${BLUE}💡 For first-time setup, run: $0 install${NC}"
}

# Stop services
stop_services() {
    print_info "Stopping all WhatsApp services..."
    pm2 stop all 2>/dev/null || true
    pkill -f "whatsapp" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    print_success "All services stopped"
}

# Restart services
restart_services() {
    print_info "Restarting all WhatsApp services..."
    stop_services
    sleep 3
    quick_start
}

# Show status
show_status() {
    echo -e "${CYAN}📊 WhatsApp System Status${NC}"
    echo ""
    echo -e "${YELLOW}PM2 Processes:${NC}"
    pm2 status
    echo ""
    echo -e "${YELLOW}Port Status:${NC}"
    echo "Frontend (3008): $(ss -tulpn 2>/dev/null | grep :3008 | wc -l) connections"
    echo "Backend (3006):  $(ss -tulpn 2>/dev/null | grep :3006 | wc -l) connections"
    echo ""
    echo -e "${YELLOW}System Resources:${NC}"
    echo "Memory Usage: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
}

# Show logs
show_logs() {
    print_info "Showing live logs (Press Ctrl+C to exit)..."
    pm2 logs
}

# Main execution
case "${1:-start}" in
    "start"|"")
        quick_start
        ;;
    "install"|"setup")
        install_auto_start
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
