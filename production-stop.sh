#!/bin/bash

# 🛑 WhatsApp Advanced WebApp - Production Stop Script
# This script stops all WhatsApp application services

echo "🛑 Stopping WhatsApp Advanced WebApp"
echo "===================================="

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

# Stop PM2 processes
print_info "Stopping PM2 processes..."
if pm2 stop all; then
    print_status "PM2 processes stopped"
else
    print_warning "No PM2 processes were running"
fi

# Delete PM2 processes
print_info "Deleting PM2 processes..."
if pm2 delete all; then
    print_status "PM2 processes deleted"
else
    print_warning "No PM2 processes to delete"
fi

# Kill any remaining processes
print_info "Killing any remaining processes..."
pkill -f "next dev" 2>/dev/null && print_status "Killed Next.js dev processes" || true
pkill -f "next start" 2>/dev/null && print_status "Killed Next.js production processes" || true
pkill -f "whatsapp-server.js" 2>/dev/null && print_status "Killed WhatsApp server processes" || true

# Check if ports are free
print_info "Checking port status..."
if ss -tlnp | grep -q ":3007"; then
    print_warning "Port 3007 is still in use"
else
    print_status "Port 3007 is free"
fi

if ss -tlnp | grep -q ":3006"; then
    print_warning "Port 3006 is still in use"
else
    print_status "Port 3006 is free"
fi

echo ""
print_status "WhatsApp Advanced WebApp stopped successfully!"
echo ""
print_info "To start again, run: ./production-start.sh"
