import { PrismaClient } from '@prisma/client';
import {
  StudentRepository,
  AssignmentRepository,
  AIInteractionRepository
} from '../repositories/interfaces';
import {
  PrismaStudentRepository,
  PrismaAssignmentRepository,
  PrismaAIInteractionRepository
} from '../repositories/prisma';

/**
 * Repository Container - Dependency Injection Setup
 * Provides centralized repository instance management
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private prisma: PrismaClient;
  private repositories: Map<string, any> = new Map();

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeRepositories();
  }

  /**
   * Get singleton instance of repository container
   */
  static getInstance(prisma?: PrismaClient): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      if (!prisma) {
        throw new Error('Prisma client is required for first initialization');
      }
      RepositoryContainer.instance = new RepositoryContainer(prisma);
    }
    return RepositoryContainer.instance;
  }

  /**
   * Initialize all repository instances
   */
  private initializeRepositories(): void {
    this.repositories.set('student', new PrismaStudentRepository(this.prisma));
    this.repositories.set('assignment', new PrismaAssignmentRepository(this.prisma));
    this.repositories.set('aiInteraction', new PrismaAIInteractionRepository(this.prisma));
  }

  /**
   * Get Student Repository instance
   */
  getStudentRepository(): StudentRepository {
    return this.repositories.get('student');
  }

  /**
   * Get Assignment Repository instance
   */
  getAssignmentRepository(): AssignmentRepository {
    return this.repositories.get('assignment');
  }

  /**
   * Get AI Interaction Repository instance
   */
  getAIInteractionRepository(): AIInteractionRepository {
    return this.repositories.get('aiInteraction');
  }

  /**
   * Create repository set with transaction support
   */
  createTransactionalRepositories(prismaTransaction: any): {
    studentRepository: StudentRepository;
    assignmentRepository: AssignmentRepository;
    aiInteractionRepository: AIInteractionRepository;
  } {
    return {
      studentRepository: new PrismaStudentRepository(prismaTransaction),
      assignmentRepository: new PrismaAssignmentRepository(prismaTransaction),
      aiInteractionRepository: new PrismaAIInteractionRepository(prismaTransaction)
    };
  }

  /**
   * Reset container instance (useful for testing)
   */
  static reset(): void {
    RepositoryContainer.instance = null as any;
  }

  /**
   * Health check for all repositories
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    repositories: Record<string, boolean>;
  }> {
    const results: Record<string, boolean> = {};
    let allHealthy = true;

    try {
      // Test student repository
      const studentRepo = this.getStudentRepository();
      await studentRepo.count({});
      results.student = true;
    } catch (error) {
      console.error('Student repository health check failed:', error);
      results.student = false;
      allHealthy = false;
    }

    try {
      // Test assignment repository
      const assignmentRepo = this.getAssignmentRepository();
      await assignmentRepo.count({});
      results.assignment = true;
    } catch (error) {
      console.error('Assignment repository health check failed:', error);
      results.assignment = false;
      allHealthy = false;
    }

    try {
      // Test AI interaction repository
      const aiRepo = this.getAIInteractionRepository();
      await aiRepo.count({});
      results.aiInteraction = true;
    } catch (error) {
      console.error('AI interaction repository health check failed:', error);
      results.aiInteraction = false;
      allHealthy = false;
    }

    return {
      healthy: allHealthy,
      repositories: results
    };
  }
}

/**
 * Factory function for creating repository container
 */
export function createRepositoryContainer(prisma: PrismaClient): RepositoryContainer {
  return RepositoryContainer.getInstance(prisma);
}

/**
 * Utility function to get all repositories
 */
export function getRepositories(prisma?: PrismaClient): {
  studentRepository: StudentRepository;
  assignmentRepository: AssignmentRepository;
  aiInteractionRepository: AIInteractionRepository;
} {
  const container = RepositoryContainer.getInstance(prisma);
  
  return {
    studentRepository: container.getStudentRepository(),
    assignmentRepository: container.getAssignmentRepository(),
    aiInteractionRepository: container.getAIInteractionRepository()
  };
}

/**
 * Service Factory - Creates services with dependency injection
 */
export class ServiceFactory {
  private repositories: {
    studentRepository: StudentRepository;
    assignmentRepository: AssignmentRepository;
    aiInteractionRepository: AIInteractionRepository;
  };

  constructor(repositories: {
    studentRepository: StudentRepository;
    assignmentRepository: AssignmentRepository;
    aiInteractionRepository: AIInteractionRepository;
  }) {
    this.repositories = repositories;
  }

  /**
   * Create AI Boundary Service with injected repositories
   */
  createAIBoundaryService() {
    // Import here to avoid circular dependencies
    const { AIBoundaryService } = require('../services/AIBoundaryService.refactored');
    const { EducationalAIService } = require('../services/ai/EducationalAIService.refactored');
    
    const educationalAIService = new EducationalAIService(
      this.repositories.studentRepository,
      this.repositories.assignmentRepository,
      this.repositories.aiInteractionRepository
    );

    return new AIBoundaryService(
      this.repositories.studentRepository,
      this.repositories.assignmentRepository,
      this.repositories.aiInteractionRepository,
      educationalAIService
    );
  }

  /**
   * Create Educational AI Service with injected repositories
   */
  createEducationalAIService() {
    const { EducationalAIService } = require('../services/ai/EducationalAIService.refactored');
    
    return new EducationalAIService(
      this.repositories.studentRepository,
      this.repositories.assignmentRepository,
      this.repositories.aiInteractionRepository
    );
  }
}

/**
 * Global service factory instance
 */
let globalServiceFactory: ServiceFactory | null = null;

/**
 * Initialize global service factory
 */
export function initializeServiceFactory(prisma: PrismaClient): ServiceFactory {
  const repositories = getRepositories(prisma);
  globalServiceFactory = new ServiceFactory(repositories);
  return globalServiceFactory;
}

/**
 * Get global service factory instance
 */
export function getServiceFactory(): ServiceFactory {
  if (!globalServiceFactory) {
    throw new Error('Service factory not initialized. Call initializeServiceFactory first.');
  }
  return globalServiceFactory;
}