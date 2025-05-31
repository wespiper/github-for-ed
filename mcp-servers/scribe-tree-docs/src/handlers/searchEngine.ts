import * as fs from 'fs/promises';
import * as path from 'path';
import { SearchQuery, SearchResult, DocumentMetadata, ServerConfig, FileChangeEvent } from '../types/index.js';

interface SearchIndex {
  documentPath: string;
  content: string;
  metadata: DocumentMetadata;
  tokens: string[];
  lastIndexed: Date;
}

export class SearchEngine {
  private searchIndex: Map<string, SearchIndex> = new Map();
  private config: ServerConfig;
  private indexFilePath: string;

  constructor(config: ServerConfig) {
    this.config = config;
    this.indexFilePath = path.join(config.projectRoot, config.cacheDirectory, 'search-index.json');
  }

  async initialize(): Promise<void> {
    await this.loadSearchIndex();
    if (this.config.indexingEnabled) {
      await this.buildSearchIndex();
    }
  }

  private async loadSearchIndex(): Promise<void> {
    try {
      const indexData = await fs.readFile(this.indexFilePath, 'utf-8');
      const parsed = JSON.parse(indexData);
      
      // Reconstruct search index from saved data
      for (const [path, indexEntry] of Object.entries(parsed as Record<string, any>)) {
        this.searchIndex.set(path, {
          ...indexEntry,
          lastIndexed: new Date(indexEntry.lastIndexed),
          metadata: {
            ...indexEntry.metadata,
            lastModified: new Date(indexEntry.metadata.lastModified)
          }
        });
      }
      
      console.error(`Loaded search index with ${this.searchIndex.size} documents`);
    } catch (error) {
      console.error('Search index not found, will build new index');
    }
  }

  private async saveSearchIndex(): Promise<void> {
    try {
      const serializable = Object.fromEntries(this.searchIndex);
      await fs.writeFile(this.indexFilePath, JSON.stringify(serializable, null, 2));
    } catch (error) {
      console.error('Failed to save search index:', error);
    }
  }

  private async buildSearchIndex(): Promise<void> {
    const docsPath = path.join(this.config.projectRoot, this.config.docsDirectory);
    const claudePath = path.join(this.config.projectRoot, this.config.claudeDirectory);

    if (await this.pathExists(docsPath)) {
      await this.indexDirectory(docsPath);
    }

    if (await this.pathExists(claudePath)) {
      await this.indexDirectory(claudePath);
    }

    await this.saveSearchIndex();
    console.error(`Built search index with ${this.searchIndex.size} documents`);
  }

