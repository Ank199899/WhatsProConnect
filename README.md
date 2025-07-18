# WhatsApp Advanced Web App 📱

A powerful, feature-rich WhatsApp Web application that allows you to connect unlimited WhatsApp numbers, manage conversations, and send bulk messages with real-time data synchronization.

## 🌟 Features

- **Multiple WhatsApp Connections**: Connect unlimited WhatsApp numbers simultaneously
- **Real-time Messaging**: Live chat interface with instant message synchronization
- **Bulk Messaging**: Send messages to multiple contacts with customizable delays
- **Contact Management**: Organize and manage all your WhatsApp contacts
- **Analytics Dashboard**: Track messages, contacts, and campaign performance
- **Session Management**: Persistent WhatsApp sessions with QR code authentication
- **Responsive UI**: Modern, mobile-friendly interface built with Next.js and Tailwind CSS
- **Database Integration**: Real data storage with Supabase
- **Production Ready**: Nginx configuration for deployment on IP 192.168.1.230

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- Nginx (for production deployment)

### Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd whatsapp-advanced-webapp
npm install
```

2. **Environment Configuration**
```bash
cp .env.local .env.local
# Edit .env.local with your Supabase credentials
```

3. **Database Setup**
- Create a new Supabase project
- Run the SQL schema from `database/schema.sql` in Supabase SQL Editor
- Update `.env.local` with your Supabase URL and keys

4. **Start Development**
```bash
# Start both Next.js and WhatsApp server
npm run dev:full

# Or start separately
npm run dev          # Next.js frontend
npm run whatsapp-server  # WhatsApp backend
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🏗️ Production Deployment

### Automated Deployment

Run the deployment script for automatic setup:

```bash
./deploy.sh
```

This script will:
- Install dependencies and build the application
- Set up PM2 process manager
- Configure Nginx reverse proxy
- Set up systemd services
- Configure firewall rules

### Manual Deployment

1. **Build Application**
```bash
npm run build
```

2. **Install PM2**
```bash
npm install -g pm2
```

3. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Configure Nginx**
```bash
sudo cp nginx/whatsapp-app.conf /etc/nginx/sites-available/whatsapp-app
sudo ln -s /etc/nginx/sites-available/whatsapp-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. **Access Application**
- Production URL: http://192.168.1.230

## 📱 How to Use

### 1. Create WhatsApp Session
- Go to "Sessions" tab
- Click "Create Session"
- Scan QR code with WhatsApp mobile app
- Wait for session to become "Ready"

### 2. View Messages (Inbox)
- Go to "Inbox" tab
- Select a connected session
- View all chats and conversations
- Send/receive messages in real-time

### 3. Send Bulk Messages
- Go to "Bulk Messaging" tab
- Select a session
- Choose contacts
- Write your message
- Set delay between messages
- Send to multiple contacts

### 4. Monitor Analytics
- Go to "Analytics" tab
- View session statistics
- Track message counts
- Monitor bulk campaign performance

## 🛠️ Technical Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Real-time**: Socket.IO client

### Backend (Node.js)
- **WhatsApp Integration**: whatsapp-web.js
- **Real-time Communication**: Socket.IO
- **Session Management**: LocalAuth with Puppeteer
- **API**: Express.js REST endpoints

### Database (Supabase)
- **Sessions**: WhatsApp connection management
- **Messages**: Real-time message storage
- **Contacts**: Contact information and metadata
- **Bulk Queues**: Bulk messaging campaigns
- **Analytics**: Usage statistics and metrics

### Infrastructure
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **Rate Limiting**: Nginx rate limiting
- **Logging**: PM2 and Nginx logs

## 📊 Database Schema

Key tables:
- `whatsapp_sessions`: Session management
- `contacts`: Contact information
- `messages`: Message history
- `bulk_message_queue`: Bulk messaging campaigns
- `bulk_message_logs`: Delivery tracking

## 🔧 Configuration

### Environment Variables (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
MAX_CONCURRENT_SESSIONS=50

# Server Configuration
PORT=3000
WHATSAPP_SERVER_PORT=3001
```

### Nginx Configuration
- Reverse proxy for Next.js (port 3000)
- API proxy for WhatsApp server (port 3001)
- Rate limiting for API endpoints
- Static file caching
- WebSocket support for Socket.IO

## 🚨 Important Notes

### WhatsApp Compliance
- Use delays between bulk messages (recommended: 2+ seconds)
- Respect WhatsApp's terms of service
- Monitor for rate limiting
- Don't spam users

### Security
- Keep your environment variables secure
- Use HTTPS in production
- Implement proper authentication
- Regular security updates

### Performance
- Monitor memory usage (WhatsApp sessions can be memory-intensive)
- Use PM2 for process management
- Implement proper error handling
- Regular database cleanup

## 🔍 Troubleshooting

### Common Issues

1. **QR Code Not Appearing**
   - Check WhatsApp server logs: `pm2 logs whatsapp-server`
   - Ensure Puppeteer dependencies are installed
   - Check firewall settings

2. **Messages Not Syncing**
   - Verify Socket.IO connection
   - Check Supabase credentials
   - Review network connectivity

3. **Bulk Messages Failing**
   - Reduce sending speed (increase delay)
   - Check WhatsApp session status
   - Monitor for rate limiting

### Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/whatsapp-app.access.log
sudo tail -f /var/log/nginx/whatsapp-app.error.log

# Application logs
tail -f logs/whatsapp-combined.log
tail -f logs/nextjs-combined.log
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Verify configuration settings
4. Check Supabase dashboard for database issues

## 📄 License

This project is for educational and personal use. Please comply with WhatsApp's terms of service and applicable laws in your jurisdiction.
