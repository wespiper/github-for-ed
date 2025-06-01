import { CacheService } from '../cache/CacheService';
import { RedisCacheService, InMemoryCacheService } from '../cache/RedisCacheService';

export interface CacheConfig {
  type: 'redis' | 'memory';
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
}

export function createCacheService(config: CacheConfig): CacheService {
  if (config.type === 'redis') {
    return new RedisCacheService(config.redis);
  }
  
  return new InMemoryCacheService();
}

// Default configuration
export const defaultCacheConfig: CacheConfig = {
  type: 'memory', // Temporarily use in-memory for testing
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'scribe',
  },
};