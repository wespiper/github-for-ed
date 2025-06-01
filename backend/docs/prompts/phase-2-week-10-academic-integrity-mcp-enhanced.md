# Phase 2, Week 10: Academic Integrity MCP Server (Enhanced)

## Overview

You are implementing the Academic Integrity MCP server for Scribe Tree, a revolutionary educational writing platform. This server focuses on responsible AI use detection, educational value validation, and transparent integrity monitoring while respecting student privacy and promoting learning.

## Educational Context

Scribe Tree transforms writing education by making the writing process visible and collaborative. The Academic Integrity server ensures AI assistance aligns with educational goals while fostering student independence and honest disclosure of AI use.

## Core MCP Server Structure

```typescript
// mcp-servers/academic-integrity/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk';
import { 
  AIDetectionEngine,
  AuthenticityAnalyzer,
  IntegrityReporter,
  ReflectionFacilitator,
  BoundaryEnforcer,
  InteractionAuditor,
  PurposeValidator,
  PrivacyMonitor
} from './analyzers';

const server = new McpServer({
  name: 'academic-integrity',
  version: '1.0.0',
  description: 'Academic integrity monitoring with educational AI boundaries'
});

// Tool implementations follow...
```

## Implementation Requirements

### 1. Core Academic Integrity Tools

#### Tool 1: Detect AI Assistance
```typescript
server.addTool({
  name: 'detect_ai_assistance',
  description: 'Analyze text for AI assistance patterns while promoting transparency',
  parameters: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to analyze' },
      contextType: { 
        type: 'string', 
        enum: ['draft', 'revision', 'final', 'reflection'],
        description: 'Writing stage context'
      },
      disclosedAIUse: { 
        type: 'boolean', 
        description: 'Whether student disclosed AI assistance'
      },
      assignmentRequirements: {
        type: 'object',
        properties: {
          allowedAIUse: { type: 'string', enum: ['none', 'limited', 'guided', 'open'] },
          requiredReflection: { type: 'boolean' },
          specificRestrictions: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['text', 'contextType', 'assignmentRequirements']
  },
  handler: async (args) => {
    const detection = await aiDetectionEngine.analyze({
      text: args.text,
      context: args.contextType,
      disclosed: args.disclosedAIUse,
      requirements: args.assignmentRequirements
    });

    // Reward transparency and honest disclosure
    if (args.disclosedAIUse && detection.aiAssistanceDetected) {
      detection.integrityScore += 20; // Bonus for honesty
      detection.feedback = 'Thank you for disclosing AI use. Let\'s explore how it helped your learning.';
    }

    return {
      aiAssistanceDetected: detection.aiAssistanceDetected,
      confidence: detection.confidence,
      patterns: detection.patterns.map(p => ({
        type: p.type,
        description: p.description,
        educationalConcern: p.educationalConcern,
        learningOpportunity: p.learningOpportunity
      })),
      integrityScore: detection.integrityScore,
      recommendations: detection.recommendations,
      reflectionPrompts: generateReflectionPrompts(detection)
    };
  }
});
```

#### Tool 2: Analyze Authenticity Patterns
```typescript
server.addTool({
  name: 'analyze_authenticity_patterns',
  description: 'Examine writing patterns for authentic student voice and learning progress',
  parameters: {
    type: 'object',
    properties: {
      currentText: { type: 'string', description: 'Current writing sample' },
      writingHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            timestamp: { type: 'string' },
            context: { type: 'string' }
          }
        }
      },
      studentProfile: {
        type: 'object',
        properties: {
          gradeLevel: { type: 'string' },
          writingStrengths: { type: 'array', items: { type: 'string' } },
          knownChallenges: { type: 'array', items: { type: 'string' } },
          learningGoals: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['currentText', 'studentProfile']
  },
  handler: async (args) => {
    const analysis = await authenticityAnalyzer.analyzePatterns({
      current: args.currentText,
      history: args.writingHistory || [],
      profile: args.studentProfile
    });

    return {
      authenticityScore: analysis.authenticityScore,
      voiceConsistency: analysis.voiceConsistency,
      growthIndicators: analysis.growthIndicators.map(gi => ({
        area: gi.area,
        progress: gi.progress,
        evidence: gi.evidence,
        nextSteps: gi.nextSteps
      })),
      concernAreas: analysis.concerns.map(c => ({
        type: c.type,
        severity: c.severity,
        educationalImpact: c.educationalImpact,
        supportStrategy: c.supportStrategy
      })),
      developmentTrajectory: analysis.trajectory,
      celebrateProgress: analysis.achievements
    };
  }
});
```

