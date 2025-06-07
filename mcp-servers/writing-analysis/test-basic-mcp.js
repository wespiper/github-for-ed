#!/usr/bin/env node

// Very basic MCP server test
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

async function createBasicServer() {
  console.log('[DEBUG] Creating basic MCP server...');
  
  const server = new Server({
    name: 'test-writing-analysis',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  console.log('[DEBUG] Setting up list tools handler...');
  
  server.setRequestHandler('tools/list', async () => {
    console.log('[DEBUG] Received tools/list request');
    return {
      tools: [
        {
          name: 'test_tool',
          description: 'A simple test tool',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Test message'
              }
            },
            required: ['message']
          }
        }
      ]
    };
  });

  console.log('[DEBUG] Setting up call tool handler...');
  
  server.setRequestHandler('tools/call', async (request) => {
    console.log('[DEBUG] Received tools/call request:', JSON.stringify(request));
    
    if (request.params.name === 'test_tool') {
      return {
        content: [{
          type: 'text',
          text: `Echo: ${request.params.arguments.message}`
        }]
      };
    }
    
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  console.log('[DEBUG] Creating transport...');
  const transport = new StdioServerTransport();
  
  console.log('[DEBUG] Connecting server...');
  await server.connect(transport);
  
  console.log('[DEBUG] Basic MCP server started successfully');
}

createBasicServer().catch((error) => {
  console.error('[ERROR] Failed to start basic server:', error);
  process.exit(1);
});