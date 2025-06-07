import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface PurposeValidationRequest {
  purpose: string;
  requestedData: string[];
  requesterRole: 'student' | 'educator' | 'administrator' | 'researcher';
  targetUsers?: string[];
}

export interface PurposeValidationResult {
  valid: boolean;
  score: number;
  approvalRequired: boolean;
  justification: {
    educationalBenefit: number;
    platformImprovement: number;
    studentBenefit: number;
    researchValue: number;
  };
  recommendations: string[];
  requiredApprovers?: string[];
}

@Injectable()
export class PurposeValidatorService {
  private readonly logger = new Logger(PurposeValidatorService.name);

  // Educational purpose keywords and weights
  private readonly purposeKeywords = {
    educational: {
      keywords: ['learning', 'teaching', 'education', 'pedagogy', 'instruction', 'curriculum'],
      weight: 0.3,
    },
    assessment: {
      keywords: ['assessment', 'evaluation', 'grading', 'feedback', 'progress', 'performance'],
      weight: 0.25,
    },
    improvement: {
      keywords: ['improve', 'enhance', 'develop', 'growth', 'advancement', 'optimization'],
      weight: 0.2,
    },
    support: {
      keywords: ['support', 'help', 'assist', 'guide', 'intervention', 'coaching'],
      weight: 0.15,
    },
    research: {
      keywords: ['research', 'study', 'analysis', 'investigation', 'examine', 'explore'],
      weight: 0.1,
    },
  };

  // Data sensitivity levels
  private readonly dataSensitivity: Record<string, number> = {
    reflection: 0.9,
    personal_notes: 0.9,
    writing_content: 0.7,
    progress_metrics: 0.5,
    aggregated_analytics: 0.3,
    course_data: 0.2,
  };

  constructor(
    private eventEmitter: EventEmitter2,
  ) {}

  async validatePurpose(request: PurposeValidationRequest): Promise<PurposeValidationResult> {
    this.logger.log(`Validating purpose: ${request.purpose}`);

    // Calculate justification scores
    const justification = this.calculateJustificationScores(request);
    
    // Calculate overall score
    const score = this.calculateOverallScore(justification, request);
    
    // Determine if valid
    const valid = score >= 0.8; // 80% threshold
    
    // Check if approval is required
    const approvalRequired = this.checkApprovalRequirement(request, score);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(request, justification, valid);
    
    // Determine required approvers if needed
    const requiredApprovers = approvalRequired 
      ? this.determineRequiredApprovers(request) 
      : undefined;

    // Emit validation event
    await this.eventEmitter.emit('purpose.validated', {
      purpose: request.purpose,
      valid,
      score,
      requesterRole: request.requesterRole,
      timestamp: new Date(),
    });

    return {
      valid,
      score,
      approvalRequired,
      justification,
      recommendations,
      requiredApprovers,
    };
  }

  private calculateJustificationScores(request: PurposeValidationRequest): any {
    const purposeLower = request.purpose.toLowerCase();
    
    return {
      educationalBenefit: this.scoreEducationalBenefit(purposeLower, request),
      platformImprovement: this.scorePlatformImprovement(purposeLower),
      studentBenefit: this.scoreStudentBenefit(purposeLower, request),
      researchValue: this.scoreResearchValue(purposeLower, request.requesterRole),
    };
  }

  private scoreEducationalBenefit(purpose: string, request: PurposeValidationRequest): number {
    let score = 0;

    // Check for educational keywords
    Object.entries(this.purposeKeywords).forEach(([category, config]) => {
      const keywordMatches = config.keywords.filter(keyword => 
        purpose.includes(keyword)
      ).length;
      
      if (keywordMatches > 0) {
        score += config.weight * (keywordMatches / config.keywords.length);
      }
    });

    // Bonus for specific educational contexts
    if (purpose.includes('student outcomes') || purpose.includes('learning objectives')) {
      score += 0.2;
    }

    // Role-based adjustments
    if (request.requesterRole === 'educator') {
      score *= 1.2; // Educators get slight boost for educational purposes
    }

    return Math.min(score, 1);
  }

