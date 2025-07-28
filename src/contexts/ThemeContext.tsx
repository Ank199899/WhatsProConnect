'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ColorScheme = 'default' | 'blue' | 'purple' | 'green' | 'orange' | 'custom'
export type UIDesign = 'modern' | 'minimal' | 'glassmorphism' | 'neumorphism' | 'gradient'

// Color Palettes - All schemes now use the consistent 3-color combination
export const colorPalettes = {
  default: {
    primary: '#296073',    // Dark Blue-Green
    secondary: '#3596B5',  // Medium Blue
    accent: '#ADC5CF',     // Light Blue-Gray
    dark: '#1E293B',
    light: '#F8FAFC',
    text: {
      primary: '#296073',   // Use primary color for main text
      secondary: '#3596B5', // Use secondary color for secondary text
      light: '#ADC5CF'      // Use accent color for light text
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#ADC5CF20' // Light accent with transparency
    }
  },
  blue: {
    primary: '#296073',    // Dark Blue-Green
    secondary: '#3596B5',  // Medium Blue
    accent: '#ADC5CF',     // Light Blue-Gray
    dark: '#1E293B',
    light: '#F8FAFC',
    text: {
      primary: '#296073',   // Use primary color for main text
      secondary: '#3596B5', // Use secondary color for secondary text
      light: '#ADC5CF'      // Use accent color for light text
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#ADC5CF20' // Light accent with transparency
    }
  },
  purple: {
    primary: '#296073',    // Dark Blue-Green (consistent across all themes)
    secondary: '#3596B5',  // Medium Blue
    accent: '#ADC5CF',     // Light Blue-Gray
    dark: '#1E293B',
    light: '#F8FAFC',
    text: {
      primary: '#296073',   // Use primary color for main text
      secondary: '#3596B5', // Use secondary color for secondary text
      light: '#ADC5CF'      // Use accent color for light text
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#ADC5CF20' // Light accent with transparency
    }
  },
  green: {
    primary: '#296073',    // Dark Blue-Green
    secondary: '#3596B5',  // Medium Blue
    accent: '#ADC5CF',     // Light Blue-Gray
    dark: '#1E293B',
    light: '#F8FAFC',
    text: {
      primary: '#296073',   // Use primary color for main text
      secondary: '#3596B5', // Use secondary color for secondary text
      light: '#ADC5CF'      // Use accent color for light text
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#ADC5CF20' // Light accent with transparency
    }
  },
  orange: {
    primary: '#296073',    // Dark Blue-Green (consistent across all themes)
    secondary: '#3596B5',  // Medium Blue
    accent: '#ADC5CF',     // Light Blue-Gray
    dark: '#1E293B',
    light: '#F8FAFC',
    text: {
      primary: '#296073',   // Use primary color for main text
      secondary: '#3596B5', // Use secondary color for secondary text
      light: '#ADC5CF'      // Use accent color for light text
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#ADC5CF20' // Light accent with transparency
    }
  },
  custom: {
    primary: '#296073',    // Dark Blue-Green (consistent across all themes)
    secondary: '#3596B5',  // Medium Blue
    accent: '#ADC5CF',     // Light Blue-Gray
    dark: '#1E293B',
    light: '#F8FAFC',
    text: {
      primary: '#296073',   // Use primary color for main text
      secondary: '#3596B5', // Use secondary color for secondary text
      light: '#ADC5CF'      // Use accent color for light text
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#ADC5CF20' // Light accent with transparency
    }
  }
}

