'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Palette, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import ThemeSettings from './ThemeSettings'

const ThemeToggle: React.FC = () => {
  const { mode, isDark, toggleMode, colors } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  const getModeIcon = () => {
    switch (mode) {
      case 'light':
        return Sun
      case 'dark':
        return Moon
      case 'auto':
        return Monitor
      default:
        return Sun
    }
  }

  const ModeIcon = getModeIcon()

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Quick Theme Toggle */}
        <motion.button
          onClick={toggleMode}
          className="relative p-3 rounded-xl transition-all duration-300 group"
          style={{
            backgroundColor: `${colors.primary}15`,
            color: colors.primary
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               style={{ backgroundColor: `${colors.primary}25` }} />
          
          <motion.div
            key={mode}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <ModeIcon className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Theme Settings Button */}
        <motion.button
          onClick={() => setShowSettings(true)}
          className="relative p-3 rounded-xl transition-all duration-300 group"
          style={{
            backgroundColor: `${colors.accent}15`,
            color: colors.accent
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Open theme settings"
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               style={{ backgroundColor: `${colors.accent}25` }} />
          
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <Settings className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Color Palette Indicator */}
        <div className="flex items-center space-x-1 px-3 py-2 rounded-xl"
             style={{ backgroundColor: `${colors.secondary}25` }}>
          <Palette className="w-4 h-4" style={{ color: colors.secondary }} />
          <div className="flex space-x-1">
            <div 
              className="w-3 h-3 rounded-full border border-white/50"
              style={{ backgroundColor: colors.primary }}
            />
            <div 
              className="w-3 h-3 rounded-full border border-white/50"
              style={{ backgroundColor: colors.secondary }}
            />
            <div 
              className="w-3 h-3 rounded-full border border-white/50"
              style={{ backgroundColor: colors.accent }}
            />
          </div>
        </div>
      </div>

      {/* Theme Settings Modal */}
      <ThemeSettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  )
}

export default ThemeToggle
