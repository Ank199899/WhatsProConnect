import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: Promise<{
    agentId: string
  }>
}

// GET - Get specific AI agent
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { agentId } = await params
    
    console.log('🤖 Getting AI agent:', agentId)
    
    const agent = DatabaseService.getAIAgent(agentId)
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'AI agent not found'
      }, { status: 404 })
    }
    
    console.log('✅ Retrieved AI agent:', agent.name)
    
    return NextResponse.json({
      success: true,
      agent
    })
  } catch (error) {
    console.error('❌ Error getting AI agent:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI agent'
    }, { status: 500 })
  }
}

// PUT - Update AI agent
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { agentId } = await params
    const updates = await request.json()
    
    console.log('🤖 Updating AI agent:', agentId, updates)
    
    const updatedAgent = DatabaseService.updateAIAgent(agentId, updates)
    
    if (!updatedAgent) {
      return NextResponse.json({
        success: false,
        error: 'AI agent not found'
      }, { status: 404 })
    }
    
    console.log('✅ AI agent updated successfully:', updatedAgent.name)
    
    return NextResponse.json({
      success: true,
      agent: updatedAgent
    })
  } catch (error) {
    console.error('❌ Error updating AI agent:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update AI agent'
    }, { status: 500 })
  }
}

// DELETE - Delete AI agent
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { agentId } = await params
    
    console.log('🤖 Deleting AI agent:', agentId)
    
    const deleted = DatabaseService.deleteAIAgent(agentId)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'AI agent not found'
      }, { status: 404 })
    }
    
    console.log('✅ AI agent deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'AI agent deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting AI agent:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete AI agent'
    }, { status: 500 })
  }
}
