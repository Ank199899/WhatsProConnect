/**
 * 🚀 DYNAMIC CONFIG FOR FRONTEND
 * Automatically detects and uses dynamic configuration
 */

interface DynamicConfig {
  NETWORK: {
    PRIMARY_IP: string
    INTERFACES: Array<{
      name: string
      address: string
      netmask: string
    }>
    HOSTNAME: string
  }
  PORTS: {
    FRONTEND: number
    BACKEND: number
    DATABASE: number
    REDIS: number
  }
  URLS: {
    PUBLIC_FRONTEND: string
    PUBLIC_BACKEND: string
    PUBLIC_API: string
    INTERNAL_FRONTEND: string
    INTERNAL_BACKEND: string
    INTERNAL_API: string
    BIND_FRONTEND: string
    BIND_BACKEND: string
    BIND_API: string
    WEBSOCKET: string
    WEBSOCKET_INTERNAL: string
  }
  ENV: {
    NODE_ENV: string
    TIMESTAMP: string
    PLATFORM: string
    ARCH: string
    HOSTNAME: string
  }
}

// Default fallback configuration
const FALLBACK_CONFIG: DynamicConfig = {
  NETWORK: {
    PRIMARY_IP: '192.168.1.230',
    INTERFACES: [],
    HOSTNAME: 'localhost'
  },
  PORTS: {
    FRONTEND: 3008,
    BACKEND: 3006,
    DATABASE: 5432,
    REDIS: 6379
  },
  URLS: {
    PUBLIC_FRONTEND: 'http://192.168.1.230:3008',
    PUBLIC_BACKEND: 'http://192.168.1.230:3006',
    PUBLIC_API: 'http://192.168.1.230:3006/api',
    INTERNAL_FRONTEND: 'http://localhost:3008',
    INTERNAL_BACKEND: 'http://localhost:3006',
    INTERNAL_API: 'http://localhost:3006/api',
    BIND_FRONTEND: 'http://0.0.0.0:3008',
    BIND_BACKEND: 'http://0.0.0.0:3006',
    BIND_API: 'http://0.0.0.0:3006/api',
    WEBSOCKET: 'ws://192.168.1.230:3006',
    WEBSOCKET_INTERNAL: 'ws://localhost:3006'
  },
  ENV: {
    NODE_ENV: 'production',
    TIMESTAMP: new Date().toISOString(),
    PLATFORM: 'linux',
    ARCH: 'x64',
    HOSTNAME: 'localhost'
  }
}

// Load dynamic configuration
function loadDynamicConfig(): DynamicConfig {
  // Try to load from environment variable (set by dynamic-start.js)
  if (typeof process !== 'undefined' && process.env.DYNAMIC_CONFIG) {
    try {
      return JSON.parse(process.env.DYNAMIC_CONFIG)
    } catch (err) {
      console.warn('⚠️  Failed to parse DYNAMIC_CONFIG from environment')
    }
  }
  
  // Try to load from file (server-side only)
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs')
      const path = require('path')
      const configPath = path.join(process.cwd(), 'config/current-config.json')
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8')
        return JSON.parse(configData)
      }
    } catch (err) {
      console.warn('⚠️  Failed to load dynamic config from file')
    }
  }
  
  // Browser-side: try to detect from current URL
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname
    const currentPort = parseInt(window.location.port) || 80
    
    // Guess backend port (usually frontend port + 2 or - 2)
    const backendPort = currentPort === 3008 ? 3006 : currentPort + 2
    
    return {
      ...FALLBACK_CONFIG,
      NETWORK: {
        ...FALLBACK_CONFIG.NETWORK,
        PRIMARY_IP: currentHost
      },
      PORTS: {
        ...FALLBACK_CONFIG.PORTS,
        FRONTEND: currentPort,
        BACKEND: backendPort
      },
      URLS: {
        PUBLIC_FRONTEND: `http://${currentHost}:${currentPort}`,
        PUBLIC_BACKEND: `http://${currentHost}:${backendPort}`,
        PUBLIC_API: `http://${currentHost}:${backendPort}/api`,
        INTERNAL_FRONTEND: `http://localhost:${currentPort}`,
        INTERNAL_BACKEND: `http://localhost:${backendPort}`,
        INTERNAL_API: `http://localhost:${backendPort}/api`,
        BIND_FRONTEND: `http://0.0.0.0:${currentPort}`,
        BIND_BACKEND: `http://0.0.0.0:${backendPort}`,
        BIND_API: `http://0.0.0.0:${backendPort}/api`,
        WEBSOCKET: `ws://${currentHost}:${backendPort}`,
        WEBSOCKET_INTERNAL: `ws://localhost:${backendPort}`
      }
    }
  }
  
  // Ultimate fallback
  console.warn('⚠️  Using fallback configuration')
  return FALLBACK_CONFIG
}

// Get current configuration
export const DYNAMIC_CONFIG = loadDynamicConfig()

// Export individual parts for convenience
export const API_BASE_URL = DYNAMIC_CONFIG.URLS.PUBLIC_API
export const WEBSOCKET_URL = DYNAMIC_CONFIG.URLS.WEBSOCKET
export const FRONTEND_URL = DYNAMIC_CONFIG.URLS.PUBLIC_FRONTEND
export const BACKEND_URL = DYNAMIC_CONFIG.URLS.PUBLIC_BACKEND

// Log configuration in development
if (DYNAMIC_CONFIG.ENV.NODE_ENV === 'development') {
  console.log('🎯 Dynamic Config Loaded:', {
    IP: DYNAMIC_CONFIG.NETWORK.PRIMARY_IP,
    Frontend: DYNAMIC_CONFIG.PORTS.FRONTEND,
    Backend: DYNAMIC_CONFIG.PORTS.BACKEND,
    API: DYNAMIC_CONFIG.URLS.PUBLIC_API,
    WebSocket: DYNAMIC_CONFIG.URLS.WEBSOCKET
  })
}

export default DYNAMIC_CONFIG
