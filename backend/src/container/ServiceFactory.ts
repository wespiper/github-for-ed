/**
 * Service Factory for Dependency Injection
 */

import { EventBus, getEventBus } from '../events/EventBus';
import { CacheService } from '../cache/CacheService';
import { createCacheService, defaultCacheConfig } from '../config/cache';
import { MessageQueue } from '../messaging/MessageQueue';
import { createMessageQueue, defaultMessagingConfig } from '../config/messaging';
import { WritingAnalysisMCPClient } from '../services/mcp/WritingAnalysisMCPClient';

// Repositories
import { 
  WritingSessionRepository,
  DocumentRepository,
  StudentProfileRepository,
  AssignmentRepository,
  LearningAnalyticsRepository,
  InterventionRepository
} from '../repositories/interfaces';
import { PrismaWritingSessionRepository } from '../repositories/WritingSessionRepository';

// Mock repositories for development
import { MockDocumentRepository } from '../repositories/__mocks__/DocumentRepository.mock';
import { MockLearningAnalyticsRepository } from '../repositories/__mocks__/LearningAnalyticsRepository.mock';
import { MockInterventionRepository } from '../repositories/__mocks__/InterventionRepository.mock';

/**
 * Service container interface
 */
export interface ServiceContainer {
  // Infrastructure
  eventBus: EventBus;
  cache: CacheService;
  messageQueue: MessageQueue;
  mcpClient: WritingAnalysisMCPClient;
  
  // Repositories
  writingSessionRepository: WritingSessionRepository;
  documentRepository: DocumentRepository;
  studentProfileRepository?: StudentProfileRepository;
  assignmentRepository?: AssignmentRepository;
  learningAnalyticsRepository: LearningAnalyticsRepository;
  interventionRepository: InterventionRepository;
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

    // Initialize repositories
    this.container.writingSessionRepository = new PrismaWritingSessionRepository();
    this.container.documentRepository = new MockDocumentRepository(); // Using mock for now
    this.container.learningAnalyticsRepository = new MockLearningAnalyticsRepository(); // Using mock for now
    this.container.interventionRepository = new MockInterventionRepository(); // Using mock for now
    
    // Connect to external services
    if (defaultCacheConfig.type === 'redis') {
      await (this.container.cache as any).connect();
    }
    
    if (defaultMessagingConfig.type === 'rabbitmq') {
      await this.container.messageQueue.connect();
    }

    // Connect to MCP server
    await this.container.mcpClient.connect();

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
   * Get MCP client
   */
  getMCPClient(): WritingAnalysisMCPClient {
    if (!this.container.mcpClient) {
      throw new Error('ServiceFactory not initialized');
    }
    return this.container.mcpClient;
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