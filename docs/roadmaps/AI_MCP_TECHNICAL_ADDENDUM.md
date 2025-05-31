# AI Services MCP Migration - Technical Addendum

This document provides detailed technical specifications and implementation examples for the AI Services MCP Microservices Migration Plan, including framework-specific patterns for our hybrid Fastify/NestJS architecture.

## Framework-Specific Implementation Patterns

### Fastify Main API Migration

```typescript
// src/server.ts - Fastify configuration
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production'
  },
  trustProxy: true,
  maxParamLength: 200,
  bodyLimit: 1048576, // 1MB
  caseSensitive: true,
  ignoreTrailingSlash: false
});

// Register plugins with performance optimizations
await app.register(cors, { 
  origin: process.env.ALLOWED_ORIGINS?.split(',') 
});
await app.register(helmet);
await app.register(compress, { 
  global: true,
  threshold: 1024,
  encodings: ['gzip', 'deflate']
});
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Schema validation for 40% performance boost
const aiRequestSchema = {
  body: {
    type: 'object',
    required: ['studentId', 'assignmentId', 'prompt'],
    properties: {
      studentId: { type: 'string', format: 'uuid' },
      assignmentId: { type: 'string', format: 'uuid' },
      prompt: { type: 'string', maxLength: 1000 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' }
      }
    }
  }
};

// Route with schema validation
app.post('/api/ai/generate', {
  schema: aiRequestSchema,
  preHandler: app.auth([app.verifyJWT])
}, async (request, reply) => {
  const result = await aiService.generatePrompt(request.body);
  return { success: true, data: result };
});
```

### NestJS MCP Server Pattern

```typescript
// src/app.module.ts - NestJS root module
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MCPModule } from './mcp/mcp.module';
import { WritingAnalysisModule } from './writing-analysis/writing-analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    }),
    MCPModule,
    WritingAnalysisModule
  ]
})
export class AppModule {}

// src/mcp/mcp.service.ts - MCP integration
import { Injectable } from '@nestjs/common';
import { MCPServer } from '@modelcontextprotocol/server';

@Injectable()
export class MCPService {
  private server: MCPServer;

  constructor(
    private writingAnalysisService: WritingAnalysisService,
    private reflectionService: ReflectionAnalysisService
  ) {
    this.initializeMCPServer();
  }

  private initializeMCPServer() {
    this.server = new MCPServer({
      tools: [
        {
          name: 'analyze_writing_patterns',
          description: 'Analyze writing patterns for a student',
          inputSchema: this.getWritingAnalysisSchema(),
          handler: this.handleWritingAnalysis.bind(this)
        }
      ]
    });
  }

  private async handleWritingAnalysis(params: any) {
    return this.writingAnalysisService.analyzePatterns(params);
  }
}
```

## Detailed Service Specifications

### 1. Educational AI Core MCP Server (NestJS)

#### Service Responsibilities
- Orchestrate AI assistance requests
- Manage Claude API interactions
- Enforce educational boundaries
- Coordinate with other AI services

#### MCP Tools Specification

```typescript
// tools/generate-educational-prompt.ts
interface GenerateEducationalPromptParams {
  studentId: string;
  assignmentId: string;
  writingStage: 'brainstorming' | 'drafting' | 'revision' | 'editing';
  context: {
    currentText?: string;
    learningObjectives: string[];
    aiUsageHistory: AIUsageRecord[];
  };
  boundaryLevel: 'restrictive' | 'moderate' | 'supportive';
}

interface GenerateEducationalPromptResult {
  prompt: string;
  suggestedQuestions: string[];
  boundaryExplanation: string;
  requiredReflection: boolean;
  tokens: {
    estimated: number;
    limit: number;
  };
}

// tools/analyze-class-boundaries.ts
interface AnalyzeClassBoundariesParams {
  courseId: string;
  timeframe?: {
    start: Date;
    end: Date;
  };
}

interface AnalyzeClassBoundariesResult {
  overallBoundaryHealth: number; // 0-100
  studentSegments: {
    struggling: StudentBoundaryProfile[];
    onTrack: StudentBoundaryProfile[];
    advanced: StudentBoundaryProfile[];
  };
  recommendations: BoundaryAdjustmentRecommendation[];
  alerts: BoundaryAlert[];
}
```

#### Internal Service Architecture

