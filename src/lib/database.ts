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
  }

  private initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON')

    // Create tables
    this.createTables()
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
    `)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Session Management
  createSession(sessionData: Omit<WhatsAppSession, 'created_at' | 'updated_at'> | Omit<WhatsAppSession, 'id' | 'created_at' | 'updated_at'>): WhatsAppSession {
    const id = (sessionData as any).id || this.generateId() // Use provided ID or generate new one
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO whatsapp_sessions (id, name, phone_number, status, qr_code, is_active, created_at, updated_at)
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

  close() {
    this.db.close()
  }
}

// Export singleton instance
export const DatabaseService = new LocalDatabase()
export default DatabaseService
