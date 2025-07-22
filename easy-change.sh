#!/bin/bash

# 🎯 EASY CHANGE SCRIPT
# Change anything in master-config.js and run this!

echo "🔄 APPLYING CHANGES FROM MASTER CONFIG..."
echo "========================================"
echo ""

echo "📋 Loading new configuration..."
node master-config.js

echo ""
echo "🛑 Stopping services..."
pm2 stop all
sudo systemctl stop nginx

echo ""
echo "🔄 Updating NGINX configuration..."
sudo cp nginx-simple.conf /etc/nginx/sites-available/whatsapp-app
sudo nginx -t

echo ""
echo "🚀 Restarting services..."
pm2 restart all
sudo systemctl start nginx

echo ""
echo "⏳ Waiting for services..."
sleep 3

echo ""
echo "📊 Status check:"
pm2 list
sudo systemctl status nginx --no-pager -l

echo ""
echo "✅ CHANGES APPLIED!"
echo "🌐 Access: http://192.168.1.230"
echo ""