```typescript
// services/EducationalAIOrchestrator.ts
export class EducationalAIOrchestrator {
  constructor(
    private claudeProvider: ClaudeProvider,
    private eventBus: EventBus,
    private cache: DistributedCache,
    private config: ServiceConfig
  ) {}

  async generatePrompt(params: GenerateEducationalPromptParams): Promise<GenerateEducationalPromptResult> {
    // Check cache
    const cacheKey = this.buildCacheKey(params);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Emit event for analytics
    await this.eventBus.emit('ai.prompt.requested', {
      studentId: params.studentId,
      stage: params.writingStage,
      timestamp: new Date()
    });

    // Generate prompt with boundaries
    const result = await this.buildEducationalPrompt(params);

    // Cache result
    await this.cache.set(cacheKey, result, { ttl: 300 });

    // Emit completion event
    await this.eventBus.emit('ai.prompt.generated', {
      studentId: params.studentId,
      tokens: result.tokens.estimated
    });

    return result;
  }
}
```

### 2. Writing Analysis MCP Server

#### Service Responsibilities
- Analyze writing patterns and development
- Evaluate reflection quality
- Track revision history
- Generate insights for educators

#### Database Schema Requirements

```sql
-- Writing patterns table (read-only from MCP)
CREATE TABLE writing_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  pattern_type VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  details JSONB NOT NULL,
  INDEX idx_student_patterns (student_id, detected_at),
  INDEX idx_assignment_patterns (assignment_id, pattern_type)
);

-- Pattern aggregations (materialized view)
CREATE MATERIALIZED VIEW student_writing_summary AS
SELECT 
  student_id,
  COUNT(DISTINCT pattern_type) as unique_patterns,
  AVG(confidence) as avg_confidence,
  MAX(detected_at) as last_analysis,
  jsonb_agg(DISTINCT pattern_type) as pattern_types
FROM writing_patterns
WHERE detected_at > NOW() - INTERVAL '30 days'
GROUP BY student_id;
```

#### Event Contracts

```typescript
// events/writing-analysis-events.ts
export interface WritingAnalysisEvents {
  'writing.submitted': {
    studentId: string;
    assignmentId: string;
    documentId: string;
    wordCount: number;
    submittedAt: Date;
  };

  'writing.analysis.completed': {
    studentId: string;
    assignmentId: string;
    patterns: {
      type: string;
      confidence: number;
      details: any;
    }[];
    insights: string[];
    suggestionsForEducator: string[];
  };

  'reflection.quality.assessed': {
    studentId: string;
    reflectionId: string;
    quality: {
      depth: number;
      relevance: number;
      criticalThinking: number;
      overall: number;
    };
    feedback: string[];
  };
}
```

### 3. Cognitive Monitoring MCP Server

#### Real-time Metrics Collection

```typescript
// types/cognitive-metrics.ts
export interface CognitiveMetrics {
  timestamp: Date;
  studentId: string;
  sessionId: string;
  metrics: {
    // Typing patterns
    wordsPerMinute: number;
    pauseDuration: number[];
    deletionRate: number;
    
    // Behavioral indicators
    tabSwitches: number;
    copyPasteEvents: number;
    scrollVelocity: number;
    
    // Engagement metrics
    timeOnTask: number;
    idleTime: number;
    focusScore: number;
  };
}

// services/CognitiveLoadAnalyzer.ts
export class CognitiveLoadAnalyzer {
  private readonly WINDOW_SIZE = 300; // 5 minutes
  private readonly THRESHOLD_HIGH = 0.8;
  private readonly THRESHOLD_CRITICAL = 0.95;

  async analyzeRealTime(metrics: CognitiveMetrics): Promise<CognitiveLoadAssessment> {
    const recentMetrics = await this.getRecentMetrics(
      metrics.studentId, 
      metrics.sessionId
    );
    
    const loadScore = this.calculateCognitiveLoad(recentMetrics);
    const patterns = this.detectPatterns(recentMetrics);
    
    if (loadScore > this.THRESHOLD_CRITICAL) {
      await this.triggerIntervention({
        level: 'critical',
        studentId: metrics.studentId,
        suggestedActions: ['immediate_break', 'educator_alert']
      });
    }
    
    return {
      currentLoad: loadScore,
      trend: this.calculateTrend(recentMetrics),
      patterns,
      recommendations: this.generateRecommendations(loadScore, patterns)
    };
  }
}
```

## Migration Scripts and Utilities

### Phase 1: Express to Fastify Migration

