#!/bin/bash

# 🚀 WhatsApp Advanced WebApp - Portable Installer Creator
# Creates a complete portable installation package

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="whatsapp-advanced-webapp-portable-${TIMESTAMP}"
CURRENT_DIR=$(pwd)
BACKUP_DIR="/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250724_184918"

echo -e "${PURPLE}🚀 WhatsApp Advanced WebApp - Portable Installer Creator${NC}"
echo -e "${BLUE}Creating complete portable installation package...${NC}"
echo ""

# Create package directory
echo -e "${YELLOW}📁 Creating package directory...${NC}"
mkdir -p "$PACKAGE_NAME"
cd "$PACKAGE_NAME"

# Copy essential files (excluding node_modules for now)
echo -e "${YELLOW}📋 Copying application files...${NC}"
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='logs/*.log' \
    --exclude='.next' \
    --exclude='sessions/session-*' \
    --exclude='uploads/*' \
    --exclude='.git' \
    "$BACKUP_DIR/" ./

# Create portable installer script
echo -e "${YELLOW}🔧 Creating portable installer script...${NC}"
cat > install.sh << 'EOF'
#!/bin/bash

# 🚀 WhatsApp Advanced WebApp - Portable Installer
# One-click installation for any server

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/whatsapp-advanced-webapp"
SERVICE_USER="whatsapp"
CURRENT_DIR=$(pwd)

print_header() {
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║           🚀 WhatsApp Advanced WebApp Installer              ║${NC}"
    echo -e "${PURPLE}║                  Portable Installation                       ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
        exit 1
    fi
}