  private scorePlatformImprovement(purpose: string): number {
    let score = 0;

    const improvementIndicators = [
      'platform enhancement',
      'system improvement',
      'feature development',
      'user experience',
      'performance optimization',
      'bug fix',
      'quality assurance',
    ];

    improvementIndicators.forEach(indicator => {
      if (purpose.includes(indicator)) {
        score += 0.2;
      }
    });

    // Check for metrics-driven improvement
    if (purpose.includes('metric') || purpose.includes('measure') || purpose.includes('analytics')) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private scoreStudentBenefit(purpose: string, request: PurposeValidationRequest): number {
    let score = 0;

    const benefitIndicators = [
      'student success',
      'learning improvement',
      'academic achievement',
      'skill development',
      'personalized learning',
      'student engagement',
      'reduce struggle',
      'timely intervention',
    ];

    benefitIndicators.forEach(indicator => {
      if (purpose.includes(indicator)) {
        score += 0.15;
      }
    });

    // Direct student access to own data scores high
    if (request.requesterRole === 'student' && 
        (!request.targetUsers || request.targetUsers.length === 1)) {
      score += 0.3;
    }

    // Intervention purposes score well
    if (purpose.includes('intervention') || purpose.includes('support')) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private scoreResearchValue(purpose: string, role: string): number {
    let score = 0;

    if (role !== 'researcher') {
      // Non-researchers get lower research scores
      score *= 0.5;
    }

    // Research indicators
    if (purpose.includes('research') || purpose.includes('study')) {
      score += 0.3;
    }

    // Ethical research indicators
    if (purpose.includes('irb') || purpose.includes('ethics') || purpose.includes('consent')) {
      score += 0.3;
    }

    // Aggregated/anonymous research scores higher
    if (purpose.includes('aggregated') || purpose.includes('anonymous') || purpose.includes('de-identified')) {
      score += 0.4;
    }

    return Math.min(score, 1);
  }

  private calculateOverallScore(justification: any, request: PurposeValidationRequest): number {
    // Weight the different justification dimensions
    const weights: Record<string, number> = {
      educationalBenefit: 0.4,
      studentBenefit: 0.3,
      platformImprovement: 0.2,
      researchValue: 0.1,
    };

    let weightedScore = 0;
    Object.keys(weights).forEach(key => {
      weightedScore += justification[key] * weights[key];
    });

    // Apply data sensitivity penalty
    const sensitivityPenalty = this.calculateSensitivityPenalty(request.requestedData);
    weightedScore *= (1 - sensitivityPenalty);

    return Math.round(weightedScore * 100) / 100;
  }

  private calculateSensitivityPenalty(requestedData: string[]): number {
    let maxSensitivity = 0;

    requestedData.forEach(dataType => {
      const sensitivity = this.dataSensitivity[dataType] || 0.5;
      maxSensitivity = Math.max(maxSensitivity, sensitivity);
    });

    // High sensitivity data requires stronger justification
    return maxSensitivity * 0.3; // Up to 30% penalty
  }

  private checkApprovalRequirement(request: PurposeValidationRequest, score: number): boolean {
    // Always require approval for:
    // 1. Research access by non-educators
    if (request.requesterRole === 'researcher') return true;
    
    // 2. Access to multiple users' sensitive data
    const sensitiveDatatypes = ['reflection', 'personal_notes'];
    const requestingSensitive = request.requestedData.some(d => sensitiveDatatypes.includes(d));
    const multipleUsers = request.targetUsers && request.targetUsers.length > 1;
    
    if (requestingSensitive && multipleUsers) return true;
    
    // 3. Low scoring purposes
    if (score < 0.6) return true;
    
    // 4. Administrator accessing individual student data
    if (request.requesterRole === 'administrator' && request.targetUsers?.length === 1) return true;

    return false;
  }

  private generateRecommendations(request: PurposeValidationRequest, justification: any, valid: boolean): string[] {
    const recommendations: string[] = [];

    if (!valid) {
      recommendations.push('Consider refining your purpose to better align with educational objectives');
    }

    // Specific dimension improvements
    if (justification.educationalBenefit < 0.5) {
      recommendations.push('Clarify how this data access will improve teaching or learning outcomes');
    }

    if (justification.studentBenefit < 0.5) {
      recommendations.push('Explain the direct benefit to students from this data usage');
    }

    // Data minimization suggestions
    const sensitiveDatatypes = request.requestedData.filter(d => 
      this.dataSensitivity[d] > 0.7
    );
    if (sensitiveDatatypes.length > 0) {
      recommendations.push('Consider if you can achieve your purpose with less sensitive data types');
    }

    // Aggregation suggestions
    if (request.targetUsers && request.targetUsers.length > 10) {
      recommendations.push('Consider using aggregated analytics instead of individual-level data');
    }

    // Consent reminders
    if (request.requesterRole === 'researcher') {
      recommendations.push('Ensure you have appropriate consent and IRB approval for research use');
    }

    return recommendations;
  }

  private determineRequiredApprovers(request: PurposeValidationRequest): string[] {
    const approvers: string[] = [];

    // Sensitive data requires privacy officer
    const hasSensitiveData = request.requestedData.some(d => 
      this.dataSensitivity[d] > 0.7
    );
    if (hasSensitiveData) {
      approvers.push('privacy_officer');
    }

    // Research requires IRB
    if (request.requesterRole === 'researcher') {
      approvers.push('irb_committee');
    }

    // Multi-user access requires department head
    if (request.targetUsers && request.targetUsers.length > 5) {
      approvers.push('department_head');
    }

    // Student data requires educational oversight
    if (request.requestedData.includes('reflection') || request.requestedData.includes('personal_notes')) {
      approvers.push('educational_director');
    }

    return [...new Set(approvers)]; // Remove duplicates
  }
}