/**
 * Jest test setup for Educator Alerts MCP Server
 */

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.MCP_PORT = '3003';
  process.env.HTTP_PORT = '3004';
});

// Global test cleanup
afterAll(() => {
  // Cleanup any global resources
});

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};