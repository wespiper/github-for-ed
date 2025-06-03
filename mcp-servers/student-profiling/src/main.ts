import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AppModule } from './app.module';
import { MCPToolsController } from './mcp/mcp-tools.controller';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Determine which mode to run based on environment or arguments
  const mode = process.argv[2] || process.env.SERVER_MODE || 'dual';
  
  if (mode === 'mcp' || mode === 'dual') {
    // Start MCP Server
    logger.log('Starting MCP Server...');
    await startMCPServer();
  }
  
  if (mode === 'http' || mode === 'dual') {
    // Start HTTP API Server
    logger.log('Starting HTTP API Server...');
    await startHTTPServer();
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
        name: 'student-profiling-mcp',
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
      logger.log(`MCP tool called: ${name}`);
      
      try {
        const result = await mcpController.executeTool(name, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result),
          }],
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
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
    
    logger.log('MCP Server started successfully on stdio');
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

async function startHTTPServer() {
  const logger = new Logger('HTTPServer');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    // Enable CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5001',
      credentials: true,
    });

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Student Profiling API')
      .setDescription('Privacy-enhanced student profiling service with dual MCP/HTTP interfaces')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('student-profiles', 'Student profile management endpoints')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3002;
    await app.listen(port);
    
    logger.log(`HTTP API Server running on http://localhost:${port}`);
    logger.log(`API Documentation available at http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  Logger.log('SIGTERM signal received: closing servers');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.log('SIGINT signal received: closing servers');
  process.exit(0);
});

bootstrap();