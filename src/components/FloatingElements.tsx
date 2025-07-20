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

  // Professional geometric shapes
  const geometricShapes = [
    { type: 'circle', size: 120, opacity: 0.03, color: 'emerald' },
    { type: 'square', size: 80, opacity: 0.04, color: 'green' },
    { type: 'triangle', size: 100, opacity: 0.03, color: 'teal' },
    { type: 'hexagon', size: 90, opacity: 0.04, color: 'emerald' },
  ]

  // Stable floating particles (no random values to prevent hydration mismatch)
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: 2 + (i % 3),
    opacity: 0.02 + (i % 5) * 0.01,
    delay: i * 0.8,
    duration: 20 + (i % 3) * 5
  }))

  // Professional gradient orbs (stable values)
  const gradientOrbs = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    size: 200 + i * 50,
    opacity: 0.02 + i * 0.005,
    delay: i * 2,
    duration: 30 + i * 5
  }))

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Professional Geometric Shapes */}
      {geometricShapes.map((shape, index) => (
        <motion.div
          key={`shape-${index}`}
          className="absolute"
          initial={{
            x: (index * 300) % dimensions.width,
            y: (index * 200) % dimensions.height,
            rotate: 0,
            scale: 0.8
          }}
          animate={{
            x: [
              (index * 300) % dimensions.width,
              ((index * 300) + 200) % dimensions.width,
              (index * 300) % dimensions.width
            ],
            y: [
              (index * 200) % dimensions.height,
              ((index * 200) + 150) % dimensions.height,
              (index * 200) % dimensions.height
            ],
            rotate: [0, 180, 360],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{
            duration: 40 + index * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 2
          }}
        >
          {shape.type === 'circle' && (
            <div
              className={`rounded-full bg-gradient-to-br from-${shape.color}-200 to-${shape.color}-300`}
              style={{
                width: shape.size,
                height: shape.size,
                opacity: shape.opacity
              }}
            />
          )}
          {shape.type === 'square' && (
            <div
              className={`bg-gradient-to-br from-${shape.color}-200 to-${shape.color}-300 rounded-lg`}
              style={{
                width: shape.size,
                height: shape.size,
                opacity: shape.opacity
              }}
            />
          )}
          {shape.type === 'triangle' && (
            <div
              className={`bg-gradient-to-br from-${shape.color}-200 to-${shape.color}-300`}
              style={{
                width: 0,
                height: 0,
                borderLeft: `${shape.size/2}px solid transparent`,
                borderRight: `${shape.size/2}px solid transparent`,
                borderBottom: `${shape.size}px solid rgba(16, 185, 129, ${shape.opacity})`,
              }}
            />
          )}
          {shape.type === 'hexagon' && (
            <div
              className={`bg-gradient-to-br from-${shape.color}-200 to-${shape.color}-300`}
              style={{
                width: shape.size,
                height: shape.size * 0.866,
                opacity: shape.opacity,
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Subtle Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute rounded-full bg-emerald-400"
          style={{
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity
          }}
          initial={{
            x: (particle.id * 150) % dimensions.width,
            y: dimensions.height + 50
          }}
          animate={{
            x: [
              (particle.id * 150) % dimensions.width,
              ((particle.id * 150) + 100) % dimensions.width,
              (particle.id * 150) % dimensions.width
            ],
            y: [
              dimensions.height + 50,
              dimensions.height * 0.3,
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

      {/* Professional Gradient Orbs */}
      {gradientOrbs.map((orb) => (
        <motion.div
          key={`orb-${orb.id}`}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle,
              rgba(16, 185, 129, ${orb.opacity}) 0%,
              rgba(5, 150, 105, ${orb.opacity * 0.7}) 50%,
              transparent 100%)`
          }}
          initial={{
            x: (orb.id * 400) % dimensions.width,
            y: (orb.id * 300) % dimensions.height
          }}
          animate={{
            x: [
              (orb.id * 400) % dimensions.width,
              ((orb.id * 400) + 200) % dimensions.width,
              (orb.id * 400) % dimensions.width
            ],
            y: [
              (orb.id * 300) % dimensions.height,
              ((orb.id * 300) + 150) % dimensions.height,
              (orb.id * 300) % dimensions.height
            ],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay
          }}
        />
      ))}

      {/* Subtle Wave Animation */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-32 opacity-[0.02]"
        style={{
          background: `linear-gradient(180deg,
            transparent 0%,
            rgba(16, 185, 129, 0.1) 50%,
            rgba(16, 185, 129, 0.2) 100%)`
        }}
        animate={{
          transform: [
            'translateY(0px) scaleY(1)',
            'translateY(-10px) scaleY(1.1)',
            'translateY(0px) scaleY(1)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Professional Corner Accents */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 opacity-[0.03]"
        style={{
          background: `radial-gradient(circle at top right,
            rgba(16, 185, 129, 0.1) 0%,
            transparent 70%)`
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.03]"
        style={{
          background: `radial-gradient(circle at bottom left,
            rgba(5, 150, 105, 0.1) 0%,
            transparent 70%)`
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />
    </div>
  )
}
