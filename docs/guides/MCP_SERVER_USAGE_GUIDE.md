# Scribe Tree Documentation MCP Server - Usage Guide

Your MCP server is now configured and ready to use! Here's how to interact with it through Claude Code.

## 🚀 **Setup Complete**

✅ **MCP Server**: Configured in `.claude/settings.local.json`  
✅ **Configuration**: `mcp-docs-config.json` created  
✅ **49 Documents Indexed**: All docs and .claude files are searchable  
✅ **Real-time Monitoring**: Files automatically re-indexed on changes  

## 💡 **How to Use with Claude Code**

### **Basic Document Search**

Find AI philosophy documents:
```
Search the documentation for "bounded enhancement" focusing on AI philosophy
```

Find implementation roadmaps:
```
Show me all roadmap documents related to Phase 5
```

Search with specific filters:
```
Search for "testing" in guide documents only
```

### **Project Context Management**

Get current project status:
```
What's the current project context and active tasks?
```

Add a new task:
```
Create a high priority task for "Complete Claude API integration" assigned to Phase 5
```

Update project phase:
```
Update the project phase to "Phase 5 - Sprint 4 Complete"
```

### **Document Analysis**

Analyze relationships:
```
Analyze the relationships between the AI philosophy documents
```

Get document overview:
```
List all recent documents and their priorities
```

Read specific document:
```
Read the full content of the Phase 5 implementation plan
```

## 🔍 **Advanced Search Examples**

### **Find Implementation Details**
```
Search for "real-time intervention" and show related documents
```

### **Locate Test Results** 
```
Show me all test-result documents from the last month
```

### **Architecture Documentation**
```
Find all architecture category documents and analyze their relationships
```

### **Educational Philosophy**
```
Search for documents containing "educational AI" and "student thinking"
```

## 📊 **Project Management Features**

### **Task Management**
- Create tasks linked to specific documents
- Track progress by phase and priority
- View task dependencies and relationships

### **Activity Tracking**
- Monitor recent changes and updates
- Track project milestone completion
- View development activity history

### **Document Intelligence**
- Automatic content summarization
- Dependency detection between documents
- Priority-based organization

## 🔧 **Available MCP Tools**

You can directly reference these tools in conversations:

1. **`search_documents`** - "Search docs for X"
2. **`read_document`** - "Read the content of file Y"  
3. **`list_documents`** - "List all roadmap documents"
4. **`get_project_context`** - "What's the current project status?"
5. **`manage_tasks`** - "Create a task for Z"
6. **`analyze_document_relationships`** - "How are these docs connected?"

## 📁 **Your Documentation Structure**

The MCP server automatically organizes your 74 documents by:

### **Document Types**
- **Roadmaps**: Phase plans and implementation guides (active and archived)
- **Philosophy**: Educational AI principles and white papers  
- **Guides**: Implementation and testing procedures
- **Reflections**: Development insights and learnings from completed tasks
- **Insights**: Accumulated project learnings and patterns identified
- **Test Results**: Sprint summaries and test outcomes
- **Configuration**: Project setup and config files
- **Archives**: Completed phases, sprints, and legacy documentation

### **Categories**
- **Architecture**: System design and structure
- **AI Philosophy**: Educational AI principles
- **Development**: General implementation docs
- **Testing**: Test procedures and results
- **Learning**: Reflections, insights, and accumulated wisdom
- **Project Management**: Planning and tracking

## 🎯 **Common Use Cases**

### **1. Finding Context for Development**
```
"I'm working on AI boundaries - show me all related philosophy and implementation docs"
```

### **2. Understanding Project History**
```
"What were the key decisions in Phase 3 and how do they relate to current Phase 5 work?"
```

### **3. Planning Next Steps**
```
"Based on completed tasks and current project state, what should I work on next?"
```

### **4. Code Implementation Context**
```
"I need to implement real-time educator alerts - find all related documentation and requirements"
```

### **5. Testing and Validation**
```
"Show me all test results and validation docs to understand current system capabilities"
```

### **6. Learning from Past Work**
```
"Search insights and reflections for 'educational component architecture' lessons"
"Find reflections about authentication issues we solved"
"Show me all accumulated learnings about database migration patterns"
```

## ⚡ **Pro Tips**

1. **Natural Language**: Ask questions naturally - the MCP server understands context
2. **Combine Operations**: "Search for X, then analyze relationships with Y"
3. **Filter Smart**: Use document types and categories for focused results
4. **Track Progress**: Regularly check project context to stay aligned with goals
5. **Link Everything**: Create tasks that reference specific documents for better organization

## 🔄 **Real-time Updates**

The server automatically:
- **Monitors file changes** in `/docs` and `/.claude`
- **Updates search index** when documents are modified
- **Tracks document relationships** as they evolve
- **Maintains project context** across sessions

## 🛠 **Troubleshooting**

If something isn't working:

1. **Check Server Status**: The MCP server should show "initialized" in logs
2. **Verify Permissions**: Ensure Claude Code can access the MCP server
3. **Rebuild Index**: If search seems incomplete, the server rebuilds automatically
4. **Check Paths**: Verify the PROJECT_ROOT environment variable is correct

## 🎉 **Ready to Use!**

Your documentation is now intelligently accessible through Claude Code. The MCP server provides deep context about your educational platform, development philosophy, and implementation progress.

Try starting with:
```
"What's the current status of the Scribe Tree project and what should I focus on next?"
```

The MCP server will provide comprehensive context from your 49 indexed documents to help guide your development work!