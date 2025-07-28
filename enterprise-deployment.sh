#!/bin/bash

# 🚀 ENTERPRISE DEPLOYMENT SCRIPT FOR 10 LAKH DAILY MESSAGES
# Complete setup for high-volume WhatsApp messaging

echo "🎯 Starting Enterprise WhatsApp Deployment..."
echo "Target: 10 Lakh Messages Per Day"
echo "=========================================="

# 1. System Requirements Check
echo "📋 Checking System Requirements..."
CPU_CORES=$(nproc)
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
DISK_SPACE=$(df -h / | awk 'NR==2{print $4}')

echo "CPU Cores: $CPU_CORES"
echo "Total RAM: ${TOTAL_RAM}GB"
echo "Available Disk: $DISK_SPACE"

if [ $CPU_CORES -lt 16 ]; then
    echo "⚠️  WARNING: Recommended minimum 16 CPU cores for 10 lakh messages"
fi

if [ $TOTAL_RAM -lt 32 ]; then
    echo "⚠️  WARNING: Recommended minimum 32GB RAM for 10 lakh messages"
fi

# 2. Install Dependencies
echo "📦 Installing Dependencies..."
sudo apt update
sudo apt install -y redis-server postgresql-14 nginx htop iotop

# 3. Configure Redis
echo "🔧 Configuring Redis..."
sudo cp redis-config.conf /etc/redis/redis.conf
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# 4. Configure PostgreSQL
echo "🗄️  Optimizing PostgreSQL..."
sudo -u postgres psql -f postgresql-optimization.sql
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# 5. Install Node.js Dependencies
echo "📦 Installing Node.js Dependencies..."
npm install --production
npm install pm2 -g
npm install redis bull ioredis -S

# 6. Create Required Directories
echo "📁 Creating Directories..."
mkdir -p logs sessions data/backups public/uploads
chmod 755 logs sessions data public/uploads

# 7. Setup PM2 Ecosystem
echo "🚀 Setting up PM2 Ecosystem..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# 8. Configure Nginx Load Balancer
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/whatsapp-enterprise > /dev/null <<EOF
upstream whatsapp_frontend {
    server 127.0.0.1:3008;
}

upstream whatsapp_backend {
    server 127.0.0.1:3006;
}

server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://whatsapp_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://whatsapp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health Check
    location /health {
        proxy_pass http://127.0.0.1:3007/health;
        access_log off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/whatsapp-enterprise /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 9. Setup Monitoring
echo "📊 Setting up Monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# 10. Create Startup Script
echo "🔄 Creating Startup Script..."
pm2 startup
pm2 save

# 11. Final Status Check
echo "✅ Deployment Complete!"
echo "========================"
echo "Frontend: http://localhost (Nginx)"
echo "Backend API: http://localhost/api"
echo "Health Check: http://localhost/health"
echo ""
echo "📊 Process Status:"
pm2 status

echo ""
echo "🎯 ENTERPRISE CONFIGURATION SUMMARY:"
echo "├── Target: 10 Lakh messages per day"
echo "├── Sessions: 200 WhatsApp accounts"
echo "├── Rate: 1,041 messages per minute"
echo "├── Workers: 3 queue workers + analytics"
echo "├── Database: PostgreSQL optimized"
echo "├── Cache: Redis configured"
echo "└── Load Balancer: Nginx"
echo ""
echo "🚀 Ready for 10 Lakh Daily Messages!"
