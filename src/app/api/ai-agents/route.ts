import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

// GET - Get all AI agents
export async function GET(request: NextRequest) {
  try {
    console.log('🤖 Getting all AI agents')

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('include_stats') === 'true'

    let agents = DatabaseService.getAllAIAgents() || []

    // Add provider information and stats if requested
    if (includeStats && Array.isArray(agents)) {
      agents = agents.map(agent => {
        // Get assigned providers
        const providers = DatabaseService.getAgentProviders(agent.id)

        // Get agent stats
        const stats = DatabaseService.getAIAgentAnalytics(agent.id)
        const totalResponses = stats.reduce((sum: number, stat: any) => sum + (stat.total_responses || 0), 0)
        const avgResponseTime = stats.length > 0
          ? Math.round(stats.reduce((sum: number, stat: any) => sum + (stat.avg_response_time || 0), 0) / stats.length)
          : 0
        const avgConfidence = stats.length > 0
          ? Math.round(stats.reduce((sum: number, stat: any) => sum + (stat.avg_confidence || 0), 0) / stats.length * 100) / 100
          : 0

        return {
          ...agent,
          providers: providers.map(p => ({
            id: p.id,
            providerId: p.provider_id,
            providerName: p.provider_name,
            modelName: p.model_name,
            priority: p.priority,
            isActive: p.is_active,
            fallbackEnabled: p.fallback_enabled
          })),
          stats: {
            totalResponses,
            avgResponseTime,
            avgConfidence,
            successRate: totalResponses > 0 ? Math.round((totalResponses / (totalResponses + 1)) * 100) : 0,
            lastUsed: stats.length > 0 ? stats[0].response_date : null
          }
        }
      })
    }

    console.log('✅ Retrieved AI agents:', agents.length)

    return NextResponse.json({
      success: true,
      agents
    })
  } catch (error) {
    console.error('❌ Error getting AI agents:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI agents'
    }, { status: 500 })
  }
}

// POST - Create new AI agent
export async function POST(request: NextRequest) {
  try {
    const agentData = await request.json()
    
    console.log('🤖 Creating AI agent:', agentData.name)
    
    // Generate ID for the agent
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newAgent = DatabaseService.createAIAgent({
      id: agentId,
      name: agentData.name,
      description: agentData.description || '',
      personality: agentData.personality || 'helpful',
      language: agentData.language || 'hi',
      responseStyle: agentData.responseStyle || 'professional',
      autoReplyEnabled: agentData.autoReplyEnabled !== false,
      responseDelayMin: agentData.responseDelayMin || 1,
      responseDelayMax: agentData.responseDelayMax || 5,
      maxResponseLength: agentData.maxResponseLength || 500,
      keywords: agentData.keywords || [],
      systemPrompt: agentData.systemPrompt || '',
      isActive: agentData.isActive !== false
    })

    // Assign AI provider if specified
    if (agentData.providerId && agentData.modelName) {
      try {
        DatabaseService.assignProviderToAgent(
          agentId,
          agentData.providerId,
          agentData.modelName,
          1 // Default priority
        )
        console.log('✅ AI provider assigned to agent:', agentData.providerId)
      } catch (error) {
        console.error('❌ Error assigning provider to agent:', error)
      }
    }
    
    console.log('✅ AI agent created successfully:', newAgent.id)
    
    return NextResponse.json({
      success: true,
      agent: newAgent
    })
  } catch (error) {
    console.error('❌ Error creating AI agent:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create AI agent'
    }, { status: 500 })
  }
}
