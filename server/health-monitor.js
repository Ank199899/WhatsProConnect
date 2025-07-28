/**
 * 🛡️ HEALTH MONITOR - Enterprise System Monitoring
 * Real-time monitoring for 10 lakh daily messages
 */

const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const os = require('os');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.HEALTH_CHECK_PORT || 3007;

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'whatsapp_advanced',
    user: process.env.DB_USER || 'whatsapp_user',
    password: process.env.DB_PASSWORD || 'whatsapp_secure_password_2025',
    max: 5
});

// Redis connection
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'whatsapp_redis_secure_2025',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
});

// Health metrics storage
let healthMetrics = {
    lastUpdate: new Date(),
    system: {},
    database: {},
    redis: {},
    sessions: {},
    messaging: {},
    alerts: []
};

// System monitoring
async function checkSystemHealth() {
    try {
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsage = ((totalMem - freeMem) / totalMem) * 100;
        
        // Disk usage
        const stats = await fs.stat('./');
        const diskUsage = await getDiskUsage();
        
        healthMetrics.system = {
            cpuUsage: Math.round(cpuUsage * 100) / 100,
            memoryUsage: Math.round(memUsage * 100) / 100,
            diskUsage: diskUsage,
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            timestamp: new Date()
        };
        
        // Check thresholds
        if (cpuUsage > 80) {
            addAlert('HIGH_CPU', `CPU usage: ${cpuUsage.toFixed(2)}%`);
        }
        if (memUsage > 85) {
            addAlert('HIGH_MEMORY', `Memory usage: ${memUsage.toFixed(2)}%`);
        }
        if (diskUsage > 90) {
            addAlert('HIGH_DISK', `Disk usage: ${diskUsage}%`);
        }
        
    } catch (error) {
        console.error('System health check failed:', error);
        addAlert('SYSTEM_ERROR', error.message);
    }
}

// Database monitoring
async function checkDatabaseHealth() {
    try {
        const start = Date.now();
        
        // Connection test
        const client = await pool.connect();
        const connectionTime = Date.now() - start;
        
        // Query performance test
        const queryStart = Date.now();
        const result = await client.query('SELECT COUNT(*) FROM whatsapp_sessions');
        const queryTime = Date.now() - queryStart;
        
        // Get database stats
        const dbStats = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM whatsapp_sessions WHERE status = 'ready') as active_sessions,
                (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 hour') as messages_last_hour,
                (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 day') as messages_today,
                (SELECT COUNT(*) FROM campaigns WHERE status = 'active') as active_campaigns
        `);
        
        client.release();
        
        healthMetrics.database = {
            connectionTime,
            queryTime,
            activeSessions: parseInt(dbStats.rows[0].active_sessions),
            messagesLastHour: parseInt(dbStats.rows[0].messages_last_hour),
            messagesToday: parseInt(dbStats.rows[0].messages_today),
            activeCampaigns: parseInt(dbStats.rows[0].active_campaigns),
            timestamp: new Date()
        };
        
        // Check thresholds
        if (connectionTime > 1000) {
            addAlert('SLOW_DB_CONNECTION', `DB connection: ${connectionTime}ms`);
        }
        if (queryTime > 5000) {
            addAlert('SLOW_DB_QUERY', `DB query: ${queryTime}ms`);
        }
        
    } catch (error) {
        console.error('Database health check failed:', error);
        addAlert('DATABASE_ERROR', error.message);
        healthMetrics.database = { error: error.message, timestamp: new Date() };
    }
}

// Redis monitoring
async function checkRedisHealth() {
    try {
        const start = Date.now();
        await redis.ping();
        const pingTime = Date.now() - start;
        
        // Get Redis info
        const info = await redis.info();
        const memory = await redis.info('memory');
        
        // Parse memory info
        const memoryLines = memory.split('\r\n');
        const usedMemory = memoryLines.find(line => line.startsWith('used_memory:'));
        const maxMemory = memoryLines.find(line => line.startsWith('maxmemory:'));
        
        // Get queue stats
        const queueLength = await redis.llen('message_queue');
        const processingQueue = await redis.llen('processing_queue');
        const failedQueue = await redis.llen('failed_queue');
        
        healthMetrics.redis = {
            pingTime,
            queueLength,
            processingQueue,
            failedQueue,
            usedMemory: usedMemory ? usedMemory.split(':')[1] : 'unknown',
            maxMemory: maxMemory ? maxMemory.split(':')[1] : 'unknown',
            timestamp: new Date()
        };
        
        // Check thresholds
        if (pingTime > 100) {
            addAlert('SLOW_REDIS', `Redis ping: ${pingTime}ms`);
        }
        if (queueLength > 10000) {
            addAlert('HIGH_QUEUE', `Queue length: ${queueLength}`);
        }
        if (failedQueue > 100) {
            addAlert('HIGH_FAILURES', `Failed queue: ${failedQueue}`);
        }
        
    } catch (error) {
        console.error('Redis health check failed:', error);
        addAlert('REDIS_ERROR', error.message);
        healthMetrics.redis = { error: error.message, timestamp: new Date() };
    }
}

// Messaging performance monitoring
async function checkMessagingPerformance() {
    try {
        const client = await pool.connect();
        
        // Get messaging stats for last hour
        const stats = await client.query(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_messages,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_messages,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time
            FROM messages 
            WHERE created_at > NOW() - INTERVAL '1 hour'
        `);
        
        const result = stats.rows[0];
        const successRate = result.total_messages > 0 ? 
            (result.sent_messages / result.total_messages) * 100 : 100;
        const failureRate = result.total_messages > 0 ? 
            (result.failed_messages / result.total_messages) * 100 : 0;
        
        client.release();
        
        healthMetrics.messaging = {
            totalMessages: parseInt(result.total_messages),
            sentMessages: parseInt(result.sent_messages),
            failedMessages: parseInt(result.failed_messages),
            pendingMessages: parseInt(result.pending_messages),
            successRate: Math.round(successRate * 100) / 100,
            failureRate: Math.round(failureRate * 100) / 100,
            avgProcessingTime: parseFloat(result.avg_processing_time) || 0,
            timestamp: new Date()
        };
        
        // Check thresholds
        if (successRate < 95) {
            addAlert('LOW_SUCCESS_RATE', `Success rate: ${successRate.toFixed(2)}%`);
        }
        if (failureRate > 5) {
            addAlert('HIGH_FAILURE_RATE', `Failure rate: ${failureRate.toFixed(2)}%`);
        }
        
    } catch (error) {
        console.error('Messaging performance check failed:', error);
        addAlert('MESSAGING_ERROR', error.message);
    }
}

