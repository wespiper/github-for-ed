import { Module } from '@nestjs/common';
import { MCPModule } from './mcp/mcp.module';
import { InterventionsModule } from './interventions/interventions.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EffectivenessTrackingModule } from './effectiveness-tracking/effectiveness-tracking.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    MCPModule,
    InterventionsModule,
    AlertsModule,
    NotificationsModule,
    EffectivenessTrackingModule,
    IntegrationsModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}