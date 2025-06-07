#!/usr/bin/env node

// Test with corrected MCP SDK usage
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

async function createFixedServer() {
  console.log('[DEBUG] Creating MCP server with correct schema usage...');
  
  const server = new Server({
    name: 'test-writing-analysis',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  console.log('[DEBUG] Setting up list tools handler with schema...');
  
  server.setRequestHandler(ListToolsRequestSchema, async () => {
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

  console.log('[DEBUG] Setting up call tool handler with schema...');
  
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
  
  console.log('[DEBUG] Fixed MCP server started successfully');
}

createFixedServer().catch((error) => {
  console.error('[ERROR] Failed to start fixed server:', error);
  process.exit(1);
});