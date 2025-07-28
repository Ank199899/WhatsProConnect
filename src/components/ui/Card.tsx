'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  clickable?: boolean
}

const getCardVariants = (colors: any) => ({
  default: {
    backgroundColor: colors.background.primary,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  elevated: {
    backgroundColor: colors.background.primary,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  outlined: {
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border}`
  },
  glass: {
    backgroundColor: `${colors.background.primary}CC`,
    backdropFilter: 'blur(4px)',
    border: `1px solid ${colors.background.primary}33`
  }
})

const paddingVariants = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  className,
  ...props
}: CardProps) {
  // Theme hook
  const { colors } = useTheme()
  const cardStyles = getCardVariants(colors)[variant]

  return (
    <motion.div
      whileHover={hover || clickable ? { y: -2, scale: 1.01 } : undefined}
      whileTap={clickable ? { scale: 0.99 } : undefined}
      className={cn(
        'rounded-xl transition-all duration-200',
        paddingVariants[padding],
        clickable && 'cursor-pointer',
        className
      )}
      style={cardStyles}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function CardHeader({ title, subtitle, action, children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Content props
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  // Footer props
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  // Title props
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  )
}

export default Card
