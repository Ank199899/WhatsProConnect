import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

export async function GET() {
  try {
    console.log('👥 Getting all contacts from database server')

    const dbService = new ServerDatabaseService()
    const contacts = await dbService.getAllContacts()

    console.log(`📋 Retrieved ${contacts.length} contacts from database`)

    return NextResponse.json({
      success: true,
      contacts: contacts || []
    })
  } catch (error) {
    console.error('❌ Error getting contacts from database:', error)
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
      customFields: contactData.customFields || {},
      groupId: contactData.groupId || null,
      country: contactData.country || null,
      city: contactData.city || null,
      company: contactData.company || null,
      jobTitle: contactData.jobTitle || null,
      website: contactData.website || null
    }

    console.log('💾 Saving contact to database server:', contact)

    const dbService = new ServerDatabaseService()
    const createdContact = await dbService.saveContact({
      session_id: contact.sessionId,
      whatsapp_id: contact.phone,
      name: contact.name,
      phone_number: contact.phone,
      is_group: false,
      profile_pic_url: contact.profilePicture
    })
    
    // Convert database format to frontend format
    const frontendContact = {
      id: createdContact.id,
      name: createdContact.name,
      phone: createdContact.phone_number,
      email: contact.email,
      address: contact.address,
      tags: contact.tags,
      notes: contact.notes,
      lastMessageAt: null,
      messageCount: 0,
      isBlocked: false,
      isFavorite: false,
      createdAt: createdContact.created_at,
      updatedAt: createdContact.updated_at,
      sessionId: createdContact.session_id,
      profilePicture: createdContact.profile_pic_url,
      status: 'active',
      customFields: contact.customFields,
      groupId: contact.groupId,
      country: contact.country,
      city: contact.city,
      company: contact.company,
      jobTitle: contact.jobTitle,
      website: contact.website
    }

    return NextResponse.json({
      success: true,
      contact: frontendContact
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
    console.log('📝 Updating contact in database:', contactId, 'with data:', updateData)

    const dbService = new ServerDatabaseService()

    // Update contact in database
    const updatedContact = await dbService.saveContact({
      id: contactId,
      session_id: updateData.sessionId,
      whatsapp_id: updateData.phone,
      name: updateData.name,
      phone_number: updateData.phone,
      is_group: false,
      profile_pic_url: updateData.profilePicture
    })

    if (updatedContact) {
      // Convert to frontend format
      const frontendContact = {
        id: updatedContact.id,
        name: updatedContact.name,
        phone: updatedContact.phone_number,
        email: updateData.email,
        address: updateData.address,
        tags: updateData.tags,
        notes: updateData.notes,
        lastMessageAt: updateData.lastMessageAt,
        messageCount: updateData.messageCount || 0,
        isBlocked: updateData.isBlocked || false,
        isFavorite: updateData.isFavorite || false,
        createdAt: updatedContact.created_at,
        updatedAt: updatedContact.updated_at,
        sessionId: updatedContact.session_id,
        profilePicture: updatedContact.profile_pic_url,
        status: updateData.status || 'active',
        customFields: updateData.customFields || {},
        groupId: updateData.groupId,
        country: updateData.country,
        city: updateData.city,
        company: updateData.company,
        jobTitle: updateData.jobTitle,
        website: updateData.website
      }

      return NextResponse.json({
        success: true,
        contact: frontendContact
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

    console.log('🗑️ Deleting contact from database:', contactId)

    const dbService = new ServerDatabaseService()
    const deleted = await dbService.deleteContact(contactId)

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
