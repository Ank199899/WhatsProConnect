#!/bin/bash

# 🚀 WhatsPro Connect - Ubuntu 24 VPS Auto Deployment Script
# This script automatically deploys WhatsPro Connect on Ubuntu 24 VPS

set -e  # Exit on any error

echo "🚀 Starting WhatsPro Connect VPS Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Get VPS IP address
VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
print_status "Detected VPS IP: $VPS_IP"

# Step 1: System Update
print_header "📦 Step 1: Updating System Packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Required Packages
print_header "🔧 Step 2: Installing Required Packages..."
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx git curl ufw

# Step 3: Install Node.js 20
print_header "🟢 Step 3: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Step 4: Install PM2
print_header "⚡ Step 4: Installing PM2..."
sudo npm install -g pm2

# Step 5: Setup PostgreSQL
print_header "🗄️ Step 5: Setting up PostgreSQL Database..."
sudo -u postgres psql -c "CREATE DATABASE whatsapp_advanced;" || print_warning "Database might already exist"
sudo -u postgres psql -c "CREATE USER whatsapp_user WITH PASSWORD 'whatsapp_secure_password_2025';" || print_warning "User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE whatsapp_advanced TO whatsapp_user;"
sudo -u postgres psql -c "ALTER USER whatsapp_user CREATEDB;"

# Step 6: Initialize Database Schema
print_header "📋 Step 6: Initializing Database Schema..."
if [ -f "init-db.sql" ]; then
    PGPASSWORD=whatsapp_secure_password_2025 psql -U whatsapp_user -d whatsapp_advanced -f init-db.sql
    print_status "Database schema initialized successfully"
else
    print_warning "init-db.sql not found, skipping schema initialization"
fi

# Step 7: Install Dependencies
print_header "📦 Step 7: Installing Application Dependencies..."
npm install

# Step 8: Build Application
print_header "🏗️ Step 8: Building Application..."
npm run build

# Step 9: Create Environment File
print_header "⚙️ Step 9: Creating Production Environment File..."
cat > .env.production << EOF
# Production Configuration for VPS
NODE_ENV=production
PORT=3008
WHATSAPP_SERVER_PORT=3006
HOST=0.0.0.0

# Database Configuration
DATABASE_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_advanced
DB_USER=whatsapp_user
DB_PASSWORD=whatsapp_secure_password_2025
DB_SSL=false

# Application URLs
NEXT_PUBLIC_APP_URL=http://$VPS_IP:3008
WHATSAPP_BACKEND_URL=http://$VPS_IP:3006

# Security
JWT_SECRET=whatsapp_super_secure_jwt_secret_vps_2025
BCRYPT_ROUNDS=12

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
MAX_CONCURRENT_SESSIONS=100
BULK_MESSAGE_DELAY=2000

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF

# Copy to .env.local as well
cp .env.production .env.local

print_status "Environment file created with VPS IP: $VPS_IP"

# Step 10: Setup Directories
print_header "📁 Step 10: Creating Required Directories..."
mkdir -p sessions uploads logs

# Step 11: Start with PM2
print_header "🚀 Step 11: Starting Application with PM2..."
pm2 delete all 2>/dev/null || true  # Delete existing processes
npm run pm2:start

# Step 12: Setup PM2 Auto-startup
print_header "🔄 Step 12: Setting up PM2 Auto-startup..."
pm2 startup | grep -E '^sudo' | bash || print_warning "PM2 startup setup might need manual intervention"
pm2 save

# Step 13: Configure Nginx
print_header "🌐 Step 13: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/whatsproconnect > /dev/null << EOF
server {
    listen 80;
    server_name $VPS_IP;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/whatsproconnect /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Step 14: Configure Firewall
print_header "🔒 Step 14: Configuring Firewall..."
sudo ufw --force enable
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3008    # Frontend (optional)
sudo ufw allow 3006    # Backend (optional)

# Step 15: Final Status Check
print_header "✅ Step 15: Final Status Check..."
sleep 5  # Wait for services to start

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
echo "========================================"
echo ""
print_status "VPS IP Address: $VPS_IP"
print_status "Application URL: http://$VPS_IP"
print_status "Direct Frontend: http://$VPS_IP:3008"
print_status "Backend API: http://$VPS_IP:3006"
print_status "Health Check: http://$VPS_IP:3006/api/health"
echo ""
print_status "Default Login Credentials:"
print_status "Username: admin123"
print_status "Password: Ankit@199899"
echo ""

# Show service status
print_header "📊 Service Status:"
echo "PM2 Processes:"
pm2 list
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "PostgreSQL Status:"
sudo systemctl status postgresql --no-pager -l
echo ""

print_header "🔧 Management Commands:"
echo "• View PM2 logs: pm2 logs"
echo "• Restart services: pm2 restart all"
echo "• Stop services: pm2 stop all"
echo "• Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "• Database connect: psql -U whatsapp_user -d whatsapp_advanced"
echo ""

print_header "🌟 Your WhatsPro Connect is now live at: http://$VPS_IP"
echo ""
print_status "Deployment completed successfully! 🚀"