// Add alert
function addAlert(type, message) {
    const alert = {
        type,
        message,
        timestamp: new Date(),
        id: Date.now()
    };
    
    healthMetrics.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (healthMetrics.alerts.length > 50) {
        healthMetrics.alerts = healthMetrics.alerts.slice(0, 50);
    }
    
    console.log(`🚨 ALERT [${type}]: ${message}`);
}

// Get disk usage
async function getDiskUsage() {
    try {
        const { exec } = require('child_process');
        return new Promise((resolve) => {
            exec("df -h / | awk 'NR==2{print $5}' | sed 's/%//'", (error, stdout) => {
                resolve(error ? 0 : parseInt(stdout.trim()));
            });
        });
    } catch {
        return 0;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    const overallHealth = healthMetrics.alerts.filter(alert => 
        Date.now() - new Date(alert.timestamp).getTime() < 300000 // Last 5 minutes
    ).length === 0 ? 'healthy' : 'warning';
    
    res.json({
        status: overallHealth,
        timestamp: new Date(),
        metrics: healthMetrics
    });
});

// Detailed metrics endpoint
app.get('/metrics', (req, res) => {
    res.json(healthMetrics);
});

// Start monitoring
async function startMonitoring() {
    console.log('🛡️ Starting Health Monitor...');
    
    // Initial checks
    await checkSystemHealth();
    await checkDatabaseHealth();
    await checkRedisHealth();
    await checkMessagingPerformance();
    
    // Schedule regular checks
    setInterval(checkSystemHealth, 30000);        // Every 30 seconds
    setInterval(checkDatabaseHealth, 60000);      // Every minute
    setInterval(checkRedisHealth, 30000);         // Every 30 seconds
    setInterval(checkMessagingPerformance, 120000); // Every 2 minutes
    
    // Update timestamp
    setInterval(() => {
        healthMetrics.lastUpdate = new Date();
    }, 10000);
    
    app.listen(PORT, () => {
        console.log(`🛡️ Health Monitor running on port ${PORT}`);
        console.log(`📊 Health endpoint: http://localhost:${PORT}/health`);
        console.log(`📈 Metrics endpoint: http://localhost:${PORT}/metrics`);
    });
}

// Start the monitor
startMonitoring().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛡️ Health Monitor shutting down...');
    process.exit(0);
});
