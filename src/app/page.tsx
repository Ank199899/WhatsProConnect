'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import { useRealTime } from '@/contexts/RealTimeContext'
import { useTheme } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import NewDashboard from '@/components/NewDashboard'
import AdvancedTemplateManagementSection from '@/components/AdvancedTemplateManagementSection'
import UltraModernInbox from '@/components/UltraModernInbox'
import WhatsAppNumbers from '@/components/WhatsAppNumbers'
import BulkMessaging from '@/components/BulkMessagingSimple'
import AdvancedAnalytics from '@/components/AdvancedAnalytics'
import AdminUserManagement from '@/components/AdminUserManagement'
import APIManagement from '@/components/APIManagement'

import AdvancedRoleManagement from '@/components/AdvancedRoleManagement'
import ContactsManagement from '@/components/ContactsManagement'
import AIProviderSettings from '@/components/AIProviderSettings'
import UltimateAIManagement from '@/components/UltimateAIManagement'
import LoginCredentialsDisplay from '@/components/LoginCredentialsDisplay'
import FloatingElements from '@/components/FloatingElements'
import { RealTimeProvider } from '@/contexts/RealTimeContext'

function MainApp() {
  // Theme hook
  const { colors, isDark } = useTheme()

  // Real-time context for cross-component sync
  const { data: realTimeData } = useRealTime()

  const [whatsappManager] = useState(() => new WhatsAppManagerClient())
  const [isConnected, setIsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle clicking outside sidebar to expand it
  const handleContentClick = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    }
  }

  // Keyboard shortcut to toggle sidebar (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync sessions from RealTime context
  useEffect(() => {
    if (realTimeData.sessions && realTimeData.sessions.length > 0) {
      console.log('🔄 MainApp: Syncing sessions from RealTime context:', realTimeData.sessions.length)
      setSessions(realTimeData.sessions)
    }
  }, [realTimeData.sessions])

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

    // Disabled automatic refresh to prevent unwanted page refreshes
    // const interval = setInterval(() => {
    //   // Only refresh if not on bulk messaging page to prevent interruption
    //   if (activeTab !== 'bulk') {
    //     loadSessions()
    //   }
    // }, 60000) // Refresh every 60 seconds (reduced frequency)

    return () => {
      // clearInterval(interval) // Disabled since interval is commented out
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
        return <NewDashboard />
      case 'sessions':
        return <WhatsAppNumbers />
      case 'inbox':
        return <UltraModernInbox
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
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                  style={{ borderColor: 'var(--color-primary)' }}
                ></div>
                <p style={{ color: 'var(--color-text-secondary)' }}>Loading WhatsApp sessions...</p>
              </div>
            </div>
          )
        }

        // Use new BulkMessaging component
        return <BulkMessaging />
      case 'templates':
        return <AdvancedTemplateManagementSection />
      case 'analytics':
        return <AdvancedAnalytics />
      case 'ai-providers':
        return <AIProviderSettings />
      case 'admin-users':
        return <AdminUserManagement />
      case 'roles':
        return <AdvancedRoleManagement />
      case 'credentials':
        return <LoginCredentialsDisplay />
      case 'api':
        return <APIManagement />
      case 'settings':
        return (
          <div className="p-6">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >Settings (Coming Soon)</h1>
          </div>
        )
      case 'help':
        return (
          <div className="p-6">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >Help & Support (Coming Soon)</h1>
          </div>
        )
      default:
        return <NewDashboard />
    }
  }

  return (
    <main
      className="flex h-screen relative transition-colors duration-300 liquid-glass-bg"
      style={{
        background: `linear-gradient(135deg,
          rgba(255, 255, 255, 0.02) 0%,
          rgba(255, 255, 255, 0.05) 25%,
          rgba(255, 255, 255, 0.03) 50%,
          rgba(255, 255, 255, 0.06) 75%,
          rgba(255, 255, 255, 0.02) 100%)`
      }}
    >
      {/* Liquid Glass Background Elements */}
      <FloatingElements />

      {/* Glass Orbs for Enhanced Effect */}
      <div className="glass-orb glass-orb-1"></div>
      <div className="glass-orb glass-orb-2"></div>
      <div className="glass-orb glass-orb-3"></div>

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />
      <div
        className={`flex-1 overflow-auto relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : ''}`}
        style={{
          background: `linear-gradient(135deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 25%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.1) 75%,
            rgba(255, 255, 255, 0.04) 100%)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
        onClick={handleContentClick}
      >
        {renderActiveComponent()}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <RealTimeProvider>
          <MainApp />
        </RealTimeProvider>
      </ProtectedRoute>
    </AuthProvider>
  )
}
