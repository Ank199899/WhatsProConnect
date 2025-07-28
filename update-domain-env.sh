#!/bin/bash

# 🌐 Domain Environment Update Script
# Updates application environment variables for domain usage

echo "🌐 Domain Environment Update for WhatsApp Advanced"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DOMAIN=""
PROTOCOL="https"

# Function to display usage
usage() {
    echo "Usage: $0 -d domain.com [-p http|https]"
    echo "Options:"
    echo "  -d DOMAIN    Your domain name (required)"
    echo "  -p PROTOCOL  Protocol to use (default: https)"
    echo "  -h           Show this help message"
    exit 1
}

# Parse command line arguments
while getopts "d:p:h" opt; do
    case $opt in
        d)
            DOMAIN="$OPTARG"
            ;;
        p)
            PROTOCOL="$OPTARG"
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
echo "Protocol: $PROTOCOL"
echo "App URL: $PROTOCOL://$DOMAIN"
echo "API URL: $PROTOCOL://$DOMAIN/api"
echo ""

# Function to update .env.local
update_env_local() {
    echo -e "${BLUE}⚙️ Updating .env.local...${NC}"
    
    if [ -f ".env.local" ]; then
        # Backup existing file
        cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✅ Backup created: .env.local.backup.$(date +%Y%m%d_%H%M%S)${NC}"
        
        # Update or add domain-related variables
        update_or_add_env_var "NEXT_PUBLIC_APP_URL" "$PROTOCOL://$DOMAIN"
        update_or_add_env_var "NEXT_PUBLIC_API_URL" "$PROTOCOL://$DOMAIN/api"
        update_or_add_env_var "NEXT_PUBLIC_WS_URL" "$PROTOCOL://$DOMAIN"
        update_or_add_env_var "NEXT_PUBLIC_DOMAIN" "$DOMAIN"
        update_or_add_env_var "NEXT_PUBLIC_PROTOCOL" "$PROTOCOL"
        
        # Update CORS origins
        update_or_add_env_var "CORS_ORIGIN" "$PROTOCOL://$DOMAIN,$PROTOCOL://www.$DOMAIN"
        
        # Update session cookie domain
        update_or_add_env_var "SESSION_COOKIE_DOMAIN" "$DOMAIN"
        
        echo -e "${GREEN}✅ .env.local updated successfully${NC}"
    else
        echo -e "${BLUE}📄 Creating new .env.local file...${NC}"
        create_new_env_file
        echo -e "${GREEN}✅ .env.local created successfully${NC}"
    fi
}

# Function to update or add environment variable
update_or_add_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    if grep -q "^${var_name}=" .env.local; then
        # Variable exists, update it
        sed -i "s|^${var_name}=.*|${var_name}=${var_value}|g" .env.local
        echo -e "${BLUE}  Updated: ${var_name}=${var_value}${NC}"
    else
        # Variable doesn't exist, add it
        echo "${var_name}=${var_value}" >> .env.local
        echo -e "${BLUE}  Added: ${var_name}=${var_value}${NC}"
    fi
}

# Function to create new .env.local file
create_new_env_file() {
    cat > .env.local << EOF
# 🌐 Domain Configuration
# Generated automatically by domain setup script

# Application URLs
NEXT_PUBLIC_APP_URL=$PROTOCOL://$DOMAIN
NEXT_PUBLIC_API_URL=$PROTOCOL://$DOMAIN/api
NEXT_PUBLIC_WS_URL=$PROTOCOL://$DOMAIN
NEXT_PUBLIC_DOMAIN=$DOMAIN
NEXT_PUBLIC_PROTOCOL=$PROTOCOL

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_advanced
DB_USER=whatsapp_user
DB_PASSWORD=whatsapp_secure_password_2025
DB_SSL=false

# Application Configuration
NEXT_PUBLIC_STORAGE_TYPE=postgresql
NEXT_PUBLIC_DISABLE_LOCAL_STORAGE=true
NEXT_PUBLIC_DISABLE_SESSION_STORAGE=true

# WhatsApp Configuration
WHATSAPP_SESSION_STORAGE=database
WHATSAPP_SERVER_PORT=3006

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
SESSION_SECRET=whatsapp_advanced_session_secret_2025
JWT_SECRET=whatsapp_advanced_jwt_secret_2025
SESSION_COOKIE_DOMAIN=$DOMAIN

# CORS Configuration
CORS_ORIGIN=$PROTOCOL://$DOMAIN,$PROTOCOL://www.$DOMAIN

# Logging
LOG_LEVEL=info
LOG_TO_DATABASE=true

# SSL Configuration
FORCE_HTTPS=true
TRUST_PROXY=true
EOF
}

# Function to update package.json scripts
update_package_json() {
    echo -e "${BLUE}⚙️ Updating package.json scripts...${NC}"
    
    if [ -f "package.json" ]; then
        # Backup package.json
        cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)
        
        # Update start script for production
        if command -v jq >/dev/null 2>&1; then
            # Use jq if available
            jq '.scripts.start = "next start -H 0.0.0.0 -p 3008"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["start:prod"] = "NODE_ENV=production next start -H 0.0.0.0 -p 3008"' package.json > package.json.tmp && mv package.json.tmp package.json
            echo -e "${GREEN}✅ package.json updated with jq${NC}"
        else
            # Manual update without jq
            echo -e "${YELLOW}⚠️ jq not found, manual package.json update recommended${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ package.json not found${NC}"
    fi
}

