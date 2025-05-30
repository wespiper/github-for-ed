import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { ExternalAIDetectionService, AIDetectionResult } from './ExternalAIDetectionService';

export interface AIUsageDeclaration {
  id: string;
  studentId: string;
  documentId: string;
  assignmentId: string;
  
  // Declaration details
  usedExternalAI: boolean;
  aiTools: string[]; // ChatGPT, Claude, Grammarly, etc.
  usageDescription: string;
  percentageAIGenerated: number; // 0-100
  
  // Educational reflection
  whyUsedAI: string;
  whatLearned: string;
  howWillImprove: string;
  
  // Accountability
  declarationTime: 'before' | 'during' | 'after' | 'prompted';
  honestySelfAssessment: number; // 1-10
  understandsPolicy: boolean;
  
  // Outcomes
  educatorReviewed: boolean;
  educatorFeedback?: string;
  learningPlanCreated: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrityEducationPlan {
  studentId: string;
  
  // Current status
  integrityScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  honestDeclarations: number;
  suspiciousSubmissions: number;
  
  // Educational interventions
  completedModules: string[];
  requiredModules: string[];
  currentModule?: {
    id: string;
    title: string;
    progress: number;
    dueDate: Date;
  };
  
  // Support resources
  assignedMentor?: string;
  peerAccountabilityGroup?: string;
  scheduledCheckIns: Date[];
  
  // Progress tracking
  improvementTrend: 'improving' | 'stable' | 'concerning';
  lastIncident?: Date;
  successStreak: number; // Days without issues
}

export interface IntegrityInterventionResult {
  interventionType: 'educational' | 'supportive' | 'corrective';
  success: boolean;
  studentResponse: 'positive' | 'neutral' | 'resistant';
  nextSteps: string[];
  followUpDate?: Date;
}

export class AcademicIntegrityService {
  /**
   * Process a student's self-declaration of AI usage
   */
  static async processSelfDeclaration(
    declaration: Omit<AIUsageDeclaration, 'id' | 'createdAt' | 'updatedAt' | 'educatorReviewed' | 'learningPlanCreated'>
  ): Promise<IntegrityInterventionResult> {
    // Store the declaration
    const stored = await this.storeDeclaration(declaration);
    
    // Reward honesty
    await this.rewardHonesty(declaration.studentId, declaration.declarationTime);
    
    // Create educational response
    const interventionResult = await this.createEducationalIntervention(
      declaration,
      declaration.declarationTime === 'before' ? 'proactive' : 'reactive'
    );
    
    // Update integrity profile
    await this.updateIntegrityProfile(declaration.studentId, 'self_declaration', true);
    
    // Notify educator with positive framing
    if (declaration.percentageAIGenerated > 30) {
      await this.notifyEducatorPositively(declaration);
    }
    
    return interventionResult;
  }

  /**
   * Handle detection of potential AI usage without declaration
   */
  static async handleDetectedAIUsage(
    documentId: string,
    detectionResult: AIDetectionResult
  ): Promise<IntegrityInterventionResult> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        author: true,
        assignment: true
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if student already declared
    const existingDeclaration = await this.checkForDeclaration(documentId);
    
    if (existingDeclaration) {
      // Student was honest - this is good!
      return {
        interventionType: 'supportive',
        success: true,
        studentResponse: 'positive',
        nextSteps: ['Continue building on your honest approach'],
        followUpDate: undefined
      };
    }

    // No declaration but AI detected
    if (detectionResult.overallRiskScore > 60) {
      // Create reflection opportunity
      const reflectionPrompt = await this.createReflectionOpportunity(
        document.authorId,
        documentId,
        detectionResult
      );
      
      // Update integrity profile
      await this.updateIntegrityProfile(
        document.authorId,
        'ai_detected_no_declaration',
        false
      );
      
      return {
        interventionType: 'educational',
        success: true,
        studentResponse: 'neutral',
        nextSteps: [
          'Complete reflection on writing process',
          'Review academic integrity resources',
          'Schedule optional consultation'
        ],
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      };
    }

