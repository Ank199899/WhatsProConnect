import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database Types
export interface WhatsAppSession {
  id: string
  name: string
  phone_number?: string
  status: 'initializing' | 'qr_code' | 'ready' | 'disconnected' | 'auth_failure'
  qr_code?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Contact {
  id: string
  session_id: string
  whatsapp_id: string
  name: string
  phone_number: string
  is_group: boolean
  profile_pic_url?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  whatsapp_message_id: string
  from_number: string
  to_number: string
  body: string
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document'
  is_group_message: boolean
  author?: string
  timestamp: string
  created_at: string
}

export interface BulkMessageQueue {
  id: string
  session_id: string
  message_content: string
  target_contacts: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  sent_count: number
  failed_count: number
  total_count: number
  delay_ms: number
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface BulkMessageLog {
  id: string
  bulk_queue_id: string
  contact_number: string
  status: 'sent' | 'failed'
  error_message?: string
  sent_at: string
}

class LocalDatabase {
  private db: Database.Database
  private dbPath: string

  constructor() {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    this.dbPath = path.join(dbDir, 'whatsapp.db')
    this.db = new Database(this.dbPath)
    this.initializeDatabase()
    this.initializeDefaultProviders()
  }

  private initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON')

    // Create tables
    this.createTables()

    // Initialize default templates
    this.initializeDefaultTemplates()
  }

