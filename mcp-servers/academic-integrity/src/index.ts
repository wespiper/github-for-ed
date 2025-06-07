/**
 * Academic Integrity MCP Server Index
 * MCP Protocol Entry Point
 */

import { MCPServer } from './mcp/mcp-server';

async function main() {
  console.log('🚀 Starting Academic Integrity MCP Server...');
  
  const server = new MCPServer();
  
  try {
    await server.start();
    console.log('📊 Academic Integrity MCP Server started successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Academic Integrity MCP Server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down Academic Integrity MCP Server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Academic Integrity MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});