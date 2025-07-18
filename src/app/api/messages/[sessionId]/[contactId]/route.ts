import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: {
    sessionId: string
    contactId: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId, contactId } = params
    const decodedContactId = decodeURIComponent(contactId)
    
    console.log('📨 Getting messages for session:', sessionId, 'contact:', decodedContactId)
    
    // Get messages from database
    const messages = DatabaseService.getChatMessages(sessionId, decodedContactId)
    
    console.log('✅ Retrieved messages from database:', messages.length)
    
    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.whatsapp_message_id || msg.id,
      from: msg.from_number,
      to: msg.to_number,
      body: msg.body,
      timestamp: msg.timestamp,
      fromMe: msg.from_number === 'me',
      type: msg.message_type
    }))
    
    return NextResponse.json({
      success: true,
      messages: formattedMessages
    })
  } catch (error) {
    console.error('❌ Error getting messages:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: []
    }, { status: 500 })
  }
}
