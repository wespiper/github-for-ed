/**
 * Jest test setup file
 * Global test configuration and utilities
 */

import mongoose from 'mongoose';

// Set test timeout
jest.setTimeout(30000);

// Global test database setup
beforeAll(async () => {
  // Use in-memory database for testing
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/github-for-writers-test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  // Clean up database connection
  await mongoose.connection.close();
});

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});