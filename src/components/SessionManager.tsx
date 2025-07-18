'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Plus,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  MessageCircle,
  Settings,
  Eye,
  Copy,
  Download
} from 'lucide-react'
import { WhatsAppManagerClient, SessionStatus } from '@/lib/whatsapp-manager'
import QRCodeDisplay from './QRCodeDisplay'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { cn, formatDate, getTimeAgo, copyToClipboard } from '@/lib/utils'

interface SessionManagerProps {
  whatsappManager: WhatsAppManagerClient
}

const statusColors = {
  initializing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  qr_code: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  disconnected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  auth_failure: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const statusIcons = {
  initializing: Clock,
  qr_code: QrCode,
  ready: CheckCircle,
  disconnected: WifiOff,
  auth_failure: AlertTriangle
}

export default function SessionManager({ whatsappManager }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [qrCodes, setQrCodes] = useState<{ [sessionId: string]: string }>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSessions()
    setupEventListeners()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const sessionList = await whatsappManager.getSessions()
      setSessions(sessionList)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupEventListeners = () => {
    // Listen for QR codes
    whatsappManager.onQRCode((data) => {
      setQrCodes(prev => ({
        ...prev,
        [data.sessionId]: data.qrCode
      }))
      loadSessions() // Refresh sessions to update status
    })

    // Listen for client ready
    whatsappManager.onClientReady((data) => {
      setQrCodes(prev => {
        const newQrCodes = { ...prev }
        delete newQrCodes[data.sessionId]
        return newQrCodes
      })
      loadSessions()
    })

    // Listen for auth failure
    whatsappManager.onAuthFailure((data) => {
      console.error('Authentication failed for session:', data.sessionId)
      loadSessions()
    })

    // Listen for disconnection
    whatsappManager.onClientDisconnected((data) => {
      console.log('Client disconnected:', data.sessionId)
      loadSessions()
    })

    // Listen for new messages to update stats
    whatsappManager.onMessage((data) => {
      loadSessions() // Refresh to update message counts
    })
  }

  const handleCreateSession = async () => {
    if (isCreating) return

    setIsCreating(true)
    try {
      const result = await whatsappManager.createSession(sessionName || undefined)
      if (result.success) {
        setSessionName('')
        setShowCreateModal(false)
        loadSessions()
      } else {
        alert('Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Error creating session')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session? This will disconnect the WhatsApp account.')) {
      try {
        await whatsappManager.deleteSession(sessionId)
        loadSessions()
        if (selectedSession === sessionId) {
          setSelectedSession(null)
        }
      } catch (error) {
        console.error('Error deleting session:', error)
        alert('Error deleting session')
      }
    }
  }

  const handleRefreshSessions = async () => {
    setRefreshing(true)
    await loadSessions()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(selectedSession === sessionId ? null : sessionId)
  }

  const handleCopySessionId = (sessionId: string) => {
    copyToClipboard(sessionId)
  }

  const handleRestartSession = async (sessionId: string) => {
    try {
      await whatsappManager.restartSession(sessionId)
      loadSessions()
    } catch (error) {
      console.error('Error restarting session:', error)
      alert('Error restarting session')
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const result = await whatsappManager.deleteSession(sessionId)
      if (result.success) {
        onSessionDeleted()
      } else {
        alert('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Error deleting session')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800'
      case 'qr_code': return 'bg-yellow-100 text-yellow-800'
      case 'initializing': return 'bg-blue-100 text-blue-800'
      case 'disconnected': return 'bg-red-100 text-red-800'
      case 'auth_failure': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready'
      case 'qr_code': return 'Scan QR Code'
      case 'initializing': return 'Initializing'
      case 'disconnected': return 'Disconnected'
      case 'auth_failure': return 'Auth Failed'
      default: return status
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Smartphone className="w-8 h-8 mr-3 text-green-600" />
            WhatsApp Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your WhatsApp connections and monitor session status
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSessions}
            disabled={refreshing}
            icon={<RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />}
          >
            Refresh
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            className="bg-green-600 hover:bg-green-700"
          >
            New Session
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {sessions.filter(s => s.status === 'ready').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <QrCode className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending QR</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {sessions.filter(s => s.status === 'qr_code').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {sessions.reduce((sum, s) => sum + (s.stats?.totalMessages || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">WhatsApp Sessions</h2>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No sessions created yet. Create your first session to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {session.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {session.phoneNumber && (
                        <p className="text-sm text-gray-600">
                          📱 {session.phoneNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                      {session.stats && (
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>👥 {session.stats.totalContacts} contacts</span>
                          <span>💬 {session.stats.totalMessages} messages</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {session.status === 'ready' && (
                      <button
                        onClick={() => onSessionSelected(session.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          selectedSession === session.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {selectedSession === session.id ? 'Selected' : 'Select'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* QR Code Display */}
                {session.status === 'qr_code' && qrCodes[session.id] && (
                  <div className="mt-4">
                    <QRCodeDisplay qrCode={qrCodes[session.id]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How to Connect</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Click &quot;Create Session&quot; to start a new WhatsApp connection</li>
          <li>Scan the QR code with your WhatsApp mobile app</li>
          <li>Go to WhatsApp → Settings → Linked Devices → &quot;Link a Device&quot;</li>
          <li>Scan the QR code displayed above</li>
          <li>Once connected, the session will show as &quot;Ready&quot;</li>
        </ol>
      </div>
    </div>
  )
}
