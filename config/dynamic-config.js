/**
 * 🚀 DYNAMIC CONFIGURATION SYSTEM
 * Automatically detects IP and finds available ports
 */

const os = require('os')
const net = require('net')

// Get all network interfaces
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces()
  const addresses = []
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push({
          name: name,
          address: interface.address,
          netmask: interface.netmask
        })
      }
    }
  }
  
  return addresses
}

// Get primary IP address
function getPrimaryIP() {
  const interfaces = getNetworkInterfaces()
  
  // Prefer ethernet/wifi interfaces
  const preferred = interfaces.find(iface => 
    iface.name.includes('eth') || 
    iface.name.includes('wlan') || 
    iface.name.includes('en') ||
    iface.name.includes('wlp')
  )
  
  if (preferred) {
    return preferred.address
  }
  
  // Fallback to first available
  if (interfaces.length > 0) {
    return interfaces[0].address
  }
  
  // Ultimate fallback
  return 'localhost'
}

// Check if port is available
function isPortAvailable(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, host, () => {
      server.once('close', () => {
        resolve(true)
      })
      server.close()
    })
    
    server.on('error', () => {
      resolve(false)
    })
  })
}

// Find available port starting from a base port
async function findAvailablePort(basePort, host = '0.0.0.0', maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i
    if (await isPortAvailable(port, host)) {
      return port
    }
  }
  throw new Error(`No available port found starting from ${basePort}`)
}

// Generate dynamic configuration
async function generateDynamicConfig() {
  console.log('🔍 Detecting network configuration...')
  
  // Get IP address
  const primaryIP = getPrimaryIP()
  const interfaces = getNetworkInterfaces()
  
  console.log('🌐 Network Interfaces Found:')
  interfaces.forEach(iface => {
    console.log(`   ${iface.name}: ${iface.address}`)
  })
  console.log(`🎯 Primary IP Selected: ${primaryIP}`)
  
  // Find available ports
  console.log('🔍 Finding available ports...')
  
  const frontendPort = await findAvailablePort(3000)
  const backendPort = await findAvailablePort(3006)
  
  console.log(`✅ Frontend Port: ${frontendPort}`)
  console.log(`✅ Backend Port: ${backendPort}`)
  
  const config = {
    // Network Info
    NETWORK: {
      PRIMARY_IP: primaryIP,
      INTERFACES: interfaces,
      HOSTNAME: os.hostname()
    },
    
    // Dynamic Ports
    PORTS: {
      FRONTEND: frontendPort,
      BACKEND: backendPort,
      DATABASE: 5432,
      REDIS: 6379
    },
    
    // URLs
    URLS: {
      // Public URLs (what users access)
      PUBLIC_FRONTEND: `http://${primaryIP}:${frontendPort}`,
      PUBLIC_BACKEND: `http://${primaryIP}:${backendPort}`,
      PUBLIC_API: `http://${primaryIP}:${backendPort}/api`,
      
      // Internal URLs (for server communication)
      INTERNAL_FRONTEND: `http://localhost:${frontendPort}`,
      INTERNAL_BACKEND: `http://localhost:${backendPort}`,
      INTERNAL_API: `http://localhost:${backendPort}/api`,
      
      // Bind URLs (for server binding)
      BIND_FRONTEND: `http://0.0.0.0:${frontendPort}`,
      BIND_BACKEND: `http://0.0.0.0:${backendPort}`,
      BIND_API: `http://0.0.0.0:${backendPort}/api`,
      
      // WebSocket
      WEBSOCKET: `ws://${primaryIP}:${backendPort}`,
      WEBSOCKET_INTERNAL: `ws://localhost:${backendPort}`
    },
    
    // Environment
    ENV: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      TIMESTAMP: new Date().toISOString(),
      PLATFORM: os.platform(),
      ARCH: os.arch(),
      HOSTNAME: os.hostname()
    }
  }
  
  return config
}

// Export for different module systems
module.exports = {
  generateDynamicConfig,
  getPrimaryIP,
  getNetworkInterfaces,
  findAvailablePort,
  isPortAvailable
}

// Auto-generate and display config when run directly
if (require.main === module) {
  generateDynamicConfig().then(config => {
    console.log('\n🎯 DYNAMIC CONFIGURATION GENERATED:')
    console.log('=====================================')
    console.log(`🌐 Primary IP: ${config.NETWORK.PRIMARY_IP}`)
    console.log(`🔧 Frontend Port: ${config.PORTS.FRONTEND}`)
    console.log(`🔧 Backend Port: ${config.PORTS.BACKEND}`)
    console.log(`🌍 Public Frontend: ${config.URLS.PUBLIC_FRONTEND}`)
    console.log(`🌍 Public API: ${config.URLS.PUBLIC_API}`)
    console.log(`🔌 WebSocket: ${config.URLS.WEBSOCKET}`)
    console.log('=====================================\n')
    
    // Save to global for other modules
    global.DYNAMIC_CONFIG = config
  }).catch(console.error)
}
