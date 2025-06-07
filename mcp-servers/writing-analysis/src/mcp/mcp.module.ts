import { Module } from '@nestjs/common';
import { McpToolsController } from './mcp-tools.controller';
import { PrivacyGuard } from './privacy-guard';
import { WritingAnalysisModule } from '../writing-analysis/writing-analysis.module';
import { ReflectionAnalysisModule } from '../reflection-analysis/reflection-analysis.module';
import { ContentPrivacyModule } from '../content-privacy/content-privacy.module';
import { EducationalValidationModule } from '../educational-validation/educational-validation.module';
import { InsightsGenerationModule } from '../insights-generation/insights-generation.module';

@Module({
  imports: [
    WritingAnalysisModule,
    ReflectionAnalysisModule,
    ContentPrivacyModule,
    EducationalValidationModule,
    InsightsGenerationModule,
  ],
  controllers: [McpToolsController],
  providers: [PrivacyGuard],
  exports: [PrivacyGuard],
})
export class McpModule {}