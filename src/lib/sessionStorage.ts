// Session storage for demo and real sessions
export interface SessionData {
  id: string
  sessionId: string
  name: string
  status: string
  phoneNumber?: string | null
  lastActivity: string
  messageCount: number
  qrCode?: string | null
  isReady: boolean
  isDemo?: boolean
}

// ⚠️ DEPRECATED: All sessions now stored in cloud database server
declare global {
  var demoSessionsStorage: SessionData[] | undefined
}

// Initialize global storage if not exists
if (!global.demoSessionsStorage) {
  global.demoSessionsStorage = []
}

const demoSessions = global.demoSessionsStorage

console.warn('⚠️ Demo session storage is deprecated. All sessions now stored in cloud database server.')

// Function to add demo session
export function addDemoSession(sessionData: any): SessionData {
  const demoSession: SessionData = {
    id: sessionData.sessionId || `demo_${Date.now()}`,
    sessionId: sessionData.sessionId || `demo_${Date.now()}`,
    name: sessionData.sessionName || sessionData.name || 'Demo Session',
    status: 'qr_code',
    phoneNumber: null,
    lastActivity: new Date().toISOString(),
    messageCount: 0,
    qrCode: `demo_qr_${Date.now()}`,
    isReady: false,
    isDemo: true
  }
  
  demoSessions.push(demoSession)
  console.log('✅ Demo session added to storage:', demoSession.name)
  console.log('📊 Total demo sessions:', demoSessions.length)
  return demoSession
}

// Function to get all demo sessions
export function getDemoSessions(): SessionData[] {
  console.log('📋 Getting demo sessions, count:', demoSessions.length)
  return demoSessions
}

// Function to remove demo session
export function removeDemoSession(sessionId: string): boolean {
  const initialLength = demoSessions.length
  const filteredSessions = demoSessions.filter(session => session.id !== sessionId && session.sessionId !== sessionId)

  // Clear and repopulate array
  demoSessions.length = 0
  demoSessions.push(...filteredSessions)
  global.demoSessionsStorage = demoSessions

  const removed = demoSessions.length < initialLength
  if (removed) {
    console.log('🗑️ Demo session removed:', sessionId)
    console.log('📊 Remaining demo sessions:', demoSessions.length)
  }
  return removed
}

// Function to clear all demo sessions
export function clearDemoSessions(): void {
  demoSessions.length = 0
  global.demoSessionsStorage = []
  console.log('🧹 All demo sessions cleared')
}
