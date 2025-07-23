/**
 * 🎯 MASTER CONFIGURATION - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️  CHANGE ONLY HERE - EVERYTHING ELSE WILL AUTO-UPDATE!
 */

const MASTER_CONFIG = {
  // 🌐 MAIN DOMAIN (without port) - Tailscale IP for remote access
  DOMAIN: '100.115.3.36',

  // 🔧 INTERNAL PORTS (hidden from users)
  INTERNAL_PORTS: {
    FRONTEND: 3008,
    BACKEND: 3006,
    NGINX: 80
  },

  // 🌍 PUBLIC URLs (what users see - Tailscale for remote access!)
  PUBLIC_URLS: {
    APP: 'http://100.115.3.36:3008',       // Main app (Tailscale IP)
    API: 'http://100.115.3.36:3006/api',   // API endpoint (Tailscale IP)
    ADMIN: 'http://100.115.3.36:3008/admin' // Admin panel (Tailscale IP)
  },
  
  // 📱 APP SETTINGS
  APP: {
    NAME: 'WhatsPro Connect',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production'
  },
  
  // 🗄️ DATABASE - POSTGRESQL CONFIGURATION
  DATABASE: {
    TYPE: 'postgresql',
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 5432,
    NAME: process.env.DB_NAME || 'whatsapp_advanced',
    USER: process.env.DB_USER || 'whatsapp_user',
    PASSWORD: process.env.DB_PASSWORD || 'whatsapp_secure_password_2025',
    SSL: process.env.DB_SSL === 'true',
    MAX_CONNECTIONS: 20,
    BACKUP_PATH: './data/backups/'
  },
  
  // 📁 PATHS
  PATHS: {
    SESSIONS: './sessions',
    UPLOADS: './public/uploads',
    LOGS: './logs'
  }
}

// 🔄 AUTO-GENERATE INTERNAL URLs
MASTER_CONFIG.INTERNAL_URLS = {
  FRONTEND: `http://localhost:${MASTER_CONFIG.INTERNAL_PORTS.FRONTEND}`,
  BACKEND: `http://localhost:${MASTER_CONFIG.INTERNAL_PORTS.BACKEND}`,
  API: `http://localhost:${MASTER_CONFIG.INTERNAL_PORTS.BACKEND}/api`
}

// 📤 EXPORT FOR ALL FILES
module.exports = MASTER_CONFIG

// 🖨️ DISPLAY CONFIG
console.log('🎯 MASTER CONFIG LOADED:')
console.log(`   Public App: ${MASTER_CONFIG.PUBLIC_URLS.APP}`)
console.log(`   Public API: ${MASTER_CONFIG.PUBLIC_URLS.API}`)
console.log(`   Internal Frontend: ${MASTER_CONFIG.INTERNAL_URLS.FRONTEND}`)
console.log(`   Internal Backend: ${MASTER_CONFIG.INTERNAL_URLS.BACKEND}`)
console.log('')