# Function to update next.config.js
update_next_config() {
    echo -e "${BLUE}⚙️ Updating Next.js configuration...${NC}"
    
    if [ -f "next.config.js" ]; then
        # Backup next.config.js
        cp next.config.js next.config.js.backup.$(date +%Y%m%d_%H%M%S)
        
        # Check if domain configuration exists
        if ! grep -q "assetPrefix" next.config.js; then
            echo -e "${BLUE}  Adding domain configuration to next.config.js...${NC}"
            
            # Create updated config (basic approach)
            cat >> next.config.js << EOF

// Domain configuration added by setup script
if (process.env.NODE_ENV === 'production') {
  module.exports.assetPrefix = '$PROTOCOL://$DOMAIN'
  module.exports.publicRuntimeConfig = {
    ...module.exports.publicRuntimeConfig,
    domain: '$DOMAIN',
    protocol: '$PROTOCOL'
  }
}
EOF
        fi
        
        echo -e "${GREEN}✅ Next.js configuration updated${NC}"
    else
        echo -e "${YELLOW}⚠️ next.config.js not found${NC}"
    fi
}

# Function to update server configuration
update_server_config() {
    echo -e "${BLUE}⚙️ Updating server configuration...${NC}"
    
    # Update WhatsApp server configuration if exists
    if [ -f "server/whatsapp-server.js" ]; then
        # Backup server file
        cp server/whatsapp-server.js server/whatsapp-server.js.backup.$(date +%Y%m%d_%H%M%S)
        
        # Update CORS origins in server file
        sed -i "s|origin: \".*\"|origin: [\"$PROTOCOL://$DOMAIN\", \"$PROTOCOL://www.$DOMAIN\"]|g" server/whatsapp-server.js
        
        echo -e "${GREEN}✅ Server configuration updated${NC}"
    fi
}

# Function to restart services
restart_services() {
    echo -e "${BLUE}🔄 Restarting services...${NC}"
    
    # Check if PM2 is being used
    if command -v pm2 >/dev/null 2>&1; then
        echo -e "${BLUE}  Restarting PM2 processes...${NC}"
        pm2 restart all
        echo -e "${GREEN}✅ PM2 processes restarted${NC}"
    fi
    
    # Check if systemd services exist
    if systemctl is-active --quiet nginx; then
        echo -e "${BLUE}  Reloading Nginx...${NC}"
        systemctl reload nginx
        echo -e "${GREEN}✅ Nginx reloaded${NC}"
    fi
    
    echo -e "${YELLOW}⚠️ Please manually restart your application servers${NC}"
    echo -e "${BLUE}  Frontend: npm run dev (or your production command)${NC}"
    echo -e "${BLUE}  Backend: node server/whatsapp-server.js${NC}"
}

# Function to verify configuration
verify_configuration() {
    echo -e "${BLUE}🧪 Verifying configuration...${NC}"
    
    # Check if .env.local has correct values
    if [ -f ".env.local" ]; then
        echo -e "${BLUE}  Checking environment variables...${NC}"
        
        if grep -q "NEXT_PUBLIC_APP_URL=$PROTOCOL://$DOMAIN" .env.local; then
            echo -e "${GREEN}  ✅ APP_URL configured correctly${NC}"
        else
            echo -e "${RED}  ❌ APP_URL not configured correctly${NC}"
        fi
        
        if grep -q "NEXT_PUBLIC_API_URL=$PROTOCOL://$DOMAIN/api" .env.local; then
            echo -e "${GREEN}  ✅ API_URL configured correctly${NC}"
        else
            echo -e "${RED}  ❌ API_URL not configured correctly${NC}"
        fi
    fi
    
    # Test if domain resolves to current server
    echo -e "${BLUE}  Testing DNS resolution...${NC}"
    DOMAIN_IP=$(nslookup $DOMAIN | grep "Address:" | tail -1 | awk '{print $2}')
    SERVER_IP=$(curl -s ifconfig.me)
    
    if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
        echo -e "${GREEN}  ✅ Domain resolves to this server${NC}"
    else
        echo -e "${YELLOW}  ⚠️ Domain IP ($DOMAIN_IP) != Server IP ($SERVER_IP)${NC}"
        echo -e "${YELLOW}     DNS propagation may still be in progress${NC}"
    fi
}

# Function to display final information
display_final_info() {
    echo ""
    echo -e "${GREEN}🎉 Domain environment update completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Updated Configuration:${NC}"
    echo "App URL: $PROTOCOL://$DOMAIN"
    echo "API URL: $PROTOCOL://$DOMAIN/api"
    echo "WebSocket URL: $PROTOCOL://$DOMAIN"
    echo ""
    echo -e "${BLUE}📋 Files Updated:${NC}"
    echo "- .env.local (with backup)"
    echo "- package.json (if jq available)"
    echo "- next.config.js (if exists)"
    echo "- server/whatsapp-server.js (if exists)"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Restart your application servers"
    echo "2. Test the application on the new domain"
    echo "3. Update any hardcoded URLs in your code"
    echo "4. Set up monitoring for the domain"
    echo ""
    echo -e "${YELLOW}⚠️ Important:${NC}"
    echo "- Clear browser cache after testing"
    echo "- Update any external integrations with new URLs"
    echo "- Monitor application logs for any issues"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting domain environment update...${NC}"
    
    update_env_local
    update_package_json
    update_next_config
    update_server_config
    verify_configuration
    restart_services
    display_final_info
    
    echo -e "${GREEN}✅ Domain environment update completed!${NC}"
}

# Run main function
main "$@"
