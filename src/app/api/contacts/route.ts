import { NextRequest, NextResponse } from 'next/server'
import DatabaseService from '@/lib/database'

export async function GET() {
  try {
    console.log('👥 Getting all contacts')
    
    const contacts = DatabaseService.getAllContacts()
    
    return NextResponse.json({
      success: true,
      contacts: contacts || []
    })
  } catch (error) {
    console.error('❌ Error getting contacts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json()
    console.log('👥 Creating contact:', contactData)
    
    const contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: contactData.name,
      phone: contactData.phone,
      email: contactData.email || null,
      address: contactData.address || null,
      tags: contactData.tags || [],
      notes: contactData.notes || null,
      lastMessageAt: null,
      messageCount: 0,
      isBlocked: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionId: contactData.sessionId || null,
      profilePicture: contactData.profilePicture || null,
      status: 'active',
      customFields: contactData.customFields || {}
    }
    
    const createdContact = DatabaseService.createContact(contact)
    
    return NextResponse.json({
      success: true,
      contact: createdContact
    })
  } catch (error) {
    console.error('❌ Error creating contact:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const contactId = url.searchParams.get('id')

    if (!contactId) {
      return NextResponse.json({
        success: false,
        error: 'Contact ID is required'
      }, { status: 400 })
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const contactId = url.searchParams.get('id')

    if (!contactId) {
      return NextResponse.json({
        success: false,
        error: 'Contact ID is required'
      }, { status: 400 })
    }

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
