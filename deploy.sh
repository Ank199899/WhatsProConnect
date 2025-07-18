#!/bin/bash

# WhatsApp Advanced Web App Deployment Script
# This script sets up the application for production on IP 192.168.1.230

set -e

echo "🚀 Starting WhatsApp Advanced Web App Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building the application..."
npm run build

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p sessions
mkdir -p logs

# Set up environment variables
if [ ! -f .env.local ]; then
    print_warning ".env.local file not found. Please configure your environment variables."
    print_status "Creating sample .env.local file..."
    cp .env.local .env.local.example
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 process manager..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'whatsapp-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '$(pwd)',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      log_file: './logs/nextjs-combined.log',
      time: true
    },
    {
      name: 'whatsapp-server',
      script: 'server/whatsapp-server.js',
      cwd: '$(pwd)',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        WHATSAPP_SERVER_PORT: 3001
      },
      error_file: './logs/whatsapp-error.log',
      out_file: './logs/whatsapp-out.log',
      log_file: './logs/whatsapp-combined.log',
      time: true
    }
  ]
};
EOF

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js || true
pm2 delete ecosystem.config.js || true

# Start applications with PM2
print_status "Starting applications with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup || print_warning "Could not setup PM2 startup script. You may need to run this manually with sudo."

# Nginx configuration
print_status "Setting up Nginx configuration..."

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx is not installed. Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Copy Nginx configuration
if [ -f "nginx/whatsapp-app.conf" ]; then
    print_status "Copying Nginx configuration..."
    sudo cp nginx/whatsapp-app.conf /etc/nginx/sites-available/whatsapp-app
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/whatsapp-app /etc/nginx/sites-enabled/whatsapp-app
    
    # Remove default Nginx site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if sudo nginx -t; then
        print_status "Nginx configuration is valid"
        sudo systemctl reload nginx
        sudo systemctl enable nginx
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
else
    print_warning "Nginx configuration file not found"
fi

# Setup firewall rules
print_status "Setting up firewall rules..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow ssh
    print_status "Firewall rules configured"
else
    print_warning "UFW firewall not found. Please configure firewall manually."
fi

# Create systemd service for auto-start (alternative to PM2 startup)
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/whatsapp-app.service > /dev/null << EOF
[Unit]
Description=WhatsApp Advanced Web App
After=network.target

[Service]
Type=forking
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
PIDFile=/home/$(whoami)/.pm2/pm2.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable whatsapp-app.service

# Display status
print_status "Checking application status..."
pm2 status

# Display final information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Application Information:"
echo "   • Next.js App: http://192.168.1.230"
echo "   • WhatsApp Server: http://192.168.1.230:3001 (internal)"
echo "   • PM2 Status: pm2 status"
echo "   • PM2 Logs: pm2 logs"
echo "   • Nginx Status: sudo systemctl status nginx"
echo ""
echo "🔧 Management Commands:"
echo "   • Restart apps: pm2 restart ecosystem.config.js"
echo "   • Stop apps: pm2 stop ecosystem.config.js"
echo "   • View logs: pm2 logs"
echo "   • Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "⚠️  Important Notes:"
echo "   • Configure your .env.local file with proper Supabase credentials"
echo "   • Run your database schema in Supabase SQL Editor"
echo "   • Make sure your firewall allows HTTP/HTTPS traffic"
echo "   • For HTTPS, configure SSL certificates in Nginx"
echo ""
print_status "Access your application at: http://192.168.1.230"
