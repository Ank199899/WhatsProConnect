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
  Download,
  Activity,
  Signal
} from 'lucide-react'
import { WhatsAppManagerClient, SessionStatus } from '@/lib/whatsapp-manager'
import { LocalStorage } from '@/lib/local-storage'
import QRCodeDisplay from './QRCodeDisplay'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal, { ModalHeader, ModalBody, ModalFooter } from './ui/Modal'
import { cn, formatDate, getTimeAgo, copyToClipboard } from '@/lib/utils'

interface AdvancedSessionManagerProps {
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

const getStatusText = (status: string) => {
  switch (status) {
    case 'ready': return 'Connected'
    case 'qr_code': return 'Scan QR Code'
    case 'initializing': return 'Initializing'
    case 'disconnected': return 'Disconnected'
    case 'auth_failure': return 'Auth Failed'
    default: return status
  }
}

export default function AdvancedSessionManager({ whatsappManager }: AdvancedSessionManagerProps) {
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

    // Add some sample data if no sessions exist
    const existingSessions = LocalStorage.getSessions()
    if (existingSessions.length === 0) {
      // Create sample sessions for demo
      LocalStorage.createSession({
        name: 'Business Account',
        status: 'ready',
        phone_number: '+1234567890',
        is_active: true
      })

      LocalStorage.createSession({
        name: 'Support Account',
        status: 'qr_code',
        is_active: true
      })

      // Reload sessions after adding samples
      setTimeout(() => loadSessions(), 100)
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = async () => {
    try {
      if (!loading) setRefreshing(true)
      const sessionList = await whatsappManager.getSessions()
      setSessions(sessionList)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const setupEventListeners = () => {
    // Listen for QR codes
    whatsappManager.onQRCode((data) => {
      setQrCodes(prev => ({
        ...prev,
        [data.sessionId]: data.qrCode
      }))
      loadSessions()
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
      loadSessions()
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-64 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
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
            Manage your WhatsApp connections and monitor session status in real-time
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

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <Card variant="elevated" className="text-center py-12">
          <div className="flex flex-col items-center">
            <Smartphone size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No WhatsApp Sessions
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first session to start connecting WhatsApp accounts
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
              className="bg-green-600 hover:bg-green-700"
            >
              Create First Session
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sessions.map((session, index) => {
              const StatusIcon = statusIcons[session.status]
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="elevated" hover className="relative overflow-hidden">
                    <div className={cn(
                      'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-8 -translate-y-8',
                      session.status === 'ready' && 'bg-green-500',
                      session.status === 'qr_code' && 'bg-blue-500',
                      session.status === 'initializing' && 'bg-yellow-500',
                      session.status === 'disconnected' && 'bg-red-500',
                      session.status === 'auth_failure' && 'bg-red-500'
                    )} />
                    
                    <CardContent className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {session.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {session.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {session.phoneNumber || 'Not connected'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySessionId(session.id)}
                            className="p-1"
                          >
                            <Copy size={16} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            <Settings size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                              statusColors[session.status]
                            )}>
                              <StatusIcon size={12} />
                              <span>{getStatusText(session.status)}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                        
                        {session.stats && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Contacts:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {session.stats.totalContacts}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Messages:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {session.stats.totalMessages}
                              </span>
                            </div>
                          </>
                        )}
                        
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            {session.status === 'ready' && (
                              <Button
                                size="sm"
                                variant={selectedSession === session.id ? 'primary' : 'outline'}
                                onClick={() => handleSessionSelect(session.id)}
                                className="flex-1"
                                icon={<Eye size={14} />}
                              >
                                {selectedSession === session.id ? 'Selected' : 'Select'}
                              </Button>
                            )}
                            
                            {session.status === 'disconnected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestartSession(session.id)}
                                className="flex-1"
                                icon={<RefreshCw size={14} />}
                              >
                                Restart
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                              icon={<Trash2 size={14} />}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* QR Code Display */}
                    {session.status === 'qr_code' && qrCodes[session.id] && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                        <QRCodeDisplay qrCode={qrCodes[session.id]} />
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Session Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New WhatsApp Session"
        size="md"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Session Name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter a name for this session (optional)"
            />
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>A new WhatsApp session will be created</li>
                <li>You'll see a QR code to scan with your phone</li>
                <li>Open WhatsApp → Settings → Linked Devices</li>
                <li>Tap "Link a Device" and scan the QR code</li>
                <li>Your WhatsApp will be connected and ready to use</li>
              </ol>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            disabled={isCreating}
            icon={isCreating ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
