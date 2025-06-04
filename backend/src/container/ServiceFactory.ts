/**
 * Service Factory for Dependency Injection
 */

import { EventBus, getEventBus } from '../events/EventBus';
import { CacheService } from '../cache/CacheService';
import { createCacheService, defaultCacheConfig } from '../config/cache';
import { MessageQueue } from '../messaging/MessageQueue';
import { createMessageQueue, defaultMessagingConfig } from '../config/messaging';
import { WritingAnalysisMCPClient } from '../services/mcp/WritingAnalysisMCPClient';
import { StudentProfilingMCPClient } from '../services/mcp/StudentProfilingMCPClient';
import { EducatorAlertsMCPClient } from '../services/mcp/EducatorAlertsMCPClient';
import { EducationalAIValidatorMCPClient } from '../services/mcp/EducationalAIValidatorMCPClient';
import { AcademicIntegrityService } from '../services/AcademicIntegrityService';

// Repositories
import { 
  WritingSessionRepository,
  DocumentRepository,
  StudentProfilingRepository,
  AssignmentRepository,
  LearningAnalyticsRepository,
  StudentRepository,
  AIInteractionRepository,
  EducatorAlertsRepository,
  AcademicIntegrityRepository
} from '../repositories/interfaces';
import { PrismaWritingSessionRepository } from '../repositories/WritingSessionRepository';

// Mock repositories for development
import { MockDocumentRepository } from '../repositories/__mocks__/DocumentRepository.mock';
import { MockLearningAnalyticsRepository } from '../repositories/__mocks__/LearningAnalyticsRepository.mock';
import { MockInterventionRepository } from '../repositories/__mocks__/InterventionRepository.mock';
import { MockStudentProfilingRepository } from '../repositories/__mocks__/StudentProfilingRepository.mock';
import { MockEducatorAlertsRepository } from '../repositories/__mocks__/EducatorAlertsRepository.mock';
import { MockAcademicIntegrityRepository } from '../repositories/__mocks__/AcademicIntegrityRepository.mock';

/**
 * Service container interface
 */
export interface ServiceContainer {
  // Infrastructure
  eventBus: EventBus;
  cache: CacheService;
  messageQueue: MessageQueue;
  mcpClient: WritingAnalysisMCPClient;
  studentProfilingMCPClient: StudentProfilingMCPClient;
  educatorAlertsMCPClient: EducatorAlertsMCPClient;
  educationalAIValidatorMCPClient: EducationalAIValidatorMCPClient;
  
  // Services
  academicIntegrityService: AcademicIntegrityService;
  
  // Repositories
  writingSessionRepository: WritingSessionRepository;
  documentRepository: DocumentRepository;
  studentRepository?: StudentRepository;
  studentProfilingRepository: StudentProfilingRepository;
  assignmentRepository?: AssignmentRepository;
  learningAnalyticsRepository: LearningAnalyticsRepository;
  interventionRepository: InterventionRepository;
  educatorAlertsRepository: EducatorAlertsRepository;
  academicIntegrityRepository: AcademicIntegrityRepository;
}

