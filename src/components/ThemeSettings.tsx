'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Smartphone,
  Layers,
  Sparkles,
  Circle,
  Square,
  Triangle,
  X,
  Check
} from 'lucide-react'
import { useTheme, ThemeMode, ColorScheme, UIDesign, colorPalettes } from '@/contexts/ThemeContext'

interface ThemeSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { mode, colorScheme, uiDesign, setMode, setColorScheme, setUIDesign, isDark, colors } = useTheme()

  const modeOptions = [
    { value: 'light' as ThemeMode, label: 'Light', icon: Sun, description: 'Light theme for better visibility' },
    { value: 'dark' as ThemeMode, label: 'Dark', icon: Moon, description: 'Dark theme for reduced eye strain' },
    { value: 'auto' as ThemeMode, label: 'Auto', icon: Monitor, description: 'Follows system preference' }
  ]

  const colorOptions = [
    { value: 'default' as ColorScheme, label: 'Professional Blue', color: '#296073', description: 'Default professional theme' },
    { value: 'blue' as ColorScheme, label: 'Ocean Blue', color: '#296073', description: 'Professional blue theme' },
    { value: 'purple' as ColorScheme, label: 'Consistent Blue', color: '#296073', description: 'Consistent blue theme' },
    { value: 'green' as ColorScheme, label: 'Ocean Teal', color: '#296073', description: 'Professional teal theme' },
    { value: 'orange' as ColorScheme, label: 'Consistent Blue', color: '#296073', description: 'Consistent blue theme' },
    { value: 'custom' as ColorScheme, label: 'Custom Blue', color: '#296073', description: 'Custom blue theme' }
  ]

  const designOptions = [
    { value: 'modern' as UIDesign, label: 'Modern', icon: Square, description: 'Clean and contemporary design' },
    { value: 'minimal' as UIDesign, label: 'Minimal', icon: Circle, description: 'Simple and focused interface' },
    { value: 'glassmorphism' as UIDesign, label: 'Glass', icon: Layers, description: 'Translucent glass effect' },
    { value: 'neumorphism' as UIDesign, label: 'Soft', icon: Triangle, description: 'Soft shadows and depth' },
    { value: 'gradient' as UIDesign, label: 'Gradient', icon: Sparkles, description: 'Vibrant gradient effects' }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark 
                ? `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`
                : `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`
            }}
          >
            {/* Header */}
            <div 
              className="p-8 border-b border-gray-200 dark:border-gray-700"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                color: 'white'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Theme Settings</h2>
                    <p className="text-white/80">Customize your app appearance</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Theme Mode Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                      Theme Mode
                    </h3>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Choose your preferred theme mode
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = mode === option.value
                    
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => setMode(option.value)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                          isSelected 
                            ? 'border-current shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.primary : undefined,
                          backgroundColor: isSelected 
                            ? `${colors.primary}10` 
                            : isDark ? colors.background.secondary : colors.background.primary
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isSelected ? 'text-white' : ''
                            }`}
                            style={{
                              backgroundColor: isSelected ? colors.primary : `${colors.primary}20`
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                              {option.label}
                            </h4>
                            <p className="text-xs" style={{ color: colors.text.secondary }}>
                              {option.description}
                            </p>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colors.primary }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Color Scheme Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Palette className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                      Color Scheme
                    </h3>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Select your favorite color palette
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colorOptions.map((option) => {
                    const isSelected = colorScheme === option.value
                    const palette = colorPalettes[option.value]
                    
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => setColorScheme(option.value)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                          isSelected 
                            ? 'border-current shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        style={{
                          borderColor: isSelected ? option.color : undefined,
                          backgroundColor: isSelected 
                            ? `${option.color}10` 
                            : isDark ? colors.background.secondary : colors.background.primary
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                              {option.label}
                            </h4>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: option.color }}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <div 
                              className="w-6 h-6 rounded-lg"
                              style={{ backgroundColor: palette.primary }}
                            />
                            <div 
                              className="w-6 h-6 rounded-lg"
                              style={{ backgroundColor: palette.secondary }}
                            />
                            <div 
                              className="w-6 h-6 rounded-lg"
                              style={{ backgroundColor: palette.accent }}
                            />
                          </div>
                          
                          <p className="text-xs" style={{ color: colors.text.secondary }}>
                            {option.description}
                          </p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* UI Design Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                      UI Design Style
                    </h3>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Choose your interface design style
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {designOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = uiDesign === option.value
                    
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => setUIDesign(option.value)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                          isSelected 
                            ? 'border-current shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        style={{
                          borderColor: isSelected ? colors.primary : undefined,
                          backgroundColor: isSelected 
                            ? `${colors.primary}10` 
                            : isDark ? colors.background.secondary : colors.background.primary
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isSelected ? 'text-white' : ''
                            }`}
                            style={{
                              backgroundColor: isSelected ? colors.primary : `${colors.primary}20`
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold" style={{ color: colors.text.primary }}>
                              {option.label}
                            </h4>
                            <p className="text-xs" style={{ color: colors.text.secondary }}>
                              {option.description}
                            </p>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colors.primary }}
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ThemeSettings
