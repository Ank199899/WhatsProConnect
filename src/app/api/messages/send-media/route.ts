import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getFrontendUrl } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')

    // Handle both FormData (file upload) and JSON (template media) requests
    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File
      const sessionId = formData.get('sessionId') as string
      const to = formData.get('to') as string
      const caption = formData.get('caption') as string

      if (!file || !sessionId || !to) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        )
      }

      return handleFileUpload(file, sessionId, to, caption)
    } else {
      // Handle JSON request (template media)
      const { sessionId, to, mediaType, mediaUrl, caption, filename } = await request.json()

      if (!sessionId || !to || !mediaUrl || !mediaType) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields: sessionId, to, mediaUrl, mediaType' },
          { status: 400 }
        )
      }

      return handleTemplateMedia(sessionId, to, mediaType, mediaUrl, caption, filename)
    }
  } catch (error) {
    console.error('❌ Error in send-media API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleFileUpload(file: File, sessionId: string, to: string, caption: string) {
  try {

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const extension = originalName.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get file URL
    const fileUrl = `/uploads/${filename}`

    // Determine media type
    let mediaType = 'document'
    if (file.type.startsWith('image/')) {
      mediaType = 'image'
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video'
    } else if (file.type.startsWith('audio/')) {
      mediaType = 'audio'
    }

    // Send media via WhatsApp API
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001'
    const whatsappResponse = await fetch(`${whatsappApiUrl}/api/messages/send-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        to,
        mediaType,
        mediaUrl: `${getFrontendUrl()}${fileUrl}`,
        caption: caption || '',
        filename: originalName,
        fileSize: file.size
      }),
    })

    const whatsappResult = await whatsappResponse.json()

    if (whatsappResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Media sent successfully',
        mediaUrl: fileUrl,
        mediaType,
        filename: originalName,
        fileSize: file.size
      })
    } else {
      return NextResponse.json(
        { success: false, message: whatsappResult.message || 'Failed to send media' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error sending media:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleTemplateMedia(sessionId: string, to: string, mediaType: string, mediaUrl: string, caption: string, filename: string) {
  try {
    console.log(`📎 Sending template media to ${to}:`, {
      mediaType,
      mediaUrl,
      caption,
      filename
    })

    // Send media via WhatsApp API
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001'
    const whatsappResponse = await fetch(`${whatsappApiUrl}/api/messages/send-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        to,
        mediaType,
        mediaUrl,
        caption: caption || '',
        filename: filename || 'media'
      }),
    })

    const whatsappResult = await whatsappResponse.json()

    if (whatsappResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Template media sent successfully',
        mediaUrl,
        mediaType,
        filename
      })
    } else {
      return NextResponse.json(
        { success: false, message: whatsappResult.message || 'Failed to send template media' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error sending template media:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
