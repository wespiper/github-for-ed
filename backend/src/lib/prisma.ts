/**
 * Prisma Client Singleton
 * 
 * Ensures a single instance of PrismaClient is used throughout the application
 * with proper connection management and logging configuration
 */

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'minimal',
  });
};

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Middleware to log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    if (after - before > 100) {
      console.warn(`⚠️  Slow query (${after - before}ms): ${params.model}.${params.action}`);
    }
    
    return result;
  });
}

export default prisma;