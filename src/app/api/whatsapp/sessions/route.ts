import { NextRequest, NextResponse } from 'next/server'
import { addDemoSession, getDemoSessions, removeDemoSession } from '@/lib/sessionStorage'
import { getBackendUrl } from '@/lib/config'
import { setSession, getSessions, type WhatsAppSession } from '@/lib/sessionStore'

// Real WhatsApp sessions storage (in production this would be in database)
let realSessions: any[] = []

// Function to get real sessions from WhatsApp backend
async function getRealWhatsAppSessions() {
  const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
  try {
    // Try to connect to WhatsApp backend server
    // Use direct URL since config is not working properly in server-side
    console.log('🔗 Connecting to WhatsApp backend:', backendUrl)

    console.log('🔗 Full backend URL:', `${backendUrl}/api/sessions`)
    
    // Test direct connection first
    console.log('🧪 Testing direct connection...')
    const testResponse = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    })
    console.log('🧪 Health check status:', testResponse.status)
    
    const response = await fetch(`${backendUrl}/api/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })

    console.log('📡 Response status:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('📱 Backend response:', data)
      console.log('📱 Response is array:', Array.isArray(data))
      console.log('📱 Response length:', data?.length)

      // Debug: Check individual session status
      if (Array.isArray(data) && data.length > 0) {
        console.log('🔍 First session status:', data[0].status)
        console.log('🔍 First session data:', JSON.stringify(data[0], null, 2))
      }

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
        console.log('🔄 Mapped sessions:', JSON.stringify(realSessions, null, 2))
        return realSessions
      } else if (data.sessions) {
        // Wrapped in sessions property - map the status correctly
        realSessions = data.sessions.map(session => ({
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
        console.log('🔄 Mapped sessions (from data.sessions):', JSON.stringify(realSessions, null, 2))
        return realSessions
      }
    }
  } catch (error) {
    console.log('❌ WhatsApp backend not available:', error.message)
    console.log('❌ Full error:', error)
    console.log('❌ Backend URL was:', backendUrl)
  }

  return realSessions
}



export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching all WhatsApp sessions... [DEBUG MODE]')

    // Direct fetch test
    try {
      const directResponse = await fetch('http://localhost:3006/api/sessions')
      if (directResponse.ok) {
        const directData = await directResponse.json()
        console.log('✅ Direct fetch successful:', directData.length, 'sessions')
        
        const transformedSessions = directData.map((session: any) => {
          const transformedSession: WhatsAppSession = {
            id: session.id,
            sessionId: session.id,
            name: session.name,
            status: session.status === 'ready' ? 'connected' : session.status,
            phoneNumber: session.phoneNumber,
            lastActivity: session.createdAt || new Date().toISOString(),
            messageCount: 0,
            messagesSent: 0,
            qrCode: session.qrCode,
            isReady: session.status === 'ready'
          }

          // Save to shared store
          setSession(transformedSession)
          return transformedSession
        })
        
        return NextResponse.json({
          success: true,
          sessions: transformedSessions,
          timestamp: new Date().toISOString(),
          source: {
            real: transformedSessions.length,
            demo: 0,
            total: transformedSessions.length
          }
        })
      }
    } catch (directError) {
      console.log('❌ Direct fetch failed:', directError.message)
    }

    // Fallback to original method
    const realSessionsList = await getRealWhatsAppSessions()
    const demoSessionsList = getDemoSessions()
    const allSessions = [...realSessionsList, ...demoSessionsList]

    console.log(`📱 Found ${realSessionsList.length} real WhatsApp sessions`)
    console.log(`🎭 Found ${demoSessionsList.length} demo sessions`)
    console.log(`📊 Total sessions: ${allSessions.length}`)

    return NextResponse.json({
      success: true,
      sessions: allSessions,
      timestamp: new Date().toISOString(),
      source: {
        real: realSessionsList.length,
        demo: demoSessionsList.length,
        total: allSessions.length
      }
    })
  } catch (error) {
    console.error('Error fetching WhatsApp sessions:', error)
    console.error('Error details:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
        errorDetails: error.message,
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
    const finalSessionName = sessionName || `WhatsApp Session ${Date.now()}`

    console.log('🆕 Creating new WhatsApp session:', finalSessionName)

    // Try to create session via WhatsApp backend
    try {
      const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
      console.log('🔗 Connecting to backend:', backendUrl)

      const response = await fetch(`${backendUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: finalSessionName }),
        signal: AbortSignal.timeout(30000) // Increased timeout
      })

      console.log('📡 Backend response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Session created via backend:', result)
        return NextResponse.json({
          success: true,
          sessionId: result.sessionId,
          sessionName: finalSessionName,
          message: 'Session created successfully via backend'
        })
      } else {
        console.log('❌ Backend response not ok:', response.status, response.statusText)
      }
    } catch (backendError) {
      console.log('❌ Backend error:', backendError.message)
      console.log('Creating local session as fallback')
    }

    // Fallback: create demo session entry
    const sessionId = `session_${Date.now()}`
    const newSession = addDemoSession({
      sessionId: sessionId,
      sessionName: finalSessionName,
      name: finalSessionName
    })

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Session created successfully (demo mode)'
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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const sessionId = url.pathname.split('/').pop()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting session:', sessionId)

    // Check if it's a demo session
    const isDemoSession = sessionId.startsWith('demo_') || sessionId.startsWith('session_')

    if (isDemoSession) {
      console.log('🎭 Deleting demo session:', sessionId)

      // Remove from demo sessions
      const success = removeDemoSession(sessionId)

      if (success) {
        console.log('✅ Demo session deleted successfully')
        return NextResponse.json({
          success: true,
          message: 'Demo session deleted successfully'
        })
      } else {
        console.log('❌ Demo session not found')
        return NextResponse.json(
          { success: false, message: 'Demo session not found' },
          { status: 404 }
        )
      }
    } else {
      console.log('📱 Deleting real session:', sessionId)

      // Try to delete from WhatsApp backend
      try {
        const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3001'
        console.log('🔗 Connecting to backend:', backendUrl)

        const response = await fetch(`${backendUrl}/api/sessions/${sessionId}`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        console.log('📡 Backend delete response status:', response.status)

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Real session deleted from backend:', result)
          return NextResponse.json({
            success: true,
            message: 'Real session deleted successfully'
          })
        } else {
          console.log('❌ Backend delete failed:', response.status, response.statusText)
          return NextResponse.json(
            { success: false, message: `Backend delete failed: ${response.status}` },
            { status: response.status }
          )
        }
      } catch (backendError) {
        console.log('❌ Backend delete error:', backendError.message)
        return NextResponse.json(
          { success: false, message: `Backend error: ${backendError.message}` },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete session',
        message: error.message
      },
      { status: 500 }
    )
  }
}