    // Low risk - no intervention needed
    return {
      interventionType: 'supportive',
      success: true,
      studentResponse: 'positive',
      nextSteps: [],
      followUpDate: undefined
    };
  }

  /**
   * Create or update student's integrity education plan
   */
  static async createIntegrityPlan(
    studentId: string,
    reason: 'proactive' | 'first_incident' | 'repeated_incident'
  ): Promise<IntegrityEducationPlan> {
    const profile = await this.getIntegrityProfile(studentId);
    
    // Determine required modules based on profile
    const requiredModules = this.determineRequiredModules(profile, reason);
    
    // Create supportive plan
    const plan: IntegrityEducationPlan = {
      studentId,
      integrityScore: profile.integrityScore,
      riskLevel: profile.riskLevel,
      honestDeclarations: profile.honestDeclarations,
      suspiciousSubmissions: profile.suspiciousSubmissions,
      completedModules: profile.completedModules || [],
      requiredModules,
      improvementTrend: profile.trend,
      successStreak: profile.successStreak,
      scheduledCheckIns: []
    };

    // Add support based on risk level
    if (profile.riskLevel === 'high') {
      plan.assignedMentor = await this.assignPeerMentor(studentId);
      plan.scheduledCheckIns = this.scheduleCheckIns(4); // Weekly for a month
    } else if (profile.riskLevel === 'medium') {
      plan.scheduledCheckIns = this.scheduleCheckIns(2); // Bi-weekly
    }

    // Add empty scheduled check-ins if not set
    if (!plan.scheduledCheckIns) {
      plan.scheduledCheckIns = [];
    }
    
    // Store plan
    await this.storeIntegrityPlan(plan);
    
    return plan;
  }

  /**
   * Educational modules for integrity development
   */
  static readonly EDUCATIONAL_MODULES = {
    'understanding-ai-tools': {
      title: 'Understanding AI Tools in Academic Writing',
      duration: '30 minutes',
      topics: [
        'What AI tools can and cannot do',
        'Appropriate uses of AI in learning',
        'Building your own voice'
      ]
    },
    'citation-attribution': {
      title: 'Citing and Attributing AI Assistance',
      duration: '20 minutes',
      topics: [
        'When to cite AI tools',
        'How to document AI usage',
        'Transparency in academic work'
      ]
    },
    'developing-original-thought': {
      title: 'Developing Original Thought',
      duration: '45 minutes',
      topics: [
        'Finding your unique perspective',
        'Building on others\' ideas ethically',
        'The value of struggle in learning'
      ]
    },
    'collaborative-vs-copying': {
      title: 'Collaboration vs. Copying',
      duration: '25 minutes',
      topics: [
        'Healthy collaboration practices',
        'When help becomes cheating',
        'Building academic community'
      ]
    },
    'growth-through-challenge': {
      title: 'Growth Through Academic Challenge',
      duration: '35 minutes',
      topics: [
        'Why difficulty leads to learning',
        'Productive struggle strategies',
        'Long-term benefits of integrity'
      ]
    }
  };

  /**
   * Private helper methods
   */

  private static async storeDeclaration(
    declaration: Omit<AIUsageDeclaration, 'id' | 'createdAt' | 'updatedAt' | 'educatorReviewed' | 'learningPlanCreated'>
  ): Promise<string> {
    const result = await prisma.document.update({
      where: { id: declaration.documentId },
      data: {
        metadata: {
          aiUsageDeclaration: {
            ...declaration,
            id: `declaration-${Date.now()}`,
            createdAt: new Date(),
            educatorReviewed: false,
            learningPlanCreated: false
          }
        }
      }
    });

    return result.id;
  }

