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
  Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'
import LanguageSelector, { useCurrentLocale } from './LanguageSelector'
import Button from './ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/components/PermissionGuard'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500', permission: 'dashboard.view' },
  { id: 'sessions', label: 'WhatsApp Numbers', icon: Smartphone, color: 'text-green-500', permission: 'sessions.view' },
  { id: 'inbox', label: 'Inbox', icon: MessageCircle, color: 'text-purple-500', permission: 'inbox.view' },
  { id: 'ultimate-ai', label: 'AI Control Panel', icon: Bot, color: 'text-violet-500', permission: 'ai.view' },
  { id: 'contacts', label: 'Contacts', icon: Users, color: 'text-orange-500', permission: 'contacts.view' },
  { id: 'bulk', label: 'Bulk Messaging', icon: Megaphone, color: 'text-red-500', permission: 'bulk.view' },
  { id: 'templates', label: 'Templates', icon: FileText, color: 'text-emerald-500', permission: 'templates.view' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-indigo-500', permission: 'analytics.view' },
  { id: 'users', label: 'User Management', icon: Shield, color: 'text-cyan-500', permission: 'users.view' },
  { id: 'roles', label: 'Roles & Permissions', icon: UserCog, color: 'text-teal-500', permission: 'roles.view' },
  { id: 'credentials', label: 'Login Credentials', icon: Key, color: 'text-purple-500', permission: 'credentials.view' },
  { id: 'api', label: 'API & Webhooks', icon: Key, color: 'text-pink-500', permission: 'api.view' }
]

const bottomTabs = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle }
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const currentLocale = useCurrentLocale()
  const { logout, user } = useAuth()
  const { hasPermission } = usePermissions()

  // Filter tabs based on user permissions
  const visibleTabs = tabs.filter(tab => {
    if (!tab.permission) return true
    return hasPermission(tab.permission)
  })

  return (
    <motion.div
      animate={{
        width: isCollapsed ? 80 : 280,
        boxShadow: isCollapsed
          ? "0 4px 20px rgba(0, 0, 0, 0.1)"
          : "0 10px 40px rgba(0, 0, 0, 0.15)"
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        boxShadow: { duration: 0.3 }
      }}
      className="bg-white border-r border-gray-200 h-screen flex flex-col relative overflow-hidden min-h-0"
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 via-transparent to-green-50/20 pointer-events-none"
        animate={{
          opacity: isCollapsed ? 0.3 : 0.5,
          scale: isCollapsed ? 0.8 : 1
        }}
        transition={{ duration: 0.4 }}
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
                    className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl"
                    whileHover={{
                      scale: 1.1,
                      rotate: 12,
                      boxShadow: "0 20px 40px rgba(16, 185, 129, 0.4)"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Animated Background Pulse */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl opacity-75"
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
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <motion.div
                      className="w-full h-full bg-green-500 rounded-full"
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
                    className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent"
                    whileHover={{
                      backgroundImage: "linear-gradient(to right, #10b981, #059669, #0d9488)"
                    }}
                  >
                    WhatsPro Connect
                  </motion.h1>
                  <motion.p
                    className="text-xs text-gray-500"
                    whileHover={{ color: "#10b981" }}
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
                className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-xl"
                whileHover={{
                  scale: 1.15,
                  rotate: 360,
                  boxShadow: "0 15px 30px rgba(16, 185, 129, 0.5)"
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
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"
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
              className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"
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

      {/* User Info Section */}
      <div className="px-6 py-4 border-b border-gray-100">
        <AnimatePresence>
          {!isCollapsed && user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-emerald-600 capitalize">
                  {user.role}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed User Avatar */}
        {isCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs relative">
              {user.name.charAt(0).toUpperCase()}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
          </motion.div>
        )}
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
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-600 shadow-md border border-blue-100'
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 hover:text-gray-900'
              )}
            >
              {/* Background Animation for Active State */}
              {isActive && (
                <motion.div
                  layoutId="activeBackground"
                  className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-emerald-100/50 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <Icon
                className={cn(
                  'w-5 h-5 transition-all duration-200 relative z-10',
                  isActive ? tab.color : 'text-current group-hover:scale-110'
                )}
              />

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



      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-2">
        {bottomTabs.map((tab) => {
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
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-gray-100 to-emerald-50 text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-emerald-50 hover:text-gray-900'
              )}
            >
              {/* Background Animation for Active State */}
              {isActive && (
                <motion.div
                  layoutId="activeBottomBackground"
                  className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-emerald-100/50 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <Icon className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />

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

        {/* Language Selector */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2"
            >
              <LanguageSelector currentLocale={currentLocale} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Logout Button */}
        <motion.button
          onClick={logout}
          whileHover={{
            scale: 1.02,
            x: isCollapsed ? 2 : 0
          }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 group relative overflow-hidden"
        >
          {/* Background Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-400/0 to-pink-400/0 rounded-xl"
            whileHover={{
              background: "linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(236, 72, 153, 0.1))"
            }}
            transition={{ duration: 0.3 }}
          />

          <LogOut className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-200" />

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
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 border-2 border-white"
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
        )}
      </AnimatePresence>
    </motion.div>
  )
}
