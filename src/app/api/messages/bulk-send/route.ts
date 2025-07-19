import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, contacts, message, delay = 2000 } = await request.json()

    if (!sessionId || !contacts || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: sessionId, contacts, message' },
        { status: 400 }
      )
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Contacts must be a non-empty array' },
        { status: 400 }
      )
    }

    console.log(`📤 API: Starting bulk send to ${contacts.length} contacts via session ${sessionId}`)
    console.log(`📱 Target contacts:`, contacts)
    console.log(`💬 Message:`, message)

    // Get WhatsApp API URL from environment
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001'
    console.log('🔗 Using WhatsApp API URL:', whatsappApiUrl)

    // Send bulk message request to WhatsApp backend
    const response = await fetch(`${whatsappApiUrl}/api/messages/bulk-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        contacts,
        message,
        delay
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ WhatsApp API error:', errorText)
      return NextResponse.json(
        { success: false, message: `WhatsApp API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ WhatsApp API response:', data)

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: data.message,
        data: {
          sessionId,
          contactCount: contacts.length,
          delay
        }
      })
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to start bulk messaging' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Bulk send API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
