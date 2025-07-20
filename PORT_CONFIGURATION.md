# 🚀 PORT CONFIGURATION GUIDE

## ⚠️ IMPORTANT: DO NOT CHANGE THESE PORTS!

This application uses **FIXED PORTS** to ensure consistent operation across all environments.

## 📋 Port Assignments

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Frontend** | `3005` | `http://localhost:3005` | Next.js Web Application |
| **Backend** | `3001` | `http://localhost:3001` | WhatsApp Server & API |

## 🔧 Configuration Files

### Primary Configuration
- **`config/ports.js`** - Centralized port configuration
- **`.env.local`** - Environment variables with fixed ports

### Files Using These Ports
- `package.json` - npm scripts
- `server/whatsapp-server.js` - WhatsApp backend server
- `src/contexts/RealTimeContext.tsx` - Socket.io connections
- `src/lib/whatsapp-manager.ts` - API client
- `next.config.ts` - Proxy configuration

## 🚨 Why These Ports Are Fixed

1. **Consistency** - Same ports across development and production
2. **No Conflicts** - Carefully chosen to avoid common port conflicts
3. **Easy Debugging** - Always know where services are running
4. **Team Collaboration** - Everyone uses same configuration

## 🛠️ How to Start the Application

```bash
# Start both frontend and backend
npm run dev:full

# Or start individually
npm run dev        # Frontend only (port 3005)
npm run whatsapp-server  # Backend only (port 3001)
```

## 🔍 Troubleshooting

### Port Already in Use?
```bash
# Kill processes on these ports
sudo lsof -ti:3005 | xargs kill -9
sudo lsof -ti:3001 | xargs kill -9
```

### Check What's Running
```bash
# Check port 3005 (Frontend)
lsof -i :3005

# Check port 3001 (Backend)  
lsof -i :3001
```

## ✅ Verification

After starting, verify these URLs work:
- Frontend: http://localhost:3005
- Backend API: http://localhost:3001/api/sessions
- Socket.io: ws://localhost:3001

## 🚫 What NOT to Do

❌ Don't change ports in any configuration file
❌ Don't use different ports for different environments  
❌ Don't modify the centralized config without team approval

## ✅ What TO Do

✅ Always use `npm run dev:full` to start both services
✅ Check this guide if you have port issues
✅ Report any port conflicts to the team
✅ Use the centralized configuration in `config/ports.js`

---

**Remember: Consistent ports = Happy development! 🎉**
