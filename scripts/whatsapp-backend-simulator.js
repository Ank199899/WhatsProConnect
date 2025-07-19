#!/usr/bin/env node

/**
 * WhatsApp Backend Simulator
 * Simulates a real WhatsApp backend server for testing
 */

const express = require('express')
const cors = require('cors')
const app = express()
const PORT = 3001

// Enable CORS and JSON parsing
app.use(cors())
app.use(express.json())

// In-memory sessions storage
let sessions = []

// Simulate some real sessions
const createMockSession = (id, name, status = 'connected', phoneNumber = null) => ({
  id: `session_${id}`,
  sessionId: `session_${id}`,
  name,
  status, // connected, scanning, disconnected
  phoneNumber,
  lastActivity: new Date().toISOString(),
  messageCount: Math.floor(Math.random() * 100),
  qrCode: status === 'scanning' ? `qr_code_data_${id}` : null,
  isReady: status === 'connected'
})

// Initialize with some sample sessions
sessions = [
  createMockSession('business', 'Business Account', 'connected', '+919876543210'),
  createMockSession('support', 'Customer Support', 'connected', '+919876543211'),
  createMockSession('sales', 'Sales Team', 'scanning', null)
]

// API Routes

// Get all sessions
app.get('/api/sessions', (req, res) => {
  console.log('📱 GET /api/sessions - Returning', sessions.length, 'sessions')
  
  // Simulate real-time updates
  sessions.forEach(session => {
    if (session.status === 'connected') {
      session.messageCount += Math.floor(Math.random() * 3)
      session.lastActivity = new Date().toISOString()
    }
  })
  
  res.json({
    success: true,
    sessions,
    timestamp: new Date().toISOString()
  })
})

// Create new session
app.post('/api/sessions', (req, res) => {
  const { sessionName } = req.body
  console.log('🆕 POST /api/sessions - Creating session:', sessionName)
  
  const newSession = createMockSession(
    Date.now(),
    sessionName || `Session ${Date.now()}`,
    'scanning'
  )
  
  sessions.push(newSession)
  
  // Simulate QR code generation and eventual connection
  setTimeout(() => {
    const session = sessions.find(s => s.id === newSession.id)
    if (session && session.status === 'scanning') {
      session.status = 'connected'
      session.phoneNumber = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`
      session.qrCode = null
      session.isReady = true
      console.log('✅ Session connected:', session.name, session.phoneNumber)
    }
  }, 10000) // Connect after 10 seconds
  
  res.json({
    success: true,
    session: newSession,
    message: 'Session created successfully'
  })
})

// Delete session
app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params
  console.log('🗑️ DELETE /api/sessions/' + sessionId)
  
  const index = sessions.findIndex(s => s.id === sessionId || s.sessionId === sessionId)
  if (index !== -1) {
    const deleted = sessions.splice(index, 1)[0]
    res.json({
      success: true,
      message: 'Session deleted successfully',
      session: deleted
    })
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    })
  }
})

// Get session QR code
app.get('/api/sessions/:sessionId/qr', (req, res) => {
  const { sessionId } = req.params
  const session = sessions.find(s => s.id === sessionId || s.sessionId === sessionId)
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    })
  }
  
  if (session.status !== 'scanning') {
    return res.status(400).json({
      success: false,
      error: 'Session is not in scanning state'
    })
  }
  
  res.json({
    success: true,
    qrCode: session.qrCode,
    sessionId: session.id
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    sessions: sessions.length
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Backend Simulator running on http://localhost:${PORT}`)
  console.log(`📱 Sessions endpoint: http://localhost:${PORT}/api/sessions`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
  console.log(`📊 Initial sessions: ${sessions.length}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WhatsApp Backend Simulator...')
  process.exit(0)
})
