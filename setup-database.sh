#!/bin/bash

# 🗄️ WhatsApp Advanced Web App - Database Setup Script
# This script sets up PostgreSQL database for production deployment

echo "🗄️ WhatsApp Advanced Database Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="whatsapp_advanced"
DB_USER="whatsapp_user"
DB_PASSWORD="whatsapp_secure_password_2025"

echo -e "${BLUE}📋 Database Configuration:${NC}"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: [HIDDEN]"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed!${NC}"
    echo -e "${YELLOW}Installing PostgreSQL...${NC}"
    
    # Install PostgreSQL based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install postgresql
        brew services start postgresql
    else
        echo -e "${RED}❌ Unsupported OS. Please install PostgreSQL manually.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL is available${NC}"

# Start PostgreSQL service
echo -e "${YELLOW}🚀 Starting PostgreSQL service...${NC}"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql
fi

# Create database and user
echo -e "${YELLOW}📊 Creating database and user...${NC}"

# Create database and user as postgres superuser
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Grant additional privileges
ALTER USER $DB_USER CREATEDB;

\q
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database and user created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create database and user${NC}"
    exit 1
fi

# Run database schema setup
echo -e "${YELLOW}🏗️ Setting up database schema...${NC}"

# Connect to the database and run schema
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f database-setup.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema setup completed${NC}"
else
    echo -e "${RED}❌ Failed to setup database schema${NC}"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 'Database connection successful!' as status;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection test passed${NC}"
else
    echo -e "${RED}❌ Database connection test failed${NC}"
    exit 1
fi

# Update environment variables
echo -e "${YELLOW}⚙️ Updating environment variables...${NC}"

# Backup current .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo -e "${GREEN}✅ Backed up current .env.local${NC}"
fi

# Update database configuration in .env.local
sed -i.bak "s/DATABASE_TYPE=.*/DATABASE_TYPE=postgresql/" .env.local
sed -i.bak "s/DB_HOST=.*/DB_HOST=localhost/" .env.local
sed -i.bak "s/DB_PORT=.*/DB_PORT=5432/" .env.local
sed -i.bak "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env.local
sed -i.bak "s/DB_USER=.*/DB_USER=$DB_USER/" .env.local
sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env.local

echo -e "${GREEN}✅ Environment variables updated${NC}"

# Display connection information
echo ""
echo -e "${BLUE}🎯 Database Setup Complete!${NC}"
echo "=================================="
echo -e "${GREEN}✅ PostgreSQL Database Ready${NC}"
echo ""
echo -e "${BLUE}📋 Connection Details:${NC}"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: $DB_NAME"
echo "Username: $DB_USER"
echo "Password: [CONFIGURED]"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Restart your application: npm start"
echo "2. Application will now use PostgreSQL database"
echo "3. All data will be stored in server database"
echo ""
echo -e "${GREEN}🎉 Ready for production deployment!${NC}"