```typescript
// migration-scripts/00-express-to-fastify.ts
import express from 'express';
import Fastify from 'fastify';

// Parallel running strategy for gradual migration
export class GradualMigrationProxy {
  private expressApp: express.Application;
  private fastifyApp: ReturnType<typeof Fastify>;
  
  constructor() {
    this.expressApp = express();
    this.fastifyApp = Fastify({ logger: true });
  }
  
  async migrateRoute(path: string, method: string) {
    // Remove from Express
    const expressRoute = this.expressApp._router.stack.find(
      r => r.route?.path === path && r.route?.methods[method]
    );
    
    // Add to Fastify with enhanced performance
    this.fastifyApp[method](path, {
      schema: this.generateSchema(expressRoute),
      preHandler: this.convertMiddleware(expressRoute.route.stack)
    }, this.convertHandler(expressRoute.route.stack));
  }
  
  private generateSchema(route: any) {
    // Auto-generate JSON Schema from Express validators
    return {
      body: this.extractBodySchema(route),
      querystring: this.extractQuerySchema(route),
      params: this.extractParamsSchema(route)
    };
  }
}

// Fastify plugin for Express compatibility
export const expressCompatPlugin = fp(async (fastify, opts) => {
  // Add Express-like req/res properties
  fastify.decorateRequest('user', null);
  fastify.decorateRequest('session', null);
  
  // Convert Express middleware to Fastify hooks
  fastify.addHook('preHandler', async (request, reply) => {
    // Compatibility layer
    request.req = request.raw;
    reply.res = reply.raw;
  });
});
```

### Phase 1: Repository Pattern Migration (Framework-Agnostic)

```typescript
// migration-scripts/01-create-repositories.ts
import { PrismaClient } from '@prisma/client';

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Abstract base repository
export abstract class BaseRepository<T> implements Repository<T> {
  constructor(protected prisma: PrismaClient) {}
  
  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filter: any): Promise<T[]>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<boolean>;
}

// Concrete implementation
export class StudentRepository extends BaseRepository<Student> {
  async findById(id: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        profile: true,
        assignments: {
          include: {
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      }
    });
  }
  
  async findByWritingPattern(pattern: string): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: {
        writingPatterns: {
          some: {
            patternType: pattern,
            confidence: { gte: 0.7 }
          }
        }
      }
    });
  }
}
```

### Phase 2: Event System Implementation

```typescript
// infrastructure/event-bus.ts
import { EventEmitter } from 'events';
import amqp from 'amqplib';

export interface EventBus {
  emit<T>(event: string, payload: T): Promise<void>;
  on<T>(event: string, handler: (payload: T) => Promise<void>): void;
}

// Local implementation (Phase 1)
export class LocalEventBus implements EventBus {
  private emitter = new EventEmitter();
  
  async emit<T>(event: string, payload: T): Promise<void> {
    this.emitter.emit(event, payload);
    // Log event for debugging
    console.log(`Event emitted: ${event}`, payload);
  }
  
  on<T>(event: string, handler: (payload: T) => Promise<void>): void {
    this.emitter.on(event, async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`Error handling event ${event}:`, error);
      }
    });
  }
}

// RabbitMQ implementation (Phase 3)
export class RabbitMQEventBus implements EventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  
  async connect(url: string): Promise<void> {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
  }
  
  async emit<T>(event: string, payload: T): Promise<void> {
    const exchange = 'scribe.events';
    await this.channel.assertExchange(exchange, 'topic');
    
    const message = Buffer.from(JSON.stringify({
      event,
      payload,
      timestamp: new Date(),
      correlationId: generateCorrelationId()
    }));
    
    await this.channel.publish(exchange, event, message);
  }
  
  async on<T>(event: string, handler: (payload: T) => Promise<void>): Promise<void> {
    const exchange = 'scribe.events';
    const queue = `${process.env.SERVICE_NAME}.${event}`;
    
    await this.channel.assertExchange(exchange, 'topic');
    await this.channel.assertQueue(queue);
    await this.channel.bindQueue(queue, exchange, event);
    
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      
      try {
        const { payload } = JSON.parse(msg.content.toString());
        await handler(payload);
        this.channel.ack(msg);
      } catch (error) {
        console.error(`Error processing ${event}:`, error);
        this.channel.nack(msg, false, true); // Requeue
      }
    });
  }
}
```

### Cache Migration Strategy