  private async indexDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.config.projectRoot, fullPath);

        if (this.shouldExcludePath(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.indexDirectory(fullPath);
        } else if (entry.isFile() && this.isAllowedExtension(entry.name)) {
          await this.indexDocument(fullPath, relativePath);
        }
      }
    } catch (error) {
      console.error(`Error indexing directory ${dirPath}:`, error);
    }
  }

  private async indexDocument(fullPath: string, relativePath: string): Promise<void> {
    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Check if document needs reindexing
      const existingIndex = this.searchIndex.get(relativePath);
      if (existingIndex && existingIndex.lastIndexed >= stats.mtime) {
        return; // Skip if already indexed and not modified
      }

      const metadata = await this.createDocumentMetadata(fullPath, relativePath, content, stats);
      const tokens = this.tokenizeContent(content);

      this.searchIndex.set(relativePath, {
        documentPath: relativePath,
        content,
        metadata,
        tokens,
        lastIndexed: new Date()
      });

    } catch (error) {
      console.error(`Error indexing document ${relativePath}:`, error);
    }
  }

  private async createDocumentMetadata(
    fullPath: string, 
    relativePath: string, 
    content: string,
    stats: Awaited<ReturnType<typeof fs.stat>>
  ): Promise<DocumentMetadata> {
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
      size: Number(stats.size),
      tags,
      dependencies,
      summary,
      priority
    };
  }

  private tokenizeContent(content: string): string[] {
    // Remove markdown syntax and special characters
    const cleanContent = content
      .replace(/[#*`_\[\]()]/g, ' ')
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .toLowerCase();

    // Split into words and filter out common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return cleanContent
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
  }

  async search(query: SearchQuery, limit: number = 10): Promise<SearchResult[]> {
    const searchTerms = this.tokenizeContent(query.query);
    const results: SearchResult[] = [];

    for (const [path, indexEntry] of this.searchIndex) {
      // Apply filters
      if (query.type && indexEntry.metadata.type !== query.type) continue;
      if (query.category && indexEntry.metadata.category !== query.category) continue;
      if (query.tags && !query.tags.some(tag => indexEntry.metadata.tags.includes(tag))) continue;
      
      if (query.dateRange) {
        const docDate = indexEntry.metadata.lastModified;
        if (docDate < query.dateRange.start || docDate > query.dateRange.end) continue;
      }

      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(searchTerms, indexEntry, query.query);
      
      if (relevanceScore > 0) {
        const result: SearchResult = {
          document: indexEntry.metadata,
          relevanceScore
        };

        // Add matched content snippets if requested
        if (query.includeContent) {
          result.matchedContent = this.extractMatchedContent(query.query, indexEntry.content);
        }

        results.push(result);
      }
    }

    // Sort by relevance score (descending) and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private calculateRelevanceScore(searchTerms: string[], indexEntry: SearchIndex, originalQuery: string): number {
    let score = 0;
    const { tokens, metadata } = indexEntry;

    // Exact phrase matching (highest weight)
    if (indexEntry.content.toLowerCase().includes(originalQuery.toLowerCase())) {
      score += 10;
    }

    // Title matching (high weight)
    const titleWords = this.tokenizeContent(metadata.title);
    const titleMatches = searchTerms.filter(term => titleWords.includes(term)).length;
    score += titleMatches * 3;

    // Tag matching (medium-high weight)
    const tagMatches = searchTerms.filter(term => 
      metadata.tags.some(tag => tag.includes(term) || term.includes(tag))
    ).length;
    score += tagMatches * 2;

    // Content token matching (base weight)
    const tokenMatches = searchTerms.filter(term => tokens.includes(term)).length;
    score += tokenMatches;

    // Partial word matching (lower weight)
    const partialMatches = searchTerms.reduce((count, term) => {
      const partials = tokens.filter(token => token.includes(term) || term.includes(token)).length;
      return count + partials * 0.5;
    }, 0);
    score += partialMatches;

    // Priority boost
    const priorityMultiplier = { high: 1.5, medium: 1.2, low: 1.0 };
    score *= priorityMultiplier[metadata.priority];

    // Recency boost (documents modified in last 30 days get slight boost)
    const daysSinceModified = (Date.now() - metadata.lastModified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified <= 30) {
      score *= 1.1;
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  private extractMatchedContent(query: string, content: string): Array<{ snippet: string; lineNumber: number }> {
    const lines = content.split('\n');
    const matches: Array<{ snippet: string; lineNumber: number }> = [];
    const queryTerms = this.tokenizeContent(query);

    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      const hasMatch = queryTerms.some(term => lineLower.includes(term)) || 
                      lineLower.includes(query.toLowerCase());

      if (hasMatch && line.trim().length > 10) {
        // Extract snippet with context
        const contextLines = Math.max(0, index - 1);
        const contextEnd = Math.min(lines.length - 1, index + 1);
        
        let snippet = lines.slice(contextLines, contextEnd + 1).join(' ').trim();
        
        // Truncate if too long
        if (snippet.length > 200) {
          snippet = snippet.substring(0, 200) + '...';
        }

        matches.push({
          snippet,
          lineNumber: index + 1
        });
      }
    });

    return matches.slice(0, 5); // Limit to 5 snippets per document
  }

  async updateIndex(event: FileChangeEvent): Promise<void> {
    const relativePath = path.relative(this.config.projectRoot, event.path);

    if (event.type === 'deleted') {
      this.searchIndex.delete(relativePath);
    } else if (this.isAllowedExtension(event.path) && !this.shouldExcludePath(relativePath)) {
      await this.indexDocument(event.path, relativePath);
    }

    // Periodically save index
    if (Math.random() < 0.1) { // 10% chance to save on each update
      await this.saveSearchIndex();
    }
  }

  async getSearchStats(): Promise<any> {
    const stats = {
      totalDocuments: this.searchIndex.size,
      documentsByType: {} as Record<string, number>,
      documentsByCategory: {} as Record<string, number>,
      totalTokens: 0,
      averageTokensPerDocument: 0,
      lastIndexed: new Date(0)
    };

    for (const indexEntry of this.searchIndex.values()) {
      const { type, category } = indexEntry.metadata;
      
      stats.documentsByType[type] = (stats.documentsByType[type] || 0) + 1;
      stats.documentsByCategory[category] = (stats.documentsByCategory[category] || 0) + 1;
      stats.totalTokens += indexEntry.tokens.length;
      
      if (indexEntry.lastIndexed > stats.lastIndexed) {
        stats.lastIndexed = indexEntry.lastIndexed;
      }
    }

    stats.averageTokensPerDocument = stats.totalDocuments > 0 
      ? Math.round(stats.totalTokens / stats.totalDocuments) 
      : 0;

    return stats;
  }

  // Helper methods (same as DocumentManager - could be refactored to shared utility)
  private extractTitle(content: string, filename: string): string {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : path.parse(filename).name.replace(/[-_]/g, ' ');
  }

  private determineDocumentType(relativePath: string, content: string): any {
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
    
    return 'guide';
  }

  private determineDocumentCategory(relativePath: string, content: string, type: any): any {
    const pathLower = relativePath.toLowerCase();
    const contentLower = content.toLowerCase();
    if (pathLower.includes('architecture') || contentLower.includes('architecture')) return 'architecture';
    if (type === 'philosophy' || contentLower.includes('ai') || contentLower.includes('bounded enhancement')) return 'ai-philosophy';
    if (pathLower.includes('test') || contentLower.includes('testing')) return 'testing';
    if (pathLower.includes('deploy') || contentLower.includes('deployment')) return 'deployment';
    if (type === 'reflection' || type === 'insight') return 'learning';
    if (type === 'ticket' || pathLower.includes('sprint')) return 'project-management';
    return 'development';
  }

  private extractTags(content: string, relativePath: string): string[] {
    const tags: Set<string> = new Set();
    const pathParts = relativePath.split('/');
    pathParts.forEach(part => {
      if (part !== '.' && part !== '..' && !part.includes('.')) {
        tags.add(part.toLowerCase());
      }
    });

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

    return Array.from(tags).slice(0, 10);
  }

  private extractDependencies(content: string): string[] {
    const dependencies: Set<string> = new Set();
    const fileReferences = content.match(/[\w\-\.\/]+\.(?:md|ts|js|json|tsx|jsx)/g);
    if (fileReferences) {
      fileReferences.forEach(ref => {
        if (!ref.startsWith('http')) {
          dependencies.add(ref);
        }
      });
    }
    return Array.from(dependencies).slice(0, 20);
  }

  private generateSummary(content: string): string {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
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

  private determinePriority(type: any, category: any, relativePath: string): 'high' | 'medium' | 'low' {
    if (type === 'roadmap' || category === 'architecture') return 'high';
    if (type === 'philosophy' || category === 'ai-philosophy') return 'high';
    if (type === 'guide' || category === 'testing') return 'medium';
    if (type === 'reflection' || type === 'insight') return 'medium';
    if (relativePath.includes('current') || relativePath.includes('active')) return 'high';
    return 'low';
  }

  private shouldExcludePath(relativePath: string): boolean {
    return this.config.excludedPaths.some(excluded => relativePath.includes(excluded));
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
}