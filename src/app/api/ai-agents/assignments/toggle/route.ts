import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

// PUT - Toggle agent-session assignment status
export async function PUT(request: NextRequest) {
  try {
    const { agentId, sessionId, isEnabled } = await request.json()
    
    console.log('🤖 Toggling agent-session status:', { agentId, sessionId, isEnabled })
    
    if (!agentId || !sessionId || typeof isEnabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Agent ID, Session ID, and isEnabled status are required'
      }, { status: 400 })
    }
    
    const assignment = DatabaseService.toggleAgentSessionStatus(agentId, sessionId, isEnabled)
    
    if (!assignment) {
      return NextResponse.json({
        success: false,
        error: 'Assignment not found'
      }, { status: 404 })
    }
    
    console.log('✅ Agent-session status toggled successfully')
    
    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    console.error('❌ Error toggling agent-session status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle agent-session status'
    }, { status: 500 })
  }
}
