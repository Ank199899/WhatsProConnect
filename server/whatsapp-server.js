const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

class WhatsAppManager {
    constructor() {
        this.clients = new Map();
        this.sessions = new Map();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.setupExpress();
        this.setupSocketIO();
        this.ensureSessionsDirectory();

        // Restore sessions from database on startup
        this.restoreSessionsFromDatabase();
    }

    ensureSessionsDirectory() {
        const sessionsDir = path.join(__dirname, '../sessions');
        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
        }
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Get all sessions
        this.app.get('/api/sessions', (req, res) => {
            const sessions = Array.from(this.sessions.values());
            res.json(sessions);
        });

        // Create new session
        this.app.post('/api/sessions/create', async (req, res) => {
            try {
                const sessionId = uuidv4();
                const sessionName = req.body.name || `WhatsApp ${sessionId.slice(0, 8)}`;

                console.log(`🆕 Creating new session: ${sessionName} (${sessionId})`);

                // Save to database first
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.1.230:3005';
                    const response = await fetch(`${apiUrl}/api/database/sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: sessionId,
                            name: sessionName,
                            status: 'initializing',
                            is_active: true
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Database save failed: ${response.statusText}`);
                    }

                    console.log('✅ Session saved to database');
                } catch (dbError) {
                    console.error('❌ Database save error:', dbError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to save session to database'
                    });
                }

                // Create WhatsApp client
                this.createWhatsAppClient(sessionId, sessionName);

                // Emit session update to all connected clients
                this.broadcastSessionsUpdate();

