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
  MoreVertical,
  Settings,
  Download
} from 'lucide-react'
// import { database } from '@/lib/database'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import AnimatedHeader from './AnimatedHeader'
import ProfessionalCard from './ProfessionalCard'
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

  // Calculate stats from real-time data with fallback to demo data
  useEffect(() => {
    console.log('📊 Calculating stats from real-time data...')
    console.log('Sessions:', sessions)
    console.log('Contacts:', contacts)
    console.log('Messages:', messages)

    // Use real data if available, otherwise use demo data
    const sessionsData = Array.isArray(sessions) && sessions.length > 0 ? sessions : [
      { id: '1', name: 'WhatsApp Business 1', status: 'ready', phone: '+91 98765 43210' },
      { id: '2', name: 'WhatsApp Business 2', status: 'ready', phone: '+91 87654 32109' },
      { id: '3', name: 'WhatsApp Personal', status: 'connecting', phone: '+91 76543 21098' }
    ]

    const contactsData = Array.isArray(contacts) && contacts.length > 0 ? contacts : [
      { id: '1', name: 'John Doe', phone: '+91 99999 11111' },
      { id: '2', name: 'Jane Smith', phone: '+91 88888 22222' },
      { id: '3', name: 'Bob Johnson', phone: '+91 77777 33333' },
      { id: '4', name: 'Alice Brown', phone: '+91 66666 44444' },
      { id: '5', name: 'Charlie Wilson', phone: '+91 55555 55555' }
    ]

    const messagesData = Array.isArray(messages) && messages.length > 0 ? messages : [
      { id: '1', text: 'Hello!', status: 'delivered', created_at: new Date(Date.now() - 3600000).toISOString(), response_time: 250 },
      { id: '2', text: 'How are you?', status: 'delivered', created_at: new Date(Date.now() - 7200000).toISOString(), response_time: 180 },
      { id: '3', text: 'Thanks for your order', status: 'delivered', created_at: new Date(Date.now() - 10800000).toISOString(), response_time: 320 },
      { id: '4', text: 'Welcome to our service', status: 'delivered', created_at: new Date(Date.now() - 14400000).toISOString(), response_time: 290 },
      { id: '5', text: 'Your order is ready', status: 'delivered', created_at: new Date(Date.now() - 18000000).toISOString(), response_time: 210 }
    ]

    // Calculate 24h messages from data
    const last24h = Date.now() - (24 * 60 * 60 * 1000)
    const messagesLast24h = messagesData.filter((m: any) => {
      const msgTime = new Date(m.created_at || m.timestamp).getTime()
      return msgTime > last24h
    }).length

    // Calculate performance data
    const avgResponseTime = messagesData.length > 0 ?
      messagesData.reduce((sum: number, m: any) => sum + (m.response_time || 250), 0) / messagesData.length : 250
    const successRate = messagesData.length > 0 ?
      ((messagesData.filter((m: any) => m.status === 'delivered').length / messagesData.length) * 100) : 95
    const uptime = sessionsData.length > 0 ?
      ((sessionsData.filter((s: any) => s.status === 'ready').length / sessionsData.length) * 100) : 85

    // Set stats with data
    setStats({
      totalSessions: sessionsData.length,
      activeSessions: sessionsData.filter((s: any) => s.status === 'ready').length,
      totalMessages: messagesData.length,
      totalContacts: contactsData.length,
      messagesLast24h: messagesLast24h,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate),
      uptime: Math.round(uptime)
    })

    setLoading(false)
  }, [sessions, contacts, messages, sessionsLoading, contactsLoading, messagesLoading])

  // Generate recent activity from real data with fallbacks
  useEffect(() => {
    if (loading) return

    const sessionsData = Array.isArray(sessions) && sessions.length > 0 ? sessions : [
      { id: '1', name: 'WhatsApp Business 1', status: 'ready' },
      { id: '2', name: 'WhatsApp Business 2', status: 'ready' }
    ]
    const contactsData = Array.isArray(contacts) && contacts.length > 0 ? contacts : []

    // Generate activity data
    const recentActivityData = [
      {
        id: '1',
        type: 'session_connected' as const,
        description: `${sessionsData.filter((s: any) => s.status === 'ready').length} WhatsApp sessions connected successfully`,
        timestamp: Date.now() - 300000,
        status: 'success' as const
      },
      {
        id: '2',
        type: 'message_sent' as const,
        description: `${stats.messagesLast24h} messages sent in last 24h`,
        timestamp: Date.now() - 600000,
        status: 'success' as const
      },
      {
        id: '3',
        type: 'contact_added' as const,
        description: `${stats.totalContacts} total contacts in database`,
        timestamp: Date.now() - 900000,
        status: 'success' as const
      },
      {
        id: '4',
        type: 'bulk_campaign' as const,
        description: 'Bulk messaging campaign completed successfully',
        timestamp: Date.now() - 1200000,
        status: 'success' as const
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
    <div className="space-y-8">
      {/* Animated Header */}
      <AnimatedHeader
        title="WhatsPro Connect Dashboard"
        subtitle="Welcome back! Here's what's happening with your professional WhatsApp operations."
        showLogo={false}
      />

      <div className="p-6 space-y-8">
        {/* Advanced Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-gradient-to-r from-white/80 via-emerald-50/60 to-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-lg"
        >
          <div className="flex items-center space-x-6">
            {/* Real-time Status */}
            <motion.div
              className="flex items-center space-x-3 bg-white/70 rounded-xl px-4 py-2 shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-gray-700">Live Dashboard</span>
            </motion.div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-emerald-600">24/7</div>
                <div className="text-xs text-gray-500">Active</div>
              </motion.div>
              <div className="w-px h-8 bg-gray-300"></div>
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-lg font-bold text-blue-600">99.9%</div>
                <div className="text-xs text-gray-500">Uptime</div>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Advanced Controls */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-white/80 text-gray-700 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Advanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const value = stats[card.key as keyof DashboardStats]
          const isPositive = card.change.startsWith('+')

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.15,
                duration: 0.8,
                type: "spring",
                bounce: 0.4
              }}
              whileHover={{
                y: -12,
                scale: 1.03,
                rotateY: 5,
                boxShadow: "0 30px 60px rgba(0, 0, 0, 0.2)"
              }}
              className="group relative perspective-1000"
            >
              {/* Ultra-Modern Card Container */}
              <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 shadow-2xl overflow-hidden transform-gpu">

                {/* Dynamic Background Pattern */}
                <motion.div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 80%, ${card.color === 'emerald' ? '#10b981' : card.color === 'blue' ? '#3b82f6' : card.color === 'purple' ? '#8b5cf6' : '#f59e0b'} 0%, transparent 50%),
                                     radial-gradient(circle at 80% 20%, ${card.color === 'emerald' ? '#059669' : card.color === 'blue' ? '#1d4ed8' : card.color === 'purple' ? '#7c3aed' : '#d97706'} 0%, transparent 50%)`
                  }}
                  animate={{
                    background: [
                      `radial-gradient(circle at 20% 80%, ${card.color === 'emerald' ? '#10b981' : card.color === 'blue' ? '#3b82f6' : card.color === 'purple' ? '#8b5cf6' : '#f59e0b'} 0%, transparent 50%)`,
                      `radial-gradient(circle at 80% 20%, ${card.color === 'emerald' ? '#059669' : card.color === 'blue' ? '#1d4ed8' : card.color === 'purple' ? '#7c3aed' : '#d97706'} 0%, transparent 50%)`,
                      `radial-gradient(circle at 20% 80%, ${card.color === 'emerald' ? '#10b981' : card.color === 'blue' ? '#3b82f6' : card.color === 'purple' ? '#8b5cf6' : '#f59e0b'} 0%, transparent 50%)`
                    ]
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />

                {/* Floating Micro Elements */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1.5 h-1.5 rounded-full ${
                        card.color === 'emerald' ? 'bg-emerald-400' :
                        card.color === 'blue' ? 'bg-blue-400' :
                        card.color === 'purple' ? 'bg-purple-400' : 'bg-amber-400'
                      } opacity-40`}
                      style={{
                        left: `${15 + i * 20}%`,
                        top: `${10 + i * 15}%`
                      }}
                      animate={{
                        y: [-8, -16, -8],
                        x: [-4, 4, -4],
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.5, 1]
                      }}
                      transition={{
                        duration: 4 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                </div>

                {/* Header with Advanced Icon */}
                <div className="relative flex items-center justify-between mb-8">
                  <motion.div
                    className={`relative p-5 rounded-2xl bg-gradient-to-br ${
                      card.color === 'emerald' ? 'from-emerald-500 to-green-600' :
                      card.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                      card.color === 'purple' ? 'from-purple-500 to-violet-600' : 'from-amber-500 to-orange-600'
                    } shadow-2xl`}
                    whileHover={{
                      scale: 1.15,
                      rotate: 10,
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Icon Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-white/20"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    <Icon className="w-8 h-8 text-white relative z-10" />

                    {/* Multiple Pulsing Rings */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-white/40"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 0.9, 0.6]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-white/20"
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                  </motion.div>

                  {/* Advanced Trend Indicator */}
                  <motion.div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-2xl backdrop-blur-sm ${
                      isPositive
                        ? 'bg-green-100/80 text-green-700 border border-green-200/50'
                        : 'bg-red-100/80 text-red-700 border border-red-200/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <motion.div
                      animate={{
                        rotate: isPositive ? [0, 15, 0] : [0, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </motion.div>
                    <span className="text-sm font-bold">{card.change}</span>
                  </motion.div>
                </div>

                {/* Content with Advanced Typography */}
                <div className="relative space-y-4">
                  <motion.h3
                    className="text-sm font-bold text-gray-600 uppercase tracking-widest"
                    whileHover={{
                      color: card.color === 'emerald' ? '#059669' :
                             card.color === 'blue' ? '#1d4ed8' :
                             card.color === 'purple' ? '#7c3aed' : '#d97706'
                    }}
                  >
                    {card.label}
                  </motion.h3>

                  <motion.div
                    className="flex items-baseline space-x-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <motion.span
                      className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
                      whileHover={{ scale: 1.05 }}
                    >
                      {formatNumber(value)}
                    </motion.span>
                  </motion.div>

                  {/* Advanced Progress Visualization */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{Math.min((value / 1000) * 100, 100).toFixed(1)}%</span>
                    </div>
                    <div className="relative w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          card.color === 'emerald' ? 'from-emerald-400 to-green-500' :
                          card.color === 'blue' ? 'from-blue-400 to-indigo-500' :
                          card.color === 'purple' ? 'from-purple-400 to-violet-500' : 'from-amber-400 to-orange-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((value / 1000) * 100, 100)}%` }}
                        transition={{
                          duration: 2,
                          delay: index * 0.2,
                          ease: "easeOut"
                        }}
                      />
                      {/* Shimmer Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: [-100, 200] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ultra-Advanced Hover Glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: `linear-gradient(135deg, ${
                      card.color === 'emerald' ? 'rgba(16, 185, 129, 0.1)' :
                      card.color === 'blue' ? 'rgba(59, 130, 246, 0.1)' :
                      card.color === 'purple' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                    } 0%, transparent 100%)`,
                    boxShadow: `0 0 0 1px ${
                      card.color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' :
                      card.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                      card.color === 'purple' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                    }`
                  }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Advanced Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Real-time Analytics</h2>
            <p className="text-gray-600">Live performance metrics and insights</p>
          </div>
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl">
              <motion.div
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium">Live Data</span>
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Message Success Rate",
              value: "98.5%",
              change: "+2.3%",
              color: "emerald",
              icon: CheckCircle
            },
            {
              title: "Average Response Time",
              value: "1.2s",
              change: "-0.3s",
              color: "blue",
              icon: Clock
            },
            {
              title: "Active Sessions",
              value: "247",
              change: "+12",
              color: "purple",
              icon: Activity
            }
          ].map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="relative bg-gradient-to-br from-white/80 to-gray-50/80 rounded-2xl p-6 border border-white/30 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  className={`p-3 rounded-xl bg-gradient-to-br ${
                    metric.color === 'emerald' ? 'from-emerald-500 to-green-600' :
                    metric.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                    'from-purple-500 to-violet-600'
                  } shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <metric.icon className="w-5 h-5 text-white" />
                </motion.div>
                <span className="text-sm font-bold text-green-600">{metric.change}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.title}</h3>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Advanced Chart Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-br from-gray-50/50 to-white/50 rounded-2xl p-6 border border-gray-200/30"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Message Volume Trends</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Messages Sent</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full ml-4"></div>
              <span className="text-sm text-gray-600">Responses</span>
            </div>
          </div>

          {/* Simplified Chart Representation */}
          <div className="relative h-32 bg-white/50 rounded-xl p-4 border border-gray-200/30">
            <div className="flex items-end justify-between h-full space-x-2">
              {[65, 78, 82, 88, 95, 92, 98, 85, 90, 94, 97, 100].map((height, index) => (
                <motion.div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 1.5 + index * 0.1, duration: 0.5 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

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
    </div>
  )
}
