#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Scribe Tree Docs MCP Server...');

// Set up environment
process.env.PROJECT_ROOT = '/Users/wnp/Desktop/scribe-tree';

// Start the server
const serverPath = path.join(__dirname, 'dist', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

let output = '';
let errorOutput = '';

// Capture output
server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

// Test timeout
setTimeout(() => {
  console.log('=== Server Test Results ===');
  console.log('STDERR Output (Server Logs):');
  console.log(errorOutput);
  
  if (errorOutput.includes('initialized')) {
    console.log('✅ SUCCESS: Server initialized successfully');
  } else {
    console.log('❌ ISSUE: Server may not have initialized properly');
  }
  
  if (errorOutput.includes('indexed')) {
    console.log('✅ SUCCESS: Document indexing started');
  } else {
    console.log('⚠️  WARNING: Document indexing may not have started');
  }
  
  server.kill('SIGTERM');
  process.exit(0);
}, 5000);

server.on('error', (error) => {
  console.error('❌ ERROR: Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ ERROR: Server exited with code ${code}`);
    process.exit(1);
  }
});