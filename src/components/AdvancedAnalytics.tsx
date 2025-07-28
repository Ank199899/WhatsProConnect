'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Target,
  Clock,
  Heart,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar
} from 'lucide-react'

interface AnalyticsData {
  totalMessages: number
  responseRate: number
  avgResponseTime: number
  sentimentScore: number
  deliveryRate: number
  engagementRate: number
  customerSatisfaction: number
  resolvedIssues: number
  topContacts: Array<{ name: string; count: number; sentiment: string }>
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
    color: string
  }>
  trends: {
    messages: number
    responses: number
    satisfaction: number
    engagement: number
  }
}

const timeRanges = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' }
]

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('week')
  const [isLive, setIsLive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch real-time analytics data from API
  const fetchRealTimeData = async (): Promise<AnalyticsData> => {
    try {
      const response = await fetch(`/api/analytics?timeRange=${selectedTimeRange}&live=true`)
      const result = await response.json()

      if (result.success && result.data) {
        // Transform API data to match our interface
        const apiData = result.data
        return {
          totalMessages: apiData.totalMessages || 0,
          responseRate: apiData.responseRate || 0,
          avgResponseTime: apiData.avgResponseTime || 0,
          sentimentScore: apiData.sentimentScore || 0,
          deliveryRate: apiData.aiAccuracy || 0, // Use AI accuracy as delivery rate
          engagementRate: apiData.autoReplyRate || 0, // Use auto-reply rate as engagement
          customerSatisfaction: apiData.customerSatisfaction || 0,
          resolvedIssues: apiData.resolvedIssues || 0,
          topContacts: apiData.topContacts || [],
          categoryBreakdown: (apiData.categoryBreakdown || []).map((cat: any, index: number) => ({
            ...cat,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] || '#6B7280'
          })),
          trends: {
            messages: apiData.totalMessages > (apiData.messagesLast24h || 0) ? 1 : -1,
            responses: apiData.responseRate > 50 ? 1 : -1,
            satisfaction: apiData.customerSatisfaction > 3 ? 1 : -1,
            engagement: apiData.autoReplyRate > 30 ? 1 : -1
          }
        }
      } else {
        // Return empty data structure if no real data
        return {
          totalMessages: 0,
          responseRate: 0,
          avgResponseTime: 0,
          sentimentScore: 0,
          deliveryRate: 0,
          engagementRate: 0,
          customerSatisfaction: 0,
          resolvedIssues: 0,
          topContacts: [],
          categoryBreakdown: [
            { category: 'Support', count: 0, percentage: 0, color: '#3B82F6' },
            { category: 'Sales', count: 0, percentage: 0, color: '#10B981' },
            { category: 'General', count: 0, percentage: 0, color: '#F59E0B' },
            { category: 'Complaints', count: 0, percentage: 0, color: '#EF4444' }
          ],
          trends: {
            messages: 0,
            responses: 0,
            satisfaction: 0,
            engagement: 0
          }
        }
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error)
      // Return empty data on error
      return {
        totalMessages: 0,
        responseRate: 0,
        avgResponseTime: 0,
        sentimentScore: 0,
        deliveryRate: 0,
        engagementRate: 0,
        customerSatisfaction: 0,
        resolvedIssues: 0,
        topContacts: [],
        categoryBreakdown: [
          { category: 'Support', count: 0, percentage: 0, color: '#3B82F6' },
          { category: 'Sales', count: 0, percentage: 0, color: '#10B981' },
          { category: 'General', count: 0, percentage: 0, color: '#F59E0B' },
          { category: 'Complaints', count: 0, percentage: 0, color: '#EF4444' }
        ],
        trends: {
          messages: 0,
          responses: 0,
          satisfaction: 0,
          engagement: 0
        }
      }
    }
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const realData = await fetchRealTimeData()
      setData(realData)
      setIsLoading(false)
    }
    loadData()
  }, [selectedTimeRange])

  // Real-time updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(async () => {
      const realData = await fetchRealTimeData()
      setData(realData)
    }, 10000) // Update every 10 seconds for real data

    return () => clearInterval(interval)
  }, [isLive, selectedTimeRange])

  const handleRefresh = async () => {
    setIsLoading(true)
    const realData = await fetchRealTimeData()
    setData(realData)
    setIsLoading(false)
  }

  const handleExport = () => {
    // Export functionality
    console.log('Exporting analytics data...')
  }

  const handleClearDemoData = async () => {
    if (!confirm('Are you sure you want to clear all demo data? This will remove all sample sessions, messages, and contacts.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/clear-all-demo-data', { method: 'POST' })
      const result = await response.json()

      if (result.success) {
        console.log('Demo data cleared:', result.stats)
        // Refresh analytics after clearing demo data
        const realData = await fetchRealTimeData()
        setData(realData)
      } else {
        console.error('Failed to clear demo data:', result.error)
      }
    } catch (error) {
      console.error('Error clearing demo data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time analytics...</p>
        </div>
      </div>
    )
  }

  // Check if we have any real data
  const hasRealData = data.totalMessages > 0 || data.topContacts.length > 0

  if (!hasRealData && !isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-black">Analytics</h1>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span className="font-bold text-black">No Data</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* No Data Message */}
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-black mb-2">No Analytics Data Available</h3>
            <p className="text-gray-600 mb-4">Start sending WhatsApp messages to see real-time analytics here.</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Connect your WhatsApp sessions</p>
              <p>• Send and receive messages</p>
              <p>• Analytics will appear automatically</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-black">Analytics</h1>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-bold text-black">{isLive ? 'Live' : 'Paused'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${hasRealData ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                <span className="font-bold text-black">{hasRealData ? 'Real Data' : 'No Data'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selector and Actions */}
        <div className="flex items-center space-x-3">
          {/* Time Range Buttons */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setSelectedTimeRange(range.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeRange === range.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>

          <button
            onClick={handleClearDemoData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Clear Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Total Messages</p>
                <p className="text-2xl font-black text-black">{data.totalMessages.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {data.trends.messages > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${data.trends.messages > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.trends.messages > 0 ? '+' : ''}0%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Response Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Response Rate</p>
                <p className="text-2xl font-black text-black">{data.responseRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {data.trends.responses > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${data.trends.responses > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.trends.responses > 0 ? '+' : ''}0%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Average Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Avg Response Time</p>
                <p className="text-2xl font-black text-black">{data.avgResponseTime.toFixed(1)}m</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">-0.5m</span>
            </div>
          </div>
        </motion.div>

        {/* Customer Satisfaction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Customer Satisfaction</p>
                <p className="text-2xl font-black text-black">{data.customerSatisfaction.toFixed(1)}/5</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {data.trends.satisfaction > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${data.trends.satisfaction > 0 ? 'text-green-500' : 'text-red-500'}`}>
                +0.2
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Second Row of Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Delivery Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Delivery Rate</p>
                <p className="text-2xl font-black text-black">{data.deliveryRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-500">0%</span>
            </div>
          </div>
        </motion.div>

        {/* Engagement Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Engagement Rate</p>
                <p className="text-2xl font-black text-black">{data.engagementRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">+1.8%</span>
            </div>
          </div>
        </motion.div>

        {/* Resolved Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Resolved Issues</p>
                <p className="text-2xl font-black text-black">{data.resolvedIssues}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-500">0</span>
            </div>
          </div>
        </motion.div>

        {/* Sentiment Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-black">Sentiment Score</p>
                <p className="text-2xl font-black text-black">{data.sentimentScore.toFixed(1)}/10</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-500">0</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section - Top Contacts and Message Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-black text-black mb-4">Top Contacts</h3>
          <div className="space-y-3">
            {data.topContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-black">{contact.name}</p>
                    <p className="text-sm font-bold text-black">{contact.count} messages</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contact.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  contact.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {contact.sentiment}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Message Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-black text-black mb-4">Message Categories</h3>
          <div className="space-y-4">
            {data.categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-black">{category.category}</span>
                  <span className="text-sm font-bold text-black">{category.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.8 }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-black">{category.count} messages</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-black text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5 text-black" />
            <span className="font-black text-black">Download Report</span>
          </button>

          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-5 h-5 text-black" />
            <span className="font-black text-black">Schedule Report</span>
          </button>

          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-black" />
            <span className="font-black text-black">Advanced Filters</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
