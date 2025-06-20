module.exports = {
  // Backend servers configuration
  servers: [
    {
      id: 'server1',
      host: 'localhost',
      port: 3000,
      weight: 2,        // Higher weight = more requests
      healthy: true     // Health status (updated by health checks)
    },
    {
      id: 'server2', 
      host: 'localhost',
      port: 3001,
      weight: 1,        // Lower weight = fewer requests
      healthy: true
    },
    {
      id: 'server3',
      host: 'localhost', 
      port: 3002,
      weight: 3,        // Highest weight = most requests
      healthy: true
    }
  ],

  // Load balancing strategy
  // Options: 'random', 'roundrobin', 'weighted'
  strategy: 'weighted',

  // Health check configuration
  healthCheck: {
    interval: 10000,    // Check every 10 seconds
    timeout: 5000,      // 5 second timeout
    endpoint: '/healthcheck' // Health check endpoint on backends
  },

  // Session affinity settings
  sessionAffinity: {
    enabled: true,
    cookieName: 'lb-affinity',
    cookieOptions: {
      httpOnly: true,
      secure: true,     // HTTPS only
      maxAge: 3600000   // 1 hour
    }
  },

  // SSL certificate paths
  ssl: {
    keyPath: './ssl/key.pem',
    certPath: './ssl/cert.pem'
  }
};