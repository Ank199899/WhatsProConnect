import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params
    const updateData = await request.json()
    
    console.log('📝 Updating contact:', contactId, 'with data:', updateData)

    const updatedContact = DatabaseService.updateContact(contactId, updateData)

    if (updatedContact) {
      return NextResponse.json({
        success: true,
        contact: updatedContact
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Contact not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('❌ Error updating contact:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id
    
    console.log('🗑️ Deleting contact:', contactId)

    const deleted = DatabaseService.deleteContact(contactId)

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Contact deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Contact not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('❌ Error deleting contact:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
