'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import AnimatedHeader from './AnimatedHeader'
import {
  Smartphone,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Activity,
  Database
} from 'lucide-react'
import { motion } from 'framer-motion'
import { io, Socket } from 'socket.io-client'

// API Base URL configuration
const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001'

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
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null)
  const [qrImage, setQrImage] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)

  // Load real WhatsApp sessions from database (primary source)
  const loadSessions = async () => {
    try {
      console.log('📋 Loading real WhatsApp sessions from database...')

      // Load sessions directly from database (real data)
      const dbResponse = await fetch('/api/database/sessions')
      if (dbResponse.ok) {
        const dbResult = await dbResponse.json()
        if (dbResult.success && dbResult.sessions) {
          // Map database sessions to display format
          const mappedSessions = dbResult.sessions.map((session: any) => ({
            id: session.id,
            name: session.name,
            status: session.status,
            phone_number: session.phone_number,
            qr_code: session.qr_code,
            is_active: session.is_active,
            created_at: session.created_at,
            message_count: 0 // Will be updated by sync
          }))

          setSessions(mappedSessions)
          console.log('✅ Loaded real database sessions:', mappedSessions.length)
          console.log('📋 Session details:', mappedSessions.map(s => ({ id: s.id, name: s.name, status: s.status })))

          // Optional background sync (throttled)
          setTimeout(() => syncWithBackend(), 2000)
          return
        }
      }

      // If no database sessions, try WhatsApp API as fallback
      const whatsappResponse = await fetch('/api/whatsapp/sessions')
      if (whatsappResponse.ok) {
        const whatsappData = await whatsappResponse.json()
        console.log('📱 WhatsApp API fallback response:', whatsappData)

        if (whatsappData.success && whatsappData.sessions && whatsappData.sessions.length > 0) {
          // Map WhatsApp sessions to our format and save to database
          const mappedSessions = whatsappData.sessions.map((session: any) => ({
            id: session.id || session.sessionId,
            name: session.name,
            status: session.status === 'connected' ? 'ready' :
                   session.status === 'scanning' ? 'qr_code' : 'disconnected',
            phone_number: session.phoneNumber,
            qr_code: session.qrCode,
            is_active: session.status === 'connected',
            created_at: session.lastActivity || new Date().toISOString(),
            message_count: session.messageCount || 0
          }))

          // Save to database for persistence
          for (const session of mappedSessions) {
            await fetch('/api/database/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(session)
            })
          }

          setSessions(mappedSessions)
          console.log('✅ Loaded and saved WhatsApp sessions:', mappedSessions.length)
          return
        }
      }

      // If no sessions found, show empty state
      setSessions([])
      console.log('📱 No active sessions found - showing empty state')

    } catch (error) {
      console.error('❌ Load failed:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-detect server URL
  const getServerUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const protocol = window.location.protocol

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://192.168.1.230:3001'
      } else {
        return `${protocol}//${hostname}:3001`
      }
    }
    return 'http://192.168.1.230:3001'
  }

  // Test connectivity
  const testConnectivity = async () => {
    try {
      console.log('🧪 Testing connectivity...')

      const serverUrl = getServerUrl()
      console.log('🔧 Using server URL:', serverUrl)

      // Test backend
      const backendResponse = await fetch(`/api/backend/sessions`)
      console.log('📡 Backend status:', backendResponse.status)

      // Test frontend API
      const frontendResponse = await fetch('/api/database/sessions')
      console.log('💾 Frontend API status:', frontendResponse.status)

      alert('✅ Connectivity test passed! Backend: ' + backendResponse.status + ', Frontend: ' + frontendResponse.status)
    } catch (error) {
      console.error('❌ Connectivity test failed:', error)
      alert('❌ Connectivity test failed: ' + (error as Error).message)
    }
  }

  // Throttled sync with backend to prevent infinite loops
  let lastSyncTime = 0
  const SYNC_THROTTLE = 5000 // 5 seconds

  const syncWithBackend = async () => {
    const now = Date.now()
    if (now - lastSyncTime < SYNC_THROTTLE) {
      console.log('⏳ Sync throttled, skipping...')
      return
    }
    lastSyncTime = now

    try {
      console.log('🔄 Syncing with backend...')

      const response = await fetch(`/api/backend/sessions`)
      if (!response.ok) {
        throw new Error(`Backend API failed: ${response.status}`)
      }

      const data = await response.json()

      // Backend returns array directly, not wrapped in success object
      if (Array.isArray(data) && data.length > 0) {
        console.log('📊 Backend sync:', data.length, 'sessions')

        // Update sessions state only if there are actual changes
        setSessions(prevSessions => {
          let hasChanges = false
          const updatedSessions = [...prevSessions]

          data.forEach((backendSession: any) => {
            const existingIndex = updatedSessions.findIndex(s => s.id === backendSession.id)
            if (existingIndex >= 0) {
              const currentSession = updatedSessions[existingIndex]
              const newStatus = backendSession.status === 'connected' ? 'ready' :
                               backendSession.status === 'ready' ? 'ready' :
                               backendSession.status === 'scanning' ? 'qr_code' :
                               backendSession.status === 'qr_code' ? 'qr_code' :
                               backendSession.status === 'connecting' ? 'qr_code' : 'disconnected'

              // Only update if status actually changed
              if (currentSession.status !== newStatus ||
                  currentSession.phone_number !== backendSession.phoneNumber ||
                  currentSession.qr_code !== backendSession.qrCode) {

                hasChanges = true
                updatedSessions[existingIndex] = {
                  ...currentSession,
                  status: newStatus,
                  phone_number: backendSession.phoneNumber,
                  qr_code: backendSession.qrCode,
                  is_active: backendSession.status === 'connected' || backendSession.status === 'ready'
                }

                console.log(`📝 Updated session ${backendSession.id}: ${currentSession.status} → ${newStatus}`)
              }
            }
          })

          return hasChanges ? updatedSessions : prevSessions
        })

        console.log('✅ Backend sync completed')
      } else {
        console.log('📊 No backend sessions to sync')
      }
    } catch (error) {
      console.log('⚠️ Backend sync failed:', error)
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

      // Create session directly in database first
      const sessionData = {
        id: `session_${Date.now()}_${sessionName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${sessions.length}`,
        name: sessionName.trim(),
        status: 'initializing',
        phone_number: null,
        qr_code: null,
        is_active: false
      }

      console.log('💾 Saving to database:', sessionData)

      const dbResponse = await fetch('/api/database/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })

      if (!dbResponse.ok) {
        throw new Error('Failed to save session to database')
      }

      const dbResult = await dbResponse.json()
      console.log('✅ Database session created:', dbResult)

      // Try to create session in backend (optional)
      try {
        console.log('📡 Calling backend API...')
        const backendResponse = await fetch(`/api/backend/sessions/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sessionName, sessionId: sessionData.id })
        })

        if (backendResponse.ok) {
          const backendResult = await backendResponse.json()
          console.log('✅ Backend session created:', backendResult)
        } else {
          console.log('⚠️ Backend creation failed, but database session exists')
        }
      } catch (backendError) {
        console.log('⚠️ Backend not available, but database session created')
      }

      setSessionName('')
      setShowCreateModal(false)
      await loadSessions()

      // Delayed sync after session creation
      setTimeout(() => syncWithBackend(), 5000)

      alert('Session created successfully! QR code will appear soon.')

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
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return

    try {
      console.log('🗑️ Deleting session:', sessionId)
      setLoading(true)

      // First remove from UI immediately for better UX
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId))

      // Delete from database first (most important)
      console.log('💾 Calling database delete API...')
      const dbResponse = await fetch(`/api/database/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('💾 Database delete response status:', dbResponse.status)

      if (!dbResponse.ok) {
        const dbErrorText = await dbResponse.text()
        console.error('❌ Database delete failed:', dbErrorText)
        // Restore session in UI if database delete failed
        await loadSessions()
        throw new Error(`Database delete failed: ${dbResponse.status} - ${dbErrorText}`)
      }

      const dbResult = await dbResponse.json()
      console.log('💾 Database delete result:', dbResult)

      // Try to delete from backend (optional, don't fail if this fails)
      try {
        console.log('📡 Calling backend delete API...')
        const backendResponse = await fetch(`/api/backend/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        console.log('📡 Backend delete response status:', backendResponse.status)

        if (backendResponse.ok) {
          const backendResult = await backendResponse.json()
          console.log('📡 Backend delete result:', backendResult)
        } else {
          console.warn('⚠️ Backend delete failed, but continuing...')
        }
      } catch (backendError) {
        console.warn('⚠️ Backend delete error (ignoring):', backendError)
      }

      console.log('✅ Session deleted successfully')
      alert('Session deleted successfully!')

    } catch (error) {
      console.error('❌ Delete failed:', error)
      alert('Failed to delete session: ' + (error instanceof Error ? error.message : 'Unknown error'))
      // Reload sessions to restore correct state
      await loadSessions()
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate QR image from QR data
  const generateQRImage = async (qrData: string) => {
    try {
      console.log('🔄 Generating QR image from data:', qrData?.substring(0, 50) + '...')
      console.log('📊 QR data length:', qrData?.length)

      if (!qrData || qrData.trim() === '') {
        throw new Error('QR data is empty or invalid')
      }

      // Use backend API to generate QR code instead of client-side
      console.log('🔄 Using backend API for QR generation...')
      const response = await fetch(`/api/test-qr?data=${encodeURIComponent(qrData)}`)

      if (!response.ok) {
        throw new Error(`Backend QR generation failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Backend QR generation failed')
      }

      setQrImage(result.qrDataUrl)
      console.log('✅ QR image generated successfully via backend')
    } catch (error) {
      console.error('❌ QR image generation failed:', error)
      console.error('❌ Error details:', error.message)
      setQrImage('')
      // Show error to user
      alert(`Unable to generate QR code: ${error.message}`)
    }
  }

  // Show QR
  const showQR = async (session: WhatsAppSession) => {
    console.log('🔄 Showing QR for session:', session.name, session.id)
    console.log('📱 Session QR code exists:', !!session.qr_code)
    console.log('📊 Session status:', session.status)

    setSelectedSession(session)
    setShowQRModal(true)
    setQrImage('') // Clear previous QR

    // If session already has QR code, use it
    if (session.qr_code && session.qr_code.trim() !== '') {
      console.log('✅ Using existing QR code from session')
      await generateQRImage(session.qr_code)
      return
    }

    // Otherwise try to generate fresh QR from backend
    console.log('🔄 No QR code in session, requesting from backend')
    await generateQR(session.id)
  }

  // Generate QR code from backend
  const generateQR = async (sessionId: string) => {
    try {
      setQrImage('') // Clear previous QR
      console.log('🔄 Generating QR for session:', sessionId)
      console.log('🔗 Using API URL:', API_BASE_URL)

      // Only use real WhatsApp server endpoint
      try {
        console.log('🔄 Getting QR from real WhatsApp server:', sessionId)
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/qr`)

        if (response.ok) {
          const data = await response.json()
          console.log('📡 Real server response:', data)

          if (data.success && data.qrCode) {
            await generateQRImage(data.qrCode)
            console.log('✅ Real QR code generated successfully')
            return
          }
        } else {
          console.log('❌ Real server failed:', response.status)
        }
      } catch (error) {
        console.log('❌ Error with real server:', error)
      }

      // If real server fails, show error
      console.error('❌ Could not generate QR code from real WhatsApp server')
      alert('Unable to generate QR code. Please ensure the WhatsApp session is properly initialized and the server is running.')

    } catch (error) {
      console.error('❌ QR generation error:', error)
      alert('Error generating QR code: ' + (error as Error).message)
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

  // Connect session function
  const connectSession = async (sessionId: string) => {
    try {
      console.log('🔌 Connecting session:', sessionId)
      setLoading(true)

      // Call backend to connect session
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Session connection initiated:', result)

        // Update session status to connecting
        setSessions(prev => prev.map(session =>
          session.id === sessionId
            ? { ...session, status: 'connecting' }
            : session
        ))

        // Reload sessions to get updated status
        setTimeout(() => {
          loadSessions()
        }, 2000)
      } else {
        console.error('❌ Failed to connect session')
        alert('Failed to connect session. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error connecting session:', error)
      alert('Error connecting session. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Initialize real data
  const initializeRealData = async () => {
    if (!confirm('This will replace demo data with real WhatsApp sessions. Continue?')) {
      return
    }

    try {
      setLoading(true)
      console.log('🚀 Initializing real data...')

      const response = await fetch('/api/database/init-real-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Real data initialized:', result)

      if (result.success) {
        alert(`Real data loaded successfully!\n\nRemoved: ${result.stats.removedDemoSessions} demo sessions\nAdded: ${result.stats.addedRealSessions} real sessions\nTotal: ${result.stats.totalSessions} sessions`)
        await loadSessions()
      } else {
        throw new Error(result.error || 'Failed to initialize real data')
      }
    } catch (error) {
      console.error('❌ Initialize real data failed:', error)
      alert('Failed to initialize real data: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 Component mounted, loading sessions...')
    loadSessions()

    // Setup Socket.IO connection with throttling
    const socketConnection = io(API_BASE_URL, {
      transports: ['websocket'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5
    })
    setSocket(socketConnection)

    // Throttling variables
    let lastUpdateTime = 0
    const UPDATE_THROTTLE = 2000 // 2 seconds

    socketConnection.on('connect', () => {
      console.log('✅ Connected to WhatsApp server')
    })

    socketConnection.on('disconnect', () => {
      console.log('❌ Disconnected from WhatsApp server')
    })

    // Listen for QR code events
    socketConnection.on('qr_code', (data: { sessionId: string, qrCode: string }) => {
      console.log('📱 QR Code received for session:', data.sessionId)

      // If QR modal is open for this session, update the QR image
      if (selectedSession?.id === data.sessionId && showQRModal) {
        generateQRImage(data.qrCode)
      }

      // Update session status
      setSessions(prev => prev.map(session =>
        session.id === data.sessionId
          ? { ...session, status: 'qr_code', qr_code: data.qrCode }
          : session
      ))
    })

    // Listen for client ready events
    socketConnection.on('client_ready', (data: { sessionId: string, phoneNumber: string }) => {
      console.log('🎉 Client ready event received for session:', data.sessionId, 'Phone:', data.phoneNumber)

      setSessions(prev => prev.map(session =>
        session.id === data.sessionId
          ? { ...session, status: 'ready', phone_number: data.phoneNumber, qr_code: null, is_active: true }
          : session
      ))

      // Close QR modal if open for this session
      if (selectedSession?.id === data.sessionId && showQRModal) {
        console.log('🔒 Closing QR modal for connected session:', data.sessionId)
        setShowQRModal(false)
        setSelectedSession(null)
      }
    })

    // Listen for client disconnected events
    socketConnection.on('client_disconnected', (data: { sessionId: string, reason: string }) => {
      console.log('🔌 Client disconnected for session:', data.sessionId)

      setSessions(prev => prev.map(session =>
        session.id === data.sessionId
          ? { ...session, status: 'disconnected', is_active: false }
          : session
      ))
    })

    // Listen for auth failure events
    socketConnection.on('auth_failure', (data: { sessionId: string }) => {
      console.log('❌ Auth failure for session:', data.sessionId)

      setSessions(prev => prev.map(session =>
        session.id === data.sessionId
          ? { ...session, status: 'auth_failure', qr_code: null, is_active: false }
          : session
      ))
    })

    // Listen for sessions updates from backend (throttled)
    socketConnection.on('sessions_updated', (data: any) => {
      const now = Date.now()
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        return // Ignore rapid updates
      }
      lastUpdateTime = now

      console.log('📡 Sessions updated from backend:', data?.length || 0)
      if (data && Array.isArray(data)) {
        setSessions(data)
      }
    })

    // Reduced sync frequency to prevent spam
    const interval = setInterval(() => {
      // Only sync if not loading to prevent conflicts
      if (!loading) {
        syncWithBackend()
      }
    }, 60000) // 1 minute

    return () => {
      clearInterval(interval)
      socketConnection.disconnect()
    }
  }, [])

  // Debug: Log sessions state changes
  useEffect(() => {
    console.log('📊 Sessions state updated:', sessions.length, 'sessions')
  }, [sessions])

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
      {/* Animated Header */}
      <AnimatedHeader
        title="WhatsApp Numbers"
        subtitle="Manage your WhatsApp sessions with professional messaging capabilities"
        showLogo={false}
      />

      <div className="px-6">
        {/* Advanced Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-gradient-to-r from-white/80 via-emerald-50/60 to-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-lg mb-8"
        >
          <div className="flex items-center space-x-6">
            {/* Real-time Status */}
            <motion.div
              className="flex items-center space-x-3 bg-white/70 rounded-xl px-4 py-2 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-gray-700">Sessions Active</span>
            </motion.div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-emerald-600">{sessions.length}</div>
                <div className="text-xs text-gray-500">Connected</div>
              </motion.div>
              <div className="w-px h-8 bg-gray-300"></div>
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-blue-600">100%</div>
                <div className="text-xs text-gray-500">Uptime</div>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadSessions}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Session</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Advanced Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                type: "spring",
                bounce: 0.4
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
              }}
              className="group relative"
            >
              {/* Ultra-Modern Session Card */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl overflow-hidden">

                {/* Dynamic Background Pattern */}
                <motion.div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 80%, ${
                      session.status === 'ready' ? '#10b981' :
                      session.status === 'qr_code' ? '#f59e0b' : '#ef4444'
                    } 0%, transparent 50%),
                                     radial-gradient(circle at 80% 20%, ${
                      session.status === 'ready' ? '#059669' :
                      session.status === 'qr_code' ? '#d97706' : '#dc2626'
                    } 0%, transparent 50%)`
                  }}
                  animate={{
                    background: [
                      `radial-gradient(circle at 20% 80%, ${session.status === 'ready' ? '#10b981' : session.status === 'qr_code' ? '#f59e0b' : '#ef4444'} 0%, transparent 50%)`,
                      `radial-gradient(circle at 80% 20%, ${session.status === 'ready' ? '#059669' : session.status === 'qr_code' ? '#d97706' : '#dc2626'} 0%, transparent 50%)`,
                      `radial-gradient(circle at 20% 80%, ${session.status === 'ready' ? '#10b981' : session.status === 'qr_code' ? '#f59e0b' : '#ef4444'} 0%, transparent 50%)`
                    ]
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1.5 h-1.5 rounded-full opacity-40 ${
                        session.status === 'ready' ? 'bg-emerald-400' :
                        session.status === 'qr_code' ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{
                        left: `${15 + i * 30}%`,
                        top: `${10 + i * 20}%`
                      }}
                      animate={{
                        y: [-8, -16, -8],
                        x: [-4, 4, -4],
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.5, 1]
                      }}
                      transition={{
                        duration: 4 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                </div>

                {/* Header with Status */}
                <div className="relative flex items-center justify-between mb-6">
                  <motion.div
                    className={`relative p-4 rounded-2xl shadow-xl ${
                      session.status === 'ready' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                      session.status === 'qr_code' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-red-500 to-rose-600'
                    }`}
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Icon Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-white/20"
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    <Smartphone className="w-6 h-6 text-white relative z-10" />

                    {/* Pulsing Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-white/40"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 0.9, 0.6]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Status Badge */}
                  <motion.div
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
                      session.status === 'ready' ? 'bg-green-100/80 text-green-700 border border-green-200/50' :
                      session.status === 'qr_code' ? 'bg-amber-100/80 text-amber-700 border border-amber-200/50' :
                      'bg-red-100/80 text-red-700 border border-red-200/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        session.status === 'ready' ? 'bg-green-500' :
                        session.status === 'qr_code' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs font-bold capitalize">
                      {session.status === 'ready' ? 'Connected' :
                       session.status === 'qr_code' ? 'Scanning' :
                       session.status === 'disconnected' ? 'Disconnected' :
                       session.status}
                    </span>
                  </motion.div>
                </div>

                {/* Session Info */}
                <div className="relative space-y-4">
                  <motion.h3
                    className="text-lg font-bold text-gray-900"
                    whileHover={{ scale: 1.02 }}
                  >
                    {session.name}
                  </motion.h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{session.phone_number || session.phone || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Active:</span>
                      <span className="font-medium text-gray-900">{session.lastSeen || session.updated_at || 'Never'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="relative z-10 flex items-center space-x-2 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showQR(session)}
                      className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show QR</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => connectSession(session.id)}
                      className="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Connect</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteSession(session.id)}
                      className="p-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${
                      session.status === 'ready' ? 'rgba(16, 185, 129, 0.1)' :
                      session.status === 'qr_code' ? 'rgba(245, 158, 11, 0.1)' :
                      'rgba(239, 68, 68, 0.1)'
                    } 0%, transparent 100%)`,
                    boxShadow: `0 0 0 1px ${
                      session.status === 'ready' ? 'rgba(16, 185, 129, 0.2)' :
                      session.status === 'qr_code' ? 'rgba(245, 158, 11, 0.2)' :
                      'rgba(239, 68, 68, 0.2)'
                    }`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Smartphone className="w-12 h-12 text-emerald-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-6">Create your first WhatsApp session to get started</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create First Session
            </motion.button>
          </motion.div>
        )}



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
      <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="WhatsApp QR Code">
        {selectedSession && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                <div className="w-64 h-64 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {qrImage ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <img
                        src={qrImage}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-600">Generating QR Code...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Scan with WhatsApp
              </h3>
              <div className="space-y-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Instructions</span>
                </div>
                <p>1. Open WhatsApp on your phone</p>
                <p>2. Go to Settings → Linked Devices</p>
                <p>3. Tap "Link a Device"</p>
                <p>4. Scan this QR code</p>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowQRModal(false)}
                className="px-6"
              >
                Close
              </Button>
              <Button
                onClick={() => generateQR(selectedSession.id)}
                className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh QR
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  )
}
