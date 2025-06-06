import { Module } from '@nestjs/common';
import { PrivacyAnalyticsService } from './privacy-analytics.service';

@Module({
  providers: [PrivacyAnalyticsService],
  exports: [PrivacyAnalyticsService],
})
export class AnalyticsModule {}