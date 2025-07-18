'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  clickable?: boolean
}

const cardVariants = {
  default: 'bg-white shadow-sm',
  elevated: 'bg-white shadow-lg',
  outlined: 'bg-white border border-gray-200',
  glass: 'bg-white/80 backdrop-blur-sm border border-white/20'
}

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
  return (
    <motion.div
      whileHover={hover || clickable ? { y: -2, scale: 1.01 } : undefined}
      whileTap={clickable ? { scale: 0.99 } : undefined}
      className={cn(
        'rounded-xl transition-all duration-200',
        cardVariants[variant],
        paddingVariants[padding],
        hover && 'hover:shadow-lg',
        clickable && 'cursor-pointer',
        className
      )}
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

export default Card
