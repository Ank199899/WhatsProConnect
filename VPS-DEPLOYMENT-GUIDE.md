# 🚀 WhatsPro Connect - Ubuntu 24 VPS Deployment Guide

## 📱 **Software Overview**

**WhatsPro Connect** ek powerful WhatsApp management solution hai jo aapko multiple WhatsApp numbers connect karne, real-time messaging, bulk messaging, aur analytics provide karta hai.

### **🌟 Key Features:**
- ✅ **Multiple WhatsApp Sessions**: Unlimited WhatsApp numbers
- ✅ **Real-time Messaging**: Live chat interface
- ✅ **Bulk Messaging**: Multiple contacts ko messages
- ✅ **Contact Management**: Organize contacts
- ✅ **Analytics Dashboard**: Performance tracking
- ✅ **Modern UI**: Next.js + Tailwind CSS
- ✅ **Database Integration**: PostgreSQL/SQLite

### **🏗️ Technical Stack:**
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS (Port: 3008)
- **Backend**: Node.js + Express + Socket.IO (Port: 3006)
- **WhatsApp**: whatsapp-web.js library
- **Database**: PostgreSQL (production)
- **Process Manager**: PM2
- **Authentication**: JWT + bcrypt

---

## 🌐 **Ubuntu 24 VPS Server Deployment**

### **Step 1: Server Preparation**

```bash
# Server update karo
sudo apt update && sudo apt upgrade -y

# Required packages install karo
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx git curl

# Node.js 20 install karo
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 globally install karo
sudo npm install -g pm2

# Verify installations
node --version    # Should be v20.x
npm --version     # Should be 10.x
pm2 --version     # Should be latest
```

### **Step 2: Code Upload & Setup**

```bash
# Code download karo
git clone https://github.com/Ank199899/WhatsProConnect.git
cd WhatsProConnect

# Dependencies install karo
npm install

# Build application
npm run build
```

### **Step 3: Database Setup**

```bash
# PostgreSQL setup karo
sudo -u postgres psql

# Database create karo
CREATE DATABASE whatsapp_advanced;
CREATE USER whatsapp_user WITH PASSWORD 'your_secure_password_2025';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_advanced TO whatsapp_user;
ALTER USER whatsapp_user CREATEDB;
\q

# Database schema run karo
psql -U whatsapp_user -d whatsapp_advanced -f init-db.sql
```

### **Step 4: Environment Configuration**

```bash
# Environment file create karo
cp .env.local .env.production

# Edit environment variables
nano .env.production
```

**Environment Variables (.env.production):**
```env
# Production Configuration
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
DB_PASSWORD=your_secure_password_2025
DB_SSL=false

# Application URLs (Replace YOUR_VPS_IP)
NEXT_PUBLIC_APP_URL=http://YOUR_VPS_IP:3008
WHATSAPP_BACKEND_URL=http://YOUR_VPS_IP:3006

# Security
JWT_SECRET=your_super_secure_jwt_secret_2025
BCRYPT_ROUNDS=12

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
MAX_CONCURRENT_SESSIONS=100
BULK_MESSAGE_DELAY=2000

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### **Step 5: PM2 Production Deployment**

```bash
# PM2 se start karo
npm run pm2:start

# PM2 status check karo
pm2 list

# PM2 logs dekho
pm2 logs

# PM2 monitoring
pm2 monit

# Auto-startup enable karo
pm2 startup
pm2 save
```

### **Step 6: Nginx Configuration**

```bash
# Nginx config file create karo
sudo nano /etc/nginx/sites-available/whatsproconnect

# Nginx configuration add karo:
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/whatsproconnect /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### **Step 7: Firewall Configuration**

```bash
# UFW enable karo
sudo ufw enable

# Required ports open karo
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3008    # Frontend (optional)
sudo ufw allow 3006    # Backend (optional)

# Firewall status check karo
sudo ufw status
```

### **Step 8: SSL Certificate (Optional)**

```bash
# Certbot install karo
sudo apt install certbot python3-certbot-nginx

# SSL certificate obtain karo (if you have domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🎯 **Access Your Application**

### **URLs:**
- **Main App**: http://YOUR_VPS_IP (via Nginx)
- **Direct Frontend**: http://YOUR_VPS_IP:3008
- **Backend API**: http://YOUR_VPS_IP:3006
- **Health Check**: http://YOUR_VPS_IP:3006/api/health

### **Default Login:**
- **Username**: admin123
- **Password**: Ankit@199899

---

## 🛠️ **Management Commands**

### **PM2 Commands:**
```bash
# Status check
pm2 list

# Logs dekho
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Delete services
pm2 delete all

# Monitoring
pm2 monit
```

### **Database Commands:**
```bash
# Database connect
psql -U whatsapp_user -d whatsapp_advanced

# Backup database
pg_dump -U whatsapp_user whatsapp_advanced > backup.sql

# Restore database
psql -U whatsapp_user -d whatsapp_advanced < backup.sql
```

### **Nginx Commands:**
```bash
# Status check
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Reload config
sudo systemctl reload nginx

# Test config
sudo nginx -t
```

---

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **Port Already in Use:**
```bash
sudo lsof -ti:3008 | xargs kill -9
sudo lsof -ti:3006 | xargs kill -9
```

2. **Database Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

3. **PM2 Issues:**
```bash
# Kill all PM2 processes
pm2 kill

# Restart PM2
pm2 resurrect
```

4. **Nginx Issues:**
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### **Logs Location:**
- **Application Logs**: `./logs/`
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`

---

## 🎉 **Success Verification**

### **Check Services:**
```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 list

# Check ports
netstat -tulpn | grep :80
netstat -tulpn | grep :3008
netstat -tulpn | grep :3006
```

### **Test Application:**
```bash
# Test frontend
curl http://YOUR_VPS_IP

# Test backend
curl http://YOUR_VPS_IP:3006/api/health

# Test database
psql -U whatsapp_user -d whatsapp_advanced -c "SELECT version();"
```

---

## 🚀 **Production Ready!**

Aapka **WhatsPro Connect** ab successfully deploy ho gaya hai Ubuntu 24 VPS server pe!

**Access URL**: http://YOUR_VPS_IP

**Features Available:**
- ✅ Multiple WhatsApp Sessions
- ✅ Real-time Messaging
- ✅ Bulk Messaging
- ✅ Contact Management
- ✅ Analytics Dashboard
- ✅ Professional UI/UX

**Next Steps:**
1. Domain setup karo (optional)
2. SSL certificate add karo
3. Regular backups setup karo
4. Monitoring tools add karo

---

*Deployment completed successfully! 🎊*