  private static async rewardHonesty(studentId: string, timing: string): Promise<void> {
    // Update integrity score positively
    const profile = await this.getIntegrityProfile(studentId);
    const bonus = timing === 'before' ? 10 : timing === 'during' ? 5 : 2;
    
    await this.updateIntegrityScore(studentId, profile.integrityScore + bonus);
    
    // Create positive notification
    await prisma.notification.create({
      data: {
        recipientId: studentId,
        type: 'positive_reinforcement',
        category: 'academic_integrity',
        priority: 'low',
        title: 'Thank You for Your Honesty',
        message: 'Your transparency about using AI tools helps create a better learning environment for everyone. This honesty is valued and noted.',
        context: {
          integrityBonus: bonus,
          currentScore: profile.integrityScore + bonus
        }
      }
    });
  }

  private static async createEducationalIntervention(
    declaration: any,
    type: 'proactive' | 'reactive'
  ): Promise<IntegrityInterventionResult> {
    const modules = [];
    
    // Recommend modules based on usage
    if (declaration.percentageAIGenerated > 50) {
      modules.push('developing-original-thought');
    }
    if (declaration.aiTools.length > 2) {
      modules.push('understanding-ai-tools');
    }
    if (!declaration.understandsPolicy) {
      modules.push('citation-attribution');
    }

    // Create supportive message
    const message = type === 'proactive'
      ? 'Great job being proactive about declaring AI usage! Here are some resources to help you use AI tools effectively while developing your own voice.'
      : 'Thank you for reflecting on your AI usage. These resources will help you balance AI assistance with authentic learning.';

    await prisma.notification.create({
      data: {
        recipientId: declaration.studentId,
        type: 'educational_resources',
        category: 'academic_integrity',
        priority: 'normal',
        title: 'Resources for Ethical AI Use',
        message,
        context: {
          recommendedModules: modules,
          declarationType: type
        }
      }
    });

    return {
      interventionType: 'educational',
      success: true,
      studentResponse: 'positive',
      nextSteps: modules.map(m => `Complete module: ${this.EDUCATIONAL_MODULES[m as keyof typeof this.EDUCATIONAL_MODULES]?.title}`),
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
    };
  }

  private static async getIntegrityProfile(studentId: string): Promise<any> {
    const [declarations, detections, submissions] = await Promise.all([
      // Count honest declarations
      prisma.document.count({
        where: {
          authorId: studentId,
          AND: [
            {
              metadata: {
                not: Prisma.DbNull
              }
            }
          ]
        }
      }),
      
      // Count suspicious detections
      // This is a simplified query - in production, you'd use a more sophisticated JSON query
      prisma.document.count({
        where: {
          authorId: studentId,
          AND: [
            {
              metadata: {
                not: Prisma.DbNull
              }
            }
          ]
        }
      }),
      
      // Total submissions
      prisma.assignmentSubmission.count({
        where: { authorId: studentId }
      })
    ]);

    const integrityScore = this.calculateIntegrityScore(declarations, detections, submissions);
    const riskLevel = integrityScore >= 80 ? 'low' : integrityScore >= 60 ? 'medium' : 'high';
    
    return {
      integrityScore,
      riskLevel,
      honestDeclarations: declarations,
      suspiciousSubmissions: detections,
      totalSubmissions: submissions,
      trend: declarations > detections ? 'improving' : 'stable',
      successStreak: 0, // Would calculate from timestamps
      completedModules: [] // Would fetch from database
    };
  }

