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
  Key
} from 'lucide-react'
import { cn } from '@/lib/utils'
import LanguageSelector, { useCurrentLocale } from './LanguageSelector'
import Button from './ui/Button'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  { id: 'sessions', label: 'WhatsApp Numbers', icon: Smartphone, color: 'text-green-500' },
  { id: 'inbox', label: 'Inbox', icon: MessageCircle, color: 'text-purple-500' },
  { id: 'contacts', label: 'Contacts', icon: Users, color: 'text-orange-500' },
  { id: 'bulk', label: 'Bulk Messaging', icon: Megaphone, color: 'text-red-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-indigo-500' },
  { id: 'users', label: 'User Management', icon: Shield, color: 'text-cyan-500' },
  { id: 'api', label: 'API & Webhooks', icon: Key, color: 'text-pink-500' }
]

const bottomTabs = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle }
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const currentLocale = useCurrentLocale()

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white border-r border-gray-200 h-screen flex flex-col shadow-lg"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    WhatsApp Pro
                  </h1>
                  <p className="text-xs text-gray-500">
                    Advanced Manager
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? tab.color : 'text-current'
                )} 
              />
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 font-medium"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute right-2 w-2 h-2 bg-blue-500 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </nav>



      {/* Bottom Navigation */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-2">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 font-medium"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}
