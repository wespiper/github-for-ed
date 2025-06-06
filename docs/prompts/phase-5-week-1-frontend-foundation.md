# Phase 5 Week 1: Frontend Foundation & Layout

## Objective
Establish the frontend foundation for Scribe Tree's revolutionary writing editor, including the three-panel layout, routing system, and core UI components.

## Context
- **Current Phase**: Phase 5 - Frontend Integration
- **Week**: Week 1 (Sprint 1)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: Completed Phase 1-4 backend with MCP servers operational

## Scope
### In Scope
- Three-panel layout implementation
- React Router setup with protected routes
- Base component library setup with Storybook
- Header bar with context awareness
- WebSocket provider for real-time features
- Design system foundation (colors, typography)

### Out of Scope
- Complex editor features (week 2)
- AI chat interface (week 2)
- Data visualization components
- Gamification elements (not implementing)

## Technical Requirements
1. **Framework**: React 19 + TypeScript + Vite
2. **Styling**: Tailwind CSS + custom design tokens
3. **State**: Zustand for UI state, TanStack Query for server state
4. **Testing**: Vitest + React Testing Library
5. **Performance**: Initial load < 1s, maintain 50ms interactions

## Implementation Steps

### Step 1: Project Setup & Configuration
- [ ] Initialize Storybook in frontend directory
- [ ] Configure design tokens in `frontend/src/styles/tokens.ts`
- [ ] Set up WebSocket provider in `frontend/src/providers/WebSocketProvider.tsx`
- [ ] Create base layout components structure
- [ ] Configure React Router with route guards

### Step 2: Three-Panel Layout Implementation
- [ ] Create `ThreePanelLayout.tsx` with responsive breakpoints
- [ ] Implement `LeftPanel.tsx` for thinking tools (placeholder for now)
- [ ] Build `CenterPanel.tsx` for writing canvas (basic for now)
- [ ] Design `RightPanel.tsx` for AI partner sidebar (skeleton)
- [ ] Add panel collapse/expand functionality with animations

### Step 3: Header Bar & Navigation
- [ ] Build `HeaderBar.tsx` with assignment context display
- [ ] Create `ProgressIndicator.tsx` component (capability-based, not word count)
- [ ] Implement `AIAccessLevelBadge.tsx` showing current access tier
- [ ] Add `UserMenu.tsx` with role-based options
- [ ] Integrate with existing auth context

### Step 4: Design System Foundation
- [ ] Create color palette following our spec:
  - Primary: Deep blue (#1E3A8A)
  - Success: Emerald (#10B981)
  - AI Accent: Purple (#8B5CF6)
  - Warning: Amber (#F59E0B)
- [ ] Set up typography scale with Inter/Georgia/SF Pro
- [ ] Build motion constants (200-300ms easing)
- [ ] Create `ThemeProvider.tsx` with educational context

### Step 5: Core Component Library
- [ ] Build in Storybook first:
  - `Button.tsx` with educational variants
  - `Card.tsx` with trust indicators
  - `Modal.tsx` with smooth transitions
  - `Toast.tsx` for notifications
  - `Tooltip.tsx` for educational hints
- [ ] Add accessibility features (ARIA, keyboard nav)
- [ ] Create component documentation

### Step 6: Real-time Infrastructure
- [ ] Set up Socket.io client connection
- [ ] Create `useWebSocket` hook for components
- [ ] Implement connection status indicator
- [ ] Add event type definitions from backend
- [ ] Test with writing-process-events

## Code Locations
- **Components**: `frontend/src/components/layout/`
- **Design System**: `frontend/src/components/ui/`
- **Providers**: `frontend/src/providers/`
- **Styles**: `frontend/src/styles/`
- **Stories**: `frontend/src/stories/`
- **Tests**: `frontend/src/__tests__/`

## Success Criteria
- [ ] Three-panel layout renders correctly on desktop/tablet
- [ ] All panels can collapse/expand smoothly
- [ ] Storybook documents all base components
- [ ] WebSocket connects to backend successfully
- [ ] Design system matches our educational philosophy
- [ ] Page loads in under 1 second
- [ ] All components are keyboard accessible

## Reference Documents
- [Revolutionary Writing Editor Design](../../REVOLUTIONARY_WRITING_EDITOR_DESIGN.md)
- [Phase 5 Frontend Implementation Plan](../../PHASE_5_FRONTEND_IMPLEMENTATION_PLAN.md)
- [Frontend README](../../frontend/README.md)

## Notes
- Focus on foundation - don't over-engineer early
- Prioritize responsive design from the start
- Keep components "dumb" - logic in hooks/services
- Use Storybook for all component development
- Remember: no gamification, focus on learning

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): implement three-panel layout foundation"
3. Move to next prompt: `phase-5-week-2-writing-canvas.md`