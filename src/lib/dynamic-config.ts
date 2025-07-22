// Dynamic configuration for API endpoints
export const getApiConfig = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    
    // Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        API_BASE_URL: 'http://localhost:3006',
        WEBSOCKET_URL: 'ws://localhost:3006',
        FRONTEND_URL: 'http://localhost:3000'
      }
    }
    
    // Production
    return {
      API_BASE_URL: `${protocol}//${hostname}:3006`,
      WEBSOCKET_URL: `${protocol === 'https:' ? 'wss:' : 'ws:'}//${hostname}:3006`,
      FRONTEND_URL: `${protocol}//${hostname}:3000`
    }
  }
  
  // Server-side defaults
  return {
    API_BASE_URL: 'http://localhost:3006',
    WEBSOCKET_URL: 'ws://localhost:3006',
    FRONTEND_URL: 'http://localhost:3000'
  }
}

const config = getApiConfig()

export const API_BASE_URL = config.API_BASE_URL
export const WEBSOCKET_URL = config.WEBSOCKET_URL
export const FRONTEND_URL = config.FRONTEND_URL

export default config