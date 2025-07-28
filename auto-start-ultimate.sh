#!/bin/bash

# 🚀 ULTIMATE AUTO-START SCRIPT - SINGLE COMMAND SOLUTION
# Sirf ek command se sab kuch start ho jaye!

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250722_160758"
USER="admin1"
SERVICE_NAME="whatsapp-ultimate"

# Print functions
print_header() {
    clear
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    🚀 WHATSAPP ULTIMATE AUTO-START           ║${NC}"
    echo -e "${PURPLE}║                     Single Command Solution                  ║${NC}"
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Don't run this as root! Run as admin1 user."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing required dependencies..."
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        print_info "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Install project dependencies
    cd "$PROJECT_DIR"
    print_info "Installing project dependencies..."
    npm install --production
    
    print_success "Dependencies installed"
}

# Build application
build_application() {
    print_info "Building application..."
    cd "$PROJECT_DIR"
    
    # Build Next.js application
    npm run build
    
    print_success "Application built successfully"
}

# Setup systemd service for auto-start on boot
setup_systemd_service() {
    print_info "Setting up systemd service for auto-start on boot..."
    
    # Create systemd service file
    sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=WhatsApp Ultimate Auto-Start Service
Documentation=https://github.com/Ank199899/WhatsProConnect
After=network.target
Wants=network.target

[Service]
Type=forking
User=${USER}
Group=${USER}
WorkingDirectory=${PROJECT_DIR}
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin:/home/${USER}/.nvm/versions/node/v20.18.1/bin
Environment=PM2_HOME=/home/${USER}/.pm2

# Start command
ExecStart=/usr/bin/pm2 start ${PROJECT_DIR}/ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 restart all
ExecStop=/usr/bin/pm2 stop all

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${PROJECT_DIR}
ReadWritePaths=/home/${USER}/.pm2

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable ${SERVICE_NAME}.service
    
    print_success "Systemd service configured for auto-start on boot"
}

# Create global commands
create_global_commands() {
    print_info "Creating global commands..."
    
    # Create wa-start command
    sudo tee /usr/local/bin/wa-start > /dev/null << EOF
#!/bin/bash
cd ${PROJECT_DIR}
sudo systemctl start ${SERVICE_NAME}
echo "🚀 WhatsApp services started!"
echo "📱 Frontend: http://100.115.3.36:3008"
echo "🔧 Backend: http://100.115.3.36:3006"
EOF

    # Create wa-stop command
    sudo tee /usr/local/bin/wa-stop > /dev/null << EOF
#!/bin/bash
cd ${PROJECT_DIR}
sudo systemctl stop ${SERVICE_NAME}
pm2 stop all 2>/dev/null || true
echo "🛑 WhatsApp services stopped!"
EOF

    # Create wa-restart command
    sudo tee /usr/local/bin/wa-restart > /dev/null << EOF
#!/bin/bash
cd ${PROJECT_DIR}
sudo systemctl restart ${SERVICE_NAME}
echo "🔄 WhatsApp services restarted!"
EOF

    # Create wa-status command
    sudo tee /usr/local/bin/wa-status > /dev/null << EOF
#!/bin/bash
echo "🔍 System Service Status:"
sudo systemctl status ${SERVICE_NAME} --no-pager
echo ""
echo "📊 PM2 Process Status:"
pm2 status
echo ""
echo "🌐 Port Status:"
echo "Frontend (3008): \$(ss -tulpn 2>/dev/null | grep :3008 | wc -l) connections"
echo "Backend (3006):  \$(ss -tulpn 2>/dev/null | grep :3006 | wc -l) connections"
EOF

    # Create wa-logs command
    sudo tee /usr/local/bin/wa-logs > /dev/null << EOF
#!/bin/bash
echo "📋 Live PM2 Logs (Press Ctrl+C to exit):"
pm2 logs
EOF

    # Make all commands executable
    sudo chmod +x /usr/local/bin/wa-*
    
    print_success "Global commands created: wa-start, wa-stop, wa-restart, wa-status, wa-logs"
}