  private static calculateIntegrityScore(
    declarations: number,
    detections: number,
    total: number
  ): number {
    if (total === 0) return 70; // Default for new students
    
    const honestyRatio = declarations / Math.max(1, declarations + detections);
    const issueRatio = detections / total;
    
    const score = (honestyRatio * 50) + ((1 - issueRatio) * 50);
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private static async checkForDeclaration(documentId: string): Promise<boolean> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { metadata: true }
    });
    
    return !!(document?.metadata as any)?.aiUsageDeclaration;
  }

  private static async createReflectionOpportunity(
    studentId: string,
    documentId: string,
    detectionResult: AIDetectionResult
  ): Promise<void> {
    await prisma.notification.create({
      data: {
        recipientId: studentId,
        type: 'reflection_opportunity',
        category: 'academic_integrity',
        priority: 'high',
        title: 'Let\'s Reflect on Your Writing Process',
        message: 'We noticed some interesting patterns in your recent submission. This is a great opportunity to reflect on your writing process and the tools you use.',
        context: {
          documentId,
          reflectionPrompts: detectionResult.educationalResponse.reflectionPrompts,
          resourceLinks: detectionResult.educationalResponse.resourceLinks,
          supportive: true
        },
        actionRequired: true
      }
    });
  }

  private static async updateIntegrityProfile(
    studentId: string,
    event: string,
    positive: boolean
  ): Promise<void> {
    const adjustment = positive ? 5 : -5;
    const profile = await this.getIntegrityProfile(studentId);
    
    await this.updateIntegrityScore(
      studentId,
      Math.max(0, Math.min(100, profile.integrityScore + adjustment))
    );
  }

  private static async updateIntegrityScore(studentId: string, newScore: number): Promise<void> {
    // In production, this would update a dedicated integrity profile table
    await prisma.studentProfile.upsert({
      where: { studentId },
      create: {
        studentId,
        sessionMetrics: {
          integrityScore: newScore,
          lastIntegrityUpdate: new Date()
        } as any
      },
      update: {
        sessionMetrics: {
          integrityScore: newScore,
          lastIntegrityUpdate: new Date()
        } as any
      }
    });
  }

  private static async notifyEducatorPositively(declaration: any): Promise<void> {
    const document = await prisma.document.findUnique({
      where: { id: declaration.documentId },
      include: {
        author: true,
        assignment: {
          include: { instructor: true }
        }
      }
    });

    if (document?.assignment) {
      await prisma.notification.create({
        data: {
          recipientId: document.assignment.instructorId,
          type: 'student_honesty_declaration',
          category: 'academic_integrity',
          priority: 'low',
          title: 'Student AI Usage Declaration',
          message: `${document.author.firstName} ${document.author.lastName} has proactively declared using AI tools for "${document.assignment.title}". They've included a reflection on their learning process.`,
          context: {
            documentId: declaration.documentId,
            studentId: declaration.studentId,
            assignmentId: declaration.assignmentId,
            declarationSummary: {
              aiTools: declaration.aiTools,
              percentageAIGenerated: declaration.percentageAIGenerated,
              reflectionQuality: declaration.whyUsedAI.length > 100 ? 'detailed' : 'brief'
            }
          }
        }
      });
    }
  }

  private static determineRequiredModules(profile: any, reason: string): string[] {
    const modules: string[] = [];
    
    if (reason === 'proactive') {
      modules.push('understanding-ai-tools');
    } else if (reason === 'first_incident') {
      modules.push('understanding-ai-tools', 'developing-original-thought');
    } else if (reason === 'repeated_incident') {
      modules.push('developing-original-thought', 'growth-through-challenge', 'collaborative-vs-copying');
    }

    if (profile.integrityScore < 60) {
      modules.push('citation-attribution');
    }

    return [...new Set(modules)]; // Remove duplicates
  }

  private static async assignPeerMentor(studentId: string): Promise<string> {
    // In production, match with a successful senior student
    return 'peer-mentor-' + Date.now();
  }

  private static scheduleCheckIns(count: number): Date[] {
    const dates: Date[] = [];
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 1; i <= count; i++) {
      dates.push(new Date(Date.now() + i * weekInMs));
    }
    
    return dates;
  }

  private static async storeIntegrityPlan(plan: IntegrityEducationPlan): Promise<void> {
    await prisma.studentProfile.update({
      where: { studentId: plan.studentId },
      data: {
        sessionMetrics: {
          integrityPlan: plan
        } as any
      }
    });
  }
}