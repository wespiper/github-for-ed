# Phase 5 Week 12: Performance Optimization & Polish

## Objective
Optimize the frontend application for production performance, implement comprehensive monitoring, and add final polish to ensure a smooth, fast, and delightful user experience at scale.

## Context
- **Current Phase**: Phase 5 - Frontend Integration
- **Week**: Week 12 (Sprint 6 - Final)
- **Branch**: `feat/phase-5-frontend`
- **Dependencies**: All features implemented

## Scope
### In Scope
- Code splitting and lazy loading
- Bundle size optimization
- Service worker implementation
- Performance monitoring
- Accessibility audit fixes
- Mobile optimization
- Error tracking setup

### Out of Scope
- New feature development
- Major architectural changes
- Backend optimizations
- Infrastructure scaling

## Technical Requirements
1. **Performance**: <1s initial load, <100ms interactions
2. **Bundle Size**: <200KB initial JS
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Mobile**: 60fps scrolling, touch-optimized
5. **Monitoring**: Real user metrics (RUM)

## Implementation Steps

### Step 1: Bundle Analysis & Optimization
- [ ] Run webpack-bundle-analyzer:
  - Identify large dependencies
  - Find duplicate code
  - Detect unused exports
  - Analyze chunk sizes
- [ ] Implement code splitting:
  ```typescript
  // Route-based splitting
  const EducatorDashboard = lazy(() => 
    import('./components/educator/EducatorDashboard')
  );
  
  // Component-based splitting
  const IdeaMaze = lazy(() => 
    import('./components/idea-maze/IdeaMaze')
  );
  ```
- [ ] Optimize dependencies:
  - Tree-shake lodash imports
  - Replace moment with date-fns
  - Lazy load heavy visualizations
  - Dynamic import for PDFs

### Step 2: Performance Optimizations
- [ ] Implement React optimizations:
  - Add React.memo to pure components
  - Use useMemo for expensive calculations
  - Optimize re-render triggers
  - Virtualize long lists
- [ ] Optimize images and assets:
  - Implement responsive images
  - Add WebP support
  - Lazy load below-fold images
  - Compress SVG assets
- [ ] Add performance budgets:
  ```javascript
  // vite.config.ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', '@radix-ui'],
          'viz-vendor': ['d3', 'recharts'],
        }
      }
    }
  }
  ```

### Step 3: Service Worker & Caching
- [ ] Create service worker strategy:
  - Cache-first for assets
  - Network-first for API
  - Offline fallback pages
  - Background sync for submissions
- [ ] Implement with Workbox:
  ```typescript
  // Precache critical assets
  precacheAndRoute(self.__WB_MANIFEST);
  
  // Runtime caching strategies
  registerRoute(
    /^https:\/\/api\.scribetree\.com/,
    new NetworkFirst({
      cacheName: 'api-cache',
      plugins: [new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })]
    })
  );
  ```
- [ ] Add offline support:
  - Queue failed submissions
  - Show cached content
  - Sync when online

### Step 4: Mobile Optimization
- [ ] Optimize touch interactions:
  - Increase tap targets to 44px
  - Add touch gestures for panels
  - Implement pull-to-refresh
  - Optimize keyboard handling
- [ ] Improve mobile layouts:
  - Stack panels vertically
  - Simplify navigation
  - Reduce information density
  - Add mobile-specific features
- [ ] Performance tweaks:
  - Reduce animation complexity
  - Implement virtual scrolling
  - Optimize font loading
  - Minimize reflows

### Step 5: Monitoring & Analytics
- [ ] Set up performance monitoring:
  ```typescript
  // Core Web Vitals tracking
  import {getCLS, getFID, getLCP} from 'web-vitals';
  
  getCLS(metric => analytics.track('CLS', metric));
  getFID(metric => analytics.track('FID', metric));
  getLCP(metric => analytics.track('LCP', metric));
  ```
- [ ] Implement error tracking:
  - Sentry for error capture
  - Source map uploading
  - User context attachment
  - Performance transactions
- [ ] Add custom metrics:
  - Time to interactive
  - API response times
  - Feature usage patterns
  - User flow completion

### Step 6: Accessibility & Polish
- [ ] Run accessibility audit:
  - Fix color contrast issues
  - Add missing ARIA labels
  - Ensure keyboard navigation
  - Test with screen readers
- [ ] Polish interactions:
  - Smooth all animations
  - Add loading skeletons
  - Improve error messages
  - Enhance empty states
- [ ] Cross-browser testing:
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers
  - Different screen sizes
  - Various connection speeds

## Code Locations
- **Performance**: `frontend/src/utils/performance/`
- **Service Worker**: `frontend/src/sw.ts`
- **Monitoring**: `frontend/src/monitoring/`
- **Mobile**: `frontend/src/components/mobile/`
- **Config**: `frontend/vite.config.ts`

## Success Criteria
- [ ] Lighthouse score >90 all categories
- [ ] Initial load <1 second on 3G
- [ ] 60fps scrolling on mobile
- [ ] Zero accessibility errors
- [ ] <200KB initial bundle
- [ ] Works offline for reading
- [ ] Error rate <0.1%

## Performance Metrics
```typescript
// Target metrics
const PERFORMANCE_BUDGET = {
  LCP: 2500,     // Largest Contentful Paint
  FID: 100,      // First Input Delay  
  CLS: 0.1,      // Cumulative Layout Shift
  TTFB: 600,     // Time to First Byte
  FCP: 1800,     // First Contentful Paint
  TTI: 3800,     // Time to Interactive
};
```

## Monitoring Dashboard
- Real-time performance metrics
- Error tracking with context
- User session replay
- Performance regression alerts
- Geographic performance data
- Device-specific insights

## Reference Documents
- [Performance Best Practices](../../docs/guides/)
- [Accessibility Guidelines](../../docs/guides/)
- [Mobile UX Patterns](../../docs/guides/)

## Notes
- Performance is a feature, not an afterthought
- Every millisecond counts for user experience
- Accessibility is non-negotiable
- Monitor real user metrics, not just lab data
- Polish makes the difference

## Next Steps
After completing this prompt:
1. Run `/reflect` to document learnings
2. Commit with message: "feat(frontend): complete performance optimization and polish"
3. Prepare for production deployment
4. Create Phase 5 completion summary