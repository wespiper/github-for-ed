import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule } from './mcp/mcp.module';
import { WritingAnalysisModule } from './writing-analysis/writing-analysis.module';
import { ReflectionAnalysisModule } from './reflection-analysis/reflection-analysis.module';
import { ContentPrivacyModule } from './content-privacy/content-privacy.module';
import { EducationalValidationModule } from './educational-validation/educational-validation.module';
import { InsightsGenerationModule } from './insights-generation/insights-generation.module';
import { EventsModule } from './events/events.module';
import { RepositoriesModule } from './repositories/repositories.module';
import privacyConfig from './config/privacy.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [privacyConfig],
      envFilePath: ['.env.privacy', '.env'],
    }),
    McpModule,
    WritingAnalysisModule,
    ReflectionAnalysisModule,
    ContentPrivacyModule,
    EducationalValidationModule,
    InsightsGenerationModule,
    EventsModule,
    RepositoriesModule,
  ],
})
export class AppModule {}