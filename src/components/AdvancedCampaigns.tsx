'use client'

import React, { useState, useEffect } from 'react'
import AdvancedBulkMessaging from './AdvancedBulkMessaging'

interface AdvancedCampaignsProps {
  selectedSession: string | null
  sessions?: any[]
  templates?: any[]
  onSessionSelected?: (sessionId: string) => void
}

const AdvancedCampaigns: React.FC<AdvancedCampaignsProps> = ({
  selectedSession,
  sessions = [],
  templates = [],
  onSessionSelected
}) => {
  // Load templates from API
  const [apiTemplates, setApiTemplates] = useState<any[]>([])

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      if (data.success) {
        console.log('📝 AdvancedCampaigns - Templates loaded from API:', data.templates.length)
        setApiTemplates(data.templates)
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error)
    }
  }

  // Mock templates data for demo (fallback only)
  const [mockTemplates, setMockTemplates] = useState([
    {
      id: 'template1',
      name: 'Welcome Message',
      message: 'Welcome to our service! We are excited to have you on board.',
      category: 'Welcome',
      variables: ['{{name}}', '{{company}}'],
      isApproved: true,
      createdAt: '2024-01-15'
    },
    {
      id: 'template2',
      name: 'Product Launch',
      message: 'Exciting news! Our new product {{product_name}} is now available.',
      category: 'Marketing',
      variables: ['{{product_name}}', '{{price}}'],
      isApproved: true,
      createdAt: '2024-01-16'
    }
  ])

  // Convert real sessions to campaign format
  const convertSessionsToCampaignFormat = (realSessions: any[]) => {
    return realSessions.map(session => {
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
    })
  }

  // Real sessions data from API
  const [realSessions, setRealSessions] = useState([])

  // Load real WhatsApp sessions
  useEffect(() => {
    const loadRealSessions = async () => {
      try {
        const response = await fetch('/api/whatsapp/sessions')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.sessions) {
            const mappedSessions = data.sessions.map((session: any) => ({
              id: session.id,
              name: session.name,
              phone: session.phoneNumber,
              status: session.status === 'connected' ? 'active' : 'inactive',
              lastUsed: new Date(session.lastActivity).toLocaleDateString(),
              messagesSent: session.messageCount || 0,
              isBlocked: false
            }))
            setRealSessions(mappedSessions)
          }
        }
      } catch (error) {
        console.error('Failed to load real sessions:', error)
      }
    }

    loadRealSessions()
  }, [])

  // Use provided data or fallback to mock data
  const finalTemplates = apiTemplates.length > 0 ? apiTemplates.map(t => ({
    ...t,
    message: t.content, // Map content to message for compatibility
    isApproved: t.status === 'active'
  })) : (templates.length > 0 ? templates : mockTemplates)

  // Use real sessions if available, otherwise fallback to provided sessions
  const finalSessions = realSessions.length > 0 ? realSessions :
                       (sessions.length > 0 ? convertSessionsToCampaignFormat(sessions) : [])

  console.log('🔄 AdvancedCampaigns - Sessions received:', sessions.length)
  console.log('📝 AdvancedCampaigns - Templates (API):', apiTemplates.length)
  console.log('📝 AdvancedCampaigns - Templates (props):', templates.length)
  console.log('📊 Final sessions for campaign:', finalSessions)
  console.log('📋 Final templates for campaign:', finalTemplates)

  return (
    <AdvancedBulkMessaging
      selectedSession={selectedSession}
      sessions={finalSessions}
      templates={finalTemplates}
      onSessionSelected={onSessionSelected}
    />
  )
}

export default AdvancedCampaigns
