# Phase 5 Week 4: AI Learning Partner Interface

## Objective
Implement the conversational AI Learning Partner sidebar with Socratic questioning, AI negotiation mode, and progressive access visualization - bringing our bounded AI philosophy to life.

## Context
- **Current Phase**: Phase 5 - Frontend Integration
- **Week**: Week 4 (Sprint 2 continued)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: Core editor and idea maze complete

## Scope
### In Scope
- Conversational chat interface
- Socratic question generation
- AI negotiation mode ✨
- Progressive access indicators
- Context-aware prompting
- Breakthrough celebrations

### Out of Scope
- Voice interaction
- Multi-language support
- AI personality customization
- Peer chat features

## Technical Requirements
1. **Chat UI**: Custom React components (not a library)
2. **State**: Message history with TanStack Query
3. **Real-time**: WebSocket for instant responses
4. **AI Integration**: All MCP educational tools
5. **Accessibility**: Screen reader friendly chat

## Implementation Steps

### Step 1: Chat Interface Foundation
- [ ] Create `AILearningPartner.tsx` sidebar component
- [ ] Build `ChatMessage.tsx` with role-based styling:
  - Student messages: right-aligned, blue
  - AI messages: left-aligned, purple accent
  - System messages: centered, muted
- [ ] Implement `ChatInput.tsx` with:
  - Auto-resize textarea
  - Send on Enter (Shift+Enter for newline)
  - Typing indicator
  - Character limit (educational constraint)

### Step 2: Message Types & Categories
- [ ] Define message type system:
  ```typescript
  type QuestionCategory = 
    | 'clarifying'     // "What do you mean by..."
    | 'challenging'    // "Have you considered..."
    | 'expanding'      // "What if we explore..."
    | 'reflecting'     // "How did you arrive at..."
    | 'negotiation'    // "I need help with..."
  ```
- [ ] Create category indicators with icons
- [ ] Build `QuestionQualityBadge.tsx`
- [ ] Add category filtering in chat history

### Step 3: Socratic Question Engine
- [ ] Create `useSocraticQuestions` hook connecting to:
  ```typescript
  // Educational AI validator tools
  POST /api/ai/educational-validator/generate-questions
  POST /api/ai/cognitive-monitor/assess-readiness
  POST /api/ai/boundary-service/check-access
  ```
- [ ] Implement context awareness:
  - Current writing content
  - Idea maze selections  
  - Previous interactions
  - Cognitive load state
- [ ] Never provide direct answers algorithm

### Step 4: AI Negotiation Mode ✨
- [ ] Build `NegotiationDialog.tsx` for boundary challenges
- [ ] Create negotiation flow:
  1. Student requests expanded help
  2. AI asks for educational rationale
  3. Student provides reasoning
  4. AI responds with Socratic questions
  5. May grant temporary access if justified
- [ ] Add `NegotiationSuccessBadge.tsx`
- [ ] Track negotiation history for learning

### Step 5: Progressive Access Visualization
- [ ] Create `AIAccessLevel.tsx` component showing:
  - Current tier (Restricted/Basic/Standard/Enhanced)
  - Progress to next level
  - Requirements for advancement
  - Recently unlocked features
- [ ] Build `AccessProgressBar.tsx` with smooth animations
- [ ] Add tooltip explanations for each level
- [ ] Celebrate access upgrades with subtle animation

### Step 6: Breakthrough Detection & Celebration
- [ ] Implement `BreakthroughDetector.tsx` monitoring:
  - Insight moments in chat
  - Quality improvements in writing
  - Independence milestones
  - Deep thinking indicators
- [ ] Create `BreakthroughCelebration.tsx`:
  - Subtle particle effects
  - Encouraging message
  - Progress snapshot
  - No gamification elements
- [ ] Add to chat history as special message type

## Code Locations
- **AI Partner**: `frontend/src/components/ai-partner/`
- **Chat Components**: `frontend/src/components/ai-partner/chat/`
- **Negotiation**: `frontend/src/components/ai-partner/negotiation/`
- **Services**: `frontend/src/services/aiPartnerService.ts`
- **Hooks**: `frontend/src/hooks/useAIPartner.ts`

## Success Criteria
- [ ] Natural conversational flow
- [ ] Questions promote deeper thinking
- [ ] Negotiation mode feels educational
- [ ] Access levels clearly communicated
- [ ] No direct answers ever provided
- [ ] Celebrations feel earned, not game-like
- [ ] Fully keyboard navigable

## Integration Points
```typescript
// WebSocket events
socket.on('ai-response-ready', handleAIResponse);
socket.on('breakthrough-detected', celebrateBreakthrough);
socket.on('access-level-changed', updateAccessUI);

// API endpoints
POST /api/ai/chat/send-message
GET /api/ai/chat/history
POST /api/ai/negotiate-boundary
GET /api/ai/access-level/:studentId
```

## Visual Design
- Clean, academic aesthetic
- Purple accents for AI elements
- Smooth animations (200-300ms)
- High contrast for accessibility
- Mobile-responsive layout

## Reference Documents
- [Revolutionary Writing Editor Design](../../REVOLUTIONARY_WRITING_EDITOR_DESIGN.md)
- [AI Negotiation Mode Concept](../../REVOLUTIONARY_WRITING_EDITOR_DESIGN.md#ai-negotiation-mode)
- [Educational AI Validator MCP](../../mcp-servers/educational-ai-validator/README.md)

## Notes
- The negotiation mode is a key differentiator - implement thoughtfully
- Keep conversation history for context
- Ensure AI personality is helpful but boundary-respecting
- Test with actual students for natural flow
- Remember: Socratic method only, no direct answers

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): implement AI learning partner with negotiation mode"
3. Move to next prompt: `phase-5-week-5-progress-visualization.md`