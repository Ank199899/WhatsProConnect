'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Smartphone,
  MessageCircle,
  Users,
  Megaphone,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
  FileText,
  UserCog,
  Bot,
  Brain,
  Crown,
  Webhook,
  Lock,
  UserCheck,
  Inbox,
  Send,
  FileCode,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

import Button from './ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/components/PermissionGuard'


interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: (collapsed: boolean) => void
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500', permission: 'dashboard.view' },
  { id: 'sessions', label: 'WhatsApp Numbers', icon: Smartphone, color: 'text-blue-600', permission: 'sessions.view' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-purple-500', permission: 'inbox.view' },
  { id: 'ultimate-ai', label: 'AI Control Panel', icon: Bot, color: 'text-violet-500', permission: 'ai.view' },
  { id: 'contacts', label: 'Contacts', icon: Users, color: 'text-orange-500', permission: 'contacts.view' },
  { id: 'bulk', label: 'Bulk Messaging', icon: Send, color: 'text-red-500', permission: 'bulk.view' },
  { id: 'templates', label: 'Templates', icon: FileCode, color: 'text-slate-600', permission: 'templates.view' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-indigo-500', permission: 'analytics.view' },
  // { id: 'admin-users', label: 'Admin User Panel', icon: Crown, color: 'text-purple-500', permission: '*' }, // Hidden for now
  { id: 'roles', label: 'Roles & Permissions', icon: UserCheck, color: 'text-teal-500', permission: 'roles.view' },
  { id: 'api', label: 'API & Webhooks', icon: Webhook, color: 'text-pink-500', permission: 'api.view' }
]

// Development-only tabs (hidden in production)
const devTabs = [
  { id: 'credentials', label: 'Login Credentials', icon: Lock, color: 'text-purple-500', permission: 'credentials.view' }
]

const bottomTabs = [
  { id: 'profile', label: 'User Profile', icon: UserCog },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function Sidebar({ activeTab, onTabChange, isCollapsed: externalCollapsed, onToggleCollapse }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)

  const { logout, user } = useAuth()
  const { hasPermission } = usePermissions()

  // Use external collapsed state if provided, otherwise use internal state
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  const setIsCollapsed = onToggleCollapse || setInternalCollapsed

  // Filter tabs based on user permissions and environment
  const isProduction = process.env.NODE_ENV === 'production'
  const allTabs = isProduction ? tabs : [...tabs, ...devTabs]

  const visibleTabs = allTabs.filter(tab => {
    if (!tab.permission) return true
    return hasPermission(tab.permission)
  })

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId)
    // Auto-collapse sidebar when a tab is clicked (except when already collapsed)
    if (!isCollapsed && onToggleCollapse) {
      onToggleCollapse(true)
    }
  }

  return (
    <motion.div
      animate={{
        width: isCollapsed ? 80 : 280,
        boxShadow: isCollapsed
          ? "0 8px 32px rgba(0, 0, 0, 0.1)"
          : "0 20px 60px rgba(0, 0, 0, 0.15)"
      }}
      whileHover={isCollapsed ? {
        width: 120,
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)"
      } : {}}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        boxShadow: { duration: 0.3 }
      }}
      className="h-screen flex flex-col relative overflow-hidden min-h-0 transition-colors duration-300 glass-sidebar"
      style={{
        background: `linear-gradient(180deg,
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.05) 100%)`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Liquid Glass Background Effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 50%,
            rgba(255, 255, 255, 0.02) 100%)`
        }}
        animate={{
          opacity: isCollapsed ? 0.3 : 0.6,
          scale: isCollapsed ? 0.9 : 1
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Floating Glass Orb */}
      <motion.div
        className="absolute top-20 right-4 w-16 h-16 rounded-full pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 100%)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        animate={{
          y: [0, -10, 0],
          opacity: [0.3, 0.6, 0.3],
          scale: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <div className="relative">
                  {/* Main Logo Container with Advanced Animation */}
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-slate-600 via-blue-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-2xl"
                    whileHover={{
                      scale: 1.1,
                      rotate: 12,
                      boxShadow: "0 20px 40px rgba(41, 96, 115, 0.4)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Animated Background Pulse */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-slate-600 to-blue-700 rounded-2xl opacity-75"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Floating Particles */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                      animate={{ y: [-2, -6, -2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-400 rounded-full"
                      animate={{ y: [2, 6, 2] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                    />

                    {/* Main Icon with Rotation */}
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                      className="relative z-10"
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </motion.div>

                    {/* Glowing Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-emerald-300"
                      initial={{ opacity: 0, scale: 1 }}
                      whileHover={{ opacity: 1, scale: 1.1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Status Indicator */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <motion.div
                      className="w-full h-full bg-blue-500 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.h1
                    className="text-lg font-bold bg-gradient-to-r from-slate-700 via-blue-600 to-slate-800 bg-clip-text text-transparent"
                    whileHover={{
                      backgroundImage: "linear-gradient(to right, #296073, #3596B5, #1E293B)"
                    }}
                  >
                    WhatsPro Connect
                  </motion.h1>
                  <motion.p
                    className="text-xs transition-colors duration-300"
                    style={{ color: 'var(--color-text-secondary)' }}
                    whileHover={{ color: "var(--color-primary)" }}
                    transition={{ duration: 0.2 }}
                  >
                    Professional WhatsApp Solution
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Logo */}
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <motion.div
                className="w-8 h-8 bg-gradient-to-br from-slate-600 via-blue-600 to-slate-700 rounded-xl flex items-center justify-center shadow-xl"
                whileHover={{
                  scale: 1.15,
                  rotate: 360,
                  boxShadow: "0 15px 30px rgba(41, 96, 115, 0.5)"
                }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </motion.div>

                {/* Pulsing Ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-emerald-300"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Mini Status Dot */}
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border border-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* Enhanced Toggle Button */}
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="relative p-2 rounded-lg hover:bg-emerald-50 transition-all duration-300 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-slate-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              animate={{ scale: isCollapsed ? [1, 1.2, 1] : [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Toggle Icon with Enhanced Animation */}
            <motion.div
              animate={{
                rotate: isCollapsed ? 0 : 180,
                scale: isCollapsed ? [1, 1.2, 1] : [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 0.4, ease: "easeInOut" },
                scale: { duration: 1.5, repeat: Infinity }
              }}
              className="relative z-10"
            >
              {isCollapsed ? (
                <ChevronRight size={18} className="text-emerald-600 group-hover:text-emerald-700" />
              ) : (
                <ChevronLeft size={18} className="text-emerald-600 group-hover:text-emerald-700" />
              )}
            </motion.div>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50"
              >
                Expand Menu
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>



      {/* Navigation with Enhanced Custom Scrollbar */}
      <nav className="sidebar-nav flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden"
           style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{
                scale: 1.02,
                x: isCollapsed ? 2 : 0
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabClick(tab.id)}
              className="w-full flex items-center rounded-xl transition-all duration-300 group relative overflow-hidden glass-nav-item"
              style={{
                padding: isCollapsed ? '16px 12px' : '12px 16px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: isActive
                  ? `linear-gradient(135deg,
                      rgba(var(--color-primary-rgb), 0.2) 0%,
                      rgba(var(--color-primary-rgb), 0.1) 100%)`
                  : 'transparent',
                backdropFilter: isActive ? 'blur(12px)' : 'none',
                WebkitBackdropFilter: isActive ? 'blur(12px)' : 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                border: isActive
                  ? '1px solid rgba(var(--color-primary-rgb), 0.3)'
                  : '1px solid transparent',
                boxShadow: isActive
                  ? '0 4px 16px rgba(var(--color-primary-rgb), 0.1)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.backdropFilter = 'blur(8px)'
                  e.currentTarget.style.WebkitBackdropFilter = 'blur(8px)'
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.backdropFilter = 'none'
                  e.currentTarget.style.WebkitBackdropFilter = 'none'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                  e.currentTarget.style.border = '1px solid transparent'
                }
              }}
            >
              {/* Liquid Glass Background Animation for Active State */}
              {isActive && (
                <motion.div
                  layoutId="activeBackground"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg,
                      rgba(var(--color-primary-rgb), 0.15) 0%,
                      rgba(var(--color-secondary-rgb), 0.1) 100%)`,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)'
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Glass Shimmer Effect */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(45deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.1) 50%,
                    transparent 70%)`,
                  transform: 'translateX(-100%)'
                }}
                animate={{
                  transform: ['translateX(-100%)', 'translateX(100%)']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              {isCollapsed ? (
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'bg-blue-100 shadow-md'
                    : 'bg-gray-100 group-hover:bg-emerald-100'
                )}>
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-all duration-200',
                      isActive ? tab.color : 'text-current group-hover:scale-110'
                    )}
                  />
                </div>
              ) : (
                <Icon
                  className={cn(
                    'w-5 h-5 transition-all duration-200 relative z-10',
                    isActive ? tab.color : 'text-current group-hover:scale-110'
                  )}
                />
              )}

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 font-medium relative z-10"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for Collapsed State */}
              {isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.8 }}
                  whileHover={{ opacity: 1, x: 0, scale: 1 }}
                  className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg"
                  style={{ pointerEvents: 'none' }}
                >
                  {tab.label}
                  {/* Tooltip Arrow */}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                </motion.div>
              )}

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-2 h-2 bg-blue-500 rounded-full relative z-10"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Hover Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 to-blue-400/0 rounded-xl"
                whileHover={{
                  background: isActive
                    ? "linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))"
                    : "linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))"
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          )
        })}
      </nav>



      {/* Theme Toggle */}
      <div
        className="px-4 py-2 border-t transition-colors duration-300"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={() => {
            const body = document.body
            const isDark = body.classList.contains('dark')
            if (isDark) {
              // Light mode
              body.classList.remove('dark')
              body.style.setProperty('--color-bg-primary', '#ffffff')
              body.style.setProperty('--color-bg-secondary', '#f8fafc')
              body.style.setProperty('--color-bg-tertiary', '#f1f5f9')
              body.style.setProperty('--color-text-primary', '#1e293b')
              body.style.setProperty('--color-text-secondary', '#64748b')
              body.style.setProperty('--color-border', '#e2e8f0')
            } else {
              // Dark mode
              body.classList.add('dark')
              body.style.setProperty('--color-bg-primary', '#0f172a')
              body.style.setProperty('--color-bg-secondary', '#1e293b')
              body.style.setProperty('--color-bg-tertiary', '#334155')
              body.style.setProperty('--color-text-primary', '#f1f5f9')
              body.style.setProperty('--color-text-secondary', '#cbd5e1')
              body.style.setProperty('--color-border', '#475569')
            }
          }}
          className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-primary)'
          }}
        >
          <span className="text-lg">🌙</span>
          {!isCollapsed && <span className="ml-3 text-sm font-medium">Dark Mode</span>}
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-2">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isProfile = tab.id === 'profile'

          return (
            <motion.button
              key={tab.id}
              whileHover={{
                scale: 1.02,
                x: isCollapsed ? 2 : 0
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'w-full flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden',
                isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3',
                isActive
                  ? isProfile
                    ? 'bg-gradient-to-r from-blue-100 to-purple-50 text-gray-900 shadow-sm border border-blue-200'
                    : 'bg-gradient-to-r from-gray-100 to-emerald-50 text-gray-900 shadow-sm border border-gray-200'
                  : isProfile
                    ? 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 hover:text-gray-900'
              )}
            >
              {/* Background Animation for Active State */}
              {isActive && (
                <motion.div
                  layoutId="activeBottomBackground"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: isProfile
                      ? `linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))`
                      : `linear-gradient(to right, var(--color-accent)20, var(--color-secondary)20)`
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {isCollapsed ? (
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  isActive
                    ? isProfile
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-200 shadow-md'
                    : isProfile
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md group-hover:shadow-lg'
                      : 'bg-gray-100 group-hover:bg-emerald-100'
                )}>
                  {isProfile ? (
                    <motion.div
                      className="text-lg font-bold"
                      whileHover={{ scale: 1.1 }}
                    >
                      {user?.name?.charAt(0) || 'A'}
                    </motion.div>
                  ) : (
                    <Icon
                      className="w-6 h-6 transition-all duration-200 group-hover:scale-110"
                    />
                  )}
                </div>
              ) : (
                <>
                  {isProfile ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-200 relative z-10">
                      <motion.div
                        className="text-sm font-bold"
                        whileHover={{ scale: 1.1 }}
                      >
                        {user?.name?.charAt(0) || 'A'}
                      </motion.div>
                    </div>
                  ) : (
                    <Icon
                      className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-200"
                    />
                  )}
                </>
              )}

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 font-medium relative z-10"
                  >
                    {isProfile ? (
                      <div className="flex flex-col items-start">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {user?.name || 'Admin User'}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-purple-600 transition-colors">
                          {user?.role || 'Admin'}
                        </div>
                      </div>
                    ) : (
                      tab.label
                    )}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for Collapsed State */}
              {isCollapsed && isProfile && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.8 }}
                  whileHover={{ opacity: 1, x: 0, scale: 1 }}
                  className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg"
                  style={{ pointerEvents: 'none' }}
                >
                  {user?.name || 'Admin User'}
                  <div className="text-xs opacity-75">{user?.role || 'Admin'}</div>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                </motion.div>
              )}

              {/* Tooltip for Collapsed State */}
              {isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.8 }}
                  whileHover={{ opacity: 1, x: 0, scale: 1 }}
                  className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg"
                  style={{ pointerEvents: 'none' }}
                >
                  {tab.label}
                  {/* Tooltip Arrow */}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                </motion.div>
              )}

              {/* Hover Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 to-gray-400/0 rounded-xl"
                whileHover={{
                  background: "linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(107, 114, 128, 0.05))"
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          )
        })}







        {/* Enhanced Logout Button */}
        <motion.button
          onClick={logout}
          whileHover={{
            scale: 1.02,
            x: isCollapsed ? 2 : 0
          }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full flex items-center rounded-xl transition-all duration-200 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 group relative overflow-hidden',
            isCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3'
          )}
        >
          {/* Background Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-400/0 to-pink-400/0 rounded-xl"
            whileHover={{
              background: "linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(236, 72, 153, 0.1))"
            }}
            transition={{ duration: 0.3 }}
          />

          {isCollapsed ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-red-100 group-hover:bg-red-200">
              <LogOut className="w-6 h-6 transition-all duration-200 group-hover:scale-110" />
            </div>
          ) : (
            <LogOut className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />
          )}

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 font-medium relative z-10"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip for Collapsed State */}
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.8 }}
              whileHover={{ opacity: 1, x: 0, scale: 1 }}
              className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-red-600 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg"
              style={{ pointerEvents: 'none' }}
            >
              Logout
              {/* Tooltip Arrow */}
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
            </motion.div>
          )}
        </motion.button>
      </div>
      </div>

      {/* Floating Toggle Button (visible when collapsed) */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-50">
            {/* Active Section Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg"
            >
              {visibleTabs.find(tab => tab.id === activeTab)?.label || bottomTabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{
                scale: 1.1,
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCollapsed(false)}
              className="w-8 h-8 bg-gradient-to-r from-slate-600 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white"
            >
            <motion.div
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight size={16} />
            </motion.div>

            {/* Pulsing Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
