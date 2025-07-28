#!/bin/bash

# WhatsApp Advanced WebApp - Server Startup Script
# This script ensures both backend and frontend servers are always running

echo "🚀 Starting WhatsApp Advanced WebApp Servers..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to kill existing processes
kill_existing() {
    echo "🔄 Stopping existing processes..."
    pkill -f "node.*whatsapp-server" || true
    pkill -f "npm.*dev" || true
    sleep 2
}

# Function to start backend server
start_backend() {
    echo "🔧 Starting Backend Server (Port 3006)..."
    nohup node server/whatsapp-server.js > logs/backend-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started with PID: $BACKEND_PID"
    echo $BACKEND_PID > logs/backend.pid
}

# Function to start frontend server
start_frontend() {
    echo "🎨 Starting Frontend Server (Port 3007)..."
    nohup npm run dev > logs/frontend-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID"
    echo $FRONTEND_PID > logs/frontend.pid
}

# Function to check if servers are running
check_servers() {
    echo "🔍 Checking server status..."
    
    # Check backend
    if curl -s http://localhost:3006/api/sessions > /dev/null 2>&1; then
        echo "✅ Backend server is running on port 3006"
    else
        echo "❌ Backend server is not responding"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:3007 > /dev/null 2>&1; then
        echo "✅ Frontend server is running on port 3007"
    else
        echo "❌ Frontend server is not responding"
        return 1
    fi
    
    return 0
}

# Main execution
cd /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp

# Kill existing processes
kill_existing

# Start servers
start_backend
sleep 5
start_frontend
sleep 10

# Check if servers started successfully
if check_servers; then
    echo "🎉 All servers started successfully!"
    echo "📱 Frontend: http://$(hostname -I | awk '{print $1}'):3007"
    echo "🔧 Backend API: http://$(hostname -I | awk '{print $1}'):3006"
    echo "📋 Logs directory: $(pwd)/logs"
else
    echo "❌ Some servers failed to start. Check logs for details."
    exit 1
fi

echo "🔄 Servers are now running in background. Use 'ps aux | grep -E \"(node.*server|npm.*dev)\"' to check status."
