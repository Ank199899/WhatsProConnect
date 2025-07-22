#!/bin/bash

# WhatsApp Advanced Web App - Production Startup Script
# This script starts the production build with PM2

echo "🚀 Starting WhatsApp Advanced Web App in Production Mode..."

# Change to app directory
cd /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp

# Load NVM and Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use Node.js v22.17.0
nvm use 22.17.0

# Set production environment
export NODE_ENV=production

# Load port configuration
echo "🔧 Loading port configuration..."
node config/ports.js

# Stop any existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 delete all 2>/dev/null || true

# Start frontend with PM2
echo "🌐 Starting Next.js frontend..."
pm2 start npm --name "whatsapp-nextjs" -- start

# Wait for frontend to start
sleep 5

# Start backend manually (since PM2 has issues with it)
echo "⚙️ Starting WhatsApp backend server..."
pm2 start server/whatsapp-server.js --name "whatsapp-server" --env production

# Wait for backend to start
sleep 5

# Show PM2 status
echo "📊 PM2 Process Status:"
pm2 list

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

echo "✅ Production deployment complete!"
echo ""
echo "🌐 Frontend: http://localhost:3006"
echo "⚙️ Backend:  http://localhost:3002"
echo "📡 API:      http://localhost:3002/api"
echo ""
echo "📊 Monitor with: pm2 monit"
echo "📋 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart all"
echo "🛑 Stop with: pm2 stop all"
