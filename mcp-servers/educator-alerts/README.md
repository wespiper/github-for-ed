# Educator Alerts MCP Server

Privacy-enhanced educator alerts and intervention management system with real-time notification capabilities.

## Overview

The Educator Alerts MCP Server provides sophisticated intervention recommendation and educator notification systems with comprehensive privacy protection. It implements the triple-tier fallback architecture for maximum reliability and educational effectiveness.

## Features

### 🎯 Core MCP Tools

1. **`generate_intervention_recommendations`** - AI-powered intervention recommendations based on student analysis
2. **`send_educator_alerts`** - Privacy-aware alert delivery with customizable options
3. **`schedule_intervention_actions`** - Calendar integration and automated reminders
4. **`track_intervention_effectiveness`** - Longitudinal effectiveness measurement

### 🔒 Privacy & Compliance

- **Privacy-First Design**: All operations include privacy context and audit trails
- **Educational Purpose Validation**: Ensures all data access serves legitimate educational goals
- **FERPA/COPPA Compliance**: Built-in compliance with educational privacy regulations
- **Consent Management**: Respect for student and educator privacy choices

### ⚡ Performance & Reliability

- **Triple-Tier Architecture**: MCP → HTTP → Repository fallback
- **Real-Time Notifications**: WebSocket support for immediate alerts
- **Performance Monitoring**: <100ms response time targets
- **Health Checks**: Comprehensive service health monitoring

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Running the Server

#### MCP Mode (for Claude Code integration)
```bash
npm start mcp
```

#### HTTP Mode (for service-to-service communication)
```bash
npm start http
```

#### Dual Mode (both protocols)
```bash
npm start dual
```

### Development
```bash
npm run dev
```

## MCP Tools Usage

### Generate Intervention Recommendations

```json
{
  "studentId": "student-uuid",
  "analysisData": {
    "cognitiveLoad": 0.8,
    "engagementScore": 0.3,
    "qualityScore": 0.4,
    "reflectionDepth": 0.5
  },
  "educationalContext": {
    "assignmentId": "assignment-uuid",
    "courseId": "course-uuid",
    "learningObjectives": ["critical thinking", "analysis"]
  },
  "privacyContext": {
    "requesterId": "educator-uuid",
    "requesterType": "educator",
    "purpose": "intervention_support"
  }
}
```

### Send Educator Alerts

```json
{
  "alerts": [{
    "educatorId": "educator-uuid",
    "studentId": "student-uuid",
    "alertType": "intervention_needed",
    "severity": "high",
    "title": "Student Needs Support",
    "description": "Cognitive overload detected",
    "recommendedActions": [...]
  }],
  "deliveryOptions": {
    "immediate": true,
    "channels": ["in_app", "email"]
  },
  "privacyContext": {
    "requesterId": "educator-uuid",
    "requesterType": "educator",
    "purpose": "student_support"
  }
}
```

### Schedule Intervention Actions

```json
{
  "interventionId": "intervention-uuid",
  "scheduleData": {
    "educatorId": "educator-uuid",
    "studentId": "student-uuid",
    "scheduledType": "meeting",
    "scheduledFor": "2024-01-15T10:00:00Z",
    "duration": 30,
    "agenda": ["Review progress", "Discuss challenges"]
  },
  "reminderSettings": {
    "sendReminders": true,
    "reminderTimes": ["24h", "1h", "15m"]
  },
  "privacyContext": {
    "requesterId": "educator-uuid",
    "requesterType": "educator",
    "purpose": "intervention_scheduling"
  }
}
```

### Track Intervention Effectiveness

```json
{
  "interventionId": "intervention-uuid",
  "measurementData": {
    "measurementType": "pre_post",
    "metrics": {
      "engagementScore": 0.7,
      "qualityScore": 0.6,
      "cognitiveLoad": 0.5
    },
    "baselineData": { "engagementScore": 0.3 },
    "postInterventionData": { "engagementScore": 0.7 },
    "confidenceLevel": 0.85
  },
  "comparisonPeriod": {
    "baseline": { "start": "2024-01-01T00:00:00Z", "end": "2024-01-07T23:59:59Z" },
    "measurement": { "start": "2024-01-15T00:00:00Z", "end": "2024-01-21T23:59:59Z" }
  },
  "privacyContext": {
    "requesterId": "educator-uuid",
    "requesterType": "educator",
    "purpose": "effectiveness_tracking"
  }
}
```

## Configuration

### Environment Variables

```bash
MCP_PORT=3003
HTTP_PORT=3004
NODE_ENV=development
BACKEND_BASE_URL=http://localhost:5001
REPOSITORY_FALLBACK_ENABLED=true
```

### Performance Thresholds

- Alert Generation: 100ms
- Notification Delivery: 2000ms
- Intervention Scheduling: 500ms
- Effectiveness Tracking: 1000ms

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Protocol  │    │   HTTP REST     │    │   Repository    │
│   (Primary)     │───▶│   (Secondary)   │───▶│   (Fallback)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Triple-Tier Fallback

1. **MCP Protocol**: Direct tool execution for Claude Code integration
2. **HTTP REST API**: Service-to-service communication via HTTP
3. **Repository Pattern**: Database fallback when external services fail

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Integration with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "educator-alerts": {
      "command": "node",
      "args": ["./mcp-servers/educator-alerts/dist/index.js", "mcp"]
    }
  }
}
```

## Privacy & Security

- All student data is encrypted at rest and in transit
- Comprehensive audit trails for compliance reporting
- Minimal data exposure based on educational purpose
- Automatic anonymization for aggregated analytics
- Respect for quiet hours and educator preferences

## Support

For issues or questions about the Educator Alerts MCP Server, please refer to the main project documentation or create an issue in the repository.