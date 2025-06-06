# Phase 5 Week 2: Writing Canvas & Editor Core

## Objective
Implement the core writing canvas with rich text editing, revision tracking, AI contribution highlighting, and thinking annotations - the heart of our revolutionary writing editor.

## Context
- **Current Phase**: Phase 5 - Frontend Integration
- **Week**: Week 2 (Sprint 1 continued)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: Week 1 layout foundation complete

## Scope
### In Scope
- Rich text editor with Lexical
- Revision timeline implementation
- AI contribution tracking & visualization
- Thinking annotations system
- Document auto-save with drafts
- Progress visualization (depth metrics)

### Out of Scope
- Idea maze (week 3)
- AI chat interface (week 4)
- Peer collaboration features
- Advanced analytics

## Technical Requirements
1. **Editor**: Lexical for extensibility
2. **Persistence**: Auto-save every 30s + on pause
3. **Versioning**: Track all changes with timestamps
4. **Performance**: Smooth typing at 60fps
5. **Visualization**: D3.js for progress metrics

## Implementation Steps

### Step 1: Lexical Editor Setup
- [ ] Install and configure Lexical in `frontend/src/components/editor/`
- [ ] Create `WritingCanvas.tsx` as main editor component
- [ ] Set up custom nodes for AI contributions
- [ ] Implement custom theme with our color system
- [ ] Add toolbar with essential formatting options

### Step 2: Revision Tracking System
- [ ] Build `RevisionTimeline.tsx` with scrubber UI
- [ ] Create `useRevisionHistory` hook for version management
- [ ] Implement diff visualization between versions
- [ ] Add branch points for alternate versions
- [ ] Connect to backend revision API endpoints

### Step 3: AI Contribution Highlighting
- [ ] Create custom Lexical node: `AIContributionNode.tsx`
- [ ] Implement color coding system:
  - Human text: default
  - AI suggestions: purple accent (#8B5CF6)
  - AI edits: purple with transparency
- [ ] Add hover tooltips explaining AI rationale
- [ ] Build contribution statistics tracker

### Step 4: Thinking Annotations
- [ ] Design `ThinkingAnnotation.tsx` component
- [ ] Create margin UI for annotation placement
- [ ] Implement annotation types:
  - Breakthrough moments
  - Struggle points
  - Reflection triggers
  - Questions for later
- [ ] Add filtering/searching annotations

### Step 5: Document Management
- [ ] Build auto-save functionality with status indicator
- [ ] Create `DocumentProvider.tsx` for state management
- [ ] Implement draft/published states
- [ ] Add conflict resolution for concurrent edits
- [ ] Connect to document API endpoints:
  ```typescript
  POST /api/documents/save-draft
  GET /api/documents/:id/revisions
  PUT /api/documents/:id/publish
  ```

### Step 6: Progress Visualization
- [ ] Create `WritingDepthMeter.tsx` using D3.js
- [ ] Implement metrics:
  - Argument complexity score
  - Evidence quality rating
  - Revision depth tracking
  - Thinking annotation density
- [ ] Design visual representation (not gamified)
- [ ] Add tooltip explanations for each metric

## Code Locations
- **Editor Core**: `frontend/src/components/editor/`
- **Editor Plugins**: `frontend/src/components/editor/plugins/`
- **Visualizations**: `frontend/src/components/visualizations/`
- **Hooks**: `frontend/src/hooks/useDocument.ts`
- **Services**: `frontend/src/services/documentService.ts`

## Success Criteria
- [ ] Smooth typing experience with no lag
- [ ] Revisions tracked and viewable via timeline
- [ ] AI contributions clearly distinguished
- [ ] Annotations persist across sessions
- [ ] Auto-save works reliably
- [ ] Progress metrics update in real-time
- [ ] All editor features keyboard accessible

## API Integration Points
```typescript
// Document operations
POST /api/documents/create
GET /api/documents/:id
PUT /api/documents/:id/save-draft
GET /api/documents/:id/revisions
POST /api/documents/:id/annotations

// Real-time events
WebSocket: document-updated
WebSocket: revision-created
WebSocket: annotation-added
```

## Reference Documents
- [Revolutionary Writing Editor Design](../../REVOLUTIONARY_WRITING_EDITOR_DESIGN.md)
- [Lexical Documentation](https://lexical.dev/)
- [Backend API Docs](../../backend/docs/api/)

## Notes
- Lexical provides better extensibility than Slate for our custom nodes
- Keep AI contribution tracking performant - consider virtualization
- Revision timeline should handle hundreds of versions
- Focus on writing depth, not length metrics
- Annotations should enhance, not distract from writing

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): implement writing canvas with revision tracking"
3. Move to next prompt: `phase-5-week-3-idea-maze.md`