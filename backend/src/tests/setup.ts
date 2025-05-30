// Test setup file for Jest
import { PrismaClient } from '@prisma/client';

// Mock the prisma client
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: new PrismaClient()
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.CLAUDE_API_KEY = 'test-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});