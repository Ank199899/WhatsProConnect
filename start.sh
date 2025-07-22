#!/bin/bash

# 🚀 WHATSAPP ADVANCED WEBAPP - PRODUCTION STARTER
# ================================================
# Simple, clean production deployment
# No port confusion, no complex setup needed

echo "🚀 WHATSAPP ADVANCED WEBAPP - PRODUCTION"
echo "========================================"

# Kill any existing processes
echo "🧹 Stopping existing services..."
pkill -f "node.*whatsapp-server.js" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Create logs directory
mkdir -p logs

# Start backend server
echo "🚀 Starting WhatsApp Backend Server..."
WHATSAPP_SERVER_PORT=3002 nohup node server/whatsapp-server.js > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ Backend started (PID: $BACKEND_PID)"
sleep 5

# Start frontend
echo "🚀 Starting Frontend Server..."
PORT=3000 nohup npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"
sleep 5

# Test services
echo "🔍 Testing services..."
if curl -s http://localhost:3002/api/sessions > /dev/null; then
    echo "   ✅ Backend API working"
else
    echo "   ❌ Backend API not responding"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Frontend working"
else
    echo "   ❌ Frontend not responding"
fi

echo ""
echo "🎉 WHATSAPP WEBAPP READY!"
echo "========================"
echo ""
echo "🌍 ACCESS URL:"
echo "   📱 Main App: http://192.168.1.230:3000"
echo ""
echo "📋 Services:"
echo "   Frontend: Port 3000"
echo "   Backend: Port 3002"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop:"
echo "   bash stop.sh"
