import { Module } from '@nestjs/common';
import { MCPToolsController } from './mcp-tools.controller';
import { StudentProfilingService } from '../shared/student-profiling.service';
import { ConsentGuard } from './consent-guard';
import { DataAgencyModule } from '../data-agency/data-agency.module';
import { PrivacyAnalyticsModule } from '../privacy-analytics/privacy-analytics.module';
import { LearningTrajectoryModule } from '../learning-trajectory/learning-trajectory.module';
import { SkillAssessmentModule } from '../skill-assessment/skill-assessment.module';
import { PersonalizationModule } from '../personalization/personalization.module';

@Module({
  imports: [
    DataAgencyModule,
    PrivacyAnalyticsModule,
    LearningTrajectoryModule,
    SkillAssessmentModule,
    PersonalizationModule,
  ],
  controllers: [MCPToolsController],
  providers: [StudentProfilingService, ConsentGuard],
  exports: [StudentProfilingService],
})
export class MCPServerModule {}