import { Injectable, Logger } from '@nestjs/common';
import { PrivacyContext, InterventionContext } from '../privacy/privacy.types';
import { PRIVACY_THRESHOLDS } from '../privacy/privacy.config';

@Injectable()
export class InterventionEngineService {
  private readonly logger = new Logger(InterventionEngineService.name);

  async predictNeeds(
    anonymizedMetrics: any,
    educationalGoals: string[],
    interventionHistory: any,
    privacyContext: PrivacyContext
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Analyze patterns without individual identification
      const interventionNeeds = this.analyzeInterventionNeeds(anonymizedMetrics, educationalGoals);
      
      // Generate privacy-safe recommendations
      const recommendations = this.generatePrivacySafeRecommendations(
        interventionNeeds,
        interventionHistory,
        privacyContext
      );
      
      // Create intervention context
      const interventionContext = this.createInterventionContext(interventionNeeds);
      
      const processingTime = Date.now() - startTime;
      
      return {
        interventionRecommended: interventionNeeds.urgency !== 'low',
        urgencyLevel: interventionNeeds.urgency,
        interventionType: interventionNeeds.type,
        recommendations: recommendations,
        educationalRationale: interventionNeeds.rationale,
        privacyCompliant: true,
        consentRequired: interventionContext.consentRequired,
        processingTimeMs: processingTime,
        metadata: {
          anonymizedTriggers: interventionNeeds.triggers,
          confidenceScore: interventionNeeds.confidence,
          educationalBenefit: interventionNeeds.educationalBenefit
        }
      };
      
    } catch (error) {
      this.logger.error('Error predicting intervention needs:', error);
      throw new Error('Intervention analysis temporarily unavailable');
    }
  }

  private analyzeInterventionNeeds(metrics: any, goals: string[]): any {
    const needs = {
      urgency: 'low' as 'low' | 'medium' | 'high',
      type: 'engagement' as 'cognitive_load' | 'engagement' | 'struggle' | 'success',
      confidence: 0.5,
      triggers: [] as string[],
      rationale: '',
      educationalBenefit: ''
    };

    // Analyze cognitive load indicators
    if (metrics.cognitiveLoad && metrics.cognitiveLoad > PRIVACY_THRESHOLDS.HIGH_COGNITIVE_LOAD) {
      needs.urgency = 'high';
      needs.type = 'cognitive_load';
      needs.confidence = Math.min(metrics.cognitiveLoad, 0.95);
      needs.triggers.push('elevated_cognitive_load');
      needs.rationale = 'Student may benefit from cognitive load management strategies';
      needs.educationalBenefit = 'Optimize learning efficiency and reduce cognitive strain';
    }

    // Analyze engagement indicators
    if (metrics.engagement && metrics.engagement < 0.4) {
      if (needs.urgency === 'low') {
        needs.urgency = 'medium';
        needs.type = 'engagement';
      }
      needs.triggers.push('low_engagement');
      needs.rationale += (needs.rationale ? '; ' : '') + 'Engagement support may enhance learning outcomes';
      needs.educationalBenefit += (needs.educationalBenefit ? '; ' : '') + 'Increase active participation and interest';
    }

    // Analyze struggle indicators
    if (metrics.struggleIndicators && metrics.struggleIndicators > 0.6) {
      if (needs.urgency === 'low') {
        needs.urgency = 'medium';
      }
      needs.type = 'struggle';
      needs.triggers.push('learning_difficulty_patterns');
      needs.rationale += (needs.rationale ? '; ' : '') + 'Additional scaffolding may support learning progress';
      needs.educationalBenefit += (needs.educationalBenefit ? '; ' : '') + 'Provide targeted support for skill development';
    }

    // Analyze success indicators (positive interventions)
    if (metrics.successIndicators && metrics.successIndicators > 0.8) {
      needs.type = 'success';
      needs.triggers.push('high_performance_patterns');
      needs.rationale = 'Student demonstrates readiness for advanced challenges';
      needs.educationalBenefit = 'Accelerate learning through increased complexity';
    }

    // Adjust confidence based on data quality
    if (metrics.dataQuality) {
      needs.confidence *= metrics.dataQuality;
    }

    return needs;
  }

  private generatePrivacySafeRecommendations(
    needs: any,
    history: any,
    privacyContext: PrivacyContext
  ): string[] {
    const recommendations: string[] = [];

    // Type-specific recommendations
    switch (needs.type) {
      case 'cognitive_load':
        recommendations.push('Consider breaking complex tasks into smaller components');
        recommendations.push('Implement structured breaks during extended work sessions');
        recommendations.push('Provide additional scaffolding for challenging concepts');
        if (privacyContext.requesterRole === 'teacher') {
          recommendations.push('Monitor for signs of cognitive overload during instruction');
        }
        break;

      case 'engagement':
        recommendations.push('Introduce variety in task presentation and interaction');
        recommendations.push('Connect learning objectives to student interests when possible');
        recommendations.push('Implement peer collaboration opportunities');
        if (needs.urgency === 'high') {
          recommendations.push('Consider immediate check-in to re-engage student');
        }
        break;

      case 'struggle':
        recommendations.push('Provide additional examples and practice opportunities');
        recommendations.push('Consider one-on-one support or tutoring');
        recommendations.push('Review prerequisite skills that may need reinforcement');
        recommendations.push('Implement peer support or study group opportunities');
        break;

      case 'success':
        recommendations.push('Provide enrichment activities to extend learning');
        recommendations.push('Consider advanced or accelerated content');
        recommendations.push('Offer leadership opportunities within peer groups');
        recommendations.push('Explore deeper applications of current concepts');
        break;
    }

    // Role-specific recommendations
    if (privacyContext.requesterRole === 'teacher') {
      recommendations.push('Document intervention strategies for future reference');
      if (needs.urgency === 'high') {
        recommendations.push('Consider immediate classroom adjustment or individual support');
      }
    } else if (privacyContext.requesterRole === 'student') {
      recommendations.push('Reach out to teacher or support resources when needed');
      recommendations.push('Practice self-regulation strategies during challenging tasks');
    }

    // Privacy-aware recommendations
    if (privacyContext.consentLevel === 'basic') {
      recommendations.push('All monitoring and support respects your privacy preferences');
    }

    return recommendations;
  }

  private createInterventionContext(needs: any): InterventionContext {
    return {
      urgency: needs.urgency,
      type: needs.type,
      anonymizedTriggers: needs.triggers,
      suggestedActions: this.generateActionPlan(needs),
      consentRequired: needs.urgency === 'high' && needs.type !== 'success'
    };
  }

  private generateActionPlan(needs: any): string[] {
    const actions: string[] = [];

    // Immediate actions based on urgency
    if (needs.urgency === 'high') {
      actions.push('immediate_assessment');
      actions.push('direct_support_contact');
    } else if (needs.urgency === 'medium') {
      actions.push('scheduled_check_in');
      actions.push('resource_provision');
    } else {
      actions.push('continued_monitoring');
      actions.push('preventive_support');
    }

    // Type-specific actions
    switch (needs.type) {
      case 'cognitive_load':
        actions.push('cognitive_load_management');
        actions.push('task_modification');
        break;
      case 'engagement':
        actions.push('engagement_strategy');
        actions.push('interest_alignment');
        break;
      case 'struggle':
        actions.push('skill_assessment');
        actions.push('targeted_instruction');
        break;
      case 'success':
        actions.push('enrichment_opportunity');
        actions.push('advanced_challenge');
        break;
    }

    return actions;
  }

  // Utility method for intervention effectiveness tracking
  async trackInterventionEffectiveness(
    interventionId: string,
    outcomeMetrics: any,
    privacyContext: PrivacyContext
  ): Promise<any> {
    try {
      // Track effectiveness without individual identification
      const effectiveness = {
        interventionId,
        outcomeImprovement: this.calculateImprovement(outcomeMetrics),
        educationalBenefit: this.assessEducationalBenefit(outcomeMetrics),
        privacyMaintained: true,
        timestamp: new Date()
      };

      this.logger.log(`Intervention effectiveness tracked: ${effectiveness.outcomeImprovement}% improvement`);

      return effectiveness;
      
    } catch (error) {
      this.logger.error('Error tracking intervention effectiveness:', error);
      return null;
    }
  }

  private calculateImprovement(metrics: any): number {
    // Calculate improvement without individual identification
    const baseline = metrics.baseline || 0.5;
    const current = metrics.current || 0.5;
    
    return Math.round(((current - baseline) / baseline) * 100);
  }

  private assessEducationalBenefit(metrics: any): string {
    const improvement = this.calculateImprovement(metrics);
    
    if (improvement > 20) {
      return 'significant_benefit';
    } else if (improvement > 10) {
      return 'moderate_benefit';
    } else if (improvement > 0) {
      return 'slight_benefit';
    } else {
      return 'no_significant_benefit';
    }
  }
}