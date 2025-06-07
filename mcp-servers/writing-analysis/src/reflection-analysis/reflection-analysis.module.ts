import { Module } from '@nestjs/common';
import { ReflectionQualityAssessorService } from './services/reflection-quality-assessor.service';
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
    ReflectionQualityAssessorService,
  ],
  exports: [
    ReflectionQualityAssessorService,
  ],
})
export class ReflectionAnalysisModule {}