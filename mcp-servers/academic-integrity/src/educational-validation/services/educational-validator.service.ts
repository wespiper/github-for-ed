import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';

interface EducationalValidationResult {
  isEducationallyValid: boolean;
  complianceScore: number;
  boundaryViolations: string[];
  educationalJustification: string;
  recommendations: string[];
  metadata?: Record<string, any>;
}

interface ValidationContext {
  assignmentType: string;
  learningObjectives: string[];
  studentProgress: {
    currentLevel: string;
    completedMilestones: string[];
  };
  aiUsageHistory: {
    totalInteractions: number;
    recentPatterns: string[];
  };
}

@Injectable()
export class EducationalValidatorService {
  private readonly logger = new Logger(EducationalValidatorService.name);

  // Educational boundaries based on assignment type and student progress
  private readonly educationalBoundaries = {
    reflection: {
      maxAIAssistance: 20,
      requiredStudentContribution: 80,
      allowedAIFeatures: ['grammar', 'clarity', 'structure_suggestions'],
      prohibitedAIFeatures: ['content_generation', 'idea_creation', 'critical_analysis']
    },
    research: {
      maxAIAssistance: 40,
      requiredStudentContribution: 60,
      allowedAIFeatures: ['source_finding', 'citation_formatting', 'organization'],
      prohibitedAIFeatures: ['argument_generation', 'thesis_creation']
    },
    creative_writing: {
      maxAIAssistance: 15,
      requiredStudentContribution: 85,
      allowedAIFeatures: ['spelling', 'basic_grammar'],
      prohibitedAIFeatures: ['plot_development', 'character_creation', 'creative_ideas']
    },
    analytical: {
      maxAIAssistance: 30,
      requiredStudentContribution: 70,
      allowedAIFeatures: ['data_visualization', 'calculation_verification'],
      prohibitedAIFeatures: ['analysis_generation', 'conclusion_drawing']
    }
  };

