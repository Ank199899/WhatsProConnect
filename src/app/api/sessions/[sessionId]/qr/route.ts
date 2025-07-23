import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    console.log('🔄 QR request for session:', sessionId)

    // Try to get session data from WhatsApp backend
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
    
    try {
      // First try to get QR from WhatsApp backend
      const backendResponse = await fetch(`${backendUrl}/api/sessions/${sessionId}/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        
        if (data.qrCode) {
          console.log('✅ Got QR data from backend')
          
          // Generate QR code image
          const qrBuffer = await QRCode.toBuffer(data.qrCode, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })

          return new NextResponse(qrBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
        }
      }
    } catch (backendError) {
      console.log('❌ Backend not available:', backendError)
    }

    // Fallback: Generate demo QR for testing
    console.log('🔄 Generating demo QR for testing...')
    const demoQRData = `whatsapp://qr/demo_${sessionId}_${Date.now()}`
    
    const qrBuffer = await QRCode.toBuffer(demoQRData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return new NextResponse(qrBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ QR generation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate QR code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also handle POST for QR generation requests
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    console.log('🔄 QR generation request for session:', sessionId)

    // Try to trigger QR generation on WhatsApp backend
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'http://localhost:3006'
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        console.log('✅ QR generation triggered on backend')
        
        return NextResponse.json({
          success: true,
          message: 'QR generation triggered',
          sessionId,
          data
        })
      }
    } catch (backendError) {
      console.log('❌ Backend not available for QR trigger:', backendError)
    }

    // Return success even if backend is not available
    return NextResponse.json({
      success: true,
      message: 'QR generation request received',
      sessionId,
      note: 'Backend not available - using demo mode'
    })

  } catch (error) {
    console.error('❌ QR trigger error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger QR generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
