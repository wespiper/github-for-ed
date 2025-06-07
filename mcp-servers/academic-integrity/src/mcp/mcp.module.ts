/**
 * MCP Module
 * Handles Model Context Protocol integration
 */

import { Module } from '@nestjs/common';
import { MCPToolsController } from './mcp-tools.controller';
import { MCPToolsService } from './mcp-tools.service';
import { AIDetectionModule } from '../ai-detection/ai-detection.module';
import { IntegrityAnalysisModule } from '../integrity-analysis/integrity-analysis.module';
import { EducationalValidationModule } from '../educational-validation/educational-validation.module';
import { ReportingModule } from '../reporting/reporting.module';

@Module({
  imports: [
    AIDetectionModule,
    IntegrityAnalysisModule,
    EducationalValidationModule,
    ReportingModule,
  ],
  controllers: [MCPToolsController],
  providers: [MCPToolsService],
  exports: [MCPToolsService],
})
export class MCPModule {}