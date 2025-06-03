import { Module } from '@nestjs/common';
import { WritingPatternAnalyzerService } from './services/writing-pattern-analyzer.service';
import { WritingProgressTrackerService } from './services/writing-progress-tracker.service';
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
    WritingPatternAnalyzerService,
    WritingProgressTrackerService,
  ],
  exports: [
    WritingPatternAnalyzerService,
    WritingProgressTrackerService,
  ],
})
export class WritingAnalysisModule {}