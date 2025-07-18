module.exports = {
  apps: [
    {
      name: 'whatsapp-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      log_file: './logs/nextjs-combined.log',
      time: true
    },
    {
      name: 'whatsapp-server',
      script: 'server/whatsapp-server.js',
      cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        WHATSAPP_SERVER_PORT: 3002
      },
      error_file: './logs/whatsapp-error.log',
      out_file: './logs/whatsapp-out.log',
      log_file: './logs/whatsapp-combined.log',
      time: true
    }
  ]
};
