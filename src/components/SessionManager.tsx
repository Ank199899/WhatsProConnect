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
import { useTheme } from '@/contexts/ThemeContext'
import { useTheme } from '@/contexts/ThemeContext'

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
  ready: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
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
  // Theme hook
  const { colors, isDark } = useTheme()

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
    const baseClasses = 'transition-colors duration-300'
    switch (status) {
      case 'ready': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`
      case 'qr_code': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`
      case 'initializing': return `${baseClasses} bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400`
      case 'disconnected': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`
      case 'auth_failure': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`
      case 'connected': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`
      default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`
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
    <div
      className="p-6 space-y-6 transition-colors duration-300"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold flex items-center transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <Smartphone
              className="w-8 h-8 mr-3"
              style={{ color: colors.primary }}
            />
            WhatsApp Numbers
          </h1>
          <p
            className="mt-1 transition-colors duration-300"
            style={{ color: colors.text.secondary }}
          >
            Manage your WhatsApp connections and monitor number status
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Real-time connection status */}
          <div
            className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300"
            style={{
              backgroundColor: isConnected ? `${colors.primary}20` : `${colors.secondary}20`,
              color: isConnected ? colors.primary : colors.secondary
            }}
          >
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
            style={{
              backgroundColor: colors.primary,
              color: '#ffffff'
            }}
            className="hover:opacity-90 transition-opacity duration-300"
          >
            Add WhatsApp Number
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg transition-colors duration-300"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Smartphone
                className="w-5 h-5"
                style={{ color: colors.primary }}
              />
            </div>
            <div>
              <p
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: colors.text.secondary }}
              >
                Total Numbers
              </p>
              <p
                className="text-xl font-bold transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                {whatsappNumbers.length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg transition-colors duration-300"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <CheckCircle
                className="w-5 h-5"
                style={{ color: colors.primary }}
              />
            </div>
            <div>
              <p
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: colors.text.secondary }}
              >
                Connected
              </p>
              <p
                className="text-xl font-bold transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                {whatsappNumbers.filter(s => s.status === 'ready').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg transition-colors duration-300"
              style={{ backgroundColor: '#F59E0B20' }}
            >
              <QrCode
                className="w-5 h-5"
                style={{ color: '#F59E0B' }}
              />
            </div>
            <div>
              <p
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: colors.text.secondary }}
              >
                Pending QR
              </p>
              <p
                className="text-xl font-bold transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                {whatsappNumbers.filter(s => s.status === 'qr_code').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg transition-colors duration-300"
              style={{ backgroundColor: '#8B5CF620' }}
            >
              <MessageCircle
                className="w-5 h-5"
                style={{ color: '#8B5CF6' }}
              />
            </div>
            <div>
              <p
                className="text-sm font-medium transition-colors duration-300"
                style={{ color: colors.text.secondary }}
              >
                Total Messages
              </p>
              <p
                className="text-xl font-bold transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                {whatsappNumbers.reduce((sum, s) => sum + (s.stats?.totalMessages || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* WhatsApp Numbers List */}
      <div
        className="rounded-lg shadow transition-colors duration-300"
        style={{ backgroundColor: colors.background.secondary }}
      >
        <div
          className="px-6 py-4 transition-colors duration-300"
          style={{
            borderBottom: `1px solid ${colors.border}`,
            backgroundColor: colors.background.secondary
          }}
        >
          <h2
            className="text-lg font-semibold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            WhatsApp Numbers
          </h2>
        </div>

        {whatsappNumbers.length === 0 ? (
          <div
            className="p-6 text-center transition-colors duration-300"
            style={{ color: colors.text.secondary }}
          >
            No WhatsApp numbers created yet. Create your first WhatsApp number to get started.
          </div>
        ) : (
          <div
            className="transition-colors duration-300"
            style={{ borderColor: colors.border }}
          >
            {whatsappNumbers.map((whatsappNumber) => (
              <div
                key={whatsappNumber.id}
                className="p-6 transition-colors duration-300"
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: colors.background.secondary
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3
                        className="text-lg font-medium transition-colors duration-300"
                        style={{ color: colors.text.primary }}
                      >
                        {whatsappNumber.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(whatsappNumber.status)}`}>
                        {getStatusText(whatsappNumber.status)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {whatsappNumber.phoneNumber && (
                        <p
                          className="text-sm transition-colors duration-300"
                          style={{ color: colors.text.secondary }}
                        >
                          📱 {whatsappNumber.phoneNumber}
                        </p>
                      )}
                      <p
                        className="text-sm transition-colors duration-300"
                        style={{ color: colors.text.muted }}
                      >
                        Created: {new Date(whatsappNumber.createdAt).toLocaleString()}
                      </p>
                      {whatsappNumber.stats && (
                        <div
                          className="flex space-x-4 text-sm transition-colors duration-300"
                          style={{ color: colors.text.secondary }}
                        >
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
                        className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: propSelectedSession === whatsappNumber.id
                            ? colors.primary
                            : `${colors.primary}20`,
                          color: propSelectedSession === whatsappNumber.id
                            ? '#ffffff'
                            : colors.primary
                        }}
                      >
                        {propSelectedSession === whatsappNumber.id ? 'Selected' : 'Select'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteWhatsAppNumber(whatsappNumber.id)}
                      className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: '#EF444420',
                        color: '#EF4444'
                      }}
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
      <div
        className="rounded-lg p-6 transition-colors duration-300"
        style={{ backgroundColor: `${colors.primary}10` }}
      >
        <h3
          className="text-lg font-medium mb-2 transition-colors duration-300"
          style={{ color: colors.primary }}
        >
          How to Connect
        </h3>
        <ol
          className="list-decimal list-inside space-y-2 transition-colors duration-300"
          style={{ color: colors.text.secondary }}
        >
          <li>Click "Add WhatsApp Number" to start a new WhatsApp connection</li>
          <li>Scan the QR code with your WhatsApp mobile app</li>
          <li>Go to WhatsApp → Settings → Linked Devices → "Link a Device"</li>
          <li>Scan the QR code displayed above</li>
          <li>Once connected, the WhatsApp number will show as "Ready"</li>
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
