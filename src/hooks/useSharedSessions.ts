'use client'

import { useState, useEffect, useCallback } from 'react'

interface WhatsAppSession {
  id: string
  name: string
  status: string
  phoneNumber?: string
  phone_number?: string
  qrCode?: string
  qr_code?: string
  isActive?: boolean
  is_active?: boolean
  lastActivity?: string
  created_at?: string
  messageCount?: number
  isReady?: boolean
}

interface FormattedSession {
  id: string
  name: string
  phone: string
  status: 'connected' | 'disconnected' | 'connecting'
  lastSeen: string
  qrCode?: string
  isReady: boolean
}

// Global state for sessions
let globalSessions: WhatsAppSession[] = []
let globalListeners: ((sessions: FormattedSession[]) => void)[] = []

// Notify all listeners when sessions change
const notifyListeners = (sessions: FormattedSession[]) => {
  globalListeners.forEach(listener => listener(sessions))
}

// Format sessions consistently
const formatSessions = (rawSessions: WhatsAppSession[]): FormattedSession[] => {
  console.log('🔄 formatSessions: Input sessions:', rawSessions)
  const formatted = rawSessions.map((session: any) => {
    const result = {
      id: session.id || session.sessionId,
      name: session.name || `Session ${session.id}`,
      phone: session.phoneNumber || session.phone_number || 'Not connected',
      status: session.status === 'ready' ? 'connected' :
             session.status === 'connected' ? 'connected' :
             session.status === 'qr_code' ? 'connecting' :
             session.status === 'scanning' ? 'connecting' : 'disconnected',
      lastSeen: session.lastActivity || session.created_at ?
               new Date(session.lastActivity || session.created_at).toLocaleString() : 'Never',
      qrCode: session.qrCode || session.qr_code,
      isReady: session.isReady || session.is_active || false
    }
    console.log(`📱 formatSessions: ${session.name} - ${session.status} → ${result.status}`)
    return result
  })
  console.log('✅ formatSessions: Output sessions:', formatted)
  return formatted
}

// Update global sessions and notify all listeners
export const updateGlobalSessions = (newSessions: WhatsAppSession[]) => {
  console.log('🔄 useSharedSessions: Updating global sessions:', newSessions.length)
  globalSessions = newSessions
  const formatted = formatSessions(newSessions)
  console.log('✅ useSharedSessions: Formatted sessions:', formatted)
  notifyListeners(formatted)
}

// Fetch sessions from API
const fetchSessions = async (): Promise<WhatsAppSession[]> => {
  try {
    console.log('📡 useSharedSessions: Fetching sessions from API...')
    const response = await fetch('/api/whatsapp/sessions')
    const data = await response.json()

    if (data.success && data.sessions) {
      console.log('✅ useSharedSessions: API response:', data.sessions.length, 'sessions')
      return data.sessions
    } else {
      console.log('⚠️ useSharedSessions: API failed, using fallback')
      return []
    }
  } catch (error) {
    console.error('❌ useSharedSessions: API error:', error)
    return []
  }
}

// Hook for components to use shared sessions
export const useSharedSessions = () => {
  const [sessions, setSessions] = useState<FormattedSession[]>([])
  const [loading, setLoading] = useState(true)

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const rawSessions = await fetchSessions()
      updateGlobalSessions(rawSessions)
    } catch (error) {
      console.error('❌ useSharedSessions: Load error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Subscribe to global session changes
  useEffect(() => {
    console.log('🔗 useSharedSessions: Component subscribing to session updates')
    
    // Set initial sessions if available
    if (globalSessions.length > 0) {
      const formatted = formatSessions(globalSessions)
      setSessions(formatted)
      setLoading(false)
    } else {
      // Load sessions if not available
      loadSessions()
    }

    // Add listener for session updates
    const listener = (updatedSessions: FormattedSession[]) => {
      console.log('🔄 useSharedSessions: Received session update:', updatedSessions.length)
      setSessions(updatedSessions)
      setLoading(false)
    }
    
    globalListeners.push(listener)

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 useSharedSessions: Component unsubscribing from session updates')
      const index = globalListeners.indexOf(listener)
      if (index > -1) {
        globalListeners.splice(index, 1)
      }
    }
  }, [loadSessions])

  // Auto-refresh sessions every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 useSharedSessions: Auto-refreshing sessions...')
      loadSessions()
    }, 10000)

    return () => {
      console.log('🧹 useSharedSessions: Cleaning up auto-refresh interval')
      clearInterval(interval)
    }
  }, [loadSessions])

  return {
    sessions,
    loading,
    refresh: loadSessions,
    updateSessions: updateGlobalSessions
  }
}

export default useSharedSessions
