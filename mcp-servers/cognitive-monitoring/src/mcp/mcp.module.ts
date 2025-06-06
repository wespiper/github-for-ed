import { Module } from '@nestjs/common';
import { MCPToolsController } from './mcp-tools.controller';
import { PrivacyModule } from '../privacy/privacy.module';
import { AlgorithmsModule } from '../algorithms/algorithms.module';
import { InterventionsModule } from '../interventions/interventions.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    PrivacyModule,
    AlgorithmsModule,
    InterventionsModule,
    AnalyticsModule,
  ],
  providers: [MCPToolsController],
  exports: [MCPToolsController],
})
export class MCPModule {}