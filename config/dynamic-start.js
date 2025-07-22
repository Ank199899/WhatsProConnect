#!/usr/bin/env node

/**
 * 🚀 DYNAMIC START SCRIPT
 * Automatically detects IP and ports, then starts services
 */

const { spawn } = require('child_process')
const { generateDynamicConfig } = require('./dynamic-config')
const fs = require('fs')
const path = require('path')

// Get command line argument
const command = process.argv[2] || 'start'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'cyan') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Save config to file for other processes
function saveConfigToFile(config) {
  const configPath = path.join(__dirname, 'current-config.json')
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  log(`💾 Configuration saved to: ${configPath}`, 'green')
}

// Load config from file
function loadConfigFromFile() {
  const configPath = path.join(__dirname, 'current-config.json')
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  }
  return null
}

// Start Next.js frontend
function startFrontend(config, isDev = false) {
  log('🚀 Starting Frontend...', 'blue')
  
  const args = isDev 
    ? ['dev', '--turbopack', '-H', '0.0.0.0', '-p', config.PORTS.FRONTEND.toString()]
    : ['start', '-H', '0.0.0.0', '-p', config.PORTS.FRONTEND.toString()]
  
  const frontend = spawn('npx', ['next', ...args], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DYNAMIC_CONFIG: JSON.stringify(config)
    }
  })
  
  frontend.on('error', (err) => {
    log(`❌ Frontend error: ${err.message}`, 'red')
  })
  
  return frontend
}

// Start WhatsApp backend server
function startBackend(config) {
  log('🔧 Starting Backend...', 'blue')
  
  const backend = spawn('node', ['server/whatsapp-server.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DYNAMIC_CONFIG: JSON.stringify(config)
    }
  })
  
  backend.on('error', (err) => {
    log(`❌ Backend error: ${err.message}`, 'red')
  })
  
  return backend
}

// Main function
async function main() {
  try {
    log('🎯 DYNAMIC WHATSAPP WEBAPP STARTER', 'bright')
    log('==================================', 'cyan')
    
    // Generate dynamic configuration
    const config = await generateDynamicConfig()
    
    // Save config for other processes
    saveConfigToFile(config)
    
    // Display configuration
    log('\n📋 CONFIGURATION:', 'yellow')
    log(`   🌐 Primary IP: ${config.NETWORK.PRIMARY_IP}`, 'green')
    log(`   🔧 Frontend Port: ${config.PORTS.FRONTEND}`, 'green')
    log(`   🔧 Backend Port: ${config.PORTS.BACKEND}`, 'green')
    log(`   🌍 Public URL: ${config.URLS.PUBLIC_FRONTEND}`, 'green')
    log(`   🔗 API URL: ${config.URLS.PUBLIC_API}`, 'green')
    log(`   🔌 WebSocket: ${config.URLS.WEBSOCKET}`, 'green')
    
    // Handle different commands
    switch (command) {
      case 'dev':
        log('\n🔥 Starting in DEVELOPMENT mode...', 'yellow')
        startFrontend(config, true)
        break
        
      case 'start':
        log('\n🚀 Starting in PRODUCTION mode...', 'green')
        startFrontend(config, false)
        break
        
      case 'server':
        log('\n🔧 Starting BACKEND only...', 'blue')
        startBackend(config)
        break
        
      case 'full-dev':
        log('\n🔥 Starting FULL STACK in DEVELOPMENT mode...', 'yellow')
        const devFrontend = startFrontend(config, true)
        const devBackend = startBackend(config)
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          log('\n🛑 Shutting down...', 'yellow')
          devFrontend.kill()
          devBackend.kill()
          process.exit(0)
        })
        break
        
      case 'full-prod':
        log('\n🚀 Starting FULL STACK in PRODUCTION mode...', 'green')
        const prodFrontend = startFrontend(config, false)
        const prodBackend = startBackend(config)
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          log('\n🛑 Shutting down...', 'yellow')
          prodFrontend.kill()
          prodBackend.kill()
          process.exit(0)
        })
        break
        
      default:
        log(`❌ Unknown command: ${command}`, 'red')
        log('Available commands: dev, start, server, full-dev, full-prod', 'yellow')
        process.exit(1)
    }
    
    // Display access URLs
    setTimeout(() => {
      log('\n🌟 ACCESS URLS:', 'bright')
      log('===============', 'cyan')
      log(`🌍 Frontend: ${config.URLS.PUBLIC_FRONTEND}`, 'green')
      log(`🔗 API: ${config.URLS.PUBLIC_API}`, 'green')
      log(`📱 Mobile: ${config.URLS.PUBLIC_FRONTEND} (use your phone)`, 'green')
      log(`💻 Local: http://localhost:${config.PORTS.FRONTEND}`, 'green')
      log('===============', 'cyan')
    }, 2000)
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log(`❌ Uncaught Exception: ${err.message}`, 'red')
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  log(`❌ Unhandled Rejection: ${err.message}`, 'red')
  process.exit(1)
})

// Run main function
main()