```typescript
// infrastructure/cache-adapter.ts
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Migrate from in-memory to Redis
export class RedisCacheAdapter implements CacheAdapter {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
    const serialized = JSON.stringify(value);
    if (options?.ttl) {
      await this.redis.setex(key, options.ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
  
  async clear(): Promise<void> {
    await this.redis.flushdb();
  }
}
```

## API Gateway Configuration

### Kong Configuration

```yaml
# kong.yml
_format_version: "2.1"

services:
  - name: educational-ai-core
    url: http://educational-ai-core:3000
    routes:
      - name: educational-ai-routes
        paths:
          - /api/ai/educational
        strip_path: true
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: jwt
      - name: cors
      - name: request-transformer
        config:
          add:
            headers:
              - X-Service-Name:educational-ai-core

  - name: writing-analysis
    url: http://writing-analysis:3000
    routes:
      - name: writing-analysis-routes
        paths:
          - /api/ai/writing
        strip_path: true
    plugins:
      - name: rate-limiting
        config:
          minute: 200
      - name: jwt
      - name: response-transformer
        config:
          add:
            headers:
              - X-Analysis-Version:1.0

upstreams:
  - name: ai-services.upstream
    targets:
      - target: educational-ai-core:3000
        weight: 100
      - target: writing-analysis:3000
        weight: 100
    healthchecks:
      active:
        healthy:
          interval: 10
          successes: 3
        unhealthy:
          interval: 5
          tcp_failures: 3
```

## Monitoring and Observability

### Prometheus Metrics

```typescript
// monitoring/metrics.ts
import { Counter, Histogram, Registry } from 'prom-client';

export class ServiceMetrics {
  private registry: Registry;
  
  // AI Service specific metrics
  public aiRequestsTotal: Counter<string>;
  public aiRequestDuration: Histogram<string>;
  public aiTokensUsed: Counter<string>;
  public boundaryViolations: Counter<string>;
  
  // Writing analysis metrics
  public writingAnalysisTotal: Counter<string>;
  public writingPatternDetections: Counter<string>;
  public reflectionQualityScores: Histogram<string>;
  
  constructor() {
    this.registry = new Registry();
    
    this.aiRequestsTotal = new Counter({
      name: 'ai_requests_total',
      help: 'Total number of AI requests',
      labelNames: ['service', 'type', 'status'],
      registers: [this.registry]
    });
    
    this.aiRequestDuration = new Histogram({
      name: 'ai_request_duration_seconds',
      help: 'AI request duration in seconds',
      labelNames: ['service', 'type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });
    
    this.aiTokensUsed = new Counter({
      name: 'ai_tokens_used_total',
      help: 'Total AI tokens consumed',
      labelNames: ['service', 'model'],
      registers: [this.registry]
    });
  }
  
  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### Distributed Tracing

```typescript
// tracing/tracer.ts
import { initTracer } from 'jaeger-client';

export function setupTracing(serviceName: string) {
  const config = {
    serviceName,
    sampler: {
      type: 'probabilistic',
      param: 0.1, // Sample 10% of requests
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: 6832,
    },
  };
  
  const options = {
    logger: {
      info: console.log,
      error: console.error,
    },
  };
  
  return initTracer(config, options);
}

// Usage in MCP handlers
export async function tracedHandler(span: Span, params: any) {
  const childSpan = tracer.startSpan('database-query', { childOf: span });
  
  try {
    const result = await database.query(params);
    childSpan.setTag('db.rows', result.length);
    return result;
  } catch (error) {
    childSpan.setTag('error', true);
    childSpan.log({ event: 'error', message: error.message });
    throw error;
  } finally {
    childSpan.finish();
  }
}
```

## Testing Strategy

### MCP Server Testing

```typescript
// tests/mcp-server.test.ts
import { MCPServer } from '../src/mcp-server';
import { MockEventBus } from './mocks/event-bus';
import { MockCache } from './mocks/cache';

