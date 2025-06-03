import { Module } from '@nestjs/common';
import { MCPToolsService } from './mcp-tools.service';

@Module({
  providers: [MCPToolsService],
  exports: [MCPToolsService]
})
export class MCPModule {}