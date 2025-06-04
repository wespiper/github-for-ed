import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';

interface IntegrityReport {
  reportId: string;
  generatedAt: Date;
  summary: {
    overallIntegrityScore: number;
    aiAssistanceLevel: string;
    majorFindings: string[];
    recommendations: string[];
  };
  detailedAnalysis: {
    contentAuthenticity: {
      score: number;
      indicators: string[];
    };
    aiUsagePatterns: {
      appropriateUse: string[];
      concerningUse: string[];
    };
    educationalAlignment: {
      alignmentScore: number;
      learningObjectivesMet: string[];
      areasForImprovement: string[];
    };
  };
  privacyProtected: boolean;
  metadata?: Record<string, any>;
}

interface ReportGenerationOptions {
  includeDetailedAnalysis: boolean;
  format: 'summary' | 'detailed' | 'educator' | 'student';
  timeRange?: {
    start: Date;
    end: Date;
  };
  focusAreas?: string[];
}

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  async generateIntegrityReport(
    documentId: string,
    analysisResults: any,
    options: ReportGenerationOptions
  ): Promise<IntegrityReport> {
    try {
      // Hash document ID for privacy
      const hashedDocId = this.hashDocumentId(documentId);
      this.logger.log(`Generating integrity report for document: ${hashedDocId.substring(0, 8)}...`);

      // Generate report ID
      const reportId = this.generateReportId(hashedDocId);

      // Build summary based on analysis results
      const summary = this.buildReportSummary(analysisResults, options);

      // Build detailed analysis if requested
      const detailedAnalysis = options.includeDetailedAnalysis
        ? this.buildDetailedAnalysis(analysisResults, options)
        : null;

      // Apply format-specific transformations
      const formattedReport = this.formatReport(summary, detailedAnalysis, options.format);

      return {
        reportId,
        generatedAt: new Date(),
        summary: formattedReport.summary,
        detailedAnalysis: formattedReport.detailedAnalysis || this.getDefaultDetailedAnalysis(),
        privacyProtected: true,
        metadata: {
          format: options.format,
          documentIdHash: hashedDocId.substring(0, 16),
          generationOptions: {
            includeDetailedAnalysis: options.includeDetailedAnalysis,
            focusAreas: options.focusAreas || []
          }
        }
      };
    } catch (error) {
      this.logger.error('Error generating integrity report:', error);
      throw error;
    }
  }

  private buildReportSummary(analysisResults: any, options: ReportGenerationOptions): any {
    const summary = {
      overallIntegrityScore: this.calculateOverallScore(analysisResults),
      aiAssistanceLevel: this.determineAIAssistanceLevel(analysisResults),
      majorFindings: this.extractMajorFindings(analysisResults, options),
      recommendations: this.generateRecommendations(analysisResults, options)
    };

    return summary;
  }

  private calculateOverallScore(analysisResults: any): number {
    let score = 100;

    // Deduct for AI detection confidence
    if (analysisResults.aiDetection) {
      score -= (analysisResults.aiDetection.confidence * 0.5);
    }

    // Deduct for integrity violations
    if (analysisResults.integrityAnalysis?.violations) {
      score -= (analysisResults.integrityAnalysis.violations.length * 10);
    }

    // Bonus for educational compliance
    if (analysisResults.educationalValidation?.complianceScore) {
      score = (score * 0.7) + (analysisResults.educationalValidation.complianceScore * 0.3);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineAIAssistanceLevel(analysisResults: any): string {
    const aiLevel = analysisResults.aiDetection?.overallAIAssistance || 0;

    if (aiLevel < 20) return 'Minimal';
    if (aiLevel < 40) return 'Low';
    if (aiLevel < 60) return 'Moderate';
    if (aiLevel < 80) return 'High';
    return 'Extensive';
  }

  private extractMajorFindings(analysisResults: any, options: ReportGenerationOptions): string[] {
    const findings = [];

    // AI detection findings
    if (analysisResults.aiDetection?.detectedPatterns?.length > 0) {
      findings.push(`Detected ${analysisResults.aiDetection.detectedPatterns.length} AI-assisted sections`);
    }

    // Integrity findings
    if (analysisResults.integrityAnalysis?.authenticityScore < 70) {
      findings.push('Content authenticity below acceptable threshold');
    }

    // Educational compliance findings
    if (analysisResults.educationalValidation?.boundaryViolations?.length > 0) {
      findings.push(`${analysisResults.educationalValidation.boundaryViolations.length} educational boundary violations detected`);
    }

    // Time-based findings if applicable
    if (options.timeRange && analysisResults.temporalAnalysis) {
      const rapidChanges = analysisResults.temporalAnalysis.rapidContentChanges || 0;
      if (rapidChanges > 5) {
        findings.push(`${rapidChanges} instances of unusually rapid content generation`);
      }
    }

    // Focus area specific findings
    if (options.focusAreas?.includes('collaboration') && analysisResults.collaborationAnalysis) {
      if (analysisResults.collaborationAnalysis.unauthorizedSharing) {
        findings.push('Evidence of unauthorized content sharing detected');
      }
    }

    return findings;
  }

  private generateRecommendations(analysisResults: any, options: ReportGenerationOptions): string[] {
    const recommendations = [];

    // Format-specific recommendations
    switch (options.format) {
      case 'educator':
        recommendations.push(...this.getEducatorRecommendations(analysisResults));
        break;
      case 'student':
        recommendations.push(...this.getStudentRecommendations(analysisResults));
        break;
      default:
        recommendations.push(...this.getGeneralRecommendations(analysisResults));
    }

    return recommendations;
  }

  private getEducatorRecommendations(analysisResults: any): string[] {
    const recommendations = [];

    if (analysisResults.aiDetection?.confidence > 70) {
      recommendations.push('Schedule a discussion with student about appropriate AI use');
      recommendations.push('Review assignment instructions for clarity on AI boundaries');
    }

    if (analysisResults.integrityAnalysis?.suggestedInterventions) {
      recommendations.push(...analysisResults.integrityAnalysis.suggestedInterventions);
    }

    if (analysisResults.educationalValidation?.complianceScore < 70) {
      recommendations.push('Consider adjusting AI access levels for this assignment type');
    }

    return recommendations;
  }

  private getStudentRecommendations(analysisResults: any): string[] {
    const recommendations = [];

    if (analysisResults.aiDetection?.overallAIAssistance > 40) {
      recommendations.push('Try drafting your next assignment with less AI assistance to strengthen your skills');
    }

    if (analysisResults.educationalValidation?.recommendations) {
      recommendations.push(...analysisResults.educationalValidation.recommendations);
    }

    recommendations.push('Review the course guidelines on appropriate AI use');

    return recommendations;
  }

  private getGeneralRecommendations(analysisResults: any): string[] {
    const recommendations = [];

    recommendations.push('Maintain transparency about AI tool usage');
    recommendations.push('Focus on using AI for learning enhancement, not content replacement');
    
    if (analysisResults.overallScore < 70) {
      recommendations.push('Review and strengthen academic integrity practices');
    }

    return recommendations;
  }

  private buildDetailedAnalysis(analysisResults: any, options: ReportGenerationOptions): any {
    return {
      contentAuthenticity: {
        score: analysisResults.integrityAnalysis?.authenticityScore || 0,
        indicators: this.extractAuthenticityIndicators(analysisResults)
      },
      aiUsagePatterns: {
        appropriateUse: this.extractAppropriateAIUse(analysisResults),
        concerningUse: this.extractConcerningAIUse(analysisResults)
      },
      educationalAlignment: {
        alignmentScore: analysisResults.educationalValidation?.complianceScore || 0,
        learningObjectivesMet: this.extractMetObjectives(analysisResults),
        areasForImprovement: this.extractImprovementAreas(analysisResults)
      }
    };
  }

  private extractAuthenticityIndicators(analysisResults: any): string[] {
    const indicators = [];

    if (analysisResults.integrityAnalysis?.writingConsistency > 80) {
      indicators.push('Consistent writing style throughout');
    }

    if (analysisResults.integrityAnalysis?.personalVoiceScore > 70) {
      indicators.push('Strong personal voice maintained');
    }

    if (analysisResults.aiDetection?.humanWrittenSections > 60) {
      indicators.push('Majority of content appears human-written');
    }

    return indicators;
  }

  private extractAppropriateAIUse(analysisResults: any): string[] {
    const appropriate = [];

    if (analysisResults.aiDetection?.detectedPatterns) {
      const allowedPatterns = analysisResults.aiDetection.detectedPatterns
        .filter(p => p.category === 'grammar' || p.category === 'spelling');
      
      if (allowedPatterns.length > 0) {
        appropriate.push('AI used appropriately for grammar and spelling assistance');
      }
    }

    if (analysisResults.educationalValidation?.appropriateFeatures) {
      appropriate.push(...analysisResults.educationalValidation.appropriateFeatures);
    }

    return appropriate;
  }

  private extractConcerningAIUse(analysisResults: any): string[] {
    const concerning = [];

    if (analysisResults.aiDetection?.detectedPatterns) {
      const concerningPatterns = analysisResults.aiDetection.detectedPatterns
        .filter(p => p.category === 'content_generation' || p.category === 'idea_creation');
      
      if (concerningPatterns.length > 0) {
        concerning.push('AI may have been used for content generation');
      }
    }

    if (analysisResults.educationalValidation?.boundaryViolations) {
      concerning.push(...analysisResults.educationalValidation.boundaryViolations);
    }

    return concerning;
  }

  private extractMetObjectives(analysisResults: any): string[] {
    return analysisResults.educationalValidation?.learningObjectivesMet || [
      'Basic writing competency demonstrated',
      'Assignment requirements addressed'
    ];
  }

  private extractImprovementAreas(analysisResults: any): string[] {
    const areas = [];

    if (analysisResults.integrityAnalysis?.weakAreas) {
      areas.push(...analysisResults.integrityAnalysis.weakAreas);
    }

    if (analysisResults.educationalValidation?.improvementSuggestions) {
      areas.push(...analysisResults.educationalValidation.improvementSuggestions);
    }

    return areas.length > 0 ? areas : ['Continue developing independent writing skills'];
  }

  private formatReport(summary: any, detailedAnalysis: any, format: string): any {
    // Apply format-specific transformations
    switch (format) {
      case 'student':
        // Student-friendly language and focus on improvement
        return {
          summary: {
            ...summary,
            overallIntegrityScore: this.convertScoreToGrade(summary.overallIntegrityScore),
            majorFindings: summary.majorFindings.map(f => this.studentFriendlyFinding(f))
          },
          detailedAnalysis
        };
      
      case 'educator':
        // Detailed pedagogical insights
        return {
          summary: {
            ...summary,
            pedagogicalInsights: this.generatePedagogicalInsights(summary, detailedAnalysis)
          },
          detailedAnalysis
        };
      
      default:
        return { summary, detailedAnalysis };
    }
  }

  private convertScoreToGrade(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 60) return 'Needs Improvement';
    return 'Requires Attention';
  }

  private studentFriendlyFinding(finding: string): string {
    // Convert technical findings to student-friendly language
    return finding
      .replace('AI-assisted sections', 'areas where you used AI help')
      .replace('authenticity below acceptable threshold', 'more of your own voice needed')
      .replace('boundary violations detected', 'opportunities to work more independently');
  }

  private generatePedagogicalInsights(summary: any, detailedAnalysis: any): string[] {
    const insights = [];

    if (summary.aiAssistanceLevel === 'High' || summary.aiAssistanceLevel === 'Extensive') {
      insights.push('Student may benefit from scaffolded writing exercises without AI');
    }

    if (summary.overallIntegrityScore < 70) {
      insights.push('Consider reviewing academic integrity expectations with the class');
    }

    return insights;
  }

  private getDefaultDetailedAnalysis(): any {
    return {
      contentAuthenticity: {
        score: 0,
        indicators: []
      },
      aiUsagePatterns: {
        appropriateUse: [],
        concerningUse: []
      },
      educationalAlignment: {
        alignmentScore: 0,
        learningObjectivesMet: [],
        areasForImprovement: []
      }
    };
  }

  private generateReportId(hashedDocId: string): string {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `IR-${hashedDocId.substring(0, 8)}-${timestamp}-${randomPart}`;
  }

  private hashDocumentId(documentId: string): string {
    return createHash('sha256').update(documentId).digest('hex');
  }
}