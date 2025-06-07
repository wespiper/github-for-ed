/**
 * Academic Integrity App Module
 * Root module for the Academic Integrity MCP Server
 */

import { Module } from '@nestjs/common';
import { MCPModule } from './mcp/mcp.module';
import { AIDetectionModule } from './ai-detection/ai-detection.module';
import { IntegrityAnalysisModule } from './integrity-analysis/integrity-analysis.module';
import { EducationalValidationModule } from './educational-validation/educational-validation.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    MCPModule,
    AIDetectionModule,
    IntegrityAnalysisModule,
    EducationalValidationModule,
    ReportingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}