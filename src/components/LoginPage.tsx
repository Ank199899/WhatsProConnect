'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, User, Shield, MessageCircle, Zap, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>
  isLoading?: boolean
  error?: string
}

export default function LoginPage({ onLogin, isLoading = false, error }: LoginPageProps) {
  // Theme hook
  const { colors, isDark } = useTheme()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setIsSubmitting(true)
    try {
      await onLogin(username, password)
    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-600 via-sky-600 to-slate-300 flex items-center justify-center p-4" style={{
      background: `linear-gradient(135deg, #296073 0%, #3596B5 50%, #ADC5CF 100%)`
    }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" style={{ backgroundColor: '#296073' }}></div>
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" style={{ backgroundColor: '#3596B5' }}></div>
      <div className="absolute bottom-20 left-40 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" style={{ backgroundColor: '#ADC5CF' }}></div>

      <div className="relative w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-8 space-y-8" style={{
          boxShadow: '0 25px 50px -12px rgba(41, 96, 115, 0.25), 0 0 0 1px rgba(173, 197, 207, 0.1)'
        }}>
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              {/* Main Logo Container with Advanced Animation */}
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, #296073 0%, #3596B5 50%, #ADC5CF 100%)`
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 12,
                  boxShadow: "0 20px 40px rgba(41, 96, 115, 0.4)"
                }}
                transition={{ duration: 0.3 }}
                animate={{
                  y: [0, -5, 0],
                  boxShadow: [
                    "0 10px 30px rgba(41, 96, 115, 0.3)",
                    "0 15px 40px rgba(53, 150, 181, 0.4)",
                    "0 10px 30px rgba(41, 96, 115, 0.3)"
                  ]
                }}
              >
                {/* Animated Background Pulse */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-75"
                  style={{
                    background: `linear-gradient(135deg, #3596B5 0%, #296073 100%)`
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Floating Particles */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#ADC5CF' }}
                  animate={{ y: [-3, -8, -3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#296073' }}
                  animate={{ y: [3, 8, 3] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                />

                {/* Main Icon with Rotation */}
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  style={{ animationDuration: "4s", animationIterationCount: "infinite" }}
                >
                  <MessageCircle className="w-10 h-10 text-white" />
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
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: '#3596B5' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <motion.div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: '#296073' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{
                background: `linear-gradient(135deg, #296073 0%, #3596B5 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text'
              }}>
                WhatsPro Connect
              </h1>
              <p className="mt-2" style={{ color: '#296073' }}>Professional WhatsApp Solution</p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Bulk Messaging</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">AI Management</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Analytics</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Username/Email Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium" style={{ color: '#296073' }}>
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5" style={{ color: '#3596B5' }} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  style={{
                    borderColor: '#ADC5CF',
                    '--tw-ring-color': '#3596B5'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3596B5'
                    e.target.style.boxShadow = '0 0 0 2px rgba(53, 150, 181, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ADC5CF'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="Enter username or email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#296073' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5" style={{ color: '#3596B5' }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border rounded-xl transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  style={{
                    borderColor: '#ADC5CF',
                    '--tw-ring-color': '#3596B5'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3596B5'
                    e.target.style.boxShadow = '0 0 0 2px rgba(53, 150, 181, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ADC5CF'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 transition-colors" style={{ color: '#3596B5' }} />
                  ) : (
                    <Eye className="h-5 w-5 transition-colors" style={{ color: '#3596B5' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !username || !password}
              className="w-full text-white py-3 px-4 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, #296073 0%, #3596B5 100%)`,
                boxShadow: '0 4px 15px rgba(41, 96, 115, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = `linear-gradient(135deg, #1e4a57 0%, #2a7a9a 100%)`
                e.target.style.boxShadow = '0 6px 20px rgba(41, 96, 115, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = `linear-gradient(135deg, #296073 0%, #3596B5 100%)`
                e.target.style.boxShadow = '0 4px 15px rgba(41, 96, 115, 0.3)'
              }}
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>



            {/* Login Help */}
            <div className="text-center text-sm space-y-2" style={{ color: '#296073' }}>
              <p>Enter your credentials to access the management portal</p>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(173, 197, 207, 0.2)' }}>
                <p className="text-xs font-medium" style={{ color: '#296073' }}>Professional WhatsApp Business Solution</p>
                <p className="text-xs" style={{ color: '#3596B5' }}>Secure • Reliable • Scalable</p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center text-sm" style={{ color: '#3596B5' }}>
            <p>Secure access to your WhatsApp management portal</p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">Secured with JWT Authentication</span>
          </div>
        </div>
      </div>
    </div>
  )
}
