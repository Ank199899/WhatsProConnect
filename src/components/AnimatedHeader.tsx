'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Zap, Globe, Sparkles } from 'lucide-react'

interface AnimatedHeaderProps {
  title: string
  subtitle?: string
  showLogo?: boolean
}

export default function AnimatedHeader({ title, subtitle, showLogo = true }: AnimatedHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-r from-white/80 via-gray-50/60 to-emerald-50/40 border-b border-gray-200/50 backdrop-blur-sm overflow-hidden"
    >
      {/* Subtle Professional Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-96 h-24 bg-gradient-to-l from-emerald-100/20 to-transparent"
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-64 h-16 bg-gradient-to-r from-green-100/15 to-transparent"
          animate={{
            opacity: [0.1, 0.25, 0.1],
            x: [0, 20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative z-10 px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {showLogo && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="relative"
              >
                {/* Main Logo */}
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl"
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 15,
                    boxShadow: "0 25px 50px rgba(16, 185, 129, 0.4)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Animated Background */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-green-700 rounded-3xl opacity-80"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Floating Elements */}
                  <motion.div 
                    className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full"
                    animate={{ 
                      y: [-3, -8, -3],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-600" />
                  </motion.div>
                  
                  <motion.div 
                    className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full"
                    animate={{ 
                      y: [3, 8, 3],
                      x: [-2, 2, -2]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  >
                    <Zap className="w-2 h-2 text-blue-600" />
                  </motion.div>
                  
                  {/* Main Icon */}
                  <motion.div
                    className="relative z-10"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <MessageCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  {/* Pulsing Rings */}
                  <motion.div 
                    className="absolute inset-0 rounded-3xl border-2 border-emerald-300"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute inset-0 rounded-3xl border border-green-200"
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.2, 0.6, 0.2]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  />
                </motion.div>
                
                {/* Status Indicators */}
                <motion.div 
                  className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-lg"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div 
                    className="w-full h-full bg-green-500 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <Globe className="w-2 h-2 text-white" />
                </motion.div>
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.h1
                className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent"
                whileHover={{
                  scale: 1.02,
                  backgroundImage: "linear-gradient(to right, #059669, #10b981, #0d9488)"
                }}
                transition={{ duration: 0.2 }}
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p 
                  className="text-gray-600 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {subtitle}
                </motion.p>
              )}
            </motion.div>
          </div>
          
          {/* Floating Action Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center space-x-4"
          >
            <motion.div
              className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
            >
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-gray-700">Live</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
