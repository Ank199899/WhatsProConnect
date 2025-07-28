#!/bin/bash

# 🔒 SSL Certificate Setup Script
# WhatsApp Advanced - Domain SSL Configuration

echo "🔒 SSL Certificate Setup for WhatsApp Advanced"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DOMAIN=""
EMAIL=""
WEBROOT="/var/www/html"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Function to display usage
usage() {
    echo "Usage: $0 -d domain.com -e email@domain.com"
    echo "Options:"
    echo "  -d DOMAIN    Your domain name (required)"
    echo "  -e EMAIL     Email for Let's Encrypt (required)"
    echo "  -h           Show this help message"
    exit 1
}

# Parse command line arguments
while getopts "d:e:h" opt; do
    case $opt in
        d)
            DOMAIN="$OPTARG"
            ;;
        e)
            EMAIL="$OPTARG"
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

# Check if required parameters are provided
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Domain and email are required${NC}"
    usage
fi

echo -e "${BLUE}📋 Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Server IP: $(curl -s ifconfig.me)"
echo ""

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Please run as root (use sudo)${NC}"
        exit 1
    fi
}

# Function to install required packages
install_packages() {
    echo -e "${BLUE}📦 Installing required packages...${NC}"
    
    # Update package list
    apt update
    
    # Install nginx if not installed
    if ! command -v nginx >/dev/null 2>&1; then
        echo -e "${BLUE}📦 Installing Nginx...${NC}"
        apt install -y nginx
        systemctl enable nginx
        systemctl start nginx
    else
        echo -e "${GREEN}✅ Nginx already installed${NC}"
    fi
    
    # Install certbot
    if ! command -v certbot >/dev/null 2>&1; then
        echo -e "${BLUE}📦 Installing Certbot...${NC}"
        apt install -y certbot python3-certbot-nginx
    else
        echo -e "${GREEN}✅ Certbot already installed${NC}"
    fi
    
    # Install curl for testing
    if ! command -v curl >/dev/null 2>&1; then
        apt install -y curl
    fi
}

# Function to create nginx configuration
create_nginx_config() {
    echo -e "${BLUE}⚙️ Creating Nginx configuration...${NC}"
    
    # Create nginx config file
    cat > "$NGINX_AVAILABLE/whatsapp-advanced" << EOF
# WhatsApp Advanced - Domain Configuration
# Generated automatically by setup script

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Configuration (will be updated after SSL)
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # Temporary SSL configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main Application (Frontend)
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
        proxy_read_timeout 86400;
    }
    
    # API Routes (Backend)
    location /api/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:3006/api/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable the site
    ln -sf "$NGINX_AVAILABLE/whatsapp-advanced" "$NGINX_ENABLED/"
    
    # Remove default nginx site
    rm -f "$NGINX_ENABLED/default"
    
    # Test nginx configuration
    if nginx -t; then
        echo -e "${GREEN}✅ Nginx configuration created successfully${NC}"
        systemctl reload nginx
    else
        echo -e "${RED}❌ Nginx configuration error${NC}"
        exit 1
    fi
}

# Function to obtain SSL certificate
obtain_ssl_certificate() {
    echo -e "${BLUE}🔒 Obtaining SSL certificate...${NC}"
    
    # Create webroot directory
    mkdir -p $WEBROOT
    
    # Get SSL certificate
    certbot --nginx \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --redirect
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SSL certificate obtained successfully${NC}"
    else
        echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
        exit 1
    fi
}

# Function to setup auto-renewal
setup_auto_renewal() {
    echo -e "${BLUE}🔄 Setting up SSL auto-renewal...${NC}"
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renewal << EOF
# Renew SSL certificates twice daily
0 */12 * * * root certbot renew --quiet && systemctl reload nginx
EOF
    
    # Test renewal
    certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Auto-renewal setup successfully${NC}"
    else
        echo -e "${YELLOW}⚠️ Auto-renewal test failed, but certificate is still valid${NC}"
    fi
}

# Function to update application environment
update_app_environment() {
    echo -e "${BLUE}⚙️ Updating application environment...${NC}"
    
    # Update .env.local if it exists
    if [ -f ".env.local" ]; then
        # Backup existing file
        cp .env.local .env.local.backup
        
        # Update domain-related variables
        sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|g" .env.local
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN/api|g" .env.local
        
        echo -e "${GREEN}✅ Environment variables updated${NC}"
    else
        echo -e "${YELLOW}⚠️ .env.local not found, skipping environment update${NC}"
    fi
}

# Function to test domain access
test_domain_access() {
    echo -e "${BLUE}🧪 Testing domain access...${NC}"
    
    # Wait a moment for nginx to reload
    sleep 2
    
    # Test HTTP redirect
    echo -e "${BLUE}Testing HTTP redirect...${NC}"
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
    if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
        echo -e "${GREEN}✅ HTTP redirect working${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTP redirect may not be working (got $HTTP_RESPONSE)${NC}"
    fi
    
    # Test HTTPS access
    echo -e "${BLUE}Testing HTTPS access...${NC}"
    HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
    if [ "$HTTPS_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ HTTPS access working${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTPS access may not be working (got $HTTPS_RESPONSE)${NC}"
    fi
    
    # Test API endpoint
    echo -e "${BLUE}Testing API endpoint...${NC}"
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health)
    if [ "$API_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ API endpoint working${NC}"
    else
        echo -e "${YELLOW}⚠️ API endpoint may not be working (got $API_RESPONSE)${NC}"
    fi
}

# Function to display final information
display_final_info() {
    echo ""
    echo -e "${GREEN}🎉 Domain setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Access Information:${NC}"
    echo "Main Application: https://$DOMAIN"
    echo "API Endpoint: https://$DOMAIN/api"
    echo "Health Check: https://$DOMAIN/health"
    echo ""
    echo -e "${BLUE}📋 SSL Certificate Information:${NC}"
    echo "Certificate expires: $(certbot certificates | grep "Expiry Date" | head -1)"
    echo "Auto-renewal: Enabled (runs twice daily)"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Update your application's environment variables"
    echo "2. Test all functionality on the new domain"
    echo "3. Update any hardcoded URLs in your code"
    echo "4. Set up monitoring for the domain"
    echo ""
    echo -e "${YELLOW}⚠️ Important Notes:${NC}"
    echo "- DNS propagation may take up to 48 hours"
    echo "- SSL certificate will auto-renew every 90 days"
    echo "- Monitor nginx logs: /var/log/nginx/"
    echo "- Firewall ports 80 and 443 must be open"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting domain setup...${NC}"
    
    check_root
    install_packages
    create_nginx_config
    obtain_ssl_certificate
    setup_auto_renewal
    update_app_environment
    test_domain_access
    display_final_info
    
    echo -e "${GREEN}✅ Domain setup completed!${NC}"
}

# Run main function
main "$@"
