import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StudentPrivacyChoices } from '../../shared/student-profiling.service';

export interface PrivacyChoiceUpdate {
  choiceId: string;
  studentId: string;
  previousChoices: StudentPrivacyChoices;
  newChoices: StudentPrivacyChoices;
  changeReason?: string;
  timestamp: Date;
  version: string;
}

export interface ValueExchangeExplanation {
  feature: string;
  dataRequired: string[];
  benefit: string;
  privacyImpact: 'low' | 'medium' | 'high';
  alternativeWithoutData: string;
}

@Injectable()
export class PrivacyChoicesService {
  private readonly logger = new Logger(PrivacyChoicesService.name);
  private privacyChoices: Map<string, StudentPrivacyChoices> = new Map();
  private choiceHistory: Map<string, PrivacyChoiceUpdate[]> = new Map();

  async managePrivacyChoices(
    studentId: string,
    choices: Partial<StudentPrivacyChoices>
  ): Promise<PrivacyChoiceUpdate> {
    this.logger.log(`Managing privacy choices for student: ${studentId}`);

    // Get current choices or defaults
    const currentChoices = this.getStudentChoices(studentId);
    
    // Merge with new choices
    const newChoices: StudentPrivacyChoices = {
      educationalSharing: {
        ...currentChoices.educationalSharing,
        ...choices.educationalSharing,
      },
      platformImprovement: {
        ...currentChoices.platformImprovement,
        ...choices.platformImprovement,
      },
      personalBenefits: {
        ...currentChoices.personalBenefits,
        ...choices.personalBenefits,
      },
      privacyControls: {
        ...currentChoices.privacyControls,
        ...choices.privacyControls,
      },
    };

    // Create update record
    const update: PrivacyChoiceUpdate = {
      choiceId: uuidv4(),
      studentId,
      previousChoices: currentChoices,
      newChoices,
      timestamp: new Date(),
      version: '1.0',
    };

    // Save choices
    this.privacyChoices.set(studentId, newChoices);
    
    // Add to history
    const history = this.choiceHistory.get(studentId) || [];
    history.push(update);
    this.choiceHistory.set(studentId, history);

    // Emit privacy event for other services
    await this.emitPrivacyChoicesUpdatedEvent(studentId, update);

    return update;
  }

  async getValueExchangeExplanations(
    studentId: string
  ): Promise<ValueExchangeExplanation[]> {
    const explanations: ValueExchangeExplanation[] = [
      {
        feature: 'Personalized Learning Recommendations',
        dataRequired: ['writing_patterns', 'skill_assessments', 'learning_trajectory'],
        benefit: 'Get tailored suggestions that match your exact learning style and pace',
        privacyImpact: 'medium',
        alternativeWithoutData: 'Generic recommendations based on grade level only',
      },
      {
        feature: 'Peer Learning Matches',
        dataRequired: ['anonymized_skills', 'interests', 'collaboration_preferences'],
        benefit: 'Find study partners with complementary skills and interests',
        privacyImpact: 'low',
        alternativeWithoutData: 'Random peer matching within your class',
      },
      {
        feature: 'Career Path Insights',
        dataRequired: ['skill_development', 'interests', 'achievement_patterns'],
        benefit: 'Discover career paths that align with your strengths and interests',
        privacyImpact: 'medium',
        alternativeWithoutData: 'Basic career information without personalization',
      },
      {
        feature: 'Advanced Writing Analytics',
        dataRequired: ['detailed_writing_samples', 'revision_history', 'time_patterns'],
        benefit: 'Deep insights into your writing process to accelerate improvement',
        privacyImpact: 'high',
        alternativeWithoutData: 'Basic word count and submission tracking only',
      },
    ];

    return explanations;
  }

  async getChoiceHistory(studentId: string): Promise<PrivacyChoiceUpdate[]> {
    return this.choiceHistory.get(studentId) || [];
  }

  async validateChoiceConsistency(choices: StudentPrivacyChoices): Promise<{
    valid: boolean;
    issues?: string[];
  }> {
    const issues: string[] = [];

    // Check for logical inconsistencies
    if (choices.personalBenefits.enhancedAnalytics && 
        !choices.platformImprovement.featureAnalytics) {
      issues.push('Enhanced analytics requires feature analytics to be enabled');
    }

    if (choices.personalBenefits.careerGuidance && 
        !choices.platformImprovement.anonymousPatterns) {
      issues.push('Career guidance works better with anonymous pattern analysis enabled');
    }

    if (choices.privacyControls.thirdParty === 'none' && 
        choices.personalBenefits.portfolio) {
      issues.push('Portfolio sharing may require some third-party integrations');
    }

    return {
      valid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  private getStudentChoices(studentId: string): StudentPrivacyChoices {
    // Return stored choices or defaults
    return this.privacyChoices.get(studentId) || this.getDefaultChoices();
  }

  private getDefaultChoices(): StudentPrivacyChoices {
    return {
      educationalSharing: {
        teacher: true,
        peer: false,
        parent: false,
      },
      platformImprovement: {
        anonymousPatterns: true,
        featureAnalytics: false,
        research: false,
      },
      personalBenefits: {
        enhancedAnalytics: false,
        portfolio: false,
        careerGuidance: false,
      },
      privacyControls: {
        retentionPeriod: '1_year',
        sensitiveContent: 'blur',
        thirdParty: 'none',
      },
    };
  }

  private async emitPrivacyChoicesUpdatedEvent(
    studentId: string,
    update: PrivacyChoiceUpdate
  ): Promise<void> {
    // In production, emit to event bus
    this.logger.log(`Privacy choices updated event emitted for student: ${studentId}`);
  }

  async exportPrivacyChoices(studentId: string): Promise<{
    currentChoices: StudentPrivacyChoices;
    history: PrivacyChoiceUpdate[];
    exportDate: Date;
    format: string;
  }> {
    return {
      currentChoices: this.getStudentChoices(studentId),
      history: await this.getChoiceHistory(studentId),
      exportDate: new Date(),
      format: 'json',
    };
  }
}