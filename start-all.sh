#!/bin/bash

# Quick Start Script for WhatsApp Advanced WebApp
# This script provides easy management of all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
SERVICE_NAME="whatsapp-auto"

# Functions
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 WhatsApp Advanced WebApp                     ║"
    echo "║                    Auto Manager v1.0                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${CYAN}🎉 $1${NC}"
}

# Check if service exists
check_service() {
    if systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
        return 0
    else
        return 1
    fi
}

# Install auto manager
install_auto_manager() {
    print_info "Installing WhatsApp Auto Manager..."
    
    cd "$PROJECT_DIR"
    chmod +x scripts/setup-auto-manager.sh
    
    if [[ $EUID -eq 0 ]]; then
        ./scripts/setup-auto-manager.sh
    else
        sudo ./scripts/setup-auto-manager.sh
    fi
    
    print_success "Auto Manager installed successfully!"
}

# Start services using auto manager
start_with_auto_manager() {
    print_info "Starting services with Auto Manager..."
    
    if [[ $EUID -eq 0 ]]; then
        systemctl start "$SERVICE_NAME"
    else
        sudo systemctl start "$SERVICE_NAME"
    fi
    
    sleep 5
    
    if [[ $EUID -eq 0 ]]; then
        systemctl status "$SERVICE_NAME" --no-pager
    else
        sudo systemctl status "$SERVICE_NAME" --no-pager
    fi
}

# Start services manually (fallback)
start_manual() {
    print_info "Starting services manually..."
    
    cd "$PROJECT_DIR"
    
    # Stop any existing processes
    pkill -f "whatsapp" 2>/dev/null || true
    pm2 stop all 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js
    
    print_status "Services started with PM2"
    pm2 status
}

# Stop all services
stop_services() {
    print_info "Stopping all WhatsApp services..."
    
    # Stop systemd service
    if check_service; then
        if [[ $EUID -eq 0 ]]; then
            systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        else
            sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        fi
    fi
    
    # Stop PM2 processes
    pm2 stop all 2>/dev/null || true
    
    # Kill any remaining processes
    pkill -f "whatsapp" 2>/dev/null || true
    pkill -f "auto-manager" 2>/dev/null || true
    
    print_status "All services stopped"
}

# Show service status
show_status() {
    print_info "Checking service status..."
    
    echo -e "${BLUE}📊 Service Status:${NC}"
    
    # Check systemd service
    if check_service; then
        echo -e "${CYAN}Systemd Service:${NC}"
        if [[ $EUID -eq 0 ]]; then
            systemctl status "$SERVICE_NAME" --no-pager || true
        else
            sudo systemctl status "$SERVICE_NAME" --no-pager || true
        fi
    else
        echo -e "${YELLOW}Systemd service not installed${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}PM2 Processes:${NC}"
    pm2 status 2>/dev/null || echo "PM2 not running"
    
    echo ""
    echo -e "${CYAN}Port Status:${NC}"
    echo "Port 3001 (Simulator): $(ss -tulpn 2>/dev/null | grep :3001 | wc -l) connections"
    echo "Port 3002 (Backend):   $(ss -tulpn 2>/dev/null | grep :3002 | wc -l) connections"
    echo "Port 3005 (Frontend):  $(ss -tulpn 2>/dev/null | grep :3005 | wc -l) connections"
    
    echo ""
    echo -e "${CYAN}Running Processes:${NC}"
    ps aux | grep -E "(node.*whatsapp|node.*auto-manager)" | grep -v grep || echo "No WhatsApp processes found"
}

# Show logs
show_logs() {
    if check_service; then
        print_info "Showing live logs from systemd service..."
        if [[ $EUID -eq 0 ]]; then
            journalctl -u "$SERVICE_NAME" -f
        else
            sudo journalctl -u "$SERVICE_NAME" -f
        fi
    else
        print_info "Showing PM2 logs..."
        pm2 logs
    fi
}

# Restart services
restart_services() {
    print_info "Restarting all services..."
    stop_services
    sleep 3
    start_services
}

# Main start function
start_services() {
    if check_service; then
        start_with_auto_manager
    else
        print_warning "Auto Manager not installed. Installing now..."
        install_auto_manager
        start_with_auto_manager
    fi
}

# Show help
show_help() {
    echo -e "${BLUE}Usage: $0 [COMMAND]${NC}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  start     - Start all WhatsApp services"
    echo "  stop      - Stop all WhatsApp services"
    echo "  restart   - Restart all WhatsApp services"
    echo "  status    - Show service status"
    echo "  logs      - Show live logs"
    echo "  install   - Install Auto Manager"
    echo "  manual    - Start services manually (PM2)"
    echo "  help      - Show this help"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 start    # Start all services"
    echo "  $0 status   # Check if services are running"
    echo "  $0 logs     # View live logs"
}

# Main script
main() {
    print_header
    
    case "${1:-start}" in
        "start")
            start_services
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
        "install")
            install_auto_manager
            ;;
        "manual")
            start_manual
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
