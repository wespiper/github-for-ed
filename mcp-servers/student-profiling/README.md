# Student Profiling MCP Server

Privacy-enhanced student profiling service with comprehensive data agency controls, differential privacy analytics, and dual MCP/HTTP interfaces.

## Overview

This service implements 8 privacy-focused tools (4 core + 4 privacy) for student profiling with:
- **Student Data Agency**: Comprehensive privacy choice management
- **Differential Privacy**: Privacy-preserving analytics with epsilon/delta parameters
- **Access Control**: Granular data access validation and audit trails
- **Value Exchange**: Clear benefits for data sharing decisions

## Architecture

### Dual Interface Design
- **MCP Protocol**: For Claude Code integration and AI-assisted development
- **HTTP REST API**: For Fastify gateway and service-to-service communication
- **Shared Business Logic**: Single implementation serving both interfaces

## Tools Available

### Privacy Tools
1. **manage_student_privacy_choices**: Granular privacy preference management
2. **generate_privacy_preserving_analytics**: Differential privacy analytics
3. **validate_data_access_requests**: Access control and authorization
4. **create_student_privacy_dashboard**: Comprehensive privacy insights

### Core Tools
1. **build_student_profile**: Privacy-aware profile construction
2. **track_learning_trajectory**: Consent-based trajectory tracking
3. **assess_skill_development**: Privacy-controlled skill assessment
4. **generate_personalized_recommendations**: Value-exchange based recommendations

## Installation

```bash
npm install
```

## Running the Server

### MCP Mode (for Claude Code)
```bash
npm run start:mcp
```

### HTTP Mode (for API access)
```bash
npm run start:http
```

### Dual Mode (both protocols)
```bash
npm run start
```

## Configuration

### Environment Variables
```env
SERVER_MODE=dual          # mcp, http, or dual
PORT=3002                 # HTTP API port
CORS_ORIGIN=http://localhost:5001
```

### Privacy Configuration
See `src/config/privacy.config.ts` for:
- Differential privacy parameters (ε, δ)
- Consent defaults
- Data retention periods
- Access control settings

## API Documentation

When running in HTTP mode, Swagger documentation is available at:
```
http://localhost:3002/api/docs
```

## Privacy Features

### Differential Privacy
- Configurable epsilon/delta parameters
- Laplace noise mechanism
- Minimum cohort size enforcement (10+)
- Privacy budget tracking

### Student Data Agency
- Granular consent controls
- Value exchange explanations
- Privacy choice versioning
- Instant enforcement across services

### Access Control
- Role-based validation
- Time-limited access tokens
- Comprehensive audit trails
- Automatic revocation

### Privacy Dashboard
- Real-time privacy metrics
- Access history visualization
- Personalized recommendations
- Data inventory tracking

## Testing

```bash
# Run all tests
npm test

# Run privacy-specific tests
npm test -- privacy

# Run with coverage
npm run test:cov
```

## Integration

### With Fastify Gateway
```typescript
// HTTP client configuration
const studentProfilingClient = axios.create({
  baseURL: 'http://localhost:3002/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Example: Build profile
const profile = await studentProfilingClient.post('/student-profiles/build', {
  studentId: 'student123',
  requesterContext: {
    userId: 'teacher456',
    role: 'teacher',
    purpose: 'grade_assignment'
  }
});
```

### With Claude Code
Add to MCP settings:
```json
{
  "mcpServers": {
    "student-profiling": {
      "command": "node",
      "args": ["./mcp-servers/student-profiling/dist/main.js", "mcp"]
    }
  }
}
```

## Security Considerations

1. **Data Minimization**: Only collect necessary data
2. **Encryption**: All sensitive data encrypted at rest
3. **Access Logging**: Complete audit trail of all data access
4. **Consent Verification**: No operation without proper consent
5. **Privacy by Design**: Privacy controls at every layer

## Value Exchange Model

The service implements a transparent value exchange model:
- Basic features available with minimal data
- Enhanced features require additional consent
- Clear explanations of data usage benefits
- No punishment for privacy choices

## Compliance

Designed for compliance with:
- FERPA (educational records)
- COPPA (children's privacy)
- GDPR (EU data protection)
- State privacy laws

## Development

### Project Structure
```
src/
├── mcp/                 # MCP protocol implementation
├── http/                # HTTP REST API
├── shared/              # Shared business logic
├── data-agency/         # Privacy controls
├── privacy-analytics/   # Differential privacy
└── config/              # Configuration
```

### Adding New Tools
1. Define tool in MCP controller
2. Add HTTP endpoint in API controller
3. Implement shared business logic
4. Add privacy controls as needed
5. Update tests and documentation

## Performance

- Response time: <150ms (including privacy checks)
- Privacy overhead: <30ms
- Concurrent consent checks supported
- Caching for improved performance

## Support

For issues or questions about:
- Privacy implementation
- Tool integration
- Compliance requirements

Please refer to the main project documentation or create an issue.