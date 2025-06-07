/**
 * AI Detection Module
 * Handles AI assistance level detection in student work
 */

import { Module } from '@nestjs/common';
import { AIAssistanceDetectorService } from './services/ai-assistance-detector.service';

@Module({
  providers: [AIAssistanceDetectorService],
  exports: [AIAssistanceDetectorService],
})
export class AIDetectionModule {}