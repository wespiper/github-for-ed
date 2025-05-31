import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentMetadata, DocumentType, DocumentCategory, ServerConfig, FileChangeEvent } from '../types/index.js';

export class DocumentManager {
  private documentIndex: Map<string, DocumentMetadata> = new Map();
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.error('Initializing document index...');
    await this.buildDocumentIndex();
    console.error(`Indexed ${this.documentIndex.size} documents`);
  }

  private async buildDocumentIndex(): Promise<void> {
    const docsPath = path.join(this.config.projectRoot, this.config.docsDirectory);
    const claudePath = path.join(this.config.projectRoot, this.config.claudeDirectory);

    // Index main docs directory
    if (await this.pathExists(docsPath)) {
      await this.indexDirectory(docsPath, 'docs');
    }

    // Index .claude directory
    if (await this.pathExists(claudePath)) {
      await this.indexDirectory(claudePath, 'claude');
    }
  }

  private async indexDirectory(dirPath: string, context: 'docs' | 'claude'): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.config.projectRoot, fullPath);

        if (this.shouldExcludePath(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.indexDirectory(fullPath, context);
        } else if (entry.isFile() && this.isAllowedExtension(entry.name)) {
          const metadata = await this.createDocumentMetadata(fullPath, relativePath, context);
          if (metadata) {
            this.documentIndex.set(relativePath, metadata);
          }
        }
      }
    } catch (error) {
      console.error(`Error indexing directory ${dirPath}:`, error);
    }
  }

  private async createDocumentMetadata(
    fullPath: string, 
    relativePath: string, 
    context: 'docs' | 'claude'
  ): Promise<DocumentMetadata | null> {
    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      const title = this.extractTitle(content, path.basename(relativePath));
      const type = this.determineDocumentType(relativePath, content);
      const category = this.determineDocumentCategory(relativePath, content, type);
      const tags = this.extractTags(content, relativePath);
      const dependencies = this.extractDependencies(content);
      const summary = this.generateSummary(content);
      const priority = this.determinePriority(type, category, relativePath);

      return {
        path: relativePath,
        title,
        type,
        category,
        lastModified: stats.mtime,
        size: stats.size,
        tags,
        dependencies,
        summary,
        priority
      };
    } catch (error) {
      console.error(`Error creating metadata for ${relativePath}:`, error);
      return null;
    }
  }

  private extractTitle(content: string, filename: string): string {
    // Try to extract title from markdown header
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Fallback to filename without extension
    return path.parse(filename).name.replace(/[-_]/g, ' ');
  }

  private determineDocumentType(relativePath: string, content: string): DocumentType {
    const pathLower = relativePath.toLowerCase();

    // Path-based detection first (higher priority)
    if (pathLower.includes('roadmap') || pathLower.includes('phase')) return 'roadmap';
    if (pathLower.includes('guide') || pathLower.includes('test')) return 'guide';
    if (pathLower.includes('reflection')) return 'reflection';
    if (pathLower.includes('insight') || pathLower.includes('learning')) return 'insight';
    if (pathLower.includes('ticket')) return 'ticket';
    if (pathLower.includes('command')) return 'command';
    if (pathLower.includes('migration')) return 'migration';
    if (pathLower.includes('config') || pathLower.endsWith('.json')) return 'configuration';
    if (pathLower.includes('test-result') || pathLower.includes('sprint')) return 'test-result';
    
    // Content-based detection as fallback
    if (pathLower.includes('philosophy') || content.includes('philosophy')) return 'philosophy';

    return 'guide'; // default
  }

  private determineDocumentCategory(
    relativePath: string, 
    content: string, 
    type: DocumentType
  ): DocumentCategory {
    const pathLower = relativePath.toLowerCase();
    const contentLower = content.toLowerCase();

    if (pathLower.includes('architecture') || contentLower.includes('architecture')) return 'architecture';
    if (type === 'philosophy' || contentLower.includes('ai') || contentLower.includes('bounded enhancement')) return 'ai-philosophy';
    if (pathLower.includes('test') || contentLower.includes('testing')) return 'testing';
    if (pathLower.includes('deploy') || contentLower.includes('deployment')) return 'deployment';
    if (type === 'reflection' || type === 'insight') return 'learning';
    if (type === 'ticket' || pathLower.includes('sprint')) return 'project-management';

    return 'development'; // default
  }

  private extractTags(content: string, relativePath: string): string[] {
    const tags: Set<string> = new Set();

    // Extract from path
    const pathParts = relativePath.split('/');
    pathParts.forEach(part => {
      if (part !== '.' && part !== '..' && !part.includes('.')) {
        tags.add(part.toLowerCase());
      }
    });

    // Extract common technical terms
    const technicalTerms = [
      'ai', 'typescript', 'react', 'node', 'postgresql', 'prisma',
      'testing', 'architecture', 'frontend', 'backend', 'api',
      'authentication', 'education', 'writing', 'analytics'
    ];

    const contentLower = content.toLowerCase();
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.add(term);
      }
    });

    return Array.from(tags).slice(0, 10); // limit tags
  }

  private extractDependencies(content: string): string[] {
    const dependencies: Set<string> = new Set();

    // Look for file references
    const fileReferences = content.match(/[\w\-\.\/]+\.(?:md|ts|js|json|tsx|jsx)/g);
    if (fileReferences) {
      fileReferences.forEach(ref => {
        if (!ref.startsWith('http')) {
          dependencies.add(ref);
        }
      });
    }

    // Look for explicit dependencies or references
    const dependencyPatterns = [
      /depends on:?\s*(.*)/gi,
      /requires:?\s*(.*)/gi,
      /see also:?\s*(.*)/gi,
      /related:?\s*(.*)/gi
    ];

    dependencyPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const deps = match.split(/[,;]/).map(d => d.trim()).filter(d => d.length > 0);
          deps.forEach(dep => dependencies.add(dep));
        });
      }
    });

    return Array.from(dependencies).slice(0, 20); // limit dependencies
  }

  private generateSummary(content: string): string {
    // Extract first paragraph or first few sentences
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Skip metadata and headers
    const contentStart = lines.findIndex(line => 
      !line.startsWith('#') && 
      !line.startsWith('*') && 
      !line.startsWith('-') &&
      !line.includes(':') &&
      line.length > 50
    );

    if (contentStart >= 0) {
      const summary = lines.slice(contentStart, contentStart + 3).join(' ');
      return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
    }

    return 'No summary available';
  }

  private determinePriority(
    type: DocumentType, 
    category: DocumentCategory, 
    relativePath: string
  ): 'high' | 'medium' | 'low' {
    if (type === 'roadmap' || category === 'architecture') return 'high';
    if (type === 'philosophy' || category === 'ai-philosophy') return 'high';
    if (type === 'guide' || category === 'testing') return 'medium';
    if (type === 'reflection' || type === 'insight') return 'medium';
    if (relativePath.includes('current') || relativePath.includes('active')) return 'high';
    
    return 'low';
  }

  private shouldExcludePath(relativePath: string): boolean {
    return this.config.excludedPaths.some(excluded => 
      relativePath.includes(excluded)
    );
  }

  private isAllowedExtension(filename: string): boolean {
    const ext = path.extname(filename);
    return this.config.allowedExtensions.includes(ext);
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Public API methods
  async readDocument(docPath: string, includeMetadata: boolean = true): Promise<any> {
    const fullPath = path.isAbsolute(docPath) 
      ? docPath 
      : path.join(this.config.projectRoot, docPath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const result: any = { content };

      if (includeMetadata) {
        const relativePath = path.relative(this.config.projectRoot, fullPath);
        result.metadata = this.documentIndex.get(relativePath);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to read document ${docPath}: ${error}`);
    }
  }

  async listDocuments(filters: {
    type?: DocumentType;
    category?: DocumentCategory;
    recent?: boolean;
  } = {}): Promise<DocumentMetadata[]> {
    let documents = Array.from(this.documentIndex.values());

    if (filters.type) {
      documents = documents.filter(doc => doc.type === filters.type);
    }

    if (filters.category) {
      documents = documents.filter(doc => doc.category === filters.category);
    }

    if (filters.recent) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      documents = documents.filter(doc => doc.lastModified > oneWeekAgo);
    }

    // Sort by priority and last modified
    documents.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.lastModified.getTime() - a.lastModified.getTime();
    });

    return documents;
  }

  async analyzeRelationships(
    documentPath?: string, 
    includeContentAnalysis: boolean = false
  ): Promise<any> {
    if (documentPath) {
      // Analyze specific document
      const doc = this.documentIndex.get(documentPath);
      if (!doc) {
        throw new Error(`Document not found: ${documentPath}`);
      }

      const related = this.findRelatedDocuments(doc);
      return {
        document: doc,
        directDependencies: doc.dependencies,
        relatedDocuments: related,
        ...(includeContentAnalysis && { contentAnalysis: await this.analyzeContent(documentPath) })
      };
    } else {
      // Analyze all relationships
      const relationships = new Map<string, string[]>();
      
      for (const [path, doc] of this.documentIndex) {
        const related = this.findRelatedDocuments(doc);
        relationships.set(path, related.map(r => r.path));
      }

      return {
        totalDocuments: this.documentIndex.size,
        relationships: Object.fromEntries(relationships),
        topConnectedDocuments: this.getTopConnectedDocuments(),
      };
    }
  }

  private findRelatedDocuments(doc: DocumentMetadata): DocumentMetadata[] {
    const related: DocumentMetadata[] = [];

    for (const [path, otherDoc] of this.documentIndex) {
      if (path === doc.path) continue;

      let score = 0;

      // Same category
      if (otherDoc.category === doc.category) score += 2;
      
      // Same type
      if (otherDoc.type === doc.type) score += 1;

      // Shared tags
      const sharedTags = doc.tags.filter(tag => otherDoc.tags.includes(tag));
      score += sharedTags.length;

      // Dependency relationships
      if (doc.dependencies.some(dep => otherDoc.path.includes(dep)) ||
          otherDoc.dependencies.some(dep => doc.path.includes(dep))) {
        score += 3;
      }

      if (score > 0) {
        related.push({ ...otherDoc, relevanceScore: score } as any);
      }
    }

    return related
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  private getTopConnectedDocuments(): Array<{ path: string; connections: number }> {
    const connectionCounts = new Map<string, number>();

    for (const [path, doc] of this.documentIndex) {
      let connections = 0;
      
      // Count how many times this document is referenced
      for (const [otherPath, otherDoc] of this.documentIndex) {
        if (otherPath !== path) {
          if (otherDoc.dependencies.some(dep => path.includes(dep))) {
            connections++;
          }
        }
      }

      connectionCounts.set(path, connections);
    }

    return Array.from(connectionCounts.entries())
      .map(([path, connections]) => ({ path, connections }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);
  }

  private async analyzeContent(documentPath: string): Promise<any> {
    // Placeholder for advanced content analysis
    // Could include sentiment analysis, topic modeling, etc.
    return {
      wordCount: 0,
      readingTime: 0,
      topics: [],
      sentiment: 'neutral'
    };
  }

  async handleFileChange(event: FileChangeEvent): Promise<void> {
    const relativePath = path.relative(this.config.projectRoot, event.path);

    if (event.type === 'deleted') {
      this.documentIndex.delete(relativePath);
    } else if (this.isAllowedExtension(event.path) && !this.shouldExcludePath(relativePath)) {
      const context = relativePath.startsWith('.claude') ? 'claude' : 'docs';
      const metadata = await this.createDocumentMetadata(event.path, relativePath, context);
      if (metadata) {
        this.documentIndex.set(relativePath, metadata);
      }
    }
  }
}