#### Tool 3: Generate Integrity Reports
```typescript
server.addTool({
  name: 'generate_integrity_reports',
  description: 'Create comprehensive academic integrity reports focused on learning',
  parameters: {
    type: 'object',
    properties: {
      studentId: { type: 'string' },
      assignmentId: { type: 'string' },
      reportType: {
        type: 'string',
        enum: ['student_reflection', 'educator_insight', 'parent_summary', 'self_assessment']
      },
      timeframe: {
        type: 'object',
        properties: {
          start: { type: 'string' },
          end: { type: 'string' }
        }
      },
      includeGrowthMetrics: { type: 'boolean', default: true },
      focusAreas: {
        type: 'array',
        items: { 
          type: 'string',
          enum: ['ai_use', 'authenticity', 'progress', 'reflection_quality', 'independence']
        }
      }
    },
    required: ['studentId', 'assignmentId', 'reportType']
  },
  handler: async (args) => {
    const report = await integrityReporter.generateReport({
      studentId: args.studentId,
      assignmentId: args.assignmentId,
      type: args.reportType,
      timeframe: args.timeframe,
      includeGrowth: args.includeGrowthMetrics,
      focus: args.focusAreas
    });

    // Tailor report to audience and educational goals
    return {
      reportId: report.id,
      type: report.type,
      summary: report.summary,
      keyFindings: report.findings.map(f => ({
        area: f.area,
        insight: f.insight,
        evidence: f.evidence,
        learningImplication: f.learningImplication
      })),
      growthTrajectory: report.growthMetrics,
      aiUsagePatterns: {
        frequency: report.aiUsage.frequency,
        appropriateness: report.aiUsage.appropriateness,
        learningAlignment: report.aiUsage.learningAlignment,
        disclosureRate: report.aiUsage.disclosureRate
      },
      recommendations: report.recommendations.map(r => ({
        priority: r.priority,
        action: r.action,
        rationale: r.rationale,
        resources: r.resources
      })),
      celebrateAchievements: report.achievements,
      nextSteps: report.actionPlan
    };
  }
});
```

#### Tool 4: Facilitate Reflection Dialogues
```typescript
server.addTool({
  name: 'facilitate_reflection_dialogues',
  description: 'Guide meaningful reflection conversations about AI use and learning',
  parameters: {
    type: 'object',
    properties: {
      dialogueType: {
        type: 'string',
        enum: ['ai_use_disclosure', 'learning_process', 'challenge_discussion', 'growth_celebration']
      },
      participants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['student', 'educator', 'peer'] },
            id: { type: 'string' }
          }
        }
      },
      context: {
        type: 'object',
        properties: {
          assignmentId: { type: 'string' },
          specificIncident: { type: 'string' },
          learningGoals: { type: 'array', items: { type: 'string' } }
        }
      },
      desiredOutcome: {
        type: 'string',
        enum: ['understanding', 'accountability', 'growth_planning', 'skill_development']
      }
    },
    required: ['dialogueType', 'participants', 'context']
  },
  handler: async (args) => {
    const dialogue = await reflectionFacilitator.createDialogue({
      type: args.dialogueType,
      participants: args.participants,
      context: args.context,
      outcome: args.desiredOutcome
    });

    return {
      dialogueId: dialogue.id,
      framework: dialogue.framework,
      openingPrompts: dialogue.prompts.opening.map(p => ({
        question: p.question,
        purpose: p.purpose,
        followUps: p.followUps
      })),
      guidedQuestions: dialogue.prompts.guided.map(q => ({
        stage: q.stage,
        question: q.question,
        scaffolding: q.scaffolding,
        learningFocus: q.learningFocus
      })),
      activeListeningCues: dialogue.listeningCues,
      reflectionScaffolds: dialogue.scaffolds,
      closingStrategies: dialogue.closing.map(c => ({
        approach: c.approach,
        commitments: c.commitments,
        nextSteps: c.nextSteps
      })),
      documentationTemplate: dialogue.template
    };
  }
});
```

