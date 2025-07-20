import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: Promise<{
    sessionId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params
    
    console.log('💬 Getting chats for session:', sessionId)
    
    // Get contacts/chats from database
    const contacts = DatabaseService.getContacts(sessionId)
    console.log('✅ Retrieved contacts from database:', contacts.length)
    
    // Get recent messages for each contact to build chat list
    const chats = contacts.map(contact => {
      const messages = DatabaseService.getChatMessages(sessionId, contact.phone_number)
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
      const unreadCount = messages.filter(msg => 
        msg.from_number !== 'me' && !msg.is_read
      ).length
      
      return {
        id: contact.phone_number,
        name: contact.name || contact.phone_number,
        lastMessage: lastMessage?.body || 'No messages yet',
        timestamp: lastMessage?.timestamp || Date.now(),
        unreadCount,
        isGroup: false,
        pinned: false,
        archived: false,
        isMuted: false
      }
    })
    
    // Sort by last message timestamp
    chats.sort((a, b) => b.timestamp - a.timestamp)
    
    console.log('✅ Formatted chats:', chats.length)
    
    return NextResponse.json({
      success: true,
      chats
    })
  } catch (error) {
    console.error('❌ Error getting chats:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      chats: []
    }, { status: 500 })
  }
}
