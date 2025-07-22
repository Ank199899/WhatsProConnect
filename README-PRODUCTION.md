# 🚀 WhatsApp Advanced Webapp - Production Ready

## Quick Start

### Start the Application
```bash
bash start.sh
```

### Stop the Application
```bash
bash stop.sh
```

## Access URLs

- **Main Application**: http://192.168.1.230:3000
- **Backend API**: http://192.168.1.230:3002/api

## Features

✅ **Production Ready** - Optimized for production deployment  
✅ **No Port Confusion** - Fixed ports (Frontend: 3000, Backend: 3002)  
✅ **WhatsApp Integration** - Multiple WhatsApp sessions support  
✅ **Real-time Messaging** - Live message handling  
✅ **Session Management** - QR code scanning and session restore  
✅ **Clean Architecture** - Simple, maintainable codebase  

## Services

- **Frontend**: Next.js application on port 3000
- **Backend**: WhatsApp server on port 3002
- **Database**: SQLite for session storage
- **WebSocket**: Real-time communication

## Logs

- Backend logs: `logs/backend.log`
- Frontend logs: `logs/frontend.log`

## Requirements

- Node.js 18+
- npm or yarn
- Chrome/Chromium (for WhatsApp Web)

## Production Deployment

The application is configured for production with:
- Error handling and logging
- Session persistence
- Automatic reconnection
- Clean shutdown procedures

## Support

For issues or questions, check the logs in the `logs/` directory.
