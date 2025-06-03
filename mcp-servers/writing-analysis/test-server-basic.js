#!/usr/bin/env node

// Basic test to verify MCP server starts correctly
const { spawn } = require('child_process');

console.log('Starting Writing Analysis MCP Server...\n');

const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Give server time to start
setTimeout(() => {
  console.log('\nServer should be running. Press Ctrl+C to stop.');
}, 2000);