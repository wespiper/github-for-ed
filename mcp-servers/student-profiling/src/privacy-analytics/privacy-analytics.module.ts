import { Module } from '@nestjs/common';
import { DifferentialPrivacyService } from './services/differential-privacy.service';

@Module({
  providers: [DifferentialPrivacyService],
  exports: [DifferentialPrivacyService],
})
export class PrivacyAnalyticsModule {}