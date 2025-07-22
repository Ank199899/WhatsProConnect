#!/bin/bash

# 🛑 WHATSAPP ADVANCED WEBAPP - STOP SERVICES
# ===========================================

echo "🛑 Stopping WhatsApp Webapp Services..."
echo "======================================="

# Stop all related processes
pkill -f "node.*whatsapp-server.js" 2>/dev/null && echo "   ✅ Backend stopped"
pkill -f "npm.*start" 2>/dev/null && echo "   ✅ Frontend stopped"
pkill -f "npm.*dev" 2>/dev/null && echo "   ✅ Dev server stopped"

echo ""
echo "✅ All services stopped!"
