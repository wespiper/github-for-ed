/**
 * Academic Integrity MCP Server Main Entry Point
 * Supports MCP protocol, HTTP REST API, and dual mode
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MCPServer } from './mcp/mcp-server';

async function bootstrap() {
  const mode = process.argv[2] || 'mcp'; // Default to MCP mode
  
  console.log(`🚀 Starting Academic Integrity Server in ${mode.toUpperCase()} mode`);

  if (mode === 'mcp') {
    // MCP Protocol Mode
    const mcpServer = new MCPServer();
    await mcpServer.start();
    console.log('📊 Academic Integrity MCP Server started successfully');
    
  } else if (mode === 'http') {
    // HTTP REST API Mode
    await startHTTPServer();
    
  } else if (mode === 'dual') {
    // Dual Mode - Both MCP and HTTP
    const mcpServer = new MCPServer();
    await mcpServer.start();
    await startHTTPServer();
    console.log('🔗 Academic Integrity Server running in dual mode (MCP + HTTP)');
    
  } else {
    console.error('❌ Invalid mode. Use: mcp, http, or dual');
    process.exit(1);
  }
}

async function startHTTPServer() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS for development
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Academic Integrity API')
    .setDescription('AI detection and educational validation for academic integrity monitoring')
    .setVersion('1.0.0')
    .addTag('academic-integrity')
    .addTag('ai-detection')
    .addTag('educational-validation')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  console.log(`🌐 Academic Integrity HTTP API listening on port ${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Academic Integrity Server:', error);
  process.exit(1);
});