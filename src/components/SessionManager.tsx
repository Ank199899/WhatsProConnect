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
import { useRealTime } from '@/contexts/RealTimeContext'

interface WhatsAppNumberManagerProps {
  whatsappManager: WhatsAppManagerClient
  sessions?: SessionStatus[]
  onSessionCreated?: () => void
  onSessionDeleted?: () => void
  onSessionSelected?: (sessionId: string) => void
  selectedSession?: string | null
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

export default function WhatsAppNumberManager({
  whatsappManager,
  sessions: propSessions,
  onSessionCreated,
  onSessionDeleted,
  onSessionSelected,
  selectedSession: propSelectedSession
}: WhatsAppNumberManagerProps) {
  const [whatsappNumbers, setWhatsappNumbers] = useState<SessionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [numberName, setNumberName] = useState('')
  const [qrCodes, setQrCodes] = useState<{ [numberId: string]: string }>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Use real-time context
  const { socket, isConnected, subscribe, unsubscribe } = useRealTime()

  useEffect(() => {
    loadWhatsAppNumbers()
    setupEventListeners()
    setupRealTimeListeners()

    // Auto-refresh every 30 seconds if not connected to real-time
    const autoRefreshInterval = setInterval(() => {
      if (!isConnected) {
        console.log('🔄 Auto-refreshing WhatsApp numbers (no real-time connection)')
        loadWhatsAppNumbers()
      }
    }, 30000)

    return () => {
      unsubscribe('whatsapp_numbers')
      clearInterval(autoRefreshInterval)
    }
  }, [isConnected])

  const loadWhatsAppNumbers = async () => {
    try {
      setLoading(true)
      const numberList = await whatsappManager.getSessions()
      setWhatsappNumbers(numberList)
    } catch (error) {
      console.error('Error loading WhatsApp numbers:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeListeners = () => {
    if (!socket) return

    // Listen for real-time WhatsApp number updates
    socket.on('whatsapp_numbers_updated', (updatedNumbers) => {
      console.log('📡 Received real-time WhatsApp numbers update:', updatedNumbers)
      setWhatsappNumbers(updatedNumbers)
    })

    // Subscribe to WhatsApp numbers updates
    subscribe('whatsapp_numbers', (updatedNumbers) => {
      console.log('📡 Real-time WhatsApp numbers subscription update:', updatedNumbers)
      setWhatsappNumbers(updatedNumbers)
    })
  }

  const setupEventListeners = () => {
    // Listen for QR codes
    whatsappManager.onQRCode((data) => {
      setQrCodes(prev => ({
        ...prev,
        [data.sessionId]: data.qrCode
      }))
      loadWhatsAppNumbers() // Refresh numbers to update status
    })

    // Listen for client ready
    whatsappManager.onClientReady((data) => {
      setQrCodes(prev => {
        const newQrCodes = { ...prev }
        delete newQrCodes[data.sessionId]
        return newQrCodes
      })
      loadWhatsAppNumbers()
    })

    // Listen for auth failure
    whatsappManager.onAuthFailure((data) => {
      console.error('Authentication failed for WhatsApp number:', data.sessionId)
      loadWhatsAppNumbers()
    })

    // Listen for disconnection
    whatsappManager.onClientDisconnected((data) => {
      console.log('Client disconnected:', data.sessionId)
      loadWhatsAppNumbers()
    })

    // Listen for new messages to update stats
    whatsappManager.onMessage((data) => {
      loadWhatsAppNumbers() // Refresh to update message counts
    })
  }

  const handleCreateWhatsAppNumber = async () => {
    if (isCreating) return

    setIsCreating(true)
    try {
      const result = await whatsappManager.createSession(numberName || undefined)
      if (result.success) {
        setNumberName('')
        setShowCreateModal(false)

        // Immediate refresh and request real-time update
        loadWhatsAppNumbers()
        if (socket) {
          socket.emit('get_whatsapp_numbers')
        }

        console.log('✅ WhatsApp number created successfully, refreshing list')
      } else {
        alert('Failed to create WhatsApp number')
      }
    } catch (error) {
      console.error('Error creating WhatsApp number:', error)
      alert('Error creating WhatsApp number')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteWhatsAppNumber = async (numberId: string) => {
    if (!window.confirm('Are you sure you want to delete this WhatsApp number? This will disconnect the WhatsApp account.')) return

    try {
      console.log('🗑️ Deleting WhatsApp number via WhatsApp Manager:', numberId)
      const result = await whatsappManager.deleteSession(numberId)

      if (result.success) {
        console.log('✅ WhatsApp number deleted successfully')

        // Immediate refresh and request real-time update
        loadWhatsAppNumbers()
        if (socket) {
          socket.emit('get_whatsapp_numbers')
        }

        if (selectedNumber === numberId) {
          setSelectedNumber(null)
        }
      } else {
        console.error('❌ Delete failed:', result.message)
        alert('Failed to delete WhatsApp number: ' + result.message)
      }
    } catch (error) {
      console.error('❌ Error deleting WhatsApp number:', error)
      alert('Error deleting WhatsApp number: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleRefreshWhatsAppNumbers = async () => {
    setRefreshing(true)
    await loadWhatsAppNumbers()

    // Request real-time update
    if (socket) {
      socket.emit('get_whatsapp_numbers')
    }

    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleWhatsAppNumberSelect = (numberId: string) => {
    setSelectedNumber(selectedNumber === numberId ? null : numberId)
  }

  const handleCopyWhatsAppNumberId = (numberId: string) => {
    copyToClipboard(numberId)
  }

  const handleRestartWhatsAppNumber = async (numberId: string) => {
    try {
      await whatsappManager.restartSession(numberId)
      loadWhatsAppNumbers()
    } catch (error) {
      console.error('Error restarting WhatsApp number:', error)
      alert('Error restarting WhatsApp number')
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
            WhatsApp Numbers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your WhatsApp connections and monitor number status
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Real-time connection status */}
          <div className={cn(
            'flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium',
            isConnected
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshWhatsAppNumbers}
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
            Add WhatsApp Number
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Numbers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{whatsappNumbers.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connected</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {whatsappNumbers.filter(s => s.status === 'ready').length}
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
                {whatsappNumbers.filter(s => s.status === 'qr_code').length}
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
                {whatsappNumbers.reduce((sum, s) => sum + (s.stats?.totalMessages || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* WhatsApp Numbers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">WhatsApp Numbers</h2>
        </div>
        
        {whatsappNumbers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No WhatsApp numbers created yet. Create your first WhatsApp number to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {whatsappNumbers.map((whatsappNumber) => (
              <div key={whatsappNumber.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {whatsappNumber.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(whatsappNumber.status)}`}>
                        {getStatusText(whatsappNumber.status)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {whatsappNumber.phoneNumber && (
                        <p className="text-sm text-gray-600">
                          📱 {whatsappNumber.phoneNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {new Date(whatsappNumber.createdAt).toLocaleString()}
                      </p>
                      {whatsappNumber.stats && (
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>👥 {whatsappNumber.stats.totalContacts} contacts</span>
                          <span>💬 {whatsappNumber.stats.totalMessages} messages</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {whatsappNumber.status === 'ready' && onSessionSelected && (
                      <button
                        onClick={() => onSessionSelected(whatsappNumber.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          propSelectedSession === whatsappNumber.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {propSelectedSession === whatsappNumber.id ? 'Selected' : 'Select'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteWhatsAppNumber(whatsappNumber.id)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* QR Code Display */}
                {whatsappNumber.status === 'qr_code' && qrCodes[whatsappNumber.id] && (
                  <div className="mt-4">
                    <QRCodeDisplay qrCode={qrCodes[whatsappNumber.id]} />
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
          <li>Click &quot;Add WhatsApp Number&quot; to start a new WhatsApp connection</li>
          <li>Scan the QR code with your WhatsApp mobile app</li>
          <li>Go to WhatsApp → Settings → Linked Devices → &quot;Link a Device&quot;</li>
          <li>Scan the QR code displayed above</li>
          <li>Once connected, the WhatsApp number will show as &quot;Ready&quot;</li>
        </ol>
      </div>

      {/* Create WhatsApp Number Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New WhatsApp Number"
        size="md"
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="WhatsApp Number Name"
              value={numberName}
              onChange={(e) => setNumberName(e.target.value)}
              placeholder="Enter a name for this WhatsApp number (optional)"
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>A new WhatsApp number will be created</li>
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
            onClick={handleCreateWhatsAppNumber}
            disabled={isCreating}
            icon={isCreating ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? 'Creating...' : 'Add WhatsApp Number'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
