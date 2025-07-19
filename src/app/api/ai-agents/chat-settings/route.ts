import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

// GET - Get chat-level AI agent settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const contactNumber = searchParams.get('contact_number')
    
    console.log('🤖 Getting chat agent settings:', { sessionId, contactNumber })
    
    if (!sessionId || !contactNumber) {
      return NextResponse.json({
        success: false,
        error: 'Session ID and Contact Number are required'
      }, { status: 400 })
    }
    
    const settings = DatabaseService.getChatAgentSettings(sessionId, contactNumber)
    
    console.log('✅ Retrieved chat agent settings')
    
    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('❌ Error getting chat agent settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get chat agent settings'
    }, { status: 500 })
  }
}

// POST - Set chat-level AI agent settings
export async function POST(request: NextRequest) {
  try {
    const { sessionId, contactNumber, ...settings } = await request.json()
    
    console.log('🤖 Setting chat agent settings:', { sessionId, contactNumber, settings })
    
    if (!sessionId || !contactNumber) {
      return NextResponse.json({
        success: false,
        error: 'Session ID and Contact Number are required'
      }, { status: 400 })
    }
    
    const chatSettings = DatabaseService.setChatAgentSettings(sessionId, contactNumber, settings)
    
    console.log('✅ Chat agent settings updated successfully')
    
    return NextResponse.json({
      success: true,
      settings: chatSettings
    })
  } catch (error) {
    console.error('❌ Error setting chat agent settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to set chat agent settings'
    }, { status: 500 })
  }
}

// PUT - Toggle chat-level AI agent status
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, contactNumber, isEnabled, agentId } = await request.json()
    
    console.log('🤖 Toggling chat agent status:', { sessionId, contactNumber, isEnabled, agentId })
    
    if (!sessionId || !contactNumber || typeof isEnabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Session ID, Contact Number, and isEnabled status are required'
      }, { status: 400 })
    }
    
    let settings
    
    if (agentId) {
      // Assign specific agent to chat
      settings = DatabaseService.assignAgentToChat(sessionId, contactNumber, agentId)
    } else {
      // Just toggle the status
      settings = DatabaseService.toggleChatAgentStatus(sessionId, contactNumber, isEnabled)
    }
    
    console.log('✅ Chat agent status toggled successfully')
    
    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('❌ Error toggling chat agent status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle chat agent status'
    }, { status: 500 })
  }
}
