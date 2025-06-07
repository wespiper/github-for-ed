import { Module } from '@nestjs/common';
import { ReportGeneratorService } from './services/report-generator.service';

@Module({
  providers: [ReportGeneratorService],
  exports: [ReportGeneratorService],
})
export class ReportingModule {}