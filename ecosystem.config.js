module.exports = {
  apps: [
    {
      name: 'whatsapp-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250722_160758',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOST: '0.0.0.0'
      },
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      log_file: './logs/nextjs-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'whatsapp-server',
      script: 'server/whatsapp-server.js',
      cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp-backup-20250722_160758',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        WHATSAPP_SERVER_PORT: 3006,
        HOST: '0.0.0.0'
      },
      error_file: './logs/whatsapp-error.log',
      out_file: './logs/whatsapp-out.log',
      log_file: './logs/whatsapp-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};
