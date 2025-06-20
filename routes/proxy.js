// routes/proxy.js - Core load balancing and proxy logic
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

// Import balancing strategies
const RandomStrategy = require('../strategies/RandomStrategy');
const RoundRobinStrategy = require('../strategies/RoundRobinStrategy');
const WeightedStrategy = require('../strategies/WeightedStrategy');

const router = express.Router();

// Strategy mapping
const strategies = {
  random: new RandomStrategy(),
  roundrobin: new RoundRobinStrategy(),
  weighted: new WeightedStrategy()
};

// Get the selected strategy from config
const currentStrategy = strategies[config.strategy];

// Metrics tracking
let requestCount = 0;
let serverStats = {};

// Initialize server stats
config.servers.forEach(server => {
  serverStats[server.id] = {
    requests: 0,
    errors: 0,
    lastUsed: null
  };
});

/**
 * Get next server based on current strategy and health status
 * Also handles session affinity if enabled
 */
function getNextServer(req) {
  // Get only healthy servers
  const healthyServers = config.servers.filter(server => server.healthy);
  
  if (healthyServers.length === 0) {
    throw new Error('No healthy servers available');
  }

  // Check for session affinity cookie
  if (config.sessionAffinity.enabled && req.cookies[config.sessionAffinity.cookieName]) {
    const affinityServerId = req.cookies[config.sessionAffinity.cookieName];
    const affinityServer = healthyServers.find(server => server.id === affinityServerId);
    
    // If affinity server is healthy, use it
    if (affinityServer) {
      console.log(`🔗 Session affinity: routing to ${affinityServer.id}`);
      return affinityServer;
    }
  }

  // Use strategy to select server
  const selectedServer = currentStrategy.selectServer(healthyServers);
  console.log(`⚖️ Strategy '${config.strategy}' selected: ${selectedServer.id}`);
  
  return selectedServer;
}

/**
 * Main proxy middleware - handles all incoming requests
 */
router.use('*', (req, res, next) => {
  try {
    // Skip health and metrics endpoints
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }

    // Get target server
    const targetServer = getNextServer(req);
    const targetUrl = `http://${targetServer.host}:${targetServer.port}`;
    
    // Update metrics
    requestCount++;
    serverStats[targetServer.id].requests++;
    serverStats[targetServer.id].lastUsed = new Date();

    // Set session affinity cookie if enabled and not already set
    if (config.sessionAffinity.enabled && !req.cookies[config.sessionAffinity.cookieName]) {
      res.cookie(
        config.sessionAffinity.cookieName, 
        targetServer.id, 
        config.sessionAffinity.cookieOptions
      );
      console.log(`🍪 Set affinity cookie for ${targetServer.id}`);
    }

    // Create proxy middleware for this request
    const proxyMiddleware = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      
      // Add custom headers
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('X-Forwarded-By', 'Load-Balancer');
        proxyReq.setHeader('X-Backend-Server', targetServer.id);
        console.log(`📤 Proxying ${req.method} ${req.path} to ${targetServer.id} (${targetUrl})`);
      },

      // Handle proxy response
      onProxyRes: (proxyRes, req, res) => {
        console.log(`📥 Response from ${targetServer.id}: ${proxyRes.statusCode}`);
        
        // Track errors
        if (proxyRes.statusCode >= 400) {
          serverStats[targetServer.id].errors++;
        }
      },

      // Handle proxy errors
      onError: (err, req, res) => {
        console.error(`❌ Proxy error for ${targetServer.id}:`, err.message);
        serverStats[targetServer.id].errors++;
        
        // Mark server as unhealthy on connection errors
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          targetServer.healthy = false;
          console.log(`🚨 Marked ${targetServer.id} as unhealthy due to connection error`);
        }

        // Send error response
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway',
            message: 'Backend server unavailable',
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Execute the proxy
    proxyMiddleware(req, res, next);

  } catch (error) {
    console.error('❌ Load balancer error:', error.message);
    
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Service Unavailable', 
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Export metrics for the metrics router
router.getMetrics = () => ({
  totalRequests: requestCount,
  serverStats: serverStats,
  strategy: config.strategy,
  healthyServers: config.servers.filter(s => s.healthy).length,
  totalServers: config.servers.length
});

module.exports = router;