### 2. Educational AI Boundary Tools

#### Tool 5: Enforce AI Educational Boundaries
```typescript
server.addTool({
  name: 'enforce_ai_educational_boundaries',
  description: 'Ensure AI assistance stays within educational boundaries',
  parameters: {
    type: 'object',
    properties: {
      requestedAssistance: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          content: { type: 'string' },
          scope: { type: 'string' }
        }
      },
      studentContext: {
        type: 'object',
        properties: {
          currentSkillLevel: { type: 'string' },
          learningObjectives: { type: 'array', items: { type: 'string' } },
          independenceGoals: { type: 'array', items: { type: 'string' } }
        }
      },
      assignmentBoundaries: {
        type: 'object',
        properties: {
          allowedSupport: { type: 'array', items: { type: 'string' } },
          restrictedAreas: { type: 'array', items: { type: 'string' } },
          requiredIndependence: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['requestedAssistance', 'studentContext', 'assignmentBoundaries']
  },
  handler: async (args) => {
    const enforcement = await boundaryEnforcer.evaluate({
      request: args.requestedAssistance,
      student: args.studentContext,
      boundaries: args.assignmentBoundaries
    });

    return {
      decision: enforcement.decision,
      rationale: enforcement.rationale,
      educationalJustification: enforcement.justification,
      allowedAlternatives: enforcement.alternatives.map(a => ({
        type: a.type,
        description: a.description,
        learningBenefit: a.benefit,
        independenceScore: a.independenceScore
      })),
      boundaryGuidance: {
        whatToAllow: enforcement.guidance.allow,
        whatToRestrict: enforcement.guidance.restrict,
        howToScaffold: enforcement.guidance.scaffold
      },
      studentExplanation: enforcement.studentMessage,
      educatorNotification: enforcement.educatorAlert
    };
  }
});
```

#### Tool 6: Audit AI Interactions
```typescript
server.addTool({
  name: 'audit_ai_interactions',
  description: 'Comprehensive audit of AI interactions for educational value',
  parameters: {
    type: 'object',
    properties: {
      interactionHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            requestType: { type: 'string' },
            aiResponse: { type: 'string' },
            studentReaction: { type: 'string' }
          }
        }
      },
      auditFocus: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['educational_value', 'boundary_compliance', 'independence_impact', 'learning_outcomes']
        }
      },
      complianceStandards: {
        type: 'object',
        properties: {
          privacyRequirements: { type: 'array', items: { type: 'string' } },
          educationalStandards: { type: 'array', items: { type: 'string' } },
          ethicalGuidelines: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['interactionHistory', 'auditFocus']
  },
  handler: async (args) => {
    const audit = await interactionAuditor.performAudit({
      history: args.interactionHistory,
      focus: args.auditFocus,
      standards: args.complianceStandards
    });

    return {
      auditId: audit.id,
      overallCompliance: audit.complianceScore,
      findings: audit.findings.map(f => ({
        category: f.category,
        severity: f.severity,
        description: f.description,
        educationalImpact: f.impact,
        remediation: f.remediation
      })),
      patterns: {
        positive: audit.patterns.positive.map(p => ({
          pattern: p.description,
          frequency: p.frequency,
          learningBenefit: p.benefit
        })),
        concerning: audit.patterns.concerning.map(p => ({
          pattern: p.description,
          risk: p.risk,
          intervention: p.intervention
        }))
      },
      recommendations: audit.recommendations,
      complianceReport: audit.compliance,
      actionItems: audit.actions.map(a => ({
        priority: a.priority,
        action: a.description,
        timeline: a.timeline,
        responsible: a.responsible
      }))
    };
  }
});
```

