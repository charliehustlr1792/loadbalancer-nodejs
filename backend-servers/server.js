// backend-servers/server.js - Sample backend server for testing
const express = require('express');

// Get port from command line argument or default to 3000
const port = process.argv[2] || 3000;
const serverId = `server-${port}`;

const app = express();

// Middleware to add response time header
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
  });
  next();
});

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`[${serverId}] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (required by load balancer)
app.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    server: serverId,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main application endpoint
app.get('/', (req, res) => {
  res.json({
    message: `Hello from ${serverId}!`,
    server: serverId,
    port: port,
    timestamp: new Date().toISOString(),
    headers: {
      'X-Forwarded-By': req.headers['x-forwarded-by'],
      'X-Backend-Server': req.headers['x-backend-server']
    }
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test successful',
    server: serverId,
    port: port,
    requestId: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString()
  });
});

// User data endpoint (to test session affinity)
app.get('/api/user', (req, res) => {
  res.json({
    message: 'User data retrieved',
    server: serverId,
    userId: 123,
    sessionData: {
      loginTime: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    }
  });
});

// Simulate some load/processing time
app.get('/api/heavy', (req, res) => {
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      message: 'Heavy processing completed',
      server: serverId,
      processingTime: '1000ms',
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

// Error endpoint for testing error handling
app.get('/api/error', (req, res) => {
  res.status(500).json({
    error: 'Simulated server error',
    server: serverId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    server: serverId,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[${serverId}] Error:`, err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    server: serverId,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Backend server ${serverId} running on port ${port}`);
  console.log(`   Health check: http://localhost:${port}/healthcheck`);
  console.log(`   Test endpoint: http://localhost:${port}/api/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`🛑 ${serverId} shutting down gracefully...`);
  process.exit(0);
});