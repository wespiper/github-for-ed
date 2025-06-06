# Phase 5 Week 3: Idea Maze Implementation

## Objective
Build the innovative Idea Maze component that forces exploration of multiple thesis approaches before writing, implementing productive friction through guided discovery.

## Context
- **Current Phase**: Phase 5 - Frontend Integration  
- **Week**: Week 3 (Sprint 2)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: Writing canvas complete, React Flow for node-based UI

## Scope
### In Scope
- Node-based idea exploration interface
- AI-suggested exploration paths
- 3+ path requirement enforcement
- Visual depth indicators for exploration
- Path quality assessment
- Integration with writing canvas

### Out of Scope
- Full argument builder (week 4)
- Peer sharing of paths
- Advanced AI coaching
- Path templates

## Technical Requirements
1. **Visualization**: React Flow for node graph
2. **State Management**: Complex graph state with Zustand
3. **Animation**: Framer Motion for smooth transitions
4. **AI Integration**: Connect to MCP educational validator
5. **Performance**: Handle 50+ nodes smoothly

## Implementation Steps

### Step 1: React Flow Setup
- [ ] Install React Flow and create `IdeaMaze.tsx` component
- [ ] Set up custom node types:
  - `PromptNode` (center starting point)
  - `ThesisNode` (potential approaches)
  - `QuestionNode` (exploration prompts)
  - `InsightNode` (discoveries)
- [ ] Configure custom edge types with animations
- [ ] Implement zoom/pan controls with boundaries

### Step 2: Node Components Design
- [ ] Create `ThesisNode.tsx` with:
  - Title and brief description
  - Exploration progress indicator
  - Quality score visualization
  - Expand/collapse functionality
- [ ] Build `QuestionNode.tsx` featuring:
  - Socratic questions from AI
  - Input field for responses
  - Connection to next nodes
- [ ] Design visual language:
  - Unexplored: gray/muted
  - In progress: blue glow
  - Completed: green with particles
  - High quality: golden accent

### Step 3: AI Path Generation
- [ ] Create `useAIPathSuggestions` hook
- [ ] Connect to educational AI validator MCP:
  ```typescript
  // Generate initial thesis options
  POST /api/ai/generate-thesis-paths
  
  // Get follow-up questions
  POST /api/ai/get-exploration-questions
  
  // Assess path quality
  POST /api/ai/evaluate-thesis-quality
  ```
- [ ] Implement "What if you considered..." branching
- [ ] Add educational rationale for each suggestion

### Step 4: Exploration Requirements
- [ ] Build `ExplorationTracker.tsx` showing:
  - Paths explored: X/3 minimum
  - Current depth level
  - Time spent per path
  - Quality indicators
- [ ] Implement path locking until 3+ explored
- [ ] Create unlock animation for writing canvas
- [ ] Add educational explanation for requirement

### Step 5: Visual Polish & Interactions
- [ ] Implement 3D depth effect for explored paths:
  - Z-axis positioning based on exploration
  - Particle effects for insights
  - Glow effects for active paths
- [ ] Add smooth transitions between nodes
- [ ] Create mini-map for navigation
- [ ] Build path comparison view

### Step 6: Integration with Writing
- [ ] Create `useSelectedPath` hook for canvas
- [ ] Build path-to-outline converter
- [ ] Add "Change thesis" option with warning
- [ ] Implement path reference in annotations
- [ ] Save maze state with document

## Code Locations
- **Idea Maze**: `frontend/src/components/idea-maze/`
- **Custom Nodes**: `frontend/src/components/idea-maze/nodes/`
- **AI Integration**: `frontend/src/services/ideaMazeService.ts`
- **State**: `frontend/src/stores/ideaMazeStore.ts`
- **Styles**: `frontend/src/components/idea-maze/IdeaMaze.css`

## Success Criteria
- [ ] Smooth interaction with 50+ nodes
- [ ] AI generates relevant thesis paths
- [ ] 3-path requirement enforced effectively
- [ ] Visual feedback is clear and engaging
- [ ] Selected path integrates with writing canvas
- [ ] Exploration data saved and retrievable
- [ ] Mobile-responsive (simplified view)

## Visual Design Specs
```typescript
// Node dimensions
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const NODE_SPACING = 50;

// Colors (from design system)
const UNEXPLORED = '#E5E7EB'; // gray-200
const EXPLORING = '#1E3A8A'; // primary blue
const COMPLETED = '#10B981'; // success green
const HIGH_QUALITY = '#F59E0B'; // warning amber
```

## Reference Documents
- [Revolutionary Writing Editor Design](../../REVOLUTIONARY_WRITING_EDITOR_DESIGN.md)
- [React Flow Documentation](https://reactflow.dev/)
- [Educational AI Validator MCP](../../mcp-servers/educational-ai-validator/README.md)

## Notes
- React Flow provides the flexibility we need for custom nodes
- Keep performance in mind - virtualize if needed
- The 3-path requirement is pedagogical, not arbitrary
- Visual design should feel exploratory, not game-like
- Save frequently - maze state is complex

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): implement idea maze with AI path generation"
3. Move to next prompt: `phase-5-week-4-ai-learning-partner.md`