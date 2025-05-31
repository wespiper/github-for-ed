import { z } from 'zod';

// Document metadata and content types
export interface DocumentMetadata {
  path: string;
  title: string;
  type: DocumentType;
  category: DocumentCategory;
  lastModified: Date;
  size: number;
  tags: string[];
  dependencies: string[];
  summary?: string;
  priority: 'high' | 'medium' | 'low';
}

export type DocumentType = 
  | 'roadmap' 
  | 'philosophy' 
  | 'guide' 
  | 'reflection' 
  | 'insight' 
  | 'ticket' 
  | 'command' 
  | 'configuration'
  | 'migration'
  | 'test-result';

export type DocumentCategory = 
  | 'architecture'
  | 'ai-philosophy' 
  | 'development'
  | 'testing'
  | 'deployment'
  | 'learning'
  | 'project-management';

// Project context and state
export interface ProjectContext {
  id: string;
  name: string;
  rootPath: string;
  created: Date;
  lastAccessed: Date;
  currentPhase: string;
  goals: string[];
  activeTasks: Task[];
  documentIndex: DocumentMetadata[];
  recentActivity: ActivityEntry[];
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  relatedDocs: string[];
  dependencies: string[];
  assignedPhase?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityEntry {
  timestamp: Date;
  type: 'document_created' | 'document_updated' | 'task_completed' | 'phase_changed';
  description: string;
  relatedFiles: string[];
  metadata?: Record<string, any>;
}

// Search and query types
export interface SearchQuery {
  query: string;
  type?: DocumentType;
  category?: DocumentCategory;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeContent?: boolean;
}

export interface SearchResult {
  document: DocumentMetadata;
  relevanceScore: number;
  matchedContent?: {
    snippet: string;
    lineNumber: number;
  }[];
}

// Configuration schemas
export const ServerConfigSchema = z.object({
  projectRoot: z.string(),
  docsDirectory: z.string().default('docs'),
  claudeDirectory: z.string().default('.claude'),
  cacheDirectory: z.string().default('.cache'),
  maxIndexSize: z.number().default(10000),
  fileWatcherEnabled: z.boolean().default(true),
  indexingEnabled: z.boolean().default(true),
  allowedExtensions: z.array(z.string()).default(['.md', '.txt', '.json']),
  excludedPaths: z.array(z.string()).default(['node_modules', '.git', 'dist'])
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// MCP tool request/response types
export interface DocumentSearchRequest {
  query: string;
  filters?: Partial<SearchQuery>;
  limit?: number;
}

export interface DocumentReadRequest {
  path: string;
  includeMetadata?: boolean;
}

export interface ContextUpdateRequest {
  updates: Partial<ProjectContext>;
}

export interface TaskManagementRequest {
  action: 'create' | 'update' | 'delete' | 'list';
  task?: Partial<Task>;
  taskId?: string;
  filters?: {
    status?: Task['status'];
    priority?: Task['priority'];
    phase?: string;
  };
}

// File watching and indexing
export interface FileChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  path: string;
  timestamp: Date;
  metadata?: DocumentMetadata;
}

export interface IndexingProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  estimatedTimeRemaining: number;
  errors: string[];
}