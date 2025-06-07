# Scribe Tree Strategic CTO MCP Server

An MCP server that provides strategic intelligence capabilities for Scribe Tree, connecting technical progress to business outcomes through systematic conversation capture, goal tracking, and development-business alignment.

## Overview

The Strategic CTO MCP Server acts as your business intelligence partner, helping you:

- **Capture Strategic Conversations**: Structured strategic discussions with insights, decisions, and action items
- **Track Business Goals**: Systematic goal management with metrics, milestones, and progress tracking
- **Connect Development to Business**: Map technical features to business value and strategic outcomes
- **Build Strategic Intelligence**: Accumulate organizational knowledge about what works

## Features

### Strategic Conversation Management
- Start structured strategic sessions with context and participants
- Capture strategic insights with categorization and impact assessment
- Track strategic decisions with rationale and review triggers
- Manage action items with owners, priorities, and due dates
- Update conversation summaries and key questions

### Business Goal Tracking
- Create business goals with metrics, dependencies, and milestones
- Update goal progress with confidence levels and achievement tracking
- Add milestones linked to technical work
- View goal analytics and completion summaries

### Data Architecture
- JSON-based storage with PostgreSQL-ready schema design
- Comprehensive data relationships between conversations, goals, insights, and decisions
- Full audit trail and historical tracking
- Easy migration path to PostgreSQL when needed

## Installation

```bash
cd mcp-servers/scribe-tree-strategic-cto
npm install
npm run build
```

## Development

```bash
npm run dev  # Watch mode for development
npm run lint # ESLint checking
npm test    # Run tests
```

## Usage

### Starting a Strategic Conversation

```javascript
start_strategy_session({
  "type": "technical-milestone-review",
  "title": "Microservices Migration Strategic Impact",
  "context": {
    "technicalMilestone": "Completed microservices architecture migration",
    "urgency": "high"
  }
})
```

### Capturing Strategic Insights

```javascript
capture_strategic_insight({
  "conversationId": "conv-123",
  "insight": "Microservices architecture enables independent team scaling and faster deployment cycles",
  "category": "technical-capability",
  "impact": "high",
  "evidence": ["Deployment frequency increased 3x", "Team autonomy improved"],
  "actionable": true
})
```

### Creating Business Goals

```javascript
create_business_goal({
  "category": "revenue",
  "title": "Achieve $50K MRR by Q4 2025",
  "description": "Establish sustainable recurring revenue through institutional partnerships",
  "owner": "Strategic CTO",
  "dependencies": {
    "technicalFeatures": ["institutional-dashboard", "multi-tenant-architecture"],
    "businessPrerequisites": ["pricing-strategy", "pilot-program-completion"]
  },
  "initialMetrics": [{
    "name": "Monthly Recurring Revenue",
    "type": "revenue",
    "target": 50000,
    "unit": "USD",
    "timeframe": "monthly"
  }]
})
```

### Tracking Goal Progress

```javascript
update_goal_progress({
  "goalId": "goal-123",
  "metricUpdates": [{
    "metricId": "metric-456",
    "currentValue": 5000
  }],
  "confidence": 75,
  "notes": "Pilot customers showing strong engagement",
  "achievements": ["Completed first institutional pilot", "Refined pricing model"]
})
```

## Tool Reference

### Strategic Conversation Tools

| Tool | Description |
|------|-------------|
| `start_strategy_session` | Initialize structured strategic conversation |
| `capture_strategic_insight` | Record strategic insight with impact assessment |
| `track_strategic_decision` | Document decision with rationale and triggers |
| `add_action_item` | Add action item with owner and priority |
| `update_conversation_summary` | Update conversation summary and status |
| `get_conversation` | Retrieve specific conversation |
| `list_conversations` | List conversations with filters |

### Business Goal Tools

| Tool | Description |
|------|-------------|
| `create_business_goal` | Create goal with metrics and dependencies |
| `update_goal_progress` | Update metrics and confidence levels |
| `add_milestone` | Add milestone to existing goal |
| `get_goal` | Retrieve specific goal with completion status |
| `list_goals` | List goals with filters |
| `get_goal_analytics` | Get analytics summary for all goals |

## Data Models

### Strategic Conversation
```typescript
interface StrategyConversation {
  id: string;
  type: 'market-analysis' | 'product-roadmap' | 'competitive-strategy' | 'monetization' | 'go-to-market' | 'technical-milestone-review' | 'business-goal-assessment';
  title: string;
  timestamp: string;
  participants: string[];
  context: {
    technicalMilestone?: string;
    businessTrigger?: string;
    marketEvent?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
  };
  insights: StrategyInsight[];
  decisions: StrategyDecision[];
  actionItems: ActionItem[];
  conversationSummary: string;
  keyQuestions: string[];
  status: 'draft' | 'active' | 'completed' | 'archived';
}
```

### Business Goal
```typescript
interface BusinessGoal {
  id: string;
  category: 'revenue' | 'product' | 'market' | 'technical' | 'operational';
  title: string;
  description: string;
  metrics: GoalMetric[];
  milestones: Milestone[];
  dependencies: {
    technicalFeatures: string[];
    businessPrerequisites: string[];
    externalFactors: string[];
  };
  status: 'planning' | 'active' | 'blocked' | 'completed' | 'paused';
  confidence: number; // 0-100
  progressHistory: ProgressSnapshot[];
  owner: string;
  stakeholders: string[];
}
```

## Integration with Scribe Tree

This MCP server is designed to integrate with the existing Scribe Tree workflow:

- **Insights Integration**: Connects to `.claude/insights/accumulated-learnings.md` for technical pattern extraction
- **Reflection Integration**: Links to `.claude/reflections/` for development milestone correlation
- **Strategic Alignment**: Maps technical features to business value and competitive advantages
- **Progress Tracking**: Correlates development milestones with strategic goal advancement

## Storage

Currently uses JSON file storage (`strategic-data.json`) with a PostgreSQL-ready schema design. The storage adapter pattern enables easy migration to PostgreSQL when scaling requirements demand it.

Storage includes:
- Strategic conversations with full context and outcomes
- Business goals with metrics and progress tracking
- Strategic insights with impact categorization
- Development-business alignment mappings
- Complete audit trail and metadata

## Future Enhancements

- **PostgreSQL Migration**: Scale to relational database for advanced analytics
- **Integration Tools**: Connect to existing Scribe Tree insights and reflection workflow
- **Advanced Analytics**: Pattern recognition and predictive strategic intelligence
- **Collaboration Features**: Multi-stakeholder conversation management
- **Reporting Tools**: Generate strategic reports for stakeholders

## License

MIT License - Part of the Scribe Tree project ecosystem.