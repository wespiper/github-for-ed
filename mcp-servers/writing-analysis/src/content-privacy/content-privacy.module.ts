import { Module } from '@nestjs/common';
import { ContentClassifierService } from './services/content-classifier.service';
import { AIBoundaryEnforcerService } from './services/ai-boundary-enforcer.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { EventsModule } from '../events/events.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    EventsModule,
    RepositoriesModule,
  ],
  providers: [
    ContentClassifierService,
    AIBoundaryEnforcerService,
    AuditLoggerService,
  ],
  exports: [
    ContentClassifierService,
    AIBoundaryEnforcerService,
    AuditLoggerService,
  ],
})
export class ContentPrivacyModule {}