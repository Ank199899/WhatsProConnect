'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  Globe,
  Clock,
  User,
  Settings,
  Refresh,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Copy,
  QrCode,
  Fingerprint,
  Wifi,
  Database,
  Server
} from 'lucide-react'
import Card, { CardHeader, CardContent } from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import { cn, formatTime } from '@/lib/utils'

interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'api_access' | 'data_export' | 'suspicious_activity'
  description: string
  timestamp: number
  ipAddress: string
  userAgent: string
  location: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'resolved' | 'investigating' | 'open'
}

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed: number
  createdAt: number
  expiresAt?: number
  isActive: boolean
  usageCount: number
}

interface SecurityCenterProps {
  className?: string
}

export default function SecurityCenter({ className }: SecurityCenterProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'auth' | 'api' | 'logs' | 'encryption'>('overview')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const [securityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'login',
      description: 'Successful login from new device',
      timestamp: Date.now() - 3600000,
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0',
      location: 'New York, US',
      severity: 'low',
      status: 'resolved'
    },
    {
      id: '2',
      type: 'failed_login',
      description: 'Multiple failed login attempts',
      timestamp: Date.now() - 7200000,
      ipAddress: '45.123.45.67',
      userAgent: 'Unknown',
      location: 'Unknown',
      severity: 'high',
      status: 'investigating'
    },
    {
      id: '3',
      type: 'api_access',
      description: 'API key used from new IP',
      timestamp: Date.now() - 10800000,
      ipAddress: '203.45.67.89',
      userAgent: 'API Client',
      location: 'London, UK',
      severity: 'medium',
      status: 'open'
    }
  ])

  const [apiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'wa_live_1234567890abcdef',
      permissions: ['messages:read', 'messages:write', 'contacts:read'],
      lastUsed: Date.now() - 3600000,
      createdAt: Date.now() - 86400000 * 30,
      isActive: true,
      usageCount: 1250
    },
    {
      id: '2',
      name: 'Development API',
      key: 'wa_test_abcdef1234567890',
      permissions: ['messages:read', 'contacts:read'],
      lastUsed: Date.now() - 86400000,
      createdAt: Date.now() - 86400000 * 7,
      expiresAt: Date.now() + 86400000 * 30,
      isActive: true,
      usageCount: 45
    }
  ])

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    )
    setBackupCodes(codes)
    setShowBackupCodes(true)
  }

  const enable2FA = () => {
    setTwoFactorEnabled(true)
    setShowQRCode(true)
    generateBackupCodes()
  }

  const disable2FA = () => {
    if (confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      setTwoFactorEnabled(false)
      setShowQRCode(false)
      setBackupCodes([])
      setShowBackupCodes(false)
    }
  }

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
    }
  }

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return CheckCircle
      case 'logout': return User
      case 'failed_login': return XCircle
      case 'password_change': return Key
      case 'api_access': return Database
      case 'data_export': return Download
      case 'suspicious_activity': return AlertTriangle
      default: return Activity
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'auth', label: 'Authentication', icon: Lock },
    { id: 'api', label: 'API Security', icon: Key },
    { id: 'logs', label: 'Security Logs', icon: Activity },
    { id: 'encryption', label: 'Encryption', icon: Database }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Center
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your account security settings
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Download size={16} />}>
            Export Logs
          </Button>
          <Button icon={<Refresh size={16} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Security Score
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold text-green-600">85/100</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Two-factor authentication enabled</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Strong password policy</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span>API keys need rotation</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${85 * 2.51} ${100 * 2.51}`}
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield size={24} className="text-green-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Security Events</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityEvents.slice(0, 5).map(event => {
                      const Icon = getEventIcon(event.type)
                      return (
                        <div key={event.id} className="flex items-start space-x-3">
                          <Icon size={16} className="mt-1 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(event.timestamp)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {event.ipAddress}
                              </span>
                              <span className={cn(
                                'px-2 py-1 text-xs rounded-full',
                                getSeverityColor(event.severity)
                              )}>
                                {event.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      icon={<Key size={16} />}
                    >
                      Change Password
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      icon={<Smartphone size={16} />}
                    >
                      Manage 2FA
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      icon={<Database size={16} />}
                    >
                      Rotate API Keys
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      icon={<Download size={16} />}
                    >
                      Download Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      twoFactorEnabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    )}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Add an extra layer of security to your account by requiring a verification code from your phone.
                    </p>
                    
                    {!twoFactorEnabled ? (
                      <Button onClick={enable2FA} icon={<Smartphone size={16} />}>
                        Enable Two-Factor Authentication
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowQRCode(!showQRCode)}
                            icon={<QrCode size={16} />}
                          >
                            {showQRCode ? 'Hide' : 'Show'} QR Code
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowBackupCodes(!showBackupCodes)}
                            icon={<Key size={16} />}
                          >
                            {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={disable2FA}
                            className="text-red-600 hover:text-red-700"
                            icon={<XCircle size={16} />}
                          >
                            Disable 2FA
                          </Button>
                        </div>

                        <AnimatePresence>
                          {showQRCode && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="text-center">
                                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                  <QrCode size={64} className="text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Scan this QR code with your authenticator app
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence>
                          {showBackupCodes && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                            >
                              <div className="flex items-start space-x-3 mb-4">
                                <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                    Backup Codes
                                  </h4>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    Save these codes in a secure location. Each code can only be used once.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                {backupCodes.map((code, index) => (
                                  <div 
                                    key={index}
                                    className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono text-sm text-center"
                                  >
                                    {code}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" icon={<Copy size={14} />}>
                                  Copy All
                                </Button>
                                <Button size="sm" variant="outline" icon={<Download size={14} />}>
                                  Download
                                </Button>
                                <Button size="sm" variant="outline" icon={<Refresh size={14} />}>
                                  Generate New
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Password Settings */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Password Settings</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <Input type="password" placeholder="Enter current password" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <Input type="password" placeholder="Enter new password" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <Input type="password" placeholder="Confirm new password" />
                    </div>
                    
                    <Button icon={<Key size={16} />}>
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* API Keys */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">API Keys</h3>
                    <Button icon={<Plus size={16} />}>
                      Create API Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiKeys.map(apiKey => (
                      <div key={apiKey.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {apiKey.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Created {formatTime(apiKey.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              apiKey.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            )}>
                              {apiKey.isActive ? 'Active' : 'Inactive'}
                            </div>
                            
                            <Button variant="ghost" size="sm" icon={<Edit size={14} />} />
                            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Key:</span>
                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                              {apiKey.key.substring(0, 20)}...
                            </code>
                            <Button variant="ghost" size="sm" icon={<Copy size={14} />} />
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Last used: {formatTime(apiKey.lastUsed)}</span>
                            <span>Usage: {apiKey.usageCount} calls</span>
                            {apiKey.expiresAt && (
                              <span>Expires: {formatTime(apiKey.expiresAt)}</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {apiKey.permissions.map(permission => (
                              <span 
                                key={permission}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'logs' && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Security Event Logs</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.map(event => {
                    const Icon = getEventIcon(event.type)
                    return (
                      <div key={event.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Icon size={20} className="mt-1 text-gray-400" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {event.description}
                              </h4>
                              <span className={cn(
                                'px-2 py-1 text-xs rounded-full',
                                getSeverityColor(event.severity)
                              )}>
                                {event.severity}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-medium">Time:</span>
                                <br />
                                {formatTime(event.timestamp)}
                              </div>
                              <div>
                                <span className="font-medium">IP Address:</span>
                                <br />
                                {event.ipAddress}
                              </div>
                              <div>
                                <span className="font-medium">Location:</span>
                                <br />
                                {event.location}
                              </div>
                              <div>
                                <span className="font-medium">User Agent:</span>
                                <br />
                                {event.userAgent}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'encryption' && (
            <div className="space-y-6">
              {/* Encryption Status */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Data Encryption</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                        <div>
                          <h4 className="font-medium text-green-800 dark:text-green-200">
                            End-to-End Encryption Enabled
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            All messages are encrypted using AES-256 encryption
                          </p>
                        </div>
                      </div>
                      <Shield size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Database Encryption
                        </h4>
                        <div className="flex items-center space-x-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            AES-256 at rest
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Transport Security
                        </h4>
                        <div className="flex items-center space-x-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            TLS 1.3 in transit
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Backup Encryption */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Backup Encryption</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Configure encryption settings for your data backups.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Encrypt backups
                        </span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 transition-colors">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Auto-rotate encryption keys
                        </span>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 transition-colors">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                      </div>
                    </div>
                    
                    <Button icon={<Key size={16} />}>
                      Rotate Encryption Keys
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
