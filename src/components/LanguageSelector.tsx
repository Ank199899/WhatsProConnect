'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  currentLocale: Locale
  className?: string
}

export default function LanguageSelector({ currentLocale, className }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = (locale: Locale) => {
    // Remove current locale from pathname
    const segments = pathname.split('/').filter(Boolean)
    if (locales.includes(segments[0] as Locale)) {
      segments.shift()
    }
    
    // Add new locale to pathname
    const newPath = `/${locale}${segments.length > 0 ? '/' + segments.join('/') : ''}`
    
    setIsOpen(false)
    router.push(newPath)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Globe size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-lg">{localeFlags[currentLocale]}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {localeNames[currentLocale]}
        </span>
        <ChevronDown 
          size={16} 
          className={cn(
            'text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 z-50 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                  Select Language
                </div>
                
                <div className="space-y-1">
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => handleLanguageChange(locale)}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors',
                        locale === currentLocale
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <span className="text-lg">{localeFlags[locale]}</span>
                      <span className="flex-1 font-medium">{localeNames[locale]}</span>
                      {locale === currentLocale && (
                        <Check size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Language preferences are saved automatically
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook for getting current locale from URL
export function useCurrentLocale(): Locale {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const potentialLocale = segments[0] as Locale
  
  return locales.includes(potentialLocale) ? potentialLocale : 'en'
}