                res.json({
                    success: true,
                    sessionId,
                    sessionName,
                    message: 'Session created successfully'
                });
            } catch (error) {
                console.error('❌ Session creation error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create session'
                });
            }
        });

        // Delete session
        this.app.delete('/api/sessions/:sessionId', async (req, res) => {
            try {
                const sessionId = req.params.sessionId;
                console.log(`🗑️ Deleting session: ${sessionId}`);

                // Stop and remove WhatsApp client
                if (this.clients.has(sessionId)) {
                    const client = this.clients.get(sessionId);
                    try {
                        // Gracefully logout first
                        if (client.info && client.info.wid) {
                            await client.logout();
                            console.log('✅ WhatsApp client logged out');
                        }

                        // Then destroy
                        await client.destroy();
                        console.log('✅ WhatsApp client destroyed');
                    } catch (error) {
                        console.error('⚠️ Error destroying client (continuing anyway):', error.message);
                    }
                    this.clients.delete(sessionId);
                }

                // Remove from sessions map
                this.sessions.delete(sessionId);

                // Delete from database
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.1.230:3005';
                    const response = await fetch(`${apiUrl}/api/database/sessions/${sessionId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error(`Database delete failed: ${response.statusText}`);
                    }

                    console.log('✅ Session deleted from database');
                } catch (dbError) {
                    console.error('❌ Database delete error:', dbError);
                    // Continue even if database delete fails
                }

                // Emit session update to all connected clients
                this.broadcastSessionsUpdate();

                res.json({
                    success: true,
                    message: 'Session deleted successfully'
                });
            } catch (error) {
                console.error('❌ Session deletion error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete session'
                });
            }
        });

        // Test message event (for debugging)
        this.app.post('/api/test-message', (req, res) => {
            console.log('🧪 Test message endpoint called')

            const testMessage = {
                sessionId: 'test-session',
                id: 'test_' + Date.now(),
                body: 'Test message from server',
                from: '1234567890@c.us',
                to: '0987654321@c.us',
                timestamp: Date.now(),
                type: 'chat',
                isGroupMsg: false,
                author: null
            }

            console.log('📡 Emitting test message:', testMessage)
            this.io.emit('new_message', testMessage)

            res.json({
                success: true,
                message: 'Test message emitted',
                data: testMessage
            })
        })

        // Delete session
        this.app.delete('/api/sessions/:sessionId', async (req, res) => {
            const { sessionId } = req.params;
            
            if (this.clients.has(sessionId)) {
                const client = this.clients.get(sessionId);
                await client.destroy();
                this.clients.delete(sessionId);
                this.sessions.delete(sessionId);
                
                res.json({
                    success: true,
                    message: 'Session deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }
        });

        // Send message
        this.app.post('/api/messages/send', async (req, res) => {
            const { sessionId, to, message, type = 'text' } = req.body;
            
            if (!this.clients.has(sessionId)) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }

            const client = this.clients.get(sessionId);
            
            if (!client.info) {
                return res.status(400).json({
                    success: false,
                    message: 'WhatsApp client not ready'
                });
            }

            try {
                const chatId = to.includes('@') ? to : `${to}@c.us`;
                await client.sendMessage(chatId, message);
                
                res.json({
                    success: true,
                    message: 'Message sent successfully'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to send message',
                    error: error.message
                });
            }
        });

        // Bulk send messages
        this.app.post('/api/messages/bulk-send', async (req, res) => {
            const { sessionId, contacts, message, delay = 2000 } = req.body;
            
            if (!this.clients.has(sessionId)) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }

            const client = this.clients.get(sessionId);
            
            if (!client.info) {
                return res.status(400).json({
                    success: false,
                    message: 'WhatsApp client not ready'
                });
            }

            // Start bulk sending in background
            this.processBulkMessages(sessionId, contacts, message, delay);
            
            res.json({
                success: true,
                message: `Bulk message sending started for ${contacts.length} contacts`
            });
        });

        // Get contacts
        this.app.get('/api/contacts/:sessionId', async (req, res) => {
            const { sessionId } = req.params;
            
            if (!this.clients.has(sessionId)) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }

            const client = this.clients.get(sessionId);
            
            try {
                const contacts = await client.getContacts();
                const formattedContacts = contacts.map(contact => ({
                    id: contact.id._serialized,
                    name: contact.name || contact.pushname || 'Unknown',
                    number: contact.number,
                    isGroup: contact.isGroup,
                    profilePicUrl: contact.profilePicUrl
                }));
                
                res.json({
                    success: true,
                    contacts: formattedContacts
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get contacts',
                    error: error.message
                });
            }
        });

        // Get chats
        this.app.get('/api/chats/:sessionId', async (req, res) => {
            const { sessionId } = req.params;
            
            if (!this.clients.has(sessionId)) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }

            const client = this.clients.get(sessionId);
            
            try {
                const chats = await client.getChats();
                const formattedChats = chats.map(chat => ({
                    id: chat.id._serialized,
                    name: chat.name,
                    isGroup: chat.isGroup,
                    unreadCount: chat.unreadCount,
                    lastMessage: chat.lastMessage ? {
                        body: chat.lastMessage.body,
                        timestamp: chat.lastMessage.timestamp,
                        from: chat.lastMessage.from
                    } : null
                }));
                
                res.json({
                    success: true,
                    chats: formattedChats
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get chats',
                    error: error.message
                });
            }
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('🔌 Client connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id);
            });

            // Send current data to new client
            socket.emit('sessions_updated', Array.from(this.sessions.values()));

            // Handle data requests
            socket.on('get_sessions', () => {
                console.log('📡 Client requested sessions update');
                socket.emit('sessions_updated', Array.from(this.sessions.values()));
            });

            socket.on('get_contacts', () => {
                console.log('📞 Client requested contacts update');
                // Return empty array for now to avoid blocking
                socket.emit('contacts_updated', []);
            });

            socket.on('get_messages', () => {
                console.log('💬 Client requested messages update');
                // Return empty array for now to avoid blocking
                socket.emit('messages_updated', []);
            });

            socket.on('get_templates', () => {
                console.log('📝 Client requested templates update');
                // Return empty array for now to avoid blocking
                socket.emit('templates_updated', []);
            });

            socket.on('get_campaigns', () => {
                console.log('📋 Client requested campaigns update');
                // Return empty array for now to avoid blocking
                socket.emit('campaigns_updated', []);
            });

            socket.on('get_analytics', () => {
                console.log('📊 Client requested analytics update');
                // Return basic analytics for now to avoid blocking
                const sessions = Array.from(this.sessions.values());
                const analytics = {
                    totalSessions: sessions.length,
                    activeSessions: sessions.filter(s => s.status === 'ready').length,
                    totalContacts: 0,
                    totalMessages: 0,
                    messagesLast24h: 0
                };
                socket.emit('analytics_updated', analytics);
            });

            // Real-time data subscriptions
            socket.on('subscribe_contacts', () => {
                console.log('📞 Client subscribed to contacts updates');
            });

            socket.on('subscribe_templates', () => {
                console.log('📋 Client subscribed to templates updates');
            });

            socket.on('subscribe_roles', () => {
                console.log('🛡️ Client subscribed to roles updates');
            });

            socket.on('subscribe_analytics', () => {
                console.log('📊 Client subscribed to analytics updates');
            });

            // Handle real-time events
            socket.on('contacts_updated', (contacts) => {
                socket.broadcast.emit('contacts_updated', contacts);
            });

            socket.on('templates_updated', (templates) => {
                socket.broadcast.emit('templates_updated', templates);
            });

            socket.on('roles_updated', (roles) => {
                socket.broadcast.emit('roles_updated', roles);
            });

            socket.on('analytics_updated', (analytics) => {
                socket.broadcast.emit('analytics_updated', analytics);
            });
        });
    }

    // Broadcast sessions update to all connected clients
    broadcastSessionsUpdate() {
        const sessions = Array.from(this.sessions.values());
        this.io.emit('sessions_updated', sessions);
        console.log(`📡 Broadcasting sessions update to all clients: ${sessions.length} sessions`);
    }

    createWhatsAppClient(sessionId, sessionName) {
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: sessionId,
                dataPath: path.join(__dirname, '../sessions')
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        // Store session info
        this.sessions.set(sessionId, {
            id: sessionId,
            name: sessionName,
            status: 'initializing',
            qrCode: null,
            phoneNumber: null,
            createdAt: new Date().toISOString()
        });

        // QR Code event
        client.on('qr', (qr) => {
            console.log(`QR Code for session ${sessionId}:`, qr);

            // Update session with QR code
            const session = this.sessions.get(sessionId);
            session.qrCode = qr;
            session.status = 'qr_code';

            // Emit QR code to frontend
            this.io.emit('qr_code', { sessionId, qrCode: qr });

            // Broadcast sessions update
            this.broadcastSessionsUpdate();
        });

        // Ready event
        client.on('ready', () => {
            console.log(`WhatsApp client ${sessionId} is ready!`);

            const session = this.sessions.get(sessionId);
            session.status = 'ready';
            session.phoneNumber = client.info.wid.user;
            session.qrCode = null;

            this.io.emit('client_ready', { sessionId, phoneNumber: client.info.wid.user });

            // Broadcast sessions update
            this.broadcastSessionsUpdate();
        });

        // Message event
        client.on('message', async (message) => {
            console.log(`📨 New message received in session ${sessionId}:`, message.body);

            const messageData = {
                sessionId,
                id: message.id._serialized,
                body: message.body,
                from: message.from,
                to: message.to,
                timestamp: message.timestamp,
                type: message.type,
                isGroupMsg: message.isGroupMsg,
                author: message.author
            };

            // Emit message event
            this.io.emit('new_message', messageData);
            console.log(`📡 Message event emitted for session ${sessionId}`);

            // If this is a new contact, emit contact update event
            try {
                const chat = await message.getChat();
                if (chat) {
                    const chatData = {
                        sessionId,
                        id: chat.id._serialized,
                        name: chat.name,
                        isGroup: chat.isGroup,
                        unreadCount: chat.unreadCount,
                        lastMessage: {
                            body: message.body,
                            timestamp: message.timestamp,
                            from: message.from
                        }
                    };

                    this.io.emit('chat_updated', chatData);
                    console.log(`📊 Chat update emitted for session ${sessionId}`);
                }
            } catch (error) {
                console.error(`❌ Error getting chat info for message:`, error);
            }
        });

        // Authentication failure
        client.on('auth_failure', (msg) => {
            console.error(`Authentication failed for session ${sessionId}:`, msg);

            const session = this.sessions.get(sessionId);
            session.status = 'auth_failure';

            this.io.emit('auth_failure', { sessionId, message: msg });

            // Broadcast sessions update
            this.broadcastSessionsUpdate();
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            console.log(`Client ${sessionId} disconnected:`, reason);

            const session = this.sessions.get(sessionId);
            session.status = 'disconnected';

            this.io.emit('client_disconnected', { sessionId, reason });

            // Broadcast sessions update
            this.broadcastSessionsUpdate();
        });

        client.initialize();
        this.clients.set(sessionId, client);
    }

    async processBulkMessages(sessionId, contacts, message, delay) {
        const client = this.clients.get(sessionId);
        let sent = 0;
        let failed = 0;

        for (const contact of contacts) {
            try {
                const chatId = contact.includes('@') ? contact : `${contact}@c.us`;
                await client.sendMessage(chatId, message);
                sent++;
                
                this.io.emit('bulk_message_progress', {
                    sessionId,
                    sent,
                    failed,
                    total: contacts.length,
                    current: contact
                });
                
                // Delay between messages
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                failed++;
                console.error(`Failed to send message to ${contact}:`, error.message);
                
                this.io.emit('bulk_message_progress', {
                    sessionId,
                    sent,
                    failed,
                    total: contacts.length,
                    current: contact,
                    error: error.message
                });
            }
        }

        this.io.emit('bulk_message_complete', {
            sessionId,
            sent,
            failed,
            total: contacts.length
        });
    }

    async restoreSessionsFromDatabase() {
        try {
            console.log('🔄 Restoring sessions from database...');

            // Get sessions from database
            const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.1.230:3005';
            const response = await fetch(`${apiUrl}/api/database/sessions`);
            const data = await response.json();

            if (data.success && data.sessions) {
                console.log(`📊 Found ${data.sessions.length} sessions in database`);

                for (const session of data.sessions) {
                    if (session.status === 'ready' && session.is_active) {
                        // Check if session already exists to prevent duplicates
                        if (this.sessions.has(session.id) || this.clients.has(session.id)) {
                            console.log(`⚠️ Session ${session.name} (${session.id}) already exists, skipping...`);
                            continue;
                        }

                        console.log(`🔄 Restoring session: ${session.name} (${session.id})`);

                        // Create session entry
                        this.sessions.set(session.id, {
                            id: session.id,
                            name: session.name,
                            status: 'initializing',
                            qrCode: null,
                            phoneNumber: session.phone_number,
                            createdAt: session.created_at
                        });

                        // Create WhatsApp client
                        this.createWhatsAppClient(session.id, session.name);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to restore sessions from database:', error);
        }
    }

    // Helper methods for real-time data
    getApiBaseUrl() {
        // Auto-detect environment
        const hostname = process.env.NODE_ENV === 'production' ? '100.115.3.36' : 'localhost';
        return `http://${hostname}:3005`;
    }

    async getAllContacts() {
        try {
            const baseUrl = this.getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/database/contacts`);
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    }

    async getAllMessages() {
        try {
            const baseUrl = this.getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/database/messages`);
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    }

    async getAllTemplates() {
        try {
            const baseUrl = this.getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/templates`);
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
    }

    async getAnalytics() {
        try {
            const sessions = Array.from(this.sessions.values());
            const contacts = await this.getAllContacts();
            const messages = await this.getAllMessages();

            return {
                totalSessions: sessions.length,
                activeSessions: sessions.filter(s => s.status === 'ready').length,
                totalContacts: contacts.length,
                totalMessages: messages.length,
                messagesLast24h: messages.filter(m => {
                    const msgTime = new Date(m.created_at || m.timestamp).getTime();
                    return msgTime > (Date.now() - 24 * 60 * 60 * 1000);
                }).length
            };
        } catch (error) {
            console.error('Error calculating analytics:', error);
            return {};
        }
    }

    // Broadcast data updates to all clients
    broadcastUpdate(event, data) {
        console.log(`📡 Broadcasting ${event} to all clients`);
        this.io.emit(event, data);
    }

    start(port = 3001) {
        const host = process.env.HOST || '192.168.1.230';
        this.server.listen(port, host, () => {
            console.log(`WhatsApp server running on http://${host}:${port}`);
        });
    }
}

// Start the server
const whatsappManager = new WhatsAppManager();
whatsappManager.start(process.env.WHATSAPP_SERVER_PORT || 3001);

module.exports = WhatsAppManager;
