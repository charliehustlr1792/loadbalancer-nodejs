// strategies/Strategy.js - Base strategy interface/abstract class
/**
 * Base Strategy Class
 * Defines the interface that all load balancing strategies must implement
 * This follows the Strategy Pattern for swappable algorithms
 */
class Strategy {
  constructor() {
    this.name = 'base';
  }

  /**
   * Select a server from the available servers
   * This method must be implemented by all strategy subclasses
   * @param {Array} servers - Array of available/healthy servers
   * @returns {Object} - Selected server object
   */
  selectServer(servers) {
    throw new Error('selectServer method must be implemented by strategy subclasses');
  }

  /**
   * Get the name of the strategy
   * @returns {string} - Strategy name
   */
  getName() {
    return this.name;
  }

  /**
   * Get description of the strategy
   * @returns {string} - Strategy description
   */
  getDescription() {
    return 'Base strategy interface - should be overridden by implementations';
  }

  /**
   * Validate that servers array is valid
   * @param {Array} servers - Array of servers to validate
   * @throws {Error} - If servers array is invalid
   */
  validateServers(servers) {
    if (!Array.isArray(servers)) {
      throw new Error('Servers must be an array');
    }
    
    if (servers.length === 0) {
      throw new Error('No servers available');
    }

    // Validate each server object has required properties
    servers.forEach((server, index) => {
      if (!server.id) {
        throw new Error(`Server at index ${index} missing required 'id' property`);
      }
      if (!server.host) {
        throw new Error(`Server ${server.id} missing required 'host' property`);
      }
      if (!server.port) {
        throw new Error(`Server ${server.id} missing required 'port' property`);
      }
    });
  }
}

module.exports = Strategy;