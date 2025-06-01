import { createClient, RedisClientType } from 'redis';
import { CacheService, CacheOptions } from './CacheService';

/**
 * Redis implementation of CacheService
 */
export class RedisCacheService implements CacheService {
  private client: RedisClientType;
  private connected: boolean = false;
  private defaultTTL: number = 3600; // 1 hour default

  constructor(
    private readonly config: {
      host?: string;
      port?: number;
      password?: string;
      db?: number;
      keyPrefix?: string;
    } = {}
  ) {
    this.client = createClient({
      url: this.buildRedisUrl(),
      database: config.db || 0,
    });

    this.client.on('error', (error) => {
      console.error('Redis Client Error:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.connected = false;
    });
  }

  private buildRedisUrl(): string {
    const host = this.config.host || 'localhost';
    const port = this.config.port || 6379;
    const password = this.config.password;
    
    if (password) {
      return `redis://:${password}@${host}:${port}`;
    }
    return `redis://${host}:${port}`;
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  private buildKey(key: string): string {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureConnected();
    const value = await this.client.get(this.buildKey(key));
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      // If not JSON, return as string
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    await this.ensureConnected();
    const ttl = options?.ttl || this.defaultTTL;
    const fullKey = this.buildKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl > 0) {
      await this.client.setEx(fullKey, ttl, serialized);
    } else {
      await this.client.set(fullKey, serialized);
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureConnected();
    const result = await this.client.del(this.buildKey(key));
    return result > 0;
  }

  async deletePattern(pattern: string): Promise<number> {
    await this.ensureConnected();
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    
    const result = await this.client.del(keys);
    return result;
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureConnected();
    const result = await this.client.exists(this.buildKey(key));
    return result > 0;
  }

  async ttl(key: string): Promise<number> {
    await this.ensureConnected();
    return await this.client.ttl(this.buildKey(key));
  }

  async invalidateNamespace(namespace: string): Promise<number> {
    return await this.deletePattern(`${namespace}:*`);
  }

  async keys(pattern: string): Promise<string[]> {
    await this.ensureConnected();
    const fullPattern = this.buildKey(pattern);
    return await this.client.keys(fullPattern);
  }

  async increment(key: string, delta: number = 1): Promise<number> {
    await this.ensureConnected();
    return await this.client.incrBy(this.buildKey(key), delta);
  }

  async decrement(key: string, delta: number = 1): Promise<number> {
    await this.ensureConnected();
    return await this.client.decrBy(this.buildKey(key), delta);
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }
}

/**
 * In-memory cache service for testing and development
 */
export class InMemoryCacheService implements CacheService {
  private cache: Map<string, { value: any; expires?: number }> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }

    const ttl = options?.ttl;
    const item: { value: any; expires?: number } = { value };
    
    if (ttl && ttl > 0) {
      item.expires = Date.now() + (ttl * 1000);
      
      // Set auto-deletion timer
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);
      
      this.timers.set(key, timer);
    }
    
    this.cache.set(key, item);
  }

  async delete(key: string): Promise<boolean> {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    
    keysToDelete.forEach(key => {
      this.delete(key);
    });
    
    return keysToDelete.length;
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item || !item.expires) return -1;
    
    const remaining = Math.floor((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
  }

  async invalidateNamespace(namespace: string): Promise<number> {
    return await this.deletePattern(`${namespace}:*`);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async increment(key: string, delta: number = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + delta;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, delta: number = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current - delta;
    await this.set(key, newValue);
    return newValue;
  }

  // Test helper to clear all cache
  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }
}