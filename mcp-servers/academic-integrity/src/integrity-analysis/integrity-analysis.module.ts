/**
 * Integrity Analysis Module
 * Handles comprehensive academic integrity analysis
 */

import { Module } from '@nestjs/common';
import { IntegrityAnalyzerService } from './services/integrity-analyzer.service';

@Module({
  providers: [IntegrityAnalyzerService],
  exports: [IntegrityAnalyzerService],
})
export class IntegrityAnalysisModule {}