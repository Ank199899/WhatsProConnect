#!/bin/bash

# 🚀 WhatsApp Advanced WebApp - Production Startup Script
# This script starts the complete WhatsApp application in production mode

echo "🚀 Starting WhatsApp Advanced WebApp in Production Mode"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Stop any existing processes
print_info "Stopping existing processes..."
pm2 delete all 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "whatsapp-server.js" 2>/dev/null || true

# Clean build directory
print_info "Cleaning build directory..."
sudo rm -rf .next 2>/dev/null || true

# Build the application
print_info "Building production application..."
if npm run build; then
    print_status "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Start services with PM2
print_info "Starting services with PM2..."
if npm run pm2:start; then
    print_status "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to start
print_info "Waiting for services to initialize..."
sleep 10

# Check service status
print_info "Checking service status..."
pm2 status

# Test endpoints
print_info "Testing endpoints..."

# Test frontend
if curl -s http://localhost:3007 > /dev/null; then
    print_status "Frontend is running on port 3007"
else
    print_warning "Frontend may not be ready yet"
fi

# Test backend API
if curl -s http://localhost:3006/api/sessions > /dev/null; then
    print_status "Backend API is running on port 3006"
else
    print_warning "Backend API may not be ready yet"
fi

echo ""
echo "🎉 WhatsApp Advanced WebApp Started Successfully!"
echo "================================================="
echo ""
echo "📱 Access URLs:"
echo "   Frontend:    http://100.115.3.36:3007"
echo "   Backend API: http://100.115.3.36:3006/api"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:    pm2 logs"
echo "   Monitor:      pm2 monit"
echo "   Restart:      pm2 restart all"
echo "   Stop:         pm2 stop all"
echo ""
echo "📊 Service Status:"
pm2 list

echo ""
print_status "Production deployment complete!"
