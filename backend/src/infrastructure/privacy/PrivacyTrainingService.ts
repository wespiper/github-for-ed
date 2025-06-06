import { Injectable } from '@nestjs/common';
import { Logger } from '../../monitoring/Logger';

export enum TrainingRole {
  DEVELOPER = 'developer',
  SUPPORT_TEAM = 'support_team',
  ADMINISTRATOR = 'administrator',
  EDUCATOR = 'educator',
  PRIVACY_OFFICER = 'privacy_officer',
  SECURITY_TEAM = 'security_team',
  EXECUTIVE = 'executive'
}

export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  roles: TrainingRole[];
  duration: number; // in minutes
  content: TrainingContent[];
  assessments: TrainingAssessment[];
  prerequisites: string[];
  validityPeriod: number; // in days
  mandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingContent {
  id: string;
  type: 'video' | 'document' | 'interactive' | 'presentation' | 'quiz';
  title: string;
  content: string;
  order: number;
  estimatedTime: number; // in minutes
}

export interface TrainingAssessment {
  id: string;
  title: string;
  questions: TrainingQuestion[];
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number; // in minutes
}

export interface TrainingQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'scenario' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export interface UserTrainingRecord {
  userId: string;
  moduleId: string;
  role: TrainingRole;
  status: TrainingStatus;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  score?: number;
  attempts: TrainingAttempt[];
  certificateId?: string;
}

export interface TrainingAttempt {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  passed: boolean;
  answers: TrainingAnswer[];
}

export interface TrainingAnswer {
  questionId: string;
  answer: string | string[];
  correct: boolean;
  points: number;
}

export interface TrainingCertificate {
  id: string;
  userId: string;
  moduleId: string;
  issuedAt: Date;
  expiresAt: Date;
  score: number;
  digitalSignature: string;
}

/**
 * Privacy Training Service
 * 
 * Manages comprehensive privacy training program including:
 * - Role-specific training modules
 * - Interactive training content delivery
 * - Assessment and certification tracking
 * - Training compliance monitoring
 * - Automated recertification reminders
 * - Training effectiveness analytics
 */
@Injectable()
export class PrivacyTrainingService {
  private readonly logger = new Logger('PrivacyTrainingService');
  private readonly trainingModules = new Map<string, TrainingModule>();
  private readonly userTrainingRecords = new Map<string, UserTrainingRecord[]>();
  private readonly certificates = new Map<string, TrainingCertificate>();

  constructor() {
    this.initializeTrainingModules();
  }

  /**
   * Initialize comprehensive privacy training modules
   */
  private initializeTrainingModules(): void {
    this.logger.info('Initializing privacy training modules');

    // Core privacy fundamentals module
    this.createPrivacyFundamentalsModule();
    
    // FERPA/COPPA/GDPR specific modules
    this.createFERPATrainingModule();
    this.createCOPPATrainingModule();
    this.createGDPRTrainingModule();
    
    // Role-specific modules
    this.createDeveloperPrivacyModule();
    this.createSupportTeamPrivacyModule();
    this.createAdministratorPrivacyModule();
    this.createEducatorPrivacyModule();
    
    // Incident response training
    this.createIncidentResponseModule();
    
    // Advanced privacy topics
    this.createAdvancedPrivacyModule();

    this.logger.info('Privacy training modules initialized', {
      totalModules: this.trainingModules.size
    });
  }

