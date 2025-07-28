// 🗄️ Server-Side Storage Service - PostgreSQL Only
// Replaces all localStorage, sessionStorage, and local file storage

// Only import pg on server-side to avoid client-side issues
let Pool: any, PoolClient: any

if (typeof window === 'undefined') {
  // Server-side only
  const pg = require('pg')
  Pool = pg.Pool
  PoolClient = pg.PoolClient
}

// Database configuration - only on server side
let dbConfig: any = null
let pool: any = null

if (typeof window === 'undefined') {
  dbConfig = {
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

  // Create connection pool only on server
  pool = new Pool(dbConfig)
}

// Types
export interface UserPreference {
  id: string
  user_id: string
  preference_key: string
  preference_value: string
  preference_type: 'string' | 'number' | 'boolean' | 'json'
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  ip_address?: string
  user_agent?: string
  expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WhatsAppSessionData {
  id: string
  session_id: string
  data_type: 'auth' | 'cookies' | 'local_storage' | 'session_storage' | 'cache'
  data_key: string
  data_value: string
  encrypted: boolean
  created_at: string
  updated_at: string
}

export interface ApplicationSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CacheItem {
  id: string
  cache_key: string
  cache_value: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export class ServerStorageService {
  private pool: any

  constructor() {
    if (typeof window === 'undefined') {
      this.pool = pool
      console.log('🗄️ ServerStorageService initialized - All data goes to PostgreSQL')
    } else {
      console.warn('⚠️ ServerStorageService should only be used on server-side')
    }
  }

  // ==================== USER PREFERENCES (Replace localStorage) ====================
  
  async getUserPreference(userId: string, key: string): Promise<any> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM user_preferences WHERE user_id = $1 AND preference_key = $2',
        [userId, key]
      )
      
      if (result.rows.length === 0) return null
      
      const pref = result.rows[0]
      return this.parsePreferenceValue(pref.preference_value, pref.preference_type)
    } finally {
      client.release()
    }
  }

  async setUserPreference(userId: string, key: string, value: any, type?: string): Promise<void> {
    const client = await this.pool.connect()
    try {
      const preferenceType = type || this.detectType(value)
      const stringValue = this.stringifyValue(value, preferenceType)
      
      await client.query(`
        INSERT INTO user_preferences (id, user_id, preference_key, preference_value, preference_type)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, preference_key) 
        DO UPDATE SET 
          preference_value = $4,
          preference_type = $5,
          updated_at = CURRENT_TIMESTAMP
      `, [
        `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        key,
        stringValue,
        preferenceType
      ])
      
      console.log(`💾 User preference saved: ${userId}/${key}`)
    } finally {
      client.release()
    }
  }

  async getAllUserPreferences(userId: string): Promise<Record<string, any>> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM user_preferences WHERE user_id = $1',
        [userId]
      )
      
      const preferences: Record<string, any> = {}
      result.rows.forEach(row => {
        preferences[row.preference_key] = this.parsePreferenceValue(
          row.preference_value, 
          row.preference_type
        )
      })
      
      return preferences
    } finally {
      client.release()
    }
  }

  async removeUserPreference(userId: string, key: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        'DELETE FROM user_preferences WHERE user_id = $1 AND preference_key = $2',
        [userId, key]
      )
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // ==================== USER SESSIONS (Replace browser sessions) ====================
  
  async createUserSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const client = await this.pool.connect()
    try {
      const sessionToken = this.generateSessionToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      const result = await client.query(`
        INSERT INTO user_sessions (id, user_id, session_token, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        expiresAt.toISOString()
      ])
      
      console.log(`🔐 User session created: ${userId}`)
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async validateUserSession(sessionToken: string): Promise<UserSession | null> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
        SELECT * FROM user_sessions 
        WHERE session_token = $1 
        AND is_active = true 
        AND expires_at > CURRENT_TIMESTAMP
      `, [sessionToken])
      
      if (result.rows.length === 0) return null
      
      // Update last activity
      await client.query(
        'UPDATE user_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [result.rows[0].id]
      )
      
      return result.rows[0]
    } finally {
      client.release()
    }
  }

  async invalidateUserSession(sessionToken: string): Promise<boolean> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        'UPDATE user_sessions SET is_active = false WHERE session_token = $1',
        [sessionToken]
      )
      return result.rowCount > 0
    } finally {
      client.release()
    }
  }

  // ==================== WHATSAPP SESSION DATA (Replace local files) ====================
  
  async saveWhatsAppSessionData(
    sessionId: string, 
    dataType: WhatsAppSessionData['data_type'], 
    dataKey: string, 
    dataValue: any,
    encrypted: boolean = false
  ): Promise<void> {
    const client = await this.pool.connect()
    try {
      const stringValue = typeof dataValue === 'string' ? dataValue : JSON.stringify(dataValue)
      
      await client.query(`
        INSERT INTO whatsapp_session_data (id, session_id, data_type, data_key, data_value, encrypted)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (session_id, data_type, data_key)
        DO UPDATE SET 
          data_value = $5,
          encrypted = $6,
          updated_at = CURRENT_TIMESTAMP
      `, [
        `wsdata_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        dataType,
        dataKey,
        stringValue,
        encrypted
      ])
      
      console.log(`💾 WhatsApp session data saved: ${sessionId}/${dataType}/${dataKey}`)
    } finally {
      client.release()
    }
  }

  async getWhatsAppSessionData(
    sessionId: string, 
    dataType: WhatsAppSessionData['data_type'], 
    dataKey: string
  ): Promise<any> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM whatsapp_session_data WHERE session_id = $1 AND data_type = $2 AND data_key = $3',
        [sessionId, dataType, dataKey]
      )
      
      if (result.rows.length === 0) return null
      
      const data = result.rows[0]
      try {
        return JSON.parse(data.data_value)
      } catch {
        return data.data_value
      }
    } finally {
      client.release()
    }
  }

  // Helper methods
  private parsePreferenceValue(value: string, type: string): any {
    switch (type) {
      case 'number': return parseFloat(value)
      case 'boolean': return value === 'true'
      case 'json': return JSON.parse(value)
      default: return value
    }
  }

  private stringifyValue(value: any, type: string): string {
    switch (type) {
      case 'json': return JSON.stringify(value)
      default: return String(value)
    }
  }

  private detectType(value: any): string {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'object') return 'json'
    return 'string'
  }

  private generateSessionToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}_${Math.random().toString(36).substr(2, 16)}`
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

// Export singleton instance
export const serverStorage = new ServerStorageService()
export default serverStorage
