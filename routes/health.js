// routes/health.js - Health check functionality
const express = require('express');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

/**
 * Check health of a single server
 */
async function checkServerHealth(server) {
  try {
    const healthUrl = `http://${server.host}:${server.port}${config.healthCheck.endpoint}`;
    
    // Make health check request with timeout
    const response = await axios.get(healthUrl, {
      timeout: config.healthCheck.timeout,
      validateStatus: (status) => status === 200 // Only 200 is considered healthy
    });

    return {
      id: server.id,
      status: 'healthy',
      responseTime: response.headers['x-response-time'] || 'N/A',
      lastCheck: new Date().toISOString()
    };

  } catch (error) {
    return {
      id: server.id,
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Perform health checks on all servers
 */
async function performHealthChecks() {
  console.log('🏥 Starting health checks...');
  
  const healthPromises = config.servers.map(server => checkServerHealth(server));
  const healthResults = await Promise.all(healthPromises);
  
  // Update server health status in config
  healthResults.forEach(result => {
    const server = config.servers.find(s => s.id === result.id);
    if (server) {
      const wasHealthy = server.healthy;
      server.healthy = result.status === 'healthy';
      
      // Log health status changes
      if (wasHealthy !== server.healthy) {
        console.log(`🔄 ${server.id} health changed: ${wasHealthy ? 'healthy' : 'unhealthy'} → ${server.healthy ? 'healthy' : 'unhealthy'}`);
      }
    }
  });
  
  const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
  console.log(`✅ Health check complete: ${healthyCount}/${config.servers.length} servers healthy`);
  
  return healthResults;
}

/**
 * GET /health - Return health status of all servers
 */
router.get('/', async (req, res) => {
  try {
    const healthResults = await performHealthChecks();
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalServers: config.servers.length,
      healthyServers: healthResults.filter(r => r.status === 'healthy').length,
      unhealthyServers: healthResults.filter(r => r.status === 'unhealthy').length,
      servers: healthResults
    };

    res.json(summary);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Start periodic health checks
 */
function startHealthChecks() {
  console.log(`🏥 Starting periodic health checks every ${config.healthCheck.interval}ms`);
  
  // Perform initial health check
  performHealthChecks().catch(error => {
    console.error('❌ Initial health check failed:', error.message);
  });
  
  // Schedule periodic health checks
  setInterval(() => {
    performHealthChecks().catch(error => {
      console.error('❌ Periodic health check failed:', error.message);
    });
  }, config.healthCheck.interval);
}

// Start health checks when module is loaded
startHealthChecks();

module.exports = router;