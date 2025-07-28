// 🗄️ Server Database Service - PostgreSQL/MySQL Integration
// This service provides database operations using server database instead of SQLite

import { Pool, PoolClient } from 'pg'

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
}

// Create connection pool
const pool = new Pool(dbConfig)

// Database Types (same as original)
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
  name?: string
  phone_number?: string
  is_group: boolean
  profile_pic_url?: string
  last_seen?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  contact_id: string
  whatsapp_message_id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact'
  content: string
  media_url?: string
  is_from_me: boolean
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
}

export interface TemplateGroup {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  is_active: boolean
  template_count: number
  created_at: string
  updated_at: string
  created_by: string
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  category: string
  type: 'text' | 'image' | 'video' | 'document' | 'interactive'
  language: string
  status: 'active' | 'pending' | 'rejected' | 'draft'
  tags: string[]
  group_id?: string
  group_name?: string
  is_active: boolean
  usage_count: number
  rating: number
  media_url?: string
  media_type?: 'image' | 'video' | 'document' | 'audio'
  media_caption?: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface BulkMessageQueue {
  id: string
  name: string
  template_id: string
  contact_numbers: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduled_at?: string
  created_at: string
  updated_at: string
}

export interface BulkMessageLog {
  id: string
  bulk_queue_id: string
  contact_number: string
  status: 'sent' | 'failed'
  error_message?: string
  sent_at: string
}

class ServerDatabaseService {
  private pool: Pool

  constructor() {
    this.pool = pool
    this.initializeDatabase()
  }

  private async initializeDatabase() {
    try {
      console.log('🗄️  Initializing server database...')
      
      // Test connection
      const client = await this.pool.connect()
      console.log('✅ Server database connection established')
      client.release()
      
      // Create tables
      await this.createTables()
      
    } catch (error) {
      console.error('❌ Server database initialization failed:', error)
      throw error
    }
  }

  private async createTables() {
    const client = await this.pool.connect()
    
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
      `)

      // Contacts Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS contacts (
          id VARCHAR(255) PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          whatsapp_id VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          phone_number VARCHAR(50),
          is_group BOOLEAN NOT NULL DEFAULT false,
          profile_pic_url TEXT,
          last_seen TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE
        )
      `)

