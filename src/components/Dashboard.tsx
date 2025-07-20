'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient, SessionStatus } from '@/lib/whatsapp-manager'
import WhatsAppNumberManager from './SessionManager'
import Inbox from './Inbox'
import BulkMessaging from './BulkMessaging'
import Analytics from './Analytics'

interface DashboardProps {
  whatsappManager: WhatsAppManagerClient
  isConnected: boolean
}

export default function Dashboard({ whatsappManager, isConnected }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('sessions')
  const [sessions, setSessions] = useState<SessionStatus[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const sessionList = await whatsappManager.getSessions()
      setSessions(sessionList)
      
      // Auto-select first ready session
      const readySession = sessionList.find(s => s.status === 'ready')
      if (readySession && !selectedSession) {
        setSelectedSession(readySession.id)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionCreated = () => {
    loadSessions()
  }

  const handleSessionDeleted = () => {
    loadSessions()
    setSelectedSession(null)
  }

  const tabs = [
    { id: 'sessions', name: 'WhatsApp Numbers', icon: '📱' },
    { id: 'inbox', name: 'Inbox', icon: '💬' },
    { id: 'bulk', name: 'Bulk Messaging', icon: '📢' },
    { id: 'analytics', name: 'Analytics', icon: '📊' }
  ]

  const readySessions = sessions.filter(s => s.status === 'ready')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                WhatsApp Advanced Web App
              </h1>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Active Sessions: <span className="font-semibold text-green-600">{readySessions.length}</span>
              </div>
              <div className="text-sm text-gray-600">
                Total Sessions: <span className="font-semibold">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'sessions' && (
              <WhatsAppNumberManager
                whatsappManager={whatsappManager}
                sessions={sessions}
                onSessionCreated={handleSessionCreated}
                onSessionDeleted={handleSessionDeleted}
                onSessionSelected={setSelectedSession}
                selectedSession={selectedSession}
              />
            )}

            {activeTab === 'inbox' && (
              <Inbox
                whatsappManager={whatsappManager}
                sessions={readySessions}
                selectedSession={selectedSession}
                onSessionSelected={setSelectedSession}
              />
            )}

            {activeTab === 'bulk' && (
              <BulkMessaging
                whatsappManager={whatsappManager}
                sessions={readySessions}
                selectedSession={selectedSession}
                onSessionSelected={setSelectedSession}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics
                whatsappManager={whatsappManager}
                sessions={sessions}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
