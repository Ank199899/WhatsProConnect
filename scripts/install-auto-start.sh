#!/bin/bash

# Install Auto-Start Script
# This script sets up automatic startup for WhatsApp services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
USER="admin1"

print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              WhatsApp Auto-Start Installer                  ║"
    echo "║                     Boot-time Startup                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Make scripts executable
setup_scripts() {
    print_info "Setting up scripts..."
    
    chmod +x "$PROJECT_DIR/scripts/startup.sh"
    chmod +x "$PROJECT_DIR/scripts/monitor-services.sh" 2>/dev/null || true
    chmod +x "$PROJECT_DIR/start-all.sh"
    
    print_status "Scripts made executable"
}

# Setup PM2 startup
setup_pm2_startup() {
    print_info "Setting up PM2 startup..."
    
    sudo -u "$USER" bash -c "
        export HOME=/home/$USER
        cd '$PROJECT_DIR'
        
        # Save current PM2 processes
        pm2 save
        
        # Generate startup script
        pm2 startup systemd -u $USER --hp /home/$USER
    "
    
    print_status "PM2 startup configured"
}

# Add to crontab
setup_crontab() {
    print_info "Setting up crontab auto-start..."
    
    # Add startup script to root crontab (runs at boot)
    (crontab -l 2>/dev/null | grep -v 'whatsapp.*startup.sh'; echo "@reboot sleep 30 && $PROJECT_DIR/scripts/startup.sh") | crontab -
    
    # Add monitoring to admin1 crontab
    sudo -u "$USER" bash -c "
        (crontab -l 2>/dev/null | grep -v 'monitor-services.sh'; echo '*/5 * * * * $PROJECT_DIR/scripts/monitor-services.sh 2>/dev/null') | crontab -
    "
    
    print_status "Crontab entries added"
}

# Create management commands
create_commands() {
    print_info "Creating management commands..."
    
    # Create global commands
    cat > /usr/local/bin/wa-start << EOF
#!/bin/bash
cd $PROJECT_DIR && ./start-all.sh start
EOF

    cat > /usr/local/bin/wa-stop << EOF
#!/bin/bash
cd $PROJECT_DIR && ./start-all.sh stop
EOF

    cat > /usr/local/bin/wa-restart << EOF
#!/bin/bash
cd $PROJECT_DIR && ./start-all.sh restart
EOF

    cat > /usr/local/bin/wa-status << EOF
#!/bin/bash
cd $PROJECT_DIR && ./start-all.sh status
EOF

    cat > /usr/local/bin/wa-logs << EOF
#!/bin/bash
cd $PROJECT_DIR && pm2 logs
EOF

    # Make commands executable
    chmod +x /usr/local/bin/wa-*
    
    print_status "Global commands created"
}

# Create service monitoring
create_monitoring() {
    print_info "Creating service monitoring..."
    
    # Create detailed monitor script
    cat > "$PROJECT_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# Health Check Script
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
LOG_FILE="$PROJECT_DIR/logs/health-check.log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check services
check_services() {
    local issues=0
    
    # Check ports
    if ! ss -tulpn | grep -q ":3001 "; then
        log_message "ERROR: Simulator (port 3001) is down"
        issues=$((issues + 1))
    fi
    
    if ! ss -tulpn | grep -q ":3005 "; then
        log_message "ERROR: Frontend (port 3005) is down"
        issues=$((issues + 1))
    fi
    
    # Check PM2 processes
    local pm2_status=$(sudo -u admin1 pm2 jlist 2>/dev/null | jq -r '.[] | select(.pm2_env.status != "online") | .name' 2>/dev/null)
    if [ -n "$pm2_status" ]; then
        log_message "ERROR: PM2 processes down: $pm2_status"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        log_message "All services healthy"
        return 0
    else
        log_message "Found $issues issues"
        return 1
    fi
}

# Auto-fix issues
auto_fix() {
    log_message "Attempting auto-fix..."
    
    cd "$PROJECT_DIR"
    sudo -u admin1 bash -c "
        pm2 restart all
        pm2 save
    "
    
    sleep 10
    
    if check_services; then
        log_message "Auto-fix successful"
        return 0
    else
        log_message "Auto-fix failed"
        return 1
    fi
}

# Main health check
main() {
    if ! check_services; then
        auto_fix
    fi
}

main "$@"
EOF

    chmod +x "$PROJECT_DIR/scripts/health-check.sh"
    
    # Add health check to crontab (every 10 minutes)
    (crontab -l 2>/dev/null | grep -v 'health-check.sh'; echo "*/10 * * * * $PROJECT_DIR/scripts/health-check.sh") | crontab -
    
    print_status "Health monitoring setup complete"
}

# Test the setup
test_setup() {
    print_info "Testing the setup..."
    
    # Test startup script
    if [ -x "$PROJECT_DIR/scripts/startup.sh" ]; then
        print_status "Startup script is executable"
    else
        print_error "Startup script is not executable"
        return 1
    fi
    
    # Test crontab entries
    if crontab -l | grep -q "startup.sh"; then
        print_status "Crontab entry found"
    else
        print_error "Crontab entry not found"
        return 1
    fi
    
    # Test global commands
    if [ -x "/usr/local/bin/wa-start" ]; then
        print_status "Global commands installed"
    else
        print_error "Global commands not installed"
        return 1
    fi
    
    print_status "Setup test passed"
}

# Show usage instructions
show_instructions() {
    echo ""
    echo -e "${BLUE}🎉 Auto-Start Installation Complete!${NC}"
    echo ""
    echo -e "${PURPLE}📋 Available Commands:${NC}"
    echo "  wa-start    - Start all WhatsApp services"
    echo "  wa-stop     - Stop all WhatsApp services"
    echo "  wa-restart  - Restart all WhatsApp services"
    echo "  wa-status   - Check service status"
    echo "  wa-logs     - View PM2 logs"
    echo ""
    echo -e "${PURPLE}🔧 Auto-Start Features:${NC}"
    echo "  ✅ Starts automatically on boot (30 seconds after boot)"
    echo "  ✅ Health monitoring every 10 minutes"
    echo "  ✅ Auto-restart on service failure"
    echo "  ✅ PM2 process management"
    echo "  ✅ Detailed logging"
    echo ""
    echo -e "${PURPLE}📊 Monitoring:${NC}"
    echo "  Startup logs:     $PROJECT_DIR/logs/startup.log"
    echo "  Health logs:      $PROJECT_DIR/logs/health-check.log"
    echo "  Monitor logs:     $PROJECT_DIR/logs/monitor.log"
    echo ""
    echo -e "${YELLOW}⚠️  Note: Services will auto-start on next reboot${NC}"
    echo -e "${BLUE}💡 Tip: Use 'wa-start' to start services now${NC}"
}

# Main installation
main() {
    print_header
    
    print_info "Installing WhatsApp Auto-Start system..."
    
    setup_scripts
    setup_pm2_startup
    setup_crontab
    create_commands
    create_monitoring
    
    if test_setup; then
        show_instructions
        return 0
    else
        print_error "Installation failed"
        return 1
    fi
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

# Run main function
main "$@"
