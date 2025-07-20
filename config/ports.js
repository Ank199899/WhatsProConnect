/**
 * 🚀 CENTRALIZED PORT CONFIGURATION
 * 
 * ⚠️  IMPORTANT: DO NOT CHANGE THESE PORTS!
 * All services are configured to use these specific ports.
 * Changing them will break the application.
 */

const PORTS = {
  // Frontend (Next.js Application)
  FRONTEND: 3005,
  
  // Backend (WhatsApp Server)
  BACKEND: 3001,
  
  // Development Database (if needed)
  DATABASE: 5432,
  
  // Redis (if needed)
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
