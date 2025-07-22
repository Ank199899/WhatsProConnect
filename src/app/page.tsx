'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import AdvancedDashboard from '@/components/AdvancedDashboard'
// import Inbox from '@/components/Inbox' // Missing component
import NewInbox from '@/components/NewInbox'
import AIInbox from '@/components/AIInbox'
import LiveInbox from '@/components/LiveInbox'
import AdvancedRealTimeInbox from '@/components/AdvancedRealTimeInbox'
import SessionManager from '@/components/SessionManager'
import WhatsAppNumbers from '@/components/WhatsAppNumbers'
import BulkMessaging from '@/components/BulkMessaging'
import Analytics from '@/components/Analytics'
import AdvancedAnalytics from '@/components/AdvancedAnalytics'
import UserManagement from '@/components/UserManagement'
import APIManagement from '@/components/APIManagement'
import TemplateManagement from '@/components/TemplateManagement'
import RoleManagement from '@/components/RoleManagement'
import AdvancedRoleManagement from '@/components/AdvancedRoleManagement'
import ContactsManagement from '@/components/ContactsManagement'
import AIAgentManagement from '@/components/AIAgentManagement'
import AdvancedAIAgentManagement from '@/components/AdvancedAIAgentManagement'
import AIProviderSettings from '@/components/AIProviderSettings'
import UltimateAIManagement from '@/components/UltimateAIManagement'
import LoginCredentialsDisplay from '@/components/LoginCredentialsDisplay'
import FloatingElements from '@/components/FloatingElements'
import { RealTimeProvider } from '@/contexts/RealTimeContext'

function MainApp() {
  const [whatsappManager] = useState(() => new WhatsAppManagerClient())
  const [isConnected, setIsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    // Initialize socket connection
    const socket = whatsappManager.initializeSocket()

    if (socket) {
      socket.on('connect', () => {
        setIsConnected(true)
        loadSessions()
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
      })

      // Listen for real-time session updates
      socket.on('sessions_updated', (updatedSessions: any[]) => {
        setSessions(updatedSessions)
        setSessionsLoading(false)
      })

      socket.on('client_ready', (data: { sessionId: string, phoneNumber: string }) => {
        loadSessions() // Refresh sessions when client becomes ready
      })

      socket.on('client_disconnected', (data: { sessionId: string }) => {
        loadSessions() // Refresh sessions when client disconnects
      })
    }

    // Load sessions on mount
    loadSessions()

    // Set up periodic refresh - only when not on bulk messaging page
    const interval = setInterval(() => {
      // Only refresh if not on bulk messaging page to prevent interruption
      if (activeTab !== 'bulk') {
        loadSessions()
      }
    }, 60000) // Refresh every 60 seconds (reduced frequency)

    return () => {
      clearInterval(interval)
      whatsappManager.disconnect()
    }
  }, [whatsappManager, activeTab])

  const loadSessions = async () => {
    try {
      setSessionsLoading(true)
      const sessionList = await whatsappManager.getSessions()
      setSessions(sessionList)

      // Auto-select first available session if none selected
      if (!selectedSession && sessionList.length > 0) {
        const readySession = sessionList.find((s: any) => s.status === 'ready')
        if (readySession) {
          setSelectedSession(readySession.id)
        } else if (sessionList.length > 0) {
          // If no ready session, select first available
          setSelectedSession(sessionList[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdvancedDashboard />
      case 'sessions':
        return <WhatsAppNumbers />
      case 'inbox':
        return <AdvancedRealTimeInbox
          whatsappManager={whatsappManager}
          sessions={sessions}
          selectedSession={selectedSession}
          onSessionSelected={setSelectedSession}
        />
      case 'contacts':
        return <ContactsManagement />
      case 'ultimate-ai':
        return <UltimateAIManagement />
      case 'bulk':
        if (sessionsLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading WhatsApp sessions...</p>
              </div>
            </div>
          )
        }

        // Use new BulkMessaging component
        return <BulkMessaging
          sessions={sessions.map(session => ({
            id: session.id,
            name: session.name,
            phoneNumber: session.phoneNumber,
            status: session.status,
            isActive: session.isActive
          }))}
          sessionsLoading={sessionsLoading}
        />
      case 'templates':
        return <TemplateManagement />
      case 'analytics':
        return <AdvancedAnalytics />
      case 'ai-providers':
        return <AIProviderSettings />
      case 'users':
        return <UserManagement />
      case 'roles':
        return <AdvancedRoleManagement />
      case 'credentials':
        return <LoginCredentialsDisplay />
      case 'api':
        return <APIManagement />
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings (Coming Soon)</h1></div>
      case 'help':
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support (Coming Soon)</h1></div>
      default:
        return <AdvancedDashboard />
    }
  }

  return (
    <ThemeProvider>
      <RealTimeProvider>
        <main className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50/20 relative">
          {/* Professional Background Elements */}
          <FloatingElements />

          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-auto bg-gradient-to-br from-white/95 via-gray-50/90 to-emerald-50/30 backdrop-blur-sm relative z-10">
            {renderActiveComponent()}
          </div>
        </main>
      </RealTimeProvider>
    </ThemeProvider>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  )
}
