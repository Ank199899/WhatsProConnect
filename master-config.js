/**
 * 🎯 MASTER CONFIGURATION - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️  CHANGE ONLY HERE - EVERYTHING ELSE WILL AUTO-UPDATE!
 */

const MASTER_CONFIG = {
  // 🌐 MAIN DOMAIN (without port) - Tailscale IP for remote access
  DOMAIN: '100.115.3.36',

  // 🔧 INTERNAL PORTS (hidden from users)
  INTERNAL_PORTS: {
    FRONTEND: 3008,
    BACKEND: 3006,
    NGINX: 80
  },

  // 🚀 AUTO-START CONFIGURATION
  AUTO_START: {
    ENABLED: true,
    STARTUP_DELAY: 10,              // 10 seconds delay between services
    HEALTH_CHECK_INTERVAL: 30,      // 30 seconds health check
    MAX_RESTART_ATTEMPTS: 5,        // Maximum restart attempts
    RESTART_DELAY: 15,              // 15 seconds between restart attempts
    BOOT_DELAY: 60,                 // 60 seconds delay after system boot
    SERVICES: [
      'whatsapp-nextjs',
      'whatsapp-server-main',
      'queue-worker-1',
      'health-monitor'
    ]
  },

  // 🌍 PUBLIC URLs (what users see - Tailscale for remote access!)
  PUBLIC_URLS: {
    APP: 'http://100.115.3.36:3008',       // Main app (Tailscale IP)
    API: 'http://100.115.3.36:3006/api',   // API endpoint (Tailscale IP)
    ADMIN: 'http://100.115.3.36:3008/admin' // Admin panel (Tailscale IP)
  },
  
  // 📱 APP SETTINGS
  APP: {
    NAME: 'WhatsPro Connect',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production'
  },
  
  // 🗄️ DATABASE - POSTGRESQL CONFIGURATION
  DATABASE: {
    TYPE: 'postgresql',
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 5432,
    NAME: process.env.DB_NAME || 'whatsapp_advanced',
    USER: process.env.DB_USER || 'whatsapp_user',
    PASSWORD: process.env.DB_PASSWORD || 'whatsapp_secure_password_2025',
    SSL: process.env.DB_SSL === 'true',
    MAX_CONNECTIONS: 200,
    BACKUP_PATH: './data/backups/'
  },

  // 🚀 ENTERPRISE BULK MESSAGING - 10 LAKH PER DAY
  BULK_MESSAGING: {
    // Daily Targets
    DAILY_TARGET: 1000000,              // 10 lakh messages per day
    HOURLY_TARGET: 62500,               // 62.5k messages per hour (16 hours)
    MINUTE_TARGET: 1041,                // 1041 messages per minute

    // Session Management
    TOTAL_SESSIONS: 200,                // 200 WhatsApp accounts
    MESSAGES_PER_SESSION_DAILY: 5000,   // 5k per session per day
    MESSAGES_PER_SESSION_HOURLY: 312,   // 312 per session per hour
    SESSION_ROTATION_INTERVAL: 50,      // Rotate every 50 messages

    // Rate Limiting (Anti-Block)
    MIN_DELAY: 1000,                    // 1 second minimum
    MAX_DELAY: 3000,                    // 3 seconds maximum
    BATCH_SIZE: 25,                     // 25 messages per batch
    BATCH_DELAY: 60,                    // 1 minute between batches

    // Business Hours
    START_HOUR: 8,                      // 8 AM
    END_HOUR: 24,                       // 12 AM (midnight)
    WORKING_HOURS: 16,                  // 16 hours per day

    // Queue Management
    REDIS_QUEUE: true,
    WORKER_PROCESSES: 10,               // 10 worker processes
    CONCURRENT_JOBS: 50,                // 50 concurrent jobs
    QUEUE_PRIORITY: true,               // Priority queue

    // Anti-Blocking Advanced
    HUMAN_SIMULATION: true,
    TYPING_DELAY: [500, 2000],          // 0.5-2 seconds typing
    READ_RECEIPTS: false,
    ONLINE_STATUS_RANDOM: true,
    MESSAGE_ORDER_SHUFFLE: true,

    // Monitoring & Alerts
    REAL_TIME_MONITORING: true,
    FAILURE_THRESHOLD: 5,               // Alert if >5% fail
    AUTO_PAUSE_ON_BLOCKS: true,
    HEALTH_CHECK_INTERVAL: 30,          // 30 seconds

    // Retry Logic
    MAX_RETRIES: 3,
    RETRY_DELAY: 300,                   // 5 minutes
    EXPONENTIAL_BACKOFF: true,

    // Load Balancing
    LOAD_BALANCER: true,
    SESSION_HEALTH_CHECK: true,
    AUTO_FAILOVER: true,
    DYNAMIC_SCALING: true
  },
  
  // 📁 PATHS
  PATHS: {
    SESSIONS: './sessions',
    UPLOADS: './public/uploads',
    LOGS: './logs'
  }
}

// 🔄 AUTO-GENERATE INTERNAL URLs
MASTER_CONFIG.INTERNAL_URLS = {
  FRONTEND: `http://localhost:${MASTER_CONFIG.INTERNAL_PORTS.FRONTEND}`,
  BACKEND: `http://localhost:${MASTER_CONFIG.INTERNAL_PORTS.BACKEND}`,
  API: `http://localhost:${MASTER_CONFIG.INTERNAL_PORTS.BACKEND}/api`
}

// 📤 EXPORT FOR ALL FILES
module.exports = MASTER_CONFIG

// 🖨️ DISPLAY CONFIG
console.log('🎯 MASTER CONFIG LOADED:')
console.log(`   Public App: ${MASTER_CONFIG.PUBLIC_URLS.APP}`)
console.log(`   Public API: ${MASTER_CONFIG.PUBLIC_URLS.API}`)
console.log(`   Internal Frontend: ${MASTER_CONFIG.INTERNAL_URLS.FRONTEND}`)
console.log(`   Internal Backend: ${MASTER_CONFIG.INTERNAL_URLS.BACKEND}`)
console.log('')
