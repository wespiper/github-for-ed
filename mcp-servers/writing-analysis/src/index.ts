import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { PrivacyGuard } from './mcp/privacy-guard';
import { McpToolsController } from './mcp/mcp-tools.controller';
import * as dotenv from 'dotenv';

// Load privacy configuration
dotenv.config({ path: '.env.privacy' });

async function bootstrap() {
  const logger = new Logger('WritingAnalysisMCP');
  
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Apply global validation pipe with privacy-aware settings
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: false, // Explicit types for privacy
    },
  }));

  // Apply global privacy guard
  app.useGlobalGuards(app.get(PrivacyGuard));

  // Initialize MCP server
  const mcpServer = new Server({
    name: 'writing-analysis-mcp',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  // Register MCP tools from NestJS controllers
  const mcpToolsController = app.get(McpToolsController);
  await mcpToolsController.registerTools(mcpServer);

  // Create transport and start server
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  
  logger.log('Writing Analysis MCP Server started successfully');

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    logger.log('Shutting down Writing Analysis MCP Server...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start Writing Analysis MCP Server:', error);
  process.exit(1);
});