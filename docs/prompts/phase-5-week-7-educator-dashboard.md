# Phase 5 Week 7: Educator Dashboard & Analytics

## Objective
Build a comprehensive educator dashboard that provides actionable insights, real-time monitoring, intervention recommendations, and class-wide analytics without overwhelming teachers.

## Context
- **Current Phase**: Phase 5 - Frontend Integration
- **Week**: Week 7 (Sprint 4)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: Student-facing features complete

## Scope
### In Scope
- Class overview dashboard
- Individual student monitoring
- Real-time activity feed
- Intervention recommendations
- Writing pattern analysis
- Alert configuration

### Out of Scope
- Automated grading
- Parent communication (week 8)
- Curriculum planning
- Gradebook integration (Phase 4)

## Technical Requirements
1. **Dashboard**: Responsive grid layout
2. **Real-time**: WebSocket for live updates
3. **Charts**: Recharts for analytics
4. **Performance**: Handle 100+ students
5. **Export**: PDF/CSV reports

## Implementation Steps

### Step 1: Dashboard Layout & Navigation
- [ ] Create `EducatorDashboard.tsx` with sections:
  - Class Overview (top)
  - Active Alerts (sidebar)
  - Student Grid (main)
  - Quick Actions (toolbar)
- [ ] Implement responsive grid system
- [ ] Add role-based access control
- [ ] Create customizable layout
- [ ] Build dashboard preferences

### Step 2: Class Overview Analytics
- [ ] Build `ClassOverview.tsx` displaying:
  - Active students (real-time)
  - Average capability growth
  - Struggling students count
  - Recent breakthroughs
  - Assignment progress
- [ ] Create `StudentSegmentation.tsx`:
  - Thriving (green)
  - On track (blue)
  - Needs support (yellow)
  - At risk (orange)
- [ ] Add drill-down capabilities
- [ ] Include trend indicators

### Step 3: Real-time Activity Feed
- [ ] Implement `ActivityFeed.tsx` showing:
  - Student login/logout
  - Significant struggles detected
  - Breakthrough moments
  - AI boundary hits
  - Reflection submissions
- [ ] Add filtering options:
  - By student
  - By event type
  - By severity
  - By time range
- [ ] Create notification preferences
- [ ] Include quick action buttons

### Step 4: Student Deep Dive
- [ ] Build `StudentDetailPanel.tsx` with:
  - Writing journey visualization
  - Current cognitive load
  - AI interaction patterns
  - Progress trajectory
  - Recent reflections
- [ ] Add comparison tools:
  - To past performance
  - To class average
  - To learning goals
- [ ] Include intervention history
- [ ] Export student report

### Step 5: Intervention System
- [ ] Create `InterventionRecommendations.tsx`:
  - AI-suggested interventions
  - Timing recommendations
  - Predicted effectiveness
  - Similar case studies
- [ ] Build `InterventionComposer.tsx`:
  - Pre-written templates
  - Personalization options
  - Delivery methods
  - Follow-up scheduling
- [ ] Track intervention outcomes
- [ ] A/B testing framework

### Step 6: Pattern Analysis Tools
- [ ] Implement `WritingPatternAnalysis.tsx`:
  - Common struggle points
  - Class-wide trends
  - Assignment difficulty
  - Time-of-day patterns
- [ ] Create `CognitiveLoadHeatmap.tsx`:
  - Visual heat map by time
  - By assignment section
  - By student groups
- [ ] Add predictive insights
- [ ] Export for reporting

## Code Locations
- **Dashboard**: `frontend/src/components/educator/`
- **Analytics**: `frontend/src/components/educator/analytics/`
- **Interventions**: `frontend/src/components/educator/interventions/`
- **Services**: `frontend/src/services/educatorService.ts`
- **Hooks**: `frontend/src/hooks/useEducatorDashboard.ts`

## Success Criteria
- [ ] Dashboard loads in <2 seconds
- [ ] Real-time updates feel instant
- [ ] Insights are actionable, not just data
- [ ] Mobile-responsive for tablet use
- [ ] Interventions improve outcomes
- [ ] Teachers report time savings
- [ ] Privacy controls respected

## API Integration
```typescript
// Educator endpoints
GET /api/educator/class-overview/:classId
GET /api/educator/student-details/:studentId
GET /api/educator/activity-feed
POST /api/educator/interventions/send
GET /api/analytics/class-patterns

// Real-time subscriptions
WebSocket: educator-activity-stream
WebSocket: alert-triggered
WebSocket: intervention-outcome
```

## Visual Design Principles
- Information hierarchy is clear
- Actionable items prominent
- Calming color palette
- Generous white space
- Mobile-first approach
- Accessibility compliant

## Alert Configuration
```typescript
interface AlertPreferences {
  struggleThreshold: number;    // Cognitive load level
  inactivityPeriod: number;     // Minutes before alert
  breakthroughNotify: boolean;  // Celebrate successes
  boundaryHits: number;         // AI limit warnings
  reflectionQuality: number;    // Below threshold alerts
}
```

## Reference Documents
- [Educator Alerts MCP](../../mcp-servers/educator-alerts/README.md)
- [Learning Analytics Service](../../backend/src/services/LearningAnalyticsService.ts)
- [Privacy Guidelines](../../docs/guides/PRIVACY_COMPLIANCE_TESTING_GUIDE.md)

## Notes
- Balance comprehensive data with actionable insights
- Avoid information overload - progressive disclosure
- Respect student privacy in all displays
- Quick actions should genuinely save time
- Test with actual educators for workflow fit

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): implement educator dashboard with real-time analytics"
3. Move to next prompt: `phase-5-week-8-intervention-tools.md`