describe('Educational AI Core MCP Server', () => {
  let server: MCPServer;
  let eventBus: MockEventBus;
  let cache: MockCache;
  
  beforeEach(() => {
    eventBus = new MockEventBus();
    cache = new MockCache();
    server = new MCPServer({ eventBus, cache });
  });
  
  describe('generate_educational_prompt', () => {
    it('should enforce stage-specific boundaries', async () => {
      const result = await server.callTool('generate_educational_prompt', {
        studentId: 'student-123',
        assignmentId: 'assignment-456',
        writingStage: 'brainstorming',
        context: {
          learningObjectives: ['Develop thesis statements'],
          aiUsageHistory: []
        },
        boundaryLevel: 'restrictive'
      });
      
      expect(result.prompt).toContain('questions');
      expect(result.prompt).not.toContain('Here is a thesis');
      expect(result.requiredReflection).toBe(true);
    });
    
    it('should emit events for analytics', async () => {
      await server.callTool('generate_educational_prompt', validParams);
      
      expect(eventBus.emitted).toContainEqual({
        event: 'ai.prompt.requested',
        payload: expect.objectContaining({
          studentId: 'student-123'
        })
      });
    });
  });
});
```

## Deployment Configuration

### Framework-Specific Dockerfiles

```dockerfile
# Dockerfile.fastify - Optimized for Fastify services
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY . .
# Fastify-specific optimizations
ENV FASTIFY_TRUST_PROXY=true
ENV NODE_ENV=production
ENV UV_THREADPOOL_SIZE=16
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-old-space-size=2048", "dist/server.js"]

# Dockerfile.nestjs - Optimized for NestJS services
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Fastify Main API
  fastify-api:
    build: 
      context: ./backend
      dockerfile: Dockerfile.fastify
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/scribe
    ports:
      - "3001:3000"
    depends_on:
      - redis
      - postgres
    volumes:
      - ./backend:/app
    command: npm run dev:fastify

  # NestJS MCP Servers
  educational-ai-core:
    build: 
      context: ./mcp-servers/educational-ai-core
      dockerfile: Dockerfile.nestjs
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - AMQP_URL=amqp://rabbitmq:5672
      - DATABASE_URL=postgresql://user:pass@postgres:5432/scribe
    depends_on:
      - redis
      - rabbitmq
      - postgres
    volumes:
      - ./mcp-servers/educational-ai-core:/app
    command: npm run start:dev

  # Fastify MCP Servers
  cognitive-monitoring:
    build:
      context: ./mcp-servers/cognitive-monitoring
      dockerfile: Dockerfile.fastify
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - AMQP_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq

  # Infrastructure
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=scribe
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Monitoring
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  redis-data:
  postgres-data:
```

### Kubernetes Manifests (Production)

```yaml
# k8s/educational-ai-core-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: educational-ai-core
  labels:
    app: educational-ai-core
    tier: ai-services
spec:
  replicas: 3
  selector:
    matchLabels:
      app: educational-ai-core
  template:
    metadata:
      labels:
        app: educational-ai-core
    spec:
      containers:
      - name: educational-ai-core
        image: scribetree/educational-ai-core:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: educational-ai-core
spec:
  selector:
    app: educational-ai-core
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

## Rollback Strategy

### Database Rollback

```sql
-- Rollback script for Phase 1
-- Restore direct Prisma access

-- Drop repository pattern views
DROP MATERIALIZED VIEW IF EXISTS student_writing_summary;
DROP TABLE IF EXISTS repository_audit_log;

-- Restore original indexes
CREATE INDEX IF NOT EXISTS idx_students_original ON students(created_at);
```

### Service Rollback

```typescript
// rollback/service-rollback.ts
export class ServiceRollback {
  async rollbackToMonolith(service: string): Promise<void> {
    // 1. Stop new traffic to microservice
    await this.updateApiGateway(service, { enabled: false });
    
    // 2. Drain existing connections
    await this.drainConnections(service, { timeout: 30000 });
    
    // 3. Switch to monolith implementation
    await this.enableMonolithService(service);
    
    // 4. Verify functionality
    const healthy = await this.healthCheck();
    if (!healthy) {
      throw new Error(`Rollback failed for ${service}`);
    }
    
    // 5. Clean up microservice resources
    await this.cleanupMicroservice(service);
  }
}
```

## Performance Benchmarks

### Expected Performance Metrics

| Operation | Express Monolith | Fastify API | NestJS Services | Overall Improvement |
|-----------|-----------------|-------------|-----------------|-------------------|
| Auth Endpoints | 150ms | 50ms | N/A | 67% faster |
| AI Prompt Generation | 800ms | 300ms | 200ms | 75% faster |
| Writing Analysis | 2.5s | N/A | 500ms | 80% faster |
| Cognitive Monitoring | 200ms | 60ms | N/A | 70% faster |
| Bulk Student Analysis | 30s | 10s | 5s (parallel) | 83% faster |
| Concurrent Users | 100 | 300 | 1000 (combined) | 10x capacity |
| Requests/Second | 500 | 1500 | 10000 (combined) | 20x throughput |
| Deployment Time | 45 min | 15 min | 5 min/service | 89% faster |

