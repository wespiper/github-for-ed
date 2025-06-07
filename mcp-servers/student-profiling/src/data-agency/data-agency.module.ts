import { Module } from '@nestjs/common';
import { PrivacyChoicesService } from './services/privacy-choices.service';
import { AccessValidatorService } from './services/access-validator.service';
import { PrivacyDashboardService } from './services/privacy-dashboard.service';

@Module({
  providers: [
    PrivacyChoicesService,
    AccessValidatorService,
    PrivacyDashboardService,
  ],
  exports: [
    PrivacyChoicesService,
    AccessValidatorService,
    PrivacyDashboardService,
  ],
})
export class DataAgencyModule {}