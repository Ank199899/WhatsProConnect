'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light') // Default to light instead of system
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Always force light mode - ignore saved theme
    setTheme('light')
    localStorage.setItem('theme', 'light')
    console.log('Forced light mode as default')
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Always force light theme
    setActualTheme('light')
    console.log('Forced actual theme to light')
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return

    // Apply light theme to document
    const root = document.documentElement
    console.log('Applying light theme')

    // Force light mode
    root.classList.remove('dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
    console.log('Forced light theme on document')
  }, [actualTheme, mounted])

  const handleSetTheme = (newTheme: Theme) => {
    console.log('Theme change requested but forcing light mode')
    // Always force light mode regardless of request
    setTheme('light')
    localStorage.setItem('theme', 'light')
  }

  // Prevent flash of wrong theme during SSR
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'light', setTheme: handleSetTheme, actualTheme: 'light' }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
