'use client'

import { useState, useEffect } from 'react'
import { WhatsAppManagerClient, SessionStatus } from '@/lib/whatsapp-manager'
import { useTheme } from '@/contexts/ThemeContext'

interface AnalyticsProps {
  whatsappManager: WhatsAppManagerClient
  sessions: SessionStatus[]
}

interface SessionStats {
  id: string
  name: string
  phoneNumber?: string
  totalContacts: number
  totalMessages: number
  messagesLast24h: number
  totalBulkCampaigns: number
  totalBulkMessagesSent: number
}

export default function Analytics({ whatsappManager, sessions }: AnalyticsProps) {
  // Theme hook
  const { colors, isDark } = useTheme()

  const [stats, setStats] = useState<SessionStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [sessions])

  const loadStats = async () => {
    setLoading(true)
    try {
      // In a real implementation, you would fetch this data from the database
      // For now, we'll simulate it with the data we have
      const sessionStats = sessions.map(session => ({
        id: session.id,
        name: session.name,
        phoneNumber: session.phoneNumber,
        totalContacts: session.stats?.totalContacts || 0,
        totalMessages: session.stats?.totalMessages || 0,
        messagesLast24h: Math.floor(Math.random() * (session.stats?.totalMessages || 0)),
        totalBulkCampaigns: Math.floor(Math.random() * 5),
        totalBulkMessagesSent: Math.floor(Math.random() * 100)
      }))
      
      setStats(sessionStats)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalStats = () => {
    return {
      totalSessions: stats.length,
      activeSessions: stats.filter(s => s.phoneNumber).length,
      totalContacts: stats.reduce((sum, s) => sum + s.totalContacts, 0),
      totalMessages: stats.reduce((sum, s) => sum + s.totalMessages, 0),
      messagesLast24h: stats.reduce((sum, s) => sum + s.messagesLast24h, 0),
      totalBulkCampaigns: stats.reduce((sum, s) => sum + s.totalBulkCampaigns, 0),
      totalBulkMessagesSent: stats.reduce((sum, s) => sum + s.totalBulkMessagesSent, 0)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  const totalStats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="rounded-lg shadow p-6 transition-colors duration-300"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <div
            className="text-sm font-medium mb-1"
            style={{ color: colors.text.secondary }}
          >Total Sessions</div>
          <div className="flex items-end space-x-2">
            <div
              className="text-3xl font-bold"
              style={{ color: colors.text.primary }}
            >{totalStats.totalSessions}</div>
            <div
              className="text-sm mb-1"
              style={{ color: colors.primary }}
            >
              {totalStats.activeSessions} active
            </div>
          </div>
        </div>

        <div
          className="rounded-lg shadow p-6 transition-colors duration-300"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <div
            className="text-sm font-medium mb-1"
            style={{ color: colors.text.secondary }}
          >Total Contacts</div>
          <div
            className="text-3xl font-bold"
            style={{ color: colors.text.primary }}
          >{totalStats.totalContacts}</div>
        </div>
        
        <div
          className="rounded-lg shadow p-6 transition-colors duration-300"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <div
            className="text-sm font-medium mb-1"
            style={{ color: colors.text.secondary }}
          >Total Messages</div>
          <div className="flex items-end space-x-2">
            <div
              className="text-3xl font-bold"
              style={{ color: colors.text.primary }}
            >{totalStats.totalMessages}</div>
            <div
              className="text-sm mb-1"
              style={{ color: colors.accent }}
            >
              {totalStats.messagesLast24h} in last 24h
            </div>
          </div>
        </div>

        <div
          className="rounded-lg shadow p-6 transition-colors duration-300"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <div
            className="text-sm font-medium mb-1"
            style={{ color: colors.text.secondary }}
          >Bulk Messages</div>
          <div className="flex items-end space-x-2">
            <div
              className="text-3xl font-bold"
              style={{ color: colors.text.primary }}
            >{totalStats.totalBulkMessagesSent}</div>
            <div
              className="text-sm mb-1"
              style={{ color: colors.secondary }}
            >
              {totalStats.totalBulkCampaigns} campaigns
            </div>
          </div>
        </div>
      </div>

      {/* Session Stats Table */}
      <div
        className="rounded-lg shadow overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: colors.background.secondary }}
      >
        <div
          className="px-6 py-4 border-b transition-colors duration-300"
          style={{ borderColor: `${colors.border}40` }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >Session Statistics</h3>
        </div>

        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y transition-colors duration-300"
            style={{ borderColor: `${colors.border}40` }}
          >
            <thead
              className="transition-colors duration-300"
              style={{ backgroundColor: colors.background.tertiary }}
            >
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Session
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Phone Number
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Contacts
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Messages
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: colors.text.secondary }}
                >
                  Last 24h
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulk Campaigns
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulk Messages
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{session.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{session.phoneNumber || 'Not connected'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    {session.totalContacts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    {session.totalMessages}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    {session.messagesLast24h}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    {session.totalBulkCampaigns}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    {session.totalBulkMessagesSent}
                  </td>
                </tr>
              ))}
              
              {stats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No sessions available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Analytics Tips</h3>
        <ul className="list-disc list-inside space-y-2 text-blue-800">
          <li>Connect multiple WhatsApp numbers to increase your messaging capacity</li>
          <li>Use bulk messaging for marketing campaigns or announcements</li>
          <li>Monitor message volume to avoid being blocked by WhatsApp</li>
          <li>Keep your sessions active by using them regularly</li>
        </ul>
      </div>
    </div>
  )
}
