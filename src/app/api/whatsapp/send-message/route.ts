import { NextRequest, NextResponse } from 'next/server'
import { getSession, incrementMessageCount } from '@/lib/sessionStore'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, phoneNumber, message } = await request.json()

    console.log('📤 Send Message Request:', {
      sessionId,
      phoneNumber,
      message: message?.substring(0, 50) + '...'
    })

    // Validate input
    if (!sessionId || !phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sessionId, phoneNumber, message'
      }, { status: 400 })
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number format'
      }, { status: 400 })
    }

    // Format phone number for WhatsApp (add country code if missing)
    let formattedPhone = cleanPhone
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone
    }

    // Check if session exists and is connected
    const sessionData = getSession(sessionId)
    if (!sessionData || (sessionData.status !== 'connected' && sessionData.status !== 'ready')) {
      console.log('❌ Session not found or not connected:', sessionId)
      return NextResponse.json({
        success: false,
        error: 'Session not found or not connected'
      }, { status: 404 })
    }

    // Send message via real WhatsApp backend API
    console.log(`🚀 Sending message to ${formattedPhone} via session ${sessionId}`)
    console.log(`📝 Message: ${message}`)

    try {
      // Call real WhatsApp backend API
      const backendUrl = `http://localhost:3006/api/messages/send`
      console.log(`🌐 Backend URL: ${backendUrl}`)

      const backendPayload = {
        sessionId: sessionId,
        to: formattedPhone,
        message: message
      }

      console.log(`📤 Backend payload:`, backendPayload)

      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload)
      })

      const backendResult = await backendResponse.json()
      console.log(`📥 Backend response:`, backendResult)

      if (backendResponse.ok && backendResult.success) {
        console.log(`✅ Message sent successfully to ${formattedPhone}`)

        // Update session stats
        incrementMessageCount(sessionId)

        return NextResponse.json({
          success: true,
          messageId: backendResult.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          phoneNumber: formattedPhone,
          timestamp: new Date().toISOString(),
          backendResponse: backendResult
        })
      } else {
        console.log(`❌ Backend failed to send message:`, backendResult)
        return NextResponse.json({
          success: false,
          error: backendResult.error || 'Failed to send message via WhatsApp backend',
          backendResponse: backendResult
        }, { status: 500 })
      }
    } catch (error) {
      console.error(`💥 Error calling WhatsApp backend:`, error)
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to WhatsApp backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Send message error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET method to check API status
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'send-message',
    description: 'WhatsApp message sending API',
    timestamp: new Date().toISOString()
  })
}