#### Tool 7: Validate AI Educational Purpose
```typescript
server.addTool({
  name: 'validate_ai_educational_purpose',
  description: 'Ensure AI use aligns with educational objectives',
  parameters: {
    type: 'object',
    properties: {
      aiUsageInstance: {
        type: 'object',
        properties: {
          request: { type: 'string' },
          response: { type: 'string' },
          studentIntent: { type: 'string' },
          actualOutcome: { type: 'string' }
        }
      },
      learningObjectives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            bloomsLevel: { type: 'string' },
            assessmentCriteria: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      pedagogicalFramework: {
        type: 'object',
        properties: {
          approach: { type: 'string' },
          principles: { type: 'array', items: { type: 'string' } },
          expectedOutcomes: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['aiUsageInstance', 'learningObjectives']
  },
  handler: async (args) => {
    const validation = await purposeValidator.validate({
      usage: args.aiUsageInstance,
      objectives: args.learningObjectives,
      framework: args.pedagogicalFramework
    });

    return {
      isEducationallyValid: validation.isValid,
      alignmentScore: validation.alignmentScore,
      objectiveMapping: validation.mappings.map(m => ({
        objective: m.objective,
        alignment: m.alignment,
        evidence: m.evidence,
        gaps: m.gaps
      })),
      pedagogicalAnalysis: {
        strengthens: validation.analysis.strengthens,
        weakens: validation.analysis.weakens,
        opportunities: validation.analysis.opportunities
      },
      recommendations: validation.recommendations.map(r => ({
        aspect: r.aspect,
        suggestion: r.suggestion,
        expectedBenefit: r.benefit
      })),
      alternativeApproaches: validation.alternatives,
      educatorGuidance: validation.guidance
    };
  }
});
```

#### Tool 8: Monitor AI Privacy Compliance
```typescript
server.addTool({
  name: 'monitor_ai_privacy_compliance',
  description: 'Ensure AI interactions comply with student privacy requirements',
  parameters: {
    type: 'object',
    properties: {
      dataFlows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            destination: { type: 'string' },
            dataType: { type: 'string' },
            purpose: { type: 'string' }
          }
        }
      },
      privacyPolicies: {
        type: 'object',
        properties: {
          ferpa: { type: 'boolean' },
          coppa: { type: 'boolean' },
          gdpr: { type: 'boolean' },
          localRequirements: { type: 'array', items: { type: 'string' } }
        }
      },
      sensitivityLevels: {
        type: 'object',
        properties: {
          personalIdentifiers: { type: 'string', enum: ['none', 'anonymized', 'pseudonymized'] },
          academicRecords: { type: 'string', enum: ['restricted', 'aggregated', 'individual'] },
          behavioralData: { type: 'string', enum: ['none', 'patterns_only', 'detailed'] }
        }
      }
    },
    required: ['dataFlows', 'privacyPolicies']
  },
  handler: async (args) => {
    const compliance = await privacyMonitor.assess({
      flows: args.dataFlows,
      policies: args.privacyPolicies,
      sensitivity: args.sensitivityLevels
    });

    return {
      complianceStatus: compliance.status,
      violations: compliance.violations.map(v => ({
        severity: v.severity,
        regulation: v.regulation,
        description: v.description,
        remediation: v.remediation,
        deadline: v.deadline
      })),
      dataHandling: {
        appropriate: compliance.handling.appropriate,
        improvements: compliance.handling.improvements,
        risks: compliance.handling.risks
      },
      privacyEnhancements: compliance.enhancements.map(e => ({
        area: e.area,
        recommendation: e.recommendation,
        implementation: e.implementation,
        benefit: e.benefit
      })),
      studentRights: {
        access: compliance.rights.access,
        correction: compliance.rights.correction,
        deletion: compliance.rights.deletion,
        portability: compliance.rights.portability
      },
      auditTrail: compliance.audit,
      certificationStatus: compliance.certification
    };
  }
});
```

## Integration Examples

### Example 1: Comprehensive Integrity Check
```typescript
// Detect AI use with educational context
const detection = await detect_ai_assistance({
  text: studentEssay,
  contextType: 'final',
  disclosedAIUse: true,
  assignmentRequirements: {
    allowedAIUse: 'guided',
    requiredReflection: true,
    specificRestrictions: ['no_direct_copying', 'must_cite_ai_help']
  }
});

// Validate educational purpose
const validation = await validate_ai_educational_purpose({
  aiUsageInstance: {
    request: "Help me improve my thesis statement",
    response: aiResponse,
    studentIntent: "clarify argument",
    actualOutcome: "refined thesis with student's own ideas"
  },
  learningObjectives: [{
    objective: "Develop clear argumentation",
    bloomsLevel: "analysis",
    assessmentCriteria: ["clarity", "originality", "support"]
  }]
});
```

