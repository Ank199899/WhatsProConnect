import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    console.log('🔌 Connecting session:', sessionId)

    // Forward request to WhatsApp backend server
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
    
    const response = await fetch(`${backendUrl}/api/sessions/${sessionId}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ Backend connection failed:', response.status, response.statusText)
      return NextResponse.json(
        { success: false, error: 'Failed to connect to backend' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ Session connection result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error connecting session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
