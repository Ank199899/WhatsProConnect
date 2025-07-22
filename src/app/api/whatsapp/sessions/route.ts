import { NextRequest, NextResponse } from 'next/server'

// Real WhatsApp sessions storage (in production this would be in database)
let realSessions: any[] = []

// Function to get real sessions from WhatsApp backend
async function getRealWhatsAppSessions() {
  try {
    // Try to connect to WhatsApp backend server
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
    console.log('🔗 Connecting to WhatsApp backend:', backendUrl)

    const response = await fetch(`${backendUrl}/api/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('📱 Backend response:', data)
      console.log('📱 Response is array:', Array.isArray(data))
      console.log('📱 Response length:', data?.length)

      // Handle different response formats
      if (Array.isArray(data)) {
        // Direct array response
        realSessions = data.map(session => ({
          id: session.id,
          sessionId: session.id,
          name: session.name,
          status: session.status === 'ready' ? 'connected' : session.status,
          phoneNumber: session.phoneNumber,
          lastActivity: session.createdAt || new Date().toISOString(),
          messageCount: 0,
          qrCode: session.qrCode,
          isReady: session.status === 'ready'
        }))
        return realSessions
      } else if (data.sessions) {
        // Wrapped in sessions property
        realSessions = data.sessions
        return data.sessions
      }
    }
  } catch (error) {
    console.log('❌ WhatsApp backend not available:', error.message)
    console.log('❌ Full error:', error)
  }

  return realSessions
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching real WhatsApp sessions...')

    // Get real sessions from WhatsApp backend
    const sessions = await getRealWhatsAppSessions()

    console.log(`📱 Found ${sessions.length} real WhatsApp sessions`)

    return NextResponse.json({
      success: true,
      sessions: sessions,
      timestamp: new Date().toISOString(),
      source: sessions.length > 0 ? 'whatsapp_backend' : 'empty'
    })
  } catch (error) {
    console.error('Error fetching WhatsApp sessions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
        sessions: []
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionName } = body

    console.log('🆕 Creating new WhatsApp session:', sessionName)

    // Try to create session via WhatsApp backend
    try {
      const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
      const response = await fetch(`${backendUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionName }),
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Session created via backend:', result)
        return NextResponse.json(result)
      }
    } catch (backendError) {
      console.log('Backend not available, creating local session')
    }

    // Fallback: create local session entry
    const newSession = {
      id: `session_${Date.now()}`,
      sessionId: `session_${Date.now()}`,
      name: sessionName || `New Session ${Date.now()}`,
      status: 'scanning',
      phoneNumber: null,
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      qrCode: null,
      isReady: false
    }

    realSessions.push(newSession)

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Session created successfully (local)'
    })
  } catch (error) {
    console.error('Error creating WhatsApp session:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create session'
      },
      { status: 500 }
    )
  }
}
