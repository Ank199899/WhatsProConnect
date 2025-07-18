'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Smartphone,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react'

interface WhatsAppSession {
  id: string
  name: string
  status: string
  phone_number?: string
  qr_code?: string
  is_active: boolean
  created_at: string
}

export default function WhatsAppNumbers() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [selectedQR, setSelectedQR] = useState<WhatsAppSession | null>(null)
  const [qrImage, setQrImage] = useState('')

  // Load sessions from database
  const loadSessions = async () => {
    try {
      console.log('📋 Loading sessions...')
      const response = await fetch('/api/database/sessions')
      const result = await response.json()
      
      if (result.success) {
        setSessions(result.sessions || [])
        console.log('✅ Loaded:', result.sessions?.length || 0, 'sessions')
      }
    } catch (error) {
      console.error('❌ Load failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Test connectivity
  const testConnectivity = async () => {
    try {
      console.log('🧪 Testing connectivity...')

      // Test backend
      const backendResponse = await fetch('http://192.168.1.230:3001/api/sessions')
      console.log('📡 Backend status:', backendResponse.status)

      // Test frontend API
      const frontendResponse = await fetch('/api/database/sessions')
      console.log('💾 Frontend API status:', frontendResponse.status)

      alert('✅ Connectivity test passed! Backend: ' + backendResponse.status + ', Frontend: ' + frontendResponse.status)
    } catch (error) {
      console.error('❌ Connectivity test failed:', error)
      alert('❌ Connectivity test failed: ' + error.message)
    }
  }

  // Simple sync with backend
  const syncWithBackend = async () => {
    try {
      console.log('🔄 Syncing...')
      
      const response = await fetch('http://192.168.1.230:3001/api/sessions')
      const data = await response.json()
      
      // Backend returns array directly, not wrapped in success object
      if (Array.isArray(data) && data.length > 0) {
        console.log('📊 Backend:', data.length, 'sessions')

        for (const session of data) {
          console.log(`📝 ${session.id}: ${session.status}`)

          await fetch(`/api/database/sessions/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: session.status,
              phone_number: session.phoneNumber,
              is_active: session.status === 'ready',
              qr_code: session.qrCode
            })
          })
        }
        
        await loadSessions()
        console.log('✅ Sync done')
      } else {
        console.log('📊 No backend sessions found')
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
    }
  }

  // Create session
  const createSession = async () => {
    if (!sessionName.trim()) {
      alert('Please enter a session name')
      return
    }

    try {
      setLoading(true)
      console.log('🆕 Creating session:', sessionName)

      // Create session in backend
      console.log('📡 Calling backend API...')

      const response = await fetch('http://192.168.1.230:3001/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName })
      })

      console.log('📡 Backend response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('📡 Backend result:', result)

      if (result.success && result.sessionId) {
        console.log('✅ Backend session created:', result.sessionId)

        // Save to database
        console.log('💾 Saving to database...')
        const dbResponse = await fetch('/api/database/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: result.sessionId,
            name: sessionName,
            status: 'initializing',
            phone_number: null,
            qr_code: null,
            is_active: true
          })
        })

        const dbResult = await dbResponse.json()
        console.log('💾 Database result:', dbResult)

        if (dbResult.success) {
          console.log('✅ Session saved to database')

          setSessionName('')
          setShowCreateModal(false)
          await loadSessions()

          // Start syncing for new session
          setTimeout(syncWithBackend, 2000)
          setTimeout(syncWithBackend, 5000)

          alert('Session created successfully! QR code will appear soon.')
        } else {
          console.error('❌ Database save failed:', dbResult.error)
          alert('Session created in backend but failed to save to database: ' + (dbResult.error || 'Unknown error'))
        }
      } else {
        console.error('❌ Backend creation failed:', result)
        alert('Failed to create session: ' + (result.message || result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Create session error:', error)
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again.')
      } else if (error.message.includes('fetch')) {
        alert('Network error. Please check if backend server is running.')
      } else {
        alert('Failed to create session: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Delete session
  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete session?')) return

    try {
      console.log('🗑️ Deleting session:', sessionId)

      // Delete from backend
      const backendResponse = await fetch(`http://192.168.1.230:3001/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      console.log('📡 Backend delete response:', backendResponse.status)

      // Delete from database
      const dbResponse = await fetch(`/api/database/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      console.log('💾 Database delete response:', dbResponse.status)

      await loadSessions()
      console.log('✅ Session deleted successfully')
    } catch (error) {
      console.error('❌ Delete failed:', error)
      alert('Failed to delete session: ' + error.message)
    }
  }

  // Show QR
  const showQR = async (session: WhatsAppSession) => {
    if (!session.qr_code) {
      alert('QR not available')
      return
    }

    try {
      const QRCode = (await import('qrcode')).default
      const qrDataUrl = await QRCode.toDataURL(session.qr_code, { width: 256 })
      setQrImage(qrDataUrl)
      setSelectedQR(session)
      setShowQRModal(true)
    } catch (error) {
      console.error('❌ QR failed:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="text-green-500" size={20} />
      case 'qr_code': return <QrCode className="text-yellow-500" size={20} />
      default: return <AlertTriangle className="text-gray-500" size={20} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Connected'
      case 'qr_code': return 'Scan QR'
      default: return 'Initializing'
    }
  }

  useEffect(() => {
    loadSessions()
    const interval = setInterval(syncWithBackend, 3000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="animate-spin" size={32} />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  const connectedCount = sessions.filter(s => s.status === 'ready').length
  const pendingCount = sessions.filter(s => s.status === 'qr_code').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Numbers</h1>
          <p className="text-gray-600">Simple WhatsApp management</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={testConnectivity} icon={<Activity size={16} />}>
            Test
          </Button>
          <Button variant="outline" onClick={syncWithBackend} icon={<RefreshCw size={16} />}>
            Sync
          </Button>
          <Button onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="text-green-600" size={24} />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <QrCode className="text-yellow-600" size={24} />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Smartphone className="text-blue-600" size={24} />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(session.status)}
                  <div>
                    <h3 className="font-medium">{session.name}</h3>
                    <p className="text-sm text-gray-600">
                      {session.phone_number || 'No phone number'}
                    </p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.status === 'ready' ? 'bg-green-100 text-green-800' :
                      session.status === 'qr_code' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(session.status)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {session.status === 'qr_code' && (
                    <Button size="sm" onClick={() => showQR(session)} icon={<QrCode size={14} />}>
                      QR
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={syncWithBackend} icon={<RefreshCw size={14} />}>
                    Sync
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteSession(session.id)} icon={<Trash2 size={14} />}>
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add WhatsApp Number">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session Name</label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter session name"
            />
          </div>
          <div className="flex space-x-3">
            <Button onClick={createSession} disabled={!sessionName.trim()}>
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="QR Code">
        <div className="text-center space-y-4">
          <p>Scan with WhatsApp</p>
          {qrImage && (
            <img src={qrImage} alt="QR Code" className="mx-auto w-64 h-64" />
          )}
          <Button onClick={() => setShowQRModal(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}
