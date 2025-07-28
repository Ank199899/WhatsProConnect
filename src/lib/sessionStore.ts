// Shared session store for WhatsApp sessions
// This allows different API endpoints to access the same session data

export interface WhatsAppSession {
  id: string
  sessionId: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting' | 'ready' | 'pending'
  phoneNumber?: string
  lastActivity: string
  messageCount: number
  messagesSent?: number
  qrCode?: string
  isReady?: boolean
  createdAt?: string
  updatedAt?: string
}

// ⚠️ DEPRECATED: All sessions now stored in cloud database server
class SessionStore {
  private sessions = new Map<string, WhatsAppSession>()

  constructor() {
    console.warn('⚠️ SessionStore is deprecated. All sessions now stored in cloud database server.')
  }

  // Get all sessions
  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values())
  }

  // Get session by ID
  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId)
  }

  // Add or update session
  setSession(session: WhatsAppSession): void {
    this.sessions.set(session.id, {
      ...session,
      updatedAt: new Date().toISOString()
    })
  }

  // Update session status
  updateSessionStatus(sessionId: string, status: WhatsAppSession['status']): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = status
      session.lastActivity = new Date().toISOString()
      session.updatedAt = new Date().toISOString()
      this.sessions.set(sessionId, session)
    }
  }

  // Increment message count
  incrementMessageCount(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.messagesSent = (session.messagesSent || 0) + 1
      session.lastActivity = new Date().toISOString()
      session.updatedAt = new Date().toISOString()
      this.sessions.set(sessionId, session)
    }
  }

  // Remove session
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  // Get connected sessions only
  getConnectedSessions(): WhatsAppSession[] {
    return this.getAllSessions().filter(session => 
      session.status === 'connected' || session.status === 'ready'
    )
  }

  // Clear all sessions
  clearSessions(): void {
    this.sessions.clear()
  }

  // Get session count by status
  getSessionCountByStatus(): Record<string, number> {
    const sessions = this.getAllSessions()
    const counts: Record<string, number> = {}
    
    sessions.forEach(session => {
      counts[session.status] = (counts[session.status] || 0) + 1
    })
    
    return counts
  }
}

// Export singleton instance
export const sessionStore = new SessionStore()

// Helper functions
export const getSessions = () => sessionStore.getAllSessions()
export const getSession = (sessionId: string) => sessionStore.getSession(sessionId)
export const setSession = (session: WhatsAppSession) => sessionStore.setSession(session)
export const updateSessionStatus = (sessionId: string, status: WhatsAppSession['status']) => 
  sessionStore.updateSessionStatus(sessionId, status)
export const incrementMessageCount = (sessionId: string) => 
  sessionStore.incrementMessageCount(sessionId)
export const getConnectedSessions = () => sessionStore.getConnectedSessions()