/**
 * Service factory singleton
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private container: Partial<ServiceContainer> = {};
  private initialized = false;

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize infrastructure
    this.container.eventBus = getEventBus();
    this.container.cache = createCacheService(defaultCacheConfig);
    this.container.messageQueue = createMessageQueue(defaultMessagingConfig);
    this.container.mcpClient = new WritingAnalysisMCPClient();
    this.container.studentProfilingMCPClient = new StudentProfilingMCPClient();
    this.container.educatorAlertsMCPClient = new EducatorAlertsMCPClient();
    this.container.educationalAIValidatorMCPClient = new EducationalAIValidatorMCPClient();

    // Initialize repositories
    this.container.writingSessionRepository = new PrismaWritingSessionRepository();
    this.container.documentRepository = new MockDocumentRepository(); // Using mock for now
    this.container.studentProfilingRepository = new MockStudentProfilingRepository(); // Using mock for now
    this.container.learningAnalyticsRepository = new MockLearningAnalyticsRepository(); // Using mock for now
    this.container.interventionRepository = new MockInterventionRepository(); // Using mock for now
    this.container.educatorAlertsRepository = new MockEducatorAlertsRepository(); // Using mock for now
    this.container.academicIntegrityRepository = new MockAcademicIntegrityRepository(); // Using mock for now
    
    // Initialize services
    this.container.academicIntegrityService = new AcademicIntegrityService();
    
    // Connect to external services
    if (defaultCacheConfig.type === 'redis') {
      await (this.container.cache as any).connect();
    }
    
    if (defaultMessagingConfig.type === 'rabbitmq') {
      await this.container.messageQueue.connect();
    }

    // Connect to MCP servers
    await this.container.mcpClient.connect();
    await this.container.studentProfilingMCPClient.connect();

    this.initialized = true;
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    if (!this.container.eventBus) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.eventBus;
  }

  /**
   * Get Writing Analysis MCP client
   */
  getMCPClient(): WritingAnalysisMCPClient {
    if (!this.container.mcpClient) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.mcpClient;
  }

  /**
   * Get Student Profiling MCP client
   */
  getStudentProfilingMCPClient(): StudentProfilingMCPClient {
    if (!this.container.studentProfilingMCPClient) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.studentProfilingMCPClient;
  }

  /**
   * Get educator alerts MCP client
   */
  getEducatorAlertsMCPClient(): EducatorAlertsMCPClient {
    if (!this.container.educatorAlertsMCPClient) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.educatorAlertsMCPClient;
  }

  /**
   * Get educational AI validator MCP client
   */
  getEducationalAIValidatorMCPClient(): EducationalAIValidatorMCPClient {
    if (!this.container.educationalAIValidatorMCPClient) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.educationalAIValidatorMCPClient;
  }

  /**
   * Get cache service
   */
  getCache(): CacheService {
    if (!this.container.cache) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.cache;
  }

  /**
   * Get message queue
   */
  getMessageQueue(): MessageQueue {
    if (!this.container.messageQueue) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.messageQueue;
  }

  /**
   * Get writing session repository
   */
  getWritingSessionRepository(): WritingSessionRepository {
    if (!this.container.writingSessionRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.writingSessionRepository;
  }

  /**
   * Get document repository
   */
  getDocumentRepository(): DocumentRepository {
    if (!this.container.documentRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.documentRepository;
  }

  /**
   * Get student profiling repository
   */
  getStudentProfilingRepository(): StudentProfilingRepository {
    if (!this.container.studentProfilingRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.studentProfilingRepository;
  }

  /**
   * Get learning analytics repository
   */
  getLearningAnalyticsRepository(): LearningAnalyticsRepository {
    if (!this.container.learningAnalyticsRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.learningAnalyticsRepository;
  }

  /**
   * Get intervention repository
   */
  getInterventionRepository(): InterventionRepository {
    if (!this.container.interventionRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.interventionRepository;
  }

  /**
   * Get educator alerts repository
   */
  getEducatorAlertsRepository(): EducatorAlertsRepository {
    if (!this.container.educatorAlertsRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.educatorAlertsRepository;
  }

  /**
   * Get academic integrity repository
   */
  getAcademicIntegrityRepository(): AcademicIntegrityRepository {
    if (!this.container.academicIntegrityRepository) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.academicIntegrityRepository;
  }

  /**
   * Get academic integrity service
   */
  getAcademicIntegrityService(): AcademicIntegrityService {
    if (!this.container.academicIntegrityService) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.academicIntegrityService;
  }

  // Note: Reflection repositories not implemented yet
  // Will be added when Reflection model is added to schema

  /**
   * Set custom repository implementation (for testing)
   */
  setWritingSessionRepository(repo: WritingSessionRepository): void {
    this.container.writingSessionRepository = repo;
  }

  /**
   * Reset factory (for testing)
   */
  reset(): void {
    this.container = {};
    this.initialized = false;
  }
}