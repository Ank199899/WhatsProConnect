'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Zap, Sparkles } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center z-50">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-emerald-200 to-green-300 opacity-20"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          className="relative mb-8"
        >
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto"
            animate={{ 
              boxShadow: [
                "0 20px 40px rgba(16, 185, 129, 0.3)",
                "0 25px 50px rgba(16, 185, 129, 0.5)",
                "0 20px 40px rgba(16, 185, 129, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Rotating Background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-green-700 rounded-3xl opacity-80"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-3 -right-3 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
              animate={{ 
                y: [-3, -8, -3],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-yellow-600" />
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-3 -left-3 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center"
              animate={{ 
                y: [3, 8, 3],
                x: [-2, 2, -2]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <Zap className="w-3 h-3 text-blue-600" />
            </motion.div>
            
            {/* Main Icon */}
            <motion.div
              className="relative z-10"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <MessageCircle className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Pulsing Rings */}
            <motion.div 
              className="absolute inset-0 rounded-3xl border-2 border-emerald-300"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-0 rounded-3xl border border-green-200"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6"
        >
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            WhatsPro Connect
          </motion.h1>
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Professional WhatsApp Solution
          </motion.p>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex items-center justify-center space-x-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-gray-500 mt-4 text-sm"
        >
          Initializing your professional workspace...
        </motion.p>
      </div>
    </div>
  )
}
