#!/bin/bash

# 🎯 SUPER SIMPLE START - NO PORTS NEEDED!
# Just run this and access: http://192.168.1.230

echo "🎯 SUPER SIMPLE WHATSAPP APP STARTUP"
echo "=================================="
echo ""

# Load master config
echo "📋 Loading master configuration..."
node master-config.js

echo ""
echo "🛑 Stopping any existing services..."
pm2 stop all 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

echo ""
echo "🚀 Starting backend services..."
pm2 start ecosystem.config.js

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "🌐 Setting up NGINX (no ports needed)..."
sudo cp nginx-simple.conf /etc/nginx/sites-available/whatsapp-app
sudo ln -sf /etc/nginx/sites-available/whatsapp-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "📊 Service Status:"
pm2 list
echo ""
sudo systemctl status nginx --no-pager -l

echo ""
echo "🎉 SUCCESS! Your app is ready!"
echo "================================"
echo ""
echo "🌐 Access your app: http://192.168.1.230"
echo "📱 No ports needed!"
echo "🔧 All APIs work through: http://192.168.1.230/api/"
echo ""
echo "📝 Useful commands:"
echo "   pm2 list              - Check backend status"
echo "   sudo systemctl status nginx - Check web server"
echo "   pm2 logs              - View backend logs"
echo "   sudo nginx -s reload  - Reload web server"
echo ""
