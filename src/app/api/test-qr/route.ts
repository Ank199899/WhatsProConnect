import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data') || 'test-qr-code'
    
    console.log('🧪 Testing QR generation with data:', data)
    
    // Import QRCode dynamically
    const QRCode = (await import('qrcode')).default
    
    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#25D366',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
    
    console.log('✅ QR generation successful')
    
    return NextResponse.json({
      success: true,
      qrDataUrl,
      originalData: data
    })
    
  } catch (error) {
    console.error('❌ QR generation test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
