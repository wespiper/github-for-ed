import { Module } from '@nestjs/common';
import { EphemeralBufferService } from './ephemeral-buffer.service';

@Module({
  providers: [EphemeralBufferService],
  exports: [EphemeralBufferService],
})
export class DataModule {}