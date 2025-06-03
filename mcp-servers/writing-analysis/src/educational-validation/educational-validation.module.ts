import { Module } from '@nestjs/common';
import { PurposeValidatorService } from './services/purpose-validator.service';
import { EventsModule } from '../events/events.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    EventsModule,
    RepositoriesModule,
  ],
  providers: [
    PurposeValidatorService,
  ],
  exports: [
    PurposeValidatorService,
  ],
})
export class EducationalValidationModule {}