import { Module } from '@nestjs/common';
import { CognitiveLoadDetectorService } from './cognitive-load-detector.service';
import { PatternAnalyzerService } from './pattern-analyzer.service';

@Module({
  providers: [
    CognitiveLoadDetectorService,
    PatternAnalyzerService,
  ],
  exports: [
    CognitiveLoadDetectorService,
    PatternAnalyzerService,
  ],
})
export class AlgorithmsModule {}