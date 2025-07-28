import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const contactId = searchParams.get('contactId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    let messages
    if (contactId) {
      // Get messages for specific contact
      messages = DatabaseService.getChatMessages(sessionId, contactId)
      console.log(`📊 Debug: Found ${messages.length} messages for ${contactId} in session ${sessionId}`)
    } else {
      // Get all messages for session
      messages = DatabaseService.getMessages(sessionId, 100)
      console.log(`📊 Debug: Found ${messages.length} total messages in session ${sessionId}`)
    }

    return NextResponse.json({
      success: true,
      sessionId,
      contactId,
      messageCount: messages.length,
      messages: messages.slice(0, 10), // Return first 10 for debugging
      allMessages: messages // Return all for debugging
    })

  } catch (error) {
    console.error('❌ Debug API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error && typeof error === 'object' && 'message' in error) ? (error as Error).message : 'Unknown error' },
      { status: 500 }
    )
  }
}
