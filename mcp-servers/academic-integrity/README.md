# Academic Integrity MCP Server

**Privacy-enhanced Model Context Protocol server for academic integrity monitoring and AI detection with comprehensive educational boundaries.**

## 🎯 Overview

The Academic Integrity MCP Server provides sophisticated AI assistance detection, academic integrity analysis, educational validation, and comprehensive reporting while maintaining strict privacy protection and educational value. Built with NestJS and designed for educational institutions requiring responsible AI monitoring.

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start in MCP mode (for Claude Code integration)
npm run mcp

# Start in HTTP mode (for service integration)
npm run http

# Start in dual mode (both MCP and HTTP)
npm run dual
```

### MCP Integration with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "academic-integrity": {
      "command": "node",
      "args": ["./mcp-servers/academic-integrity/dist/index.js"]
    }
  }
}
```

## 🛠 Core Features

### 🔍 AI Detection & Analysis
- **AI Assistance Level Detection**: Identifies AI contribution levels (none → minimal → moderate → significant → generated)
- **Pattern Recognition**: Detects writing patterns indicative of AI assistance
- **Educational Context**: Provides learning opportunities and educational guidance
- **Privacy Protection**: Student IDs automatically hashed, content encrypted

### 📊 Academic Integrity Monitoring
- **Comprehensive Analysis**: Multi-dimensional integrity scoring
- **Authenticity Assessment**: Writing consistency and personal voice detection
- **Intervention Suggestions**: Educational recommendations for improvement
- **Audit Trails**: Immutable logs for compliance and accountability

### 🎓 Educational Validation
- **Boundary Compliance**: Assignment-type specific AI usage validation
- **Progressive Learning**: Level-appropriate AI assistance guidelines
- **Educational Justification**: Clear explanations for all decisions
- **Student Development**: Focus on learning enhancement vs. replacement

### 📈 Intelligent Reporting
- **Multi-Format Output**: Student-friendly vs. educator-detailed reports
- **Privacy Controls**: Granular access based on role and purpose
- **Pedagogical Insights**: Teaching recommendations and intervention strategies
- **Trend Analysis**: Progress tracking and development patterns

## 🔧 Available Tools

### 1. `detect_ai_assistance_levels`
Analyzes student work to identify AI assistance levels with educational context.

**Input:**
```json
{
  "studentId": "student123",
  "assignmentId": "essay-001",
  "content": "Student writing content...",
  "privacyContext": {
    "requesterId": "teacher456", 
    "requesterType": "educator",
    "purpose": "academic_integrity_monitoring",
    "educationalJustification": "Monitoring for learning support"
  }
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "assistanceLevel": "minimal",
    "confidence": 0.85,
    "patterns": ["high-vocabulary-diversity"],
    "educationalContext": {
      "educationalValue": 0.9,
      "learningOpportunity": ["Continue developing writing skills"],
      "academicIntegrityGuidance": "Good use of AI as learning tool"
    },
    "recommendations": ["Excellent independent work detected"]
  }
}
```

### 2. `analyze_academic_integrity`
Comprehensive academic integrity analysis with scoring and interventions.

**Input:**
```json
{
  "studentId": "student123",
  "assignmentId": "research-paper",
  "submissionData": {
    "content": "Research paper content...",
    "metadata": {"wordCount": 1500},
    "writingPatterns": {"avgSentenceLength": 18}
  },
  "privacyContext": {
    "requesterId": "teacher456",
    "requesterType": "educator", 
    "purpose": "educational_assessment"
  }
}
```

### 3. `validate_educational_ai_use`
Validates AI interactions against educational boundaries and learning objectives.

**Input:**
```json
{
  "studentId": "student123",
  "assignmentId": "reflection-essay",
  "aiInteraction": {
    "type": "grammar",
    "content": "Grammar checking request",
    "context": {
      "assignmentType": "reflection",
      "studentLevel": "intermediate"
    }
  },
  "privacyContext": {
    "requesterId": "teacher456",
    "requesterType": "educator",
    "purpose": "educational_assessment"
  }
}
```

### 4. `generate_integrity_reports`
Creates comprehensive integrity reports with privacy controls and pedagogical insights.

**Input:**
```json
{
  "criteria": {
    "reportType": "individual",
    "targetId": "student123",
    "timeframe": {
      "start": "2025-05-01T00:00:00Z",
      "end": "2025-06-01T00:00:00Z"
    },
    "includeIndividualData": true
  },
  "privacyContext": {
    "requesterId": "teacher456",
    "requesterType": "educator",
    "purpose": "academic_integrity_monitoring"
  }
}
```

## 🔒 Privacy & Security

### Data Protection
- **Student ID Hashing**: All student identifiers automatically hashed for privacy
- **Content Encryption**: Sensitive data encrypted with AES-256-CBC
- **Minimal Data Exposure**: Only necessary information included in responses
- **Audit Logging**: Comprehensive audit trails for all operations
- **Consent Management**: Educational purpose validation for all requests

