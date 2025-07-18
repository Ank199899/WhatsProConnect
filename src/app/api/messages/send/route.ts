import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, to, message } = await request.json()

    if (!sessionId || !to || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: sessionId, to, message' },
        { status: 400 }
      )
    }

    console.log(`📤 API: Sending message to ${to} via session ${sessionId}`)

    // Get WhatsApp API URL from environment
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001'

    // Send message to WhatsApp backend
    const response = await fetch(`${whatsappApiUrl}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        to,
        message
      }),
    })

    if (!response.ok) {
      console.error(`❌ WhatsApp API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { success: false, message: `WhatsApp API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log(`✅ WhatsApp API response:`, result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to send message' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error in send message API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