### Example 2: Privacy-Compliant Reporting
```typescript
// Generate educator report with privacy compliance
const report = await generate_integrity_reports({
  studentId: 'anonymized-id-123',
  assignmentId: 'essay-assignment',
  reportType: 'educator_insight',
  includeGrowthMetrics: true,
  focusAreas: ['ai_use', 'authenticity', 'progress']
});

// Monitor privacy compliance
const privacy = await monitor_ai_privacy_compliance({
  dataFlows: [{
    source: 'student_writing',
    destination: 'ai_analysis',
    dataType: 'academic_work',
    purpose: 'integrity_monitoring'
  }],
  privacyPolicies: {
    ferpa: true,
    coppa: true,
    gdpr: false,
    localRequirements: ['state_student_privacy_act']
  }
});
```

## Testing Strategy

```typescript
describe('Academic Integrity MCP Server', () => {
  describe('AI Detection with Educational Value', () => {
    it('should reward honest AI disclosure', async () => {
      const result = await detect_ai_assistance({
        text: 'Essay with AI help',
        disclosedAIUse: true,
        contextType: 'revision',
        assignmentRequirements: { allowedAIUse: 'guided' }
      });
      
      expect(result.integrityScore).toBeGreaterThan(80);
      expect(result.feedback).toContain('Thank you for disclosing');
    });

    it('should provide learning opportunities, not just penalties', async () => {
      const result = await detect_ai_assistance({
        text: 'Undisclosed AI content',
        disclosedAIUse: false,
        contextType: 'final',
        assignmentRequirements: { allowedAIUse: 'none' }
      });
      
      expect(result.reflectionPrompts).toHaveLength(3);
      expect(result.recommendations[0]).toContain('learning opportunity');
    });
  });

  describe('Privacy and Compliance', () => {
    it('should anonymize student data in reports', async () => {
      const report = await generate_integrity_reports({
        studentId: 'real-student-id',
        assignmentId: 'assignment-1',
        reportType: 'educator_insight'
      });
      
      expect(report.summary).not.toContain('real-student-id');
      expect(report.keyFindings[0].evidence).toBeAnonymized();
    });

    it('should enforce educational boundaries', async () => {
      const boundary = await enforce_ai_educational_boundaries({
        requestedAssistance: {
          type: 'write_essay',
          content: 'Write my essay for me',
          scope: 'complete_work'
        },
        studentContext: {
          currentSkillLevel: 'developing',
          learningObjectives: ['independent writing']
        },
        assignmentBoundaries: {
          allowedSupport: ['brainstorming', 'grammar_check'],
          restrictedAreas: ['content_generation']
        }
      });
      
      expect(boundary.decision).toBe('restrict');
      expect(boundary.allowedAlternatives).toHaveLength(3);
      expect(boundary.studentExplanation).toBeEducational();
    });
  });
});
```

## Philosophical Alignment

### Trust Through Transparency
- Reward honest AI disclosure with integrity points
- Focus on learning opportunities, not punishment
- Make AI assistance visible and valuable for assessment
- Build features students want to engage with

### Educational Boundaries
- AI enhances thinking, doesn't replace it
- Progressive access based on demonstrated reflection
- Clear boundaries that support independence
- Privacy-first approach to student data

### Process Over Product
- Track how AI supports the learning journey
- Analyze growth patterns, not just violations
- Enable educator insights without surveillance
- Focus on developing independent writers

## Performance Considerations

- Cache frequently accessed student profiles (5-minute TTL)
- Batch analyze interactions for efficiency
- Use streaming for real-time boundary enforcement
- Implement circuit breakers for external AI detection APIs

## Security and Privacy

- All student data must be anonymized or pseudonymized
- Implement role-based access control for reports
- Audit trail for all data access
- Comply with FERPA, COPPA, and local regulations
- End-to-end encryption for sensitive academic data

## Success Metrics

- **Disclosure Rate**: % of students voluntarily disclosing AI use
- **Learning Alignment**: % of AI interactions supporting objectives
- **Privacy Compliance**: 100% adherence to regulations
- **Educator Satisfaction**: Usefulness of integrity insights
- **Student Growth**: Improvement in independent writing skills