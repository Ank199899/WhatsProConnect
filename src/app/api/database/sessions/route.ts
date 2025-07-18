import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET() {
  try {
    const sessions = DatabaseService.getSessions()
    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    console.error('Error getting sessions:', error)
    return NextResponse.json({ success: false, error: 'Failed to get sessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json()
    console.log('📝 Creating session with data:', sessionData)

    const session = DatabaseService.createSession(sessionData)
    console.log('✅ Session created successfully:', session.id)

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('❌ Error creating session:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: `Failed to create session: ${errorMessage}`
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, updates } = await request.json()
    const session = DatabaseService.updateSession(sessionId, updates)
    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ success: false, error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 })
    }
    
    const success = DatabaseService.deleteSession(sessionId)
    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete session' }, { status: 500 })
  }
}
