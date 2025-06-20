// strategies/WeightedStrategy.js - Weighted server selection strategy
const Strategy = require('./Strategy');

/**
 * Weighted Strategy Implementation
 * Distributes requests based on server weights (capacity)
 * Higher weight servers receive more requests
 */
class WeightedStrategy extends Strategy {
  constructor() {
    super();
    this.name = 'weighted';
    this.weightedList = [];     // Pre-computed weighted list for efficient selection
    this.lastServerList = null; // Cache to detect server changes
  }

  /**
   * Build weighted list based on server weights
   * Creates a list where each server appears multiple times based on its weight
   * @param {Array} servers - Array of healthy servers with weights
   */
  buildWeightedList(servers) {
    this.weightedList = [];
    
    servers.forEach(server => {
      // Add server to list multiple times based on its weight
      const weight = server.weight || 1; // Default weight is 1
      for (let i = 0; i < weight; i++) {
        this.weightedList.push(server);
      }
    });

    console.log(`⚖️ Built weighted list with ${this.weightedList.length} entries for ${servers.length} servers`);
    
    // Log weight distribution
    const weightDistribution = servers.map(server => 
      `${server.id}:${server.weight || 1}`
    ).join(', ');
    console.log(`📊 Weight distribution: ${weightDistribution}`);
  }

  /**
   * Select server based on weighted distribution
   * @param {Array} servers - Array of healthy servers
   * @returns {Object} - Selected server object
   */
  selectServer(servers) {
    if (!servers || servers.length === 0) {
      throw new Error('No servers available for weighted selection');
    }

    // Check if we need to rebuild the weighted list
    const serverListKey = servers.map(s => `${s.id}:${s.weight || 1}`).sort().join('|');
    if (this.lastServerList !== serverListKey) {
      this.buildWeightedList(servers);
      this.lastServerList = serverListKey;
    }

    // Select random index from weighted list
    const randomIndex = Math.floor(Math.random() * this.weightedList.length);
    const selectedServer = this.weightedList[randomIndex];

    // Calculate selection probability for logging
    const serverWeight = selectedServer.weight || 1;
    const totalWeight = this.weightedList.length;
    const probability = Math.round((serverWeight / totalWeight) * 100);

    console.log(`⚖️ Weighted strategy selected server ${selectedServer.id} (weight: ${serverWeight}, probability: ${probability}%)`);
    
    return selectedServer;
  }

  /**
   * Get weight statistics for all servers
   * @param {Array} servers - Array of servers
   * @returns {Object} - Weight statistics
   */
  getWeightStats(servers) {
    const totalWeight = servers.reduce((sum, server) => sum + (server.weight || 1), 0);
    
    return {
      totalWeight,
      servers: servers.map(server => {
        const weight = server.weight || 1;
        return {
          id: server.id,
          weight: weight,
          percentage: Math.round((weight / totalWeight) * 100)
        };
      })
    };
  }

  /**
   * Get strategy description
   */
  getDescription() {
    return 'Distributes requests based on server weights. Higher weight servers receive more traffic.';
  }
}

module.exports = WeightedStrategy;