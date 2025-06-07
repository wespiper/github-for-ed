/**
 * MCP Tools Service for Educator Alerts
 * Implements the 4 core MCP tools with privacy-aware educational functionality
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { 
  ALERT_TYPES, 
  SEVERITY_LEVELS, 
  INTERVENTION_TYPES,
  RECOMMENDED_ACTION_TYPES,
  NOTIFICATION_CHANNELS,
  PERFORMANCE_THRESHOLDS
} from '../config/constants';

export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

@Injectable()
export class MCPToolsService {
  private logger = new Logger('MCPToolsService');
  private tools: Map<string, MCPToolSchema> = new Map();

  async initialize() {
    this.registerTools();
    this.logger.info('MCP Tools Service initialized with 4 educator alert tools');
  }

  private registerTools() {
    // Tool 1: Generate Intervention Recommendations
    this.tools.set('generate_intervention_recommendations', {
      name: 'generate_intervention_recommendations',
      description: 'Generate personalized intervention recommendations based on student analysis data with privacy protection',
      inputSchema: {
        type: 'object',
        properties: {
          studentId: {
            type: 'string',
            description: 'Unique identifier for the student'
          },
          analysisData: {
            type: 'object',
            description: 'Student analysis data including cognitive load, engagement, quality scores',
            properties: {
              cognitiveLoad: { type: 'number', minimum: 0, maximum: 1 },
              engagementScore: { type: 'number', minimum: 0, maximum: 1 },
              qualityScore: { type: 'number', minimum: 0, maximum: 1 },
              reflectionDepth: { type: 'number', minimum: 0, maximum: 1 },
              timeOnTask: { type: 'number', minimum: 0 },
              strugglingDuration: { type: 'number', minimum: 0 }
            }
          },
          educationalContext: {
            type: 'object',
            description: 'Educational context for the recommendations',
            properties: {
              assignmentId: { type: 'string' },
              courseId: { type: 'string' },
              learningObjectives: { type: 'array', items: { type: 'string' } },
              writingStage: { type: 'string' },
              dueDate: { type: 'string' }
            }
          },
          privacyContext: {
            type: 'object',
            description: 'Privacy context for audit trails and access control',
            properties: {
              requesterId: { type: 'string' },
              requesterType: { type: 'string', enum: ['student', 'educator', 'admin'] },
              purpose: { type: 'string' },
              educationalJustification: { type: 'string' }
            },
            required: ['requesterId', 'requesterType', 'purpose']
          }
        },
        required: ['studentId', 'analysisData', 'educationalContext', 'privacyContext']
      }
    });

    // Tool 2: Send Educator Alerts
    this.tools.set('send_educator_alerts', {
      name: 'send_educator_alerts',
      description: 'Send privacy-aware alerts to educators with customizable delivery options and educator preferences',
      inputSchema: {
        type: 'object',
        properties: {
          alerts: {
            type: 'array',
            description: 'Array of alerts to send',
            items: {
              type: 'object',
              properties: {
                educatorId: { type: 'string' },
                studentId: { type: 'string' },
                assignmentId: { type: 'string' },
                courseId: { type: 'string' },
                alertType: { type: 'string', enum: ALERT_TYPES },
                severity: { type: 'string', enum: SEVERITY_LEVELS },
                title: { type: 'string', maxLength: 200 },
                description: { type: 'string', maxLength: 1000 },
                recommendedActions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: RECOMMENDED_ACTION_TYPES },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      priority: { type: 'string', enum: SEVERITY_LEVELS },
                      estimatedTime: { type: 'string' }
                    },
                    required: ['type', 'title', 'description', 'priority']
                  }
                },
                triggerData: { type: 'object' }
              },
              required: ['educatorId', 'studentId', 'alertType', 'severity', 'title', 'description']
            }
          },
          deliveryOptions: {
            type: 'object',
            description: 'Alert delivery configuration',
            properties: {
              immediate: { type: 'boolean', default: false },
              channels: { type: 'array', items: { type: 'string', enum: NOTIFICATION_CHANNELS } },
              batchWithOthers: { type: 'boolean', default: true },
              respectQuietHours: { type: 'boolean', default: true }
            }
          },
          privacyContext: {
            type: 'object',
            description: 'Privacy context for audit trails',
            properties: {
              requesterId: { type: 'string' },
              requesterType: { type: 'string', enum: ['student', 'educator', 'admin'] },
              purpose: { type: 'string' },
              educationalJustification: { type: 'string' }
            },
            required: ['requesterId', 'requesterType', 'purpose']
          }
        },
        required: ['alerts', 'deliveryOptions', 'privacyContext']
      }
    });

    // Tool 3: Schedule Intervention Actions
    this.tools.set('schedule_intervention_actions', {
      name: 'schedule_intervention_actions',
      description: 'Schedule intervention actions with calendar integration and automated reminder system',
      inputSchema: {
        type: 'object',
        properties: {
          interventionId: {
            type: 'string',
            description: 'Unique identifier for the intervention'
          },
          scheduleData: {
            type: 'object',
            description: 'Intervention scheduling details',
            properties: {
              educatorId: { type: 'string' },
              studentId: { type: 'string' },
              scheduledType: { 
                type: 'string', 
                enum: ['meeting', 'check_in', 'feedback_session', 'support_call', 'progress_review'] 
              },
              scheduledFor: { type: 'string', format: 'date-time' },
              duration: { type: 'number', minimum: 5, maximum: 300 },
              location: { type: 'string' },
              virtualMeetingUrl: { type: 'string', format: 'uri' },
              agenda: { type: 'array', items: { type: 'string' } },
              preparationMaterials: { type: 'array', items: { type: 'string' } },
              followUpRequired: { type: 'boolean', default: false }
            },
            required: ['educatorId', 'studentId', 'scheduledType', 'scheduledFor', 'duration']
          },
          reminderSettings: {
            type: 'object',
            description: 'Automated reminder configuration',
            properties: {
              sendReminders: { type: 'boolean', default: true },
              reminderTimes: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Reminder times before meeting (e.g., ["24h", "1h", "15m"])'
              },
              includePreparation: { type: 'boolean', default: true },
              channels: { type: 'array', items: { type: 'string', enum: NOTIFICATION_CHANNELS } }
            }
          },
          privacyContext: {
            type: 'object',
            properties: {
              requesterId: { type: 'string' },
              requesterType: { type: 'string', enum: ['student', 'educator', 'admin'] },
              purpose: { type: 'string' },
              educationalJustification: { type: 'string' }
            },
            required: ['requesterId', 'requesterType', 'purpose']
          }
        },
        required: ['interventionId', 'scheduleData', 'reminderSettings', 'privacyContext']
      }
    });

    // Tool 4: Track Intervention Effectiveness
    this.tools.set('track_intervention_effectiveness', {
      name: 'track_intervention_effectiveness',
      description: 'Track and measure intervention effectiveness with longitudinal analysis and privacy protection',
      inputSchema: {
        type: 'object',
        properties: {
          interventionId: {
            type: 'string',
            description: 'Unique identifier for the intervention to track'
          },
          measurementData: {
            type: 'object',
            description: 'Effectiveness measurement data',
            properties: {
              measurementType: { 
                type: 'string', 
                enum: ['pre_post', 'longitudinal', 'immediate', 'delayed'] 
              },
              metrics: {
                type: 'object',
                description: 'Measured metrics (scores between 0-1)',
                properties: {
                  engagementScore: { type: 'number', minimum: 0, maximum: 1 },
                  qualityScore: { type: 'number', minimum: 0, maximum: 1 },
                  progressRate: { type: 'number', minimum: 0, maximum: 1 },
                  reflectionDepth: { type: 'number', minimum: 0, maximum: 1 },
                  cognitiveLoad: { type: 'number', minimum: 0, maximum: 1 },
                  timeEfficiency: { type: 'number', minimum: 0, maximum: 1 }
                }
              },
              baselineData: { 
                type: 'object',
                description: 'Pre-intervention baseline measurements'
              },
              postInterventionData: { 
                type: 'object',
                description: 'Post-intervention measurements'
              },
              confidenceLevel: { 
                type: 'number', 
                minimum: 0, 
                maximum: 1,
                description: 'Statistical confidence in the measurements' 
              },
              notes: { type: 'string' },
              followUpRecommendations: { type: 'array', items: { type: 'string' } }
            },
            required: ['measurementType', 'metrics', 'baselineData', 'postInterventionData', 'confidenceLevel']
          },
          comparisonPeriod: {
            type: 'object',
            description: 'Time periods for baseline vs measurement comparison',
            properties: {
              baseline: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' }
                },
                required: ['start', 'end']
              },
              measurement: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' }
                },
                required: ['start', 'end']
              }
            },
            required: ['baseline', 'measurement']
          },
          privacyContext: {
            type: 'object',
            properties: {
              requesterId: { type: 'string' },
              requesterType: { type: 'string', enum: ['student', 'educator', 'admin'] },
              purpose: { type: 'string' },
              educationalJustification: { type: 'string' }
            },
            required: ['requesterId', 'requesterType', 'purpose']
          }
        },
        required: ['interventionId', 'measurementData', 'comparisonPeriod', 'privacyContext']
      }
    });

    this.logger.info(`Registered ${this.tools.size} MCP tools`);
  }

  getToolSchemas(): MCPToolSchema[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, args: any): Promise<MCPToolResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing tool: ${name}`);
      
      if (!this.tools.has(name)) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Validate privacy context is present
      if (!args.privacyContext) {
        throw new Error('Privacy context is required for all educator alert operations');
      }

      let result: any;

      switch (name) {
        case 'generate_intervention_recommendations':
          result = await this.generateInterventionRecommendations(args);
          break;
        case 'send_educator_alerts':
          result = await this.sendEducatorAlerts(args);
          break;
        case 'schedule_intervention_actions':
          result = await this.scheduleInterventionActions(args);
          break;
        case 'track_intervention_effectiveness':
          result = await this.trackInterventionEffectiveness(args);
          break;
        default:
          throw new Error(`Tool implementation not found: ${name}`);
      }

      const executionTime = Date.now() - startTime;
      const threshold = PERFORMANCE_THRESHOLDS.alertGeneration;
      
      if (executionTime > threshold) {
        this.logger.warn(`Tool ${name} exceeded performance threshold: ${executionTime}ms > ${threshold}ms`);
      }

      this.logger.info(`Tool ${name} completed in ${executionTime}ms`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logger.error(`Tool execution failed for ${name}:`, error);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              tool: name,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  private async generateInterventionRecommendations(args: any): Promise<any> {
    const { studentId, analysisData, educationalContext, privacyContext } = args;

    // Privacy audit logging
    this.logPrivacyAudit('generate_intervention_recommendations', studentId, privacyContext);

    const recommendations = [];

    // Analyze cognitive load and generate recommendations
    if (analysisData.cognitiveLoad > 0.8) {
      recommendations.push({
        id: `rec_cognitive_${Date.now()}`,
        type: 'cognitive_support',
        confidence: 0.85,
        rationale: 'High cognitive load detected. Student may benefit from breaking complex tasks into smaller, manageable chunks.',
        suggestedActions: [
          {
            actionType: 'assignment_modification',
            description: 'Break assignment into smaller milestones',
            urgency: 'high',
            expectedDuration: '30 minutes'
          },
          {
            actionType: 'meeting_request',
            description: 'Schedule check-in to discuss cognitive strategies',
            urgency: 'medium', 
            expectedDuration: '15 minutes'
          }
        ],
        expectedOutcomes: ['Reduced cognitive overwhelm', 'Improved task completion', 'Better learning retention'],
        timeframe: 'immediate',
        evidenceData: {
          cognitiveLoadScore: analysisData.cognitiveLoad,
          strugglingDuration: analysisData.strugglingDuration || 0
        }
      });
    }

    // Analyze engagement and generate recommendations
    if (analysisData.engagementScore < 0.4) {
      recommendations.push({
        id: `rec_engagement_${Date.now()}`,
        type: 'engagement_boost',
        confidence: 0.75,
        rationale: 'Low engagement detected. Student may benefit from more interactive and choice-driven learning activities.',
        suggestedActions: [
          {
            actionType: 'content_suggestion',
            description: 'Provide choice in writing topics or formats',
            urgency: 'medium',
            expectedDuration: '20 minutes'
          },
          {
            actionType: 'notification',
            description: 'Send encouraging progress feedback',
            urgency: 'low',
            expectedDuration: '5 minutes'
          }
        ],
        expectedOutcomes: ['Increased motivation', 'Better participation', 'Enhanced creativity'],
        timeframe: 'short_term',
        evidenceData: {
          engagementScore: analysisData.engagementScore,
          timeOnTask: analysisData.timeOnTask || 0
        }
      });
    }

    // Analyze quality and generate recommendations
    if (analysisData.qualityScore < 0.5) {
      recommendations.push({
        id: `rec_quality_${Date.now()}`,
        type: 'quality_improvement',
        confidence: 0.8,
        rationale: 'Writing quality below expectations. Student would benefit from targeted feedback and exemplars.',
        suggestedActions: [
          {
            actionType: 'provide_feedback',
            description: 'Provide specific, actionable writing feedback',
            urgency: 'high',
            expectedDuration: '25 minutes'
          },
          {
            actionType: 'content_suggestion',
            description: 'Share quality examples and rubrics',
            urgency: 'medium',
            expectedDuration: '10 minutes'
          }
        ],
        expectedOutcomes: ['Improved writing quality', 'Better understanding of expectations', 'Enhanced self-assessment skills'],
        timeframe: 'medium_term',
        evidenceData: {
          qualityScore: analysisData.qualityScore,
          reflectionDepth: analysisData.reflectionDepth || 0
        }
      });
    }

    return {
      success: true,
      data: {
        studentId,
        assignmentId: educationalContext.assignmentId,
        recommendations,
        generatedAt: new Date().toISOString(),
        privacyProtected: true,
        auditTrail: {
          operation: 'generate_intervention_recommendations',
          requesterId: privacyContext.requesterId,
          timestamp: new Date().toISOString()
        }
      },
      message: `Generated ${recommendations.length} personalized intervention recommendations`
    };
  }

  private async sendEducatorAlerts(args: any): Promise<any> {
    const { alerts, deliveryOptions, privacyContext } = args;

    const sent = [];
    const queued = [];
    const failed = [];

    for (const alert of alerts) {
      try {
        // Privacy audit logging
        this.logPrivacyAudit('send_educator_alert', alert.studentId, privacyContext);

        // Check educator preferences (mock implementation)
        const shouldSendImmediately = this.shouldSendImmediate(alert, deliveryOptions);
        
        const processedAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...alert,
          status: shouldSendImmediately ? 'sent' : 'queued',
          createdAt: new Date().toISOString(),
          deliveryChannels: deliveryOptions.channels || ['in_app'],
          privacyProtected: true
        };

        if (shouldSendImmediately) {
          sent.push(processedAlert);
        } else {
          queued.push(processedAlert);
        }

      } catch (error) {
        failed.push({
          alert,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: true,
      data: {
        sent,
        queued,
        failed,
        summary: {
          totalAlerts: alerts.length,
          sentCount: sent.length,
          queuedCount: queued.length,
          failedCount: failed.length
        },
        deliveryOptions,
        timestamp: new Date().toISOString(),
        auditTrail: {
          operation: 'send_educator_alerts',
          requesterId: privacyContext.requesterId,
          alertCount: alerts.length,
          timestamp: new Date().toISOString()
        }
      },
      message: `Processed ${alerts.length} alerts: ${sent.length} sent, ${queued.length} queued, ${failed.length} failed`
    };
  }

  private async scheduleInterventionActions(args: any): Promise<any> {
    const { interventionId, scheduleData, reminderSettings, privacyContext } = args;

    // Privacy audit logging
    this.logPrivacyAudit('schedule_intervention_actions', scheduleData.studentId, privacyContext);

    const schedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      interventionId,
      ...scheduleData,
      status: 'scheduled',
      remindersSent: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacyProtected: true
    };

    // Process reminders
    const scheduledReminders = [];
    if (reminderSettings.sendReminders && reminderSettings.reminderTimes) {
      const scheduledTime = new Date(scheduleData.scheduledFor);
      
      for (const reminderTime of reminderSettings.reminderTimes) {
        const reminderDate = this.calculateReminderTime(scheduledTime, reminderTime);
        scheduledReminders.push({
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          scheduledFor: reminderDate.toISOString(),
          type: reminderTime,
          channels: reminderSettings.channels || ['in_app'],
          includePreparation: reminderSettings.includePreparation,
          status: 'scheduled'
        });
      }
    }

    return {
      success: true,
      data: {
        schedule,
        reminders: scheduledReminders,
        reminderSettings,
        metadata: {
          totalReminders: scheduledReminders.length,
          nextReminder: scheduledReminders.length > 0 ? scheduledReminders[0].scheduledFor : null,
          meetingDuration: `${scheduleData.duration} minutes`,
          privacyProtected: true
        },
        auditTrail: {
          operation: 'schedule_intervention_actions',
          requesterId: privacyContext.requesterId,
          interventionId,
          timestamp: new Date().toISOString()
        }
      },
      message: `Intervention scheduled successfully with ${scheduledReminders.length} reminders`
    };
  }

  private async trackInterventionEffectiveness(args: any): Promise<any> {
    const { interventionId, measurementData, comparisonPeriod, privacyContext } = args;

    // Privacy audit logging - use intervention ID as entity reference
    this.logPrivacyAudit('track_intervention_effectiveness', interventionId, privacyContext);

    // Calculate improvement scores
    const improvementAnalysis = this.calculateImprovementScores(
      measurementData.baselineData,
      measurementData.postInterventionData
    );

    const effectiveness = {
      id: `effectiveness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      interventionId,
      measurementType: measurementData.measurementType,
      metrics: measurementData.metrics,
      baselineData: measurementData.baselineData,
      postInterventionData: measurementData.postInterventionData,
      improvementScore: improvementAnalysis.overallImprovement,
      confidenceLevel: measurementData.confidenceLevel,
      measurementDate: new Date().toISOString(),
      notes: measurementData.notes,
      followUpRecommendations: measurementData.followUpRecommendations || [],
      privacyProtected: true,
      comparisonPeriod
    };

    // Generate effectiveness insights
    const insights = this.generateEffectivenessInsights(improvementAnalysis, measurementData);

    return {
      success: true,
      data: {
        effectiveness,
        analysis: improvementAnalysis,
        insights,
        recommendations: this.generateFollowUpRecommendations(improvementAnalysis),
        metadata: {
          measurementPeriod: {
            baseline: comparisonPeriod.baseline,
            measurement: comparisonPeriod.measurement
          },
          statisticalSignificance: improvementAnalysis.statisticalSignificance,
          privacyProtected: true
        },
        auditTrail: {
          operation: 'track_intervention_effectiveness',
          requesterId: privacyContext.requesterId,
          interventionId,
          timestamp: new Date().toISOString()
        }
      },
      message: `Intervention effectiveness tracked: ${improvementAnalysis.overallImprovement > 0 ? 'improvement' : 'decline'} of ${Math.abs(improvementAnalysis.overallImprovement * 100).toFixed(1)}%`
    };
  }

  // Helper Methods

  private logPrivacyAudit(operation: string, entityId: string, privacyContext: any): void {
    this.logger.info(`Privacy Audit: ${operation} for entity ${entityId} by ${privacyContext.requesterId} (${privacyContext.requesterType})`);
  }

  private shouldSendImmediate(alert: any, deliveryOptions: any): boolean {
    // Priority-based immediate sending
    if (deliveryOptions.immediate) return true;
    if (alert.severity === 'urgent' || alert.severity === 'critical') return true;
    
    // Mock quiet hours check (would integrate with real preferences)
    const now = new Date();
    const hour = now.getHours();
    if (hour < 7 || hour > 22) {
      return alert.severity === 'urgent' || alert.severity === 'critical';
    }
    
    return false;
  }

  private calculateReminderTime(scheduledTime: Date, reminderTime: string): Date {
    const timeMap: { [key: string]: number } = {
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000
    };

    const offset = timeMap[reminderTime] || timeMap['1h'];
    return new Date(scheduledTime.getTime() - offset);
  }

  private calculateImprovementScores(baseline: any, measurement: any): any {
    const improvements: { [key: string]: number } = {};
    let totalImprovement = 0;
    let metricCount = 0;

    // Calculate improvement for each metric
    for (const [key, baselineValue] of Object.entries(baseline)) {
      if (typeof baselineValue === 'number' && measurement[key] !== undefined) {
        const measurementValue = measurement[key] as number;
        const improvement = baselineValue > 0 ? (measurementValue - baselineValue) / baselineValue : 0;
        improvements[key] = improvement;
        totalImprovement += improvement;
        metricCount++;
      }
    }

    const overallImprovement = metricCount > 0 ? totalImprovement / metricCount : 0;
    const statisticalSignificance = Math.abs(overallImprovement) > 0.1 ? 'significant' : 'not_significant';

    return {
      improvements,
      overallImprovement,
      statisticalSignificance,
      metricCount
    };
  }

  private generateEffectivenessInsights(analysis: any, measurementData: any): string[] {
    const insights = [];

    if (analysis.overallImprovement > 0.2) {
      insights.push('Intervention showed strong positive impact with significant improvement across multiple metrics');
    } else if (analysis.overallImprovement > 0.05) {
      insights.push('Intervention showed moderate positive impact with measurable improvements');
    } else if (analysis.overallImprovement < -0.05) {
      insights.push('Intervention may need adjustment as some metrics showed decline');
    } else {
      insights.push('Intervention impact was minimal - consider alternative approaches');
    }

    if (analysis.metricCount > 3) {
      insights.push('Comprehensive measurement across multiple dimensions provides reliable effectiveness assessment');
    }

    if (measurementData.confidenceLevel > 0.8) {
      insights.push('High confidence level in measurements increases reliability of effectiveness assessment');
    }

    return insights;
  }

  private generateFollowUpRecommendations(analysis: any): string[] {
    const recommendations = [];

    if (analysis.overallImprovement > 0.1) {
      recommendations.push('Continue current intervention approach - showing positive results');
      recommendations.push('Consider scaling successful intervention strategies to other students');
    } else if (analysis.overallImprovement < 0) {
      recommendations.push('Review and adjust intervention strategy based on declining metrics');
      recommendations.push('Consider alternative intervention approaches');
      recommendations.push('Increase monitoring frequency to catch issues early');
    } else {
      recommendations.push('Monitor for longer period to establish clearer effectiveness trends');
      recommendations.push('Consider combining with additional intervention strategies');
    }

    return recommendations;
  }
}