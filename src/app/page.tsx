'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient } from '@/lib/whatsapp-manager'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Sidebar from '@/components/Sidebar'
import AdvancedDashboard from '@/components/AdvancedDashboard'
import Inbox from '@/components/Inbox'
import AIInbox from '@/components/AIInbox'
import LiveInbox from '@/components/LiveInbox'
import SessionManager from '@/components/SessionManager'
import WhatsAppNumbers from '@/components/WhatsAppNumbers'
import BulkMessaging from '@/components/BulkMessaging'
import AdvancedBulkMessaging from '@/components/AdvancedBulkMessaging'
import Analytics from '@/components/Analytics'
import AdvancedAnalytics from '@/components/AdvancedAnalytics'
import UserManagement from '@/components/UserManagement'
import APIManagement from '@/components/APIManagement'
import TemplateManagement from '@/components/TemplateManagement'
import RoleManagement from '@/components/RoleManagement'
import ContactsManagement from '@/components/ContactsManagement'
import AIAgentManagement from '@/components/AIAgentManagement'
import AdvancedAIAgentManagement from '@/components/AdvancedAIAgentManagement'
import AIProviderSettings from '@/components/AIProviderSettings'
import UltimateAIManagement from '@/components/UltimateAIManagement'
import FloatingElements from '@/components/FloatingElements'
import { RealTimeProvider } from '@/contexts/RealTimeContext'

export default function Home() {
  const [whatsappManager] = useState(() => new WhatsAppManagerClient())
  const [isConnected, setIsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])

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
    }

    // Load sessions on mount
    loadSessions()

    return () => {
      whatsappManager.disconnect()
    }
  }, [whatsappManager])

  const loadSessions = async () => {
    try {
      const sessionList = await whatsappManager.getSessions()
      setSessions(sessionList)
      console.log('📱 Main App - Sessions loaded:', sessionList.length, sessionList)

      // Auto-select first available session if none selected
      if (!selectedSession && sessionList.length > 0) {
        const readySession = sessionList.find((s: any) => s.status === 'ready')
        if (readySession) {
          setSelectedSession(readySession.id)
          console.log('🎯 Auto-selected session:', readySession.id)
        } else if (sessionList.length > 0) {
          // If no ready session, select first available
          setSelectedSession(sessionList[0].id)
          console.log('🎯 Auto-selected first session:', sessionList[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    }
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdvancedDashboard />
      case 'sessions':
        return <WhatsAppNumbers />
      case 'inbox':
        return <Inbox
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
        return <AdvancedBulkMessaging
          sessions={sessions.map(session => {
            const isActive = session.status === 'ready' || session.isActive
            const isBlocked = session.status === 'auth_failure' || session.status === 'disconnected'

            return {
              id: session.id,
              name: session.name,
              phone: session.phoneNumber || session.phone_number || 'Not Connected',
              status: isActive ? 'active' : 'inactive',
              lastUsed: session.createdAt || new Date().toISOString().split('T')[0],
              messagesSent: session.stats?.totalMessages || 0,
              isBlocked: isBlocked
            }
          })}
          selectedSession={selectedSession}
          onSessionSelected={setSelectedSession}
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
        return <RoleManagement />
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
