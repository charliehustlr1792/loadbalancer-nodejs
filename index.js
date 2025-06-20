const express = require('express');
const https = require('https');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const proxyRouter = require('./routes/proxy');
const healthRouter = require('./routes/health');
const metricsRouter = require('./routes/metrics');

const app = express();


app.use(cookieParser()); 
app.use(express.json()); 


app.use('/', proxyRouter);        // Main proxy routes (catch-all)
app.use('/health', healthRouter); // Health check endpoint
app.use('/metrics', metricsRouter); // Metrics endpoint

// SSL certificate options for HTTPS
const sslOptions = {
  key: fs.readFileSync('./ssl/key.pem'),   // Private key
  cert: fs.readFileSync('./ssl/cert.pem')  // Certificate
};

// Create HTTPS server with SSL termination
const server = https.createServer(sslOptions, app);

// Start the load balancer on port 443 (standard HTTPS port)
server.listen(443, () => {
  console.log('Load Balancer started on port 443 (HTTPS)');
  console.log('Health checks: https://localhost/health');
  console.log(' Metrics: https://localhost/metrics');
  console.log('SSL Termination enabled');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Gracefully shutting down...');
  server.close(() => {
    process.exit(0);
  });
});