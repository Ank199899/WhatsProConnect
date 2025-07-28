import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    sessionId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params

    console.log('💬 Getting chats for session:', sessionId)

    // Get chats from WhatsApp server instead of database
    const whatsappServerUrl = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3006'
    const response = await fetch(`${whatsappServerUrl}/api/sessions/${sessionId}/chats`)

    if (!response.ok) {
      throw new Error(`WhatsApp server error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Retrieved chats from WhatsApp server:', data.chats?.length || 0)

    if (data.success && data.chats) {
      return NextResponse.json({
        success: true,
        chats: data.chats
      })
    } else {
      console.warn('❌ WhatsApp server returned error:', data.error)
      return NextResponse.json({
        success: false,
        error: data.error || 'Failed to get chats from WhatsApp server',
        chats: []
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error getting chats:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      chats: []
    }, { status: 500 })
  }
}