  /**
   * Create Privacy Fundamentals module
   */
  private createPrivacyFundamentalsModule(): void {
    const module: TrainingModule = {
      id: 'privacy-fundamentals',
      title: 'Privacy Fundamentals for Educational Technology',
      description: 'Core privacy concepts and principles for educational data protection',
      roles: [TrainingRole.DEVELOPER, TrainingRole.SUPPORT_TEAM, TrainingRole.ADMINISTRATOR, TrainingRole.EDUCATOR],
      duration: 45,
      content: [
        {
          id: 'pf-intro',
          type: 'presentation',
          title: 'Introduction to Educational Privacy',
          content: 'Privacy in educational technology: why it matters and key principles',
          order: 1,
          estimatedTime: 10
        },
        {
          id: 'pf-data-types',
          type: 'interactive',
          title: 'Types of Educational Data',
          content: 'Understanding PII, directory information, and sensitive educational data',
          order: 2,
          estimatedTime: 15
        },
        {
          id: 'pf-consent',
          type: 'video',
          title: 'Consent and Student Privacy Rights',
          content: 'Managing consent for educational technology use',
          order: 3,
          estimatedTime: 12
        },
        {
          id: 'pf-best-practices',
          type: 'document',
          title: 'Privacy Best Practices',
          content: 'Practical guidelines for protecting student privacy',
          order: 4,
          estimatedTime: 8
        }
      ],
      assessments: [
        {
          id: 'pf-assessment',
          title: 'Privacy Fundamentals Assessment',
          questions: [
            {
              id: 'pf-q1',
              type: 'multiple_choice',
              question: 'Which of the following is considered PII under FERPA?',
              options: ['Student name', 'Student ID number', 'Student email address', 'All of the above'],
              correctAnswer: 'All of the above',
              explanation: 'FERPA protects all personally identifiable information that can be used to identify a student.',
              points: 10
            },
            {
              id: 'pf-q2',
              type: 'true_false',
              question: 'Directory information can be disclosed without consent if the school has provided proper notice.',
              correctAnswer: 'true',
              explanation: 'Directory information may be disclosed without consent if parents/students have been properly notified and given the opportunity to opt out.',
              points: 10
            },
            {
              id: 'pf-q3',
              type: 'scenario',
              question: 'A teacher wants to use a new educational app that requires student names and email addresses. What steps should be taken?',
              correctAnswer: 'Verify the app complies with FERPA, review data use policies, obtain necessary approvals, and ensure proper consent is obtained.',
              explanation: 'Educational technology must be properly vetted for privacy compliance before use with student data.',
              points: 15
            }
          ],
          passingScore: 80,
          maxAttempts: 3,
          timeLimit: 30
        }
      ],
      prerequisites: [],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create FERPA training module
   */
  private createFERPATrainingModule(): void {
    const module: TrainingModule = {
      id: 'ferpa-compliance',
      title: 'FERPA Compliance for Educational Technology',
      description: 'Comprehensive training on Family Educational Rights and Privacy Act requirements',
      roles: [TrainingRole.ADMINISTRATOR, TrainingRole.EDUCATOR, TrainingRole.PRIVACY_OFFICER],
      duration: 60,
      content: [
        {
          id: 'ferpa-overview',
          type: 'presentation',
          title: 'FERPA Overview and Requirements',
          content: 'Understanding FERPA scope, requirements, and exceptions',
          order: 1,
          estimatedTime: 20
        },
        {
          id: 'ferpa-directory',
          type: 'interactive',
          title: 'Directory Information Management',
          content: 'Managing directory information disclosures and opt-outs',
          order: 2,
          estimatedTime: 15
        },
        {
          id: 'ferpa-consent',
          type: 'video',
          title: 'FERPA Consent Requirements',
          content: 'When and how to obtain FERPA consent',
          order: 3,
          estimatedTime: 15
        },
        {
          id: 'ferpa-violations',
          type: 'document',
          title: 'Avoiding FERPA Violations',
          content: 'Common FERPA violations and how to prevent them',
          order: 4,
          estimatedTime: 10
        }
      ],
      assessments: [
        {
          id: 'ferpa-assessment',
          title: 'FERPA Compliance Assessment',
          questions: [
            {
              id: 'ferpa-q1',
              type: 'multiple_choice',
              question: 'Under FERPA, when can educational records be disclosed without consent?',
              options: ['To school officials with legitimate educational interest', 'In response to a court order', 'To other schools where the student seeks to enroll', 'All of the above'],
              correctAnswer: 'All of the above',
              explanation: 'FERPA allows disclosure without consent in specific circumstances outlined in the law.',
              points: 15
            }
          ],
          passingScore: 85,
          maxAttempts: 3,
          timeLimit: 45
        }
      ],
      prerequisites: ['privacy-fundamentals'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create COPPA training module
   */
  private createCOPPATrainingModule(): void {
    const module: TrainingModule = {
      id: 'coppa-compliance',
      title: 'COPPA Compliance for Under-13 Users',
      description: "Children's Online Privacy Protection Act requirements for educational platforms",
      roles: [TrainingRole.DEVELOPER, TrainingRole.ADMINISTRATOR, TrainingRole.PRIVACY_OFFICER],
      duration: 45,
      content: [
        {
          id: 'coppa-overview',
          type: 'presentation',
          title: 'COPPA Requirements Overview',
          content: 'Understanding COPPA scope and parental consent requirements',
          order: 1,
          estimatedTime: 15
        },
        {
          id: 'coppa-consent',
          type: 'interactive',
          title: 'Verifiable Parental Consent',
          content: 'Methods for obtaining and verifying parental consent',
          order: 2,
          estimatedTime: 20
        },
        {
          id: 'coppa-school-exception',
          type: 'video',
          title: 'COPPA School Official Exception',
          content: 'Understanding the school official exception and its limitations',
          order: 3,
          estimatedTime: 10
        }
      ],
      assessments: [
        {
          id: 'coppa-assessment',
          title: 'COPPA Compliance Assessment',
          questions: [
            {
              id: 'coppa-q1',
              type: 'true_false',
              question: 'Under COPPA, schools can provide consent on behalf of parents for educational technology use.',
              correctAnswer: 'true',
              explanation: 'The school official exception allows schools to consent for educational use, but with limitations.',
              points: 10
            }
          ],
          passingScore: 80,
          maxAttempts: 3,
          timeLimit: 30
        }
      ],
      prerequisites: ['privacy-fundamentals'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create GDPR training module
   */
  private createGDPRTrainingModule(): void {
    const module: TrainingModule = {
      id: 'gdpr-compliance',
      title: 'GDPR Compliance for Educational Data',
      description: 'General Data Protection Regulation requirements for EU data subjects',
      roles: [TrainingRole.DEVELOPER, TrainingRole.ADMINISTRATOR, TrainingRole.PRIVACY_OFFICER],
      duration: 75,
      content: [
        {
          id: 'gdpr-overview',
          type: 'presentation',
          title: 'GDPR Principles and Rights',
          content: 'Understanding GDPR data protection principles and individual rights',
          order: 1,
          estimatedTime: 25
        },
        {
          id: 'gdpr-lawful-basis',
          type: 'interactive',
          title: 'Lawful Basis for Processing',
          content: 'Determining appropriate lawful basis for educational data processing',
          order: 2,
          estimatedTime: 20
        },
        {
          id: 'gdpr-rights',
          type: 'video',
          title: 'Data Subject Rights Management',
          content: 'Handling access, rectification, erasure, and other rights requests',
          order: 3,
          estimatedTime: 20
        },
        {
          id: 'gdpr-breach',
          type: 'document',
          title: 'GDPR Breach Notification',
          content: 'Understanding 72-hour breach notification requirements',
          order: 4,
          estimatedTime: 10
        }
      ],
      assessments: [
        {
          id: 'gdpr-assessment',
          title: 'GDPR Compliance Assessment',
          questions: [
            {
              id: 'gdpr-q1',
              type: 'multiple_choice',
              question: 'Under GDPR, personal data breaches must be reported to supervisory authorities within:',
              options: ['24 hours', '48 hours', '72 hours', '30 days'],
              correctAnswer: '72 hours',
              explanation: 'GDPR requires breach notification to supervisory authorities within 72 hours of becoming aware of the breach.',
              points: 15
            }
          ],
          passingScore: 85,
          maxAttempts: 3,
          timeLimit: 60
        }
      ],
      prerequisites: ['privacy-fundamentals'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create Developer Privacy module
   */
  private createDeveloperPrivacyModule(): void {
    const module: TrainingModule = {
      id: 'developer-privacy',
      title: 'Privacy-by-Design for Developers',
      description: 'Technical privacy implementation for software developers',
      roles: [TrainingRole.DEVELOPER],
      duration: 90,
      content: [
        {
          id: 'dev-privacy-design',
          type: 'presentation',
          title: 'Privacy-by-Design Principles',
          content: 'Implementing privacy controls in software architecture',
          order: 1,
          estimatedTime: 30
        },
        {
          id: 'dev-data-minimization',
          type: 'interactive',
          title: 'Data Minimization Implementation',
          content: 'Coding practices for collecting only necessary data',
          order: 2,
          estimatedTime: 25
        },
        {
          id: 'dev-encryption',
          type: 'video',
          title: 'Encryption and Secure Storage',
          content: 'Implementing encryption for data at rest and in transit',
          order: 3,
          estimatedTime: 20
        },
        {
          id: 'dev-access-controls',
          type: 'document',
          title: 'Access Controls and Audit Logging',
          content: 'Implementing role-based access and privacy audit trails',
          order: 4,
          estimatedTime: 15
        }
      ],
      assessments: [
        {
          id: 'dev-assessment',
          title: 'Developer Privacy Assessment',
          questions: [
            {
              id: 'dev-q1',
              type: 'scenario',
              question: 'You need to store student passwords. What is the appropriate approach?',
              correctAnswer: 'Hash passwords using a strong algorithm like bcrypt with salt, never store plain text passwords',
              explanation: 'Passwords should always be hashed using strong, salted algorithms. Plain text storage is a critical security violation.',
              points: 20
            }
          ],
          passingScore: 90,
          maxAttempts: 2,
          timeLimit: 75
        }
      ],
      prerequisites: ['privacy-fundamentals'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create Support Team Privacy module
   */
  private createSupportTeamPrivacyModule(): void {
    const module: TrainingModule = {
      id: 'support-privacy',
      title: 'Privacy Guidelines for Support Teams',
      description: 'Privacy protection during customer support interactions',
      roles: [TrainingRole.SUPPORT_TEAM],
      duration: 40,
      content: [
        {
          id: 'support-verification',
          type: 'interactive',
          title: 'Identity Verification Procedures',
          content: 'Safely verifying user identity before accessing account information',
          order: 1,
          estimatedTime: 15
        },
        {
          id: 'support-data-access',
          type: 'video',
          title: 'Appropriate Data Access',
          content: 'Accessing only the minimum data necessary to resolve issues',
          order: 2,
          estimatedTime: 15
        },
        {
          id: 'support-communication',
          type: 'document',
          title: 'Privacy-Safe Communication',
          content: 'Guidelines for discussing account information with users',
          order: 3,
          estimatedTime: 10
        }
      ],
      assessments: [
        {
          id: 'support-assessment',
          title: 'Support Team Privacy Assessment',
          questions: [
            {
              id: 'support-q1',
              type: 'scenario',
              question: 'A caller claims to be a student\'s parent requesting account information. What should you do?',
              correctAnswer: 'Follow identity verification procedures before providing any information, and only provide information you are authorized to share',
              explanation: 'Always verify identity and follow established procedures for information disclosure.',
              points: 15
            }
          ],
          passingScore: 85,
          maxAttempts: 3,
          timeLimit: 30
        }
      ],
      prerequisites: ['privacy-fundamentals'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create Administrator Privacy module
   */
  private createAdministratorPrivacyModule(): void {
    const module: TrainingModule = {
      id: 'admin-privacy',
      title: 'Privacy Administration and Compliance',
      description: 'Privacy governance and compliance management for administrators',
      roles: [TrainingRole.ADMINISTRATOR],
      duration: 60,
      content: [
        {
          id: 'admin-governance',
          type: 'presentation',
          title: 'Privacy Governance Framework',
          content: 'Establishing privacy policies and procedures',
          order: 1,
          estimatedTime: 20
        },
        {
          id: 'admin-vendor-management',
          type: 'interactive',
          title: 'Third-Party Vendor Management',
          content: 'Evaluating and managing third-party privacy risks',
          order: 2,
          estimatedTime: 20
        },
        {
          id: 'admin-incident-response',
          type: 'video',
          title: 'Privacy Incident Management',
          content: 'Leading privacy incident response and notification',
          order: 3,
          estimatedTime: 20
        }
      ],
      assessments: [
        {
          id: 'admin-assessment',
          title: 'Administrator Privacy Assessment',
          questions: [
            {
              id: 'admin-q1',
              type: 'multiple_choice',
              question: 'When evaluating a new educational technology vendor, what should be prioritized?',
              options: ['Cost savings', 'Privacy and security controls', 'Feature completeness', 'Implementation timeline'],
              correctAnswer: 'Privacy and security controls',
              explanation: 'Privacy and security should be the primary consideration when evaluating educational technology vendors.',
              points: 15
            }
          ],
          passingScore: 85,
          maxAttempts: 3,
          timeLimit: 45
        }
      ],
      prerequisites: ['privacy-fundamentals', 'ferpa-compliance'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create Educator Privacy module
   */
  private createEducatorPrivacyModule(): void {
    const module: TrainingModule = {
      id: 'educator-privacy',
      title: 'Privacy Awareness for Educators',
      description: 'Student privacy protection in educational practice',
      roles: [TrainingRole.EDUCATOR],
      duration: 35,
      content: [
        {
          id: 'educator-classroom',
          type: 'interactive',
          title: 'Classroom Privacy Best Practices',
          content: 'Protecting student privacy in digital and physical classrooms',
          order: 1,
          estimatedTime: 15
        },
        {
          id: 'educator-technology',
          type: 'video',
          title: 'Educational Technology Selection',
          content: 'Choosing privacy-appropriate tools for educational use',
          order: 2,
          estimatedTime: 12
        },
        {
          id: 'educator-communication',
          type: 'document',
          title: 'Privacy-Safe Parent Communication',
          content: 'Guidelines for communicating about students while protecting privacy',
          order: 3,
          estimatedTime: 8
        }
      ],
      assessments: [
        {
          id: 'educator-assessment',
          title: 'Educator Privacy Assessment',
          questions: [
            {
              id: 'educator-q1',
              type: 'true_false',
              question: 'It is acceptable to use personal cloud storage for student assignments.',
              correctAnswer: 'false',
              explanation: 'Student work should only be stored in approved, secure systems that comply with privacy requirements.',
              points: 10
            }
          ],
          passingScore: 80,
          maxAttempts: 3,
          timeLimit: 25
        }
      ],
      prerequisites: ['privacy-fundamentals'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create Incident Response training module
   */
  private createIncidentResponseModule(): void {
    const module: TrainingModule = {
      id: 'incident-response',
      title: 'Privacy Incident Response Procedures',
      description: 'Responding to privacy incidents and data breaches',
      roles: [TrainingRole.PRIVACY_OFFICER, TrainingRole.SECURITY_TEAM, TrainingRole.ADMINISTRATOR],
      duration: 50,
      content: [
        {
          id: 'incident-detection',
          type: 'presentation',
          title: 'Incident Detection and Classification',
          content: 'Identifying and classifying privacy incidents',
          order: 1,
          estimatedTime: 15
        },
        {
          id: 'incident-response',
          type: 'interactive',
          title: 'Incident Response Procedures',
          content: 'Step-by-step incident response workflows',
          order: 2,
          estimatedTime: 20
        },
        {
          id: 'incident-notification',
          type: 'video',
          title: 'Breach Notification Requirements',
          content: 'Managing regulatory and stakeholder notifications',
          order: 3,
          estimatedTime: 15
        }
      ],
      assessments: [
        {
          id: 'incident-assessment',
          title: 'Incident Response Assessment',
          questions: [
            {
              id: 'incident-q1',
              type: 'scenario',
              question: 'A data breach potentially affecting 500 EU students is discovered. What are the immediate actions required?',
              correctAnswer: 'Contain the breach, assess impact, notify PIRT within 1 hour, prepare for 72-hour regulatory notification',
              explanation: 'GDPR requires swift action and 72-hour notification for significant breaches.',
              points: 20
            }
          ],
          passingScore: 90,
          maxAttempts: 2,
          timeLimit: 40
        }
      ],
      prerequisites: ['privacy-fundamentals', 'gdpr-compliance'],
      validityPeriod: 365,
      mandatory: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Create Advanced Privacy module
   */
  private createAdvancedPrivacyModule(): void {
    const module: TrainingModule = {
      id: 'advanced-privacy',
      title: 'Advanced Privacy Technologies and Techniques',
      description: 'Cutting-edge privacy technologies and implementation strategies',
      roles: [TrainingRole.PRIVACY_OFFICER, TrainingRole.DEVELOPER, TrainingRole.SECURITY_TEAM],
      duration: 120,
      content: [
        {
          id: 'advanced-differential-privacy',
          type: 'presentation',
          title: 'Differential Privacy Implementation',
          content: 'Mathematical privacy guarantees and practical implementation',
          order: 1,
          estimatedTime: 30
        },
        {
          id: 'advanced-homomorphic',
          type: 'interactive',
          title: 'Homomorphic Encryption Applications',
          content: 'Computing on encrypted educational data',
          order: 2,
          estimatedTime: 30
        },
        {
          id: 'advanced-federated',
          type: 'video',
          title: 'Federated Learning for Education',
          content: 'Privacy-preserving machine learning across institutions',
          order: 3,
          estimatedTime: 30
        },
        {
          id: 'advanced-zkp',
          type: 'document',
          title: 'Zero-Knowledge Proofs',
          content: 'Proving knowledge without revealing information',
          order: 4,
          estimatedTime: 30
        }
      ],
      assessments: [
        {
          id: 'advanced-assessment',
          title: 'Advanced Privacy Assessment',
          questions: [
            {
              id: 'advanced-q1',
              type: 'essay',
              question: 'Explain how differential privacy could be applied to educational analytics while preserving student privacy.',
              correctAnswer: 'Differential privacy adds calibrated noise to query results, providing mathematical guarantees that individual student data cannot be inferred while preserving statistical utility for educational insights.',
              explanation: 'Differential privacy provides formal privacy guarantees by adding noise proportional to query sensitivity.',
              points: 25
            }
          ],
          passingScore: 85,
          maxAttempts: 2,
          timeLimit: 90
        }
      ],
      prerequisites: ['privacy-fundamentals', 'developer-privacy'],
      validityPeriod: 730, // 2 years for advanced topics
      mandatory: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.trainingModules.set(module.id, module);
  }

  /**
   * Assign training to user based on role
   */
  async assignTrainingToUser(userId: string, role: TrainingRole): Promise<UserTrainingRecord[]> {
    this.logger.info('Assigning training to user', { userId, role });

    const assignedModules: UserTrainingRecord[] = [];
    
    // Get all modules applicable to the role
    const applicableModules = Array.from(this.trainingModules.values())
      .filter(module => module.roles.includes(role));

    for (const module of applicableModules) {
      const record: UserTrainingRecord = {
        userId,
        moduleId: module.id,
        role,
        status: TrainingStatus.NOT_STARTED,
        attempts: []
      };

      assignedModules.push(record);
    }

    // Store user training records
    this.userTrainingRecords.set(userId, assignedModules);

    this.logger.info('Training assigned to user', {
      userId,
      role,
      modulesAssigned: assignedModules.length
    });

    return assignedModules;
  }

  /**
   * Start training module for user
   */
  async startTraining(userId: string, moduleId: string): Promise<UserTrainingRecord> {
    const userRecords = this.userTrainingRecords.get(userId) || [];
    const record = userRecords.find(r => r.moduleId === moduleId);

    if (!record) {
      throw new Error(`Training module ${moduleId} not assigned to user ${userId}`);
    }

    const module = this.trainingModules.get(moduleId);
    if (!module) {
      throw new Error(`Training module ${moduleId} not found`);
    }

    // Check prerequisites
    const prerequisites = module.prerequisites;
    for (const prereqId of prerequisites) {
      const prereqRecord = userRecords.find(r => r.moduleId === prereqId);
      if (!prereqRecord || prereqRecord.status !== TrainingStatus.COMPLETED) {
        throw new Error(`Prerequisite module ${prereqId} must be completed first`);
      }
    }

    record.status = TrainingStatus.IN_PROGRESS;
    record.startedAt = new Date();

    this.logger.info('Training started', { userId, moduleId });

    return record;
  }

  /**
   * Complete training assessment
   */
  async completeAssessment(
    userId: string,
    moduleId: string,
    assessmentId: string,
    answers: TrainingAnswer[]
  ): Promise<{
    passed: boolean;
    score: number;
    certificate?: TrainingCertificate;
  }> {
    const userRecords = this.userTrainingRecords.get(userId) || [];
    const record = userRecords.find(r => r.moduleId === moduleId);

    if (!record) {
      throw new Error(`Training module ${moduleId} not assigned to user ${userId}`);
    }

    const module = this.trainingModules.get(moduleId);
    if (!module) {
      throw new Error(`Training module ${moduleId} not found`);
    }

    const assessment = module.assessments.find(a => a.id === assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found in module ${moduleId}`);
    }

    // Calculate score
    const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = answers.reduce((sum, answer) => sum + answer.points, 0);
    const score = (earnedPoints / totalPoints) * 100;
    const passed = score >= assessment.passingScore;

    // Create attempt record
    const attempt: TrainingAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      completedAt: new Date(),
      score,
      passed,
      answers
    };

    record.attempts.push(attempt);

    if (passed) {
      record.status = TrainingStatus.COMPLETED;
      record.completedAt = new Date();
      record.expiresAt = new Date(Date.now() + module.validityPeriod * 24 * 60 * 60 * 1000);
      record.score = score;

      // Generate certificate
      const certificate = await this.generateCertificate(userId, moduleId, score);
      record.certificateId = certificate.id;

      this.logger.info('Training completed successfully', {
        userId,
        moduleId,
        score: score.toFixed(1),
        certificateId: certificate.id
      });

      return { passed, score, certificate };
    } else {
      if (record.attempts.length >= assessment.maxAttempts) {
        record.status = TrainingStatus.FAILED;
      }

      this.logger.info('Training assessment failed', {
        userId,
        moduleId,
        score: score.toFixed(1),
        attemptsUsed: record.attempts.length,
        maxAttempts: assessment.maxAttempts
      });

      return { passed, score };
    }
  }

  /**
   * Generate training certificate
   */
  private async generateCertificate(
    userId: string,
    moduleId: string,
    score: number
  ): Promise<TrainingCertificate> {
    const module = this.trainingModules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const certificate: TrainingCertificate = {
      id: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId,
      moduleId,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + module.validityPeriod * 24 * 60 * 60 * 1000),
      score,
      digitalSignature: this.generateDigitalSignature(userId, moduleId, score)
    };

    this.certificates.set(certificate.id, certificate);

    return certificate;
  }

  /**
   * Generate digital signature for certificate
   */
  private generateDigitalSignature(userId: string, moduleId: string, score: number): string {
    // Simple signature generation - in production would use proper cryptographic signing
    const data = `${userId}:${moduleId}:${score}:${Date.now()}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Get training progress for user
   */
  async getTrainingProgress(userId: string): Promise<{
    overallProgress: number;
    completedModules: number;
    totalModules: number;
    records: UserTrainingRecord[];
    expiringCertificates: TrainingCertificate[];
  }> {
    const userRecords = this.userTrainingRecords.get(userId) || [];
    const completedModules = userRecords.filter(r => r.status === TrainingStatus.COMPLETED).length;
    const overallProgress = userRecords.length > 0 ? (completedModules / userRecords.length) * 100 : 0;

    // Find expiring certificates (within 30 days)
    const userCertificates = Array.from(this.certificates.values())
      .filter(c => c.userId === userId);
    const expiringCertificates = userCertificates.filter(c => {
      const daysUntilExpiry = (c.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    return {
      overallProgress,
      completedModules,
      totalModules: userRecords.length,
      records: userRecords,
      expiringCertificates
    };
  }

  /**
   * Get training compliance report
   */
  async getComplianceReport(): Promise<{
    totalUsers: number;
    compliantUsers: number;
    complianceRate: number;
    moduleCompletionRates: { moduleId: string; title: string; completionRate: number }[];
    expiringCertificates: number;
    overdueCertificates: number;
  }> {
    const allUserRecords = Array.from(this.userTrainingRecords.values()).flat();
    const totalUsers = new Set(allUserRecords.map(r => r.userId)).size;

    // Calculate compliance (users with all mandatory modules completed and not expired)
    const userCompliance = new Map<string, boolean>();
    const mandatoryModules = Array.from(this.trainingModules.values())
      .filter(m => m.mandatory)
      .map(m => m.id);

    Array.from(this.userTrainingRecords.entries()).forEach(([userId, records]) => {
      const mandatoryRecords = records.filter(r => mandatoryModules.includes(r.moduleId));
      const allCompleted = mandatoryRecords.every(r => 
        r.status === TrainingStatus.COMPLETED && 
        r.expiresAt && 
        r.expiresAt > new Date()
      );
      userCompliance.set(userId, allCompleted);
    });

    const compliantUsers = Array.from(userCompliance.values()).filter(Boolean).length;
    const complianceRate = totalUsers > 0 ? (compliantUsers / totalUsers) * 100 : 0;

    // Calculate module completion rates
    const moduleCompletionRates = Array.from(this.trainingModules.values()).map(module => {
      const moduleRecords = allUserRecords.filter(r => r.moduleId === module.id);
      const completedRecords = moduleRecords.filter(r => r.status === TrainingStatus.COMPLETED);
      const completionRate = moduleRecords.length > 0 ? (completedRecords.length / moduleRecords.length) * 100 : 0;

      return {
        moduleId: module.id,
        title: module.title,
        completionRate
      };
    });

    // Count expiring and overdue certificates
    const allCertificates = Array.from(this.certificates.values());
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringCertificates = allCertificates.filter(c => 
      c.expiresAt > now && c.expiresAt <= thirtyDaysFromNow
    ).length;

    const overdueCertificates = allCertificates.filter(c => 
      c.expiresAt <= now
    ).length;

    return {
      totalUsers,
      compliantUsers,
      complianceRate,
      moduleCompletionRates,
      expiringCertificates,
      overdueCertificates
    };
  }

  /**
   * Get available training modules for role
   */
  getModulesForRole(role: TrainingRole): TrainingModule[] {
    return Array.from(this.trainingModules.values())
      .filter(module => module.roles.includes(role))
      .sort((a, b) => {
        // Sort mandatory modules first, then by title
        if (a.mandatory && !b.mandatory) return -1;
        if (!a.mandatory && b.mandatory) return 1;
        return a.title.localeCompare(b.title);
      });
  }

  /**
   * Get training module by ID
   */
  getModule(moduleId: string): TrainingModule | undefined {
    return this.trainingModules.get(moduleId);
  }

  /**
   * Get user certificate
   */
  getCertificate(certificateId: string): TrainingCertificate | undefined {
    return this.certificates.get(certificateId);
  }
}