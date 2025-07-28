import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const messageId = searchParams.get('messageId')
    const filename = searchParams.get('filename')
    const mediaUrl = searchParams.get('mediaUrl')

    console.log('📥 Media download request:', {
      sessionId,
      messageId,
      filename,
      mediaUrl
    })

    // If mediaUrl is provided, try to fetch from WhatsApp backend
    if (mediaUrl && sessionId) {
      try {
        const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
        const backendResponse = await fetch(`${backendUrl}/api/media/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            messageId,
            mediaUrl,
            filename
          })
        })

        if (backendResponse.ok) {
          const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream'
          const buffer = await backendResponse.arrayBuffer()
          
          console.log('✅ Media downloaded from backend:', {
            size: buffer.byteLength,
            contentType,
            filename
          })

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
              'Cache-Control': 'private, max-age=3600',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          })
        }
      } catch (backendError) {
        console.error('❌ Backend download failed:', backendError)
      }
    }

    // Fallback: try to serve from local uploads directory
    if (filename) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      const filePath = join(uploadsDir, filename)

      if (existsSync(filePath)) {
        try {
          const fileBuffer = await readFile(filePath)
          const contentType = getContentType(filename)

          console.log('✅ Serving local file:', {
            filename,
            size: fileBuffer.length,
            contentType
          })

          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'private, max-age=3600',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          })
        } catch (fileError) {
          console.error('❌ Error reading local file:', fileError)
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Media not found'
    }, { status: 404 })

  } catch (error) {
    console.error('❌ Error in media download:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messageId, mediaUrl, filename } = await request.json()

    console.log('📥 Media download POST request:', {
      sessionId,
      messageId,
      mediaUrl,
      filename
    })

    if (!sessionId || !mediaUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sessionId, mediaUrl'
      }, { status: 400 })
    }

    // Forward to WhatsApp backend for media download
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
    const backendResponse = await fetch(`${backendUrl}/api/media/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        messageId,
        mediaUrl,
        filename
      })
    })

    if (backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream'
      const buffer = await backendResponse.arrayBuffer()
      
      console.log('✅ Media downloaded from backend:', {
        size: buffer.byteLength,
        contentType,
        filename
      })

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
          'Cache-Control': 'private, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    } else {
      const errorData = await backendResponse.text()
      console.error('❌ Backend download failed:', errorData)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to download media from backend'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in media download POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  }

  return mimeTypes[ext || ''] || 'application/octet-stream'
}
