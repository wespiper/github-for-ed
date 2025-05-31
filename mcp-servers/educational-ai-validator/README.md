# Educational AI Validator MCP Server

An MCP (Model Context Protocol) server that validates AI responses against Scribe Tree's bounded enhancement educational philosophy. This server ensures all AI interactions maintain educational integrity, promote independence, and prevent dependency.

## Overview

The Educational AI Validator provides comprehensive validation tools for:
- **Bounded Enhancement**: Ensures AI never provides answers, only educational questions
- **Bloom's Taxonomy**: Analyzes cognitive levels of questions
- **Dependency Prevention**: Detects and prevents AI dependency patterns
- **Philosophy Enforcement**: Validates compliance with educational principles
- **Progressive Access**: Manages student AI access based on demonstrated growth
- **Reflection Quality**: Ensures meaningful student reflection on AI interactions

## Installation

```bash
cd mcp-servers/educational-ai-validator
npm install
npm run build
```

## Usage

### Starting the Server

```bash
npm start
```

The server runs on stdio and can be integrated with any MCP-compatible client.

### Available Tools

#### 1. `validate_bounded_enhancement`
Comprehensive validation of AI responses against educational principles.

**Input:**
```json
{
  "aiResponse": {
    "questions": ["What evidence supports your argument?"],
    "educationalRationale": "Promotes critical thinking",
    "attribution": "AI-generated questions",
    "limitations": ["General guidance only"]
  },
  "context": {
    "writingStage": "revising",
    "academicLevel": "undergraduate",
    "studentProfile": { /* optional */ }
  }
}
```

**Output:**
```json
{
  "isValid": true,
  "overallScore": 85,
  "principleScores": {
    "questionsOnly": 100,
    "educationalValue": 80,
    "appropriateDifficulty": 85,
    "independenceBuilding": 90,
    "transparentRationale": 75,
    "dependencyPrevention": 80
  },
  "issues": [],
  "recommendations": [],
  "educationalRationale": "Questions maintain educational boundaries..."
}
```

#### 2. `assess_blooms_taxonomy`
Analyzes questions for Bloom's taxonomy cognitive levels.

**Input:**
```json
{
  "questions": [
    "Define the key terms.",
    "Analyze the relationship.",
    "Evaluate the effectiveness."
  ],
  "targetLevel": 4,
  "academicLevel": "undergraduate"
}
```

**Output:**
```json
{
  "overallLevel": 4,
  "questionLevels": [
    {
      "question": "Define the key terms.",
      "level": 1,
      "confidence": 0.9,
      "reasoning": "Contains primary Bloom's verb: 'define'"
    }
  ],
  "distribution": {
    "remember": 33,
    "understand": 0,
    "apply": 0,
    "analyze": 33,
    "evaluate": 33,
    "create": 0
  },
  "recommendations": ["Add more higher-order thinking questions"],
  "educationalAlignment": {
    "isAppropriate": true,
    "targetLevel": 4,
    "actualLevel": 4,
    "adjustment": "maintain_level"
  }
}
```

#### 3. `check_dependency_risk`
Assesses AI dependency risk from usage patterns.

**Input:**
```json
{
  "interactionPattern": {
    "frequency": 5,
    "requestTypes": ["question_generation", "clarification"],
    "reflectionQuality": 65,
    "independentWorkRatio": 0.6
  },
  "studentProfile": { /* optional */ }
}
```

**Output:**
```json
{
  "riskLevel": "medium",
  "riskScore": 45,
  "indicators": {
    "requestFrequency": 5,
    "reflectionQuality": 65,
    "independenceRatio": 0.6,
    "progressionTrend": "stable"
  },
  "issues": ["High AI request frequency"],
  "recommendations": ["Gradually reduce AI access"],
  "interventions": [
    {
      "type": "independence_building",
      "priority": "medium",
      "description": "Complete independence exercises"
    }
  ]
}
```

#### 4. `enforce_philosophy_principles`
Validates responses against Scribe Tree's educational philosophy.

**Input:**
```json
{
  "response": { /* AI response object */ },
  "principles": {
    "questionsOnly": true,
    "mandatoryReflection": true,
    "progressiveAccess": true,
    "transparentAttribution": true,
    "independenceBuilding": true
  }
}
```

