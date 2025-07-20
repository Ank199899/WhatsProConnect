#!/bin/bash

# WhatsApp Auto Manager Setup Script
# This script sets up automatic startup for all WhatsApp services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
SERVICE_NAME="whatsapp-auto"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SCRIPT_DIR="$PROJECT_DIR/scripts"

echo -e "${BLUE}🚀 WhatsApp Auto Manager Setup${NC}"
echo "=================================="

# Function to print colored output
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

# Check if running as root for systemd setup
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is required for systemd service installation."
    else
        print_info "Not running as root. Will use sudo for system operations."
    fi
}

# Create necessary directories
setup_directories() {
    print_info "Setting up directories..."
    
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/sessions"
    mkdir -p "$PROJECT_DIR/data"
    mkdir -p "$PROJECT_DIR/database"
    
    # Set proper permissions
    chown -R admin1:admin1 "$PROJECT_DIR/logs"
    chown -R admin1:admin1 "$PROJECT_DIR/sessions"
    chown -R admin1:admin1 "$PROJECT_DIR/data"
    chown -R admin1:admin1 "$PROJECT_DIR/database"
    
    print_status "Directories created and permissions set"
}

# Make scripts executable
setup_scripts() {
    print_info "Setting up scripts..."
    
    chmod +x "$SCRIPT_DIR/auto-manager.js"
    chmod +x "$SCRIPT_DIR/setup-auto-manager.sh"
    
    print_status "Scripts made executable"
}

# Install systemd service
install_service() {
    print_info "Installing systemd service..."
    
    # Copy service file
    cp "$SCRIPT_DIR/whatsapp-auto.service" "$SERVICE_FILE"
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable service for auto-start
    systemctl enable "$SERVICE_NAME"
    
    print_status "Systemd service installed and enabled"
}

# Stop existing PM2 processes
stop_pm2() {
    print_info "Stopping existing PM2 processes..."
    
    # Switch to admin1 user and stop PM2
    sudo -u admin1 bash -c "
        cd $PROJECT_DIR
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    "
    
    print_status "PM2 processes stopped"
}

# Start the auto manager service
start_service() {
    print_info "Starting WhatsApp Auto Manager service..."
    
    systemctl start "$SERVICE_NAME"
    sleep 5
    
    # Check service status
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        print_status "Service started successfully"
    else
        print_error "Service failed to start"
        systemctl status "$SERVICE_NAME"
        return 1
    fi
}

# Create management aliases
create_aliases() {
    print_info "Creating management aliases..."
    
    # Add aliases to admin1's bashrc
    sudo -u admin1 bash -c "
        echo '' >> ~/.bashrc
        echo '# WhatsApp Auto Manager Aliases' >> ~/.bashrc
        echo 'alias wa-start=\"sudo systemctl start $SERVICE_NAME\"' >> ~/.bashrc
        echo 'alias wa-stop=\"sudo systemctl stop $SERVICE_NAME\"' >> ~/.bashrc
        echo 'alias wa-restart=\"sudo systemctl restart $SERVICE_NAME\"' >> ~/.bashrc
        echo 'alias wa-status=\"sudo systemctl status $SERVICE_NAME\"' >> ~/.bashrc
        echo 'alias wa-logs=\"sudo journalctl -u $SERVICE_NAME -f\"' >> ~/.bashrc
        echo 'alias wa-manager=\"node $SCRIPT_DIR/auto-manager.js\"' >> ~/.bashrc
    "
    
    print_status "Aliases created in ~/.bashrc"
}

# Create monitoring script
create_monitor() {
    cat > "$SCRIPT_DIR/monitor.sh" << 'EOF'
#!/bin/bash

# WhatsApp Services Monitor
SERVICE_NAME="whatsapp-auto"

echo "🔍 WhatsApp Services Monitor"
echo "============================"

# Check systemd service
echo "📊 Systemd Service Status:"
systemctl status $SERVICE_NAME --no-pager -l

echo ""
echo "🌐 Port Status:"
echo "Port 3001 (Simulator): $(ss -tulpn | grep :3001 | wc -l) connections"
echo "Port 3002 (Backend):   $(ss -tulpn | grep :3002 | wc -l) connections"  
echo "Port 3005 (Frontend):  $(ss -tulpn | grep :3005 | wc -l) connections"

echo ""
echo "📝 Recent Logs (last 10 lines):"
journalctl -u $SERVICE_NAME -n 10 --no-pager

echo ""
echo "💾 Resource Usage:"
ps aux | grep -E "(node.*auto-manager|node.*whatsapp)" | grep -v grep
EOF

    chmod +x "$SCRIPT_DIR/monitor.sh"
    print_status "Monitor script created"
}

# Main setup function
main() {
    echo -e "${BLUE}Starting setup process...${NC}"
    
    check_permissions
    setup_directories
    setup_scripts
    stop_pm2
    install_service
    start_service
    create_aliases
    create_monitor
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Available Commands:${NC}"
    echo "  wa-start    - Start WhatsApp services"
    echo "  wa-stop     - Stop WhatsApp services"  
    echo "  wa-restart  - Restart WhatsApp services"
    echo "  wa-status   - Check service status"
    echo "  wa-logs     - View live logs"
    echo "  wa-manager  - Direct manager control"
    echo ""
    echo -e "${BLUE}📊 Monitoring:${NC}"
    echo "  $SCRIPT_DIR/monitor.sh - Service monitor"
    echo "  journalctl -u $SERVICE_NAME -f - Live logs"
    echo ""
    echo -e "${BLUE}🔧 Service Details:${NC}"
    echo "  Service Name: $SERVICE_NAME"
    echo "  Auto-start: Enabled (starts on boot)"
    echo "  Auto-restart: Enabled (restarts on failure)"
    echo "  Ports: 3001 (Simulator), 3002 (Backend), 3005 (Frontend)"
    echo ""
    echo -e "${YELLOW}⚠️  Note: Reload your shell or run 'source ~/.bashrc' to use aliases${NC}"
}

# Run main function
main "$@"
