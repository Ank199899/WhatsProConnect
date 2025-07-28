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
const { Pool } = require('pg');

// Load dynamic configuration
let DYNAMIC_CONFIG = null
try {
  if (process.env.DYNAMIC_CONFIG) {
    DYNAMIC_CONFIG = JSON.parse(process.env.DYNAMIC_CONFIG)
    console.log('🎯 Using dynamic config from environment')
  } else {
    const configPath = path.join(__dirname, '../config/current-config.json')
    if (fs.existsSync(configPath)) {
      DYNAMIC_CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      console.log('🎯 Using dynamic config from file')
    }
  }
} catch (err) {
  console.log('⚠️  Dynamic config not available, using fallback')
}

// Configuration with fallback
const CONFIG = DYNAMIC_CONFIG || {
  NETWORK: { PRIMARY_IP: '192.168.1.230' },
  PORTS: { FRONTEND: 3008, BACKEND: 3006 },
  URLS: {
    PUBLIC_FRONTEND: 'http://192.168.1.230:3008',
    PUBLIC_API: 'http://192.168.1.230:3006/api',
    BIND_BACKEND: 'http://0.0.0.0:3006'
  }
}

// Legacy support
const PORTS = { FRONTEND: CONFIG.PORTS.FRONTEND, BACKEND: CONFIG.PORTS.BACKEND }
const HOST = process.env.HOST || '0.0.0.0'
const URLS = CONFIG.URLS

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

        // ⚠️ DEPRECATED: SQLite backup system disabled
        // All data now flows through PostgreSQL only
        console.warn('⚠️ SQLite backup system is deprecated. Use PostgreSQL server instead.');

        // Initialize PostgreSQL database instead
        this.initializePostgreSQLDatabase();

        this.setupExpress();
        this.setupSocketIO();
        this.ensureSessionsDirectory();

        // Restore sessions from database on startup
        this.restoreSessionsFromDatabase().catch(console.error);
    }

    async initializePostgreSQLDatabase() {
        try {
            console.log('🗄️ Initializing PostgreSQL database (SQLite backup disabled)...');

            // Database configuration
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'whatsapp_advanced',
                user: process.env.DB_USER || 'whatsapp_user',
                password: process.env.DB_PASSWORD || 'whatsapp_secure_password_2025',
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            };

            this.pool = new Pool(dbConfig);

            // Test connection
            const client = await this.pool.connect();
            console.log('✅ PostgreSQL database connection established');
            client.release();

            // Create tables
            await this.createTables();

            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async createTables() {
        const client = await this.pool.connect();

        try {
            // WhatsApp Sessions Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS whatsapp_sessions (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone_number VARCHAR(50),
                    status VARCHAR(50) NOT NULL DEFAULT 'initializing'
                        CHECK (status IN ('initializing', 'qr_code', 'ready', 'disconnected', 'auth_failure')),
                    qr_code TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Messages Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id VARCHAR(255) PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    whatsapp_message_id VARCHAR(255),
                    from_number VARCHAR(50) NOT NULL,
                    to_number VARCHAR(50) NOT NULL,
                    body TEXT,
                    message_type VARCHAR(20) DEFAULT 'text',
                    is_group_message BOOLEAN DEFAULT false,
                    author VARCHAR(255),
                    timestamp BIGINT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    media_url TEXT,
                    media_type VARCHAR(50),
                    filename VARCHAR(255),
                    contact_name VARCHAR(255),
                    profile_pic_url TEXT,
                    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
                )
            `);

            // Contacts Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id VARCHAR(255) PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    whatsapp_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255),
                    phone_number VARCHAR(50),
                    is_group BOOLEAN DEFAULT false,
                    profile_pic_url TEXT,
                    last_seen TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
                )
            `);

            // Create indexes for better performance
            await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_session_id ON contacts(session_id)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_id ON contacts(whatsapp_id)`);

            console.log('✅ Database tables created');
        } catch (error) {
            console.error('❌ Error creating database tables:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    ensureSessionsDirectory() {
        const sessionsDir = path.join(__dirname, '../sessions');
        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
        }
    }

    // Helper method to execute PostgreSQL queries
    async executeQuery(query, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, params);
            return result;
        } finally {
            client.release();
        }
    }

    // Helper method to get single row
    async getOne(query, params = []) {
        const result = await this.executeQuery(query, params);
        return result.rows[0] || null;
    }

    // Helper method to get all rows
    async getAll(query, params = []) {
        const result = await this.executeQuery(query, params);
        return result.rows;
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());

        // Serve static files (for test pages)
        this.app.use(express.static(path.join(__dirname, '..')));
        
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                sessions: {
                    total: this.sessions.size,
                    ready: Array.from(this.sessions.values()).filter(s => s.status === 'ready').length,
                    connecting: Array.from(this.sessions.values()).filter(s => s.status === 'connecting').length
                },
                clients: {
                    total: this.clients.size,
                    connected: Array.from(this.clients.values()).filter(c => c && c.info).length
                },
                database: {
                    connected: !!this.db,
                    path: this.db ? this.db.name : null
                }
            };
            res.json(health);
        });

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

                // Save to database directly
                try {
                    await this.executeQuery(`
                        INSERT INTO whatsapp_sessions (id, name, status, is_active, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `, [sessionId, sessionName, 'initializing', true]);
                    console.log('✅ Session saved to database');
                } catch (dbError) {
                    console.error('❌ Database save error:', dbError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to save session to database: ' + dbError.message
                    });
                }

                // Create WhatsApp client
                await this.createWhatsAppClient(sessionId, sessionName);

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
                    const stmt = this.db.prepare('DELETE FROM whatsapp_sessions WHERE id = ?');
                    stmt.run(sessionId);
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

        // Connect session endpoint
        this.app.post('/api/sessions/:sessionId/connect', async (req, res) => {
            const { sessionId } = req.params;
            console.log('🔌 Connecting session:', sessionId);

            try {
                const session = this.sessions.get(sessionId);
                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }

                // If session is already connected, return success
                if (session.status === 'ready' || session.status === 'connected') {
                    return res.json({
                        success: true,
                        message: 'Session already connected',
                        sessionId,
                        status: session.status
                    });
                }

                // If client doesn't exist, create it
                if (!this.clients.has(sessionId)) {
                    console.log('🔄 Creating WhatsApp client for session:', sessionId);
                    this.createWhatsAppClient(sessionId, session.name);
                }

                // Update session status to connecting
                session.status = 'connecting';
                this.sessions.set(sessionId, session);

                // Broadcast update
                this.broadcastSessionsUpdate();

                res.json({
                    success: true,
                    message: 'Session connection initiated',
                    sessionId,
                    status: 'connecting'
                });

            } catch (error) {
                console.error('❌ Error connecting session:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to connect session'
                });
            }
        });

        // Debug endpoint to check client status
        this.app.get('/api/debug/clients', (req, res) => {
            const clientsInfo = []
            for (const [sessionId, client] of this.clients.entries()) {
                clientsInfo.push({
                    sessionId,
                    hasClient: !!client,
                    isReady: client && client.info ? true : false,
                    phoneNumber: client && client.info ? client.info.wid?.user : null,
                    state: client && client.pupPage ? 'connected' : 'disconnected'
                })
            }

            res.json({
                totalClients: this.clients.size,
                clients: clientsInfo,
                sessions: Array.from(this.sessions.values())
            })
        })

        // Debug endpoint to check socket connections
        this.app.get('/api/debug/socket', (req, res) => {
            const socketInfo = {
                totalConnections: this.io.engine.clientsCount,
                connectedSockets: [],
                serverTime: new Date().toISOString()
            }

            // Get connected socket info
            this.io.sockets.sockets.forEach((socket, id) => {
                socketInfo.connectedSockets.push({
                    id: id,
                    connected: socket.connected,
                    rooms: Array.from(socket.rooms)
                })
            })

            res.json(socketInfo)
        })

        // Debug endpoint to get conversations
        this.app.get('/api/debug/conversations', (req, res) => {
            try {
                // Get all messages from database
                const messages = this.db.prepare('SELECT * FROM messages ORDER BY timestamp DESC').all()

                // Group messages by conversation
                const conversationMap = new Map()

                messages.forEach(message => {
                    // Determine conversation ID
                    const contactId = message.from_number === 'me' ? message.to_number : message.from_number
                    const conversationId = `${message.session_id}_${contactId}`

                    if (!conversationMap.has(conversationId)) {
                        conversationMap.set(conversationId, {
                            id: conversationId,
                            sessionId: message.session_id,
                            contactId: contactId,
                            contactName: message.contact_name || contactId.replace('@c.us', '').replace('@g.us', ''),
                            profilePicUrl: message.profile_pic_url,
                            messages: [],
                            lastMessage: null,
                            unreadCount: 0,
                            isGroup: message.is_group_message === 1
                        })
                    }

                    const conversation = conversationMap.get(conversationId)
                    conversation.messages.push(message)

                    // Set last message
                    if (!conversation.lastMessage || message.timestamp > conversation.lastMessage.timestamp) {
                        conversation.lastMessage = {
                            body: message.body,
                            timestamp: message.timestamp,
                            from: message.from_number
                        }
                    }
                })

                const conversations = Array.from(conversationMap.values())

                // Transform conversations for frontend
                const transformedConversations = conversations.map(conv => ({
                    id: conv.contactId,
                    name: conv.contactName,
                    phoneNumber: conv.contactId,
                    avatar: conv.profilePicUrl,
                    lastMessage: conv.lastMessage?.body || 'No messages',
                    lastMessageTime: conv.lastMessage?.timestamp || Date.now(),
                    unreadCount: conv.unreadCount,
                    isPinned: false,
                    isOnline: false,
                    messages: conv.messages.slice(-10) // Last 10 messages
                }))

                res.json(transformedConversations)
            } catch (error) {
                console.error('❌ Debug conversations error:', error)
                res.status(500).json({ error: 'Failed to get conversations', details: error.message })
            }
        })

        // Get messages for specific conversation
        this.app.get('/api/messages/:chatId', (req, res) => {
            try {
                const { chatId } = req.params
                const { sessionId } = req.query

                let query = `
                    SELECT * FROM messages
                    WHERE (from_number = ? OR to_number = ?)
                    ORDER BY timestamp ASC
                `
                let params = [chatId, chatId]

                if (sessionId) {
                    query = `
                        SELECT * FROM messages
                        WHERE (from_number = ? OR to_number = ?) AND session_id = ?
                        ORDER BY timestamp ASC
                    `
                    params = [chatId, chatId, sessionId]
                }

                const messages = this.db.prepare(query).all(...params)

                // Transform messages to frontend format
                const transformedMessages = messages.map(msg => ({
                    id: msg.id,
                    content: msg.content || msg.body,
                    type: msg.message_type || 'text',
                    timestamp: msg.timestamp,
                    isFromMe: msg.from_number === 'me',
                    status: 'delivered',
                    mediaUrl: msg.media_url,
                    fileName: msg.file_name,
                    fileSize: msg.file_size
                }))

                console.log(`📊 Retrieved ${transformedMessages.length} messages for chat ${chatId}`)
                res.json({
                    success: true,
                    messages: transformedMessages
                })
            } catch (error) {
                console.error('❌ Error retrieving messages:', error)
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve messages'
                })
            }
        })

        // Send message endpoint
        this.app.post('/api/send-message', async (req, res) => {
            try {
                const { sessionId, chatId, message, replyTo } = req.body

                if (!sessionId || !chatId || !message) {
                    return res.status(400).json({ error: 'Missing required fields' })
                }

                const client = this.clients.get(sessionId)
                if (!client) {
                    return res.status(404).json({ error: 'Session not found' })
                }

                console.log(`📤 Sending message to ${chatId} from session ${sessionId}`)

                // Send message via WhatsApp
                const sentMessage = await client.sendMessage(chatId, message)

                // Save to database
                const stmt = this.db.prepare(`
                    INSERT INTO messages (
                        id, session_id, from_number, to_number, content,
                        message_type, timestamp, is_from_me
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `)

                stmt.run(
                    sentMessage.id._serialized,
                    sessionId,
                    'me',
                    chatId,
                    message,
                    'text',
                    Date.now(),
                    1
                )

                console.log('✅ Message sent and saved to database')
                res.json({ success: true, messageId: sentMessage.id._serialized })

            } catch (error) {
                console.error('❌ Error sending message:', error)
                res.status(500).json({ error: 'Failed to send message' })
            }
        })

        // Send media endpoint
        this.app.post('/api/send-media', async (req, res) => {
            try {
                const { sessionId, chatId } = req.body

                if (!sessionId || !chatId) {
                    return res.status(400).json({ error: 'Missing required fields' })
                }

                const client = this.clients.get(sessionId)
                if (!client) {
                    return res.status(404).json({ error: 'Session not found' })
                }

                console.log('📤 Media upload endpoint called')

                // For now, return success (implement file handling later)
                res.json({ success: true, message: 'Media upload endpoint ready' })

            } catch (error) {
                console.error('❌ Error sending media:', error)
                res.status(500).json({ error: 'Failed to send media' })
            }
        })

        // Ultra Advanced Endpoints
        this.app.get('/api/ultra/conversations', async (req, res) => {
            try {
                const { sessionId } = req.query

                if (!sessionId) {
                    return res.status(400).json({ error: 'Session ID required' })
                }

                console.log(`🔄 Loading ultra conversations for session: ${sessionId}`)

                // Get all messages from database for this session
                const messages = this.db.prepare(`
                    SELECT * FROM messages
                    WHERE session_id = ?
                    ORDER BY timestamp DESC
                `).all(sessionId)

                // Group messages by conversation with enhanced data
                const conversationMap = new Map()

                messages.forEach(message => {
                    const contactId = message.from_number === 'me' ? message.to_number : message.from_number
                    const conversationId = `${sessionId}_${contactId}`

                    if (!conversationMap.has(conversationId)) {
                        conversationMap.set(conversationId, {
                            id: contactId,
                            contactId: contactId,
                            sessionId: sessionId,
                            name: message.contact_name || contactId.replace('@c.us', '').replace('@g.us', ''),
                            phoneNumber: contactId,
                            profilePic: message.profile_pic_url,
                            messages: [],
                            lastMessage: null,
                            lastMessageTime: 0,
                            unreadCount: 0,
                            isPinned: false,
                            isMuted: false,
                            isArchived: false,
                            isGroup: message.is_group_message === 1,
                            tags: [],
                            customFields: {}
                        })
                    }

                    const conversation = conversationMap.get(conversationId)
                    conversation.messages.push(message)

                    // Set last message
                    if (!conversation.lastMessage || message.timestamp > conversation.lastMessageTime) {
                        conversation.lastMessage = {
                            content: message.content || message.body,
                            timestamp: message.timestamp,
                            isFromMe: message.from_number === 'me',
                            type: message.message_type || 'text'
                        }
                        conversation.lastMessageTime = message.timestamp
                    }

                    // Count unread messages (assuming messages not from me are unread)
                    if (message.from_number !== 'me') {
                        conversation.unreadCount++
                    }
                })

                const conversations = Array.from(conversationMap.values())
                console.log(`✅ Ultra conversations loaded: ${conversations.length}`)

                res.json(conversations)
            } catch (error) {
                console.error('❌ Error loading ultra conversations:', error)
                res.status(500).json({ error: 'Failed to load conversations' })
            }
        })

        // Ultra contact details endpoint
        this.app.get('/api/ultra/contact/:contactId', async (req, res) => {
            try {
                const { contactId } = req.params
                const { sessionId } = req.query

                console.log(`🔄 Loading ultra contact details: ${contactId}`)

                // Get contact from database
                const contact = this.db.prepare(`
                    SELECT * FROM contacts
                    WHERE contact_id = ? AND session_id = ?
                `).get(contactId, sessionId)

                if (contact) {
                    res.json({
                        id: contact.contact_id,
                        name: contact.name,
                        phoneNumber: contact.phone_number,
                        profilePic: contact.profile_pic_url,
                        about: contact.about,
                        status: contact.status,
                        lastSeen: contact.last_seen,
                        isBlocked: contact.is_blocked === 1,
                        isBusiness: contact.is_business === 1,
                        isVerified: contact.is_verified === 1,
                        labels: contact.labels ? JSON.parse(contact.labels) : [],
                        tags: contact.tags ? JSON.parse(contact.tags) : [],
                        notes: contact.notes,
                        customName: contact.custom_name,
                        location: contact.location ? JSON.parse(contact.location) : null,
                        socialLinks: contact.social_links ? JSON.parse(contact.social_links) : []
                    })
                } else {
                    // Return basic info if not in database
                    res.json({
                        id: contactId,
                        name: contactId.replace('@c.us', '').replace('@g.us', ''),
                        phoneNumber: contactId,
                        profilePic: null,
                        isBlocked: false,
                        isBusiness: false,
                        isVerified: false,
                        labels: [],
                        tags: [],
                        socialLinks: []
                    })
                }
            } catch (error) {
                console.error('❌ Error loading ultra contact:', error)
                res.status(500).json({ error: 'Failed to load contact' })
            }
        })

        // Ultra messages endpoint
        this.app.get('/api/ultra/messages/:chatId', (req, res) => {
            try {
                const { chatId } = req.params
                const { sessionId } = req.query

                console.log(`🔄 Loading ultra messages for: ${chatId}`)

                const messages = this.db.prepare(`
                    SELECT * FROM messages
                    WHERE (from_number = ? OR to_number = ?) AND session_id = ?
                    ORDER BY timestamp ASC
                `).all(chatId, chatId, sessionId)

                // Transform messages with enhanced data
                const transformedMessages = messages.map(msg => ({
                    id: msg.id,
                    content: msg.content || msg.body,
                    type: msg.message_type || 'text',
                    timestamp: msg.timestamp,
                    isFromMe: msg.from_number === 'me',
                    status: 'delivered',
                    mediaUrl: msg.media_url,
                    thumbnailUrl: msg.thumbnail_url,
                    fileName: msg.file_name,
                    fileSize: msg.file_size,
                    duration: msg.duration,
                    mimeType: msg.mime_type,
                    replyTo: msg.reply_to,
                    mentions: msg.mentions ? JSON.parse(msg.mentions) : [],
                    isForwarded: msg.is_forwarded === 1,
                    forwardedFrom: msg.forwarded_from,
                    isStarred: msg.is_starred === 1,
                    reactions: msg.reactions ? JSON.parse(msg.reactions) : [],
                    editedAt: msg.edited_at,
                    deletedAt: msg.deleted_at,
                    location: msg.location ? JSON.parse(msg.location) : null,
                    contact: msg.contact_data ? JSON.parse(msg.contact_data) : null
                }))

                console.log(`✅ Ultra messages loaded: ${transformedMessages.length}`)
                res.json(transformedMessages)
            } catch (error) {
                console.error('❌ Error loading ultra messages:', error)
                res.status(500).json({ error: 'Failed to load messages' })
            }
        })

        // Ultra send message endpoint
        this.app.post('/api/ultra/send-message', async (req, res) => {
            try {
                const { sessionId, chatId, message, replyTo, mentions, type } = req.body

                if (!sessionId || !chatId || !message) {
                    return res.status(400).json({ error: 'Missing required fields' })
                }

                const client = this.clients.get(sessionId)
                if (!client) {
                    return res.status(404).json({ error: 'Session not found' })
                }

                console.log(`📤 Sending ultra message to ${chatId}`)

                // Send message via WhatsApp
                const sentMessage = await client.sendMessage(chatId, message)

                // Save to database with enhanced data
                const stmt = this.db.prepare(`
                    INSERT INTO messages (
                        id, session_id, from_number, to_number, content,
                        message_type, timestamp, is_from_me, reply_to, mentions
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `)

                stmt.run(
                    sentMessage.id._serialized,
                    sessionId,
                    'me',
                    chatId,
                    message,
                    type || 'text',
                    Date.now(),
                    1,
                    replyTo || null,
                    mentions ? JSON.stringify(mentions) : null
                )

                console.log('✅ Ultra message sent and saved')
                res.json({ success: true, messageId: sentMessage.id._serialized })

            } catch (error) {
                console.error('❌ Error sending ultra message:', error)
                res.status(500).json({ error: 'Failed to send message' })
            }
        })

        // Ultra send media endpoint
        this.app.post('/api/ultra/send-media', async (req, res) => {
            try {
                const { sessionId, chatId, caption } = req.body

                if (!sessionId || !chatId) {
                    return res.status(400).json({ error: 'Missing required fields' })
                }

                const client = this.clients.get(sessionId)
                if (!client) {
                    return res.status(404).json({ error: 'Session not found' })
                }

                console.log('📤 Ultra media upload endpoint called')

                // For now, return success (implement file handling with multer later)
                res.json({
                    success: true,
                    message: 'Ultra media upload endpoint ready',
                    mediaUrl: '/placeholder-media-url'
                })

            } catch (error) {
                console.error('❌ Error sending ultra media:', error)
                res.status(500).json({ error: 'Failed to send media' })
            }
        })

        // Manual sync endpoint for debugging
        this.app.post('/api/sync-chats', async (req, res) => {
            try {
                const { sessionId } = req.body
                console.log(`🔄 Manual sync requested for session: ${sessionId}`)

                if (!sessionId) {
                    return res.status(400).json({ error: 'Session ID required' })
                }

                const client = this.clients.get(sessionId)
                if (!client) {
                    return res.status(404).json({ error: 'Session not found or not connected' })
                }

                // Check if client is ready
                if (!client.info) {
                    return res.status(400).json({ error: 'Client not ready. Please scan QR code first.' })
                }

                console.log(`📱 Client info:`, client.info.wid?.user)

                // Trigger manual sync
                await this.syncAllChats(sessionId, client)

                res.json({
                    success: true,
                    message: 'Chat sync initiated',
                    sessionId,
                    phoneNumber: client.info.wid?.user
                })
            } catch (error) {
                console.error('❌ Manual sync error:', error)
                res.status(500).json({ error: 'Sync failed', details: error.message })
            }
        })

        // Test message event (for debugging)
        this.app.post('/api/test-message', (req, res) => {
            console.log('🧪 Test message endpoint called')

            // Get first available session or use provided sessionId
            const { sessionId } = req.body || {}
            const availableSessions = Array.from(this.sessions.values())
            const targetSession = sessionId || (availableSessions.length > 0 ? availableSessions[0].id : 'test-session')

            // Create different test messages for different contacts
            const contacts = [
                { from: '1234567890@c.us', to: 'me', name: 'John Doe' },
                { from: '9876543210@c.us', to: 'me', name: 'Jane Smith' },
                { from: '5555555555@c.us', to: 'me', name: 'Bob Wilson' },
                { from: 'me', to: '1234567890@c.us', name: 'My Reply' }
            ]

            const randomContact = contacts[Math.floor(Math.random() * contacts.length)]

            const testMessage = {
                sessionId: targetSession,
                id: 'test_' + Date.now(),
                body: `Test message from ${randomContact.name} - ${new Date().toLocaleTimeString()}`,
                from: randomContact.from,
                to: randomContact.to,
                timestamp: Date.now(),
                type: 'chat',
                isGroupMsg: false,
                author: null
            }

            // Save test message to database
            try {
                const now = new Date().toISOString();

                // First create session if it doesn't exist (only for test-session)
                if (targetSession === 'test-session') {
                    const sessionStmt = this.db.prepare(`
                        INSERT OR IGNORE INTO whatsapp_sessions (id, name, status, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `);

                    sessionStmt.run('test-session', 'Test Session', 'ready', 1, now, now);
                }

                const stmt = this.db.prepare(`
                    INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                const dbMessageId = `test_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                stmt.run(
                    dbMessageId,
                    testMessage.sessionId,
                    testMessage.id,
                    testMessage.from,
                    testMessage.to,
                    testMessage.body,
                    'text', // Convert 'chat' to 'text' for database constraint
                    testMessage.isGroupMsg ? 1 : 0,
                    testMessage.author,
                    testMessage.timestamp,
                    now
                );

                console.log(`📝 Test message saved to database: ${dbMessageId}`);
            } catch (dbError) {
                console.error('❌ Failed to save test message to database:', dbError);
            }

            console.log('📡 Emitting test message:', testMessage)
            this.io.emit('new_message', testMessage)
            this.io.emit('test_message', testMessage)

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
                const result = await client.sendMessage(chatId, message);

                console.log(`✅ Message sent successfully to ${to}`);

                // Save message to database
                try {
                    const messageId = result.id._serialized || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const timestamp = Date.now();
                    const now = new Date().toISOString();

                    const stmt = this.db.prepare(`
                        INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    const dbMessageId = `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                    stmt.run(
                        dbMessageId,
                        sessionId,
                        messageId,
                        'me', // from_number for sent messages
                        chatId,
                        message,
                        type,
                        0, // is_group_message
                        null, // author
                        timestamp,
                        now
                    );

                    console.log(`📝 Message saved to database: ${dbMessageId}`);
                } catch (dbError) {
                    console.error('❌ Failed to save message to database:', dbError);
                    // Don't fail the API call for database errors
                }

                res.json({
                    success: true,
                    message: 'Message sent successfully'
                });
            } catch (error) {
                console.error(`❌ Error sending message to ${to}:`, error);
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

        // Send media message
        this.app.post('/api/messages/send-media', async (req, res) => {
            const { sessionId, to, mediaType, mediaUrl, caption = '', filename = 'media' } = req.body;

            console.log(`📎 Sending media message to ${to} via session ${sessionId}:`, {
                mediaType,
                mediaUrl,
                caption,
                filename
            });

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

                // Download media from URL if it's a blob URL or external URL
                let mediaMessage;

                if (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('http')) {
                    // For blob URLs or external URLs, we need to fetch the media
                    const fetch = (await import('node-fetch')).default;
                    const response = await fetch(mediaUrl);
                    const buffer = await response.buffer();

                    // Create MessageMedia object
                    const { MessageMedia } = await import('whatsapp-web.js');
                    const media = new MessageMedia(
                        response.headers.get('content-type') || `${mediaType}/*`,
                        buffer.toString('base64'),
                        filename
                    );

                    mediaMessage = media;
                } else {
                    // For local file paths
                    // fs and path already imported at top

                    let filePath = mediaUrl;
                    if (mediaUrl.startsWith('/uploads/')) {
                        filePath = path.join(process.cwd(), 'public', mediaUrl);
                    }

                    if (fs.existsSync(filePath)) {
                        const { MessageMedia } = await import('whatsapp-web.js');
                        mediaMessage = MessageMedia.fromFilePath(filePath);
                    } else {
                        throw new Error(`Media file not found: ${filePath}`);
                    }
                }

                // Send media message
                const result = await client.sendMessage(chatId, mediaMessage, { caption });

                console.log(`✅ Media message sent successfully to ${to}`);

                // Save media message to database
                try {
                    const messageId = result.id._serialized || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const timestamp = Date.now();
                    const now = new Date().toISOString();

                    const stmt = this.db.prepare(`
                        INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at, media_url, media_type, filename)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    const dbMessageId = `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                    stmt.run(
                        dbMessageId,
                        sessionId,
                        messageId,
                        'me', // from_number for sent messages
                        chatId,
                        caption || `📎 ${filename}`,
                        mediaType,
                        0, // is_group_message
                        null, // author
                        timestamp,
                        now,
                        mediaUrl,
                        mediaType,
                        filename
                    );

                    console.log(`📝 Media message saved to database: ${dbMessageId}`);
                } catch (dbError) {
                    console.error('❌ Failed to save media message to database:', dbError);
                    // Don't fail the API call for database errors
                }

                res.json({
                    success: true,
                    message: 'Media message sent successfully',
                    messageId: result.id._serialized
                });

            } catch (error) {
                console.error(`❌ Error sending media message to ${to}:`, error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to send media message'
                });
            }
        });

        // Database endpoints
        this.app.get('/api/database/messages', (req, res) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 1000');
                const messages = stmt.all();
                console.log(`📊 Retrieved ${messages.length} messages from database`);
                res.json(messages);
            } catch (error) {
                console.error('❌ Error retrieving messages from database:', error);
                res.status(500).json({ error: 'Failed to retrieve messages' });
            }
        });

        // Debug endpoint for specific conversation
        this.app.get('/api/debug/conversation/:contactId', (req, res) => {
            try {
                const { contactId } = req.params
                const messages = this.db.prepare(`
                    SELECT * FROM messages
                    WHERE (from_number = ? AND to_number = 'me')
                       OR (from_number = 'me' AND to_number = ?)
                    ORDER BY timestamp ASC
                `).all(contactId, contactId)

                console.log(`🔍 Debug: Found ${messages.length} messages for conversation with ${contactId}`)
                res.json({
                    contactId,
                    messageCount: messages.length,
                    messages: messages.map(msg => ({
                        id: msg.id,
                        from: msg.from_number,
                        to: msg.to_number,
                        body: msg.body,
                        timestamp: msg.timestamp,
                        isOutgoing: msg.from_number === 'me'
                    }))
                })
            } catch (error) {
                console.error('❌ Error retrieving conversation:', error)
                res.status(500).json({ error: 'Failed to retrieve conversation' })
            }
        });

        // Force session update endpoint (temporary for testing)
        this.app.post('/api/force-session-update', (req, res) => {
            try {
                const { sessionId, status, phoneNumber } = req.body

                const session = this.sessions.get(sessionId)
                if (session) {
                    session.status = status
                    session.phoneNumber = phoneNumber
                    this.sessions.set(sessionId, session)

                    // Update database
                    this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).run(status, phoneNumber, sessionId)

                    // Broadcast update
                    this.broadcastSessionsUpdate()

                    console.log(`🔄 Force updated session ${sessionId} to status: ${status}`)
                    res.json({ success: true, message: 'Session updated successfully' })
                } else {
                    res.status(404).json({ error: 'Session not found' })
                }
            } catch (error) {
                console.error('❌ Error force updating session:', error)
                res.status(500).json({ error: 'Failed to update session' })
            }
        });

        this.app.get('/api/database/contacts', (req, res) => {
            try {
                const stmt = this.db.prepare('SELECT * FROM contacts ORDER BY name ASC');
                const contacts = stmt.all();
                console.log(`📊 Retrieved ${contacts.length} contacts from database`);
                res.json(contacts);
            } catch (error) {
                console.error('❌ Error retrieving contacts from database:', error);
                res.status(500).json({ error: 'Failed to retrieve contacts' });
            }
        });

        // Get contacts with enhanced sync
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
                console.log(`📞 Fetching contacts for session: ${sessionId}`);
                const contacts = await client.getContacts();

                const formattedContacts = await Promise.all(contacts.map(async (contact) => {
                    let profilePicUrl = null;
                    let isOnline = false;
                    let lastSeen = null;

                    try {
                        // Try to get profile picture
                        profilePicUrl = await contact.getProfilePicUrl();
                    } catch (picError) {
                        console.log(`⚠️ No profile pic for ${contact.number}`);
                    }

                    try {
                        // Get contact status if available
                        const chat = await contact.getChat();
                        if (chat) {
                            isOnline = chat.isOnline || false;
                            lastSeen = chat.lastSeen || null;
                        }
                    } catch (statusError) {
                        console.log(`⚠️ No status info for ${contact.number}`);
                    }

                    return {
                        id: contact.id._serialized,
                        name: contact.name || contact.pushname || contact.formattedName || 'Unknown',
                        number: contact.number,
                        isGroup: contact.isGroup,
                        profilePicUrl,
                        isOnline,
                        lastSeen,
                        isMyContact: contact.isMyContact || false,
                        isWAContact: contact.isWAContact || false
                    };
                }));

                console.log(`✅ Formatted ${formattedContacts.length} contacts with enhanced data`);

                res.json({
                    success: true,
                    contacts: formattedContacts
                });

                // Emit real-time update
                this.io.emit('contacts_updated', {
                    sessionId,
                    contacts: formattedContacts
                });

            } catch (error) {
                console.error(`❌ Error fetching contacts for ${sessionId}:`, error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get contacts',
                    error: error.message
                });
            }
        });

        // Get chats with enhanced contact info
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
                console.log(`💬 Fetching chats for session: ${sessionId}`);
                const chats = await client.getChats();

                const formattedChats = await Promise.all(chats.map(async (chat) => {
                    let contactInfo = null;

                    try {
                        // Get contact information
                        const contact = await chat.getContact();
                        let profilePicUrl = null;

                        try {
                            profilePicUrl = await contact.getProfilePicUrl();
                        } catch (picError) {
                            // Profile pic not available
                        }

                        contactInfo = {
                            id: contact.id._serialized,
                            name: contact.name || contact.pushname || contact.formattedName || chat.name || 'Unknown',
                            number: contact.number,
                            profilePicUrl,
                            isGroup: contact.isGroup,
                            isOnline: false, // Will be updated in real-time
                            lastSeen: null,
                            isMyContact: contact.isMyContact || false,
                            isWAContact: contact.isWAContact || false
                        };
                    } catch (contactError) {
                        console.log(`⚠️ Could not get contact info for chat: ${chat.id._serialized}`);
                        contactInfo = {
                            id: chat.id._serialized,
                            name: chat.name || 'Unknown',
                            number: chat.id._serialized.split('@')[0],
                            profilePicUrl: null,
                            isGroup: chat.isGroup,
                            isOnline: false,
                            lastSeen: null,
                            isMyContact: false,
                            isWAContact: false
                        };
                    }

                    return {
                        id: chat.id._serialized,
                        contact: contactInfo,
                        unreadCount: chat.unreadCount,
                        lastMessage: chat.lastMessage ? {
                            body: chat.lastMessage.body,
                            timestamp: chat.lastMessage.timestamp,
                            from: chat.lastMessage.from
                        } : null,
                        isGroup: chat.isGroup,
                        timestamp: chat.timestamp || Date.now()
                    };
                }));

                // Sort by timestamp (most recent first)
                formattedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                console.log(`✅ Formatted ${formattedChats.length} chats with contact info`);

                res.json({
                    success: true,
                    conversations: formattedChats
                });

                // Emit real-time update
                this.io.emit('conversations_updated', {
                    sessionId,
                    conversations: formattedChats
                });

            } catch (error) {
                console.error(`❌ Error fetching chats for ${sessionId}:`, error);
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

            // Send current sessions immediately on connection
            const sessionsList = Array.from(this.sessions.values()).map(session => ({
                id: session.id,
                name: session.name,
                status: session.status,
                phone_number: session.phoneNumber,
                qr_code: session.qrCode,
                is_active: session.isActive,
                created_at: session.createdAt
            }));
            socket.emit('sessions_updated', sessionsList);

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id);
            });

            // Throttled data requests to prevent spam
            let lastRequestTime = {};
            const REQUEST_THROTTLE = 2000; // 2 seconds

            socket.on('get_sessions', () => {
                const now = Date.now();
                if (lastRequestTime.sessions && now - lastRequestTime.sessions < REQUEST_THROTTLE) {
                    return; // Ignore rapid requests
                }
                lastRequestTime.sessions = now;

                console.log('📡 Client requested sessions update');
                const sessionsList = Array.from(this.sessions.values()).map(session => ({
                    id: session.id,
                    name: session.name,
                    status: session.status,
                    phone_number: session.phoneNumber,
                    qr_code: session.qrCode,
                    is_active: session.isActive,
                    created_at: session.createdAt
                }));
                socket.emit('sessions_updated', sessionsList);
            });

            socket.on('get_contacts', async (data) => {
                const now = Date.now();
                if (lastRequestTime.contacts && now - lastRequestTime.contacts < REQUEST_THROTTLE) {
                    return;
                }
                lastRequestTime.contacts = now;

                const { sessionId } = data || {};
                if (!sessionId || !this.clients.has(sessionId)) {
                    socket.emit('contacts_updated', []);
                    return;
                }

                try {
                    console.log(`📞 Socket request for contacts: ${sessionId}`);
                    const client = this.clients.get(sessionId);
                    const contacts = await client.getContacts();

                    const formattedContacts = await Promise.all(contacts.map(async (contact) => {
                        let profilePicUrl = null;
                        let isOnline = false;
                        let lastSeen = null;

                        try {
                            profilePicUrl = await contact.getProfilePicUrl();
                        } catch (picError) {
                            // Profile pic not available
                        }

                        try {
                            const chat = await contact.getChat();
                            if (chat) {
                                isOnline = chat.isOnline || false;
                                lastSeen = chat.lastSeen || null;
                            }
                        } catch (statusError) {
                            // Status not available
                        }

                        return {
                            id: contact.id._serialized,
                            name: contact.name || contact.pushname || contact.formattedName || 'Unknown',
                            number: contact.number,
                            isGroup: contact.isGroup,
                            profilePicUrl,
                            isOnline,
                            lastSeen,
                            isMyContact: contact.isMyContact || false,
                            isWAContact: contact.isWAContact || false
                        };
                    }));

                    socket.emit('contacts_updated', {
                        sessionId,
                        contacts: formattedContacts
                    });
                } catch (error) {
                    console.error('Error getting contacts via socket:', error);
                    socket.emit('contacts_updated', []);
                }
            });

            socket.on('get_conversations', async (data) => {
                const now = Date.now();
                if (lastRequestTime.conversations && now - lastRequestTime.conversations < REQUEST_THROTTLE) {
                    return;
                }
                lastRequestTime.conversations = now;

                const { sessionId } = data || {};
                if (!sessionId || !this.clients.has(sessionId)) {
                    socket.emit('conversations_updated', []);
                    return;
                }

                try {
                    console.log(`💬 Socket request for conversations: ${sessionId}`);
                    const client = this.clients.get(sessionId);
                    const chats = await client.getChats();

                    const formattedChats = await Promise.all(chats.map(async (chat) => {
                        let contactInfo = null;

                        try {
                            const contact = await chat.getContact();
                            let profilePicUrl = null;

                            try {
                                profilePicUrl = await contact.getProfilePicUrl();
                            } catch (picError) {
                                // Profile pic not available
                            }

                            contactInfo = {
                                id: contact.id._serialized,
                                name: contact.name || contact.pushname || contact.formattedName || chat.name || 'Unknown',
                                number: contact.number,
                                profilePicUrl,
                                isGroup: contact.isGroup,
                                isOnline: false,
                                lastSeen: null,
                                isMyContact: contact.isMyContact || false,
                                isWAContact: contact.isWAContact || false
                            };
                        } catch (contactError) {
                            contactInfo = {
                                id: chat.id._serialized,
                                name: chat.name || 'Unknown',
                                number: chat.id._serialized.split('@')[0],
                                profilePicUrl: null,
                                isGroup: chat.isGroup,
                                isOnline: false,
                                lastSeen: null,
                                isMyContact: false,
                                isWAContact: false
                            };
                        }

                        return {
                            id: chat.id._serialized,
                            contact: contactInfo,
                            unreadCount: chat.unreadCount,
                            lastMessage: chat.lastMessage ? {
                                body: chat.lastMessage.body,
                                timestamp: chat.lastMessage.timestamp,
                                from: chat.lastMessage.from
                            } : null,
                            isGroup: chat.isGroup,
                            timestamp: chat.timestamp || Date.now()
                        };
                    }));

                    formattedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                    socket.emit('conversations_updated', {
                        sessionId,
                        conversations: formattedChats
                    });
                } catch (error) {
                    console.error('Error getting conversations via socket:', error);
                    socket.emit('conversations_updated', []);
                }
            });

            socket.on('get_messages', async () => {
                const now = Date.now();
                if (lastRequestTime.messages && now - lastRequestTime.messages < REQUEST_THROTTLE) {
                    return;
                }
                lastRequestTime.messages = now;

                try {
                    const messages = await this.getAllMessages();
                    console.log(`📨 Sending ${messages.length} messages to client`);
                    socket.emit('messages_updated', messages);
                } catch (error) {
                    console.error('Error getting messages:', error);
                    socket.emit('messages_updated', []);
                }
            });

            socket.on('get_templates', () => {
                const now = Date.now();
                if (lastRequestTime.templates && now - lastRequestTime.templates < REQUEST_THROTTLE) {
                    return;
                }
                lastRequestTime.templates = now;
                socket.emit('templates_updated', []);
            });

            socket.on('get_campaigns', () => {
                const now = Date.now();
                if (lastRequestTime.campaigns && now - lastRequestTime.campaigns < REQUEST_THROTTLE) {
                    return;
                }
                lastRequestTime.campaigns = now;
                socket.emit('campaigns_updated', []);
            });

            socket.on('get_analytics', () => {
                const now = Date.now();
                if (lastRequestTime.analytics && now - lastRequestTime.analytics < REQUEST_THROTTLE) {
                    return;
                }
                lastRequestTime.analytics = now;

                console.log('📊 Client requested analytics update');
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

    // Helper function to normalize message type
    normalizeMessageType(messageType) {
        if (!messageType) return 'text';

        const type = messageType.toLowerCase();

        // Map WhatsApp message types to our database types
        const typeMapping = {
            'chat': 'text',
            'ptt': 'audio',
            'e2e_notification': 'text',
            'notification_template': 'text',
            'gp2': 'text',
            'revoked': 'text',
            'ciphertext': 'text',
            'location': 'text',
            'vcard': 'document',
            'multi_vcard': 'document',
            'sticker': 'image',
            'gif': 'video'
        };

        // Check if it's already a valid type
        const validTypes = ['text', 'image', 'video', 'audio', 'document'];
        if (validTypes.includes(type)) {
            return type;
        }

        // Use mapping or default to text
        return typeMapping[type] || 'text';
    }

    // Broadcast sessions update to all connected clients
    broadcastSessionsUpdate() {
        const sessions = Array.from(this.sessions.values());
        this.io.emit('sessions_updated', sessions);
        console.log(`📡 Broadcasting sessions update to all clients: ${sessions.length} sessions`);
    }

    // Sync all chats from WhatsApp
    async syncAllChats(sessionId, client) {
        try {
            console.log(`🔄 Starting chat sync for session: ${sessionId}`);

            const chats = await client.getChats();
            console.log(`📱 Found ${chats.length} chats to sync`);

            let syncedCount = 0;
            for (const chat of chats.slice(0, 20)) { // Limit to first 20 chats for performance
                try {
                    // Get recent messages from this chat
                    const messages = await chat.fetchMessages({ limit: 10 });
                    console.log(`💬 Syncing ${messages.length} messages from chat: ${chat.name || chat.id._serialized}`);

                    for (const message of messages) {
                        try {
                            // Check if message already exists
                            const existingStmt = this.db.prepare('SELECT id FROM messages WHERE whatsapp_message_id = ? AND session_id = ?');
                            const existing = existingStmt.get(message.id._serialized, sessionId);

                            if (!existing) {
                                // Get contact info
                                let contactInfo = null;
                                try {
                                    const contact = await message.getContact();
                                    contactInfo = {
                                        name: contact.name || contact.pushname || contact.formattedName || null,
                                        profilePicUrl: null
                                    };

                                    // Try to get profile picture
                                    try {
                                        contactInfo.profilePicUrl = await contact.getProfilePicUrl();
                                    } catch (picError) {
                                        // Profile pic not available
                                    }
                                } catch (contactError) {
                                    // Contact info not available
                                }

                                // Save new message
                                const timestamp = message.timestamp * 1000;
                                const now = new Date().toISOString();

                                const stmt = this.db.prepare(`
                                    INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at, contact_name, profile_pic_url)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `);

                                const normalizedType = this.normalizeMessageType(message.type);
                                console.log(`🔍 Sync message type debug: original="${message.type}", normalized="${normalizedType}"`);

                                const dbMessageId = `sync_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                                stmt.run(
                                    dbMessageId,
                                    sessionId,
                                    message.id._serialized,
                                    message.from,
                                    message.to,
                                    message.body || '',
                                    normalizedType,
                                    message.isGroupMsg ? 1 : 0,
                                    message.author || null,
                                    timestamp,
                                    now,
                                    contactInfo?.name || null,
                                    contactInfo?.profilePicUrl || null
                                );

                                syncedCount++;
                            }
                        } catch (messageError) {
                            console.error('❌ Error syncing message:', messageError.message);
                        }
                    }
                } catch (chatError) {
                    console.error('❌ Error syncing chat:', chatError.message);
                }
            }

            console.log(`✅ Chat sync completed for session ${sessionId}: ${syncedCount} new messages synced`);

            // Emit sync completion event
            this.io.emit('chats_synced', { sessionId, syncedCount, totalChats: chats.length });

        } catch (error) {
            console.error(`❌ Error syncing chats for session ${sessionId}:`, error);
        }
    }

    async createWhatsAppClient(sessionId, sessionName) {
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
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-ipc-flooding-protection',
                    '--memory-pressure-off'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                timeout: 60000
            }
        });

        // Store client
        this.clients.set(sessionId, client);

        // Store session info
        this.sessions.set(sessionId, {
            id: sessionId,
            name: sessionName,
            status: 'initializing',
            qrCode: null,
            phoneNumber: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // QR Code event
        client.on('qr', async (qr) => {
            console.log(`📱 QR Code generated for session ${sessionId}`);

            // Update session with QR code
            const session = this.sessions.get(sessionId);
            if (session) {
                session.qrCode = qr;
                session.status = 'qr_code';
                session.updatedAt = new Date().toISOString();

                // Save QR code to database
                try {
                    const stmt = this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, qr_code = ?, updated_at = ?
                        WHERE id = ?
                    `);
                    stmt.run('qr_code', qr, new Date().toISOString(), sessionId);
                } catch (error) {
                    console.error(`❌ Failed to save QR code to database for ${sessionId}:`, error);
                }

                // Emit QR code to frontend
                this.io.emit('qr_code', { sessionId, qrCode: qr });

                // Broadcast sessions update
                this.broadcastSessionsUpdate();
            }
        });

        // Ready event
        client.on('ready', async () => {
            console.log(`✅ WhatsApp client ${sessionId} is ready!`);

            const session = this.sessions.get(sessionId);
            if (session) {
                session.status = 'ready';
                session.phoneNumber = client.info.wid.user;
                session.qrCode = null;
                session.isActive = true;
                session.updatedAt = new Date().toISOString();

                // Save session to database
                try {
                    const stmt = this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, phone_number = ?, qr_code = ?, is_active = ?, updated_at = ?
                        WHERE id = ?
                    `);
                    stmt.run('ready', client.info.wid.user, null, 1, new Date().toISOString(), sessionId);
                    console.log(`✅ Session ${sessionId} saved to database as ready`);
                } catch (error) {
                    console.error(`❌ Database save error for session ${sessionId}:`, error);
                }

                this.io.emit('client_ready', { sessionId, phoneNumber: client.info.wid.user });

                // Broadcast sessions update
                this.broadcastSessionsUpdate();

                // Auto-sync all chats when ready
                console.log(`🔄 Auto-syncing all chats for session: ${sessionId}`);
                setTimeout(() => {
                    this.syncAllChats(sessionId, client);
                }, 2000); // Wait 2 seconds for client to be fully ready
            }
        });

        // Message event
        client.on('message', async (message) => {
            console.log(`📨 New message received in session ${sessionId}:`, message.body);

            // Get contact info for profile photo and name
            let contactInfo = null;
            try {
                const contact = await message.getContact();
                contactInfo = {
                    name: contact.name || contact.pushname || contact.formattedName || null,
                    profilePicUrl: null,
                    isMyContact: contact.isMyContact || false,
                    isWAContact: contact.isWAContact || false
                };

                // Try to get profile picture
                try {
                    contactInfo.profilePicUrl = await contact.getProfilePicUrl();
                } catch (picError) {
                    console.log('⚠️ Could not get profile picture for:', contact.number);
                }

                console.log('👤 Contact info:', contactInfo);
            } catch (contactError) {
                console.log('⚠️ Could not get contact info:', contactError.message);
            }

            const messageData = {
                sessionId,
                id: message.id._serialized,
                body: message.body,
                from: message.from,
                to: message.to,
                timestamp: message.timestamp,
                type: this.normalizeMessageType(message.type),
                isGroupMsg: message.isGroupMsg,
                author: message.author,
                contactName: contactInfo?.name || null,
                profilePicUrl: contactInfo?.profilePicUrl || null
            };

            // Save incoming message to database
            try {
                const timestamp = message.timestamp * 1000; // Convert to milliseconds
                const now = new Date().toISOString();

                const stmt = this.db.prepare(`
                    INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at, contact_name, profile_pic_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                const normalizedType = this.normalizeMessageType(message.type);
                console.log(`🔍 Message type debug: original="${message.type}", normalized="${normalizedType}"`);

                const dbMessageId = `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                stmt.run(
                    dbMessageId,
                    sessionId,
                    message.id._serialized,
                    message.from,
                    message.to,
                    message.body,
                    normalizedType,
                    message.isGroupMsg ? 1 : 0,
                    message.author,
                    timestamp,
                    now,
                    contactInfo?.name || null,
                    contactInfo?.profilePicUrl || null
                );

                console.log(`📝 Incoming message saved to database: ${dbMessageId}`);
            } catch (dbError) {
                console.error('❌ Failed to save incoming message to database:', dbError);
            }

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

            // Auto-sync contact profile if not already synced
            this.autoSyncContactProfile(sessionId, message.from);
        });

        // Auto-sync contact profile photos
        client.on('contact_changed', async (contact) => {
            console.log(`👤 Contact changed: ${contact.id._serialized}`);
            this.autoSyncContactProfile(sessionId, contact.id._serialized);
        });

        // Listen for presence updates (online/offline status)
        client.on('presence_update', async (presence) => {
            console.log(`👁️ Presence update: ${presence.id._serialized} - ${presence.state}`);

            const presenceData = {
                sessionId,
                contactId: presence.id._serialized,
                isOnline: presence.state === 'available',
                lastSeen: presence.lastSeen || null,
                timestamp: Date.now()
            };

            // Emit presence update to all clients
            this.io.emit('presence_update', presenceData);
        });

        // Listen for typing indicators
        client.on('typing', async (chat, isTyping) => {
            console.log(`⌨️ Typing status: ${chat.id._serialized} - ${isTyping}`);

            const typingData = {
                sessionId,
                chatId: chat.id._serialized,
                isTyping,
                timestamp: Date.now()
            };

            this.io.emit('typing_status', typingData);
        });

        // Authentication failure
        client.on('auth_failure', async (msg) => {
            console.error(`Authentication failed for session ${sessionId}:`, msg);

            const session = this.sessions.get(sessionId);
            if (session) {
                session.status = 'auth_failure';
                session.updatedAt = new Date().toISOString();

                // Save to database
                try {
                    const stmt = this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, qr_code = ?, updated_at = ?
                        WHERE id = ?
                    `);
                    stmt.run('auth_failure', null, new Date().toISOString(), sessionId);
                } catch (error) {
                    console.error(`❌ Failed to save auth failure to database for ${sessionId}:`, error);
                }

                this.io.emit('auth_failure', { sessionId, message: msg });

                // Broadcast sessions update
                this.broadcastSessionsUpdate();
            }
        });

        // Disconnected event
        client.on('disconnected', async (reason) => {
            console.log(`Client ${sessionId} disconnected:`, reason);

            const session = this.sessions.get(sessionId);
            if (session) {
                session.status = 'disconnected';
                session.updatedAt = new Date().toISOString();

                // Update session in database
                try {
                    const stmt = this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, is_active = ?, updated_at = ?
                        WHERE id = ?
                    `);
                    stmt.run('disconnected', 0, new Date().toISOString(), sessionId);
                    console.log(`✅ Session ${sessionId} marked as disconnected in database`);
                } catch (error) {
                    console.error(`❌ Database update error for session ${sessionId}:`, error);
                }

                this.io.emit('client_disconnected', { sessionId, reason });

                // Broadcast sessions update
                this.broadcastSessionsUpdate();
            }
        });

        // Error handling
        client.on('error', (error) => {
            console.error(`❌ Client error for session ${sessionId}:`, error.message);

            // Don't delete session on error, just mark as disconnected
            const session = this.sessions.get(sessionId);
            if (session && session.status !== 'disconnected') {
                session.status = 'disconnected';
                session.updatedAt = new Date().toISOString();

                try {
                    const stmt = this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, updated_at = ?
                        WHERE id = ?
                    `);
                    stmt.run('disconnected', new Date().toISOString(), sessionId);
                } catch (dbError) {
                    console.error(`❌ Database update error for session ${sessionId}:`, dbError);
                }

                this.broadcastSessionsUpdate();
            }
        });

        // Initialize client with error handling
        try {
            await client.initialize();
            console.log(`✅ Client initialized successfully for session ${sessionId}`);
        } catch (error) {
            console.error(`❌ Failed to initialize client for session ${sessionId}:`, error.message);

            // Mark session as failed
            const session = this.sessions.get(sessionId);
            if (session) {
                session.status = 'auth_failure';
                session.updatedAt = new Date().toISOString();

                try {
                    const stmt = this.db.prepare(`
                        UPDATE whatsapp_sessions
                        SET status = ?, updated_at = ?
                        WHERE id = ?
                    `);
                    stmt.run('auth_failure', new Date().toISOString(), sessionId);
                } catch (dbError) {
                    console.error(`❌ Database update error for session ${sessionId}:`, dbError);
                }

                this.broadcastSessionsUpdate();
            }

            // Don't delete the session, keep it for retry
            return;
        }
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

            // Get sessions from database directly
            const stmt = this.db.prepare('SELECT * FROM whatsapp_sessions WHERE is_active = 1');
            const sessions = stmt.all();

            console.log(`📊 Found ${sessions.length} sessions in database`);

            for (const session of sessions) {
                if (session.status === 'ready' && session.is_active) {
                    // Check if session already exists to prevent duplicates
                    if (this.sessions.has(session.id) || this.clients.has(session.id)) {
                        console.log(`⚠️ Session ${session.name} (${session.id}) already exists, skipping...`);
                        continue;
                    }

                    console.log(`🔄 Restoring session: ${session.name} (${session.id})`);

                    // Create session entry with database status
                    this.sessions.set(session.id, {
                        id: session.id,
                        name: session.name,
                        status: session.status || 'initializing',
                        qrCode: session.qr_code,
                        phoneNumber: session.phone_number,
                        isActive: Boolean(session.is_active),
                        createdAt: session.created_at,
                        updatedAt: session.updated_at
                    });

                    // Create WhatsApp client
                    await this.createWhatsAppClient(session.id, session.name);
                }
            }
        } catch (error) {
            console.error('❌ Failed to restore sessions from database:', error);
        }
    }

    // Helper methods for real-time data
    getApiBaseUrl() {
        // Use the same port as the main server
        const hostname = process.env.NODE_ENV === 'production' ? '192.168.1.230' : 'localhost';
        const port = PORTS.BACKEND; // Use the same port as this server
        return `http://${hostname}:${port}`;
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

    // Auto-sync contact profile photos and info
    async autoSyncContactProfile(sessionId, contactId) {
        if (!this.clients.has(sessionId)) return;

        try {
            const client = this.clients.get(sessionId);
            const contact = await client.getContactById(contactId);

            if (contact) {
                let profilePicUrl = null;
                let isOnline = false;
                let lastSeen = null;

                try {
                    profilePicUrl = await contact.getProfilePicUrl();
                } catch (picError) {
                    console.log(`⚠️ No profile pic for ${contactId}`);
                }

                try {
                    const chat = await contact.getChat();
                    if (chat) {
                        isOnline = chat.isOnline || false;
                        lastSeen = chat.lastSeen || null;
                    }
                } catch (statusError) {
                    console.log(`⚠️ No status info for ${contactId}`);
                }

                const contactData = {
                    sessionId,
                    contact: {
                        id: contact.id._serialized,
                        name: contact.name || contact.pushname || contact.formattedName || 'Unknown',
                        number: contact.number,
                        profilePicUrl,
                        isGroup: contact.isGroup,
                        isOnline,
                        lastSeen,
                        isMyContact: contact.isMyContact || false,
                        isWAContact: contact.isWAContact || false
                    }
                };

                // Emit contact update
                this.io.emit('contact_profile_updated', contactData);
                console.log(`👤 Profile synced for ${contactId}`);
            }
        } catch (error) {
            console.error(`❌ Error syncing contact profile for ${contactId}:`, error);
        }
    }

    start(port = PORTS.BACKEND) {
        const host = process.env.HOST || HOST;
        this.server.listen(port, host, () => {
            console.log(`🚀 WhatsApp server running on http://${host}:${port}`);
            console.log(`📡 Frontend URL: ${URLS.FRONTEND}`);
            console.log(`🔗 API URL: ${URLS.API}`);
        });
    }
}

// Start the server
const whatsappManager = new WhatsAppManager();
whatsappManager.start(process.env.WHATSAPP_SERVER_PORT || PORTS.BACKEND);

module.exports = WhatsAppManager;
