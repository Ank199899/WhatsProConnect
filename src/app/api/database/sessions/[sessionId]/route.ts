import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'
import Database from 'better-sqlite3'
import path from 'path'

interface RouteParams {
  params: Promise<{
    sessionId: string
  }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params

    console.log('🗑️ Deleting session from database:', sessionId)

    // Use DatabaseService instead of direct database connection
    const success = DatabaseService.deleteSession(sessionId)

    if (success) {
      console.log('✅ Session deleted successfully from database')
      return NextResponse.json({
        success: true,
        message: 'Session deleted successfully'
      })
    } else {
      console.log('⚠️ Session not found in database:', sessionId)
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }


  } catch (error) {
    console.error('❌ Error deleting session:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params

    console.log('📋 Getting session details:', sessionId)

    const session = DatabaseService.getSession(sessionId)

    if (session) {
      return NextResponse.json({
        success: true,
        session
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('❌ Error getting session:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params
    const updates = await request.json()

    console.log('📝 Updating session:', sessionId, updates)

    const updatedSession = DatabaseService.updateSession(sessionId, updates)

    if (updatedSession) {
      return NextResponse.json({
        success: true,
        session: updatedSession
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('❌ Error updating session:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
