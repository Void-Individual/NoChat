import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.connected = false; // Initialize to false

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.connected = true;
    });

    this.client.on('error', (err) => {
      console.log('Redis connection error:', err.message);
      this.connected = false;
    });

    // Promisify Redis methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
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
