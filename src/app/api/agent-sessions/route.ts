import { NextRequest, NextResponse } from 'next/server'

// Real agent sessions storage (in production this would be in database)
let agentSessions: any[] = []

// Function to get real WhatsApp sessions for agent assignment
async function getAvailableWhatsAppSessions() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3005'}/api/whatsapp/sessions`)
    if (response.ok) {
      const data = await response.json()
      return data.sessions || []
    }
  } catch (error) {
    console.log('Could not fetch WhatsApp sessions for agent assignment')
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    // Get real WhatsApp sessions for assignment
    const whatsappSessions = await getAvailableWhatsAppSessions()

    // Filter only connected sessions that can be assigned
    const availableSessions = whatsappSessions
      .filter((session: any) => session.status === 'connected' || session.status === 'ready')
      .map((session: any) => ({
        id: session.id,
        name: session.name,
        phoneNumber: session.phoneNumber || session.phone_number,
        status: session.status,
        lastActivity: session.lastActivity || session.created_at,
        messageCount: session.messageCount || 0
      }))

    return NextResponse.json({
      success: true,
      sessions: availableSessions,
      agentSessions: agentSessions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching agent sessions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch agent sessions',
        sessions: [],
        agentSessions: []
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, sessionId, sessionName } = body

    // Check if assignment already exists
    const existingAssignment = agentSessions.find(
      as => as.agentId === agentId && as.sessionId === sessionId
    )

    if (existingAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agent already assigned to this session'
        },
        { status: 400 }
      )
    }

    // Create new assignment
    const newAssignment = {
      id: `assignment_${Date.now()}`,
      agentId,
      sessionId,
      sessionName: sessionName || `Session ${sessionId}`,
      isActive: true,
      assignedAt: new Date().toISOString(),
      messageCount: 0,
      lastActivity: new Date().toISOString(),
      status: 'connected'
    }

    agentSessions.push(newAssignment)

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: 'Agent assigned to session successfully'
    })
  } catch (error) {
    console.error('Error assigning agent to session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign agent to session'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Assignment ID is required'
        },
        { status: 400 }
      )
    }

    // Remove assignment
    agentSessions = agentSessions.filter(session => session.id !== assignmentId)

    return NextResponse.json({
      success: true,
      message: 'Agent removed from session successfully'
    })
  } catch (error) {
    console.error('Error removing agent from session:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove agent from session'
      },
      { status: 500 }
    )
  }
}
