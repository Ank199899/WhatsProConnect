import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, force = false } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    console.log('🔄 Starting contact sync for session:', sessionId)
    
    // Get WhatsApp client for this session
    const response = await fetch(`http://localhost:3006/api/sessions/${sessionId}/contacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch contacts from WhatsApp: ${response.statusText}`)
    }

    const whatsappData = await response.json()
    
    if (!whatsappData.success) {
      throw new Error(whatsappData.error || 'Failed to get WhatsApp contacts')
    }

    const whatsappContacts = whatsappData.contacts || []
    console.log(`📞 Found ${whatsappContacts.length} WhatsApp contacts`)

    // Save contacts to database
    const dbService = new ServerDatabaseService()
    const savedContacts = []

    for (const contact of whatsappContacts) {
      try {
        const savedContact = await dbService.saveContact({
          session_id: sessionId,
          whatsapp_id: contact.id || contact.phone,
          name: contact.name || contact.pushname || contact.phone,
          phone_number: contact.phone,
          is_group: contact.isGroup || false,
          profile_pic_url: contact.profilePicUrl || null
        })
        
        savedContacts.push({
          id: savedContact.id,
          name: savedContact.name,
          phone: savedContact.phone_number,
          email: null,
          address: null,
          tags: [],
          notes: null,
          lastMessageAt: null,
          messageCount: 0,
          isBlocked: false,
          isFavorite: false,
          createdAt: savedContact.created_at,
          updatedAt: savedContact.updated_at,
          sessionId: savedContact.session_id,
          profilePicture: savedContact.profile_pic_url,
          status: 'active',
          customFields: {},
          groupId: null,
          isOnline: contact.isOnline || false,
          lastSeen: contact.lastSeen || null,
          country: null,
          city: null,
          company: null,
          jobTitle: null,
          website: null
        })
      } catch (error) {
        console.error('Error saving contact:', contact.phone, error)
      }
    }

    console.log(`✅ Synced ${savedContacts.length} contacts successfully`)

    return NextResponse.json({
      success: true,
      message: `Synced ${savedContacts.length} contacts`,
      contacts: savedContacts,
      stats: {
        total: whatsappContacts.length,
        synced: savedContacts.length,
        failed: whatsappContacts.length - savedContacts.length
      }
    })

  } catch (error) {
    console.error('❌ Error syncing contacts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }

    console.log('📋 Getting synced contacts for session:', sessionId)
    
    const dbService = new ServerDatabaseService()
    const contacts = await dbService.getContacts(sessionId)
    
    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone_number,
      email: null,
      address: null,
      tags: [],
      notes: null,
      lastMessageAt: null,
      messageCount: 0,
      isBlocked: false,
      isFavorite: false,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
      sessionId: contact.session_id,
      profilePicture: contact.profile_pic_url,
      status: 'active',
      customFields: {},
      groupId: null,
      isOnline: false,
      lastSeen: null,
      country: null,
      city: null,
      company: null,
      jobTitle: null,
      website: null
    }))

    return NextResponse.json({
      success: true,
      contacts: formattedContacts
    })

  } catch (error) {
    console.error('❌ Error getting synced contacts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
