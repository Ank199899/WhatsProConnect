#!/bin/bash

# WhatsApp Auto Startup Script
# This script automatically starts all WhatsApp services on boot

# Configuration
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
LOG_FILE="$PROJECT_DIR/logs/startup.log"
USER="admin1"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to wait for network
wait_for_network() {
    log_message "Waiting for network connectivity..."
    for i in {1..30}; do
        if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
            log_message "Network is ready"
            return 0
        fi
        sleep 2
    done
    log_message "Network timeout, continuing anyway..."
    return 1
}

# Function to start services
start_services() {
    log_message "Starting WhatsApp services..."
    
    # Change to project directory
    cd "$PROJECT_DIR" || {
        log_message "ERROR: Cannot access project directory"
        exit 1
    }
    
    # Start with PM2 as admin1 user
    sudo -u "$USER" bash -c "
        export HOME=/home/$USER
        export PATH=/usr/local/bin:/usr/bin:/bin
        cd '$PROJECT_DIR'
        
        # Stop any existing processes
        pm2 stop all 2>/dev/null || true
        
        # Start services
        pm2 start ecosystem.config.js
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 startup (if not already done)
        pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true
    "
    
    if [ $? -eq 0 ]; then
        log_message "Services started successfully"
        return 0
    else
        log_message "ERROR: Failed to start services"
        return 1
    fi
}

# Function to check services
check_services() {
    log_message "Checking service status..."
    
    # Check ports
    local ports=(3001 3005)
    local all_running=true
    
    for port in "${ports[@]}"; do
        if ss -tulpn | grep -q ":$port "; then
            log_message "Port $port is active"
        else
            log_message "WARNING: Port $port is not active"
            all_running=false
        fi
    done
    
    if $all_running; then
        log_message "All services are running properly"
        return 0
    else
        log_message "Some services may not be running"
        return 1
    fi
}

# Function to setup auto-restart
setup_auto_restart() {
    log_message "Setting up auto-restart monitoring..."
    
    # Create monitoring script
    cat > "$PROJECT_DIR/scripts/monitor-services.sh" << 'EOF'
#!/bin/bash

# Service monitoring script
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
LOG_FILE="$PROJECT_DIR/logs/monitor.log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if services are running
check_and_restart() {
    local ports=(3001 3005)
    local restart_needed=false
    
    for port in "${ports[@]}"; do
        if ! ss -tulpn | grep -q ":$port "; then
            log_message "Port $port is down, restart needed"
            restart_needed=true
        fi
    done
    
    if $restart_needed; then
        log_message "Restarting services..."
        cd "$PROJECT_DIR"
        sudo -u admin1 pm2 restart all
        log_message "Services restarted"
    fi
}

check_and_restart
EOF

    chmod +x "$PROJECT_DIR/scripts/monitor-services.sh"
    
    # Add to crontab for admin1 user
    sudo -u "$USER" bash -c "
        # Add monitoring to crontab (every 5 minutes)
        (crontab -l 2>/dev/null | grep -v 'monitor-services.sh'; echo '*/5 * * * * $PROJECT_DIR/scripts/monitor-services.sh') | crontab -
    "
    
    log_message "Auto-restart monitoring setup complete"
}

# Main execution
main() {
    log_message "=== WhatsApp Auto Startup Started ==="
    
    # Wait a bit for system to stabilize
    sleep 10
    
    # Wait for network
    wait_for_network
    
    # Start services
    if start_services; then
        sleep 10
        
        # Check if services started properly
        if check_services; then
            log_message "Startup completed successfully"
            
            # Setup monitoring
            setup_auto_restart
            
            log_message "=== WhatsApp Auto Startup Finished ==="
            exit 0
        else
            log_message "Services started but some issues detected"
            exit 1
        fi
    else
        log_message "Failed to start services"
        exit 1
    fi
}

# Run main function
main "$@"
