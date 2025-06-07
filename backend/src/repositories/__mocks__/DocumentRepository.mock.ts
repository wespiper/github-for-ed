/**
 * Mock Document Repository Implementation
 * For testing privacy-aware document operations
 */

import { 
  DocumentRepository, 
  Document, 
  DocumentWithRelations, 
  DocumentVersion,
  DocumentCollaborator,
  DocumentSearchOptions,
  DocumentAnalytics
} from '../interfaces/DocumentRepository';
import { PrivacyContext } from '../../types/privacy';
import { FindManyOptions, CreateData, UpdateData } from '../interfaces/BaseRepository';

export class MockDocumentRepository implements DocumentRepository {
  private documents: Map<string, DocumentWithRelations> = new Map();
  private versions: Map<string, DocumentVersion[]> = new Map();
  private collaborators: Map<string, DocumentCollaborator[]> = new Map();
  private privacyLogs: Array<{ operation: string; context: PrivacyContext; timestamp: Date }> = [];

  constructor() {
    this.seedTestData();
  }

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async findMany(options?: FindManyOptions<Document>): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async create(data: CreateData<Document>): Promise<Document> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const document: DocumentWithRelations = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: [],
      collaborators: []
    };
    
    this.documents.set(id, document);
    this.versions.set(id, []);
    this.collaborators.set(id, []);
    
    return document;
  }

  async update(id: string, data: UpdateData<Document>): Promise<Document> {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error(`Document with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.documents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
    this.versions.delete(id);
    this.collaborators.delete(id);
  }

  async count(options?: any): Promise<number> {
    return this.documents.size;
  }

  async findByStudent(
    studentId: string, 
    privacyContext: PrivacyContext,
    options?: DocumentSearchOptions
  ): Promise<DocumentWithRelations[]> {
    this.logPrivacyOperation('findByStudent', privacyContext);
    
    return Array.from(this.documents.values())
      .filter(doc => doc.studentId === studentId)
      .filter(doc => this.applySearchFilters(doc, options));
  }

  async findByAssignment(
    assignmentId: string,
    privacyContext: PrivacyContext,
    options?: DocumentSearchOptions
  ): Promise<DocumentWithRelations[]> {
    this.logPrivacyOperation('findByAssignment', privacyContext);
    
    return Array.from(this.documents.values())
      .filter(doc => doc.assignmentId === assignmentId)
      .filter(doc => this.applySearchFilters(doc, options));
  }

  async findWithVersions(
    id: string,
    privacyContext: PrivacyContext
  ): Promise<DocumentWithRelations | null> {
    this.logPrivacyOperation('findWithVersions', privacyContext);
    
    const document = this.documents.get(id);
    if (!document) return null;

    return {
      ...document,
      versions: this.versions.get(id) || [],
      collaborators: this.collaborators.get(id) || []
    };
  }

  async createVersion(
    documentId: string,
    content: string,
    changes: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<DocumentVersion> {
    this.logPrivacyOperation('createVersion', privacyContext);
    
    const versions = this.versions.get(documentId) || [];
    const version: DocumentVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      version: versions.length + 1,
      content,
      changes,
      createdAt: new Date()
    };

    versions.push(version);
    this.versions.set(documentId, versions);

    // Update document content and version
    const document = this.documents.get(documentId);
    if (document) {
      document.content = content;
      document.version = version.version;
      document.updatedAt = new Date();
    }

    return version;
  }

  async addCollaborator(
    documentId: string,
    userId: string,
    role: DocumentCollaborator['role'],
    privacyContext: PrivacyContext
  ): Promise<DocumentCollaborator> {
    this.logPrivacyOperation('addCollaborator', privacyContext);
    
    const collaborators = this.collaborators.get(documentId) || [];
    const collaborator: DocumentCollaborator = {
      id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      userId,
      role,
      invitedAt: new Date(),
      acceptedAt: new Date() // Auto-accept for mock
    };

    collaborators.push(collaborator);
    this.collaborators.set(documentId, collaborators);

    return collaborator;
  }

  async removeCollaborator(
    documentId: string,
    userId: string,
    privacyContext: PrivacyContext
  ): Promise<void> {
    this.logPrivacyOperation('removeCollaborator', privacyContext);
    
    const collaborators = this.collaborators.get(documentId) || [];
    const filtered = collaborators.filter(c => c.userId !== userId);
    this.collaborators.set(documentId, filtered);
  }

  async getAnalytics(
    filters: DocumentSearchOptions,
    privacyContext: PrivacyContext
  ): Promise<DocumentAnalytics> {
    this.logPrivacyOperation('getAnalytics', privacyContext);
    
    const documents = Array.from(this.documents.values())
      .filter(doc => this.applySearchFilters(doc, filters));

    const statusCounts = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<Document['status'], number>);

    const totalVersions = documents.reduce((acc, doc) => acc + doc.version, 0);
    const totalCollaborations = Array.from(this.collaborators.values())
      .reduce((acc, collabs) => acc + collabs.length, 0);

    return {
      totalDocuments: documents.length,
      byStatus: statusCounts,
      averageVersions: documents.length > 0 ? totalVersions / documents.length : 0,
      collaborationStats: {
        totalCollaborations,
        averageCollaborators: documents.length > 0 ? totalCollaborations / documents.length : 0
      }
    };
  }

  async search(
    query: string,
    options: DocumentSearchOptions,
    privacyContext: PrivacyContext
  ): Promise<DocumentWithRelations[]> {
    this.logPrivacyOperation('search', privacyContext);
    
    const searchLower = query.toLowerCase();
    return Array.from(this.documents.values())
      .filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.content.toLowerCase().includes(searchLower)
      )
      .filter(doc => this.applySearchFilters(doc, options));
  }

  // Test utilities
  getPrivacyLogs() {
    return this.privacyLogs;
  }

  clearPrivacyLogs() {
    this.privacyLogs = [];
  }

  reset() {
    this.documents.clear();
    this.versions.clear();
    this.collaborators.clear();
    this.privacyLogs = [];
    this.seedTestData();
  }

  private logPrivacyOperation(operation: string, context: PrivacyContext) {
    this.privacyLogs.push({
      operation,
      context,
      timestamp: new Date()
    });
  }

  private applySearchFilters(doc: Document, options?: DocumentSearchOptions): boolean {
    if (!options) return true;

    if (options.studentId && doc.studentId !== options.studentId) return false;
    if (options.assignmentId && doc.assignmentId !== options.assignmentId) return false;
    if (options.status && doc.status !== options.status) return false;
    if (options.titleContains && !doc.title.toLowerCase().includes(options.titleContains.toLowerCase())) return false;
    if (options.fromDate && doc.createdAt < options.fromDate) return false;
    if (options.toDate && doc.createdAt > options.toDate) return false;

    return true;
  }

  private seedTestData() {
    // Add some test documents
    const testDocs = [
      {
        studentId: 'student_1',
        assignmentId: 'assignment_1',
        title: 'My First Essay',
        content: 'This is the content of my first essay...',
        version: 1,
        status: 'draft' as const
      },
      {
        studentId: 'student_1',
        assignmentId: 'assignment_1',
        title: 'Research Paper',
        content: 'This is my research paper content...',
        version: 3,
        status: 'in_progress' as const
      },
      {
        studentId: 'student_2',
        assignmentId: 'assignment_2',
        title: 'Analysis Report',
        content: 'My analysis of the topic...',
        version: 2,
        status: 'submitted' as const
      }
    ];

    testDocs.forEach(doc => {
      this.create(doc);
    });
  }
}