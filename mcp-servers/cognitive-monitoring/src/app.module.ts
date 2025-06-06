import { Module } from '@nestjs/common';
import { MCPModule } from './mcp/mcp.module';
import { WebSocketModule } from './websocket/websocket.module';
import { PrivacyModule } from './privacy/privacy.module';
import { AlgorithmsModule } from './algorithms/algorithms.module';
import { InterventionsModule } from './interventions/interventions.module';
import { DataModule } from './data/data.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ProcessingModule } from './processing/processing.module';

@Module({
  imports: [
    MCPModule,
    WebSocketModule,
    PrivacyModule,
    AlgorithmsModule,
    InterventionsModule,
    DataModule,
    AnalyticsModule,
    ProcessingModule,
  ],
})
export class AppModule {}