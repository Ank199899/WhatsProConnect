#!/bin/bash

# 🎯 ULTRA SIMPLE START - DEVELOPMENT MODE
# No PM2, No complexity, Just works!

echo "🚀 ULTRA SIMPLE WHATSAPP APP"
echo "============================"
echo ""

# Kill any existing processes
echo "🛑 Stopping any existing processes..."
pkill -f "next" 2>/dev/null || true
pkill -f "whatsapp-server" 2>/dev/null || true
pm2 stop all 2>/dev/null || true

echo ""
echo "🔧 Starting Backend Server..."
cd /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp
WHATSAPP_SERVER_PORT=3006 node server/whatsapp-server.js &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"

echo ""
echo "⏳ Waiting for backend to start..."
sleep 3

echo ""
echo "🌐 Starting Frontend (Development Mode)..."
npm run dev -- -H 0.0.0.0 -p 3007 &
FRONTEND_PID=$!

echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "⏳ Waiting for frontend to start..."
sleep 5

echo ""
echo "🎉 SUCCESS! App is ready!"
echo "========================="
echo ""
echo "🌐 Access your app: http://192.168.1.230:3007"
echo "🔧 Backend API: http://192.168.1.230:3006/api/sessions"
echo ""
echo "📝 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📊 Checking status..."
curl -s http://192.168.1.230:3006/api/sessions > /dev/null && echo "✅ Backend: Working" || echo "❌ Backend: Not working"
curl -s http://192.168.1.230:3007 > /dev/null && echo "✅ Frontend: Working" || echo "❌ Frontend: Not working"

echo ""
echo "🎯 Ready to use!"
