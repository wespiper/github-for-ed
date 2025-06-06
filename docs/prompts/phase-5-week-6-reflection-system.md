# Phase 5 Week 6: Reflection & Assessment System

## Objective
Implement the reflection submission interface and quality assessment visualization that drives progressive AI access, making metacognition visible and rewarding.

## Context
- **Current Phase**: Phase 5 - Frontend Integration
- **Week**: Week 6 (Sprint 3 continued)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: Progress visualization complete

## Scope
### In Scope
- Reflection submission modal
- Quality spider chart visualization
- Progressive access pathway display
- AI access level management
- Improvement suggestions
- Historical reflection viewer

### Out of Scope
- Peer reflection sharing
- Reflection templates (future)
- Audio/video reflections
- Reflection coaching

## Technical Requirements
1. **UI Components**: React with Framer Motion
2. **Visualization**: Recharts for spider chart
3. **State**: Form state with React Hook Form
4. **Validation**: Real-time quality hints
5. **Analytics**: Integration with reflection API

## Implementation Steps

### Step 1: Reflection Modal Design
- [ ] Create `ReflectionModal.tsx` with:
  - Clean, distraction-free interface
  - Guided prompts based on context
  - Character count (min 200 chars)
  - Auto-save functionality
  - Markdown support
- [ ] Add contextual triggers:
  - Post-AI interaction
  - Assignment completion
  - Breakthrough moments
  - Weekly prompts
- [ ] Include reflection categories:
  - Process reflection
  - Content reflection
  - Learning reflection
  - Challenge reflection

### Step 2: Quality Assessment Visualization
- [ ] Build `ReflectionQualityChart.tsx` spider chart:
  - Depth (1-5 scale)
  - Critical thinking (1-5)
  - Self-awareness (1-5)
  - Growth mindset (1-5)
  - Specificity (1-5)
- [ ] Animate score updates smoothly
- [ ] Add dimension explanations
- [ ] Show historical progression
- [ ] Include peer benchmarks (anonymous)

### Step 3: Progressive Access Interface
- [ ] Create `ProgressiveAccessPath.tsx` showing:
  - Current AI access level
  - Requirements for next level
  - Recent progress indicators
  - Estimated time to upgrade
- [ ] Visual design as elegant pathway:
  ```
  Restricted -> Basic -> Standard -> Enhanced
      ●----------○----------○----------○
           You are here
  ```
- [ ] Add unlock animations
- [ ] Include feature comparison table

### Step 4: Real-time Quality Feedback
- [ ] Implement `ReflectionQualityHints.tsx`:
  - Live quality indicators while typing
  - Gentle suggestions (not corrections)
  - Depth prompts when shallow
  - Examples of good reflections
- [ ] Use debounced analysis:
  ```typescript
  POST /api/reflections/analyze-quality
  // Returns quality scores without saving
  ```
- [ ] Keep hints encouraging, not critical

### Step 5: Improvement Suggestions
- [ ] Build `ReflectionImprovement.tsx` panel:
  - Specific growth areas
  - Example questions to consider
  - Links to resources
  - Progress since last reflection
- [ ] Personalize based on patterns:
  - Common weaknesses
  - Learning style
  - Subject area
- [ ] Frame as opportunities, not deficits

### Step 6: Reflection History Viewer
- [ ] Create `ReflectionHistory.tsx` with:
  - Chronological list view
  - Quality score evolution
  - Filter by type/quality
  - Search functionality
  - Export for portfolios
- [ ] Add `ReflectionComparison.tsx`:
  - Side-by-side view
  - Growth highlighting
  - Pattern identification
- [ ] Include reflection statistics

## Code Locations
- **Reflection UI**: `frontend/src/components/reflection/`
- **Visualizations**: `frontend/src/components/reflection/charts/`
- **Forms**: `frontend/src/components/reflection/forms/`
- **Hooks**: `frontend/src/hooks/useReflection.ts`
- **Services**: `frontend/src/services/reflectionService.ts`

## Success Criteria
- [ ] Submission process feels natural
- [ ] Quality feedback is helpful, not judgmental
- [ ] Spider chart clearly shows strengths/growth
- [ ] Access progression is motivating
- [ ] History view tells growth story
- [ ] Mobile experience is smooth
- [ ] Saves work automatically

## API Integration
```typescript
// Reflection endpoints
POST /api/reflections/submit
GET /api/reflections/history
POST /api/reflections/analyze-quality
GET /api/reflections/:id
GET /api/ai/access-level/:studentId

// WebSocket events
socket.on('reflection-analyzed', updateQualityChart);
socket.on('access-level-updated', celebrateProgress);
```

## Quality Dimensions Explained
```typescript
interface ReflectionQuality {
  depth: number;        // Explores underlying concepts
  criticalThinking: number; // Questions assumptions
  selfAwareness: number;    // Recognizes own process
  growthMindset: number;    // Focuses on improvement
  specificity: number;      // Uses concrete examples
}
```

## Reference Documents
- [Reflection Analysis Service](../../backend/src/services/ai/ReflectionAnalysisService.ts)
- [Progressive Access System](../../mcp-servers/educational-ai-validator/README.md)
- [Quality Rubric](../../docs/philosophy/)

## Notes
- Reflection quality drives AI access - make this connection clear
- Avoid making reflection feel like homework
- Quality hints should encourage deeper thinking
- The spider chart should feel like growth tracking
- Test prompts with actual students

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): implement reflection system with quality assessment"
3. Move to next prompt: `phase-5-week-7-educator-dashboard.md`