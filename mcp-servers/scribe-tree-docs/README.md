# Scribe Tree Documentation MCP Server

An intelligent Model Context Protocol (MCP) server that provides comprehensive documentation management and project context tracking for the Scribe Tree educational platform.

## Features

### 📚 **Intelligent Document Management**
- **Automatic Indexing**: Scans and indexes all documentation in `/docs` and `/.claude` directories
- **Smart Categorization**: Automatically categorizes documents by type (roadmap, philosophy, guide, reflection, etc.)
- **Metadata Extraction**: Extracts titles, tags, dependencies, and summaries from documents
- **Real-time Updates**: Monitors file changes and updates index automatically

### 🔍 **Advanced Search Capabilities**
- **Full-text Search**: Search across all document content with relevance scoring
- **Filtered Search**: Filter by document type, category, tags, or date ranges
- **Content Snippets**: Returns relevant content snippets with line numbers
- **Relationship Analysis**: Identifies and analyzes document dependencies and relationships

### 🎯 **Project Context Tracking**
- **Project State Management**: Tracks current phase, goals, and project progress
- **Task Management**: Create, update, and track project tasks with priorities and dependencies
- **Activity History**: Maintains detailed history of project activities and changes
- **Phase-based Organization**: Organizes tasks and context by project phases

### 📊 **Analytics and Insights**
- **Document Statistics**: Provides insights into documentation coverage and organization
- **Relationship Mapping**: Visualizes connections between different documents
- **Priority Assessment**: Automatically assigns priority levels based on content and context
- **Progress Tracking**: Tracks completion of tasks and project milestones

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd /path/to/scribe-tree/mcp-servers/scribe-tree-docs
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the server**:
   ```bash
   npm run build
   ```

4. **Configure Claude Code** to use the MCP server (see Configuration section below)

## Configuration

### 1. **Create Configuration File**

Create `mcp-docs-config.json` in your project root:

```json
{
  "projectRoot": "/path/to/scribe-tree",
  "docsDirectory": "docs",
  "claudeDirectory": ".claude",
  "cacheDirectory": ".cache",
  "maxIndexSize": 10000,
  "fileWatcherEnabled": true,
  "indexingEnabled": true,
  "allowedExtensions": [".md", ".txt", ".json"],
  "excludedPaths": ["node_modules", ".git", "dist", "build"]
}
```

### 2. **Configure Claude Code Integration**

Add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "scribe-tree-docs": {
      "command": "node",
      "args": ["/path/to/scribe-tree/mcp-servers/scribe-tree-docs/dist/server.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/scribe-tree"
      }
    }
  }
}
```

### 3. **Alternative: Development Mode**

For development, you can run the server directly:
```bash
npm run dev
# or with file watching
npm run watch
```

## Available MCP Tools

### 📖 **Document Operations**

#### `search_documents`
Search through project documentation with intelligent filtering.

**Parameters:**
- `query` (required): Search query string
- `type` (optional): Filter by document type (roadmap, philosophy, guide, etc.)
- `category` (optional): Filter by category (architecture, ai-philosophy, development, etc.)
- `limit` (optional): Maximum number of results (default: 10)

**Example:**
```json
{
  "query": "AI enhancement implementation",
  "type": "roadmap",
  "category": "ai-philosophy",
  "limit": 5
}
```

#### `read_document`
Read a specific document with metadata.

**Parameters:**
- `path` (required): Path to the document
- `includeMetadata` (optional): Include document metadata (default: true)

#### `list_documents`
List all documents with optional filtering.

**Parameters:**
- `type` (optional): Filter by document type
- `category` (optional): Filter by category
- `recent` (optional): Show only recently modified documents

### 🎯 **Project Context Management**

#### `get_project_context`
Get current project context and status.

**Parameters:**
- `includeRecentActivity` (optional): Include recent activity (default: true)

#### `update_project_context`
Update project goals, phase, or other context.

**Parameters:**
- `currentPhase` (optional): Update current project phase
- `goals` (optional): Update project goals array
- `notes` (optional): Add contextual notes

#### `manage_tasks`
Create, update, or list project tasks.

**Parameters:**
- `action` (required): Action to perform (create, update, delete, list)
- `task` (optional): Task data for create/update operations
- `taskId` (optional): Task ID for update/delete operations
- `filters` (optional): Filters for list operations

### 🔍 **Analysis Tools**

#### `analyze_document_relationships`
Analyze relationships and dependencies between documents.

**Parameters:**
- `documentPath` (optional): Specific document to analyze (analyzes all if not provided)
- `includeContentAnalysis` (optional): Include deep content analysis

## Project Structure

```
mcp-servers/scribe-tree-docs/
├── src/
│   ├── handlers/
│   │   ├── documentManager.ts     # Document indexing and management
│   │   ├── contextManager.ts      # Project context and task management
│   │   └── searchEngine.ts        # Advanced search functionality
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── utils/
│   │   └── fileWatcher.ts         # Real-time file monitoring
│   └── server.ts                  # Main MCP server implementation
├── dist/                          # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Usage Examples

