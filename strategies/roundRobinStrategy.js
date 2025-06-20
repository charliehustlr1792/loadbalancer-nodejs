// strategies/RoundRobinStrategy.js - Round robin server selection strategy
const Strategy = require('./Strategy');

/**
 * Round Robin Strategy Implementation
 * Cycles through servers sequentially, ensuring fair distribution
 * Each server gets equal number of requests over time
 */
class RoundRobinStrategy extends Strategy {
  constructor() {
    super();
    this.name = 'roundrobin';
    this.currentIndex = -1; // Start at -1 so first increment gives us 0
    this.serverIds = [];    // Track server IDs to handle dynamic server changes
  }

  /**
   * Select next server in round-robin fashion
   * @param {Array} servers - Array of healthy servers
   * @returns {Object} - Selected server object
   */
  selectServer(servers) {
    if (!servers || servers.length === 0) {
      throw new Error('No servers available for round-robin selection');
    }

    // Check if server list has changed (servers added/removed)
    const currentServerIds = servers.map(s => s.id).sort().join(',');
    const storedServerIds = this.serverIds.sort().join(',');
    
    if (currentServerIds !== storedServerIds) {
      console.log('🔄 Server list changed, resetting round-robin index');
      this.currentIndex = -1;
      this.serverIds = servers.map(s => s.id);
    }

    // Increment index and wrap around if necessary
    this.currentIndex = (this.currentIndex + 1) % servers.length;
    const selectedServer = servers[this.currentIndex];

    console.log(`🔁 Round-robin strategy selected server ${selectedServer.id} (index ${this.currentIndex}/${servers.length - 1})`);
    
    return selectedServer;
  }

  /**
   * Reset the round-robin counter (useful for testing or manual reset)
   */
  reset() {
    this.currentIndex = -1;
    this.serverIds = [];
    console.log('🔄 Round-robin strategy reset');
  }

  /**
   * Get current position in round-robin cycle
   */
  getCurrentPosition() {
    return {
      index: this.currentIndex,
      totalServers: this.serverIds.length
    };
  }

  /**
   * Get strategy description
   */
  getDescription() {
    return 'Cycles through servers sequentially, ensuring fair distribution of requests.';
  }
}

module.exports = RoundRobinStrategy;