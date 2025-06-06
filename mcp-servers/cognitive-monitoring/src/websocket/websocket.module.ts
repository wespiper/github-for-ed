import { Module } from '@nestjs/common';
import { SecureWebSocketHandler } from './secure-websocket-handler';
import { PrivacyModule } from '../privacy/privacy.module';
import { DataModule } from '../data/data.module';

@Module({
  imports: [PrivacyModule, DataModule],
  providers: [SecureWebSocketHandler],
  exports: [SecureWebSocketHandler],
})
export class WebSocketModule {}