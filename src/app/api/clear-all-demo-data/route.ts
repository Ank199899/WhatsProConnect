import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

const dbService = new ServerDatabaseService()

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing ALL demo data from system...')

    // Clear demo sessions
    const sessions = await dbService.getAllSessions()
    let removedSessions = 0

    for (const session of sessions) {
      if (session.name.includes('Demo') ||
          session.name.includes('Test') ||
          session.name.includes('Sample') ||
          session.name.includes('Business Account') ||
          session.name.includes('Customer Support') ||
          session.name.includes('Sales Team')) {
        console.log(`🗑️ Removing demo session: ${session.name}`)
        await dbService.deleteSession(session.id)
        removedSessions++
      }
    }

    // Clear demo messages (get all messages from all sessions)
    let removedMessages = 0
    for (const session of sessions) {
      try {
        const messages = await dbService.getMessages(session.id)
        for (const message of messages) {
          // Remove messages with demo content
          if (message.content?.includes('demo') ||
              message.content?.includes('test') ||
              message.content?.includes('sample')) {
            await dbService.deleteMessage(message.id)
            removedMessages++
          }
        }
      } catch (error) {
        console.log(`No messages found for session ${session.id}`)
      }
    }

    // Clear demo contacts
    const contacts = await dbService.getAllContacts()
    let removedContacts = 0

    for (const contact of contacts) {
      if (contact.name?.includes('Demo') ||
          contact.name?.includes('Test') ||
          contact.name?.includes('Sample') ||
          contact.phone_number?.includes('demo')) {
        await dbService.deleteContact(contact.id)
        removedContacts++
      }
    }

    console.log(`✅ Demo data cleanup completed:`)
    console.log(`   - Removed ${removedSessions} demo sessions`)
    console.log(`   - Removed ${removedMessages} demo messages`)
    console.log(`   - Removed ${removedContacts} demo contacts`)

    return NextResponse.json({
      success: true,
      message: 'All demo data cleared successfully',
      stats: {
        removedSessions,
        removedMessages,
        removedContacts,
        totalRemoved: removedSessions + removedMessages + removedContacts
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error clearing demo data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear demo data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current data counts
    const sessions = await dbService.getAllSessions()
    const contacts = await dbService.getAllContacts()

    // Count all messages across all sessions
    let totalMessages = 0
    for (const session of sessions) {
      try {
        const messages = await dbService.getMessages(session.id)
        totalMessages += messages.length
      } catch (error) {
        // Session might not have messages yet
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Current data status',
      stats: {
        totalSessions: sessions.length,
        totalMessages,
        totalContacts: contacts.length,
        realDataOnly: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error getting data status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get data status'
      },
      { status: 500 }
    )
  }
}
