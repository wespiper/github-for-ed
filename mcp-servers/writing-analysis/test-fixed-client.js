#!/usr/bin/env node

// Test fixed MCP client connection
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testFixedConnection() {
  console.log('Testing fixed MCP connection...');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['test-sdk-fix.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    console.log('Connecting to fixed server...');
    await client.connect(transport);
    console.log('✅ Connected successfully');

    console.log('Listing tools...');
    const tools = await client.request({
      method: 'tools/list',
      params: {},
    });
    console.log('✅ Tools listed:', JSON.stringify(tools, null, 2));

    console.log('Calling test tool...');
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'test_tool',
        arguments: {
          message: 'Hello Fixed MCP!'
        }
      },
    });
    console.log('✅ Tool called successfully:', JSON.stringify(result, null, 2));

    await client.close();
    console.log('✅ Fixed test completed successfully');

  } catch (error) {
    console.error('❌ Fixed test failed:', error);
    await client.close();
    process.exit(1);
  }
}

testFixedConnection();