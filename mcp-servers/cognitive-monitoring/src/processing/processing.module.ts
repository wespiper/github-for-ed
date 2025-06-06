import { Module } from '@nestjs/common';
import { CognitiveEventProcessorService } from './cognitive-event-processor.service';
import { PrivacyModule } from '../privacy/privacy.module';
import { AlgorithmsModule } from '../algorithms/algorithms.module';

@Module({
  imports: [PrivacyModule, AlgorithmsModule],
  providers: [CognitiveEventProcessorService],
  exports: [CognitiveEventProcessorService],
})
export class ProcessingModule {}