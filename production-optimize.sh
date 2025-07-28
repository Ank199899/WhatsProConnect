#!/bin/bash

# 🚀 Production Optimization Script
# WhatsApp Advanced - Production Build & Deployment

echo "🚀 Production Optimization for WhatsApp Advanced"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
BUILD_DIR="build"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Function to display usage
usage() {
    echo "Usage: $0 -d domain.com"
    echo "Options:"
    echo "  -d DOMAIN    Your domain name (required)"
    echo "  -h           Show this help message"
    exit 1
}

# Parse command line arguments
while getopts "d:h" opt; do
    case $opt in
        d)
            DOMAIN="$OPTARG"
            ;;
        h)
            usage
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            usage
            ;;
    esac
done

# Check if domain is provided
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain is required${NC}"
    usage
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Build Directory: $BUILD_DIR"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Function to create backup
create_backup() {
    echo -e "${BLUE}💾 Creating backup...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup important files
    if [ -f ".env.local" ]; then
        cp .env.local "$BACKUP_DIR/"
    fi
    
    if [ -f "package.json" ]; then
        cp package.json "$BACKUP_DIR/"
    fi
    
    if [ -f "next.config.js" ]; then
        cp next.config.js "$BACKUP_DIR/"
    fi
    
    if [ -d "server" ]; then
        cp -r server "$BACKUP_DIR/"
    fi
    
    echo -e "${GREEN}✅ Backup created in $BACKUP_DIR${NC}"
}

# Function to optimize package.json
optimize_package_json() {
    echo -e "${BLUE}📦 Optimizing package.json...${NC}"
    
    if [ -f "package.json" ]; then
        # Add production scripts if not exists
        if command -v jq >/dev/null 2>&1; then
            # Use jq for JSON manipulation
            jq '.scripts["build:prod"] = "NODE_ENV=production next build"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["start:prod"] = "NODE_ENV=production next start -H 0.0.0.0 -p 3008"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["pm2:start"] = "pm2 start ecosystem.config.js"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["pm2:stop"] = "pm2 stop ecosystem.config.js"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["pm2:restart"] = "pm2 restart ecosystem.config.js"' package.json > package.json.tmp && mv package.json.tmp package.json
            
            echo -e "${GREEN}✅ package.json optimized${NC}"
        else
            echo -e "${YELLOW}⚠️ jq not found, manual package.json optimization recommended${NC}"
        fi
    fi
}

# Function to optimize Next.js configuration
optimize_next_config() {
    echo -e "${BLUE}⚙️ Optimizing Next.js configuration...${NC}"
    
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    
    return config
  },
  
  // Output configuration
  output: 'standalone',
  
  // Environment-specific configuration
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: process.env.NEXT_PUBLIC_APP_URL,
    publicRuntimeConfig: {
      domain: process.env.NEXT_PUBLIC_DOMAIN,
      protocol: process.env.NEXT_PUBLIC_PROTOCOL,
    },
  }),
}

module.exports = nextConfig
EOF

    echo -e "${GREEN}✅ Next.js configuration optimized${NC}"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    echo -e "${BLUE}🔧 Creating PM2 ecosystem configuration...${NC}"
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'whatsapp-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        NEXT_PUBLIC_APP_URL: 'https://$DOMAIN',
        NEXT_PUBLIC_API_URL: 'https://$DOMAIN/api',
        NEXT_PUBLIC_DOMAIN: '$DOMAIN',
        NEXT_PUBLIC_PROTOCOL: 'https'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'whatsapp-backend',
      script: './server/whatsapp-server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'whatsapp_advanced',
        DB_USER: 'whatsapp_user',
        DB_PASSWORD: 'whatsapp_secure_password_2025'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048'
    }
  ]
}
EOF

    # Create logs directory
    mkdir -p logs
    
    echo -e "${GREEN}✅ PM2 ecosystem configuration created${NC}"
}

# Function to optimize environment variables
optimize_environment() {
    echo -e "${BLUE}🌐 Optimizing environment variables...${NC}"
    
    # Update .env.local for production
    cat > .env.local << EOF
# 🚀 Production Environment Configuration
# WhatsApp Advanced - Optimized for $DOMAIN

# Application URLs
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_WS_URL=https://$DOMAIN
NEXT_PUBLIC_DOMAIN=$DOMAIN
NEXT_PUBLIC_PROTOCOL=https

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_advanced
DB_USER=whatsapp_user
DB_PASSWORD=whatsapp_secure_password_2025
DB_SSL=false

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_STORAGE_TYPE=postgresql
NEXT_PUBLIC_DISABLE_LOCAL_STORAGE=true
NEXT_PUBLIC_DISABLE_SESSION_STORAGE=true

# WhatsApp Configuration
WHATSAPP_SESSION_STORAGE=database
WHATSAPP_SERVER_PORT=3006

# Server Configuration
PORT=3008
HOSTNAME=0.0.0.0

# Security
SESSION_SECRET=whatsapp_advanced_session_secret_2025_$(openssl rand -hex 16)
JWT_SECRET=whatsapp_advanced_jwt_secret_2025_$(openssl rand -hex 16)
SESSION_COOKIE_DOMAIN=$DOMAIN
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN

# Performance
NEXT_TELEMETRY_DISABLED=1
DISABLE_ESLINT=true

# Logging
LOG_LEVEL=warn
LOG_TO_DATABASE=true
LOG_TO_FILE=true

# SSL Configuration
FORCE_HTTPS=true
TRUST_PROXY=true

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Monitoring
ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=30000
EOF

    echo -e "${GREEN}✅ Environment variables optimized${NC}"
}

