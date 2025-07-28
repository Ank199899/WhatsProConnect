'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LiquidGlassProps {
  children: React.ReactNode
  className?: string
  variant?: 'card' | 'button' | 'input' | 'modal' | 'sidebar' | 'primary'
  hover?: boolean
  shimmer?: boolean
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  opacity?: 'low' | 'medium' | 'high'
  style?: React.CSSProperties
}

const blurValues = {
  sm: 'blur(8px)',
  md: 'blur(12px)',
  lg: 'blur(16px)',
  xl: 'blur(24px)'
}

const opacityValues = {
  low: { bg: 0.05, border: 0.1 },
  medium: { bg: 0.08, border: 0.15 },
  high: { bg: 0.12, border: 0.2 }
}

export default function LiquidGlass({
  children,
  className,
  variant = 'primary',
  hover = true,
  shimmer = false,
  blur = 'md',
  opacity = 'medium',
  style,
  ...props
}: LiquidGlassProps & React.HTMLAttributes<HTMLDivElement>) {
  const opacityConfig = opacityValues[opacity]
  const blurValue = blurValues[blur]

  const baseStyles = {
    background: `linear-gradient(135deg, 
      rgba(255, 255, 255, ${opacityConfig.bg}) 0%, 
      rgba(255, 255, 255, ${opacityConfig.bg * 0.7}) 100%)`,
    backdropFilter: blurValue,
    WebkitBackdropFilter: blurValue,
    border: `1px solid rgba(255, 255, 255, ${opacityConfig.border})`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...style
  }

  const variantStyles = {
    card: 'rounded-3xl p-6',
    button: 'rounded-2xl px-6 py-3 cursor-pointer',
    input: 'rounded-2xl px-4 py-3',
    modal: 'rounded-3xl p-8',
    sidebar: 'rounded-none border-r border-l-0 border-t-0 border-b-0',
    primary: 'rounded-2xl p-4'
  }

  const hoverEffects = hover ? {
    whileHover: {
      scale: variant === 'button' ? 1.02 : 1.01,
      boxShadow: '0 12px 40px rgba(255, 255, 255, 0.1)'
    },
    whileTap: variant === 'button' ? { scale: 0.98 } : undefined
  } : {}

  return (
    <motion.div
      className={cn(
        'liquid-glass transition-all duration-300',
        variantStyles[variant],
        className
      )}
      style={baseStyles}
      {...hoverEffects}
      {...props}
    >
      {/* Glass Reflection Effect */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            transparent 100%)`,
          borderRadius: 'inherit'
        }}
      />

      {/* Shimmer Effect */}
      {shimmer && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(45deg,
              transparent 30%,
              rgba(255, 255, 255, 0.2) 50%,
              transparent 70%)`,
            transform: 'translateX(-100%)'
          }}
          animate={{
            transform: ['translateX(-100%)', 'translateX(100%)']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

// Specialized Components
export function LiquidGlassCard({ children, className, ...props }: Omit<LiquidGlassProps, 'variant'>) {
  return (
    <LiquidGlass variant="card" className={className} {...props}>
      {children}
    </LiquidGlass>
  )
}

export function LiquidGlassButton({ children, className, ...props }: Omit<LiquidGlassProps, 'variant'>) {
  return (
    <LiquidGlass variant="button" className={className} shimmer hover {...props}>
      {children}
    </LiquidGlass>
  )
}

export function LiquidGlassInput({ children, className, ...props }: Omit<LiquidGlassProps, 'variant'>) {
  return (
    <LiquidGlass variant="input" className={className} hover={false} {...props}>
      {children}
    </LiquidGlass>
  )
}

export function LiquidGlassModal({ children, className, ...props }: Omit<LiquidGlassProps, 'variant'>) {
  return (
    <LiquidGlass variant="modal" className={className} blur="xl" opacity="high" {...props}>
      {children}
    </LiquidGlass>
  )
}

// Glass Background Component
export function LiquidGlassBackground({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn('liquid-glass-bg relative', className)}>
      {/* Floating Glass Orbs */}
      <div className="glass-orb glass-orb-1"></div>
      <div className="glass-orb glass-orb-2"></div>
      <div className="glass-orb glass-orb-3"></div>
      
      {/* Content */}
      {children}
    </div>
  )
}
