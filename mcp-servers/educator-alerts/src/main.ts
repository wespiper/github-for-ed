import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MCP_PORT, HTTP_PORT } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for development
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }));

  // Start HTTP server
  await app.listen(HTTP_PORT);
  console.log(`🚀 Educator Alerts MCP Server running on port ${HTTP_PORT}`);
  console.log(`📡 MCP Protocol available on port ${MCP_PORT}`);
  console.log(`🔗 HTTP API available at http://localhost:${HTTP_PORT}/api`);
}

export { bootstrap };

// Run directly if this is the main module
if (require.main === module) {
  bootstrap();
}