// Dark mode variants - All schemes use consistent 3-color combination with dark backgrounds
export const darkColorPalettes = {
  default: {
    primary: '#3596B5',    // Medium Blue (brighter for dark mode)
    secondary: '#ADC5CF',  // Light Blue-Gray (for contrast)
    accent: '#296073',     // Dark Blue-Green (for accents)
    dark: '#0F172A',
    light: '#1E293B',
    text: {
      primary: '#ADC5CF',   // Light Blue-Gray for main text
      secondary: '#3596B5', // Medium Blue for secondary text
      light: '#296073'      // Dark Blue-Green for light text
    },
    background: {
      primary: '#0F172A',   // Very dark background
      secondary: '#1E293B', // Dark secondary background
      tertiary: '#29607320' // Primary color with transparency
    }
  },
  blue: {
    primary: '#3596B5',    // Medium Blue (brighter for dark mode)
    secondary: '#ADC5CF',  // Light Blue-Gray (for contrast)
    accent: '#296073',     // Dark Blue-Green (for accents)
    dark: '#0F172A',
    light: '#1E293B',
    text: {
      primary: '#ADC5CF',   // Light Blue-Gray for main text
      secondary: '#3596B5', // Medium Blue for secondary text
      light: '#296073'      // Dark Blue-Green for light text
    },
    background: {
      primary: '#0F172A',   // Very dark background
      secondary: '#1E293B', // Dark secondary background
      tertiary: '#29607320' // Primary color with transparency
    }
  },
  purple: {
    primary: '#3596B5',    // Medium Blue (consistent across all themes)
    secondary: '#ADC5CF',  // Light Blue-Gray (for contrast)
    accent: '#296073',     // Dark Blue-Green (for accents)
    dark: '#0F172A',
    light: '#1E293B',
    text: {
      primary: '#ADC5CF',   // Light Blue-Gray for main text
      secondary: '#3596B5', // Medium Blue for secondary text
      light: '#296073'      // Dark Blue-Green for light text
    },
    background: {
      primary: '#0F172A',   // Very dark background
      secondary: '#1E293B', // Dark secondary background
      tertiary: '#29607320' // Primary color with transparency
    }
  },
  green: {
    primary: '#3596B5',    // Medium Blue (brighter for dark mode)
    secondary: '#ADC5CF',  // Light Blue-Gray (for contrast)
    accent: '#296073',     // Dark Blue-Green (for accents)
    dark: '#0F172A',
    light: '#1E293B',
    text: {
      primary: '#ADC5CF',   // Light Blue-Gray for main text
      secondary: '#3596B5', // Medium Blue for secondary text
      light: '#296073'      // Dark Blue-Green for light text
    },
    background: {
      primary: '#0F172A',   // Very dark background
      secondary: '#1E293B', // Dark secondary background
      tertiary: '#29607320' // Primary color with transparency
    }
  },
  orange: {
    primary: '#3596B5',    // Medium Blue (consistent across all themes)
    secondary: '#ADC5CF',  // Light Blue-Gray (for contrast)
    accent: '#296073',     // Dark Blue-Green (for accents)
    dark: '#0F172A',
    light: '#1E293B',
    text: {
      primary: '#ADC5CF',   // Light Blue-Gray for main text
      secondary: '#3596B5', // Medium Blue for secondary text
      light: '#296073'      // Dark Blue-Green for light text
    },
    background: {
      primary: '#0F172A',   // Very dark background
      secondary: '#1E293B', // Dark secondary background
      tertiary: '#29607320' // Primary color with transparency
    }
  },
  custom: {
    primary: '#3596B5',    // Medium Blue (consistent across all themes)
    secondary: '#ADC5CF',  // Light Blue-Gray (for contrast)
    accent: '#296073',     // Dark Blue-Green (for accents)
    dark: '#0F172A',
    light: '#1E293B',
    text: {
      primary: '#ADC5CF',   // Light Blue-Gray for main text
      secondary: '#3596B5', // Medium Blue for secondary text
      light: '#296073'      // Dark Blue-Green for light text
    },
    background: {
      primary: '#0F172A',   // Very dark background
      secondary: '#1E293B', // Dark secondary background
      tertiary: '#29607320' // Primary color with transparency
    }
  }
}

