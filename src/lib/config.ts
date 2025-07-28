/**
 * Centralized Configuration Management
 * This file ensures consistent port and URL configuration across the entire application
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// Port Configuration - Single source of truth
export const PORTS = {
  FRONTEND: parseInt(process.env.FRONTEND_PORT || '3008'),
  BACKEND: parseInt(process.env.BACKEND_PORT || '3006'),
  WHATSAPP_SERVER: parseInt(process.env.WHATSAPP_SERVER_PORT || '3006'),
} as const

// Host Configuration
export const HOSTS = {
  LOCAL: 'localhost',
  NETWORK: '0.0.0.0',
  PRODUCTION: process.env.PRODUCTION_HOST || 'localhost',
} as const

// URL Configuration - Dynamic based on environment
export const URLS = {
  // Frontend URLs
  FRONTEND_LOCAL: `http://${HOSTS.LOCAL}:${PORTS.FRONTEND}`,
  FRONTEND_NETWORK: `http://${HOSTS.NETWORK}:${PORTS.FRONTEND}`,
  
  // Backend URLs
  BACKEND_LOCAL: `http://${HOSTS.LOCAL}:${PORTS.BACKEND}`,
  BACKEND_NETWORK: `http://${HOSTS.NETWORK}:${PORTS.BACKEND}`,
  
  // WhatsApp Server URLs
  WHATSAPP_LOCAL: `http://${HOSTS.LOCAL}:${PORTS.WHATSAPP_SERVER}`,
  WHATSAPP_NETWORK: `http://${HOSTS.NETWORK}:${PORTS.WHATSAPP_SERVER}`,
} as const

// Dynamic URL Resolution
export function getBackendUrl(): string {
  // Priority: Client-side env var > Server-side env var > Dynamic detection > Default
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL) {
    console.log('🔧 Using client-side NEXT_PUBLIC_WHATSAPP_BACKEND_URL:', process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL)
    return process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL
  }

  if (process.env.WHATSAPP_BACKEND_URL) {
    console.log('🔧 Using server-side WHATSAPP_BACKEND_URL:', process.env.WHATSAPP_BACKEND_URL)
    return process.env.WHATSAPP_BACKEND_URL
  }

  // For server-side (API routes) - always use localhost for development
  if (typeof window === 'undefined') {
    console.log('🔧 Using server-side BACKEND_LOCAL:', URLS.BACKEND_LOCAL)
    return URLS.BACKEND_LOCAL
  }

  // For client-side - in development, always use localhost
  if (isDevelopment) {
    console.log('🔧 Using client-side BACKEND_LOCAL:', URLS.BACKEND_LOCAL)
    return URLS.BACKEND_LOCAL
  }

  // For production - use current hostname with backend port
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const productionUrl = `${protocol}//${hostname}:${PORTS.BACKEND}`

  console.log('🔧 Using production URL:', productionUrl)
  return productionUrl
}

export function getFrontendUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  if (typeof window === 'undefined') {
    return URLS.FRONTEND_LOCAL
  }
  
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return URLS.FRONTEND_LOCAL
  }
  
  return `${window.location.protocol}//${hostname}:${PORTS.FRONTEND}`
}

// WebSocket URL Configuration
export function getWebSocketUrl(): string {
  const backendUrl = getBackendUrl()
  return backendUrl.replace('http://', 'ws://').replace('https://', 'wss://')
}

// Configuration validation
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!PORTS.FRONTEND || PORTS.FRONTEND < 1000 || PORTS.FRONTEND > 65535) {
    errors.push(`Invalid frontend port: ${PORTS.FRONTEND}`)
  }
  
  if (!PORTS.BACKEND || PORTS.BACKEND < 1000 || PORTS.BACKEND > 65535) {
    errors.push(`Invalid backend port: ${PORTS.BACKEND}`)
  }
  
  if (PORTS.FRONTEND === PORTS.BACKEND) {
    errors.push('Frontend and backend ports cannot be the same')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export configuration object for easy access
export const CONFIG = {
  PORTS,
  HOSTS,
  URLS,
  getBackendUrl,
  getFrontendUrl,
  getWebSocketUrl,
  validateConfig,
  isProduction,
  isDevelopment,
} as const

export default CONFIG
