import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json()
    
    console.log('💾 Saving message to database:', messageData)
    
    const dbService = new ServerDatabaseService()
    const savedMessage = await dbService.saveMessage({
      session_id: messageData.session_id,
      whatsapp_message_id: messageData.whatsapp_message_id,
      from_number: messageData.from_number,
      to_number: messageData.to_number,
      body: messageData.body,
      message_type: messageData.message_type || 'text',
      is_group_message: messageData.is_group_message || false, // Keep as boolean for PostgreSQL
      author: messageData.author || null,
      timestamp: parseInt(messageData.timestamp) || Date.now()
    })
    
    console.log('✅ Message saved successfully:', savedMessage.id)
    
    return NextResponse.json({
      success: true,
      message: savedMessage
    })
  } catch (error) {
    console.error('❌ Error saving message:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const contactNumber = searchParams.get('contact_number')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    const dbService = new ServerDatabaseService()
    let messages
    if (contactNumber) {
      console.log('📨 Getting messages for contact:', contactNumber)
      messages = await dbService.getChatMessages(sessionId, contactNumber)
    } else {
      console.log('📨 Getting all messages for session:', sessionId)
      messages = await dbService.getMessages(sessionId)
    }
    
    console.log('✅ Retrieved messages:', messages.length)
    
    return NextResponse.json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('❌ Error getting messages:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
