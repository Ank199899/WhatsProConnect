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

// Load configuration
const MASTER_CONFIG = require('../master-config');
const PORTS = {
    FRONTEND: MASTER_CONFIG.INTERNAL_PORTS.FRONTEND,
    BACKEND: MASTER_CONFIG.INTERNAL_PORTS.BACKEND
};

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

        // Initialize PostgreSQL database
        this.initializeDatabase();

        this.setupExpress();
        this.setupSocketIO();
        this.ensureSessionsDirectory();

        // Restore sessions from database on startup
        this.restoreSessionsFromDatabase().catch(console.error);
    }

    async initializeDatabase() {
        try {
            console.log('🗄️ Initializing PostgreSQL database...');
            
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
            this.db = this.pool; // Set db reference for API endpoints

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
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Serve static files (for test pages) - disabled to prevent hanging
        // this.app.use(express.static(path.join(__dirname, '..')));
        
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                sessions: {
                    total: this.sessions.size,
                    active: Array.from(this.sessions.values()).filter(s => s.status === 'ready').length,
                    qr_pending: Array.from(this.sessions.values()).filter(s => s.status === 'qr_code').length,
                    disconnected: Array.from(this.sessions.values()).filter(s => s.status === 'disconnected').length
                },
                clients: {
                    total: this.clients.size,
                    connected: Array.from(this.clients.values()).filter(c => c.info).length
                }
            };
            res.json(health);
        });

        // Debug endpoint for clients
        this.app.get('/api/debug/clients', (req, res) => {
            const clientsInfo = {};
            for (const [sessionId, client] of this.clients.entries()) {
                clientsInfo[sessionId] = {
                    hasClient: !!client,
                    hasInfo: !!client?.info,
                    state: client?.info?.wid ? 'authenticated' : 'not_authenticated',
                    phoneNumber: client?.info?.wid?.user || null
                };
            }
            res.json({
                clientsCount: this.clients.size,
                sessionsCount: this.sessions.size,
                clients: clientsInfo,
                sessionIds: Array.from(this.sessions.keys())
            });
        });

        // Test message endpoint (simplified)
        this.app.post('/api/test-message', async (req, res) => {
            try {
                const { sessionId, to, message } = req.body;

                console.log(`🧪 Test message: ${sessionId} -> ${to}: ${message}`);

                const client = this.clients.get(sessionId);
                if (!client) {
                    return res.json({ success: false, error: 'Client not found' });
                }

                if (!client.info) {
                    return res.json({ success: false, error: 'Client not authenticated' });
                }

                // Just return success without actually sending
                res.json({
                    success: true,
                    message: 'Test endpoint - message would be sent',
                    clientState: client.info ? 'authenticated' : 'not_authenticated'
                });

            } catch (error) {
                res.json({ success: false, error: error.message });
            }
        });

        // Templates API endpoints
        this.app.get('/api/templates', async (req, res) => {
            try {
                // Demo templates for now
                const demoTemplates = [
                    {
                        id: '1',
                        name: 'Welcome Message',
                        content: 'Hello {{name}}! Welcome to {{company}}. How can we help you today?',
                        category: 'greeting',
                        type: 'text',
                        variables: ['name', 'company'],
                        createdAt: '2025-01-01',
                        updatedAt: '2025-01-01',
                        usageCount: 45
                    },
                    {
                        id: '2',
                        name: 'Order Confirmation',
                        content: 'Your order #{{orderNumber}} has been confirmed. Total: {{amount}}. Expected delivery: {{date}}',
                        category: 'order',
                        type: 'text',
                        variables: ['orderNumber', 'amount', 'date'],
                        createdAt: '2025-01-01',
                        updatedAt: '2025-01-01',
                        usageCount: 32
                    },
                    {
                        id: '3',
                        name: 'Support Follow-up',
                        content: 'Hi {{name}}, we wanted to follow up on your recent support request. Is everything resolved?',
                        category: 'support',
                        type: 'text',
                        variables: ['name'],
                        createdAt: '2025-01-01',
                        updatedAt: '2025-01-01',
                        usageCount: 28
                    }
                ];

                res.json({
                    success: true,
                    templates: demoTemplates
                });
            } catch (error) {
                console.error('❌ Error getting templates:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Contacts API endpoints
        this.app.get('/api/contacts', async (req, res) => {
            try {
                const result = await this.db.query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100');
                res.json({
                    success: true,
                    contacts: result.rows
                });
            } catch (error) {
                console.error('❌ Error getting contacts:', error);
                res.json({
                    success: true,
                    contacts: [] // Return empty array as fallback
                });
            }
        });

        // Get contacts for specific session
        this.app.get('/api/contacts/:sessionId', (req, res) => {
            const handleRequest = async () => {
                try {
                    const { sessionId } = req.params;
                    console.log(`📞 Getting contacts for session: ${sessionId}`);

                    // Check if session exists and is ready
                    const session = this.sessions.get(sessionId);
                    if (!session) {
                        return res.json({
                            success: false,
                            message: 'Session not found',
                            contacts: []
                        });
                    }

                    if (session.status !== 'ready') {
                        return res.json({
                            success: false,
                            message: 'Session not ready',
                            contacts: []
                        });
                    }

                    // Try to get contacts from WhatsApp client
                    let contacts = [];
                    try {
                        if (session.client) {
                            const whatsappContacts = await session.client.getContacts();
                            contacts = whatsappContacts.map(contact => ({
                                id: contact.id._serialized,
                                name: contact.name || contact.pushname || contact.id.user,
                                number: contact.number,
                                isGroup: contact.isGroup,
                                profilePicUrl: contact.profilePicUrl
                            }));
                            console.log(`📞 Retrieved ${contacts.length} contacts from WhatsApp`);
                        }
                    } catch (contactError) {
                        console.error('❌ Error getting contacts from WhatsApp:', contactError);
                    }

                    // Also get contacts from database
                    try {
                        if (this.db && this.db.query) {
                            const dbResult = await this.db.query(
                                'SELECT * FROM contacts WHERE session_id = ? ORDER BY created_at DESC',
                                [sessionId]
                            );
                            console.log(`📞 Retrieved ${dbResult.rows.length} contacts from database`);
                        }
                    } catch (dbError) {
                        console.error('❌ Error getting contacts from database:', dbError);
                    }

                    res.json({
                        success: true,
                        contacts: contacts
                    });
                } catch (error) {
                    console.error('❌ Error getting session contacts:', error);
                    res.json({
                        success: false,
                        message: error.message,
                        contacts: []
                    });
                }
            };

            handleRequest();
        });

        // Get all sessions
        this.app.get('/api/sessions', (req, res) => {
            console.log('📱 GET /api/sessions called');
            console.log('📊 Sessions in memory:', this.sessions.size);
            console.log('📋 Sessions Map keys:', Array.from(this.sessions.keys()));

            const sessions = Array.from(this.sessions.values());
            console.log('📋 Sessions data:', sessions);

            // Return actual sessions (no hardcoded fallback)
            console.log(`📋 Returning ${sessions.length} real sessions`);

            res.json(sessions);
        });

        // Create new session
        this.app.post('/api/sessions', async (req, res) => {
            try {
                const { name: sessionName } = req.body;
                const sessionId = uuidv4();

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

                res.json({
                    success: true,
                    sessionId,
                    message: 'Session created successfully'
                });
            } catch (error) {
                console.error('❌ Error creating session:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Send message endpoint - FIXED VERSION
        this.app.post('/api/messages/send', async (req, res) => {
            const startTime = Date.now();
            console.log(`📤 Message send request received at ${new Date().toISOString()}`);

            try {
                const { sessionId, to, message } = req.body;
                console.log(`📋 Request data: sessionId=${sessionId}, to=${to}, message="${message}"`);

                if (!sessionId || !to || !message) {
                    console.log('❌ Missing required fields');
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required fields: sessionId, to, message'
                    });
                }

                const client = this.clients.get(sessionId);
                if (!client) {
                    console.log(`❌ Client not found for session: ${sessionId}`);
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found or not ready'
                    });
                }

                if (!client.info) {
                    console.log(`❌ Client not authenticated for session: ${sessionId}`);
                    return res.status(400).json({
                        success: false,
                        error: 'WhatsApp client not authenticated'
                    });
                }

                // Format the phone number properly for WhatsApp
                let formattedTo = to;
                if (!to.includes('@')) {
                    // Remove any non-digit characters and add @c.us
                    const cleanNumber = to.replace(/\D/g, '');
                    formattedTo = `${cleanNumber}@c.us`;
                }

                console.log(`📤 Sending message to ${formattedTo} (original: ${to}) from session ${sessionId}`);

                // Create message record first
                const timestamp = Date.now();
                const dbMessageId = `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                const session = this.sessions.get(sessionId);
                const fromNumber = session?.phoneNumber || client.info.wid.user;

                // Send message with proper error handling
                let sentMessage;
                try {
                    console.log('🔄 Attempting to send WhatsApp message...');
                    sentMessage = await Promise.race([
                        client.sendMessage(formattedTo, message),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Message send timeout after 15 seconds')), 15000)
                        )
                    ]);
                    console.log('✅ WhatsApp message sent successfully');
                } catch (sendError) {
                    console.error('❌ WhatsApp send error:', sendError.message);

                    // Skip database save for failed messages too
                    console.log('⚠️ Skipping database save for failed message');

                    return res.status(500).json({
                        success: false,
                        error: `Failed to send WhatsApp message: ${sendError.message}`,
                        messageId: dbMessageId
                    });
                }

                // Skip database save for now - focus on message sending
                console.log('⚠️ Skipping database save - message sent successfully');

                // Emit real-time update
                const messageData = {
                    id: sentMessage.id._serialized || dbMessageId,
                    sessionId: sessionId,
                    from: fromNumber,
                    to: to,
                    body: message,
                    timestamp: timestamp,
                    fromMe: true,
                    type: 'text'
                };

                this.io.emit('new_message', messageData);
                this.io.emit('message_sent', messageData);
                console.log('📡 Real-time update emitted');

                const duration = Date.now() - startTime;
                console.log(`✅ Message send completed in ${duration}ms`);

                res.json({
                    success: true,
                    message: 'Message sent successfully',
                    messageId: sentMessage.id._serialized || dbMessageId,
                    duration: duration
                });

            } catch (error) {
                const duration = Date.now() - startTime;
                console.error(`❌ Error sending message (${duration}ms):`, error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to send message: ' + error.message,
                    duration: duration
                });
            }
        });

        // Send media endpoint - NEW
        this.app.post('/api/messages/send-media', async (req, res) => {
            const startTime = Date.now();
            console.log(`📤 Media send request received at ${new Date().toISOString()}`);

            try {
                const { sessionId, to, caption = '', mediaType, mediaUrl, fileName } = req.body;
                console.log(`📋 Media request data: sessionId=${sessionId}, to=${to}, mediaType=${mediaType}`);

                if (!sessionId || !to) {
                    console.log('❌ Missing required fields');
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required fields: sessionId, to'
                    });
                }

                const client = this.clients.get(sessionId);
                if (!client) {
                    console.log(`❌ Session ${sessionId} not found`);
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }

                console.log(`📤 Sending media to ${to} from session ${sessionId}`);

                // Format the phone number properly first
                let formattedTo = to;
                if (!to.includes('@')) {
                    const cleanNumber = to.replace(/\D/g, '');
                    formattedTo = `${cleanNumber}@c.us`;
                }

                console.log('🔄 Attempting to send WhatsApp media...');

                let result;
                if (mediaUrl) {
                    try {
                        console.log('📥 Downloading media from URL:', mediaUrl);

                        // Download media from URL with proper headers and preserve format
                        const media = await MessageMedia.fromUrl(mediaUrl, {
                            unsafeMime: true,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });

                        // Preserve original filename if provided
                        if (fileName) {
                            media.filename = fileName;
                        }

                        console.log('✅ Media downloaded successfully');
                        console.log('📋 Media details:', {
                            mimetype: media.mimetype,
                            filename: media.filename,
                            size: media.data ? media.data.length : 'unknown'
                        });

                        // Send media with proper options
                        const sendOptions = {};
                        if (caption) {
                            sendOptions.caption = caption;
                        }

                        console.log('📤 Sending media to:', formattedTo);
                        result = await client.sendMessage(formattedTo, media, sendOptions);
                        console.log('✅ Media message sent successfully');

                    } catch (mediaError) {
                        console.error('❌ Error processing media:', mediaError);
                        console.error('❌ Media error details:', {
                            message: mediaError.message,
                            stack: mediaError.stack
                        });

                        // Try alternative approach - send as document
                        try {
                            console.log('🔄 Trying alternative media sending...');
                            const fs = require('fs');
                            const path = require('path');
                            const https = require('https');

                            // Download file manually
                            const tempPath = path.join(__dirname, 'temp', `media_${Date.now()}`);
                            await new Promise((resolve, reject) => {
                                const file = fs.createWriteStream(tempPath);
                                https.get(mediaUrl, (response) => {
                                    response.pipe(file);
                                    file.on('finish', () => {
                                        file.close();
                                        resolve();
                                    });
                                }).on('error', reject);
                            });

                            // Create media from file
                            const media = MessageMedia.fromFilePath(tempPath);
                            result = await client.sendMessage(formattedTo, media, { caption });

                            // Clean up temp file
                            fs.unlinkSync(tempPath);
                            console.log('✅ Alternative media sending successful');

                        } catch (altError) {
                            console.error('❌ Alternative media sending failed:', altError);
                            // Final fallback to text message
                            result = await client.sendMessage(formattedTo, `📎 ${caption || 'Media file'}\n\nMedia URL: ${mediaUrl}`);
                            console.log('📝 Sent as text message fallback');
                        }
                    }
                } else {
                    // Send as text if no media URL
                    result = await client.sendMessage(formattedTo, caption || 'Media file');
                    console.log('📝 Sent as text message');
                }

                console.log('✅ WhatsApp media sent successfully');

                // Save to database
                const timestamp = Date.now();
                const dbMessageId = `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
                const session = this.sessions.get(sessionId);
                const fromNumber = session?.phoneNumber || client.info?.wid?.user || 'unknown';

                try {
                    await this.executeQuery(`
                        INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                    `, [
                        dbMessageId,
                        sessionId,
                        result.id._serialized || `msg_${timestamp}`,
                        fromNumber,
                        to,
                        caption || '',
                        mediaType || 'media',
                        false,
                        null,
                        timestamp
                    ]);
                    console.log('✅ Media message saved to database');
                } catch (dbError) {
                    console.log('❌ Database save error:', dbError.message);
                    // Continue even if database save fails
                }

                // Emit real-time update
                const messageData = {
                    id: result.id._serialized || dbMessageId,
                    sessionId: sessionId,
                    from: fromNumber,
                    to: to,
                    body: caption || '',
                    timestamp: timestamp,
                    fromMe: true,
                    type: mediaType || 'media',
                    mediaUrl: mediaUrl,
                    fileName: fileName
                };

                this.io.emit('new_message', messageData);
                this.io.emit('message_sent', messageData);
                console.log('📡 Real-time media update emitted');

                const duration = Date.now() - startTime;
                console.log(`✅ Media send completed in ${duration}ms`);

                res.json({
                    success: true,
                    message: 'Media sent successfully',
                    messageId: result.id._serialized || dbMessageId,
                    mediaType,
                    duration: duration
                });

            } catch (error) {
                const duration = Date.now() - startTime;
                console.error('❌ Error sending media:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to send media: ' + error.message,
                    duration: duration
                });
            }
        });

        // Media download endpoint
        this.app.post('/api/media/download', async (req, res) => {
            try {
                const { sessionId, messageId, mediaUrl, filename } = req.body;

                console.log('📥 Media download request:', {
                    sessionId,
                    messageId,
                    mediaUrl,
                    filename
                });

                if (!sessionId || !mediaUrl) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required fields: sessionId, mediaUrl'
                    });
                }

                const client = this.clients.get(sessionId);
                if (!client) {
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }

                try {
                    // Try to download media from WhatsApp
                    let mediaData;

                    if (messageId) {
                        // If we have messageId, try to get media from message
                        console.log('📥 Downloading media from message:', messageId);

                        // This would require finding the message and downloading its media
                        // For now, fallback to URL download
                    }

                    // Download from URL
                    console.log('📥 Downloading media from URL:', mediaUrl);

                    const fetch = (await import('node-fetch')).default;
                    const response = await fetch(mediaUrl);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch media: ${response.statusText}`);
                    }

                    const buffer = await response.buffer();
                    const contentType = response.headers.get('content-type') || 'application/octet-stream';

                    console.log('✅ Media downloaded successfully:', {
                        size: buffer.length,
                        contentType,
                        filename
                    });

                    // Set appropriate headers
                    res.set({
                        'Content-Type': contentType,
                        'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
                        'Content-Length': buffer.length,
                        'Cache-Control': 'private, max-age=3600',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    });

                    res.send(buffer);

                } catch (downloadError) {
                    console.error('❌ Error downloading media:', downloadError);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to download media: ' + downloadError.message
                    });
                }

            } catch (error) {
                console.error('❌ Error in media download endpoint:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error: ' + error.message
                });
            }
        });

        // Get messages endpoint
        this.app.get('/api/messages', async (req, res) => {
            try {
                const { sessionId, contactNumber, limit = 50 } = req.query;

                if (!sessionId) {
                    return res.status(400).json({
                        success: false,
                        error: 'sessionId is required'
                    });
                }

                let query = 'SELECT * FROM messages WHERE session_id = $1';
                let params = [sessionId];

                if (contactNumber) {
                    query += ' AND (from_number = $2 OR to_number = $2)';
                    params.push(contactNumber);
                }

                query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
                params.push(parseInt(limit));

                const result = await this.pool.query(query, params);

                res.json({
                    success: true,
                    messages: result.rows
                });

            } catch (error) {
                console.error('❌ Error fetching messages:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch messages: ' + error.message
                });
            }
        });

        // Get messages for a specific chat from WhatsApp client
        this.app.get('/api/sessions/:sessionId/messages/:contactId', async (req, res) => {
            try {
                const { sessionId, contactId } = req.params;
                const decodedContactId = decodeURIComponent(contactId);
                const client = this.clients.get(sessionId);

                if (!client) {
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }

                if (!client.info || client.info.wid === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'WhatsApp client not ready'
                    });
                }

                console.log(`📨 Getting messages for session ${sessionId}, contact ${decodedContactId}`);

                // Get chat by contact ID
                const chat = await client.getChatById(decodedContactId);
                if (!chat) {
                    return res.json({
                        success: true,
                        messages: []
                    });
                }

                // Fetch messages from the chat
                const messages = await chat.fetchMessages({ limit: 50 });

                // Debug: Log sample message structure
                if (messages.length > 0) {
                    console.log('🔍 Sample message structure:', JSON.stringify(messages[0], null, 2));
                }

                // Transform messages for frontend
                const transformedMessages = messages.map(msg => {
                    const baseMessage = {
                        id: msg.id._serialized,
                        body: msg.body,
                        from: msg.from,
                        to: msg.to,
                        timestamp: msg.timestamp * 1000, // Convert to milliseconds
                        fromMe: msg.fromMe,
                        type: msg.type,
                        author: msg.author
                    };

                    // Add media information if available
                    if (msg.hasMedia) {
                        console.log('📎 Media message found:', {
                            type: msg.type,
                            hasMedia: msg.hasMedia,
                            filename: msg.filename || msg._data?.filename,
                            mimetype: msg.mimetype || msg._data?.mimetype,
                            size: msg.filesize || msg._data?.size,
                            caption: msg.caption || msg._data?.caption
                        });

                        baseMessage.hasMedia = true;
                        baseMessage.mediaUrl = msg.mediaUrl || null;

                        // Extract filename from various sources
                        let fileName = msg.filename || msg._data?.filename;
                        if (!fileName && (msg.caption || msg._data?.caption)) {
                            // Extract filename from caption if it looks like a filename
                            const caption = msg.caption || msg._data?.caption;
                            const fileNameMatch = caption.match(/([^\/\\]+\.(pdf|doc|docx|jpg|jpeg|png|gif|mp4|mp3|zip|rar|txt|xls|xlsx|ppt|pptx))/i);
                            if (fileNameMatch) {
                                fileName = fileNameMatch[1];
                            }
                        }

                        // For images without filename, try to extract from caption or generate meaningful name
                        if (!fileName && msg.type === 'image') {
                            const extension = msg.mimetype?.includes('jpeg') ? 'jpg' :
                                            msg.mimetype?.includes('png') ? 'png' :
                                            msg.mimetype?.includes('gif') ? 'gif' : 'jpg';

                            // Try to extract filename from caption
                            const caption = msg.caption || msg._data?.caption || '';
                            const captionFileMatch = caption.match(/([^\/\\]+\.(jpg|jpeg|png|gif|webp|bmp))/i);

                            if (captionFileMatch) {
                                fileName = captionFileMatch[1];
                            } else {
                                // Generate a meaningful filename with date
                                const date = new Date(msg.timestamp * 1000);
                                const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                                const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
                                fileName = `WhatsApp_Image_${dateStr}_${timeStr}.${extension}`;
                            }
                        }

                        baseMessage.fileName = fileName;
                        baseMessage.fileSize = msg.filesize || msg._data?.size || null;
                        baseMessage.mimeType = msg.mimetype || msg._data?.mimetype || null;

                        // For media messages, use caption as body if body is empty
                        if (!baseMessage.body && (msg.caption || msg._data?.caption)) {
                            baseMessage.body = msg.caption || msg._data?.caption;
                        }
                    }

                    return baseMessage;
                });

                console.log(`✅ Retrieved ${transformedMessages.length} messages from WhatsApp client`);

                res.json({
                    success: true,
                    messages: transformedMessages
                });

            } catch (error) {
                console.error(`❌ Error getting messages for session ${req.params.sessionId}:`, error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get chats for a session
        this.app.get('/api/sessions/:sessionId/chats', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const client = this.clients.get(sessionId);

                if (!client) {
                    return res.status(404).json({
                        success: false,
                        error: 'Session not found'
                    });
                }

                if (!client.info || client.info.wid === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'WhatsApp client not ready'
                    });
                }

                console.log(`📱 Getting REAL chats for session: ${sessionId}`);

                // Get real chats from WhatsApp client
                let chats = [];
                try {
                    chats = await client.getChats();
                    console.log(`✅ Retrieved ${chats.length} real chats from WhatsApp`);
                } catch (error) {
                    console.error('❌ Error getting real chats:', error);
                    console.log('📋 Falling back to empty chat list');
                    chats = [];
                }

                // Transform chats for frontend
                const transformedChats = chats.map(chat => ({
                    id: chat.id._serialized,
                    name: chat.name || chat.contact?.name || chat.contact?.pushname || 'Unknown',
                    isGroup: chat.isGroup,
                    isMuted: chat.isMuted,
                    isArchived: chat.archived,
                    isPinned: chat.pinned,
                    unreadCount: chat.unreadCount,
                    lastMessage: chat.lastMessage ? {
                        id: chat.lastMessage.id._serialized,
                        body: chat.lastMessage.body,
                        type: chat.lastMessage.type,
                        timestamp: chat.lastMessage.timestamp,
                        fromMe: chat.lastMessage.fromMe,
                        author: chat.lastMessage.author
                    } : null,
                    contact: chat.contact ? {
                        id: chat.contact.id._serialized,
                        name: chat.contact.name || chat.contact.pushname,
                        number: chat.contact.number,
                        profilePicUrl: chat.contact.profilePicUrl,
                        isBusiness: chat.contact.isBusiness,
                        isVerified: chat.contact.isVerified,
                        status: chat.contact.status,
                        lastSeen: chat.contact.lastSeen
                    } : null,
                    groupMetadata: chat.isGroup ? {
                        id: chat.groupMetadata?.id?._serialized,
                        subject: chat.groupMetadata?.subject,
                        description: chat.groupMetadata?.description,
                        participants: chat.groupMetadata?.participants?.length || 0,
                        pictureUrl: chat.groupMetadata?.pictureUrl
                    } : null
                }));

                // Sort by last message timestamp (newest first)
                transformedChats.sort((a, b) => {
                    const aTime = a.lastMessage?.timestamp || 0;
                    const bTime = b.lastMessage?.timestamp || 0;
                    return bTime - aTime;
                });

                const isRealData = chats.length > 0 && !chats[0].id._serialized?.includes('919876543210');
                console.log(`✅ Found ${transformedChats.length} chats for session ${sessionId} (Real data: ${isRealData})`);

                res.json({
                    success: true,
                    chats: transformedChats,
                    sessionId: sessionId,
                    timestamp: new Date().toISOString(),
                    isRealData: isRealData,
                    dataSource: isRealData ? 'WhatsApp Client' : 'Mock Data'
                });

            } catch (error) {
                console.error(`❌ Error getting chats for session ${req.params.sessionId}:`, error);
                res.status(500).json({
                    success: false,
                    error: error.message
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
                        
                        await client.destroy();
                        console.log('✅ WhatsApp client destroyed');
                    } catch (clientError) {
                        console.error('⚠️ Error destroying client:', clientError.message);
                        // Continue with deletion even if client cleanup fails
                    }
                    
                    this.clients.delete(sessionId);
                }

                // Remove from sessions map
                this.sessions.delete(sessionId);

                // Delete from database
                try {
                    await this.executeQuery('DELETE FROM whatsapp_sessions WHERE id = $1', [sessionId]);
                    console.log('✅ Session deleted from database');
                } catch (dbError) {
                    console.error('❌ Database delete error:', dbError);
                    // Continue even if database delete fails
                }

                // Clean up session directory
                const sessionDir = path.join(__dirname, '../sessions', `session-${sessionId}`);
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log('✅ Session directory cleaned up');
                }

                this.broadcastSessionsUpdate();

                res.json({
                    success: true,
                    message: 'Session deleted successfully'
                });
            } catch (error) {
                console.error('❌ Error deleting session:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('🔌 Client connected to socket');

            socket.on('disconnect', () => {
                console.log('🔌 Client disconnected from socket');
            });

            // Handle session requests
            socket.on('get_sessions', () => {
                const sessions = Array.from(this.sessions.values());
                console.log('📡 Sending sessions data:', sessions.length, 'sessions');
                socket.emit('sessions_updated', sessions);
            });

            // Handle contacts requests
            socket.on('get_contacts', async () => {
                try {
                    if (!this.pool) {
                        console.log('📡 Database not available, sending empty contacts');
                        socket.emit('contacts_updated', []);
                        return;
                    }
                    const result = await this.pool.query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100');
                    console.log('📡 Sending contacts data:', result.rows.length, 'contacts');
                    socket.emit('contacts_updated', result.rows);
                } catch (error) {
                    console.error('❌ Error fetching contacts:', error);
                    socket.emit('contacts_updated', []);
                }
            });

            // Handle messages requests
            socket.on('get_messages', async () => {
                try {
                    if (!this.pool) {
                        console.log('📡 Database not available, sending empty messages');
                        socket.emit('messages_updated', []);
                        return;
                    }
                    const result = await this.pool.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100');
                    console.log('📡 Sending messages data:', result.rows.length, 'messages');
                    socket.emit('messages_updated', result.rows);
                } catch (error) {
                    console.error('❌ Error fetching messages:', error);
                    socket.emit('messages_updated', []);
                }
            });

            // Handle analytics requests
            socket.on('get_analytics', async () => {
                try {
                    const analytics = await this.getAnalyticsData();
                    console.log('📡 Sending analytics data:', analytics);
                    socket.emit('analytics_updated', analytics);
                } catch (error) {
                    console.error('❌ Error fetching analytics:', error);
                    socket.emit('analytics_updated', {});
                }
            });
        });
    }

    async createWhatsAppClient(sessionId, sessionName) {
        try {
            console.log(`🔄 Creating WhatsApp client for session: ${sessionId}`);

            // Create custom auth strategy that uses database instead of local files
            const dbAuthStrategy = new LocalAuth({
                clientId: sessionId,
                dataPath: path.join(__dirname, '../sessions') // Keep for now, will migrate gradually
            });

            const client = new Client({
                authStrategy: dbAuthStrategy,
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

            // Store client
            this.clients.set(sessionId, client);

            // Create session object
            const session = {
                id: sessionId,
                name: sessionName,
                status: 'initializing',
                qrCode: null,
                phoneNumber: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.sessions.set(sessionId, session);

            // Set up event handlers
            this.setupClientEvents(client, sessionId);

            // Initialize client
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
                    await this.executeQuery(`
                        UPDATE whatsapp_sessions
                        SET status = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2
                    `, ['auth_failure', sessionId]);
                } catch (dbError) {
                    console.error(`❌ Database update error for session ${sessionId}:`, dbError);
                }

                this.broadcastSessionsUpdate();
            }

            throw error;
        }
    }

    setupClientEvents(client, sessionId) {
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
                    await this.executeQuery(`
                        UPDATE whatsapp_sessions
                        SET status = $1, qr_code = $2, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $3
                    `, ['qr_code', qr, sessionId]);
                } catch (error) {
                    console.error(`❌ Failed to save QR code to database for ${sessionId}:`, error);
                }

                // Emit QR code to frontend
                this.io.emit('qr_code', { sessionId, qrCode: qr });
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
                    await this.executeQuery(`
                        UPDATE whatsapp_sessions
                        SET status = $1, phone_number = $2, qr_code = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $5
                    `, ['ready', client.info.wid.user, null, true, sessionId]);
                    console.log(`✅ Session ${sessionId} saved to database as ready`);
                } catch (error) {
                    console.error(`❌ Database save error for session ${sessionId}:`, error);
                }

                this.io.emit('session_ready', { sessionId, phoneNumber: client.info.wid.user });
                this.broadcastSessionsUpdate();
            }
        });

        // Message event
        client.on('message', async (message) => {
            console.log(`📨 New message received in session ${sessionId}:`, {
                type: message.type,
                hasMedia: message.hasMedia,
                body: message.body || '[Media message]'
            });

            // Handle media messages
            let mediaUrl = null;
            let mediaData = null;
            let messageBody = message.body;

            if (message.hasMedia) {
                try {
                    console.log('📥 Processing media message...');
                    const media = await message.downloadMedia();

                    if (media) {
                        console.log('✅ Media downloaded:', {
                            mimetype: media.mimetype,
                            filename: media.filename,
                            size: media.data ? media.data.length : 'unknown'
                        });

                        // Save media to uploads directory
                        const fs = require('fs');
                        const path = require('path');
                        const uploadsDir = path.join(__dirname, '..', 'uploads');

                        // Ensure uploads directory exists
                        if (!fs.existsSync(uploadsDir)) {
                            fs.mkdirSync(uploadsDir, { recursive: true });
                        }

                        // Generate unique filename while preserving original name
                        const timestamp = Date.now();
                        const originalFilename = media.filename || `media_${timestamp}`;
                        const extension = path.extname(originalFilename) || this.getExtensionFromMimetype(media.mimetype);
                        const nameWithoutExt = path.basename(originalFilename, extension);

                        // Use original filename for storage but keep unique identifier for conflicts
                        const filename = originalFilename.includes('_') ? originalFilename : `${nameWithoutExt}${extension}`;
                        const filePath = path.join(uploadsDir, filename);

                        // Save media file
                        fs.writeFileSync(filePath, media.data, 'base64');
                        mediaUrl = `http://localhost:3008/uploads/${filename}`;

                        console.log('💾 Media saved to:', mediaUrl);

                        // Update message body to include media info
                        if (!messageBody) {
                            messageBody = `📎 ${media.filename || 'Media file'}`;
                        }

                        mediaData = {
                            url: mediaUrl,
                            mimetype: media.mimetype,
                            filename: media.filename,
                            size: media.data.length
                        };
                    }
                } catch (mediaError) {
                    console.error('❌ Error processing media:', mediaError);
                    messageBody = messageBody || '📎 Media file (download failed)';
                }
            }

            // Save incoming message to database
            try {
                const timestamp = message.timestamp * 1000; // Convert to milliseconds
                const dbMessageId = `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

                await this.executeQuery(`
                    INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, media_url, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
                `, [
                    dbMessageId,
                    sessionId,
                    message.id._serialized,
                    message.from,
                    message.to,
                    messageBody,
                    message.type || 'text',
                    message.isGroupMsg || false,
                    message.author || null,
                    timestamp,
                    mediaUrl
                ]);

                console.log(`✅ Message saved to database: ${dbMessageId}`);

                // Emit to frontend
                this.io.emit('new_message', {
                    sessionId,
                    message: {
                        id: dbMessageId,
                        from: message.from,
                        to: message.to,
                        body: messageBody,
                        timestamp: timestamp,
                        type: message.type,
                        hasMedia: message.hasMedia,
                        mediaUrl: mediaUrl,
                        mediaData: mediaData
                    }
                });

                // Broadcast updated messages list
                this.broadcastMessagesUpdate();

                // Broadcast updated analytics
                this.broadcastAnalyticsUpdate();
            } catch (error) {
                console.error(`❌ Error saving message to database:`, error);
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
                    await this.executeQuery(`
                        UPDATE whatsapp_sessions
                        SET status = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $3
                    `, ['disconnected', false, sessionId]);
                    console.log(`✅ Session ${sessionId} marked as disconnected in database`);
                } catch (error) {
                    console.error(`❌ Database update error for session ${sessionId}:`, error);
                }

                this.broadcastSessionsUpdate();
            }
        });
    }

    async restoreSessionsFromDatabase() {
        try {
            console.log('🔄 Restoring sessions from database...');

            // Get sessions from database
            const sessions = await this.getAll('SELECT * FROM whatsapp_sessions WHERE is_active = $1', [true]);

            console.log(`📊 Found ${sessions.length} sessions in database`);

            for (const session of sessions) {
                if (session.status === 'ready' && session.is_active) {
                    console.log(`🔄 Restoring session: ${session.name} (${session.id})`);

                    // Add to sessions map
                    this.sessions.set(session.id, {
                        id: session.id,
                        name: session.name,
                        status: session.status,
                        phoneNumber: session.phone_number,
                        qrCode: session.qr_code,
                        isActive: session.is_active,
                        createdAt: session.created_at,
                        updatedAt: session.updated_at
                    });

                    // Try to restore WhatsApp client
                    try {
                        await this.createWhatsAppClient(session.id, session.name);
                    } catch (error) {
                        console.error(`❌ Failed to restore client for session ${session.id}:`, error.message);
                    }
                }
            }

            console.log('✅ Session restoration completed');
        } catch (error) {
            console.error('❌ Error restoring sessions from database:', error);
        }
    }

    async getAnalyticsData() {
        try {
            if (!this.pool) {
                return {
                    messages: { total_messages: 0, messages_24h: 0, messages_7d: 0 },
                    sessions: { total_sessions: 0, active_sessions: 0 },
                    contacts: { total_contacts: 0 },
                    lastUpdated: new Date().toISOString()
                };
            }

            // Get message counts
            const messageStats = await this.pool.query(`
                SELECT
                    COUNT(*) as total_messages,
                    COUNT(CASE WHEN timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_24h,
                    COUNT(CASE WHEN timestamp > NOW() - INTERVAL '7 days' THEN 1 END) as messages_7d
                FROM messages
            `);

            // Get session stats
            const sessionStats = await this.pool.query(`
                SELECT
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN status = 'ready' THEN 1 END) as active_sessions
                FROM whatsapp_sessions
            `);

            // Get contact stats
            const contactStats = await this.pool.query(`
                SELECT COUNT(*) as total_contacts FROM contacts
            `);

            return {
                messages: messageStats.rows[0] || { total_messages: 0, messages_24h: 0, messages_7d: 0 },
                sessions: sessionStats.rows[0] || { total_sessions: 0, active_sessions: 0 },
                contacts: contactStats.rows[0] || { total_contacts: 0 },
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting analytics data:', error);
            return {
                messages: { total_messages: 0, messages_24h: 0, messages_7d: 0 },
                sessions: { total_sessions: 0, active_sessions: 0 },
                contacts: { total_contacts: 0 },
                lastUpdated: new Date().toISOString()
            };
        }
    }

    broadcastSessionsUpdate() {
        const sessions = Array.from(this.sessions.values());
        console.log('📡 Broadcasting sessions update:', sessions.length, 'sessions');
        this.io.emit('sessions_updated', sessions);
    }

    async broadcastMessagesUpdate() {
        try {
            if (!this.pool) {
                console.log('📡 Database not available, skipping messages broadcast');
                return;
            }
            const result = await this.pool.query('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100');
            console.log('📡 Broadcasting messages update:', result.rows.length, 'messages');
            this.io.emit('messages_updated', result.rows);
        } catch (error) {
            console.error('❌ Error broadcasting messages update:', error);
        }
    }

    async broadcastContactsUpdate() {
        try {
            const result = await this.db.query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100');
            console.log('📡 Broadcasting contacts update:', result.rows.length, 'contacts');
            this.io.emit('contacts_updated', result.rows);
        } catch (error) {
            console.error('❌ Error broadcasting contacts update:', error);
        }
    }

    async broadcastAnalyticsUpdate() {
        try {
            const analytics = await this.getAnalyticsData();
            console.log('📡 Broadcasting analytics update:', analytics);
            this.io.emit('analytics_updated', analytics);
        } catch (error) {
            console.error('❌ Error broadcasting analytics update:', error);
        }
    }

    start(port = 3001) {
        this.server.listen(port, '0.0.0.0', () => {
            console.log(`🚀 WhatsApp Server running on port ${port}`);
            console.log(`📱 Health check: http://localhost:${port}/api/health`);
        });
    }

    // Helper function to get file extension from mimetype
    getExtensionFromMimetype(mimetype) {
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/bmp': '.bmp',
            'image/svg+xml': '.svg',
            'video/mp4': '.mp4',
            'video/avi': '.avi',
            'video/mov': '.mov',
            'video/wmv': '.wmv',
            'video/flv': '.flv',
            'video/webm': '.webm',
            'video/3gpp': '.3gp',
            'audio/mpeg': '.mp3',
            'audio/wav': '.wav',
            'audio/ogg': '.ogg',
            'audio/aac': '.aac',
            'audio/mp4': '.m4a',
            'audio/webm': '.webm',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
            'application/zip': '.zip',
            'application/x-rar-compressed': '.rar',
            'application/x-7z-compressed': '.7z',
            'text/plain': '.txt',
            'text/csv': '.csv'
        };

        return mimeToExt[mimetype] || '.bin';
    }
}

// Start the server
const whatsappManager = new WhatsAppManager();
whatsappManager.start(process.env.WHATSAPP_SERVER_PORT || 3006);

module.exports = WhatsAppManager;
