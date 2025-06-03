# Writing Analysis MCP Server

A privacy-enhanced MCP server for writing analysis with integrated content classification, AI boundaries, and educational privacy controls.

## Overview

This MCP server provides 8 tools (4 original + 4 privacy-enhanced) for analyzing writing patterns, evaluating reflection quality, tracking progress, and generating insights - all with comprehensive privacy protections.

## Features

### Core Writing Analysis Tools

1. **analyze_writing_patterns** - Analyze writing patterns with privacy-aware content processing
2. **evaluate_reflection_quality** - Evaluate reflection quality with privacy safeguards
3. **track_writing_progress** - Track writing progress with privacy-aware data collection
4. **generate_writing_insights** - Generate privacy-first educational insights from writing data

### Privacy Enhancement Tools

5. **classify_content_sensitivity** - Classify content sensitivity for privacy protection
6. **validate_educational_purpose** - Validate educational purpose for data access
7. **apply_ai_boundaries** - Apply AI boundaries to ensure educational integrity
8. **audit_writing_data_access** - Audit data access for privacy compliance

## Privacy Features

- **Content Classification**: Automatic detection and redaction of sensitive information
- **Educational Purpose Validation**: Ensures all data access has legitimate educational value
- **AI Boundaries**: Prevents direct answer generation while supporting learning
- **Comprehensive Audit Trails**: Immutable logging of all data access
- **Differential Privacy**: Applied to aggregated metrics to prevent re-identification
- **Consent Management**: Respects student privacy preferences
- **Progressive Access**: AI assistance levels based on reflection quality

## Installation

```bash
npm install
npm run build
```

## Configuration

Privacy settings are configured in `.env.privacy`:

```env
# Content Classification Thresholds
SENSITIVITY_THRESHOLD_HIGH=0.9
SENSITIVITY_THRESHOLD_MEDIUM=0.7
SENSITIVITY_THRESHOLD_LOW=0.5

# Educational Purpose Validation
EDUCATIONAL_PURPOSE_MIN_SCORE=0.8
REQUIRE_EDUCATIONAL_JUSTIFICATION=true

# AI Boundaries Configuration
AI_BOUNDARY_STRICT_MODE=true
BLOCK_DIRECT_ANSWERS=true
MAX_AI_CONTEXT_LENGTH=500

# Audit and Logging
ENABLE_AUDIT_LOGGING=true
AUDIT_RETENTION_DAYS=365
LOG_SENSITIVE_ACCESS=true
```

## Usage

### Starting the Server

```bash
npm run start
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Test MCP functionality
node test-mcp-server.js
```

## Architecture

### Module Structure

- **mcp/**: MCP protocol implementation and tool registration
- **writing-analysis/**: Core writing analysis services
- **reflection-analysis/**: Reflection quality assessment
- **content-privacy/**: Content classification and privacy protection
- **educational-validation/**: Purpose validation and access control
- **insights-generation/**: Privacy-aware insights and analytics
- **events/**: Event-driven architecture for privacy events
- **repositories/**: Data access layer with privacy controls

### Privacy Architecture

1. **Privacy Guard**: Global guard that validates all requests for privacy compliance
2. **Content Classifier**: NLP-based detection of sensitive information
3. **AI Boundary Enforcer**: Ensures educational integrity in AI assistance
4. **Audit Logger**: Immutable audit trail with cryptographic hashing
5. **Purpose Validator**: Validates educational purpose with weighted scoring

## API Examples

### Content Classification

```javascript
{
  "name": "classify_content_sensitivity",
  "arguments": {
    "content": "My essay about overcoming personal challenges...",
    "context": {
      "contentType": "essay",
      "academicLevel": "high_school"
    }
  }
}
```

### Writing Pattern Analysis

```javascript
{
  "name": "analyze_writing_patterns",
  "arguments": {
    "content": "Essay content here...",
    "userId": "student-123",
    "role": "student",
    "purpose": "learning improvement",
    "consent": true,
    "options": {
      "includeStructure": true,
      "includeSentiment": true,
      "includeComplexity": true
    }
  }
}
```

## Privacy Compliance

This server is designed to comply with:

- **FERPA**: Educational records protection
- **GDPR**: Data minimization and purpose limitation
- **COPPA**: Special protections for minors
- **State Laws**: Various state education privacy laws

## Performance

- Content classification: <50ms
- Writing analysis: <200ms (including privacy checks)
- Insight generation: <500ms
- All operations include comprehensive audit logging

## Development

### Adding New Tools

1. Create service in appropriate module
2. Add tool definition in `mcp-tools.controller.ts`
3. Implement privacy checks in service
4. Add audit logging for data access
5. Create tests with privacy scenarios

### Testing Privacy Features

```bash
# Test privacy compliance
npm test -- --testPathPattern=privacy

# Test content classification
npm test -- content-classifier.spec.ts

# Test AI boundaries
npm test -- ai-boundary-enforcer.spec.ts
```

## Security Considerations

- All sensitive data is encrypted with AES-256-CBC
- Student IDs are hashed throughout the system
- Differential privacy applied to aggregated metrics
- Immutable audit trails with cryptographic hashing
- Role-based access control with consent verification

## Support

For issues or questions, please refer to the main Scribe Tree documentation or create an issue in the repository.