      // Messages Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(255) PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          contact_id VARCHAR(255) NOT NULL,
          whatsapp_message_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact')),
          content TEXT NOT NULL,
          media_url TEXT,
          is_from_me BOOLEAN NOT NULL DEFAULT false,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        )
      `)

      // Message Templates Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS message_templates (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          variables TEXT[] DEFAULT '{}',
          category VARCHAR(100) NOT NULL DEFAULT 'general',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Bulk Message Queue Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bulk_message_queue (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          template_id VARCHAR(255) NOT NULL,
          contact_numbers TEXT[] NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          scheduled_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE CASCADE
        )
      `)

      // Contact Groups Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS contact_groups (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(50) DEFAULT 'bg-blue-500',
          icon VARCHAR(50) DEFAULT 'Folder',
          contact_count INTEGER DEFAULT 0,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Bulk Message Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS bulk_message_logs (
          id VARCHAR(255) PRIMARY KEY,
          bulk_queue_id VARCHAR(255) NOT NULL,
          contact_number VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed')),
          error_message TEXT,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (bulk_queue_id) REFERENCES bulk_message_queue(id) ON DELETE CASCADE
        )
      `)

      // Create indexes for better performance
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_session_id ON contacts(session_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_id ON contacts(whatsapp_id)`)

      console.log('✅ Server database tables created successfully')
      
    } catch (error) {
      console.error('❌ Error creating server database tables:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // Session Management
  async createSession(session: Omit<WhatsAppSession, 'created_at' | 'updated_at'>): Promise<WhatsAppSession> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `INSERT INTO whatsapp_sessions (id, name, phone_number, status, qr_code, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *, created_at, updated_at`,
        [session.id, session.name, session.phone_number, session.status, session.qr_code, session.is_active]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async updateSession(id: string, updates: Partial<WhatsAppSession>): Promise<WhatsAppSession | null> {
    const client = await this.pool.connect()
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ')
      
      const values = [id, ...Object.values(updates)]
      
      const result = await client.query(
        `UPDATE whatsapp_sessions SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        values
      )
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async getSession(id: string): Promise<WhatsAppSession | null> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM whatsapp_sessions WHERE id = $1', [id])
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async getAllSessions(): Promise<WhatsAppSession[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM whatsapp_sessions ORDER BY created_at DESC')
      return result.rows
    } finally {
      client.release()
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM whatsapp_sessions WHERE id = $1', [id])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // Message Management
  async saveMessage(message: any): Promise<any> {
    const client = await this.pool.connect()
    try {
      const id = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const result = await client.query(
        `INSERT INTO messages (id, session_id, whatsapp_message_id, from_number, to_number, body, message_type, is_group_message, author, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         RETURNING *`,
        [id, message.session_id, message.whatsapp_message_id, message.from_number, message.to_number, message.body, message.message_type || 'text', message.is_group_message || false, message.author, message.timestamp]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getMessages(sessionId: string): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp DESC', [sessionId])
      return result.rows
    } finally {
      client.release()
    }
  }

  async getChatMessages(sessionId: string, contactNumber: string): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      // First find the contact by phone number or whatsapp_id
      const contactResult = await client.query(
        `SELECT id FROM contacts 
         WHERE session_id = $1 AND (phone_number = $2 OR whatsapp_id = $2)`,
        [sessionId, contactNumber]
      )
      
      if (contactResult.rows.length === 0) {
        console.log('❌ Contact not found for:', contactNumber)
        return []
      }
      
      const contactId = contactResult.rows[0].id
      console.log('🔍 Found contact ID:', contactId, 'for number:', contactNumber)
      
      // Get messages for this contact
      const result = await client.query(
        `SELECT m.*, c.name as contact_name, c.phone_number as contact_phone
         FROM messages m
         LEFT JOIN contacts c ON m.contact_id = c.id
         WHERE m.session_id = $1 AND m.contact_id = $2
         ORDER BY m.timestamp ASC`,
        [sessionId, contactId]
      )
      
      console.log('📨 Found messages:', result.rows.length)
      return result.rows
    } finally {
      client.release()
    }
  }

  // Contact Management
  async saveContact(contact: any): Promise<any> {
    const client = await this.pool.connect()
    try {
      const id = contact.id || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const result = await client.query(
        `INSERT INTO contacts (id, session_id, whatsapp_id, name, phone_number, is_group, profile_pic_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone_number = EXCLUDED.phone_number,
         is_group = EXCLUDED.is_group,
         profile_pic_url = EXCLUDED.profile_pic_url,
         updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id, contact.session_id, contact.whatsapp_id, contact.name, contact.phone_number, contact.is_group || false, contact.profile_pic_url]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getContacts(sessionId: string): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM contacts WHERE session_id = $1 ORDER BY name ASC', [sessionId])
      return result.rows
    } finally {
      client.release()
    }
  }

  async getAllContacts(): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM contacts ORDER BY name ASC')
      return result.rows
    } finally {
      client.release()
    }
  }

  async deleteContact(contactId: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM contacts WHERE id = $1', [contactId])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // Group Management
  async saveGroup(group: any): Promise<any> {
    const client = await this.pool.connect()
    try {
      const id = group.id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const result = await client.query(
        `INSERT INTO contact_groups (id, name, description, color, icon, contact_count, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         color = EXCLUDED.color,
         icon = EXCLUDED.icon,
         contact_count = EXCLUDED.contact_count,
         updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id, group.name, group.description, group.color, group.icon, group.contactCount || 0, group.isDefault || false]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getAllGroups(): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM contact_groups ORDER BY name ASC')
      return result.rows
    } finally {
      client.release()
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM contact_groups WHERE id = $1', [groupId])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // Template Management
  async saveTemplate(template: any): Promise<any> {
    const client = await this.pool.connect()
    try {
      const id = template.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const result = await client.query(
        `INSERT INTO message_templates (id, name, content, variables, category, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         content = EXCLUDED.content,
         variables = EXCLUDED.variables,
         category = EXCLUDED.category,
         is_active = EXCLUDED.is_active,
         updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [id, template.name, template.content, template.variables || [], template.category || 'general', template.is_active !== false]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async getAllTemplates(): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM message_templates ORDER BY name ASC')
      return result.rows
    } finally {
      client.release()
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM message_templates WHERE id = $1', [templateId])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // Session Management Methods
  async getSession(sessionId: string): Promise<any> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('SELECT * FROM whatsapp_sessions WHERE id = $1', [sessionId])
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async updateSession(sessionId: string, updates: any): Promise<any> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        `UPDATE whatsapp_sessions SET
         name = COALESCE($2, name),
         phone_number = COALESCE($3, phone_number),
         status = COALESCE($4, status),
         qr_code = COALESCE($5, qr_code),
         is_active = COALESCE($6, is_active),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [sessionId, updates.name, updates.phone_number, updates.status, updates.qr_code, updates.is_active]
      )
      return result.rows[0] || null
    } finally {
      client.release()
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query('DELETE FROM whatsapp_sessions WHERE id = $1', [sessionId])
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // Message Range Query
  async getMessagesInDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM messages WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp DESC',
        [startDate, endDate]
      )
      return result.rows
    } finally {
      client.release()
    }
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end()
  }
}

// Export singleton instance
export { ServerDatabaseService }
export const serverDatabase = new ServerDatabaseService()
export const DatabaseService = serverDatabase // Alias for compatibility
export default serverDatabase