### Framework-Specific Benchmarks

```typescript
// benchmarks/framework-comparison.ts
import autocannon from 'autocannon';

// Express baseline
const expressResults = await autocannon({
  url: 'http://localhost:3000/api/health',
  connections: 100,
  duration: 30
});
// Results: 500 req/sec, 150ms latency (p99)

// Fastify improvement
const fastifyResults = await autocannon({
  url: 'http://localhost:3001/api/health',
  connections: 100,
  duration: 30
});
// Results: 1500 req/sec, 50ms latency (p99)

// NestJS with DI overhead
const nestResults = await autocannon({
  url: 'http://localhost:3002/api/health',
  connections: 100,
  duration: 30
});
// Results: 1200 req/sec, 80ms latency (p99)
```

## Security Considerations

### Service-to-Service Authentication

```typescript
// security/service-auth.ts
export class ServiceAuthenticator {
  private readonly JWT_SECRET = process.env.SERVICE_JWT_SECRET;
  
  generateServiceToken(serviceName: string): string {
    return jwt.sign({
      iss: 'scribe-tree',
      sub: serviceName,
      aud: 'ai-services',
      iat: Date.now(),
      exp: Date.now() + 3600000, // 1 hour
      scopes: this.getServiceScopes(serviceName)
    }, this.JWT_SECRET);
  }
  
  validateServiceToken(token: string): ServiceClaims {
    try {
      return jwt.verify(token, this.JWT_SECRET) as ServiceClaims;
    } catch (error) {
      throw new UnauthorizedError('Invalid service token');
    }
  }
}
```

## Cost Analysis

### Infrastructure Cost Comparison

| Component | Monolith (monthly) | Microservices (monthly) | Difference |
|-----------|-------------------|-------------------------|------------|
| Compute | $500 (1 large instance) | $600 (6 small instances) | +$100 |
| Database | $200 (1 instance) | $250 (1 primary + 1 replica) | +$50 |
| Cache | $0 (in-memory) | $50 (Redis cluster) | +$50 |
| Message Queue | $0 | $30 (RabbitMQ) | +$30 |
| Monitoring | $0 | $100 (Prometheus + Grafana) | +$100 |
| **Total** | **$700** | **$1030** | **+$330** |

### ROI Justification
- 10x increase in capacity = $7/user → $1.03/user
- Reduced development time saves ~$12k/month (enhanced by framework efficiency)
- Faster feature delivery increases revenue by ~$50k/month
- Fastify performance gains save ~$8k/month in infrastructure
- **Net benefit**: ~$69,670/month (after framework training investment)

## Framework Training Materials

### Week 1: Fastify Training

#### Core Concepts
1. **Performance First**: Understanding Fastify's architecture
2. **Schema Validation**: JSON Schema for request/response
3. **Plugin System**: Encapsulation and decoration patterns
4. **Hooks & Lifecycle**: Request lifecycle management

#### Hands-On Labs
```typescript
// Lab 1: Basic Fastify Server
// Lab 2: Schema Validation & Serialization
// Lab 3: Plugin Development
// Lab 4: Performance Optimization
// Lab 5: Migration from Express
```

### Week 6: NestJS Training

#### Core Concepts
1. **Dependency Injection**: Understanding IoC container
2. **Modules & Providers**: Application structure
3. **Decorators**: Metadata and reflection
4. **Middleware & Guards**: Request processing pipeline

#### Hands-On Labs
```typescript
// Lab 1: Basic NestJS Application
// Lab 2: Module Architecture
// Lab 3: Service & Repository Patterns
// Lab 4: MCP Integration
// Lab 5: Testing with Jest
```

### Performance Optimization Guidelines

#### Fastify Optimization
- Use JSON Schema for 2x serialization speed
- Enable response caching for static data
- Implement connection pooling
- Use pino logger for minimal overhead

#### NestJS Optimization
- Lazy load modules where possible
- Use singleton scope for stateless services
- Implement caching decorators
- Optimize dependency injection tree

This technical addendum provides the detailed implementation guidance needed to execute the AI Services MCP Microservices migration with our hybrid Fastify/NestJS architecture successfully.
