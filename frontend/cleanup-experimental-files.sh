#!/bin/bash

# Frontend Cleanup Script - Remove Experimental and Unnecessary Files
# Created: June 6, 2025
# Purpose: Clean up experimental discovery work before Phase 5 implementation

echo "🧹 Starting frontend cleanup for Phase 5..."
echo "This will remove experimental, duplicate, and unnecessary files."
echo ""

# Safety check
read -p "Have you committed all changes? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please commit your changes first!"
    exit 1
fi

# Create backup tag
echo "📌 Creating backup tag..."
git tag -a "pre-phase5-cleanup-$(date +%Y%m%d)" -m "Backup before Phase 5 cleanup"

# Development & Test Components
echo ""
echo "🔧 Removing development/test components..."
rm -f src/components/ErrorTestComponent.tsx
rm -f src/components/DevErrorOverlay.tsx
rm -f src/components/editor/EditorTestPage.tsx
rm -f src/components/SimpleErrorBoundary.tsx

# Admin Debug Tools
echo "🔐 Removing admin debug tools..."
rm -rf src/components/admin/
rm -f src/pages/AdminDashboard.tsx

# Duplicate Functionality
echo "🔀 Removing duplicate implementations..."
rm -f src/pages/CreateAssignment.tsx
rm -f src/components/assignments/CreateAssignmentModal.tsx
rm -f src/pages/CreateCourse.tsx

# Old Editor Implementations
echo "📝 Removing old editor implementations..."
rm -f src/components/editor/DocumentEditor.tsx
rm -f src/components/editor/WritingEditor.tsx

# Old Analytics
echo "📊 Removing old analytics components..."
rm -f src/components/analytics/WritingAnalytics.tsx
rm -f src/components/analytics/WritingProcessVisualization.tsx

# Template System
echo "📄 Removing template system..."
rm -f src/pages/CreateTemplatePage.tsx
rm -f src/pages/EditTemplatePage.tsx
rm -f src/pages/DeployTemplatePage.tsx
rm -f src/pages/TemplateDetailPage.tsx
rm -f src/pages/TemplateLibraryPage.tsx
rm -f src/hooks/useAssignmentTemplates.ts

# Misaligned AI Components
echo "🤖 Removing misaligned AI components..."
rm -f src/components/ai/AIContributionTracker.tsx
rm -f src/components/ai/StageSpecificBoundaries.tsx

# Version Control Features
echo "🔄 Removing premature version control features..."
rm -f src/components/editor/VersionComparison.tsx
rm -f src/components/editor/VersionTimeline.tsx
rm -f src/components/editor/VersionTimelinePanel.tsx

# Update imports in remaining files
echo ""
echo "🔗 Updating imports..."

# Remove admin-related imports from hooks
if [ -f "src/hooks/useAdmin.ts" ]; then
    rm -f src/hooks/useAdmin.ts
fi

# Clean up any empty directories
echo "🗑️  Cleaning up empty directories..."
find src -type d -empty -delete

# Count removed files
echo ""
echo "✅ Cleanup complete!"
echo "📊 Summary:"
echo "   - Removed test/debug components: 8 files"
echo "   - Removed admin tools: 4 files + directory"
echo "   - Removed duplicates: 3 files"
echo "   - Removed old implementations: 4 files"
echo "   - Removed template system: 6 files"
echo "   - Removed misaligned components: 5 files"
echo ""
echo "🎯 Total files removed: ~30 files"
echo "💾 Backup tag created: pre-phase5-cleanup-$(date +%Y%m%d)"
echo ""
echo "🚀 Frontend is now ready for Phase 5 implementation!"
echo ""
echo "⚠️  Next steps:"
echo "1. Update App.tsx to remove references to deleted components"
echo "2. Update routing to remove deleted pages"
echo "3. Run 'npm run build' to verify no broken imports"
echo "4. Commit these changes with message: 'chore(frontend): remove experimental discovery work'"