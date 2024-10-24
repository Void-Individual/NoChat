const { createClient } = require('redis');
// I no longer need to use promisify module

class RedisClient {
  constructor() {
    // Initialize clients for general usage, publishing, and subscribing
    this.client = createClient({ url: 'redis://localhost:6379' });
    this.publisher = createClient({ url: 'redis://localhost:6379' });
    this.subscriber = createClient({ url: 'redis://localhost:6379' });
    this.connected = false;

    // Connect to Redis
    this.connect();
  }

  async connect() {
    try {
      // Connect all clients
      await Promise.all([
          this.client.connect(),
          this.publisher.connect(),
          this.subscriber.connect(),
      ]);
      console.log('All Redis clients connected');
      this.connected = true;
    } catch (err) {
      console.error('Error connecting to Redis:', err);
    }
  }

  isAlive() {
    // Check if the client is connected
    return this.connected;
  }

  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (err) {
      console.error('Error getting value from Redis:', err.message);
    }
    return null;
  }

  async set(key, value, time) {
    try {
      if (time) {
        await this.setAsync(key, value, 'EX', time); // Set with expiration time
      } else {
        await this.setAsync(key, value); // Set without expiration
      }
    } catch (err) {
      console.log('Error setting key:', err.message);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log('Error deleting key:', err.message);
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
