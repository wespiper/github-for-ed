import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import * as path from 'path';
import { ServerConfig, FileChangeEvent } from '../types/index.js';

export class FileWatcher extends EventEmitter {
  private watchers: FSWatcher[] = [];
  private config: ServerConfig;
  private isInitialized: boolean = false;

  constructor(config: ServerConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const watchPaths = [
      path.join(this.config.projectRoot, this.config.docsDirectory),
      path.join(this.config.projectRoot, this.config.claudeDirectory)
    ];

    for (const watchPath of watchPaths) {
      await this.watchDirectory(watchPath);
    }

    this.isInitialized = true;
    console.error(`File watcher initialized for ${watchPaths.length} directories`);
  }

  private async watchDirectory(dirPath: string): Promise<void> {
    try {
      const watcher = watch(dirPath, {
        ignored: (filePath: string) => {
          const relativePath = path.relative(this.config.projectRoot, filePath);
          return this.shouldIgnorePath(relativePath);
        },
        ignoreInitial: true, // Don't emit events for existing files
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });

      // Set up event handlers
      watcher
        .on('add', (filePath: string) => this.handleFileEvent('created', filePath))
        .on('change', (filePath: string) => this.handleFileEvent('updated', filePath))
        .on('unlink', (filePath: string) => this.handleFileEvent('deleted', filePath))
        .on('error', (error: unknown) => {
          console.error('File watcher error:', error);
          this.emit('error', error);
        })
        .on('ready', () => {
          console.error(`Watching directory: ${dirPath}`);
        });

      this.watchers.push(watcher);
    } catch (error) {
      console.error(`Failed to watch directory ${dirPath}:`, error);
    }
  }

  private shouldIgnorePath(relativePath: string): boolean {
    // Ignore excluded paths
    if (this.config.excludedPaths.some(excluded => relativePath.includes(excluded))) {
      return true;
    }

    // Ignore non-allowed extensions
    if (!this.isAllowedExtension(relativePath)) {
      return true;
    }

    // Ignore hidden files and directories (except .claude)
    const pathParts = relativePath.split(path.sep);
    for (const part of pathParts) {
      if (part.startsWith('.') && part !== '.claude') {
        return true;
      }
    }

    // Ignore temporary files
    if (relativePath.includes('~') || relativePath.includes('.tmp') || relativePath.includes('.temp')) {
      return true;
    }

    // Ignore cache and build directories
    const ignoredDirs = ['node_modules', 'dist', 'build', '.cache', '.git'];
    if (ignoredDirs.some(dir => relativePath.includes(dir))) {
      return true;
    }

    return false;
  }

  private isAllowedExtension(filePath: string): boolean {
    const ext = path.extname(filePath);
    return this.config.allowedExtensions.includes(ext);
  }

  private handleFileEvent(type: 'created' | 'updated' | 'deleted', filePath: string): void {
    const relativePath = path.relative(this.config.projectRoot, filePath);

    // Double-check that we should handle this path
    if (this.shouldIgnorePath(relativePath)) {
      return;
    }

    const event: FileChangeEvent = {
      type,
      path: filePath,
      timestamp: new Date()
    };

    // Add some debouncing for rapid file changes
    this.debounceEvent(event);
  }

  private eventQueue: Map<string, { event: FileChangeEvent; timer: NodeJS.Timeout }> = new Map();

  private debounceEvent(event: FileChangeEvent): void {
    const key = event.path;
    
    // Clear existing timer for this file
    const existing = this.eventQueue.get(key);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.eventQueue.delete(key);
      this.emit('change', event);
      
      // Log the event
      console.error(`File ${event.type}: ${path.relative(this.config.projectRoot, event.path)}`);
    }, 500); // 500ms debounce

    this.eventQueue.set(key, { event, timer });
  }

  async close(): Promise<void> {
    // Clear all pending events
    for (const { timer } of this.eventQueue.values()) {
      clearTimeout(timer);
    }
    this.eventQueue.clear();

    // Close all watchers
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    
    this.watchers = [];
    this.isInitialized = false;
    
    console.error('File watcher closed');
  }

  getWatchedPaths(): string[] {
    return this.watchers.map(watcher => {
      const watched = watcher.getWatched();
      return Object.keys(watched);
    }).flat();
  }

  getStats(): any {
    return {
      isInitialized: this.isInitialized,
      watcherCount: this.watchers.length,
      pendingEvents: this.eventQueue.size,
      watchedPaths: this.getWatchedPaths().length
    };
  }

  // Manual file change trigger (for testing or manual updates)
  triggerFileChange(filePath: string, type: 'created' | 'updated' | 'deleted' = 'updated'): void {
    this.handleFileEvent(type, filePath);
  }

  // Pause/resume watching (useful for bulk operations)
  pauseWatching(): void {
    this.watchers.forEach(watcher => {
      watcher.unwatch('*');
    });
  }

  resumeWatching(): void {
    // Restart watching - requires re-initialization
    this.close().then(() => {
      this.initialize();
    });
  }
}