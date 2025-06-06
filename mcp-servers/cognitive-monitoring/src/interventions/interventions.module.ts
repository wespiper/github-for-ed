import { Module } from '@nestjs/common';
import { InterventionEngineService } from './intervention-engine.service';

@Module({
  providers: [InterventionEngineService],
  exports: [InterventionEngineService],
})
export class InterventionsModule {}