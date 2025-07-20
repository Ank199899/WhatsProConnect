'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ProfessionalCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export default function ProfessionalCard({ 
  children, 
  className = '', 
  hover = true,
  delay = 0 
}: ProfessionalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={hover ? { 
        y: -2, 
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        scale: 1.02
      } : {}}
      className={`
        relative bg-white/70 backdrop-blur-sm border border-gray-200/50 
        rounded-xl shadow-lg hover:shadow-xl transition-all duration-300
        before:absolute before:inset-0 before:rounded-xl 
        before:bg-gradient-to-br before:from-white/20 before:to-transparent 
        before:pointer-events-none
        ${className}
      `}
    >
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-gray-100/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-xl border border-emerald-200/20 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}
