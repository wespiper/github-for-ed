#!/usr/bin/env node

// Direct test without client - just start the server
console.log('Starting Writing Analysis MCP Server directly...\n');

// Set up environment
process.env.NODE_ENV = 'test';

// Start the server
require('./dist/index.js');