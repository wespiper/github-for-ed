import { Module } from '@nestjs/common';
import { ConsentManagerService } from './consent-manager.service';
import { PrivacyMonitorService } from './privacy-monitor.service';
import { BehavioralAnonymizerService } from './behavioral-anonymizer.service';

@Module({
  providers: [
    ConsentManagerService,
    PrivacyMonitorService,
    BehavioralAnonymizerService,
  ],
  exports: [
    ConsentManagerService,
    PrivacyMonitorService,
    BehavioralAnonymizerService,
  ],
})
export class PrivacyModule {}