import { Module } from '@nestjs/common';
import { EducationalValidatorService } from './services/educational-validator.service';

@Module({
  providers: [EducationalValidatorService],
  exports: [EducationalValidatorService],
})
export class EducationalValidationModule {}