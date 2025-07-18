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
import AdvancedCampaigns from '@/components/AdvancedCampaigns'
import Analytics from '@/components/Analytics'
import AdvancedAnalytics from '@/components/AdvancedAnalytics'
import UserManagement from '@/components/UserManagement'
import APIManagement from '@/components/APIManagement'

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
        return <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts (Coming Soon)</h1></div>
      case 'bulk':
        return <AdvancedCampaigns whatsappManager={whatsappManager} selectedSession={selectedSession} />
      case 'analytics':
        return <AdvancedAnalytics />
      case 'users':
        return <UserManagement />
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
      <main className="flex h-screen bg-white">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto bg-gray-50">
          {renderActiveComponent()}
        </div>
      </main>
    </ThemeProvider>
  )
}
