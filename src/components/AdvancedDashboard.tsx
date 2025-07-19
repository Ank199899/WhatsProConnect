'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRealTimeSessions, useRealTimeContacts, useRealTimeMessages, useRealTimeAnalytics } from '@/hooks/useRealTimeSync'
import {
  Smartphone,
  MessageCircle,
  Users,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react'
// import { database } from '@/lib/database'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import { cn, formatNumber, getTimeAgo } from '@/lib/utils'

interface DashboardStats {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  totalContacts: number
  messagesLast24h: number
  avgResponseTime: number
  successRate: number
  uptime: number
}

interface RecentActivity {
  id: string
  type: 'session_connected' | 'message_sent' | 'contact_added' | 'bulk_campaign'
  description: string
  timestamp: number
  status: 'success' | 'warning' | 'error'
}

const statCards = [
  {
    key: 'totalSessions',
    label: 'Total Sessions',
    icon: Smartphone,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    change: '+12%'
  },
  {
    key: 'activeSessions', 
    label: 'Active Sessions',
    icon: CheckCircle,
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    change: '+8%'
  },
  {
    key: 'totalMessages',
    label: 'Total Messages',
    icon: MessageCircle,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    change: '+24%'
  },
  {
    key: 'totalContacts',
    label: 'Total Contacts', 
    icon: Users,
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    change: '+16%'
  }
]

const performanceCards = [
  {
    key: 'messagesLast24h',
    label: 'Messages (24h)',
    icon: TrendingUp,
    color: 'indigo',
    suffix: ''
  },
  {
    key: 'avgResponseTime',
    label: 'Avg Response Time',
    icon: Clock,
    color: 'pink',
    suffix: 'ms'
  },
  {
    key: 'successRate',
    label: 'Success Rate',
    icon: Zap,
    color: 'emerald',
    suffix: '%'
  },
  {
    key: 'uptime',
    label: 'Uptime',
    icon: Activity,
    color: 'cyan',
    suffix: '%'
  }
]

export default function AdvancedDashboard() {
  // Real-time data hooks
  const { data: sessions, loading: sessionsLoading, refresh: refreshSessions } = useRealTimeSessions()
  const { data: contacts, loading: contactsLoading } = useRealTimeContacts()
  const { data: messages, loading: messagesLoading } = useRealTimeMessages()
  const { data: analytics, loading: analyticsLoading } = useRealTimeAnalytics()

  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalMessages: 0,
    totalContacts: 0,
    messagesLast24h: 0,
    avgResponseTime: 0,
    successRate: 0,
    uptime: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate stats from real-time data
  useEffect(() => {
    if (sessionsLoading || contactsLoading || messagesLoading) {
      setLoading(true)
      return
    }

    console.log('📊 Calculating stats from real-time data...')
    console.log('Sessions:', sessions)
    console.log('Contacts:', contacts)
    console.log('Messages:', messages)

    // Calculate 24h messages from real data
    const last24h = Date.now() - (24 * 60 * 60 * 1000)
    const messagesLast24h = messages.filter((m: any) => {
      const msgTime = new Date(m.created_at || m.timestamp).getTime()
      return msgTime > last24h
    }).length

    // Calculate real performance data
    const avgResponseTime = messages.length > 0 ?
      messages.reduce((sum: number, m: any) => sum + (m.response_time || 300), 0) / messages.length : 300
    const successRate = messages.length > 0 ?
      ((messages.filter((m: any) => m.status === 'delivered').length / messages.length) * 100) : 95
    const uptime = sessions.length > 0 ?
      ((sessions.filter((s: any) => s.status === 'ready').length / sessions.length) * 100) : 100

    setStats({
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s: any) => s.status === 'ready').length,
      totalMessages: messages.length,
      totalContacts: contacts.length,
      messagesLast24h,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate),
      uptime: Math.round(uptime)
    })

    setLoading(false)
  }, [sessions, contacts, messages, sessionsLoading, contactsLoading, messagesLoading])

  // Generate recent activity from real data
  useEffect(() => {
    if (loading) return

    const recentActivityData = [
      {
        id: '1',
        type: 'session_connected',
        description: `${sessions.filter((s: any) => s.status === 'ready').length} WhatsApp sessions active`,
        timestamp: Date.now() - 300000,
        status: 'success'
      },
      {
        id: '2',
        type: 'message_sent',
        description: `${stats.messagesLast24h} messages sent in last 24h`,
        timestamp: Date.now() - 600000,
        status: 'success'
      },
      {
        id: '3',
        type: 'contact_added',
        description: `${contacts.length} total contacts in database`,
        timestamp: Date.now() - 900000,
        status: 'success'
      }
    ]

    setRecentActivity(recentActivityData)
  }, [sessions, contacts, stats, loading])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-200 h-64 rounded-xl"></div>
            <div className="bg-gray-200 h-64 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your WhatsApp operations.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const value = stats[card.key as keyof DashboardStats]
          const isPositive = card.change.startsWith('+')
          
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="elevated" hover className="relative overflow-hidden">
                <div className={cn(
                  'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-8 -translate-y-8',
                  `bg-gradient-to-br ${card.gradient}`
                )} />
                
                <CardContent className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      `bg-${card.color}-100${card.color}-900/30`
                    )}>
                      <Icon className={cn(
                        'w-6 h-6',
                        `text-${card.color}-600${card.color}-400`
                      )} />
                    </div>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.label}
                    </p>
                    <div className="flex items-end justify-between mt-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatNumber(value)}
                      </p>
                      <div className={cn(
                        'flex items-center text-sm font-medium',
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}>
                        {isPositive ? (
                          <ArrowUpRight size={16} className="mr-1" />
                        ) : (
                          <ArrowDownRight size={16} className="mr-1" />
                        )}
                        {card.change}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Performance Metrics & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <div className="lg:col-span-2">
          <Card variant="elevated">
            <CardHeader title="Performance Metrics" />
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {performanceCards.map((card, index) => {
                  const Icon = card.icon
                  const value = stats[card.key as keyof DashboardStats]
                  
                  return (
                    <motion.div
                      key={card.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          `bg-${card.color}-100${card.color}-900/30`
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            `text-${card.color}-600${card.color}-400`
                          )} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            {card.label}
                          </p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatNumber(value)}{card.suffix}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card variant="elevated">
            <CardHeader title="Recent Activity" />
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-2',
                      activity.status === 'success' && 'bg-green-500',
                      activity.status === 'warning' && 'bg-yellow-500',
                      activity.status === 'error' && 'bg-red-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