#### 5. `validate_reflection_requirements`
Ensures reflection requirements are appropriate for student profile.

**Input:**
```json
{
  "response": { /* AI response with reflection requirements */ },
  "studentProfile": { /* required */ },
  "previousReflections": [ /* optional */ ]
}
```

#### 6. `generate_educational_rationale`
Creates transparent educational rationale for AI actions.

**Input:**
```json
{
  "aiAction": {
    "type": "question_generation",
    "content": ["What evidence supports this?"],
    "timing": "after_draft_completion"
  },
  "context": { /* educational context */ },
  "educationalGoals": ["critical thinking", "evidence evaluation"]
}
```

#### 7. `analyze_question_educational_value`
Deep analysis of individual question quality.

**Input:**
```json
{
  "question": "How might different perspectives challenge your assumptions?",
  "context": { /* educational context */ },
  "learningObjectives": ["perspective taking", "critical thinking"]
}
```

#### 8. `validate_progressive_access`
Validates student AI access level changes.

**Input:**
```json
{
  "currentAccessLevel": "basic",
  "studentMetrics": {
    "reflectionQualityAverage": 75,
    "independenceScore": 65,
    "consistencyScore": 80,
    "timeInCurrentLevel": 21,
    "totalInteractions": 45,
    "recentBreakthroughs": 2,
    "strugglingIndicators": 1
  },
  "proposedChange": {
    "targetLevel": "standard",
    "reason": "Consistent quality improvement",
    "expectedBenefit": "Increased autonomy"
  }
}
```

## Integration with Scribe Tree Backend

### 1. Install MCP Client

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Initialize in AIBoundaryService

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';

export class AIBoundaryService {
  private static mcpClient: MCPClient;

  static async initializeMCP() {
    this.mcpClient = new MCPClient({
      name: 'scribe-tree-backend',
      version: '1.0.0'
    });
    
    await this.mcpClient.connect({
      transport: {
        type: 'stdio',
        command: 'node',
        args: ['./mcp-servers/educational-ai-validator/dist/index.js']
      }
    });
  }

  static async evaluateAssistanceRequest(request: AIAssistanceRequest) {
    const response = await this.createEducationalResponse(request);
    
    // Validate with MCP server
    const validation = await this.mcpClient.call('validate_bounded_enhancement', {
      aiResponse: response,
      context: {
        writingStage: request.writingStage,
        academicLevel: request.academicLevel,
        studentProfile: request.studentProfile
      }
    });
    
    if (!validation.isValid) {
      // Apply adjustments or reject
      throw new Error('AI response violates educational principles');
    }
    
    return response;
  }
}
```

## Educational Philosophy Principles

### 1. Productive Struggle
- Questions maintain appropriate challenge without providing answers
- Scaffolding provided during extended struggle
- Difficulty matches student cognitive capacity

### 2. Cognitive Load Balance
- Questions adjusted based on student state
- Complexity reduced during overload
- Challenge increased during low load

### 3. Independence Trajectory
- Progressive reduction in AI support
- Strategy and resource identification
- Metacognitive reflection requirements

### 4. Transfer Learning
- Questions connect to broader skills
- Pattern recognition across contexts
- Building on student strengths

### 5. Transparent Dependency
- Clear AI attribution required
- Limitations disclosed
- Educational rationale provided

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture

```
src/
├── index.ts                    # MCP server entry point
├── tools/                      # MCP tool implementations
│   ├── bounded-enhancement-validator.ts
│   ├── blooms-taxonomy-analyzer.ts
│   ├── dependency-risk-detector.ts
│   ├── philosophy-enforcer.ts
│   ├── reflection-requirement-validator.ts
│   └── educational-rationale-generator.ts
├── validators/                 # Validation logic
│   ├── question-quality-validator.ts
│   ├── cognitive-load-validator.ts
│   ├── independence-trajectory-validator.ts
│   ├── philosophy-principles.ts
│   └── progressive-access-validator.ts
├── types/                      # TypeScript definitions
│   ├── educational-contexts.ts
│   └── validation-results.ts
└── utils/                      # Utility functions
    └── blooms-taxonomy-keywords.ts
```

## License

MIT - See LICENSE file in the root repository.