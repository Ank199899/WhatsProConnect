import { NextRequest, NextResponse } from 'next/server'
import { ServerDatabaseService } from '@/lib/database-server'

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json()
    
    console.log('👤 Saving contact to database:', contactData)
    
    const dbService = new ServerDatabaseService()
    const savedContact = await dbService.saveContact({
      session_id: contactData.session_id,
      whatsapp_id: contactData.whatsapp_id || contactData.phone_number,
      name: contactData.name,
      phone_number: contactData.phone_number,
      is_group: contactData.is_group || false,
      profile_pic_url: contactData.profile_pic_url || null
    })
    
    console.log('✅ Contact saved successfully:', savedContact.id)
    
    return NextResponse.json({
      success: true,
      contact: savedContact
    })
  } catch (error) {
    console.error('❌ Error saving contact:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 })
    }
    
    console.log('👥 Getting contacts for session:', sessionId)
    const dbService = new ServerDatabaseService()
    const contacts = await dbService.getContacts(sessionId)
    
    console.log('✅ Retrieved contacts:', contacts.length)
    
    return NextResponse.json({
      success: true,
      contacts
    })
  } catch (error) {
    console.error('❌ Error getting contacts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
