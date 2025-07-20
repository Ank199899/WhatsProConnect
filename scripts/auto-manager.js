#!/usr/bin/env node

const { spawn, exec } = require('child_process')
const fs = require('fs')
const path = require('path')

class WhatsAppAutoManager {
  constructor() {
    this.processes = new Map()
    this.config = {
      frontend: {
        name: 'whatsapp-frontend',
        command: 'npm',
        args: ['run', 'dev'],
        port: 3005,
        cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp',
        env: { NODE_ENV: 'production', PORT: '3005', HOST: '0.0.0.0' }
      },
      backend: {
        name: 'whatsapp-backend',
        command: 'node',
        args: ['server/whatsapp-server.js'],
        port: 3002,
        cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp',
        env: { NODE_ENV: 'production', WHATSAPP_SERVER_PORT: '3002', HOST: '0.0.0.0' }
      },
      simulator: {
        name: 'whatsapp-simulator',
        command: 'node',
        args: ['scripts/whatsapp-backend-simulator.js'],
        port: 3001,
        cwd: '/home/admin1/WhatsappAdvWebapp/whatsapp-advanced-webapp',
        env: { NODE_ENV: 'production', PORT: '3001', HOST: '0.0.0.0' }
      }
    }
    this.healthCheckInterval = 30000 // 30 seconds
    this.restartDelay = 5000 // 5 seconds
    this.maxRestarts = 10
    this.restartCounts = new Map()
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${type}] ${message}`
    console.log(logMessage)
    
    // Write to log file
    const logFile = path.join(__dirname, '../logs/auto-manager.log')
    fs.appendFileSync(logFile, logMessage + '\n')
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const { exec } = require('child_process')
      exec(`ss -tulpn | grep :${port}`, (error, stdout) => {
        resolve(stdout.includes(`:${port}`))
      })
    })
  }

  async killPort(port) {
    return new Promise((resolve) => {
      exec(`pkill -f ":${port}"`, (error) => {
        setTimeout(resolve, 2000)
      })
    })
  }

  async startProcess(serviceName) {
    const config = this.config[serviceName]
    if (!config) {
      this.log(`Unknown service: ${serviceName}`, 'ERROR')
      return false
    }

    try {
      // Check if port is already in use
      const portInUse = await this.checkPort(config.port)
      if (portInUse) {
        this.log(`Port ${config.port} already in use, killing existing process...`, 'WARN')
        await this.killPort(config.port)
      }

      this.log(`Starting ${config.name} on port ${config.port}...`)

      const process = spawn(config.command, config.args, {
        cwd: config.cwd,
        env: { ...process.env, ...config.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      })

      // Store process reference
      this.processes.set(serviceName, {
        process,
        config,
        startTime: Date.now(),
        restarts: this.restartCounts.get(serviceName) || 0
      })

      // Handle process output
      process.stdout.on('data', (data) => {
        this.log(`[${config.name}] ${data.toString().trim()}`)
      })

      process.stderr.on('data', (data) => {
        this.log(`[${config.name}] ERROR: ${data.toString().trim()}`, 'ERROR')
      })

      // Handle process exit
      process.on('exit', (code, signal) => {
        this.log(`[${config.name}] Process exited with code ${code}, signal ${signal}`, 'WARN')
        this.processes.delete(serviceName)
        
        // Auto-restart after delay
        setTimeout(() => {
          this.handleProcessRestart(serviceName)
        }, this.restartDelay)
      })

      process.on('error', (error) => {
        this.log(`[${config.name}] Process error: ${error.message}`, 'ERROR')
      })

      // Wait for process to start
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Verify process is running
      const isRunning = await this.checkPort(config.port)
      if (isRunning) {
        this.log(`✅ ${config.name} started successfully on port ${config.port}`)
        return true
      } else {
        this.log(`❌ ${config.name} failed to start on port ${config.port}`, 'ERROR')
        return false
      }

    } catch (error) {
      this.log(`Failed to start ${config.name}: ${error.message}`, 'ERROR')
      return false
    }
  }

  handleProcessRestart(serviceName) {
    const restartCount = this.restartCounts.get(serviceName) || 0
    
    if (restartCount >= this.maxRestarts) {
      this.log(`Max restart limit reached for ${serviceName}. Manual intervention required.`, 'ERROR')
      return
    }

    this.restartCounts.set(serviceName, restartCount + 1)
    this.log(`Auto-restarting ${serviceName} (attempt ${restartCount + 1}/${this.maxRestarts})...`, 'WARN')
    
    this.startProcess(serviceName)
  }

  async healthCheck() {
    for (const [serviceName, config] of Object.entries(this.config)) {
      const isRunning = await this.checkPort(config.port)
      const processInfo = this.processes.get(serviceName)

      if (!isRunning && !processInfo) {
        this.log(`Health check failed for ${serviceName} - restarting...`, 'WARN')
        this.startProcess(serviceName)
      } else if (isRunning && processInfo) {
        // Reset restart count on successful health check
        this.restartCounts.set(serviceName, 0)
      }
    }
  }

  async startAll() {
    this.log('🚀 Starting WhatsApp Auto Manager...')
    
    // Create logs directory
    const logsDir = path.join(__dirname, '../logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Start all services
    for (const serviceName of Object.keys(this.config)) {
      await this.startProcess(serviceName)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Delay between starts
    }

    // Start health check interval
    setInterval(() => {
      this.healthCheck()
    }, this.healthCheckInterval)

    this.log('✅ All services started. Health monitoring active.')
    this.log(`📊 Health checks every ${this.healthCheckInterval/1000} seconds`)
    this.log(`🔄 Auto-restart enabled (max ${this.maxRestarts} attempts per service)`)
  }

  async stop() {
    this.log('🛑 Stopping all services...')
    
    for (const [serviceName, processInfo] of this.processes) {
      try {
        processInfo.process.kill('SIGTERM')
        this.log(`Stopped ${serviceName}`)
      } catch (error) {
        this.log(`Error stopping ${serviceName}: ${error.message}`, 'ERROR')
      }
    }

    // Kill by ports as backup
    for (const config of Object.values(this.config)) {
      await this.killPort(config.port)
    }

    this.log('✅ All services stopped')
    process.exit(0)
  }

  getStatus() {
    this.log('📊 Service Status:')
    for (const [serviceName, config] of Object.entries(this.config)) {
      const processInfo = this.processes.get(serviceName)
      const status = processInfo ? '🟢 RUNNING' : '🔴 STOPPED'
      const restarts = this.restartCounts.get(serviceName) || 0
      this.log(`  ${config.name}: ${status} (Port: ${config.port}, Restarts: ${restarts})`)
    }
  }
}

// Handle process signals
const manager = new WhatsAppAutoManager()

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  manager.stop()
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  manager.stop()
})

// Handle command line arguments
const command = process.argv[2]

switch (command) {
  case 'start':
    manager.startAll()
    break
  case 'stop':
    manager.stop()
    break
  case 'status':
    manager.getStatus()
    break
  case 'restart':
    manager.stop().then(() => {
      setTimeout(() => manager.startAll(), 3000)
    })
    break
  default:
    console.log('Usage: node auto-manager.js [start|stop|status|restart]')
    console.log('  start   - Start all services with auto-restart')
    console.log('  stop    - Stop all services')
    console.log('  status  - Show service status')
    console.log('  restart - Restart all services')
    process.exit(1)
}
