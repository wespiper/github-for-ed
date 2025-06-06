import { Injectable, Logger } from '@nestjs/common';
import { PrivacyContext, CognitiveEvent, AnonymizedPattern, InterventionContext } from '../privacy/privacy.types';
import { ConsentManagerService } from '../privacy/consent-manager.service';
import { CognitiveLoadDetectorService } from '../algorithms/cognitive-load-detector.service';
import { PatternAnalyzerService } from '../algorithms/pattern-analyzer.service';
import { InterventionEngineService } from '../interventions/intervention-engine.service';
import { PrivacyAnalyticsService } from '../analytics/privacy-analytics.service';

@Injectable()
export class MCPToolsController {
  private readonly logger = new Logger(MCPToolsController.name);

  constructor(
    private readonly consentManager: ConsentManagerService,
    private readonly cognitiveDetector: CognitiveLoadDetectorService,
    private readonly patternAnalyzer: PatternAnalyzerService,
    private readonly interventionEngine: InterventionEngineService,
    private readonly privacyAnalytics: PrivacyAnalyticsService,
  ) {}

  async getTools() {
    return [
      {
        name: 'detect_cognitive_overload_advanced',
        description: 'Advanced real-time cognitive load detection with privacy-preserving behavioral analysis (response time <40ms)',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Anonymous session identifier' },
            behavioralEvents: { 
              type: 'array', 
              items: { type: 'object' },
              description: 'Anonymized behavioral events (keystroke patterns, pauses, focus changes)' 
            },
            educationalContext: { type: 'string', description: 'Context: essay_writing, creative_writing, research_paper, etc.' },
            privacyContext: { type: 'object', description: 'Privacy and consent context' }
          },
          required: ['sessionId', 'behavioralEvents', 'educationalContext', 'privacyContext']
        }
      },
      {
        name: 'analyze_learning_patterns_ai',
        description: 'AI-powered learning pattern analysis with differential privacy and k-anonymity protection',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: { type: 'string', enum: ['session', 'day', 'week'], description: 'Analysis timeframe' },
            cohortContext: { type: 'string', description: 'Classroom or assignment context for anonymized analysis' },
            privacyLevel: { type: 'string', enum: ['anonymized', 'aggregated', 'statistical'], description: 'Level of privacy protection' },
            privacyContext: { type: 'object', description: 'Privacy and consent validation' }
          },
          required: ['timeframe', 'cohortContext', 'privacyLevel', 'privacyContext']
        }
      },
      {
        name: 'predict_intervention_needs',
        description: 'Predictive intervention analysis using anonymized patterns without individual tracking',
        inputSchema: {
          type: 'object',
          properties: {
            anonymizedMetrics: { type: 'object', description: 'Anonymized learning and engagement metrics' },
            educationalGoals: { type: 'array', items: { type: 'string' }, description: 'Educational objectives for context' },
            interventionHistory: { type: 'object', description: 'Aggregated intervention effectiveness data' },
            privacyContext: { type: 'object', description: 'Privacy and consent requirements' }
          },
          required: ['anonymizedMetrics', 'educationalGoals', 'privacyContext']
        }
      },
      {
        name: 'generate_personalized_insights',
        description: 'Generate privacy-safe personalized insights using differential privacy and consent validation',
        inputSchema: {
          type: 'object',
          properties: {
            learningProfile: { type: 'object', description: 'Anonymized learning preferences and patterns' },
            performanceMetrics: { type: 'object', description: 'Aggregated performance data (no individual scores)' },
            consentPreferences: { type: 'object', description: 'Granular privacy and sharing preferences' },
            privacyContext: { type: 'object', description: 'Privacy validation context' }
          },
          required: ['learningProfile', 'consentPreferences', 'privacyContext']
        }
      },
      {
        name: 'monitor_engagement_metrics',
        description: 'Real-time engagement monitoring with ephemeral data processing and automatic privacy safeguards',
        inputSchema: {
          type: 'object',
          properties: {
            sessionData: { type: 'object', description: 'Ephemeral session engagement data (auto-expiring)' },
            baselineMetrics: { type: 'object', description: 'Anonymized baseline engagement patterns' },
            alertThresholds: { type: 'object', description: 'Privacy-safe alerting thresholds' },
            privacyContext: { type: 'object', description: 'Real-time consent and privacy validation' }
          },
          required: ['sessionData', 'alertThresholds', 'privacyContext']
        }
      }
    ];
  }

  async executeTool(name: string, args: any) {
    const startTime = Date.now();
    
    try {
      // Validate privacy context for all operations
      const privacyContext = args.privacyContext as PrivacyContext;
      const hasConsent = await this.consentManager.validateConsent(privacyContext);
      
      if (!hasConsent) {
        throw new Error('Educational monitoring requires updated consent preferences');
      }

      let result;
      
      switch (name) {
        case 'detect_cognitive_overload_advanced':
          result = await this.detectCognitiveOverload(args);
          break;
          
        case 'analyze_learning_patterns_ai':
          result = await this.analyzeLearningPatterns(args);
          break;
          
        case 'predict_intervention_needs':
          result = await this.predictInterventionNeeds(args);
          break;
          
        case 'generate_personalized_insights':
          result = await this.generatePersonalizedInsights(args);
          break;
          
        case 'monitor_engagement_metrics':
          result = await this.monitorEngagementMetrics(args);
          break;
          
        default:
          throw new Error(`Unknown cognitive monitoring tool: ${name}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Cognitive monitoring tool ${name} completed in ${processingTime}ms`);

      // Ensure processing time meets performance requirements
      if (processingTime > 50) {
        this.logger.warn(`Cognitive monitoring tool ${name} exceeded target response time: ${processingTime}ms`);
      }

      return {
        ...result,
        metadata: {
          processingTimeMs: processingTime,
          privacyCompliant: true,
          consentValidated: true,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Error in cognitive monitoring tool ${name} (${processingTime}ms):`, error);
      
      // Return privacy-safe error message
      return {
        error: error.message,
        privacySafe: true,
        processingTimeMs: processingTime
      };
    }
  }

  private async detectCognitiveOverload(args: any) {
    const { sessionId, behavioralEvents, educationalContext, privacyContext } = args;
    
    // Convert to privacy-safe cognitive events
    const cognitiveEvents: CognitiveEvent[] = behavioralEvents.map((event: any) => ({
      eventType: event.type,
      timestamp: event.timestamp,
      sessionId: sessionId,
      anonymizedMetrics: {
        duration: event.duration,
        frequency: event.frequency,
        pattern: event.pattern
      }
    }));

    return await this.cognitiveDetector.detectOverload(
      cognitiveEvents,
      educationalContext,
      privacyContext
    );
  }

  private async analyzeLearningPatterns(args: any) {
    const { timeframe, cohortContext, privacyLevel, privacyContext } = args;
    
    return await this.patternAnalyzer.analyzePatterns(
      timeframe,
      cohortContext,
      privacyLevel,
      privacyContext
    );
  }

  private async predictInterventionNeeds(args: any) {
    const { anonymizedMetrics, educationalGoals, interventionHistory, privacyContext } = args;
    
    return await this.interventionEngine.predictNeeds(
      anonymizedMetrics,
      educationalGoals,
      interventionHistory,
      privacyContext
    );
  }

  private async generatePersonalizedInsights(args: any) {
    const { learningProfile, performanceMetrics, consentPreferences, privacyContext } = args;
    
    return await this.privacyAnalytics.generateInsights(
      learningProfile,
      performanceMetrics,
      consentPreferences,
      privacyContext
    );
  }

  private async monitorEngagementMetrics(args: any) {
    const { sessionData, baselineMetrics, alertThresholds, privacyContext } = args;
    
    return await this.privacyAnalytics.monitorEngagement(
      sessionData,
      baselineMetrics,
      alertThresholds,
      privacyContext
    );
  }
}