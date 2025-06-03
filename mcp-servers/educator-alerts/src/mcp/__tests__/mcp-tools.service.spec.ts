/**
 * Test suite for MCP Tools Service
 */

import { MCPToolsService } from '../mcp-tools.service';

describe('MCPToolsService', () => {
  let service: MCPToolsService;

  beforeEach(async () => {
    service = new MCPToolsService();
    await service.initialize();
  });

  describe('Initialization', () => {
    it('should initialize with 4 tools', () => {
      const tools = service.getToolSchemas();
      expect(tools).toHaveLength(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('generate_intervention_recommendations');
      expect(toolNames).toContain('send_educator_alerts');
      expect(toolNames).toContain('schedule_intervention_actions');
      expect(toolNames).toContain('track_intervention_effectiveness');
    });

    it('should have valid tool schemas', () => {
      const tools = service.getToolSchemas();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        expect(tool.inputSchema.required).toBeDefined();
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      });
    });
  });

  describe('Generate Intervention Recommendations', () => {
    const mockArgs = {
      studentId: 'student-123',
      analysisData: {
        cognitiveLoad: 0.8,
        engagementScore: 0.3,
        qualityScore: 0.4,
        reflectionDepth: 0.5
      },
      educationalContext: {
        assignmentId: 'assignment-123',
        courseId: 'course-123',
        learningObjectives: ['critical thinking', 'analysis']
      },
      privacyContext: {
        requesterId: 'educator-123',
        requesterType: 'educator',
        purpose: 'intervention_support'
      }
    };

    it('should generate recommendations for high cognitive load', async () => {
      const result = await service.executeTool('generate_intervention_recommendations', mockArgs);
      
      expect(result.content).toHaveLength(1);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.data.recommendations).toBeDefined();
      expect(Array.isArray(response.data.recommendations)).toBe(true);
      
      // Should have cognitive support recommendation
      const cognitiveRec = response.data.recommendations.find(
        (rec: any) => rec.type === 'cognitive_support'
      );
      expect(cognitiveRec).toBeDefined();
      expect(cognitiveRec.confidence).toBeGreaterThan(0.8);
    });

    it('should generate recommendations for low engagement', async () => {
      const result = await service.executeTool('generate_intervention_recommendations', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      // Should have engagement boost recommendation
      const engagementRec = response.data.recommendations.find(
        (rec: any) => rec.type === 'engagement_boost'
      );
      expect(engagementRec).toBeDefined();
      expect(engagementRec.confidence).toBeGreaterThan(0.7);
    });

    it('should include privacy audit trail', async () => {
      const result = await service.executeTool('generate_intervention_recommendations', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.data.auditTrail).toBeDefined();
      expect(response.data.auditTrail.operation).toBe('generate_intervention_recommendations');
      expect(response.data.auditTrail.requesterId).toBe('educator-123');
      expect(response.data.privacyProtected).toBe(true);
    });

    it('should fail without privacy context', async () => {
      const argsWithoutPrivacy = { ...mockArgs };
      delete argsWithoutPrivacy.privacyContext;
      
      const result = await service.executeTool('generate_intervention_recommendations', argsWithoutPrivacy);
      
      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Privacy context is required');
    });
  });

  describe('Send Educator Alerts', () => {
    const mockArgs = {
      alerts: [{
        educatorId: 'educator-123',
        studentId: 'student-123',
        alertType: 'intervention_needed',
        severity: 'high',
        title: 'Student Needs Support',
        description: 'Cognitive overload detected',
        recommendedActions: [{
          type: 'contact_student',
          title: 'Contact Student',
          description: 'Reach out to discuss challenges',
          priority: 'high'
        }],
        triggerData: { cognitiveLoad: 0.9 }
      }],
      deliveryOptions: {
        immediate: true,
        channels: ['in_app', 'email']
      },
      privacyContext: {
        requesterId: 'educator-123',
        requesterType: 'educator',
        purpose: 'student_support'
      }
    };

    it('should send immediate alerts', async () => {
      const result = await service.executeTool('send_educator_alerts', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.data.sent).toHaveLength(1);
      expect(response.data.summary.sentCount).toBe(1);
      expect(response.data.summary.totalAlerts).toBe(1);
    });

    it('should queue non-immediate alerts', async () => {
      const nonImmediateArgs = {
        ...mockArgs,
        deliveryOptions: { immediate: false, channels: ['in_app'] }
      };
      
      const result = await service.executeTool('send_educator_alerts', nonImmediateArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.data.queued.length + response.data.sent.length).toBe(1);
    });

    it('should include audit trail', async () => {
      const result = await service.executeTool('send_educator_alerts', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.data.auditTrail).toBeDefined();
      expect(response.data.auditTrail.operation).toBe('send_educator_alerts');
      expect(response.data.auditTrail.alertCount).toBe(1);
    });
  });

  describe('Schedule Intervention Actions', () => {
    const mockArgs = {
      interventionId: 'intervention-123',
      scheduleData: {
        educatorId: 'educator-123',
        studentId: 'student-123',
        scheduledType: 'meeting',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        agenda: ['Review progress', 'Discuss challenges']
      },
      reminderSettings: {
        sendReminders: true,
        reminderTimes: ['24h', '1h', '15m']
      },
      privacyContext: {
        requesterId: 'educator-123',
        requesterType: 'educator',
        purpose: 'intervention_scheduling'
      }
    };

    it('should schedule intervention with reminders', async () => {
      const result = await service.executeTool('schedule_intervention_actions', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.data.schedule).toBeDefined();
      expect(response.data.reminders).toHaveLength(3);
      expect(response.data.metadata.totalReminders).toBe(3);
    });

    it('should include intervention ID in schedule', async () => {
      const result = await service.executeTool('schedule_intervention_actions', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.data.schedule.interventionId).toBe('intervention-123');
      expect(response.data.schedule.status).toBe('scheduled');
    });

    it('should include audit trail', async () => {
      const result = await service.executeTool('schedule_intervention_actions', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.data.auditTrail).toBeDefined();
      expect(response.data.auditTrail.interventionId).toBe('intervention-123');
    });
  });

  describe('Track Intervention Effectiveness', () => {
    const mockArgs = {
      interventionId: 'intervention-123',
      measurementData: {
        measurementType: 'pre_post',
        metrics: {
          engagementScore: 0.7,
          qualityScore: 0.6,
          cognitiveLoad: 0.5
        },
        baselineData: { engagementScore: 0.3, qualityScore: 0.4, cognitiveLoad: 0.8 },
        postInterventionData: { engagementScore: 0.7, qualityScore: 0.6, cognitiveLoad: 0.5 },
        confidenceLevel: 0.85,
        notes: 'Significant improvement observed',
        followUpRecommendations: ['Continue current approach']
      },
      comparisonPeriod: {
        baseline: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-07T23:59:59Z'
        },
        measurement: {
          start: '2024-01-15T00:00:00Z',
          end: '2024-01-21T23:59:59Z'
        }
      },
      privacyContext: {
        requesterId: 'educator-123',
        requesterType: 'educator',
        purpose: 'effectiveness_tracking'
      }
    };

    it('should track intervention effectiveness', async () => {
      const result = await service.executeTool('track_intervention_effectiveness', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.data.effectiveness).toBeDefined();
      expect(response.data.analysis).toBeDefined();
      expect(response.data.insights).toBeDefined();
    });

    it('should calculate improvement scores', async () => {
      const result = await service.executeTool('track_intervention_effectiveness', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.data.analysis.overallImprovement).toBeGreaterThan(0);
      expect(response.data.analysis.improvements).toBeDefined();
      expect(response.data.analysis.metricCount).toBe(3);
    });

    it('should generate insights and recommendations', async () => {
      const result = await service.executeTool('track_intervention_effectiveness', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(Array.isArray(response.data.insights)).toBe(true);
      expect(response.data.insights.length).toBeGreaterThan(0);
      expect(Array.isArray(response.data.recommendations)).toBe(true);
    });

    it('should include statistical significance', async () => {
      const result = await service.executeTool('track_intervention_effectiveness', mockArgs);
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.data.metadata.statisticalSignificance).toBeDefined();
      expect(['significant', 'not_significant']).toContain(
        response.data.metadata.statisticalSignificance
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool gracefully', async () => {
      const result = await service.executeTool('unknown_tool', {});
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown tool');
    });

    it('should handle missing privacy context', async () => {
      const result = await service.executeTool('generate_intervention_recommendations', {
        studentId: 'student-123',
        analysisData: {}
      });
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Privacy context is required');
    });
  });
});