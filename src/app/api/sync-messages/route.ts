import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting message sync process...')
    
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    const dbService = new ServerDatabaseService()
    
    // Get session details
    const session = await dbService.getSession(sessionId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }

    console.log('📱 Syncing messages for session:', session.name)

    // For now, create some sample messages to demonstrate the sync
    // In a real implementation, this would connect to WhatsApp Web API
    const sampleMessages = [
      {
        id: `msg_${Date.now()}_1`,
        session_id: sessionId,
        contact_id: 'contact_sample_1',
        whatsapp_message_id: `wa_${Date.now()}_1`,
        type: 'text',
        content: 'Hello! This is a sample message to demonstrate sync.',
        is_from_me: false,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'delivered'
      },
      {
        id: `msg_${Date.now()}_2`,
        session_id: sessionId,
        contact_id: 'contact_sample_1',
        whatsapp_message_id: `wa_${Date.now()}_2`,
        type: 'text',
        content: 'Thank you for your message! How can I help you today?',
        is_from_me: true,
        timestamp: new Date(Date.now() - 3500000), // 58 minutes ago
        status: 'sent'
      },
      {
        id: `msg_${Date.now()}_3`,
        session_id: sessionId,
        contact_id: 'contact_sample_1',
        whatsapp_message_id: `wa_${Date.now()}_3`,
        type: 'text',
        content: 'I need help with my order status.',
        is_from_me: false,
        timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
        status: 'delivered'
      }
    ]

    // Create sample contact if it doesn't exist
    const contacts = await dbService.getContacts(sessionId)
    let sampleContact = contacts.find(c => c.id === 'contact_sample_1')
    
    if (!sampleContact) {
      sampleContact = {
        id: 'contact_sample_1',
        session_id: sessionId,
        whatsapp_id: '919876543210',
        name: 'Sample Customer',
        phone_number: '919876543210',
        is_group: false,
        profile_pic_url: null,
        last_seen: null
      }
      
      await dbService.saveContact(sampleContact)
      console.log('👤 Created sample contact:', sampleContact.name)
    }

    // Save sample messages
    let savedMessages = 0
    for (const message of sampleMessages) {
      try {
        // Check if message already exists
        const existingMessages = await dbService.getMessages(sessionId)
        const exists = existingMessages.find(m => m.whatsapp_message_id === message.whatsapp_message_id)
        
        if (!exists) {
          await dbService.saveMessage(message)
          savedMessages++
          console.log('💬 Saved message:', message.content.substring(0, 50) + '...')
        }
      } catch (error) {
        console.error('❌ Error saving message:', error)
      }
    }

    // Get updated message count
    const allMessages = await dbService.getMessages(sessionId)
    
    console.log('✅ Message sync completed')
    console.log(`📊 Total messages in database: ${allMessages.length}`)
    console.log(`📝 New messages saved: ${savedMessages}`)

    return NextResponse.json({
      success: true,
      message: 'Messages synced successfully',
      stats: {
        totalMessages: allMessages.length,
        newMessages: savedMessages,
        sessionId: sessionId,
        sessionName: session.name
      }
    })

  } catch (error) {
    console.error('❌ Error syncing messages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    const dbService = new ServerDatabaseService()
    
    // Get current message count
    const messages = await dbService.getMessages(sessionId)
    const contacts = await dbService.getContacts(sessionId)
    
    return NextResponse.json({
      success: true,
      stats: {
        totalMessages: messages.length,
        totalContacts: contacts.length,
        sessionId: sessionId,
        lastSync: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error getting sync status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status'
      },
      { status: 500 }
    )
  }
}
