import { Module } from '@nestjs/common';
import { MCPServerModule } from './mcp/mcp-server.module';
import { HttpApiModule } from './http/http-api.module';

@Module({
  imports: [
    MCPServerModule,
    HttpApiModule,
  ],
})
export class AppModule {}