# Setup monitoring and health checks
setup_monitoring() {
    print_info "Setting up monitoring and health checks..."
    
    # Create monitoring script
    mkdir -p "$PROJECT_DIR/scripts"
    cat > "$PROJECT_DIR/scripts/health-monitor.sh" << 'EOF'
#!/bin/bash

# Health monitoring script
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250722_160758"
LOG_FILE="$PROJECT_DIR/logs/health-monitor.log"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_and_restart() {
    local ports=(3008 3006)
    local restart_needed=false
    
    for port in "${ports[@]}"; do
        if ! ss -tulpn | grep -q ":$port "; then
            log_message "WARNING: Port $port is down"
            restart_needed=true
        fi
    done
    
    if $restart_needed; then
        log_message "Restarting services due to port failures..."
        pm2 restart all
        sleep 10
        log_message "Services restarted"
    else
        log_message "All services healthy"
    fi
}

# Run health check
check_and_restart
EOF

    chmod +x "$PROJECT_DIR/scripts/health-monitor.sh"
    
    # Add to crontab for monitoring every 2 minutes
    (crontab -l 2>/dev/null | grep -v 'health-monitor.sh'; echo "*/2 * * * * $PROJECT_DIR/scripts/health-monitor.sh") | crontab -
    
    print_success "Health monitoring configured (runs every 2 minutes)"
}

# Start services
start_services() {
    print_info "Starting WhatsApp services..."
    
    cd "$PROJECT_DIR"
    
    # Stop any existing processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Start services with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true
    
    # Wait for services to start
    sleep 10
    
    print_success "Services started with PM2"
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."
    
    # Check systemd service
    if sudo systemctl is-enabled ${SERVICE_NAME} &>/dev/null; then
        print_success "Systemd service enabled for auto-start on boot"
    else
        print_warning "Systemd service not properly enabled"
    fi
    
    # Check PM2 processes
    if pm2 list | grep -q "online"; then
        print_success "PM2 processes are running"
    else
        print_warning "PM2 processes not running"
    fi
    
    # Check ports
    if ss -tulpn | grep -q ":3008"; then
        print_success "Frontend port 3008 is active"
    else
        print_warning "Frontend port 3008 not active"
    fi
    
    if ss -tulpn | grep -q ":3006"; then
        print_success "Backend port 3006 is active"
    else
        print_warning "Backend port 3006 not active"
    fi
}

# Show final instructions
show_instructions() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    🎉 INSTALLATION COMPLETE!                 ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ WhatsApp Ultimate Auto-Start is now configured!${NC}"
    echo ""
    echo -e "${YELLOW}🚀 AVAILABLE COMMANDS:${NC}"
    echo -e "   ${BLUE}wa-start${NC}   - Start all WhatsApp services"
    echo -e "   ${BLUE}wa-stop${NC}    - Stop all WhatsApp services"
    echo -e "   ${BLUE}wa-restart${NC} - Restart all WhatsApp services"
    echo -e "   ${BLUE}wa-status${NC}  - Check service status"
    echo -e "   ${BLUE}wa-logs${NC}    - View live logs"
    echo ""
    echo -e "${YELLOW}🌐 ACCESS URLS:${NC}"
    echo -e "   ${GREEN}Frontend:${NC} http://100.115.3.36:3008"
    echo -e "   ${GREEN}Backend:${NC}  http://100.115.3.36:3006"
    echo ""
    echo -e "${YELLOW}⚡ AUTO-START FEATURES:${NC}"
    echo -e "   ${GREEN}✓${NC} Services auto-start on system boot"
    echo -e "   ${GREEN}✓${NC} Health monitoring every 2 minutes"
    echo -e "   ${GREEN}✓${NC} Automatic restart on failures"
    echo -e "   ${GREEN}✓${NC} Global commands available system-wide"
    echo ""
    echo -e "${BLUE}💡 Quick Start: Just run 'wa-start' to start everything!${NC}"
}

# Main installation function
main() {
    print_header
    
    check_root
    
    print_info "Starting Ultimate Auto-Start setup..."
    
    install_dependencies
    build_application
    setup_systemd_service
    create_global_commands
    setup_monitoring
    start_services
    
    sleep 5
    verify_installation
    
    show_instructions
}

# Handle command line arguments
case "${1:-install}" in
    "install"|"setup")
        main
        ;;
    "start")
        wa-start
        ;;
    "stop")
        wa-stop
        ;;
    "restart")
        wa-restart
        ;;
    "status")
        wa-status
        ;;
    "logs")
        wa-logs
        ;;
    *)
        echo "Usage: $0 {install|start|stop|restart|status|logs}"
        echo "  install  - Setup complete auto-start system"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Check service status"
        echo "  logs     - View live logs"
        ;;
esac
