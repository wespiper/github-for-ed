import { Module } from '@nestjs/common';
import { StudentProfileController } from './student-profile.controller';
import { StudentProfilingService } from '../shared/student-profiling.service';
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
  controllers: [StudentProfileController],
  providers: [StudentProfilingService],
  exports: [StudentProfilingService],
})
export class HttpApiModule {}