### **Search for AI-related Documentation**
```bash
# Through Claude Code MCP interface
search_documents({"query": "bounded enhancement", "category": "ai-philosophy"})
```

### **Get Project Status**
```bash
get_project_context({"includeRecentActivity": true})
```

### **Create a New Task**
```bash
manage_tasks({
  "action": "create",
  "task": {
    "description": "Implement real-time educator alerts",
    "priority": "high",
    "assignedPhase": "Phase 5",
    "relatedDocs": ["docs/roadmaps/PHASE_5_AI_ENHANCEMENT_IMPLEMENTATION.md"]
  }
})
```

### **Analyze Document Relationships**
```bash
analyze_document_relationships({
  "documentPath": "docs/philosophy/scribe-tree-ai-philosophy-white-paper.md",
  "includeContentAnalysis": true
})
```

## Document Types and Categories

### **Document Types**
- `roadmap`: Implementation roadmaps and phase plans
- `philosophy`: Educational philosophy and AI principles
- `guide`: Implementation and testing guides
- `reflection`: Development reflections and insights
- `insight`: Accumulated learning summaries
- `ticket`: Issue tracking and task management
- `command`: CLI command definitions
- `configuration`: Configuration files
- `migration`: Migration instructions and scripts
- `test-result`: Test results and sprint summaries

### **Document Categories**
- `architecture`: System architecture and design
- `ai-philosophy`: Educational AI principles and philosophy
- `development`: General development documentation
- `testing`: Testing procedures and results
- `deployment`: Deployment and configuration guides
- `learning`: Reflections and learning insights
- `project-management`: Project management and planning

## Performance and Optimization

### **Indexing Strategy**
- Documents are indexed incrementally as they change
- Search index is cached to disk for fast startup
- File watching provides real-time updates without full re-indexing
- Large projects are handled efficiently with streaming and chunking

### **Memory Management**
- Document content is not kept in memory after indexing
- Search index uses efficient tokenization and storage
- Context and task data is persisted to disk
- Configurable limits prevent unbounded growth

### **Search Performance**
- Multi-factor relevance scoring (exact match, title, tags, content)
- Priority-based result ranking
- Efficient partial matching and fuzzy search
- Content snippet extraction with context

## Development

### **Scripts**
- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with ts-node
- `npm run watch`: Run with file watching for development
- `npm run clean`: Clean compiled output
- `npm run rebuild`: Clean and rebuild

### **Testing**
- Unit tests (planned): Test individual components
- Integration tests (planned): Test MCP server integration
- Performance tests (planned): Test with large document sets

## Troubleshooting

### **Common Issues**

1. **Server won't start**
   - Check that PROJECT_ROOT environment variable is set
   - Verify all dependencies are installed (`npm install`)
   - Ensure configuration file is valid JSON

2. **Documents not being indexed**
   - Check file permissions on docs directories
   - Verify file extensions are in `allowedExtensions`
   - Check that paths are not in `excludedPaths`

3. **Search results empty**
   - Wait for initial indexing to complete
   - Check search query syntax
   - Verify documents contain searchable content

4. **File watching not working**
   - Set `fileWatcherEnabled: true` in configuration
   - Check system file watcher limits
   - Verify directory permissions

### **Logging**
The server logs to stderr for debugging. Key log messages include:
- Initialization progress
- Document indexing status
- File change events
- Search query performance
- Error messages and stack traces

## Integration with Scribe Tree

This MCP server is specifically designed for the Scribe Tree educational platform and includes:

- **Educational Context Awareness**: Understanding of AI philosophy and educational principles
- **Phase-based Organization**: Alignment with Scribe Tree's development phases
- **Learning Integration**: Support for reflection and insight tracking
- **Bounded Enhancement Compliance**: Alignment with educational AI principles

The server provides intelligent access to the comprehensive documentation that guides Scribe Tree's development, ensuring that Claude Code has deep context about the project's goals, architecture, and educational mission.

## Contributing

This MCP server is part of the Scribe Tree project. Contributions should follow the project's development standards and educational philosophy. See the main project documentation for contribution guidelines.

## License

MIT License - see the main Scribe Tree project for full license details.