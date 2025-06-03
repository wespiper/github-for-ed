#!/usr/bin/env node

/**
 * Educator Alerts MCP Server Entry Point
 * Supports both MCP protocol and HTTP REST API modes
 */

import { MCPServer } from '@anthropic/mcp-sdk/server/index.js';
import { StdioServerTransport } from '@anthropic/mcp-sdk/server/stdio.js';
import { MCPToolsService } from './mcp/mcp-tools.service';
import { Logger } from './utils/logger';

const logger = new Logger('EducatorAlertsMCPServer');

/**
 * Initialize and start MCP server
 */
async function startMCPServer() {
  try {
    logger.info('Starting Educator Alerts MCP Server...');

    const server = new MCPServer(
      {
        name: 'educator-alerts-mcp-server',
        version: '1.0.0',
        description: 'Privacy-enhanced educator alerts and intervention management for educational AI systems'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    // Initialize MCP tools service
    const mcpToolsService = new MCPToolsService();
    await mcpToolsService.initialize();

    // Register MCP tools
    server.setRequestHandler('tools/list', async () => {
      return {
        tools: mcpToolsService.getToolSchemas()
      };
    });

    server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      return await mcpToolsService.executeTool(name, args);
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('✅ Educator Alerts MCP Server started successfully');
    logger.info('🔧 Available tools: generate_intervention_recommendations, send_educator_alerts, schedule_intervention_actions, track_intervention_effectiveness');

  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

/**
 * Start HTTP server (NestJS)
 */
async function startHttpServer() {
  try {
    logger.info('Starting HTTP server...');
    
    // Dynamic import to avoid loading NestJS when not needed
    const { bootstrap } = await import('./main');
    await bootstrap();
    
    logger.info('✅ HTTP server started successfully');
  } catch (error) {
    logger.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
}

/**
 * Main entry point - determine mode based on arguments
 */
async function main() {
  const mode = process.argv[2] || 'mcp';

  switch (mode) {
    case 'mcp':
      await startMCPServer();
      break;
    case 'http':
      await startHttpServer();
      break;
    case 'dual':
      // Start both servers
      await Promise.all([
        startMCPServer(),
        startHttpServer()
      ]);
      break;
    default:
      console.error('Invalid mode. Use: mcp, http, or dual');
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});