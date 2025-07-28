#!/bin/bash

# 🗄️ PostgreSQL-Only Setup Script
# Configures the application to use only PostgreSQL database

echo "🗄️ PostgreSQL-Only Setup for WhatsApp Advanced"
echo "=============================================="

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

echo -e "${BLUE}📋 PostgreSQL-Only Configuration:${NC}"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Storage: PostgreSQL ONLY (no localStorage/SQLite)"
echo ""

# Function to check if PostgreSQL is running
check_postgresql() {
    echo -e "${BLUE}🔍 Checking PostgreSQL status...${NC}"
    
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -q; then
            echo -e "${GREEN}✅ PostgreSQL is running${NC}"
            return 0
        else
            echo -e "${RED}❌ PostgreSQL is not running${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ pg_isready not found, assuming PostgreSQL is available${NC}"
        return 0
    fi
}

# Function to setup database
setup_database() {
    echo -e "${BLUE}🗄️ Setting up PostgreSQL database...${NC}"
    
    # Run database setup script
    if [ -f "database-setup.sql" ]; then
        echo -e "${BLUE}📄 Running database setup script...${NC}"
        
        # Try to run with psql
        if command -v psql >/dev/null 2>&1; then
            PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f database-setup.sql
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Database setup completed${NC}"
            else
                echo -e "${RED}❌ Database setup failed${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️ psql not found, please run database-setup.sql manually${NC}"
        fi
    else
        echo -e "${RED}❌ database-setup.sql not found${NC}"
        return 1
    fi
}

# Function to run migration
run_migration() {
    echo -e "${BLUE}🔄 Running migration to PostgreSQL...${NC}"
    
    if [ -f "scripts/migrate-to-postgresql.js" ]; then
        echo -e "${BLUE}📄 Running migration script...${NC}"
        
        # Set environment variables
        export DB_HOST=localhost
        export DB_PORT=5432
        export DB_NAME=$DB_NAME
        export DB_USER=$DB_USER
        export DB_PASSWORD=$DB_PASSWORD
        
        # Run migration
        node scripts/migrate-to-postgresql.js
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration completed${NC}"
        else
            echo -e "${RED}❌ Migration failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Migration script not found${NC}"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    if [ -f "package.json" ]; then
        npm install
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Dependencies installed${NC}"
        else
            echo -e "${RED}❌ Failed to install dependencies${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ package.json not found${NC}"
        return 1
    fi
}

# Function to create environment file
create_env_file() {
    echo -e "${BLUE}📝 Creating environment configuration...${NC}"
    
    cat > .env.local << EOF
# 🗄️ PostgreSQL-Only Configuration
# All data storage uses PostgreSQL database

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false

# Application Configuration
NEXT_PUBLIC_STORAGE_TYPE=postgresql
NEXT_PUBLIC_DISABLE_LOCAL_STORAGE=true
NEXT_PUBLIC_DISABLE_SESSION_STORAGE=true

# WhatsApp Configuration
WHATSAPP_SESSION_STORAGE=database
WHATSAPP_SERVER_PORT=3002

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
SESSION_SECRET=whatsapp_advanced_session_secret_2025
JWT_SECRET=whatsapp_advanced_jwt_secret_2025

# Logging
LOG_LEVEL=info
LOG_TO_DATABASE=true
EOF

    echo -e "${GREEN}✅ Environment file created (.env.local)${NC}"
}

# Function to backup existing data
backup_existing_data() {
    echo -e "${BLUE}💾 Backing up existing data...${NC}"
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup sessions directory if exists
    if [ -d "sessions" ]; then
        cp -r sessions "$BACKUP_DIR/"
        echo -e "${GREEN}✅ Sessions backed up to $BACKUP_DIR/sessions${NC}"
    fi
    
    # Backup any SQLite files
    find . -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" | while read file; do
        cp "$file" "$BACKUP_DIR/"
        echo -e "${GREEN}✅ Database file backed up: $file${NC}"
    done
    
    echo -e "${GREEN}✅ Backup completed in $BACKUP_DIR${NC}"
}

# Function to cleanup old storage
cleanup_old_storage() {
    echo -e "${BLUE}🧹 Cleaning up old storage systems...${NC}"
    
    # Note: We don't actually delete files, just inform user
    echo -e "${YELLOW}⚠️ Manual cleanup recommended:${NC}"
    echo "   - Review and remove old session files in ./sessions/"
    echo "   - Clear browser localStorage/sessionStorage"
    echo "   - Remove any SQLite database files"
    echo "   - Update any hardcoded localStorage references"
    
    echo -e "${GREEN}✅ Cleanup notes provided${NC}"
}

# Function to verify setup
verify_setup() {
    echo -e "${BLUE}🔍 Verifying PostgreSQL-only setup...${NC}"
    
    # Check if database is accessible
    if command -v psql >/dev/null 2>&1; then
        PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 'PostgreSQL connection successful' as status;" >/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ PostgreSQL connection verified${NC}"
        else
            echo -e "${RED}❌ PostgreSQL connection failed${NC}"
            return 1
        fi
    fi
    
    # Check if required files exist
    local required_files=(
        "src/lib/server-storage.ts"
        "src/lib/storage-replacement.ts"
        "src/pages/api/storage/preferences.ts"
        "src/pages/api/storage/sessions.ts"
        "database-setup.sql"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file exists${NC}"
        else
            echo -e "${RED}❌ $file missing${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ Setup verification completed${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting PostgreSQL-only setup...${NC}"
    echo ""
    
    # Step 1: Check PostgreSQL
    if ! check_postgresql; then
        echo -e "${RED}❌ Please start PostgreSQL and try again${NC}"
        exit 1
    fi
    
    # Step 2: Backup existing data
    backup_existing_data
    
    # Step 3: Install dependencies
    install_dependencies
    
    # Step 4: Create environment file
    create_env_file
    
    # Step 5: Setup database
    setup_database
    
    # Step 6: Run migration
    run_migration
    
    # Step 7: Verify setup
    verify_setup
    
    # Step 8: Cleanup notes
    cleanup_old_storage
    
    echo ""
    echo -e "${GREEN}🎉 PostgreSQL-only setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Start the application: npm run dev"
    echo "2. All data will now be stored in PostgreSQL"
    echo "3. No more localStorage/sessionStorage/SQLite dependencies"
    echo "4. Review backup directory for old data"
    echo ""
    echo -e "${YELLOW}⚠️ Important:${NC}"
    echo "- Clear browser cache and localStorage"
    echo "- Update any custom code that uses localStorage"
    echo "- Test all functionality thoroughly"
    echo ""
}

# Run main function
main "$@"
