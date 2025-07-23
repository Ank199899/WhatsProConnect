import { NextRequest, NextResponse } from 'next/server'
import { addDemoSession } from '@/lib/sessionStorage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session name is required' 
        },
        { status: 400 }
      )
    }

    console.log('🆕 Creating session:', name)

    // Try to create session on WhatsApp backend
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3001'
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() })
      })

      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        console.log('✅ Backend session created:', backendData)
        
        return NextResponse.json({
          success: true,
          sessionId: backendData.sessionId,
          sessionName: backendData.sessionName || name,
          message: 'Session created successfully'
        })
      } else {
        console.log('❌ Backend creation failed, status:', backendResponse.status)
      }
    } catch (backendError) {
      console.log('❌ Backend not available:', backendError)
    }

    // Fallback: Create session directly in simulator
    try {
      const simulatorResponse = await fetch(`${backendUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionName: name.trim() })
      })

      if (simulatorResponse.ok) {
        const simulatorData = await simulatorResponse.json()
        console.log('✅ Simulator session created:', simulatorData)
        
        return NextResponse.json({
          success: true,
          sessionId: simulatorData.id || simulatorData.sessionId,
          sessionName: simulatorData.name || name,
          message: 'Session created successfully (simulator mode)'
        })
      }
    } catch (simulatorError) {
      console.log('❌ Simulator creation failed:', simulatorError)
    }

    // Final fallback: Create demo session
    const demoSessionId = `demo_${Date.now()}`
    console.log('🔄 Creating demo session:', demoSessionId)

    // Add to demo sessions list
    const demoSession = addDemoSession({
      sessionId: demoSessionId,
      sessionName: name,
      name: name
    })

    return NextResponse.json({
      success: true,
      sessionId: demoSessionId,
      sessionName: name,
      message: 'Demo session created (backend not available)',
      session: demoSession
    })

  } catch (error) {
    console.error('❌ Session creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
