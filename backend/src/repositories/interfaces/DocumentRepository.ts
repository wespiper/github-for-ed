/**
 * Document Repository Interface
 * Privacy-aware document management with educational context
 */

import { BaseRepository } from './BaseRepository';
import { PrivacyContext } from '../../types/privacy';

export interface Document {
  id: string;
  studentId: string;
  assignmentId: string;
  title: string;
  content: string;
  version: number;
  status: 'draft' | 'in_progress' | 'submitted' | 'reviewed';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWithRelations extends Document {
  versions?: DocumentVersion[];
  collaborators?: DocumentCollaborator[];
  assignment?: any; // Will be defined when Assignment type is complete
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changes: Record<string, any>;
  createdAt: Date;
}

export interface DocumentCollaborator {
  id: string;
  documentId: string;
  userId: string;
  role: 'viewer' | 'editor' | 'reviewer';
  invitedAt: Date;
  acceptedAt?: Date;
}

export interface DocumentSearchOptions {
  studentId?: string;
  assignmentId?: string;
  status?: Document['status'];
  titleContains?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  byStatus: Record<Document['status'], number>;
  averageVersions: number;
  collaborationStats: {
    totalCollaborations: number;
    averageCollaborators: number;
  };
}

/**
 * Privacy-aware Document Repository
 */
export interface DocumentRepository extends BaseRepository<Document> {
  /**
   * Find documents by student with privacy context
   */
  findByStudent(
    studentId: string, 
    privacyContext: PrivacyContext,
    options?: DocumentSearchOptions
  ): Promise<DocumentWithRelations[]>;

  /**
   * Find documents by assignment with privacy filtering
   */
  findByAssignment(
    assignmentId: string,
    privacyContext: PrivacyContext,
    options?: DocumentSearchOptions
  ): Promise<DocumentWithRelations[]>;

  /**
   * Get document with version history (privacy-filtered)
   */
  findWithVersions(
    id: string,
    privacyContext: PrivacyContext
  ): Promise<DocumentWithRelations | null>;

  /**
   * Create new document version
   */
  createVersion(
    documentId: string,
    content: string,
    changes: Record<string, any>,
    privacyContext: PrivacyContext
  ): Promise<DocumentVersion>;

  /**
   * Add collaborator to document
   */
  addCollaborator(
    documentId: string,
    userId: string,
    role: DocumentCollaborator['role'],
    privacyContext: PrivacyContext
  ): Promise<DocumentCollaborator>;

  /**
   * Remove collaborator from document
   */
  removeCollaborator(
    documentId: string,
    userId: string,
    privacyContext: PrivacyContext
  ): Promise<void>;

  /**
   * Get document analytics with privacy aggregation
   */
  getAnalytics(
    filters: DocumentSearchOptions,
    privacyContext: PrivacyContext
  ): Promise<DocumentAnalytics>;

  /**
   * Search documents with privacy filtering
   */
  search(
    query: string,
    options: DocumentSearchOptions,
    privacyContext: PrivacyContext
  ): Promise<DocumentWithRelations[]>;
}