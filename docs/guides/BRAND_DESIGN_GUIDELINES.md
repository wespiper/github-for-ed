# Scribe Tree Brand & Design Guidelines

This guide defines the visual identity, design philosophy, and brand standards for the Scribe Tree educational platform.

## Design Philosophy

### Core Principles
- **Thoughtful Growth**: Every interface element should suggest intentional development
- **Word-Focused**: Language and typography are central to visual design
- **Branching Metaphors**: Version control and collaboration visualized through organic growth
- **Professional Warmth**: Sophisticated enough for institutions, approachable for students

### Interface Personality
- **Celebrate Process**: Highlight writing development, not just completion
- **Encourage Branching**: Make trying new approaches feel natural and safe
- **Honor Words**: Treat student writing with respect and care
- **Build Community**: Individual growth within collaborative context

## Visual Identity

### Logo and Branding
- The Scribe Tree represents growth, branching ideas, and organic development
- Logo variations for different contexts (header, favicon, marketing)
- Consistent use of tree/branch metaphors throughout the interface
- Writing implements (pen, quill) as secondary visual elements

### Color Palette

#### Primary Colors
- **Deep Green** (#2D5016): Primary brand color, represents growth
- **Warm Brown** (#6B4423): Secondary color, represents stability
- **Sky Blue** (#4A90E2): Accent color, represents possibility

#### Semantic Colors
- **Success Green** (#22C55E): Positive actions, growth indicators
- **Warning Amber** (#F59E0B): Caution, attention needed
- **Error Red** (#EF4444): Errors, critical issues
- **Info Blue** (#3B82F6): Information, guidance

#### Neutral Palette
- **Ink Black** (#0F172A): Primary text
- **Graphite** (#475569): Secondary text
- **Paper White** (#FFFFFF): Background
- **Soft Gray** (#F1F5F9): Subtle backgrounds

### Typography

#### Font Families
- **Headers**: Inter or system font stack for clarity
- **Body Text**: System font stack for optimal readability
- **Code/Writing**: Monospace font for drafts and code

#### Type Scale
```css
--text-xs: 0.75rem;    /* 12px - metadata */
--text-sm: 0.875rem;   /* 14px - captions */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - lead text */
--text-xl: 1.25rem;    /* 20px - section headers */
--text-2xl: 1.5rem;    /* 24px - page headers */
--text-3xl: 1.875rem;  /* 30px - major headers */
```

## UI Components

### Design Tokens
```css
/* Spacing */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */

/* Border Radius */
--radius-sm: 0.25rem;   /* Small elements */
--radius-md: 0.375rem;  /* Default */
--radius-lg: 0.5rem;    /* Large elements */
--radius-full: 9999px;  /* Pills, circles */

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

### Component Patterns

#### Buttons
- Primary: Solid background with primary color
- Secondary: Outlined with primary color
- Ghost: Transparent with hover state
- Consistent padding and border radius
- Clear hover and active states

#### Cards
- Clean white background with subtle shadow
- Consistent padding (space-4 or space-6)
- Clear hierarchy with proper spacing
- Hover states for interactive cards

#### Forms
- Clear labels above inputs
- Generous touch targets (min 44px)
- Helpful placeholder text
- Inline validation messages
- Consistent field spacing

## Layout Principles

### Grid System
- 12-column grid for flexibility
- Responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Consistent gutters and margins

### Spacing Hierarchy
- Use consistent spacing scale
- Group related elements closely
- Separate distinct sections clearly
- Maintain visual breathing room

### Visual Hierarchy
- Size indicates importance
- Color draws attention
- Spacing creates relationships
- Consistency builds familiarity

## Iconography

### Icon Style
- Outlined style for consistency
- 24px base size, scalable
- Consistent stroke width (2px)
- Meaningful and recognizable

### Common Icons
- **Tree/Branch**: Growth, versioning
- **Pen/Pencil**: Writing, editing
- **Book**: Assignments, reading
- **Users**: Collaboration, groups
- **Chart**: Analytics, progress
- **Lightbulb**: Ideas, suggestions

## Motion and Animation

### Principles
- Purposeful, not decorative
- Quick and responsive (200-300ms)
- Easing functions for natural movement
- Consistent timing across the app

### Common Animations
- Subtle hover states (opacity, scale)
- Smooth transitions between states
- Loading indicators for async actions
- Success/error state transitions
- Page transitions (fade, slide)

## Writing-Specific Design

### Text Display
- Generous line height (1.5-1.7)
- Optimal line length (65-75 characters)
- Clear paragraph spacing
- Comfortable reading typography

### Version Comparison
- Clear visual diff highlighting
- Side-by-side layout options
- Timeline visualization
- Color coding for changes

### Feedback Interface
- Inline commenting design
- Non-intrusive suggestion display
- Clear attribution of feedback
- Contextual placement

## Accessibility

### Color Contrast
- WCAG AA compliance minimum
- 4.5:1 for normal text
- 3:1 for large text
- Test all color combinations

### Focus States
- Visible focus indicators
- Consistent focus style
- Keyboard navigation support
- Skip links where appropriate

### Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels
- Meaningful alt text
- Status announcements

## Responsive Design

### Mobile Considerations
- Touch-friendly tap targets (44px min)
- Simplified navigation
- Optimized layouts
- Performance optimization

### Tablet Experience
- Balanced layouts
- Touch and keyboard support
- Portrait/landscape optimization
- Productive interfaces

### Desktop Excellence
- Information density
- Multi-panel layouts
- Keyboard shortcuts
- Power user features

## Brand Voice

### Tone Attributes
- **Encouraging**: Support student growth
- **Professional**: Respect educators
- **Clear**: Avoid jargon
- **Warm**: Human and approachable

### Writing Guidelines
- Use active voice
- Keep sentences concise
- Focus on benefits
- Include helpful examples
- Maintain consistency

## Implementation Notes

### CSS Architecture
- Use CSS custom properties
- Follow BEM or similar methodology
- Maintain component isolation
- Document design decisions

### Design System Maintenance
- Regular design audits
- Component documentation
- Version control for designs
- Stakeholder feedback loops

## Success Metrics

Good design in Scribe Tree should:
- Reduce cognitive load
- Increase user confidence
- Support educational goals
- Delight without distraction
- Scale gracefully

Every design decision should answer: "Does this help writers understand how their words and ideas branch into better writing?"