// routes/metrics.js - Performance metrics and monitoring
const express = require('express');
const config = require('../config');

const router = express.Router();

// Metrics collection
const metrics = {
  startTime: new Date(),
  totalRequests: 0,
  serverStats: {},
  errorCount: 0,
  requestsPerMinute: []
};

// Initialize server stats
config.servers.forEach(server => {
  metrics.serverStats[server.id] = {
    requests: 0,
    errors: 0,
    lastUsed: null,
    avgResponseTime: 0
  };
});

/**
 * GET /metrics - Return load balancer metrics
 */
router.get('/', (req, res) => {
  try {
    // Get proxy router metrics if available
    const proxyRouter = require('./proxy');
    const proxyMetrics = proxyRouter.getMetrics ? proxyRouter.getMetrics() : {};
    
    // Calculate uptime
    const uptimeMs = Date.now() - metrics.startTime.getTime();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    
    // Build comprehensive metrics response
    const metricsResponse = {
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptimeMs,
        seconds: uptimeSeconds,
        minutes: uptimeMinutes,
        hours: uptimeHours,
        formatted: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
      },
      loadBalancer: {
        strategy: config.strategy,
        sessionAffinity: config.sessionAffinity.enabled,
        totalServers: config.servers.length,
        healthyServers: config.servers.filter(s => s.healthy).length,
        unhealthyServers: config.servers.filter(s => !s.healthy).length
      },
      traffic: {
        totalRequests: proxyMetrics.totalRequests || 0,
        requestsPerSecond: proxyMetrics.totalRequests ? 
          Math.round((proxyMetrics.totalRequests / uptimeSeconds) * 100) / 100 : 0,
        errorRate: metrics.errorCount > 0 ? 
          Math.round((metrics.errorCount / (proxyMetrics.totalRequests || 1)) * 100) : 0
      },
      servers: config.servers.map(server => ({
        id: server.id,
        host: server.host,
        port: server.port,
        weight: server.weight,
        healthy: server.healthy,
        stats: {
          requests: proxyMetrics.serverStats?.[server.id]?.requests || 0,
          errors: proxyMetrics.serverStats?.[server.id]?.errors || 0,
          lastUsed: proxyMetrics.serverStats?.[server.id]?.lastUsed,
          loadPercentage: proxyMetrics.totalRequests > 0 ? 
            Math.round(((proxyMetrics.serverStats?.[server.id]?.requests || 0) / proxyMetrics.totalRequests) * 100) : 0
        }
      }))
    };

    res.json(metricsResponse);
    
  } catch (error) {
    console.error('❌ Failed to generate metrics:', error.message);
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /metrics/simple - Return simplified metrics for monitoring tools
 */
router.get('/simple', (req, res) => {
  try {
    const proxyRouter = require('./proxy');
    const proxyMetrics = proxyRouter.getMetrics ? proxyRouter.getMetrics() : {};
    
    // Simple key-value metrics for monitoring tools like Prometheus
    const simpleMetrics = [
      `# HELP lb_total_requests Total number of requests processed`,
      `# TYPE lb_total_requests counter`,
      `lb_total_requests ${proxyMetrics.totalRequests || 0}`,
      ``,
      `# HELP lb_healthy_servers Number of healthy backend servers`,
      `# TYPE lb_healthy_servers gauge`, 
      `lb_healthy_servers ${config.servers.filter(s => s.healthy).length}`,
      ``,
      `# HELP lb_total_servers Total number of backend servers`,
      `# TYPE lb_total_servers gauge`,
      `lb_total_servers ${config.servers.length}`,
      ``
    ];

    // Add per-server metrics
    config.servers.forEach(server => {
      const serverRequests = proxyMetrics.serverStats?.[server.id]?.requests || 0;
      const serverErrors = proxyMetrics.serverStats?.[server.id]?.errors || 0;
      
      simpleMetrics.push(
        `# HELP lb_server_requests_total Total requests per server`,
        `# TYPE lb_server_requests_total counter`,
        `lb_server_requests_total{server="${server.id}",host="${server.host}",port="${server.port}"} ${serverRequests}`,
        ``,
        `# HELP lb_server_errors_total Total errors per server`, 
        `# TYPE lb_server_errors_total counter`,
        `lb_server_errors_total{server="${server.id}",host="${server.host}",port="${server.port}"} ${serverErrors}`,
        ``
      );
    });

    res.set('Content-Type', 'text/plain');
    res.send(simpleMetrics.join('\n'));
    
  } catch (error) {
    console.error('❌ Failed to generate simple metrics:', error.message);
    res.status(500).send('Failed to generate metrics');
  }
});

module.exports = router;