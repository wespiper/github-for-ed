import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WritingAnalysisMCPClient } from './WritingAnalysisMCPClient';

@Global()
@Module({
  providers: [
    {
      provide: WritingAnalysisMCPClient,
      useFactory: () => {
        return new WritingAnalysisMCPClient();
      },
    },
  ],
  exports: [WritingAnalysisMCPClient],
})
export class MCPModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly mcpClient: WritingAnalysisMCPClient) {}

  async onModuleInit() {
    // Connect to MCP server on startup
    await this.mcpClient.connect();
  }

  async onModuleDestroy() {
    // Disconnect from MCP server on shutdown
    await this.mcpClient.disconnect();
  }
}