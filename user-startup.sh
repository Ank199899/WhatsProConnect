#!/bin/bash

# WhatsApp User Startup Script
PROJECT_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp"
LOG_FILE="$PROJECT_DIR/logs/user-startup.log"

# Create log directory
mkdir -p "$PROJECT_DIR/logs"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log "Starting WhatsApp services..."

# Change to project directory
cd "$PROJECT_DIR"

# Wait for system to be ready
sleep 30

# Start PM2 processes
pm2 resurrect >> "$LOG_FILE" 2>&1

# Check if services are running
if pm2 status | grep -q "online"; then
    log "✅ WhatsApp services started successfully"
else
    log "❌ Failed to start some services, trying manual start..."
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
fi

log "Startup script completed"
