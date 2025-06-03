import { Controller, Logger, UseGuards } from '@nestjs/common';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { StudentProfilingService } from '../shared/student-profiling.service';
import { PrivacyChoicesService } from '../data-agency/services/privacy-choices.service';
import { DifferentialPrivacyService } from '../privacy-analytics/services/differential-privacy.service';
import { AccessValidatorService } from '../data-agency/services/access-validator.service';
import { PrivacyDashboardService } from '../data-agency/services/privacy-dashboard.service';
import { ConsentGuard } from './consent-guard';

@Controller('mcp')
export class MCPToolsController {
  private readonly logger = new Logger(MCPToolsController.name);
  private tools: Map<string, Tool> = new Map();

  constructor(
    private readonly profilingService: StudentProfilingService,
    private readonly privacyChoicesService: PrivacyChoicesService,
    private readonly differentialPrivacyService: DifferentialPrivacyService,
    private readonly accessValidatorService: AccessValidatorService,
    private readonly privacyDashboardService: PrivacyDashboardService,
  ) {
    this.registerTools();
  }

  private registerTools() {
    // Privacy Tool #1: Manage Student Privacy Choices
    this.registerTool({
      name: 'manage_student_privacy_choices',
      description: 'Manage comprehensive student privacy choices with granular controls',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          choices: {
            type: 'object',
            properties: {
              educationalSharing: {
                type: 'object',
                properties: {
                  teacher: { type: 'boolean' },
                  peer: { type: 'boolean' },
                  parent: { type: 'boolean' },
                },
              },
              platformImprovement: {
                type: 'object',
                properties: {
                  anonymousPatterns: { type: 'boolean' },
                  featureAnalytics: { type: 'boolean' },
                  research: { type: 'boolean' },
                },
              },
              personalBenefits: {
                type: 'object',
                properties: {
                  enhancedAnalytics: { type: 'boolean' },
                  portfolio: { type: 'boolean' },
                  careerGuidance: { type: 'boolean' },
                },
              },
              privacyControls: {
                type: 'object',
                properties: {
                  retentionPeriod: { type: 'string' },
                  sensitiveContent: { type: 'string' },
                  thirdParty: { type: 'string' },
                },
              },
            },
          },
        },
        required: ['studentId', 'choices'],
      },
    });

    // Core Tool #1: Build Student Profile
    this.registerTool({
      name: 'build_student_profile',
      description: 'Build a privacy-aware student profile with consent verification',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' },
          includePrivateData: { type: 'boolean' },
          requesterContext: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              role: { type: 'string', enum: ['student', 'teacher', 'parent', 'admin'] },
              purpose: { type: 'string' },
            },
            required: ['userId', 'role', 'purpose'],
          },
        },
        required: ['studentId'],
      },
    });

    // Privacy Tool #2: Generate Privacy-Preserving Analytics
    this.registerTool({
      name: 'generate_privacy_preserving_analytics',
      description: 'Generate analytics with differential privacy protection',
      inputSchema: {
        type: 'object',
        properties: {
          cohortIds: {
            type: 'array',
            items: { type: 'string' },
          },
          metrics: {
            type: 'array',
            items: { type: 'string' },
          },
          epsilon: { type: 'number' },
          delta: { type: 'number' },
        },
        required: ['cohortIds', 'metrics'],
      },
    });

    // Core Tool #2: Track Learning Trajectory
    this.registerTool({
      name: 'track_learning_trajectory',
      description: 'Track student learning trajectory with privacy controls',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          milestone: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              level: { type: 'number' },
              evidence: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['skill', 'level'],
          },
          privacyLevel: {
            type: 'string',
            enum: ['full', 'anonymized', 'aggregate'],
          },
        },
        required: ['studentId', 'milestone'],
      },
    });

    // Privacy Tool #3: Validate Data Access Requests
    this.registerTool({
      name: 'validate_data_access_requests',
      description: 'Validate and authorize data access requests against privacy choices',
      inputSchema: {
        type: 'object',
        properties: {
          requesterId: { type: 'string' },
          requesterType: {
            type: 'string',
            enum: ['teacher', 'peer', 'platform', 'researcher'],
          },
          studentId: { type: 'string' },
          purpose: { type: 'string' },
          dataTypes: {
            type: 'array',
            items: { type: 'string' },
          },
          studentBenefit: { type: 'string' },
        },
        required: ['requesterId', 'requesterType', 'studentId', 'purpose', 'dataTypes'],
      },
    });

    // Core Tool #3: Assess Skill Development
    this.registerTool({
      name: 'assess_skill_development',
      description: 'Assess student skill development with privacy-aware sharing',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          skills: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                skillName: { type: 'string' },
                currentLevel: { type: 'number' },
                targetLevel: { type: 'number' },
                progress: { type: 'number' },
              },
              required: ['skillName', 'currentLevel', 'targetLevel', 'progress'],
            },
          },
          sharedWith: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['studentId', 'skills'],
      },
    });

    // Privacy Tool #4: Create Student Privacy Dashboard
    this.registerTool({
      name: 'create_student_privacy_dashboard',
      description: 'Create comprehensive privacy dashboard for student data agency',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          includeRecommendations: { type: 'boolean' },
          timeRange: {
            type: 'string',
            enum: ['week', 'month', 'semester', 'all'],
          },
        },
        required: ['studentId'],
      },
    });

    // Core Tool #4: Generate Personalized Recommendations
    this.registerTool({
      name: 'generate_personalized_recommendations',
      description: 'Generate privacy-aware personalized recommendations with value exchange',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          useEnhancedData: { type: 'boolean' },
          recommendationTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['learning', 'practice', 'resource', 'collaboration'],
            },
          },
        },
        required: ['studentId'],
      },
    });
  }

  private registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
    this.logger.log(`Registered MCP tool: ${tool.name}`);
  }

  async getTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  @UseGuards(ConsentGuard)
  async executeTool(name: string, params: any): Promise<any> {
    this.logger.log(`Executing MCP tool: ${name}`);

    switch (name) {
      case 'manage_student_privacy_choices':
        return this.privacyChoicesService.managePrivacyChoices(
          params.studentId,
          params.choices
        );

      case 'build_student_profile':
        return this.profilingService.buildProfile(params);

      case 'generate_privacy_preserving_analytics':
        return this.differentialPrivacyService.generatePrivacyPreservingAnalytics(
          params.cohortIds,
          params.metrics,
          params.epsilon,
          params.delta
        );

      case 'track_learning_trajectory':
        return this.profilingService.trackLearningTrajectory(
          params.studentId,
          params.milestone,
          params.privacyLevel
        );

      case 'validate_data_access_requests':
        return this.accessValidatorService.validateAccessRequest({
          requesterId: params.requesterId,
          requesterType: params.requesterType,
          studentId: params.studentId,
          purpose: params.purpose,
          dataTypes: params.dataTypes,
          studentBenefit: params.studentBenefit,
        });

      case 'assess_skill_development':
        return this.profilingService.assessSkillDevelopment(
          params.studentId,
          params.skills,
          params.sharedWith
        );

      case 'create_student_privacy_dashboard':
        return this.privacyDashboardService.createDashboard(
          params.studentId,
          params.includeRecommendations,
          params.timeRange
        );

      case 'generate_personalized_recommendations':
        return this.profilingService.generatePersonalizedRecommendations(
          params.studentId,
          { useEnhancedData: params.useEnhancedData }
        );

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}