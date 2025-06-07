import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AppModule } from './app.module';
import { MCPToolsController } from './mcp/mcp-tools.controller';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Determine which mode to run based on environment or arguments
  const mode = process.argv[2] || process.env.SERVER_MODE || 'dual';
  
  if (mode === 'mcp' || mode === 'dual') {
    // Start MCP Server
    logger.log('Starting Cognitive Monitoring MCP Server...');
    await startMCPServer();
  }
  
  if (mode === 'websocket' || mode === 'dual') {
    // Start WebSocket Server
    logger.log('Starting WebSocket Server...');
    await startWebSocketServer();
  }
}

async function startMCPServer() {
  const logger = new Logger('MCPServer');
  
  try {
    // Create NestJS app context for dependency injection
    const app = await NestFactory.createApplicationContext(AppModule);
    const mcpController = app.get(MCPToolsController);
    
    // Create MCP server
    const server = new Server(
      {
        name: 'cognitive-monitoring-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register all tools from controller
    const tools = await mcpController.getTools();
    
    // Handle list tools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Handle tool execution requests
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.log(`Cognitive monitoring MCP tool called: ${name}`);
      
      try {
        const result = await mcpController.executeTool(name, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result),
          }],
        };
      } catch (error) {
        logger.error(`Error executing cognitive monitoring tool ${name}:`, error);
        return {
          content: [{
            type: 'text', 
            text: JSON.stringify({ error: error.message }),
          }],
          isError: true,
        };
      }
    });

    // Use stdio transport for Claude Code
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.log('Cognitive Monitoring MCP Server started successfully on stdio');
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

async function startWebSocketServer() {
  const logger = new Logger('WebSocketServer');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Set up WebSocket adapter
    app.useWebSocketAdapter(new WsAdapter(app));
    
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    // Enable CORS for WebSocket connections
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5001',
      credentials: true,
    });

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Cognitive Monitoring API')
      .setDescription('Privacy-enhanced cognitive monitoring service with real-time WebSocket analytics')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('cognitive-monitoring', 'Real-time cognitive monitoring endpoints')
      .addTag('behavioral-analytics', 'Privacy-safe behavioral pattern analysis')
      .addTag('intervention-engine', 'Intelligent intervention management')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3003;
    await app.listen(port);
    
    logger.log(`Cognitive Monitoring WebSocket Server running on ws://localhost:${port}`);
    logger.log(`API Documentation available at http://localhost:${port}/api/docs`);
    logger.log('Real-time cognitive monitoring with privacy-enhanced analytics ready');
  } catch (error) {
    logger.error('Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  Logger.log('SIGTERM signal received: closing cognitive monitoring servers');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.log('SIGINT signal received: closing cognitive monitoring servers');
  process.exit(0);
});

bootstrap();