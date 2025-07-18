'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Clock, 
  Target,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Brain,
  Zap,
  Heart,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import { cn, formatNumber } from '@/lib/utils'

interface AnalyticsData {
  totalMessages: number
  responseRate: number
  avgResponseTime: number
  sentimentScore: number
  aiAccuracy: number
  autoReplyRate: number
  customerSatisfaction: number
  urgentMessages: number
  resolvedIssues: number
  topContacts: Array<{ name: string; count: number; sentiment: string }>
  categoryBreakdown: Array<{ category: string; count: number; percentage: number }>
}

const timeRanges = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' }
]

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState('week')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        totalMessages: 2847,
        responseRate: 94.5,
        avgResponseTime: 1.8,
        sentimentScore: 78.2,
        aiAccuracy: 91.7,
        autoReplyRate: 67.3,
        customerSatisfaction: 4.6,
        urgentMessages: 23,
        resolvedIssues: 156,
        topContacts: [
          { name: '+91 98765 43210', count: 89, sentiment: 'positive' },
          { name: '+91 87654 32109', count: 67, sentiment: 'neutral' },
          { name: '+91 76543 21098', count: 54, sentiment: 'negative' },
          { name: '+91 65432 10987', count: 43, sentiment: 'positive' },
          { name: '+91 54321 09876', count: 38, sentiment: 'neutral' }
        ],
        categoryBreakdown: [
          { category: 'Support', count: 1247, percentage: 43.8 },
          { category: 'Sales', count: 856, percentage: 30.1 },
          { category: 'General', count: 512, percentage: 18.0 },
          { category: 'Complaints', count: 232, percentage: 8.1 }
        ]
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const mainStats = [
    {
      label: 'Total Messages',
      value: formatNumber(data.totalMessages),
      change: '+12.5%',
      icon: MessageCircle,
      color: 'blue',
      trend: 'up'
    },
    {
      label: 'Response Rate',
      value: `${data.responseRate}%`,
      change: '+2.3%',
      icon: Target,
      color: 'green',
      trend: 'up'
    },
    {
      label: 'Avg Response Time',
      value: `${data.avgResponseTime}m`,
      change: '-0.5m',
      icon: Clock,
      color: 'purple',
      trend: 'down'
    },
    {
      label: 'Customer Satisfaction',
      value: `${data.customerSatisfaction}/5`,
      change: '+0.2',
      icon: Heart,
      color: 'pink',
      trend: 'up'
    }
  ]

  const aiStats = [
    {
      label: 'AI Accuracy',
      value: `${data.aiAccuracy}%`,
      change: '+3.1%',
      icon: Brain,
      color: 'indigo'
    },
    {
      label: 'Auto-Reply Rate',
      value: `${data.autoReplyRate}%`,
      change: '+5.7%',
      icon: Zap,
      color: 'yellow'
    },
    {
      label: 'Sentiment Score',
      value: `${data.sentimentScore}%`,
      change: '+1.8%',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      label: 'Resolved Issues',
      value: formatNumber(data.resolvedIssues),
      change: '+18',
      icon: CheckCircle,
      color: 'teal'
    }
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Advanced Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your WhatsApp operations and AI performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {timeRanges.map((range) => (
              <Button
                key={range.id}
                variant={selectedRange === range.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRange(range.id)}
                className="px-3 py-1"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            icon={<RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />}
          >
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.trend === 'up'
          
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="elevated" hover className="relative overflow-hidden">
                <div className={cn(
                  'absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-8 -translate-y-8',
                  `bg-${stat.color}-500`
                )} />
                
                <CardContent className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      `bg-${stat.color}-100 dark:bg-${stat.color}-900/30`
                    )}>
                      <Icon className={cn(
                        'w-6 h-6',
                        `text-${stat.color}-600 dark:text-${stat.color}-400`
                      )} />
                    </div>
                    <div className={cn(
                      'flex items-center text-sm font-medium',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}>
                      {isPositive ? (
                        <ArrowUpRight size={16} className="mr-1" />
                      ) : (
                        <ArrowDownRight size={16} className="mr-1" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* AI Performance Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-600" />
          AI Performance Metrics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aiStats.map((stat, index) => {
            const Icon = stat.icon
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card variant="outlined" hover>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        `bg-${stat.color}-100 dark:bg-${stat.color}-900/30`
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          `text-${stat.color}-600 dark:text-${stat.color}-400`
                        )} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {stat.value}
                          </p>
                          <span className="text-sm text-green-600 font-medium">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contacts */}
        <Card variant="elevated">
          <CardHeader title="Top Contacts" />
          <CardContent>
            <div className="space-y-4">
              {data.topContacts.map((contact, index) => (
                <motion.div
                  key={contact.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {contact.name.charAt(4)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contact.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.count} messages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      contact.sentiment === 'positive' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                      contact.sentiment === 'negative' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                      contact.sentiment === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    )}>
                      {contact.sentiment}
                    </span>
                    <span className="text-lg">
                      {contact.sentiment === 'positive' ? '😊' : contact.sentiment === 'negative' ? '😞' : '😐'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card variant="elevated">
          <CardHeader title="Message Categories" />
          <CardContent>
            <div className="space-y-4">
              {data.categoryBreakdown.map((category, index) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {category.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.count}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.percentage}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ delay: 1 + index * 0.1, duration: 0.8 }}
                      className={cn(
                        'h-2 rounded-full',
                        index === 0 && 'bg-blue-500',
                        index === 1 && 'bg-green-500',
                        index === 2 && 'bg-yellow-500',
                        index === 3 && 'bg-red-500'
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated">
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              icon={<Download className="w-5 h-5" />}
            >
              <span>Export Detailed Report</span>
              <span className="text-xs text-gray-500">PDF, CSV, Excel</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              icon={<Calendar className="w-5 h-5" />}
            >
              <span>Schedule Report</span>
              <span className="text-xs text-gray-500">Daily, Weekly, Monthly</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-4 h-auto flex-col space-y-2"
              icon={<Filter className="w-5 h-5" />}
            >
              <span>Custom Analytics</span>
              <span className="text-xs text-gray-500">Create custom views</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
