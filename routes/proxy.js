const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

const servers = [
  {
    host: 'localhost',
    port: 3000,
    weight: 1,
  },
  // Add more servers here
];

// Next server index
let currIndex = 0;

// Get next server using round robin
function getNextServer() {
  const server = servers[currIndex];
  currIndex = (currIndex + 1) % servers.length;
  return server;
}

// Create a single proxy middleware with dynamic routing
const proxyMiddleware = createProxyMiddleware({
  target: 'http://localhost:3000', // Default target, will be overridden
  changeOrigin: true,
  router: (req) => {
    // Dynamic routing function
    const target = getNextServer();
    const targetUrl = `http://${target.host}:${target.port}`;
    console.log(`Routing ${req.method} ${req.url} to: ${targetUrl}`);
    return targetUrl;
  },
  onProxyReq: (proxyReq, req) => {
    // Add custom header to request
    proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad Gateway - Server unavailable' });
    }
  },
  logLevel: 'info'
});

// Use the proxy middleware for all routes
router.use('/', proxyMiddleware);


let healthyServers=[]

module.exports = router;