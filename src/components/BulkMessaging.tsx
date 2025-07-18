'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient, SessionStatus, ContactData, BulkMessageProgress } from '@/lib/whatsapp-manager'

interface BulkMessagingProps {
  whatsappManager: WhatsAppManagerClient
  sessions: SessionStatus[]
  selectedSession: string | null
  onSessionSelected: (sessionId: string) => void
}

interface BulkQueue {
  id: string
  session_id: string
  message_content: string
  target_contacts: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  sent_count: number
  failed_count: number
  total_count: number
  delay_ms: number
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

export default function BulkMessaging({
  whatsappManager,
  sessions,
  selectedSession,
  onSessionSelected
}: BulkMessagingProps) {
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [delay, setDelay] = useState(2000)
  const [isSending, setIsSending] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [bulkQueues, setBulkQueues] = useState<BulkQueue[]>([])
  const [progress, setProgress] = useState<BulkMessageProgress | null>(null)
  const [contactFilter, setContactFilter] = useState('')

  useEffect(() => {
    if (selectedSession) {
      loadContacts()
      loadBulkQueues()
    }
  }, [selectedSession])

  useEffect(() => {
    // Listen for bulk message progress
    whatsappManager.onBulkMessageProgress((progressData) => {
      if (progressData.sessionId === selectedSession) {
        setProgress(progressData)
      }
    })

    // Listen for bulk message completion
    whatsappManager.onBulkMessageComplete((result) => {
      if (result.sessionId === selectedSession) {
        setProgress(null)
        setIsSending(false)
        loadBulkQueues()
        alert(`Bulk message completed! Sent: ${result.sent}, Failed: ${result.failed}`)
      }
    })
  }, [whatsappManager, selectedSession])

  const loadContacts = async () => {
    if (!selectedSession) return

    setLoadingContacts(true)
    try {
      const contactList = await whatsappManager.getContacts(selectedSession)
      setContacts(contactList.filter(c => !c.isGroup)) // Only individual contacts for bulk messaging
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const loadBulkQueues = async () => {
    try {
      const queues = await whatsappManager.getBulkMessageQueues(selectedSession || undefined)
      setBulkQueues(queues)
    } catch (error) {
      console.error('Error loading bulk queues:', error)
    }
  }

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    const filteredContacts = getFilteredContacts()
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(c => c.number))
    }
  }

  const handleSendBulkMessage = async () => {
    if (!selectedSession || selectedContacts.length === 0 || !message.trim()) {
      alert('Please select session, contacts, and enter a message')
      return
    }

    setIsSending(true)
    try {
      const result = await whatsappManager.sendBulkMessage({
        sessionId: selectedSession,
        contacts: selectedContacts,
        message: message.trim(),
        delay
      })

      if (result.success) {
        setMessage('')
        setSelectedContacts([])
        loadBulkQueues()
      } else {
        alert('Failed to start bulk messaging')
        setIsSending(false)
      }
    } catch (error) {
      console.error('Error sending bulk message:', error)
      alert('Error sending bulk message')
      setIsSending(false)
    }
  }

  const getFilteredContacts = () => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(contactFilter.toLowerCase()) ||
      contact.number.includes(contactFilter)
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          No active sessions available. Please create and connect a session first.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionSelected(session.id)}
              className={`p-4 border rounded-lg text-left ${
                selectedSession === session.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{session.name}</div>
              <div className="text-sm text-gray-600">{session.phoneNumber}</div>
              {session.stats && (
                <div className="text-xs text-gray-500 mt-1">
                  {session.stats.totalContacts} contacts
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedSession && (
        <>
          {/* Bulk Message Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Message</h2>
            
            {/* Message Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="text-sm text-gray-500 mt-1">
                Characters: {message.length}
              </div>
            </div>

            {/* Delay Setting */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay between messages (milliseconds)
              </label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value) || 2000)}
                min="1000"
                max="10000"
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-500 mt-1">
                Recommended: 2000ms (2 seconds) to avoid being blocked
              </div>
            </div>

            {/* Contact Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Contacts ({selectedContacts.length} selected)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactFilter}
                    onChange={(e) => setContactFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    {selectedContacts.length === getFilteredContacts().length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {loadingContacts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  {getFilteredContacts().map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.number)}
                        onChange={() => handleContactToggle(contact.number)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-600">{contact.number}</div>
                      </div>
                    </label>
                  ))}
                  
                  {getFilteredContacts().length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No contacts found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Ready to send to {selectedContacts.length} contacts
              </div>
              <button
                onClick={handleSendBulkMessage}
                disabled={isSending || selectedContacts.length === 0 || !message.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : 'Send Bulk Message'}
              </button>
            </div>
          </div>

          {/* Progress Display */}
          {progress && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sending Progress</h3>
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.sent + progress.failed) / progress.total * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sent: {progress.sent}</span>
                  <span>Failed: {progress.failed}</span>
                  <span>Total: {progress.total}</span>
                </div>
                {progress.current && (
                  <div className="text-sm text-gray-600">
                    Currently sending to: {progress.current}
                  </div>
                )}
                {progress.error && (
                  <div className="text-sm text-red-600">
                    Error: {progress.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Message History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Message History</h3>
            </div>
            
            {bulkQueues.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No bulk messages sent yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {bulkQueues.map((queue) => (
                  <div key={queue.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            queue.status === 'completed' ? 'bg-green-100 text-green-800' :
                            queue.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            queue.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {queue.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(queue.created_at)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-2">
                          {queue.message_content.substring(0, 100)}
                          {queue.message_content.length > 100 && '...'}
                        </div>
                        
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>Total: {queue.total_count}</span>
                          <span>Sent: {queue.sent_count}</span>
                          <span>Failed: {queue.failed_count}</span>
                          <span>Delay: {queue.delay_ms}ms</span>
                        </div>
                        
                        {queue.error_message && (
                          <div className="text-sm text-red-600 mt-2">
                            Error: {queue.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
