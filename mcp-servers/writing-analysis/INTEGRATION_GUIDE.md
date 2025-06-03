# Writing Analysis MCP Server Integration Guide

This guide explains how to integrate the Writing Analysis MCP Server with the main Scribe Tree platform.

## Prerequisites

- Writing Analysis MCP Server built and tested
- Main Scribe Tree backend running
- Claude Desktop or MCP-compatible client

## Integration Steps

### 1. Configure MCP Client in Main Backend

First, install the MCP client SDK in the main backend:

```bash
cd backend
npm install @modelcontextprotocol/sdk
```

### 2. Create MCP Client Service

Create a new service in the main backend to communicate with the MCP server:

```typescript
// backend/src/services/mcp/WritingAnalysisMCPClient.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class WritingAnalysisMCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  async connect() {
    this.transport = new StdioClientTransport({
      command: 'node',
      args: ['/path/to/mcp-servers/writing-analysis/dist/index.js'],
    });

    this.client = new Client({
      name: 'scribe-tree-backend',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    await this.client.connect(this.transport);
  }

  async analyzeWritingPatterns(params: any) {
    return await this.client.request({
      method: 'tools/call',
      params: {
        name: 'analyze_writing_patterns',
        arguments: params,
      },
    });
  }

  // Add other tool methods...
}
```

### 3. Replace Existing Services

Update the existing services to use the MCP client:

```typescript
// backend/src/services/ai/WritingProcessAnalyzer.ts
export class WritingProcessAnalyzer {
  constructor(
    private mcpClient: WritingAnalysisMCPClient,
  ) {}

  async analyzeWritingPatterns(content: string, userId: string) {
    // Old implementation:
    // const patterns = this.localAnalysis(content);
    
    // New MCP implementation:
    const result = await this.mcpClient.analyzeWritingPatterns({
      content,
      userId,
      role: 'student', // Get from auth context
      purpose: 'learning improvement',
      consent: true, // Get from user preferences
      options: {
        includeStructure: true,
        includeSentiment: true,
        includeComplexity: true,
      },
    });

    return result.patterns;
  }
}
```

### 4. Update Event Handlers

The MCP server emits privacy-enhanced events. Update your event handlers:

```typescript
// backend/src/events/subscribers/WritingAnalysisSubscriber.ts
@EventSubscriber()
export class WritingAnalysisSubscriber {
  // Listen for MCP server events
  @On('writing.analyzed')
  async handleWritingAnalyzed(event: any) {
    // Process the privacy-enhanced event
    console.log('Writing analyzed:', {
      userId: event.userId,
      sensitivityLevel: event.sensitivityLevel,
      patternsDetected: event.patternsDetected,
    });
  }

  @On('reflection.quality.assessed')
  async handleReflectionAssessed(event: any) {
    // Update progressive access levels
    await this.updateStudentAccess(
      event.userId,
      event.progressiveAccessLevel
    );
  }
}
```

### 5. Privacy Integration

#### Add Consent Management

```typescript
// backend/src/middleware/privacyConsent.ts
export async function checkPrivacyConsent(req, res, next) {
  const userId = req.user.id;
  const consent = await getStudentConsent(userId);
  
  req.privacyContext = {
    userId,
    role: req.user.role,
    hasConsent: consent.general,
    isMinor: req.user.age < 18,
  };
  
  next();
}
```

#### Update API Endpoints

```typescript
// backend/src/routes/analytics.ts
router.post('/analyze-writing', checkPrivacyConsent, async (req, res) => {
  const { content } = req.body;
  const { privacyContext } = req;

  const result = await writingAnalysisMCP.analyzeWritingPatterns({
    content,
    userId: privacyContext.userId,
    role: privacyContext.role,
    purpose: 'self-improvement',
    consent: privacyContext.hasConsent,
  });

  res.json(result);
});
```

### 6. Frontend Updates

#### Display Privacy Information

```tsx
// frontend/src/components/analytics/WritingAnalytics.tsx
export function WritingAnalytics({ sessionId }) {
  const { data } = useQuery(['writing-patterns', sessionId]);

  return (
    <div>
      {data?.privacyMetadata?.contentRedacted && (
        <Alert>
          Some sensitive content was protected during analysis.
        </Alert>
      )}
      
      <AnalyticsDisplay patterns={data?.patterns} />
    </div>
  );
}
```

#### Show Progressive Access Levels

