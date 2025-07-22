/**
 * 🎯 AUTO-LOADED FROM MASTER CONFIG
 *
 * ⚠️  CHANGE ONLY IN master-config.js!
 */

// Load from master config
const MASTER_CONFIG = require('../master-config.js')

const PORTS = {
  FRONTEND: MASTER_CONFIG.INTERNAL_PORTS.FRONTEND,
  BACKEND: MASTER_CONFIG.INTERNAL_PORTS.BACKEND,
  DATABASE: 5432,
  REDIS: 6379
}

const HOST = '0.0.0.0'

const URLS = {
  FRONTEND: `http://${HOST}:${PORTS.FRONTEND}`,
  BACKEND: `http://${HOST}:${PORTS.BACKEND}`,
  API: `http://${HOST}:${PORTS.BACKEND}/api`,
  SOCKET: `http://${HOST}:${PORTS.BACKEND}`
}

// Export for Node.js (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PORTS,
    HOST,
    URLS
  }
}

// Export for ES6 modules
if (typeof window === 'undefined') {
  global.APP_PORTS = PORTS
  global.APP_HOST = HOST
  global.APP_URLS = URLS
}

console.log('🔧 Port Configuration Loaded:')
console.log(`   Frontend: ${URLS.FRONTEND}`)
console.log(`   Backend:  ${URLS.BACKEND}`)
console.log(`   API:      ${URLS.API}`)
console.log(`   Socket:   ${URLS.SOCKET}`)
