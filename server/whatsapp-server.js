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
        this.app.post('/api/sessions/create', (req, res) => {
            const sessionId = uuidv4();
            const sessionName = req.body.name || `WhatsApp ${sessionId.slice(0, 8)}`;

            this.createWhatsAppClient(sessionId, sessionName);
            
            res.json({
                success: true,
                sessionId,
                sessionName,
                message: 'Session created successfully'
            });
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
            console.log('Client connected:', socket.id);
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
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
        });

        // Ready event
        client.on('ready', () => {
            console.log(`WhatsApp client ${sessionId} is ready!`);
            
            const session = this.sessions.get(sessionId);
            session.status = 'ready';
            session.phoneNumber = client.info.wid.user;
            session.qrCode = null;
            
            this.io.emit('client_ready', { sessionId, phoneNumber: client.info.wid.user });
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
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            console.log(`Client ${sessionId} disconnected:`, reason);
            
            const session = this.sessions.get(sessionId);
            session.status = 'disconnected';
            
            this.io.emit('client_disconnected', { sessionId, reason });
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
            const response = await fetch('http://localhost:3000/api/database/sessions');
            const data = await response.json();

            if (data.success && data.sessions) {
                console.log(`📊 Found ${data.sessions.length} sessions in database`);

                for (const session of data.sessions) {
                    if (session.status === 'ready' && session.is_active) {
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

    start(port = 3001) {
        this.server.listen(port, () => {
            console.log(`WhatsApp server running on port ${port}`);
        });
    }
}

// Start the server
const whatsappManager = new WhatsAppManager();
whatsappManager.start(process.env.WHATSAPP_SERVER_PORT || 3001);

module.exports = WhatsAppManager;