```tsx
// frontend/src/components/ai/AIAssistancePanel.tsx
export function AIAssistancePanel({ reflectionQuality }) {
  const accessLevel = reflectionQuality?.progressiveAccess?.currentLevel;

  return (
    <div>
      <Badge>{accessLevel} Access</Badge>
      
      {accessLevel === 'restricted' && (
        <Alert>
          Complete your reflection to unlock AI assistance.
        </Alert>
      )}
      
      <NextLevelRequirements 
        requirements={reflectionQuality?.progressiveAccess?.nextLevelRequirements}
      />
    </div>
  );
}
```

### 7. Audit Trail Integration

Connect the MCP audit logs to your main logging system:

```typescript
// backend/src/monitoring/AuditLogCollector.ts
export class AuditLogCollector {
  async collectFromMCP() {
    // Query MCP server for audit logs
    const logs = await mcpClient.getAuditLogs({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      accessTypes: ['analyze', 'share'],
    });

    // Store in main audit system
    for (const log of logs) {
      await this.auditRepository.create({
        ...log,
        source: 'writing-analysis-mcp',
      });
    }
  }
}
```

### 8. Environment Configuration

Update your environment files:

```env
# backend/.env
MCP_WRITING_ANALYSIS_PATH=/path/to/mcp-servers/writing-analysis/dist/index.js
MCP_WRITING_ANALYSIS_TIMEOUT=5000

# Privacy settings (can override MCP defaults)
PRIVACY_CONTENT_CLASSIFICATION=true
PRIVACY_REQUIRE_CONSENT=true
PRIVACY_DIFFERENTIAL_PRIVACY=true
```

### 9. Docker Deployment

Add the MCP server to your Docker setup:

```yaml
# docker-compose.yml
services:
  writing-analysis-mcp:
    build: ./mcp-servers/writing-analysis
    environment:
      - NODE_ENV=production
    volumes:
      - ./mcp-servers/writing-analysis/.env.privacy:/app/.env.privacy
    networks:
      - scribe-network

  backend:
    depends_on:
      - writing-analysis-mcp
    environment:
      - MCP_WRITING_ANALYSIS_HOST=writing-analysis-mcp
      - MCP_WRITING_ANALYSIS_PORT=3000
```

### 10. Testing Integration

Create integration tests:

```typescript
// backend/src/tests/integration/mcp-integration.test.ts
describe('Writing Analysis MCP Integration', () => {
  it('should analyze writing with privacy', async () => {
    const result = await request(app)
      .post('/api/analyze-writing')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Test essay content' });

    expect(result.body).toHaveProperty('patterns');
    expect(result.body).toHaveProperty('privacyMetadata');
  });

  it('should enforce consent requirements', async () => {
    // Remove consent
    await updateStudentConsent(studentId, { analytics: false });

    const result = await request(app)
      .post('/api/track-progress')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ metrics: { wordCount: 100 } });

    expect(result.body.privacyCompliant).toBe(false);
  });
});
```

## Monitoring and Maintenance

### Health Checks

Add MCP server health checks:

```typescript
// backend/src/monitoring/health.ts
export async function checkMCPServers() {
  const statuses = {
    writingAnalysis: await mcpClient.healthCheck(),
  };

  return {
    healthy: Object.values(statuses).every(s => s.healthy),
    servers: statuses,
  };
}
```

### Performance Monitoring

Track MCP response times:

```typescript
// backend/src/monitoring/metrics.ts
export function trackMCPPerformance(tool: string, duration: number) {
  metrics.histogram('mcp.response_time', duration, {
    tool,
    server: 'writing-analysis',
  });
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MCP server is running
   - Verify path in configuration
   - Check file permissions

2. **Slow Response Times**
   - Monitor server resources
   - Check privacy processing overhead
   - Consider caching frequent requests

3. **Privacy Errors**
   - Verify consent configuration
   - Check privacy thresholds
   - Review audit logs

### Debug Mode

Enable debug logging:

```typescript
// Set in environment
MCP_DEBUG=true

// Or in code
mcpClient.setDebug(true);
```

## Migration Checklist

- [ ] Install MCP client SDK
- [ ] Create MCP client service
- [ ] Update WritingProcessAnalyzer
- [ ] Update ReflectionAnalysisService
- [ ] Add privacy consent middleware
- [ ] Update API endpoints
- [ ] Add frontend privacy UI
- [ ] Configure audit log integration
- [ ] Update Docker configuration
- [ ] Run integration tests
- [ ] Deploy to staging
- [ ] Monitor performance
- [ ] Deploy to production

## Support

For issues or questions:
- Check MCP server logs: `dist/logs/`
- Review audit trails for privacy issues
- Consult TEST_RESULTS.md for expected behavior
- Open issue in repository with logs and context