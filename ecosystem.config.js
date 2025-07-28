module.exports = {
  apps: [
    // 🌐 FRONTEND - Next.js Application
    {
      name: 'whatsapp-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/home/admin1/WhatsappAdvWebapp/WhatsPro Connect',
      instances: 1,                    // Single instance for stability
      exec_mode: 'fork',               // Fork mode
      autorestart: true,
      watch: false,
      max_memory_restart: '8G',        // Higher memory limit
      restart_delay: 1000,             // Faster restart
      max_restarts: 0,                 // Unlimited restarts
      min_uptime: '10s',               // Lower min uptime
      env: {
        NODE_ENV: 'production',        // Production mode
        PORT: 3008,                    // Use port 3008 as configured
        HOST: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=8192'
      },
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      log_file: './logs/nextjs-combined.log',
      time: true,
      merge_logs: true
    },

    // 🚀 WHATSAPP SERVER - Main Backend
    {
      name: 'whatsapp-server-main',
      script: 'server/whatsapp-server.js',
      cwd: '/home/admin1/WhatsappAdvWebapp/WhatsPro Connect',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '16G',       // Much higher memory limit
      restart_delay: 1000,             // Faster restart
      max_restarts: 0,                 // Unlimited restarts
      min_uptime: '10s',               // Lower min uptime
      env: {
        NODE_ENV: 'production',
        WHATSAPP_SERVER_PORT: 3006,
        HOST: '0.0.0.0',
        SERVER_TYPE: 'main',
        MAX_SESSIONS: 200,
        BULK_MODE: 'enterprise',
        NODE_OPTIONS: '--max-old-space-size=16384'
      },
      error_file: './logs/whatsapp-main-error.log',
      out_file: './logs/whatsapp-main-out.log',
      log_file: './logs/whatsapp-main-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};
