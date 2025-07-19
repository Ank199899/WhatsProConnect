import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

// GET - Get all agent-session assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const sessionId = searchParams.get('session_id')
    
    console.log('🤖 Getting agent assignments', { agentId, sessionId })
    
    let assignments = []
    
    if (agentId) {
      // Get sessions for specific agent
      assignments = DatabaseService.getAgentSessions(agentId)
    } else if (sessionId) {
      // Get agents for specific session
      assignments = DatabaseService.getSessionAgents(sessionId)
    } else {
      // Get all assignments - we'll need to create this method
      const agents = DatabaseService.getAllAIAgents()
      assignments = []
      
      for (const agent of agents) {
        const agentSessions = DatabaseService.getAgentSessions(agent.id)
        assignments.push(...agentSessions.map(session => ({
          ...session,
          agentId: agent.id,
          agentName: agent.name
        })))
      }
    }
    
    console.log('✅ Retrieved assignments:', assignments.length)
    
    return NextResponse.json({
      success: true,
      assignments
    })
  } catch (error) {
    console.error('❌ Error getting assignments:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get assignments'
    }, { status: 500 })
  }
}

// POST - Assign agent to session
export async function POST(request: NextRequest) {
  try {
    const { agentId, sessionId, priority } = await request.json()
    
    console.log('🤖 Assigning agent to session:', { agentId, sessionId, priority })
    
    if (!agentId || !sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Agent ID and Session ID are required'
      }, { status: 400 })
    }
    
    const assignment = DatabaseService.assignAgentToSession(agentId, sessionId, priority || 1)
    
    console.log('✅ Agent assigned to session successfully')
    
    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    console.error('❌ Error assigning agent to session:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to assign agent to session'
    }, { status: 500 })
  }
}

// DELETE - Unassign agent from session
export async function DELETE(request: NextRequest) {
  try {
    const { agentId, sessionId } = await request.json()
    
    console.log('🤖 Unassigning agent from session:', { agentId, sessionId })
    
    if (!agentId || !sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Agent ID and Session ID are required'
      }, { status: 400 })
    }
    
    const unassigned = DatabaseService.unassignAgentFromSession(agentId, sessionId)
    
    if (!unassigned) {
      return NextResponse.json({
        success: false,
        error: 'Assignment not found'
      }, { status: 404 })
    }
    
    console.log('✅ Agent unassigned from session successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Agent unassigned from session successfully'
    })
  } catch (error) {
    console.error('❌ Error unassigning agent from session:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to unassign agent from session'
    }, { status: 500 })
  }
}
