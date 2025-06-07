import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudentProfilingService, BuildProfileParams, StudentProfile } from '../shared/student-profiling.service';
import { PrivacyChoicesService } from '../data-agency/services/privacy-choices.service';
import { DifferentialPrivacyService } from '../privacy-analytics/services/differential-privacy.service';
import { AccessValidatorService } from '../data-agency/services/access-validator.service';
import { PrivacyDashboardService } from '../data-agency/services/privacy-dashboard.service';

@ApiTags('student-profiles')
@Controller('api/v1/student-profiles')
@ApiBearerAuth()
export class StudentProfileController {
  private readonly logger = new Logger(StudentProfileController.name);

  constructor(
    private readonly profilingService: StudentProfilingService,
    private readonly privacyChoicesService: PrivacyChoicesService,
    private readonly differentialPrivacyService: DifferentialPrivacyService,
    private readonly accessValidatorService: AccessValidatorService,
    private readonly privacyDashboardService: PrivacyDashboardService,
  ) {}

  @Post('build')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build a privacy-aware student profile' })
  @ApiResponse({ status: 200, description: 'Profile built successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async buildProfile(@Body() params: BuildProfileParams): Promise<StudentProfile> {
    this.logger.log(`HTTP API: Building profile for student ${params.studentId}`);
    return this.profilingService.buildProfile(params);
  }

  @Put(':studentId/privacy-choices')
  @ApiOperation({ summary: 'Update student privacy choices' })
  @ApiResponse({ status: 200, description: 'Privacy choices updated' })
  async updatePrivacyChoices(
    @Param('studentId') studentId: string,
    @Body() choices: any
  ) {
    this.logger.log(`HTTP API: Updating privacy choices for student ${studentId}`);
    return this.privacyChoicesService.managePrivacyChoices(studentId, choices);
  }

  @Post('analytics/privacy-preserving')
  @ApiOperation({ summary: 'Generate privacy-preserving analytics' })
  @ApiResponse({ status: 200, description: 'Analytics generated with differential privacy' })
  async generatePrivacyPreservingAnalytics(
    @Body() body: {
      cohortIds: string[];
      metrics: string[];
      epsilon?: number;
      delta?: number;
    }
  ) {
    this.logger.log('HTTP API: Generating privacy-preserving analytics');
    return this.differentialPrivacyService.generatePrivacyPreservingAnalytics(
      body.cohortIds,
      body.metrics,
      body.epsilon,
      body.delta
    );
  }

  @Post(':studentId/learning-trajectory')
  @ApiOperation({ summary: 'Track learning trajectory milestone' })
  @ApiResponse({ status: 201, description: 'Milestone tracked successfully' })
  async trackLearningTrajectory(
    @Param('studentId') studentId: string,
    @Body() body: {
      milestone: any;
      privacyLevel?: 'full' | 'anonymized' | 'aggregate';
    }
  ) {
    this.logger.log(`HTTP API: Tracking trajectory for student ${studentId}`);
    return this.profilingService.trackLearningTrajectory(
      studentId,
      body.milestone,
      body.privacyLevel
    );
  }

  @Post('access-validation')
  @ApiOperation({ summary: 'Validate data access request' })
  @ApiResponse({ status: 200, description: 'Access validation result' })
  async validateDataAccess(@Body() accessRequest: any) {
    this.logger.log('HTTP API: Validating data access request');
    return this.accessValidatorService.validateAccessRequest(accessRequest);
  }

  @Post(':studentId/skill-assessment')
  @ApiOperation({ summary: 'Create skill assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created' })
  async assessSkillDevelopment(
    @Param('studentId') studentId: string,
    @Body() body: {
      skills: any[];
      sharedWith?: string[];
    }
  ) {
    this.logger.log(`HTTP API: Assessing skills for student ${studentId}`);
    return this.profilingService.assessSkillDevelopment(
      studentId,
      body.skills,
      body.sharedWith
    );
  }

  @Get(':studentId/privacy-dashboard')
  @ApiOperation({ summary: 'Get student privacy dashboard' })
  @ApiResponse({ status: 200, description: 'Privacy dashboard data' })
  async getPrivacyDashboard(
    @Param('studentId') studentId: string,
    @Query('includeRecommendations') includeRecommendations?: boolean,
    @Query('timeRange') timeRange?: string
  ) {
    this.logger.log(`HTTP API: Getting privacy dashboard for student ${studentId}`);
    return this.privacyDashboardService.createDashboard(
      studentId,
      includeRecommendations,
      timeRange
    );
  }

  @Post(':studentId/recommendations')
  @ApiOperation({ summary: 'Generate personalized recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations generated' })
  async generateRecommendations(
    @Param('studentId') studentId: string,
    @Body() options: { useEnhancedData?: boolean }
  ) {
    this.logger.log(`HTTP API: Generating recommendations for student ${studentId}`);
    return this.profilingService.generatePersonalizedRecommendations(
      studentId,
      options
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'student-profiling',
      timestamp: new Date().toISOString(),
      protocols: ['MCP', 'HTTP'],
    };
  }
}