install_dependencies() {
    echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
    
    # Update package list
    apt update
    
    # Install Node.js 18
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PostgreSQL
    if ! command -v psql &> /dev/null; then
        apt-get install -y postgresql postgresql-contrib
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Install other dependencies
    apt-get install -y curl wget git nginx ufw
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

create_user() {
    echo -e "${YELLOW}👤 Creating service user...${NC}"
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$INSTALL_DIR" "$SERVICE_USER"
        echo -e "${GREEN}✅ User $SERVICE_USER created${NC}"
    else
        echo -e "${BLUE}ℹ️ User $SERVICE_USER already exists${NC}"
    fi
}

setup_application() {
    echo -e "${YELLOW}🏗️ Setting up application...${NC}"
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    
    # Copy application files
    cp -r "$CURRENT_DIR"/* "$INSTALL_DIR"/
    
    # Set ownership
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    
    # Create necessary directories
    mkdir -p "$INSTALL_DIR"/{logs,sessions,uploads,data}
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"/{logs,sessions,uploads,data}
    
    echo -e "${GREEN}✅ Application files copied${NC}"
}

install_node_modules() {
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" npm install --production
    
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
}

setup_database() {
    echo -e "${YELLOW}🗄️ Setting up PostgreSQL database...${NC}"
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql << EOSQL
CREATE DATABASE whatsapp_advanced;
CREATE USER whatsapp_user WITH ENCRYPTED PASSWORD 'whatsapp_secure_password_2025';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_advanced TO whatsapp_user;
ALTER USER whatsapp_user CREATEDB;
\q
EOSQL
    
    # Import database schema
    if [ -f "$INSTALL_DIR/init-db.sql" ]; then
        sudo -u postgres psql -d whatsapp_advanced -f "$INSTALL_DIR/init-db.sql"
    fi
    
    echo -e "${GREEN}✅ Database setup completed${NC}"
}

build_application() {
    echo -e "${YELLOW}🏗️ Building application...${NC}"
    
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" npm run build
    
    echo -e "${GREEN}✅ Application built successfully${NC}"
}

create_systemd_services() {
    echo -e "${YELLOW}⚙️ Creating systemd services...${NC}"
    
    # WhatsApp Backend Service
    cat > /etc/systemd/system/whatsapp-backend.service << EOSERVICE
[Unit]
Description=WhatsApp Advanced WebApp Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/server
ExecStart=/usr/bin/node whatsapp-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOSERVICE

    # WhatsApp Frontend Service
    cat > /etc/systemd/system/whatsapp-frontend.service << EOSERVICE
[Unit]
Description=WhatsApp Advanced WebApp Frontend
After=network.target whatsapp-backend.service
Wants=whatsapp-backend.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3008

[Install]
WantedBy=multi-user.target
EOSERVICE

    # Reload systemd
    systemctl daemon-reload
    
    echo -e "${GREEN}✅ Systemd services created${NC}"
}

setup_nginx() {
    echo -e "${YELLOW}🌐 Setting up Nginx reverse proxy...${NC}"
    
    cat > /etc/nginx/sites-available/whatsapp-app << 'EONGINX'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EONGINX

    # Enable site
    ln -sf /etc/nginx/sites-available/whatsapp-app /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx configured${NC}"
}

setup_firewall() {
    echo -e "${YELLOW}🔥 Setting up firewall...${NC}"
    
    ufw --force enable
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
}

start_services() {
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    
    # Enable and start services
    systemctl enable whatsapp-backend whatsapp-frontend nginx
    systemctl start whatsapp-backend
    sleep 5
    systemctl start whatsapp-frontend
    systemctl start nginx
    
    echo -e "${GREEN}✅ Services started${NC}"
}

show_results() {
    echo ""
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Access Information:${NC}"
    echo -e "${YELLOW}   🌐 Web Interface: http://$(hostname -I | awk '{print $1}')${NC}"
    echo -e "${YELLOW}   🌐 Local Access: http://localhost${NC}"
    echo -e "${YELLOW}   📱 Backend API: http://$(hostname -I | awk '{print $1}')/api${NC}"
    echo ""
    echo -e "${CYAN}🔧 Service Management:${NC}"
    echo -e "${YELLOW}   Start: sudo systemctl start whatsapp-backend whatsapp-frontend${NC}"
    echo -e "${YELLOW}   Stop: sudo systemctl stop whatsapp-backend whatsapp-frontend${NC}"
    echo -e "${YELLOW}   Status: sudo systemctl status whatsapp-backend whatsapp-frontend${NC}"
    echo ""
    echo -e "${CYAN}📁 Installation Directory: $INSTALL_DIR${NC}"
    echo -e "${CYAN}👤 Service User: $SERVICE_USER${NC}"
    echo ""
}

# Main installation function
main() {
    print_header
    
    check_root
    install_dependencies
    create_user
    setup_application
    install_node_modules
    setup_database
    build_application
    create_systemd_services
    setup_nginx
    setup_firewall
    start_services
    
    show_results
}

# Run installation
main "$@"
EOF

chmod +x install.sh

# Create README for the package
echo -e "${YELLOW}📝 Creating package documentation...${NC}"
cat > README.md << 'EOREADME'
# 🚀 WhatsApp Advanced WebApp - Portable Installation Package

## 📋 What's Included

This portable package contains everything needed to run WhatsApp Advanced WebApp on any Linux server.

### ✨ Features
- 📱 Complete WhatsApp Web integration
- 🔄 Multi-session support
- 💬 Bulk messaging capabilities
- 📊 Advanced analytics
- 🔐 Secure authentication
- 🌐 Modern web interface
- 📱 Mobile responsive design

## 🚀 Quick Installation

### Prerequisites
- Linux server (Ubuntu 18.04+ recommended)
- Root access (sudo)
- Internet connection

### One-Command Installation
```bash
sudo ./install.sh
```

That's it! The installer will:
1. ✅ Install all dependencies (Node.js, PostgreSQL, Nginx)
2. ✅ Create system user and directories
3. ✅ Set up database
4. ✅ Build and configure application
5. ✅ Create systemd services
6. ✅ Configure Nginx reverse proxy
7. ✅ Set up firewall
8. ✅ Start all services

## 🌐 Access Your Application

After installation:
- **Web Interface**: http://YOUR_SERVER_IP
- **Local Access**: http://localhost
- **API Endpoint**: http://YOUR_SERVER_IP/api

## 🔧 Service Management

```bash
# Start services
sudo systemctl start whatsapp-backend whatsapp-frontend

# Stop services
sudo systemctl stop whatsapp-backend whatsapp-frontend

# Check status
sudo systemctl status whatsapp-backend whatsapp-frontend

# View logs
sudo journalctl -u whatsapp-backend -f
sudo journalctl -u whatsapp-frontend -f
```

## 📁 Directory Structure

```
/opt/whatsapp-advanced-webapp/
├── src/                 # Frontend source code
├── server/              # Backend server
├── sessions/            # WhatsApp sessions
├── uploads/             # File uploads
├── logs/                # Application logs
├── package.json         # Dependencies
└── ...
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 80, 3001, 3008 are available
2. **Database connection**: Ensure PostgreSQL is running
3. **Permissions**: Check file ownership for /opt/whatsapp-advanced-webapp

### Support Commands

```bash
# Check service status
sudo systemctl status whatsapp-backend whatsapp-frontend nginx postgresql

# Check logs
sudo tail -f /opt/whatsapp-advanced-webapp/logs/*.log

# Restart all services
sudo systemctl restart whatsapp-backend whatsapp-frontend nginx
```

## 🔒 Security

- Application runs as dedicated user 'whatsapp'
- Firewall configured to allow only necessary ports
- Database secured with strong password
- Nginx reverse proxy for additional security

## 📞 Support

For issues or questions, check the logs and ensure all services are running properly.

---

**Created**: $(date)
**Version**: Portable Installation Package
**Platform**: Linux (Ubuntu/Debian)
EOREADME

# Create uninstaller script
echo -e "${YELLOW}🗑️ Creating uninstaller script...${NC}"
cat > uninstall.sh << 'EOUNINSTALL'
#!/bin/bash

# 🗑️ WhatsApp Advanced WebApp - Uninstaller

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

INSTALL_DIR="/opt/whatsapp-advanced-webapp"
SERVICE_USER="whatsapp"

echo -e "${YELLOW}🗑️ WhatsApp Advanced WebApp Uninstaller${NC}"
echo ""

# Confirm uninstallation
read -p "Are you sure you want to completely remove WhatsApp Advanced WebApp? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Uninstallation cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}🛑 Stopping services...${NC}"
systemctl stop whatsapp-backend whatsapp-frontend 2>/dev/null || true
systemctl disable whatsapp-backend whatsapp-frontend 2>/dev/null || true

echo -e "${YELLOW}🗑️ Removing systemd services...${NC}"
rm -f /etc/systemd/system/whatsapp-backend.service
rm -f /etc/systemd/system/whatsapp-frontend.service
systemctl daemon-reload

echo -e "${YELLOW}🌐 Removing Nginx configuration...${NC}"
rm -f /etc/nginx/sites-available/whatsapp-app
rm -f /etc/nginx/sites-enabled/whatsapp-app
systemctl reload nginx 2>/dev/null || true

echo -e "${YELLOW}🗄️ Removing database...${NC}"
sudo -u postgres psql << EOSQL
DROP DATABASE IF EXISTS whatsapp_advanced;
DROP USER IF EXISTS whatsapp_user;
\q
EOSQL

echo -e "${YELLOW}📁 Removing application files...${NC}"
rm -rf "$INSTALL_DIR"

echo -e "${YELLOW}👤 Removing service user...${NC}"
userdel "$SERVICE_USER" 2>/dev/null || true

echo -e "${GREEN}✅ WhatsApp Advanced WebApp has been completely removed.${NC}"
EOUNINSTALL

chmod +x uninstall.sh

# Create quick start script
echo -e "${YELLOW}⚡ Creating quick start script...${NC}"
cat > quick-start.sh << 'EOQUICK'
#!/bin/bash

# ⚡ Quick Start Script - For already installed applications

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}⚡ WhatsApp Advanced WebApp - Quick Start${NC}"
echo ""

# Check if installed
if [ ! -d "/opt/whatsapp-advanced-webapp" ]; then
    echo -e "${RED}❌ Application not installed. Run ./install.sh first.${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Starting all services...${NC}"

# Start services
sudo systemctl start postgresql
sudo systemctl start whatsapp-backend
sleep 3
sudo systemctl start whatsapp-frontend
sudo systemctl start nginx

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

# Check status
echo -e "${BLUE}📊 Service Status:${NC}"
systemctl is-active --quiet whatsapp-backend && echo -e "${GREEN}✅ Backend: Running${NC}" || echo -e "${RED}❌ Backend: Not running${NC}"
systemctl is-active --quiet whatsapp-frontend && echo -e "${GREEN}✅ Frontend: Running${NC}" || echo -e "${RED}❌ Frontend: Not running${NC}"
systemctl is-active --quiet nginx && echo -e "${GREEN}✅ Nginx: Running${NC}" || echo -e "${RED}❌ Nginx: Not running${NC}"

echo ""
echo -e "${GREEN}🌐 Access your application at: http://$(hostname -I | awk '{print $1}')${NC}"
echo ""
EOQUICK

chmod +x quick-start.sh

# Create package info file
echo -e "${YELLOW}📋 Creating package information...${NC}"
cat > PACKAGE_INFO.txt << EOINFO
WhatsApp Advanced WebApp - Portable Installation Package
========================================================

Package Created: $(date)
Package Version: Portable-${TIMESTAMP}
Source: WhatsApp Advanced WebApp Backup

Contents:
- Complete application source code
- Installation script (install.sh)
- Uninstallation script (uninstall.sh)
- Quick start script (quick-start.sh)
- Documentation (README.md)

Installation Requirements:
- Linux server (Ubuntu 18.04+ recommended)
- Root access (sudo)
- Internet connection for dependencies
- Minimum 2GB RAM
- Minimum 10GB disk space

Included Services:
- WhatsApp Backend Server (Port 3001)
- Next.js Frontend (Port 3008)
- PostgreSQL Database (Port 5432)
- Nginx Reverse Proxy (Port 80)

Installation Command:
sudo ./install.sh

Access After Installation:
http://YOUR_SERVER_IP

Support:
Check README.md for troubleshooting and service management.
EOINFO

echo -e "${GREEN}✅ Portable installer package created successfully!${NC}"
echo ""
echo -e "${CYAN}📦 Package Details:${NC}"
echo -e "${YELLOW}   📁 Package Name: $PACKAGE_NAME${NC}"
echo -e "${YELLOW}   📍 Location: $(pwd)${NC}"
echo -e "${YELLOW}   📋 Files Created:${NC}"
echo -e "${YELLOW}      - install.sh (Main installer)${NC}"
echo -e "${YELLOW}      - uninstall.sh (Complete removal)${NC}"
echo -e "${YELLOW}      - quick-start.sh (Start services)${NC}"
echo -e "${YELLOW}      - README.md (Documentation)${NC}"
echo -e "${YELLOW}      - PACKAGE_INFO.txt (Package details)${NC}"
echo ""
echo -e "${BLUE}📦 Creating compressed package...${NC}"

# Go back to parent directory
cd "$CURRENT_DIR"

# Create compressed archive
echo -e "${YELLOW}🗜️ Compressing package...${NC}"
tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"

# Calculate package size
PACKAGE_SIZE=$(du -sh "${PACKAGE_NAME}.tar.gz" | cut -f1)

echo ""
echo -e "${GREEN}🎉 PORTABLE INSTALLATION PACKAGE CREATED SUCCESSFULLY! 🎉${NC}"
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    📦 PACKAGE SUMMARY                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📁 Package Name: ${PACKAGE_NAME}.tar.gz${NC}"
echo -e "${YELLOW}📊 Package Size: $PACKAGE_SIZE${NC}"
echo -e "${YELLOW}📍 Location: $(pwd)/${PACKAGE_NAME}.tar.gz${NC}"
echo ""
echo -e "${CYAN}🚀 INSTALLATION INSTRUCTIONS:${NC}"
echo -e "${YELLOW}1. Copy ${PACKAGE_NAME}.tar.gz to your target server${NC}"
echo -e "${YELLOW}2. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz${NC}"
echo -e "${YELLOW}3. Enter directory: cd $PACKAGE_NAME${NC}"
echo -e "${YELLOW}4. Run installer: sudo ./install.sh${NC}"
echo -e "${YELLOW}5. Access app: http://YOUR_SERVER_IP${NC}"
echo ""
echo -e "${CYAN}📋 PACKAGE CONTENTS:${NC}"
echo -e "${YELLOW}   ✅ Complete application source code${NC}"
echo -e "${YELLOW}   ✅ Automated installer script${NC}"
echo -e "${YELLOW}   ✅ Uninstaller script${NC}"
echo -e "${YELLOW}   ✅ Quick start script${NC}"
echo -e "${YELLOW}   ✅ Complete documentation${NC}"
echo -e "${YELLOW}   ✅ Database setup scripts${NC}"
echo -e "${YELLOW}   ✅ Nginx configuration${NC}"
echo -e "${YELLOW}   ✅ Systemd service files${NC}"
echo ""
echo -e "${GREEN}🎯 READY FOR DEPLOYMENT ON ANY LINUX SERVER! 🎯${NC}"
echo ""

# Create deployment instructions file
cat > "${PACKAGE_NAME}_DEPLOYMENT_GUIDE.txt" << EODEPLOY
🚀 WhatsApp Advanced WebApp - Deployment Guide
==============================================

Package: ${PACKAGE_NAME}.tar.gz
Created: $(date)
Size: $PACKAGE_SIZE

QUICK DEPLOYMENT STEPS:
======================

1. UPLOAD PACKAGE TO SERVER:
   scp ${PACKAGE_NAME}.tar.gz user@your-server:/tmp/

2. CONNECT TO SERVER:
   ssh user@your-server

3. EXTRACT PACKAGE:
   cd /tmp
   tar -xzf ${PACKAGE_NAME}.tar.gz
   cd $PACKAGE_NAME

4. RUN INSTALLER:
   sudo ./install.sh

5. ACCESS APPLICATION:
   http://YOUR_SERVER_IP

WHAT THE INSTALLER DOES:
=======================
✅ Installs Node.js 18
✅ Installs PostgreSQL
✅ Installs PM2 process manager
✅ Installs Nginx web server
✅ Creates system user 'whatsapp'
✅ Sets up database and tables
✅ Builds application
✅ Creates systemd services
✅ Configures Nginx reverse proxy
✅ Sets up firewall rules
✅ Starts all services

SYSTEM REQUIREMENTS:
===================
- Linux server (Ubuntu 18.04+ recommended)
- Root access (sudo)
- Internet connection
- Minimum 2GB RAM
- Minimum 10GB disk space
- Ports 80, 3001, 3008, 5432 available

POST-INSTALLATION:
==================
- Web Interface: http://YOUR_SERVER_IP
- Service Management: systemctl start/stop/status whatsapp-backend whatsapp-frontend
- Logs: /opt/whatsapp-advanced-webapp/logs/
- Configuration: /opt/whatsapp-advanced-webapp/

UNINSTALLATION:
===============
To completely remove the application:
sudo ./uninstall.sh

SUPPORT:
========
Check README.md in the package for detailed troubleshooting.

Happy Deployment! 🚀
EODEPLOY

echo -e "${BLUE}📝 Deployment guide created: ${PACKAGE_NAME}_DEPLOYMENT_GUIDE.txt${NC}"
echo ""
