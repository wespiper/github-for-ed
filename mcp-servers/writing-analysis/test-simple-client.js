#!/usr/bin/env node

const { spawn } = require('child_process');

async function testServer() {
  console.log('Testing Writing Analysis MCP Server with simple requests...\n');

  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  // Helper to send JSON-RPC request
  function sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };
    
    const message = JSON.stringify(request);
    serverProcess.stdin.write(message + '\n');
  }

  // Helper to read response
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        // Not JSON, just log it
        if (line.trim()) {
          console.log('Server output:', line);
        }
      }
    });
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 1: List tools
  console.log('\n📋 Sending tools/list request...');
  sendRequest('tools/list');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Call a tool
  console.log('\n🔧 Sending tools/call request for content classification...');
  sendRequest('tools/call', {
    name: 'classify_content_sensitivity',
    arguments: {
      content: 'This is a test essay about learning.',
      context: {
        contentType: 'essay',
      },
    },
  });

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Clean up
  serverProcess.kill();
  console.log('\n✅ Test completed');
}

testServer().catch(console.error);