// 🗄️ Database-based Authentication Strategy for WhatsApp
// Replaces LocalAuth file storage with PostgreSQL storage

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseAuthStrategy {
    constructor(options = {}) {
        this.clientId = options.clientId;
        this.sessionId = options.sessionId || this.clientId;
        
        // Database configuration
        this.dbConfig = {
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
        
        this.pool = new Pool(this.dbConfig);
        console.log(`🗄️ DatabaseAuthStrategy initialized for session: ${this.sessionId}`);
    }

    async saveSessionData(dataType, dataKey, dataValue) {
        const client = await this.pool.connect();
        try {
            const stringValue = typeof dataValue === 'string' ? dataValue : JSON.stringify(dataValue);
            
            await client.query(`
                INSERT INTO whatsapp_session_data (id, session_id, data_type, data_key, data_value, encrypted)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (session_id, data_type, data_key)
                DO UPDATE SET 
                    data_value = $5,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                `wsdata_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                this.sessionId,
                dataType,
                dataKey,
                stringValue,
                false
            ]);
            
            console.log(`💾 Session data saved: ${this.sessionId}/${dataType}/${dataKey}`);
        } finally {
            client.release();
        }
    }

    async getSessionData(dataType, dataKey) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM whatsapp_session_data WHERE session_id = $1 AND data_type = $2 AND data_key = $3',
                [this.sessionId, dataType, dataKey]
            );
            
            if (result.rows.length === 0) return null;
            
            const data = result.rows[0];
            try {
                return JSON.parse(data.data_value);
            } catch {
                return data.data_value;
            }
        } finally {
            client.release();
        }
    }

    async deleteSessionData(dataType, dataKey) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM whatsapp_session_data WHERE session_id = $1 AND data_type = $2 AND data_key = $3',
                [this.sessionId, dataType, dataKey]
            );
            
            console.log(`🗑️ Session data deleted: ${this.sessionId}/${dataType}/${dataKey}`);
            return result.rowCount > 0;
        } finally {
            client.release();
        }
    }

    async getAllSessionData(dataType) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM whatsapp_session_data WHERE session_id = $1 AND data_type = $2',
                [this.sessionId, dataType]
            );
            
            const data = {};
            result.rows.forEach(row => {
                try {
                    data[row.data_key] = JSON.parse(row.data_value);
                } catch {
                    data[row.data_key] = row.data_value;
                }
            });
            
            return data;
        } finally {
            client.release();
        }
    }

    // WhatsApp Web.js Auth Strategy Interface
    async beforeBrowserInitialized() {
        console.log(`🔄 Initializing database auth for session: ${this.sessionId}`);
        
        // Ensure session exists in database
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO whatsapp_sessions (id, name, status, is_active)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING
            `, [
                this.sessionId,
                `Session ${this.sessionId}`,
                'initializing',
                true
            ]);
        } finally {
            client.release();
        }
    }

    async logout() {
        console.log(`🔄 Logging out session: ${this.sessionId}`);
        
        // Clear all session data from database
        const client = await this.pool.connect();
        try {
            await client.query(
                'DELETE FROM whatsapp_session_data WHERE session_id = $1',
                [this.sessionId]
            );
            
            // Update session status
            await client.query(
                'UPDATE whatsapp_sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['disconnected', this.sessionId]
            );
            
            console.log(`✅ Session data cleared for: ${this.sessionId}`);
        } finally {
            client.release();
        }
    }

    async destroy() {
        console.log(`🗑️ Destroying session: ${this.sessionId}`);
        await this.logout();
    }

    async getWebAuthSession() {
        // Get authentication data from database
        const authData = await this.getSessionData('auth', 'web_auth_session');
        return authData;
    }

    async setWebAuthSession(session) {
        // Save authentication data to database
        await this.saveSessionData('auth', 'web_auth_session', session);
    }

    async getLocalStorageData() {
        // Get localStorage equivalent data from database
        return await this.getAllSessionData('local_storage');
    }

    async setLocalStorageData(data) {
        // Save localStorage equivalent data to database
        for (const [key, value] of Object.entries(data)) {
            await this.saveSessionData('local_storage', key, value);
        }
    }

    async getSessionStorageData() {
        // Get sessionStorage equivalent data from database
        return await this.getAllSessionData('session_storage');
    }

    async setSessionStorageData(data) {
        // Save sessionStorage equivalent data to database
        for (const [key, value] of Object.entries(data)) {
            await this.saveSessionData('session_storage', key, value);
        }
    }

    async getCookies() {
        // Get cookies from database
        return await this.getSessionData('cookies', 'browser_cookies');
    }

    async setCookies(cookies) {
        // Save cookies to database
        await this.saveSessionData('cookies', 'browser_cookies', cookies);
    }

    // Compatibility with LocalAuth interface
    get dataPath() {
        return path.join(__dirname, '../sessions'); // Fallback path
    }

    get userDataDir() {
        return path.join(this.dataPath, `session-${this.clientId}`);
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = DatabaseAuthStrategy;