// Theme Context Interface
interface ThemeContextType {
  mode: ThemeMode
  colorScheme: ColorScheme
  uiDesign: UIDesign
  colors: typeof colorPalettes.default
  setMode: (mode: ThemeMode) => void
  setColorScheme: (scheme: ColorScheme) => void
  setUIDesign: (design: UIDesign) => void
  isDark: boolean
  toggleMode: () => void
}

// Create Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [colorScheme, setColorScheme] = useState<ColorScheme>('custom')
  const [uiDesign, setUIDesign] = useState<UIDesign>('modern')
  const [isDark, setIsDark] = useState(false)

  // Get current colors based on mode and scheme
  const getCurrentColors = () => {
    const palette = isDark ? darkColorPalettes[colorScheme] : colorPalettes[colorScheme]
    return palette
  }

  const colors = getCurrentColors()

  // Handle mode changes
  useEffect(() => {
    const updateTheme = () => {
      if (mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
      } else {
        setIsDark(mode === 'dark')
      }
    }

    updateTheme()

    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [mode])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Apply CSS custom properties
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-dark', colors.dark)
    root.style.setProperty('--color-light', colors.light)
    root.style.setProperty('--color-text-primary', colors.text.primary)
    root.style.setProperty('--color-text-secondary', colors.text.secondary)
    root.style.setProperty('--color-text-light', colors.text.light)
    root.style.setProperty('--color-bg-primary', colors.background.primary)
    root.style.setProperty('--color-bg-secondary', colors.background.secondary)
    root.style.setProperty('--color-bg-tertiary', colors.background.tertiary)

    // Apply theme class
    root.className = `theme-${colorScheme} ui-${uiDesign} ${isDark ? 'dark' : 'light'}`
  }, [colors, colorScheme, uiDesign, isDark])

  // Load saved preferences from server storage
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        // Import storage service dynamically to avoid SSR issues
        const { ThemeStorageService } = await import('../lib/storage-replacement')

        const settings = await ThemeStorageService.getAllThemeSettings()

        if (settings.mode) setMode(settings.mode as ThemeMode)
        if (settings.colorScheme) setColorScheme(settings.colorScheme as ColorScheme)
        if (settings.uiDesign) setUIDesign(settings.uiDesign as UIDesign)

        console.log('✅ Theme settings loaded from server storage')
      } catch (error) {
        console.error('❌ Error loading theme settings:', error)
        // Fallback to localStorage for backward compatibility
        const savedMode = localStorage.getItem('theme-mode') as ThemeMode
        const savedScheme = localStorage.getItem('color-scheme') as ColorScheme
        const savedDesign = localStorage.getItem('ui-design') as UIDesign

        if (savedMode) setMode(savedMode)
        if (savedScheme) setColorScheme(savedScheme)
        if (savedDesign) setUIDesign(savedDesign)
      }
    }

    loadThemeSettings()
  }, [])

  // Save preferences to server storage
  useEffect(() => {
    const saveThemeSettings = async () => {
      try {
        // Import storage service dynamically to avoid SSR issues
        const { ThemeStorageService } = await import('../lib/storage-replacement')

        await Promise.all([
          ThemeStorageService.setThemeMode(mode),
          ThemeStorageService.setColorScheme(colorScheme),
          ThemeStorageService.setUIDesign(uiDesign)
        ])

        console.log('💾 Theme settings saved to server storage')
      } catch (error) {
        console.error('❌ Error saving theme settings:', error)
        // Fallback to localStorage
        localStorage.setItem('theme-mode', mode)
        localStorage.setItem('color-scheme', colorScheme)
        localStorage.setItem('ui-design', uiDesign)
      }
    }

    saveThemeSettings()
  }, [mode, colorScheme, uiDesign])

  const toggleMode = () => {
    setMode(isDark ? 'light' : 'dark')
  }

  const value: ThemeContextType = {
    mode,
    colorScheme,
    uiDesign,
    colors,
    setMode,
    setColorScheme,
    setUIDesign,
    isDark,
    toggleMode
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom Hook
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
