// strategies/RandomStrategy.js - Random server selection strategy
const Strategy = require('./Strategy');

/**
 * Random Strategy Implementation
 * Selects a random server from the available healthy servers
 * Simple but unpredictable distribution
 */
class RandomStrategy extends Strategy {
  constructor() {
    super();
    this.name = 'random';
  }

  /**
   * Select a random server from healthy servers
   * @param {Array} servers - Array of healthy servers
   * @returns {Object} - Selected server object
   */
  selectServer(servers) {
    if (!servers || servers.length === 0) {
      throw new Error('No servers available for random selection');
    }

    // Generate random index
    const randomIndex = Math.floor(Math.random() * servers.length);
    const selectedServer = servers[randomIndex];

    console.log(`🎲 Random strategy selected server ${selectedServer.id} (index ${randomIndex}/${servers.length - 1})`);
    
    return selectedServer;
  }

  /**
   * Get strategy description
   */
  getDescription() {
    return 'Randomly selects servers for load distribution. Simple but unpredictable.';
  }
}

module.exports = RandomStrategy;