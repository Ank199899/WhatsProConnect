'use client'

import { useEffect, useRef } from 'react'

interface QRCodeDisplayProps {
  qrCode: string
}

export default function QRCodeDisplay({ qrCode }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (qrCode && canvasRef.current) {
      // Use QRCode library to generate QR code
      import('qrcode').then((QRCode) => {
        QRCode.toCanvas(canvasRef.current, qrCode, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }, (error) => {
          if (error) {
            console.error('Error generating QR code:', error)
          }
        })
      })
    }
  }, [qrCode])

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Scan QR Code with WhatsApp
        </h4>
        
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 rounded-lg"
          />
        </div>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">Steps to connect:</p>
          <ol className="list-decimal list-inside text-left max-w-md mx-auto space-y-1">
            <li>Open WhatsApp on your phone</li>
            <li>Go to Settings → Linked Devices</li>
            <li>Tap &quot;Link a Device&quot;</li>
            <li>Scan this QR code</li>
          </ol>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ QR code expires in 20 seconds. Refresh if needed.
          </p>
        </div>
      </div>
    </div>
  )
}
