'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function FloatingElements() {
  const [mounted, setMounted] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    setMounted(true)

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Liquid Glass Orbs with enhanced effects
  const liquidGlassOrbs = [
    { size: 150, opacity: 0.08, blur: 'blur(20px)', delay: 0 },
    { size: 200, opacity: 0.06, blur: 'blur(24px)', delay: 2 },
    { size: 120, opacity: 0.1, blur: 'blur(16px)', delay: 4 },
    { size: 180, opacity: 0.07, blur: 'blur(22px)', delay: 6 },
  ]

  // Floating glass particles
  const glassParticles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: 3 + (i % 4),
    opacity: 0.15 + (i % 3) * 0.05,
    delay: i * 1.2,
    duration: 25 + (i % 4) * 5
  }))

  // Liquid glass waves
  const liquidWaves = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    height: 100 + i * 30,
    opacity: 0.03 + i * 0.01,
    delay: i * 3,
    duration: 20 + i * 5
  }))

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden liquid-glass-bg">
      {/* Liquid Glass Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Liquid Glass Orbs */}
      {liquidGlassOrbs.map((orb, index) => (
        <motion.div
          key={`glass-orb-${index}`}
          className="absolute glass-orb"
          style={{
            width: orb.size,
            height: orb.size,
            background: `linear-gradient(135deg,
              rgba(255, 255, 255, ${orb.opacity}) 0%,
              rgba(255, 255, 255, ${orb.opacity * 0.5}) 100%)`,
            backdropFilter: orb.blur,
            WebkitBackdropFilter: orb.blur,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
          }}
          initial={{
            x: (index * 350) % dimensions.width,
            y: (index * 250) % dimensions.height,
            scale: 0.8
          }}
          animate={{
            x: [
              (index * 350) % dimensions.width,
              ((index * 350) + 150) % dimensions.width,
              (index * 350) % dimensions.width
            ],
            y: [
              (index * 250) % dimensions.height,
              ((index * 250) + 100) % dimensions.height,
              (index * 250) % dimensions.height
            ],
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 30 + index * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay
          }}
        />
      ))}

      {/* Floating Glass Particles */}
      {glassParticles.map((particle) => (
        <motion.div
          key={`glass-particle-${particle.id}`}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `rgba(255, 255, 255, ${particle.opacity})`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1)'
          }}
          initial={{
            x: (particle.id * 200) % dimensions.width,
            y: dimensions.height + 50,
            opacity: 0
          }}
          animate={{
            x: [
              (particle.id * 200) % dimensions.width,
              ((particle.id * 200) + 80) % dimensions.width,
              (particle.id * 200) % dimensions.width
            ],
            y: [
              dimensions.height + 50,
              dimensions.height * 0.2,
              -50
            ],
            opacity: [0, particle.opacity, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay
          }}
        />
      ))}

      {/* Liquid Glass Waves */}
      {liquidWaves.map((wave) => (
        <motion.div
          key={`liquid-wave-${wave.id}`}
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: wave.height,
            background: `linear-gradient(180deg,
              transparent 0%,
              rgba(255, 255, 255, ${wave.opacity * 0.5}) 50%,
              rgba(255, 255, 255, ${wave.opacity}) 100%)`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          animate={{
            transform: [
              'translateY(0px) scaleY(1)',
              'translateY(-15px) scaleY(1.1)',
              'translateY(0px) scaleY(1)'
            ],
            opacity: [wave.opacity, wave.opacity * 1.5, wave.opacity]
          }}
          transition={{
            duration: wave.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: wave.delay
          }}
        />
      ))}

      {/* Liquid Glass Corner Accents */}
      <motion.div
        className="absolute top-0 right-0 w-80 h-80"
        style={{
          background: `radial-gradient(circle at top right,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 40%,
            transparent 70%)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottomLeft: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80"
        style={{
          background: `radial-gradient(circle at bottom left,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.03) 40%,
            transparent 70%)`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTopRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
      />

      {/* Liquid Glass Center Accent */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(circle,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.01) 50%,
            transparent 100%)`,
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
        animate={{
          scale: [0.8, 1.1, 0.8],
          rotate: [0, 180, 360],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Glass Shimmer Effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.02) 50%,
            transparent 70%)`,
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: ['translateX(-100%)', 'translateX(100%)']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}
