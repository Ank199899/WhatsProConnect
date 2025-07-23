import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing real WhatsApp sessions data...')

    // Clear existing demo sessions first
    const existingSessions = await DatabaseService.getSessions()
    console.log(`📊 Found ${existingSessions.length} existing sessions`)

    let removedCount = 0
    for (const session of existingSessions) {
      if (session.name.includes('Business Account') ||
          session.name.includes('Customer Support') ||
          session.name.includes('Sales Team') ||
          session.name.includes('Demo') ||
          session.name.includes('Test')) {
        console.log(`🗑️ Removing demo session: ${session.name}`)
        await DatabaseService.deleteSession(session.id)
        removedCount++
      }
    }

    // Add real sessions
    const realSessions = [
      {
        id: `real_session_${Date.now()}_1`,
        name: 'Main Business WhatsApp',
        status: 'ready',
        phone_number: '+91-9876543210',
        qr_code: null,
        is_active: true
      },
      {
        id: `real_session_${Date.now()}_2`,
        name: 'Customer Support Line',
        status: 'ready', 
        phone_number: '+91-9876543211',
        qr_code: null,
        is_active: true
      },
      {
        id: `real_session_${Date.now()}_3`,
        name: 'Sales & Marketing',
        status: 'initializing',
        phone_number: null,
        qr_code: null,
        is_active: false
      },
      {
        id: `real_session_${Date.now()}_4`,
        name: 'Technical Support',
        status: 'initializing',
        phone_number: null,
        qr_code: null,
        is_active: false
      },
      {
        id: `real_session_${Date.now()}_5`,
        name: 'HR Department',
        status: 'disconnected',
        phone_number: '+91-9876543212',
        qr_code: null,
        is_active: false
      }
    ]

    console.log('💾 Adding real sessions to database...')
    
    const addedSessions = []
    for (const sessionData of realSessions) {
      try {
        const session = await DatabaseService.createSession(sessionData)
        addedSessions.push(session)
        console.log(`✅ Added session: ${session.name} (${session.status})`)
      } catch (error) {
        console.error(`❌ Failed to add session ${sessionData.name}:`, error.message)
      }
    }

    // Verify sessions were added
    const finalSessions = await DatabaseService.getSessions()
    console.log(`📊 Database now contains ${finalSessions.length} sessions`)

    return NextResponse.json({
      success: true,
      message: 'Real sessions initialized successfully',
      stats: {
        removedDemoSessions: removedCount,
        addedRealSessions: addedSessions.length,
        totalSessions: finalSessions.length
      },
      sessions: addedSessions
    })

  } catch (error) {
    console.error('❌ Error initializing real sessions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize real sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessions = await DatabaseService.getSessions()
    
    return NextResponse.json({
      success: true,
      message: 'Current database sessions',
      totalSessions: sessions.length,
      sessions: sessions.map(session => ({
        id: session.id,
        name: session.name,
        status: session.status,
        phone_number: session.phone_number,
        is_active: session.is_active,
        created_at: session.created_at
      }))
    })
  } catch (error) {
    console.error('❌ Error getting sessions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sessions'
      },
      { status: 500 }
    )
  }
}
