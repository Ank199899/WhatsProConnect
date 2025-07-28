'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const getButtonVariants = (colors: any) => ({
  primary: {
    backgroundColor: colors.primary,
    color: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: colors.secondary,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  },
  secondary: {
    backgroundColor: colors.secondary,
    color: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: colors.accent,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  },
  outline: {
    border: `2px solid ${colors.primary}`,
    color: colors.primary,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: colors.primary,
      color: '#ffffff'
    }
  },
  ghost: {
    color: colors.text.secondary,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: `${colors.primary}10`
    }
  },
  destructive: {
    backgroundColor: '#EF4444',
    color: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: '#DC2626',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  }
})

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  // Theme hook
  const { colors } = useTheme()
  const buttonStyles = getButtonVariants(colors)[variant]

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeVariants[size],
        fullWidth && 'w-full',
        className
      )}
      style={{
        ...buttonStyles,
        focusRingColor: colors.primary
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </motion.button>
  )
}

export default Button