### Compliance Framework
- **FERPA**: Educational records protection with legitimate interest validation
- **COPPA**: Enhanced protections for students under 13
- **GDPR**: Right to access, rectification, erasure, and data portability
- **Educational Privacy**: State-specific educational privacy law compliance

### Privacy Context Requirements
All operations require privacy context with:
- `requesterId`: Who is making the request
- `requesterType`: Role (student/educator/system/admin)
- `purpose`: Educational justification for the request
- `educationalJustification`: Clear explanation of educational benefit

## 🏗 Architecture

### NestJS Modular Design
```
src/
├── ai-detection/           # AI assistance detection services
├── integrity-analysis/     # Academic integrity analysis
├── educational-validation/ # Educational boundary validation  
├── reporting/             # Report generation services
└── mcp/                   # MCP protocol implementation
```

### Service Architecture
- **Domain-Driven Design**: Clear separation of academic integrity concerns
- **Dependency Injection**: NestJS decorators for service management
- **Privacy by Design**: Privacy protection built into every service
- **Educational Focus**: All features designed for learning enhancement

## 🚦 Health Monitoring

### Health Check Endpoint
```bash
# MCP mode - check via tools list
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# HTTP mode - health endpoint
curl http://localhost:3003/health
```

### Monitoring Capabilities
- **Service Health**: Real-time availability monitoring
- **Tool Availability**: Verify all 4 tools are operational
- **Privacy Compliance**: Monitor privacy protection effectiveness
- **Educational Impact**: Track learning enhancement metrics

## 📊 Performance Specifications

- **Response Time**: <200ms including privacy checks
- **Privacy Overhead**: <50ms additional processing for privacy operations
- **Concurrent Operations**: Multiple analysis requests supported
- **Scalability**: Designed for institutional-scale deployments

## 🧪 Testing

### Unit Tests
```bash
# Run test suite
npm test

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch
```

### Integration Testing
```bash
# Test MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"detect_ai_assistance_levels","arguments":{...}}}' | node dist/index.js
```

## 🔄 Development

### Scripts
- `npm run build` - Compile TypeScript
- `npm run start:dev` - Development mode with hot reload
- `npm run start:debug` - Debug mode
- `npm run lint` - ESLint checking
- `npm run format` - Prettier formatting

### Environment Variables
```bash
# Optional: Custom MCP server path for backend integration
MCP_ACADEMIC_INTEGRITY_PATH=/path/to/server

# Node environment
NODE_ENV=development|production

# Logging level
LOG_LEVEL=debug|info|warn|error
```

## 🤝 Integration

### Backend Integration
The server integrates with the Scribe Tree backend via `AcademicIntegrityMCPClient`:

```typescript
const client = new AcademicIntegrityMCPClient();
await client.connect();

const result = await client.detectAIAssistanceLevels(
  studentId, 
  assignmentId, 
  content, 
  privacyContext
);
```

### Service Discovery
- **Health Checks**: `/health` endpoint for service monitoring
- **Tool Discovery**: `/tools` endpoint lists available capabilities
- **Version Info**: Service version and capability reporting

## 📚 Educational Philosophy

### Trust Through Transparency
- **Disclosure Rewards**: Encourage honest AI usage reporting
- **Educational Accountability**: Frame detection as learning support
- **Student Engagement**: Build features students want to use
- **Educator Insights**: Enable teaching without surveillance

### Learning Enhancement
- **Cognitive Load Management**: Consider student capacity in responses
- **Emotional Intelligence**: Adapt to student emotional state
- **Creative Flow**: Monitor without interrupting inspiration
- **Independence Building**: Support growth toward self-sufficiency

## 📋 API Reference

### HTTP Endpoints (when running in HTTP/dual mode)
- `POST /api/academic-integrity/ai-assistance/detect` - AI detection
- `POST /api/academic-integrity/integrity/analyze` - Integrity analysis  
- `POST /api/academic-integrity/ai-validation/validate` - Educational validation
- `POST /api/academic-integrity/reports/generate` - Report generation
- `GET /api/academic-integrity/health` - Health check
- `GET /api/academic-integrity/tools` - Available tools

### Response Format
All endpoints return standardized responses:
```json
{
  "success": boolean,
  "data": {...},
  "message": "Operation completed successfully",
  "metadata": {
    "processingTime": number,
    "privacyCompliant": true,
    "educationalJustification": "..."
  }
}
```

## 🚀 Production Deployment

### Requirements
- Node.js 18+ 
- NPM 8+
- TypeScript 5+
- Memory: 512MB minimum
- CPU: 1 core minimum

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Health checks enabled
- [ ] Logging configured
- [ ] Privacy settings verified
- [ ] Educational policies loaded
- [ ] Monitoring enabled

## 📞 Support

For technical support, integration questions, or educational guidance:
- Review the [Scribe Tree documentation](../../docs/)
- Check the [API integration guide](../../docs/guides/MCP_SERVER_USAGE_GUIDE.md)
- Consult the [privacy compliance guide](../../docs/guides/PRIVACY_COMPLIANCE_TESTING_GUIDE.md)

---

**Built with ❤️ for educational excellence and student privacy protection.**