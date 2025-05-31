#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs/promises';
import { DocumentManager } from './handlers/documentManager.js';
import { ContextManager } from './handlers/contextManager.js';
import { SearchEngine } from './handlers/searchEngine.js';
import { FileWatcher } from './utils/fileWatcher.js';
import { ServerConfig, ServerConfigSchema } from './types/index.js';

class ScribeTreeDocsServer {
  private server: Server;
  private documentManager!: DocumentManager;
  private contextManager!: ContextManager;
  private searchEngine!: SearchEngine;
  private fileWatcher!: FileWatcher;
  private config!: ServerConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'scribe-tree-docs',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  async initialize(projectRoot?: string): Promise<void> {
    // Load configuration
    const configPath = projectRoot 
      ? path.join(projectRoot, 'mcp-docs-config.json')
      : path.join(process.cwd(), 'mcp-docs-config.json');

    this.config = await this.loadConfig(configPath, projectRoot);
    
    // Initialize managers
    this.documentManager = new DocumentManager(this.config);
    this.contextManager = new ContextManager(this.config);
    this.searchEngine = new SearchEngine(this.config);
    this.fileWatcher = new FileWatcher(this.config);

    // Set up file watching
    if (this.config.fileWatcherEnabled) {
      await this.fileWatcher.initialize();
      this.fileWatcher.on('change', async (event) => {
        await this.documentManager.handleFileChange(event);
        await this.searchEngine.updateIndex(event);
      });
    }

    // Initialize document index
    await this.documentManager.initialize();
    await this.searchEngine.initialize();
    
    console.error('Scribe Tree Docs MCP Server initialized');
  }

  private async loadConfig(configPath: string, projectRoot?: string): Promise<ServerConfig> {
    const defaultConfig = {
      projectRoot: projectRoot || process.cwd(),
      docsDirectory: 'docs',
      claudeDirectory: '.claude',
      cacheDirectory: '.cache',
      maxIndexSize: 10000,
      fileWatcherEnabled: true,
      indexingEnabled: true,
      allowedExtensions: ['.md', '.txt', '.json'],
      excludedPaths: ['node_modules', '.git', 'dist']
    };

    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const userConfig = JSON.parse(configFile);
      return ServerConfigSchema.parse({ ...defaultConfig, ...userConfig });
    } catch (error) {
      console.error(`Config file not found or invalid, using defaults: ${error}`);
      return ServerConfigSchema.parse(defaultConfig);
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_documents',
            description: 'Search through project documentation with intelligent filtering',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for documents'
                },
                type: {
                  type: 'string',
                  enum: ['roadmap', 'philosophy', 'guide', 'reflection', 'insight', 'ticket', 'command', 'configuration', 'migration', 'test-result'],
                  description: 'Filter by document type'
                },
                category: {
                  type: 'string',
                  enum: ['architecture', 'ai-philosophy', 'development', 'testing', 'deployment', 'learning', 'project-management'],
                  description: 'Filter by document category'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'read_document',
            description: 'Read a specific document with metadata',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the document to read'
                },
                includeMetadata: {
                  type: 'boolean',
                  description: 'Include document metadata in response',
                  default: true
                }
              },
              required: ['path']
            }
          },
          {
            name: 'list_documents',
            description: 'List all documents with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['roadmap', 'philosophy', 'guide', 'reflection', 'insight', 'ticket', 'command', 'configuration', 'migration', 'test-result'],
                  description: 'Filter by document type'
                },
                category: {
                  type: 'string',
                  enum: ['architecture', 'ai-philosophy', 'development', 'testing', 'deployment', 'learning', 'project-management'],
                  description: 'Filter by document category'
                },
                recent: {
                  type: 'boolean',
                  description: 'Show only recently modified documents',
                  default: false
                }
              }
            }
          },
          {
            name: 'get_project_context',
            description: 'Get current project context and status',
            inputSchema: {
              type: 'object',
              properties: {
                includeRecentActivity: {
                  type: 'boolean',
                  description: 'Include recent activity in response',
                  default: true
                }
              }
            }
          },
          {
            name: 'update_project_context',
            description: 'Update project goals, phase, or other context',
            inputSchema: {
              type: 'object',
              properties: {
                currentPhase: {
                  type: 'string',
                  description: 'Update current project phase'
                },
                goals: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Update project goals'
                },
                notes: {
                  type: 'string',
                  description: 'Add contextual notes'
                }
              }
            }
          },
          {
            name: 'manage_tasks',
            description: 'Create, update, or list project tasks',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['create', 'update', 'delete', 'list'],
                  description: 'Action to perform on tasks'
                },
                task: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'] },
                    relatedDocs: { type: 'array', items: { type: 'string' } },
                    assignedPhase: { type: 'string' }
                  },
                  description: 'Task data for create/update operations'
                },
                taskId: {
                  type: 'string',
                  description: 'Task ID for update/delete operations'
                },
                filters: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'blocked'] },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                    phase: { type: 'string' }
                  },
                  description: 'Filters for list operations'
                }
              },
              required: ['action']
            }
          },
          {
            name: 'analyze_document_relationships',
            description: 'Analyze relationships and dependencies between documents',
            inputSchema: {
              type: 'object',
              properties: {
                documentPath: {
                  type: 'string',
                  description: 'Path to document to analyze (optional - analyzes all if not provided)'
                },
                includeContentAnalysis: {
                  type: 'boolean',
                  description: 'Include deep content analysis for relationships',
                  default: false
                }
              }
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_documents':
            return await this.handleSearchDocuments(args);
          
          case 'read_document':
            return await this.handleReadDocument(args);
          
          case 'list_documents':
            return await this.handleListDocuments(args);
          
          case 'get_project_context':
            return await this.handleGetProjectContext(args);
          
          case 'update_project_context':
            return await this.handleUpdateProjectContext(args);
          
          case 'manage_tasks':
            return await this.handleManageTasks(args);
          
          case 'analyze_document_relationships':
            return await this.handleAnalyzeDocumentRelationships(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async handleSearchDocuments(args: any) {
    const results = await this.searchEngine.search({
      query: args.query,
      type: args.type,
      category: args.category,
      includeContent: true
    }, args.limit || 10);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  private async handleReadDocument(args: any) {
    const result = await this.documentManager.readDocument(args.path, args.includeMetadata);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListDocuments(args: any) {
    const documents = await this.documentManager.listDocuments({
      type: args.type,
      category: args.category,
      recent: args.recent
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(documents, null, 2)
        }
      ]
    };
  }

  private async handleGetProjectContext(args: any) {
    const context = await this.contextManager.getContext(args.includeRecentActivity);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context, null, 2)
        }
      ]
    };
  }

  private async handleUpdateProjectContext(args: any) {
    const result = await this.contextManager.updateContext(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleManageTasks(args: any) {
    const result = await this.contextManager.manageTasks(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleAnalyzeDocumentRelationships(args: any) {
    const analysis = await this.documentManager.analyzeRelationships(
      args.documentPath,
      args.includeContentAnalysis
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      if (this.fileWatcher) {
        await this.fileWatcher.close();
      }
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Scribe Tree Docs MCP Server running on stdio');
  }
}

// Main execution
async function main() {
  const server = new ScribeTreeDocsServer();
  const projectRoot = process.env.PROJECT_ROOT || process.cwd();
  
  await server.initialize(projectRoot);
  await server.run();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ScribeTreeDocsServer };