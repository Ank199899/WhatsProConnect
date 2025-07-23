import { getBackendUrl, getWebSocketUrl, getFrontendUrl } from '@/lib/config'

// Dynamic configuration for API endpoints
export const getApiConfig = () => {
  return {
    API_BASE_URL: getBackendUrl(),
    WEBSOCKET_URL: getWebSocketUrl(),
    FRONTEND_URL: getFrontendUrl()
  }
}

const config = getApiConfig()

export const API_BASE_URL = config.API_BASE_URL
export const WEBSOCKET_URL = config.WEBSOCKET_URL
export const FRONTEND_URL = config.FRONTEND_URL

export default config