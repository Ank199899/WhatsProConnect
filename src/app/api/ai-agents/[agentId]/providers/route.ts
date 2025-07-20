import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

interface RouteParams {
  params: Promise<{
    agentId: string
  }>
}

// GET - Get AI providers assigned to agent
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { agentId } = await params
    
    console.log('🤖 Getting providers for agent:', agentId)
    
    const providers = DatabaseService.getAgentProviders(agentId)
    
    console.log('✅ Retrieved agent providers:', providers.length)
    
    return NextResponse.json({
      success: true,
      providers
    })
  } catch (error) {
    console.error('❌ Error getting agent providers:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get agent providers'
    }, { status: 500 })
  }
}

// POST - Assign provider to agent
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { agentId } = await params
    const { providerId, modelName, priority = 1 } = await request.json()
    
    console.log('🤖 Assigning provider to agent:', { agentId, providerId, modelName })
    
    if (!providerId || !modelName) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID and model name are required'
      }, { status: 400 })
    }
    
    const assignment = DatabaseService.assignProviderToAgent(
      agentId,
      providerId,
      modelName,
      priority
    )
    
    console.log('✅ Provider assigned to agent successfully')
    
    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    console.error('❌ Error assigning provider to agent:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to assign provider to agent'
    }, { status: 500 })
  }
}

// DELETE - Unassign provider from agent
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { agentId } = await params
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    
    console.log('🤖 Unassigning provider from agent:', { agentId, providerId })
    
    if (!providerId) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID is required'
      }, { status: 400 })
    }
    
    const deleted = DatabaseService.unassignProviderFromAgent(agentId, providerId)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Provider assignment not found'
      }, { status: 404 })
    }
    
    console.log('✅ Provider unassigned from agent successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Provider unassigned successfully'
    })
  } catch (error) {
    console.error('❌ Error unassigning provider from agent:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to unassign provider from agent'
    }, { status: 500 })
  }
}