  private createTables() {
    // WhatsApp Sessions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT,
        status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'qr_code', 'ready', 'disconnected', 'auth_failure')),
        qr_code TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        is_active BOOLEAN DEFAULT 1
      )
    `)

    // Contacts Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        whatsapp_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        is_group BOOLEAN DEFAULT 0,
        profile_pic_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
        UNIQUE(session_id, whatsapp_id)
      )
    `)

    // Messages Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        whatsapp_message_id TEXT NOT NULL,
        from_number TEXT NOT NULL,
        to_number TEXT NOT NULL,
        body TEXT,
        message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')),
        is_group_message BOOLEAN DEFAULT 0,
        author TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
        UNIQUE(session_id, whatsapp_message_id)
      )
    `)

    // Bulk Message Queue Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bulk_message_queue (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        message_content TEXT NOT NULL,
        target_contacts TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        total_count INTEGER NOT NULL,
        delay_ms INTEGER DEFAULT 2000,
        created_at TEXT DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        error_message TEXT,
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
      )
    `)

    // Bulk Message Logs Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bulk_message_logs (
        id TEXT PRIMARY KEY,
        bulk_queue_id TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
        error_message TEXT,
        sent_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (bulk_queue_id) REFERENCES bulk_message_queue(id) ON DELETE CASCADE
      )
    `)

    // Templates Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'document', 'interactive')),
        content TEXT NOT NULL,
        variables TEXT,
        language TEXT DEFAULT 'en',
        status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'pending', 'rejected', 'draft')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        usage_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        tags TEXT,
        media_url TEXT,
        media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document')),
        media_caption TEXT
      )
    `)

    // Add media columns to existing templates table if they don't exist
    try {
      this.db.exec(`ALTER TABLE templates ADD COLUMN media_url TEXT`)
    } catch (e) {
      // Column already exists
    }
    try {
      this.db.exec(`ALTER TABLE templates ADD COLUMN media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document'))`)
    } catch (e) {
      // Column already exists
    }
    try {
      this.db.exec(`ALTER TABLE templates ADD COLUMN media_caption TEXT`)
    } catch (e) {
      // Column already exists
    }

    // Roles Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT,
        user_count INTEGER DEFAULT 0,
        is_system BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        color TEXT DEFAULT '#3B82F6',
        priority INTEGER DEFAULT 999
      )
    `)

    // Enhanced Contacts Table (update existing)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS enhanced_contacts (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        phone_number TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        address TEXT,
        tags TEXT,
        notes TEXT,
        profile_picture TEXT,
        last_message_at TEXT,
        message_count INTEGER DEFAULT 0,
        is_blocked BOOLEAN DEFAULT 0,
        is_favorite BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
        custom_fields TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
      )
    `)

    // AI Providers Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        api_endpoint TEXT,
        supported_models TEXT,
        default_model TEXT,
        requires_api_key BOOLEAN DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        configuration TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)

    // AI Provider API Keys Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_provider_keys (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        user_id TEXT DEFAULT 'default',
        api_key_encrypted TEXT NOT NULL,
        api_key_hash TEXT NOT NULL,
        additional_config TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
      )
    `)

    // AI Agents Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        personality TEXT,
        language TEXT DEFAULT 'en',
        response_style TEXT DEFAULT 'professional',
        auto_reply_enabled BOOLEAN DEFAULT 0,
        response_delay_min INTEGER DEFAULT 1,
        response_delay_max INTEGER DEFAULT 5,
        max_response_length INTEGER DEFAULT 500,
        keywords TEXT DEFAULT '[]',
        system_prompt TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)

    // AI Agent Sessions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_agent_sessions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
        UNIQUE(agent_id, session_id)
      )
    `)

    // AI Agent Chat Settings Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_agent_chat_settings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        agent_id TEXT,
        auto_reply_enabled BOOLEAN DEFAULT 0,
        response_delay INTEGER DEFAULT 3,
        custom_prompt TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL,
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
        UNIQUE(session_id, contact_number)
      )
    `)

    // AI Agent Responses Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_agent_responses (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        original_message TEXT NOT NULL,
        generated_response TEXT NOT NULL,
        was_sent BOOLEAN DEFAULT 0,
        response_time_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
      )
    `)

    // AI Agent Providers Table (for agent-provider assignments)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_agent_providers (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        model_name TEXT,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        configuration TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
        UNIQUE(agent_id, provider_id)
      )
    `)

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_active ON whatsapp_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_contacts_session_id ON contacts(session_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_number, to_number);
      CREATE INDEX IF NOT EXISTS idx_bulk_queue_session_id ON bulk_message_queue(session_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_queue_status ON bulk_message_queue(status);
      CREATE INDEX IF NOT EXISTS idx_bulk_logs_queue_id ON bulk_message_logs(bulk_queue_id);
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
      CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
      CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_phone ON enhanced_contacts(phone_number);
      CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON enhanced_contacts(status);
      CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
      CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_provider ON ai_provider_keys(provider_id);
      CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_user ON ai_provider_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_agent_providers_agent ON ai_agent_providers(agent_id);
      CREATE INDEX IF NOT EXISTS idx_ai_agent_providers_provider ON ai_agent_providers(provider_id);
    `)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Session Management
  createSession(sessionData: Omit<WhatsAppSession, 'created_at' | 'updated_at'> | Omit<WhatsAppSession, 'id' | 'created_at' | 'updated_at'>): WhatsAppSession {
    const id = (sessionData as any).id || this.generateId() // Use provided ID or generate new one
    const now = new Date().toISOString()

    // Check if session with same name already exists
    const existingSession = this.db.prepare(`
      SELECT id FROM whatsapp_sessions WHERE name = ? AND is_active = 1
    `).get(sessionData.name)

    if (existingSession) {
      console.log(`⚠️ Session with name "${sessionData.name}" already exists, returning existing session`)
      return this.getSession(existingSession.id)!
    }

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO whatsapp_sessions (id, name, phone_number, status, qr_code, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // Convert boolean to integer for SQLite
    const isActiveValue = sessionData.is_active ? 1 : 0

    stmt.run(id, sessionData.name, sessionData.phone_number, sessionData.status, sessionData.qr_code, isActiveValue, now, now)

    return this.getSession(id)!
  }

  updateSession(sessionId: string, updates: Partial<WhatsAppSession>): WhatsAppSession | null {
    const now = new Date().toISOString()
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at').map(key => `${key} = ?`).join(', ')
    const values = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at').map(key => {
      const value = (updates as any)[key]
      // Convert boolean to integer for SQLite
      if (key === 'is_active' && typeof value === 'boolean') {
        return value ? 1 : 0
      }
      return value
    })

    if (fields) {
      const stmt = this.db.prepare(`UPDATE whatsapp_sessions SET ${fields}, updated_at = ? WHERE id = ?`)
      stmt.run(...values, now, sessionId)
    }

    return this.getSession(sessionId)
  }

  getSession(sessionId: string): WhatsAppSession | null {
    const stmt = this.db.prepare('SELECT * FROM whatsapp_sessions WHERE id = ?')
    const result = stmt.get(sessionId) as any

    if (!result) return null

    // Convert integer back to boolean for is_active field
    return {
      ...result,
      is_active: Boolean(result.is_active)
    } as WhatsAppSession
  }

  getSessions(): WhatsAppSession[] {
    const stmt = this.db.prepare('SELECT * FROM whatsapp_sessions ORDER BY created_at DESC')
    const results = stmt.all() as any[]

    // Convert integer back to boolean for is_active field
    return results.map(result => ({
      ...result,
      is_active: Boolean(result.is_active)
    })) as WhatsAppSession[]
  }

  deleteSession(sessionId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM whatsapp_sessions WHERE id = ?')
    const result = stmt.run(sessionId)
    return result.changes > 0
  }

  // Contact Management
  saveContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Contact {
    const id = this.generateId()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO contacts (id, session_id, whatsapp_id, name, phone_number, is_group, profile_pic_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, contactData.session_id, contactData.whatsapp_id, contactData.name, contactData.phone_number, contactData.is_group ? 1 : 0, contactData.profile_pic_url, now, now)

    return this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact
  }

  saveContacts(contacts: Omit<Contact, 'id' | 'created_at' | 'updated_at'>[]): Contact[] {
    const now = new Date().toISOString()
    const results: Contact[] = []
    
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO contacts (id, session_id, whatsapp_id, name, phone_number, is_group, profile_pic_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const contact of contacts) {
      const id = this.generateId()
      insertStmt.run(id, contact.session_id, contact.whatsapp_id, contact.name, contact.phone_number, contact.is_group, contact.profile_pic_url, now, now)
      
      const saved = this.db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact
      results.push(saved)
    }
    
    return results
  }

  getContacts(sessionId: string): Contact[] {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE session_id = ? ORDER BY name')
    return stmt.all(sessionId) as Contact[]
  }

  // Message Management
  saveMessage(messageData: Omit<Message, 'id' | 'created_at'>): Message {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(id, messageData.session_id, messageData.whatsapp_message_id, messageData.from_number, messageData.to_number, messageData.body, messageData.message_type, messageData.is_group_message, messageData.author, messageData.timestamp, now)
    
    return this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message
  }

  getMessages(sessionId: string, limit = 100): Message[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?')
    return stmt.all(sessionId, limit) as Message[]
  }

  getAllMessages(): Message[] {
    const stmt = this.db.prepare('SELECT * FROM messages ORDER BY timestamp DESC')
    return stmt.all() as Message[]
  }

  getMessagesInDateRange(startDate: Date, endDate: Date): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `)
    return stmt.all(startDate.toISOString(), endDate.toISOString()) as Message[]
  }

  getChatMessages(sessionId: string, contactNumber: string, limit = 50): Message[] {
    console.log(`🔍 Database: Getting messages for session ${sessionId}, contact ${contactNumber}`)
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE session_id = ? AND (from_number = ? OR to_number = ?)
      ORDER BY timestamp ASC LIMIT ?
    `)
    const messages = stmt.all(sessionId, contactNumber, contactNumber, limit) as Message[]
    console.log(`📊 Database: Found ${messages.length} messages`)
    return messages
  }

  // Bulk Messaging
  createBulkMessageQueue(queueData: Omit<BulkMessageQueue, 'id' | 'created_at'>): BulkMessageQueue {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const stmt = this.db.prepare(`
      INSERT INTO bulk_message_queue (id, session_id, message_content, target_contacts, status, sent_count, failed_count, total_count, delay_ms, created_at, started_at, completed_at, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(id, queueData.session_id, queueData.message_content, JSON.stringify(queueData.target_contacts), queueData.status, queueData.sent_count, queueData.failed_count, queueData.total_count, queueData.delay_ms, now, queueData.started_at, queueData.completed_at, queueData.error_message)
    
    const result = this.db.prepare('SELECT * FROM bulk_message_queue WHERE id = ?').get(id) as any
    result.target_contacts = JSON.parse(result.target_contacts)
    return result as BulkMessageQueue
  }

  updateBulkMessageQueue(queueId: string, updates: Partial<BulkMessageQueue>): BulkMessageQueue | null {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at').map(key => `${key} = ?`).join(', ')
    const values = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at').map(key => {
      const value = (updates as any)[key]
      return key === 'target_contacts' && Array.isArray(value) ? JSON.stringify(value) : value
    })
    
    if (fields) {
      const stmt = this.db.prepare(`UPDATE bulk_message_queue SET ${fields} WHERE id = ?`)
      stmt.run(...values, queueId)
    }
    
    const result = this.db.prepare('SELECT * FROM bulk_message_queue WHERE id = ?').get(queueId) as any
    if (result) {
      result.target_contacts = JSON.parse(result.target_contacts)
    }
    return result as BulkMessageQueue | null
  }

  getBulkMessageQueues(sessionId?: string): BulkMessageQueue[] {
    let stmt
    let results
    
    if (sessionId) {
      stmt = this.db.prepare('SELECT * FROM bulk_message_queue WHERE session_id = ? ORDER BY created_at DESC')
      results = stmt.all(sessionId) as any[]
    } else {
      stmt = this.db.prepare('SELECT * FROM bulk_message_queue ORDER BY created_at DESC')
      results = stmt.all() as any[]
    }
    
    return results.map(result => ({
      ...result,
      target_contacts: JSON.parse(result.target_contacts)
    })) as BulkMessageQueue[]
  }

  logBulkMessage(logData: Omit<BulkMessageLog, 'id'>): BulkMessageLog {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const stmt = this.db.prepare(`
      INSERT INTO bulk_message_logs (id, bulk_queue_id, contact_number, status, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(id, logData.bulk_queue_id, logData.contact_number, logData.status, logData.error_message, logData.sent_at || now)
    
    return this.db.prepare('SELECT * FROM bulk_message_logs WHERE id = ?').get(id) as BulkMessageLog
  }

  // Analytics
  getSessionStats(sessionId: string) {
    const messagesStmt = this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?')
    const contactsStmt = this.db.prepare('SELECT COUNT(*) as count FROM contacts WHERE session_id = ?')
    
    const messagesResult = messagesStmt.get(sessionId) as { count: number }
    const contactsResult = contactsStmt.get(sessionId) as { count: number }

    return {
      totalMessages: messagesResult.count || 0,
      totalContacts: contactsResult.count || 0
    }
  }

  // Cleanup old data
  cleanupOldData(daysToKeep = 30): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffISO = cutoffDate.toISOString()
    
    const stmt = this.db.prepare('DELETE FROM messages WHERE created_at < ?')
    const result = stmt.run(cutoffISO)
    
    // Clean up old bulk message logs
    this.db.prepare('DELETE FROM bulk_message_logs WHERE sent_at < ?').run(cutoffISO)
    
    // Clean up completed bulk queues
    this.db.prepare(`DELETE FROM bulk_message_queue WHERE status IN ('completed', 'failed') AND created_at < ?`).run(cutoffISO)
    
    return result.changes
  }

  // Template Management
  createTemplate(templateData: any) {
    const stmt = this.db.prepare(`
      INSERT INTO templates (id, name, category, type, content, variables, language, status, created_by, tags, media_url, media_type, media_caption)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      templateData.id,
      templateData.name,
      templateData.category,
      templateData.type,
      templateData.content,
      JSON.stringify(templateData.variables || []),
      templateData.language,
      templateData.status,
      templateData.createdBy,
      JSON.stringify(templateData.tags || []),
      templateData.mediaUrl || null,
      templateData.mediaType || null,
      templateData.mediaCaption || null
    )

    return this.getTemplate(templateData.id)
  }

  getTemplate(templateId: string) {
    const stmt = this.db.prepare('SELECT * FROM templates WHERE id = ?')
    const template = stmt.get(templateId) as any

    if (template) {
      template.variables = JSON.parse(template.variables || '[]')
      template.tags = JSON.parse(template.tags || '[]')

      // Map database column names to frontend field names
      template.mediaUrl = template.media_url
      template.mediaType = template.media_type
      template.mediaCaption = template.media_caption
      template.mediaFilename = template.media_filename
      template.mediaSize = template.media_size
    }

    return template
  }

  getAllTemplates() {
    const stmt = this.db.prepare('SELECT * FROM templates ORDER BY created_at DESC')
    const templates = stmt.all() as any[]

    return templates.map(template => ({
      ...template,
      variables: JSON.parse(template.variables || '[]'),
      tags: JSON.parse(template.tags || '[]'),
      // Map database column names to frontend field names
      mediaUrl: template.media_url,
      mediaType: template.media_type,
      mediaCaption: template.media_caption,
      mediaFilename: template.media_filename,
      mediaSize: template.media_size
    }))
  }

  updateTemplate(templateId: string, updates: any) {
    // Map frontend field names to database column names
    const fieldMapping: { [key: string]: string } = {
      'mediaUrl': 'media_url',
      'mediaType': 'media_type',
      'mediaCaption': 'media_caption',
      'mediaFilename': 'media_filename',
      'mediaSize': 'media_size'
    }

    const fields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = fields.map(field => {
      const dbField = fieldMapping[field] || field
      return `${dbField} = ?`
    }).join(', ')

    const values = fields.map(field => {
      if (field === 'variables' || field === 'tags') {
        return JSON.stringify(updates[field])
      }
      return updates[field]
    })

    console.log('🔧 Update SQL:', `UPDATE templates SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
    console.log('🔧 Update values:', values, templateId)

    const stmt = this.db.prepare(`
      UPDATE templates
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `)

    const result = stmt.run(...values, templateId)
    return result.changes > 0 ? this.getTemplate(templateId) : null
  }

  deleteTemplate(templateId: string) {
    const stmt = this.db.prepare('DELETE FROM templates WHERE id = ?')
    const result = stmt.run(templateId)
    return result.changes > 0
  }

  // Role Management
  createRole(roleData: any) {
    const stmt = this.db.prepare(`
      INSERT INTO roles (id, name, description, permissions, is_system, is_active, created_by, color, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      roleData.id,
      roleData.name,
      roleData.description,
      JSON.stringify(roleData.permissions || []),
      roleData.isSystem ? 1 : 0,
      roleData.isActive ? 1 : 0,
      roleData.createdBy,
      roleData.color,
      roleData.priority
    )

    return this.getRole(roleData.id)
  }

  getRole(roleId: string) {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE id = ?')
    const role = stmt.get(roleId) as any

    if (role) {
      role.permissions = JSON.parse(role.permissions || '[]')
      role.isSystem = Boolean(role.is_system)
      role.isActive = Boolean(role.is_active)
    }

    return role
  }

  getAllRoles() {
    const stmt = this.db.prepare('SELECT * FROM roles ORDER BY priority ASC, created_at DESC')
    const roles = stmt.all() as any[]

    return roles.map(role => ({
      ...role,
      permissions: JSON.parse(role.permissions || '[]'),
      isSystem: Boolean(role.is_system),
      isActive: Boolean(role.is_active)
    }))
  }

  updateRole(roleId: string, updates: any) {
    const fields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => {
      if (field === 'permissions') {
        return JSON.stringify(updates[field])
      }
      if (field === 'isSystem') {
        return updates[field] ? 1 : 0
      }
      if (field === 'isActive') {
        return updates[field] ? 1 : 0
      }
      return updates[field]
    })

    const stmt = this.db.prepare(`
      UPDATE roles
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `)

    const result = stmt.run(...values, roleId)
    return result.changes > 0 ? this.getRole(roleId) : null
  }

  deleteRole(roleId: string) {
    const stmt = this.db.prepare('DELETE FROM roles WHERE id = ? AND is_system = 0')
    const result = stmt.run(roleId)
    return result.changes > 0
  }

  // Enhanced Contact Management
  createContact(contactData: any) {
    const stmt = this.db.prepare(`
      INSERT INTO enhanced_contacts (id, session_id, phone_number, name, email, address, tags, notes, status, custom_fields)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      contactData.id,
      contactData.sessionId,
      contactData.phone,
      contactData.name,
      contactData.email,
      contactData.address,
      JSON.stringify(contactData.tags || []),
      contactData.notes,
      contactData.status,
      JSON.stringify(contactData.customFields || {})
    )

    return this.getContact(contactData.id)
  }

  getContact(contactId: string) {
    const stmt = this.db.prepare('SELECT * FROM enhanced_contacts WHERE id = ?')
    const contact = stmt.get(contactId) as any

    if (contact) {
      contact.tags = JSON.parse(contact.tags || '[]')
      contact.customFields = JSON.parse(contact.custom_fields || '{}')
      contact.isBlocked = Boolean(contact.is_blocked)
      contact.isFavorite = Boolean(contact.is_favorite)
    }

    return contact
  }

  getAllContacts() {
    const stmt = this.db.prepare('SELECT * FROM enhanced_contacts ORDER BY created_at DESC')
    const contacts = stmt.all() as any[]

    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone_number, // Map phone_number to phone
      email: contact.email,
      address: contact.address,
      tags: JSON.parse(contact.tags || '[]'),
      notes: contact.notes,
      lastMessageAt: contact.last_message_at,
      messageCount: contact.message_count || 0,
      isBlocked: Boolean(contact.is_blocked),
      isFavorite: Boolean(contact.is_favorite),
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
      sessionId: contact.session_id,
      profilePicture: contact.profile_picture,
      status: contact.status || 'active',
      customFields: JSON.parse(contact.custom_fields || '{}')
    }))
  }

  updateContact(contactId: string, updates: any) {
    const fields = Object.keys(updates).filter(key => key !== 'id')
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => {
      if (field === 'tags') {
        return JSON.stringify(updates[field])
      }
      if (field === 'customFields') {
        return JSON.stringify(updates[field])
      }
      if (field === 'isBlocked') {
        return updates[field] ? 1 : 0
      }
      if (field === 'isFavorite') {
        return updates[field] ? 1 : 0
      }
      return updates[field]
    })

    const stmt = this.db.prepare(`
      UPDATE enhanced_contacts
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `)

    const result = stmt.run(...values, contactId)
    return result.changes > 0 ? this.getContact(contactId) : null
  }

  deleteContact(contactId: string) {
    const stmt = this.db.prepare('DELETE FROM enhanced_contacts WHERE id = ?')
    const result = stmt.run(contactId)
    return result.changes > 0
  }

  // AI Agent Management
  createAIAgent(agentData: any) {
    const stmt = this.db.prepare(`
      INSERT INTO ai_agents (id, name, description, personality, language, response_style,
                           auto_reply_enabled, response_delay_min, response_delay_max,
                           max_response_length, keywords, system_prompt, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      agentData.id,
      agentData.name,
      agentData.description,
      agentData.personality || 'helpful',
      agentData.language || 'en',
      agentData.responseStyle || 'professional',
      agentData.autoReplyEnabled ? 1 : 0,
      agentData.responseDelayMin || 1,
      agentData.responseDelayMax || 5,
      agentData.maxResponseLength || 500,
      JSON.stringify(agentData.keywords || []),
      agentData.systemPrompt,
      agentData.isActive ? 1 : 0
    )

    return this.getAIAgent(agentData.id)
  }

  getAIAgent(agentId: string) {
    const stmt = this.db.prepare('SELECT * FROM ai_agents WHERE id = ?')
    const agent = stmt.get(agentId) as any

    if (agent) {
      agent.keywords = JSON.parse(agent.keywords || '[]')
      agent.autoReplyEnabled = Boolean(agent.auto_reply_enabled)
      agent.isActive = Boolean(agent.is_active)
    }

    return agent
  }

  getAllAIAgents() {
    const stmt = this.db.prepare('SELECT * FROM ai_agents ORDER BY created_at DESC')
    const agents = stmt.all() as any[]

    return agents.map(agent => ({
      ...agent,
      keywords: JSON.parse(agent.keywords || '[]'),
      autoReplyEnabled: Boolean(agent.auto_reply_enabled),
      isActive: Boolean(agent.is_active)
    }))
  }

  updateAIAgent(agentId: string, updates: any) {
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined)
    if (fields.length === 0) return this.getAIAgent(agentId)

    const setClause = fields.map(field => {
      if (field === 'autoReplyEnabled') return 'auto_reply_enabled = ?'
      if (field === 'responseDelayMin') return 'response_delay_min = ?'
      if (field === 'responseDelayMax') return 'response_delay_max = ?'
      if (field === 'maxResponseLength') return 'max_response_length = ?'
      if (field === 'responseStyle') return 'response_style = ?'
      if (field === 'systemPrompt') return 'system_prompt = ?'
      if (field === 'isActive') return 'is_active = ?'
      return `${field} = ?`
    }).join(', ')

    const values = fields.map(field => {
      if (field === 'keywords') return JSON.stringify(updates[field])
      if (field === 'autoReplyEnabled' || field === 'isActive') return updates[field] ? 1 : 0
      return updates[field]
    })

    const stmt = this.db.prepare(`
      UPDATE ai_agents
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `)

    stmt.run(...values, agentId)
    return this.getAIAgent(agentId)
  }

  deleteAIAgent(agentId: string) {
    const stmt = this.db.prepare('DELETE FROM ai_agents WHERE id = ?')
    const result = stmt.run(agentId)
    return result.changes > 0
  }

  // AI Agent Session Assignments
  assignAgentToSession(agentId: string, sessionId: string, priority: number = 1) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_agent_sessions (id, agent_id, session_id, is_enabled, priority)
      VALUES (?, ?, ?, 1, ?)
    `)

    const id = this.generateId()
    stmt.run(id, agentId, sessionId, priority)

    return this.getAgentSessionAssignment(agentId, sessionId)
  }

  unassignAgentFromSession(agentId: string, sessionId: string) {
    const stmt = this.db.prepare('DELETE FROM ai_agent_sessions WHERE agent_id = ? AND session_id = ?')
    const result = stmt.run(agentId, sessionId)
    return result.changes > 0
  }

  getAgentSessionAssignment(agentId: string, sessionId: string) {
    const stmt = this.db.prepare(`
      SELECT aas.*, aa.name as agent_name, ws.name as session_name
      FROM ai_agent_sessions aas
      JOIN ai_agents aa ON aas.agent_id = aa.id
      JOIN whatsapp_sessions ws ON aas.session_id = ws.id
      WHERE aas.agent_id = ? AND aas.session_id = ?
    `)

    const assignment = stmt.get(agentId, sessionId) as any
    if (assignment) {
      assignment.isEnabled = Boolean(assignment.is_enabled)
    }
    return assignment
  }

  getSessionAgents(sessionId: string) {
    const stmt = this.db.prepare(`
      SELECT aas.*, aa.name, aa.description, aa.personality, aa.is_active
      FROM ai_agent_sessions aas
      JOIN ai_agents aa ON aas.agent_id = aa.id
      WHERE aas.session_id = ? AND aa.is_active = 1
      ORDER BY aas.priority DESC, aas.created_at ASC
    `)

    const agents = stmt.all(sessionId) as any[]
    return agents.map(agent => ({
      ...agent,
      isEnabled: Boolean(agent.is_enabled),
      isActive: Boolean(agent.is_active)
    }))
  }

  getAgentSessions(agentId: string) {
    const stmt = this.db.prepare(`
      SELECT aas.*, ws.name, ws.phone_number, ws.status
      FROM ai_agent_sessions aas
      JOIN whatsapp_sessions ws ON aas.session_id = ws.id
      WHERE aas.agent_id = ?
      ORDER BY aas.created_at DESC
    `)

    const sessions = stmt.all(agentId) as any[]
    return sessions.map(session => ({
      ...session,
      isEnabled: Boolean(session.is_enabled)
    }))
  }

  toggleAgentSessionStatus(agentId: string, sessionId: string, isEnabled: boolean) {
    const stmt = this.db.prepare(`
      UPDATE ai_agent_sessions
      SET is_enabled = ?, updated_at = datetime('now')
      WHERE agent_id = ? AND session_id = ?
    `)

    stmt.run(isEnabled ? 1 : 0, agentId, sessionId)
    return this.getAgentSessionAssignment(agentId, sessionId)
  }

  // AI Agent Chat Settings (Individual Chat Level Controls)
  setChatAgentSettings(sessionId: string, contactNumber: string, settings: any) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_agent_chat_settings
      (id, session_id, contact_number, agent_id, is_enabled, auto_reply_enabled, custom_prompt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const id = this.generateId()
    stmt.run(
      id,
      sessionId,
      contactNumber,
      settings.agentId || null,
      settings.isEnabled ? 1 : 0,
      settings.autoReplyEnabled ? 1 : 0,
      settings.customPrompt || null
    )

    return this.getChatAgentSettings(sessionId, contactNumber)
  }

  getChatAgentSettings(sessionId: string, contactNumber: string) {
    const stmt = this.db.prepare(`
      SELECT aacs.*, aa.name as agent_name, aa.personality
      FROM ai_agent_chat_settings aacs
      LEFT JOIN ai_agents aa ON aacs.agent_id = aa.id
      WHERE aacs.session_id = ? AND aacs.contact_number = ?
    `)

    const settings = stmt.get(sessionId, contactNumber) as any
    if (settings) {
      settings.isEnabled = Boolean(settings.is_enabled)
      settings.autoReplyEnabled = Boolean(settings.auto_reply_enabled)
    }
    return settings
  }

  toggleChatAgentStatus(sessionId: string, contactNumber: string, isEnabled: boolean) {
    // First check if settings exist
    let settings = this.getChatAgentSettings(sessionId, contactNumber)

    if (!settings) {
      // Create default settings
      settings = this.setChatAgentSettings(sessionId, contactNumber, {
        isEnabled,
        autoReplyEnabled: true
      })
    } else {
      // Update existing settings
      const stmt = this.db.prepare(`
        UPDATE ai_agent_chat_settings
        SET is_enabled = ?, updated_at = datetime('now')
        WHERE session_id = ? AND contact_number = ?
      `)

      stmt.run(isEnabled ? 1 : 0, sessionId, contactNumber)
      settings = this.getChatAgentSettings(sessionId, contactNumber)
    }

    return settings
  }

  assignAgentToChat(sessionId: string, contactNumber: string, agentId: string) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_agent_chat_settings
      (id, session_id, contact_number, agent_id, is_enabled, auto_reply_enabled)
      VALUES (?, ?, ?, ?, 1, 1)
    `)

    const id = this.generateId()
    stmt.run(id, sessionId, contactNumber, agentId)

    return this.getChatAgentSettings(sessionId, contactNumber)
  }

  // AI Agent Response Logging
  logAIResponse(responseData: any) {
    const stmt = this.db.prepare(`
      INSERT INTO ai_agent_responses
      (id, agent_id, session_id, contact_number, original_message, ai_response,
       response_time_ms, confidence_score, sentiment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const id = this.generateId()
    stmt.run(
      id,
      responseData.agentId,
      responseData.sessionId,
      responseData.contactNumber,
      responseData.originalMessage,
      responseData.aiResponse,
      responseData.responseTimeMs || 0,
      responseData.confidenceScore || 0.0,
      responseData.sentiment || 'neutral'
    )

    return id
  }

  getAIResponseHistory(sessionId: string, contactNumber?: string, limit: number = 50) {
    let query = `
      SELECT aar.*, aa.name as agent_name
      FROM ai_agent_responses aar
      JOIN ai_agents aa ON aar.agent_id = aa.id
      WHERE aar.session_id = ?
    `
    const params = [sessionId]

    if (contactNumber) {
      query += ' AND aar.contact_number = ?'
      params.push(contactNumber)
    }

    query += ' ORDER BY aar.created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    return stmt.all(...params)
  }

  // Get AI Agent Analytics
  getAIAgentAnalytics(agentId?: string, sessionId?: string) {
    let query = `
      SELECT
        COUNT(*) as total_responses,
        AVG(response_time_ms) as avg_response_time,
        AVG(confidence_score) as avg_confidence,
        COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_responses,
        COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_responses,
        COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_responses,
        DATE(created_at) as response_date
      FROM ai_agent_responses
      WHERE 1=1
    `
    const params = []

    if (agentId) {
      query += ' AND agent_id = ?'
      params.push(agentId)
    }

    if (sessionId) {
      query += ' AND session_id = ?'
      params.push(sessionId)
    }

    query += ' GROUP BY DATE(created_at) ORDER BY response_date DESC LIMIT 30'

    const stmt = this.db.prepare(query)
    return stmt.all(...params)
  }

  // AI Provider Management
  createAIProvider(providerData: any) {
    const stmt = this.db.prepare(`
      INSERT INTO ai_providers
      (id, name, display_name, description, api_endpoint, supported_models,
       default_model, requires_api_key, is_active, configuration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      providerData.id,
      providerData.name,
      providerData.displayName,
      providerData.description,
      providerData.apiEndpoint,
      JSON.stringify(providerData.supportedModels || []),
      providerData.defaultModel,
      providerData.requiresApiKey ? 1 : 0,
      providerData.isActive ? 1 : 0,
      JSON.stringify(providerData.configuration || {})
    )

    return this.getAIProvider(providerData.id)
  }

  getAIProvider(providerId: string) {
    const stmt = this.db.prepare('SELECT * FROM ai_providers WHERE id = ?')
    const provider = stmt.get(providerId) as any

    if (provider) {
      provider.supportedModels = JSON.parse(provider.supported_models || '[]')
      provider.requiresApiKey = Boolean(provider.requires_api_key)
      provider.isActive = Boolean(provider.is_active)
      provider.configuration = JSON.parse(provider.configuration || '{}')
    }

    return provider
  }

  getAllAIProviders() {
    const stmt = this.db.prepare('SELECT * FROM ai_providers ORDER BY display_name')
    const providers = stmt.all() as any[]

    return providers.map(provider => ({
      ...provider,
      supportedModels: JSON.parse(provider.supported_models || '[]'),
      requiresApiKey: Boolean(provider.requires_api_key),
      isActive: Boolean(provider.is_active),
      configuration: JSON.parse(provider.configuration || '{}')
    }))
  }

  updateAIProvider(providerId: string, updates: any) {
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined)
    if (fields.length === 0) return this.getAIProvider(providerId)

    const setClause = fields.map(field => {
      if (field === 'displayName') return 'display_name = ?'
      if (field === 'apiEndpoint') return 'api_endpoint = ?'
      if (field === 'supportedModels') return 'supported_models = ?'
      if (field === 'defaultModel') return 'default_model = ?'
      if (field === 'requiresApiKey') return 'requires_api_key = ?'
      if (field === 'isActive') return 'is_active = ?'
      return `${field} = ?`
    }).join(', ')

    const values = fields.map(field => {
      if (field === 'supportedModels') return JSON.stringify(updates[field])
      if (field === 'configuration') return JSON.stringify(updates[field])
      if (field === 'requiresApiKey' || field === 'isActive') return updates[field] ? 1 : 0
      return updates[field]
    })

    const stmt = this.db.prepare(`
      UPDATE ai_providers
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `)

    stmt.run(...values, providerId)
    return this.getAIProvider(providerId)
  }

  deleteAIProvider(providerId: string) {
    const stmt = this.db.prepare('DELETE FROM ai_providers WHERE id = ?')
    const result = stmt.run(providerId)
    return result.changes > 0
  }

  // AI Provider API Key Management
  saveProviderAPIKey(keyData: any) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_provider_keys
      (id, provider_id, user_id, api_key_encrypted, api_key_hash, additional_config, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const id = this.generateId()
    stmt.run(
      id,
      keyData.providerId,
      keyData.userId || 'default',
      keyData.apiKeyEncrypted,
      keyData.apiKeyHash,
      JSON.stringify(keyData.additionalConfig || {}),
      keyData.isActive ? 1 : 0
    )

    return this.getProviderAPIKey(keyData.providerId, keyData.userId || 'default')
  }

  getProviderAPIKey(providerId: string, userId: string = 'default') {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_provider_keys
      WHERE provider_id = ? AND user_id = ? AND is_active = 1
    `)

    const key = stmt.get(providerId, userId) as any
    if (key) {
      key.additionalConfig = JSON.parse(key.additional_config || '{}')
      key.isActive = Boolean(key.is_active)
    }
    return key
  }

  getAllProviderAPIKeys(userId: string = 'default') {
    const stmt = this.db.prepare(`
      SELECT pk.*, p.display_name as provider_name
      FROM ai_provider_keys pk
      JOIN ai_providers p ON pk.provider_id = p.id
      WHERE pk.user_id = ? AND pk.is_active = 1
      ORDER BY p.display_name
    `)

    const keys = stmt.all(userId) as any[]
    return keys.map(key => ({
      ...key,
      additionalConfig: JSON.parse(key.additional_config || '{}'),
      isActive: Boolean(key.is_active)
    }))
  }

  deleteProviderAPIKey(providerId: string, userId: string = 'default') {
    const stmt = this.db.prepare(`
      DELETE FROM ai_provider_keys
      WHERE provider_id = ? AND user_id = ?
    `)
    const result = stmt.run(providerId, userId)
    return result.changes > 0
  }

  // AI Agent Provider Assignments
  assignProviderToAgent(agentId: string, providerId: string, modelName: string, priority: number = 1) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_agent_providers
      (id, agent_id, provider_id, model_name, priority, fallback_enabled, is_active)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `)

    const id = this.generateId()
    stmt.run(id, agentId, providerId, modelName, priority)

    return this.getAgentProviderAssignment(agentId, providerId)
  }

  getAgentProviderAssignment(agentId: string, providerId: string) {
    const stmt = this.db.prepare(`
      SELECT app.*, p.display_name as provider_name, p.supported_models
      FROM ai_agent_providers app
      JOIN ai_providers p ON app.provider_id = p.id
      WHERE app.agent_id = ? AND app.provider_id = ?
    `)

    const assignment = stmt.get(agentId, providerId) as any
    if (assignment) {
      assignment.supportedModels = JSON.parse(assignment.supported_models || '[]')
      assignment.fallbackEnabled = Boolean(assignment.fallback_enabled)
      assignment.isActive = Boolean(assignment.is_active)
      assignment.customConfig = JSON.parse(assignment.custom_config || '{}')
    }
    return assignment
  }

  getAgentProviders(agentId: string) {
    const stmt = this.db.prepare(`
      SELECT app.*, p.display_name as provider_name, p.supported_models, p.default_model
      FROM ai_agent_providers app
      JOIN ai_providers p ON app.provider_id = p.id
      WHERE app.agent_id = ? AND app.is_active = 1
      ORDER BY app.priority DESC, app.created_at ASC
    `)

    const providers = stmt.all(agentId) as any[]
    return providers.map(provider => ({
      ...provider,
      supportedModels: JSON.parse(provider.supported_models || '[]'),
      fallbackEnabled: Boolean(provider.fallback_enabled),
      isActive: Boolean(provider.is_active),
      customConfig: JSON.parse(provider.custom_config || '{}')
    }))
  }

  unassignProviderFromAgent(agentId: string, providerId: string) {
    const stmt = this.db.prepare(`
      DELETE FROM ai_agent_providers
      WHERE agent_id = ? AND provider_id = ?
    `)
    const result = stmt.run(agentId, providerId)
    return result.changes > 0
  }

  private initializeDefaultTemplates() {
    try {
      // Check if templates already exist
      const existingTemplates = this.getAllTemplates()
      if (existingTemplates.length > 0) {
        return // Templates already initialized
      }

      const defaultTemplates = [
        {
          id: 'template-1',
          name: 'Welcome Message',
          content: '{Hello|Hi|Hey} {{name}}, {welcome to|glad to have you in} our service! We are {excited|thrilled|happy} to have you on board. 🎉',
          variables: ['name'],
          category: 'welcome'
        },
        {
          id: 'template-2',
          name: 'Promotional Offer',
          content: '{Hi|Hello} {{name}}! {Special|Exclusive|Limited} offer just for you - Get {{discount}}% off on your next purchase. Use code: {{code}} 🛍️',
          variables: ['name', 'discount', 'code'],
          category: 'promotion'
        },
        {
          id: 'template-3',
          name: 'Order Confirmation',
          content: 'Dear {{name}}, your order #{{orderNumber}} has been {confirmed|processed|received}. Total amount: ₹{{amount}}. Expected delivery: {{date}} 📦',
          variables: ['name', 'orderNumber', 'amount', 'date'],
          category: 'order'
        },
        {
          id: 'template-4',
          name: 'Reminder Message',
          content: '{Hi|Hello} {{name}}, this is a {friendly|gentle|quick} reminder about {{event}} scheduled for {{date}}. {Don\'t miss out|See you there}! ⏰',
          variables: ['name', 'event', 'date'],
          category: 'reminder'
        },
        {
          id: 'template-5',
          name: 'Thank You Message',
          content: '{Thank you|Thanks} {{name}} for {choosing|using} our service! Your feedback {means a lot|is valuable} to us. Rate us: {{rating_link}} ⭐',
          variables: ['name', 'rating_link'],
          category: 'thankyou'
        },
        {
          id: 'template-6',
          name: 'Follow Up',
          content: '{Hi|Hello} {{name}}, {just checking in|following up} on your recent {purchase|order}. {How was your experience|Any feedback}? 💬',
          variables: ['name'],
          category: 'followup'
        },
        {
          id: 'template-7',
          name: 'Birthday Wishes',
          content: '🎂 {Happy Birthday|Many happy returns} {{name}}! {Hope you have|Wishing you} a {wonderful|fantastic|amazing} day! Special birthday discount: {{discount}}% 🎁',
          variables: ['name', 'discount'],
          category: 'birthday'
        },
        {
          id: 'template-8',
          name: 'Flash Sale',
          content: '⚡ {FLASH SALE|URGENT OFFER} {{name}}! {Limited time|Only today} - {{discount}}% OFF on {everything|all items}! {Hurry up|Don\'t wait} - {ends soon|limited stock}! 🔥',
          variables: ['name', 'discount'],
          category: 'flash-sale'
        },
        {
          id: 'template-9',
          name: 'Appointment Reminder',
          content: '{Hi|Hello} {{name}}, {friendly reminder|just reminding you} about your appointment on {{date}} at {{time}}. {See you then|Looking forward to meeting you}! 📅',
          variables: ['name', 'date', 'time'],
          category: 'appointment'
        },
        {
          id: 'template-10',
          name: 'Payment Reminder',
          content: 'Dear {{name}}, {gentle reminder|friendly notice} that your payment of ₹{{amount}} is {due|pending} on {{dueDate}}. {Please make payment|Kindly pay} to avoid {late fees|penalties}. 💳',
          variables: ['name', 'amount', 'dueDate'],
          category: 'payment'
        }
      ]

      // Insert default templates
      for (const template of defaultTemplates) {
        this.createTemplate({
          id: template.id,
          name: template.name,
          category: template.category,
          type: 'text',
          content: template.content,
          variables: template.variables,
          language: 'en',
          status: 'active',
          createdBy: 'system',
          tags: ['default', 'anti-blocking']
        })
      }

      console.log('✅ Default templates initialized')
    } catch (error) {
      console.error('❌ Error initializing default templates:', error)
    }
  }

  private initializeDefaultProviders() {
    try {
      // Check if providers already exist
      const existingProviders = this.getAllAIProviders()
      if (existingProviders.length > 0) {
        return // Providers already initialized
      }

      console.log('🔧 Initializing default AI providers...')

      // Import default providers
      const { AIProviderService } = require('./ai-providers')
      const defaultProviders = AIProviderService.getDefaultProviders()

      for (const providerData of defaultProviders) {
        const providerId = `provider_${providerData.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        this.createAIProvider({
          id: providerId,
          ...providerData
        })
        console.log(`✅ Created default provider: ${providerData.displayName}`)
      }

      console.log('✅ Default AI providers initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing default providers:', error)
    }
  }

  close() {
    this.db.close()
  }
}

// Export singleton instance
export const DatabaseService = new LocalDatabase()
export default DatabaseService
