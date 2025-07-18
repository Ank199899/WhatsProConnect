import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
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
    const whatsappResponse = await fetch(`${process.env.WHATSAPP_API_URL}/api/messages/send-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        to,
        mediaType,
        mediaUrl: `${process.env.NEXT_PUBLIC_APP_URL}${fileUrl}`,
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
