/**
 * 🎯 MASTER CONFIGURATION - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️  CHANGE ONLY HERE - EVERYTHING ELSE WILL AUTO-UPDATE!
 */

const MASTER_CONFIG = {
  // 🌐 MAIN DOMAIN (without port)
  DOMAIN: '192.168.1.230',

  // 🔧 INTERNAL PORTS (hidden from users)
  INTERNAL_PORTS: {
    FRONTEND: 3008,
    BACKEND: 3006,
    NGINX: 80
  },

  // 🌍 PUBLIC URLs (what users see - no ports!)
  PUBLIC_URLS: {
    APP: 'http://192.168.1.230',           // Main app (no port!)
    API: 'http://192.168.1.230/api',       // API endpoint (no port!)
    ADMIN: 'http://192.168.1.230/admin'    // Admin panel (no port!)
  },
  
  // 📱 APP SETTINGS
  APP: {
    NAME: 'WhatsApp Advanced WebApp',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production'
  },
  
  // 🗄️ DATABASE
  DATABASE: {
    PATH: './data/whatsapp.db',
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