  async validateEducationalAIUse(
    documentId: string,
    context: ValidationContext,
    aiInteractions: any[]
  ): Promise<EducationalValidationResult> {
    try {
      // Hash document ID for privacy
      const hashedDocId = this.hashDocumentId(documentId);
      this.logger.log(`Validating educational AI use for document: ${hashedDocId.substring(0, 8)}...`);

      // Get boundaries for assignment type
      const boundaries = this.educationalBoundaries[context.assignmentType] || 
                        this.educationalBoundaries.analytical;

      // Analyze AI interactions
      const analysis = this.analyzeAIInteractions(aiInteractions, boundaries);
      
      // Check boundary violations
      const violations = this.checkBoundaryViolations(analysis, boundaries, context);
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(analysis, violations, context);
      
      // Generate educational justification
      const justification = this.generateEducationalJustification(
        analysis,
        violations,
        context,
        complianceScore
      );
      
      // Create recommendations
      const recommendations = this.generateRecommendations(
        violations,
        context,
        analysis
      );

      return {
        isEducationallyValid: violations.length === 0 && complianceScore >= 70,
        complianceScore,
        boundaryViolations: violations,
        educationalJustification: justification,
        recommendations,
        metadata: {
          assignmentType: context.assignmentType,
          studentLevel: context.studentProgress.currentLevel,
          totalAIInteractions: aiInteractions.length,
          analysisTimestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error validating educational AI use:', error);
      throw error;
    }
  }

  private analyzeAIInteractions(
    interactions: any[],
    boundaries: any
  ): any {
    const analysis = {
      totalAssistanceLevel: 0,
      featureUsage: new Map<string, number>(),
      prohibitedFeatureUse: [],
      studentContributionEstimate: 100,
      interactionPatterns: []
    };

    for (const interaction of interactions) {
      // Analyze assistance level
      if (interaction.assistanceLevel) {
        analysis.totalAssistanceLevel += interaction.assistanceLevel;
      }

      // Track feature usage
      if (interaction.feature) {
        const count = analysis.featureUsage.get(interaction.feature) || 0;
        analysis.featureUsage.set(interaction.feature, count + 1);

        // Check for prohibited features
        if (boundaries.prohibitedAIFeatures.includes(interaction.feature)) {
          analysis.prohibitedFeatureUse.push({
            feature: interaction.feature,
            timestamp: interaction.timestamp,
            impact: interaction.impact || 'high'
          });
        }
      }

      // Estimate student contribution reduction
      if (interaction.contentGenerated) {
        analysis.studentContributionEstimate -= (interaction.contentGenerated * 0.5);
      }
    }

    // Ensure contribution doesn't go below 0
    analysis.studentContributionEstimate = Math.max(0, analysis.studentContributionEstimate);

    return analysis;
  }

  private checkBoundaryViolations(
    analysis: any,
    boundaries: any,
    context: ValidationContext
  ): string[] {
    const violations = [];

    // Check AI assistance level
    if (analysis.totalAssistanceLevel > boundaries.maxAIAssistance) {
      violations.push(
        `AI assistance level (${analysis.totalAssistanceLevel}%) exceeds maximum allowed (${boundaries.maxAIAssistance}%) for ${context.assignmentType} assignments`
      );
    }

    // Check student contribution
    if (analysis.studentContributionEstimate < boundaries.requiredStudentContribution) {
      violations.push(
        `Student contribution (${analysis.studentContributionEstimate}%) below required minimum (${boundaries.requiredStudentContribution}%)`
      );
    }

    // Check prohibited feature use
    if (analysis.prohibitedFeatureUse.length > 0) {
      const features = analysis.prohibitedFeatureUse.map(f => f.feature).join(', ');
      violations.push(
        `Used prohibited AI features for ${context.assignmentType}: ${features}`
      );
    }

    // Check progressive learning violations
    if (context.studentProgress.currentLevel === 'beginner' && 
        analysis.totalAssistanceLevel > boundaries.maxAIAssistance * 0.5) {
      violations.push(
        'Excessive AI use for beginner level - may hinder skill development'
      );
    }

    return violations;
  }

  private calculateComplianceScore(
    analysis: any,
    violations: string[],
    context: ValidationContext
  ): number {
    let score = 100;

    // Deduct for violations
    score -= violations.length * 15;

    // Deduct for prohibited feature use
    score -= analysis.prohibitedFeatureUse.length * 10;

    // Bonus for appropriate feature use
    const appropriateFeatures = Array.from(analysis.featureUsage.keys())
      .filter(feature => !analysis.prohibitedFeatureUse.some(p => p.feature === feature));
    score += Math.min(appropriateFeatures.length * 2, 10);

    // Adjust based on student level
    if (context.studentProgress.currentLevel === 'advanced' && violations.length === 0) {
      score += 5; // Bonus for advanced students maintaining boundaries
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateEducationalJustification(
    analysis: any,
    violations: string[],
    context: ValidationContext,
    complianceScore: number
  ): string {
    const parts = [];

    if (complianceScore >= 70 && violations.length === 0) {
      parts.push('AI usage aligns with educational objectives.');
      parts.push(`Student maintained ${analysis.studentContributionEstimate}% original contribution.`);
      parts.push('Appropriate balance between assistance and independent work.');
    } else {
      parts.push('AI usage raises educational concerns.');
      if (violations.length > 0) {
        parts.push(`Found ${violations.length} boundary violations.`);
      }
      parts.push('Current usage pattern may hinder learning objectives.');
    }

    // Add context-specific justification
    if (context.assignmentType === 'reflection' && analysis.totalAssistanceLevel > 10) {
      parts.push('Reflective writing requires high personal authenticity.');
    }

    return parts.join(' ');
  }

  private generateRecommendations(
    violations: string[],
    context: ValidationContext,
    analysis: any
  ): string[] {
    const recommendations = [];

    // Violation-specific recommendations
    if (violations.some(v => v.includes('AI assistance level'))) {
      recommendations.push('Reduce reliance on AI suggestions and develop independent writing skills');
    }

    if (violations.some(v => v.includes('prohibited AI features'))) {
      recommendations.push('Focus on using AI for permitted support features only (grammar, spelling, structure)');
    }

    // Progress-based recommendations
    if (context.studentProgress.currentLevel === 'beginner') {
      recommendations.push('Practice writing initial drafts without AI assistance to build fundamental skills');
    }

    // Feature usage recommendations
    if (analysis.featureUsage.size === 0) {
      recommendations.push('Consider using AI for basic proofreading and structure improvements where appropriate');
    }

    // Assignment-specific recommendations
    if (context.assignmentType === 'research') {
      recommendations.push('Use AI for source organization, but develop your own arguments and analysis');
    }

    return recommendations;
  }

  private hashDocumentId(documentId: string): string {
    return createHash('sha256').update(documentId).digest('hex');
  }
}