# 🚀 WhatsApp Advanced WebApp - Auto Start Guide

Complete guide for automatic startup and management of all WhatsApp services.

## 📋 Overview

This system provides:
- **Automatic startup** on boot
- **Health monitoring** and auto-restart
- **Easy management** commands
- **Detailed logging** and monitoring
- **Never-down guarantee** for services

## 🛠️ Installation

### Method 1: Quick Install (Recommended)
```bash
cd /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp
sudo ./scripts/install-auto-start.sh
```

### Method 2: Manual Setup
```bash
# Start services manually
./start-all.sh manual

# Check status
./start-all.sh status
```

## 🎯 Services Managed

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3005 | Next.js Web Application |
| **Simulator** | 3001 | WhatsApp Backend Simulator |
| **Backend** | 3002 | Real WhatsApp Server (optional) |

## 📱 Management Commands

After installation, use these global commands:

```bash
# Start all services
wa-start

# Stop all services  
wa-stop

# Restart all services
wa-restart

# Check service status
wa-status

# View live logs
wa-logs
```

## 🔧 Advanced Management

### Using start-all.sh Script
```bash
cd /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp

# Start services
./start-all.sh start

# Stop services
./start-all.sh stop

# Restart services
./start-all.sh restart

# Check status
./start-all.sh status

# View logs
./start-all.sh logs

# Manual PM2 start
./start-all.sh manual
```

### Direct PM2 Management
```bash
# PM2 commands
pm2 status
pm2 restart all
pm2 stop all
pm2 logs
pm2 save
```

## 🔄 Auto-Start Features

### Boot-time Startup
- Services automatically start **30 seconds** after boot
- Uses crontab `@reboot` entry
- Waits for network connectivity
- Comprehensive logging

### Health Monitoring
- **Health checks every 10 minutes**
- **Service monitoring every 5 minutes**
- **Auto-restart on failure**
- **Maximum 10 restart attempts** per service

### Monitoring Scripts
```bash
# Manual health check
/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/scripts/health-check.sh

# Manual service monitor
/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/scripts/monitor-services.sh
```

## 📊 Logging and Monitoring

### Log Files
```bash
# Startup logs
tail -f /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/logs/startup.log

# Health check logs
tail -f /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/logs/health-check.log

# Service monitor logs
tail -f /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/logs/monitor.log

# PM2 logs
pm2 logs
```

### Real-time Monitoring
```bash
# Watch service status
watch -n 5 'wa-status'

# Monitor ports
watch -n 5 'ss -tulpn | grep -E ":(3001|3002|3005)"'

# Monitor processes
watch -n 5 'ps aux | grep -E "(whatsapp|node)" | grep -v grep'
```

## 🔧 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
wa-logs

# Manual restart
wa-restart

# Check ports
ss -tulpn | grep -E ":(3001|3005)"
```

#### Port Already in Use
```bash
# Kill processes on specific port
sudo pkill -f ":3001"
sudo pkill -f ":3005"

# Restart services
wa-restart
```

#### PM2 Issues
```bash
# Reset PM2
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### Manual Recovery
```bash
# Complete reset
wa-stop
sleep 5
wa-start

# Or use the startup script directly
sudo /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/scripts/startup.sh
```

## 🔒 Security Features

- **Process isolation** with dedicated user
- **Resource limits** (memory, CPU)
- **Automatic log rotation**
- **Secure file permissions**
- **Network timeout handling**

## 📈 Performance Optimization

### Resource Limits
- **Frontend**: 1GB memory limit
- **Simulator**: 1GB memory limit  
- **Backend**: 2GB memory limit
- **Auto-restart** on memory exceed

### Monitoring Intervals
- **Health checks**: Every 10 minutes
- **Service monitoring**: Every 5 minutes
- **Log rotation**: Daily
- **Restart delay**: 5 seconds

## 🎛️ Configuration

### Ecosystem Configuration
Edit `/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'whatsapp-nextjs',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'whatsapp-simulator', 
      script: 'scripts/whatsapp-backend-simulator.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
}
```

### Auto-Start Configuration
Edit `/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/scripts/startup.sh` for custom settings.

## 🚨 Emergency Procedures

### Complete System Reset
```bash
# Stop everything
wa-stop
pm2 kill
sudo pkill -f "whatsapp"

# Clean restart
wa-start
```

### Disable Auto-Start
```bash
# Remove crontab entries
sudo crontab -l | grep -v "startup.sh" | sudo crontab -
crontab -l | grep -v "monitor-services.sh" | crontab -

# Disable PM2 startup
pm2 unstartup systemd
```

### Re-enable Auto-Start
```bash
# Re-run installer
sudo ./scripts/install-auto-start.sh
```

## ✅ Verification

### Check Installation
```bash
# Verify auto-start is installed
crontab -l | grep startup.sh

# Verify global commands
which wa-start wa-stop wa-status

# Verify PM2 startup
pm2 startup
```

### Test Auto-Start
```bash
# Simulate reboot test
wa-stop
sleep 5
sudo /home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp/scripts/startup.sh
```

## 🎉 Success Indicators

When everything is working correctly:
- ✅ `wa-status` shows all services online
- ✅ Ports 3001 and 3005 are active
- ✅ Browser loads http://localhost:3005
- ✅ WhatsApp sessions can be created
- ✅ QR codes generate successfully

---

**🔥 Your WhatsApp services will now NEVER go down!** 

The system automatically:
- Starts on boot
- Monitors health
- Restarts on failure  
- Logs everything
- Provides easy management

**Use `wa-start`, `wa-stop`, `wa-status` for daily management!**
