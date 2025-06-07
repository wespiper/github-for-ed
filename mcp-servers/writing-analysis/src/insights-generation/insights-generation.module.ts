import { Module } from '@nestjs/common';
import { InsightsGeneratorService } from './services/insights-generator.service';
import { ContentPrivacyModule } from '../content-privacy/content-privacy.module';
import { EventsModule } from '../events/events.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    ContentPrivacyModule,
    EventsModule,
    RepositoriesModule,
  ],
  providers: [
    InsightsGeneratorService,
  ],
  exports: [
    InsightsGeneratorService,
  ],
})
export class InsightsGenerationModule {}