# Function to build production version
build_production() {
    echo -e "${BLUE}🏗️ Building production version...${NC}"
    
    # Install dependencies
    echo -e "${BLUE}  Installing dependencies...${NC}"
    npm ci --only=production
    
    # Build the application
    echo -e "${BLUE}  Building Next.js application...${NC}"
    NODE_ENV=production npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Production build completed${NC}"
    else
        echo -e "${RED}❌ Production build failed${NC}"
        exit 1
    fi
}

# Function to optimize database
optimize_database() {
    echo -e "${BLUE}🗄️ Optimizing database...${NC}"
    
    # Create database optimization script
    cat > optimize-db.sql << EOF
-- Database optimization for production
-- WhatsApp Advanced

-- Analyze tables for better query planning
ANALYZE;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;

-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_session_timestamp ON messages(session_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_session_active ON contacts(session_id, is_group);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status, is_active);

-- Optimize PostgreSQL settings for production
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();

-- Vacuum and analyze all tables
VACUUM ANALYZE;
EOF

    echo -e "${GREEN}✅ Database optimization script created${NC}"
    echo -e "${YELLOW}⚠️ Run 'psql -U whatsapp_user -d whatsapp_advanced -f optimize-db.sql' to apply${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Create monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash

# Simple monitoring script for WhatsApp Advanced

LOG_FILE="/var/log/whatsapp-advanced-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log with timestamp
log_message() {
    echo "[$DATE] $1" >> $LOG_FILE
}

# Check if frontend is running
if curl -s http://localhost:3008 > /dev/null; then
    log_message "Frontend: OK"
else
    log_message "Frontend: DOWN"
    # Restart frontend if using PM2
    pm2 restart whatsapp-frontend 2>/dev/null
fi

# Check if backend is running
if curl -s http://localhost:3006/api/health > /dev/null; then
    log_message "Backend: OK"
else
    log_message "Backend: DOWN"
    # Restart backend if using PM2
    pm2 restart whatsapp-backend 2>/dev/null
fi

# Check database connection
if pg_isready -h localhost -p 5432 > /dev/null; then
    log_message "Database: OK"
else
    log_message "Database: DOWN"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log_message "Disk space: WARNING ($DISK_USAGE% used)"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 80 ]; then
    log_message "Memory usage: WARNING ($MEMORY_USAGE% used)"
fi
EOF

    chmod +x monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/monitor.sh") | crontab -
    
    echo -e "${GREEN}✅ Monitoring setup completed${NC}"
}

# Function to create systemd services
create_systemd_services() {
    echo -e "${BLUE}🔧 Creating systemd services...${NC}"
    
    # Frontend service
    sudo tee /etc/systemd/system/whatsapp-frontend.service > /dev/null << EOF
[Unit]
Description=WhatsApp Advanced Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3008
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Backend service
    sudo tee /etc/systemd/system/whatsapp-backend.service > /dev/null << EOF
[Unit]
Description=WhatsApp Advanced Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3006
ExecStart=/usr/bin/node server/whatsapp-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable whatsapp-frontend
    sudo systemctl enable whatsapp-backend
    
    echo -e "${GREEN}✅ Systemd services created${NC}"
}

# Function to display final information
display_final_info() {
    echo ""
    echo -e "${GREEN}🎉 Production optimization completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Optimizations Applied:${NC}"
    echo "✅ Next.js configuration optimized"
    echo "✅ PM2 ecosystem configuration created"
    echo "✅ Environment variables optimized"
    echo "✅ Production build completed"
    echo "✅ Database optimization script created"
    echo "✅ Monitoring setup completed"
    echo "✅ Systemd services created"
    echo ""
    echo -e "${BLUE}📋 Deployment Commands:${NC}"
    echo "PM2 Deployment:"
    echo "  npm install pm2 -g"
    echo "  pm2 start ecosystem.config.js"
    echo "  pm2 save"
    echo "  pm2 startup"
    echo ""
    echo "Systemd Deployment:"
    echo "  sudo systemctl start whatsapp-frontend"
    echo "  sudo systemctl start whatsapp-backend"
    echo ""
    echo -e "${BLUE}📋 URLs:${NC}"
    echo "Application: https://$DOMAIN"
    echo "API: https://$DOMAIN/api"
    echo "Health Check: https://$DOMAIN/health"
    echo ""
    echo -e "${YELLOW}⚠️ Next Steps:${NC}"
    echo "1. Apply database optimizations"
    echo "2. Start the application using PM2 or systemd"
    echo "3. Test all functionality"
    echo "4. Set up SSL certificate monitoring"
    echo "5. Configure log rotation"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting production optimization...${NC}"
    
    create_backup
    optimize_package_json
    optimize_next_config
    create_pm2_config
    optimize_environment
    build_production
    optimize_database
    setup_monitoring
    create_systemd_services
    display_final_info
    
    echo -e "${GREEN}✅ Production optimization completed!${NC}"
}

# Run main function
main "$@"
