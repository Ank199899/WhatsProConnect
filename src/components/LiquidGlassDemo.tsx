'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Zap, 
  Heart, 
  Star, 
  MessageCircle,
  Settings,
  User,
  Bell
} from 'lucide-react'
import LiquidGlass, { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassInput, 
  LiquidGlassModal,
  LiquidGlassBackground 
} from './ui/LiquidGlass'

export default function LiquidGlassDemo() {
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState('')

  return (
    <LiquidGlassBackground className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Liquid Glass Design System
          </h1>
          <p className="text-lg text-white/80">
            Modern glassmorphism effects for your WhatsApp business platform
          </p>
        </motion.div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Demo */}
          <LiquidGlassCard className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Messages</h3>
                <p className="text-white/70">1,234 sent today</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Success Rate</span>
                <span className="text-white">98.5%</span>
              </div>
              <div className="glass-progress">
                <div 
                  className="glass-progress-fill" 
                  style={{ width: '98.5%' }}
                />
              </div>
            </div>
          </LiquidGlassCard>

          {/* Interactive Card */}
          <LiquidGlassCard className="space-y-4" shimmer>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </div>
            <p className="text-white/80">
              Intelligent responses powered by advanced AI
            </p>
            <div className="flex space-x-2">
              <LiquidGlassButton className="flex-1 text-center">
                Configure
              </LiquidGlassButton>
              <LiquidGlassButton className="px-4">
                <Settings className="w-4 h-4" />
              </LiquidGlassButton>
            </div>
          </LiquidGlassCard>

          {/* Status Card */}
          <LiquidGlassCard className="space-y-4">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <h3 className="text-lg font-semibold text-white">System Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">WhatsApp API</span>
                <span className="text-green-400 text-sm">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Database</span>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">AI Services</span>
                <span className="text-green-400 text-sm">Active</span>
              </div>
            </div>
          </LiquidGlassCard>
        </div>

        {/* Interactive Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Demo */}
          <LiquidGlassCard className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Quick Message</h3>
            <div className="space-y-4">
              <LiquidGlassInput>
                <input
                  type="text"
                  placeholder="Enter recipient number..."
                  className="w-full bg-transparent text-white placeholder-white/60 outline-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </LiquidGlassInput>
              <LiquidGlassInput>
                <textarea
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full bg-transparent text-white placeholder-white/60 outline-none resize-none"
                />
              </LiquidGlassInput>
              <div className="flex space-x-3">
                <LiquidGlassButton className="flex-1 text-center">
                  Send Message
                </LiquidGlassButton>
                <LiquidGlassButton 
                  className="px-4"
                  onClick={() => setShowModal(true)}
                >
                  <Bell className="w-4 h-4" />
                </LiquidGlassButton>
              </div>
            </div>
          </LiquidGlassCard>

          {/* Stats Demo */}
          <LiquidGlassCard className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Today's Analytics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-2">
                <motion.div
                  className="text-3xl font-bold text-blue-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  2.4K
                </motion.div>
                <p className="text-white/70 text-sm">Messages Sent</p>
              </div>
              <div className="text-center space-y-2">
                <motion.div
                  className="text-3xl font-bold text-green-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  156
                </motion.div>
                <p className="text-white/70 text-sm">New Contacts</p>
              </div>
              <div className="text-center space-y-2">
                <motion.div
                  className="text-3xl font-bold text-purple-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  98.2%
                </motion.div>
                <p className="text-white/70 text-sm">Delivery Rate</p>
              </div>
              <div className="text-center space-y-2">
                <motion.div
                  className="text-3xl font-bold text-yellow-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                >
                  4.7
                </motion.div>
                <p className="text-white/70 text-sm">Avg Response</p>
              </div>
            </div>
          </LiquidGlassCard>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <LiquidGlassButton className="px-8 py-3">
            <Star className="w-4 h-4 mr-2" />
            Get Started
          </LiquidGlassButton>
          <LiquidGlassButton className="px-8 py-3">
            <Heart className="w-4 h-4 mr-2" />
            Learn More
          </LiquidGlassButton>
          <LiquidGlassButton className="px-8 py-3">
            <Zap className="w-4 h-4 mr-2" />
            Try Demo
          </LiquidGlassButton>
        </div>
      </div>

      {/* Modal Demo */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <LiquidGlassModal 
            className="max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
                  <p className="text-white/70">Manage your alert preferences</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-white">Message notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-white">System alerts</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-white">Marketing updates</span>
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <LiquidGlassButton 
                  className="flex-1 text-center"
                  onClick={() => setShowModal(false)}
                >
                  Save Changes
                </LiquidGlassButton>
                <LiquidGlassButton 
                  className="px-6"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </LiquidGlassButton>
              </div>
            </div>
          </LiquidGlassModal>
        </motion.div>
      )}
    </LiquidGlassBackground>
  )
}
