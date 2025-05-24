# Claude Code Custom Commands Setup

## Installation Steps

### 1. Create Commands Directory
```bash
# Navigate to your project root
cd github-for-ed

# Create Claude Code commands directory
mkdir -p .claude/commands

# Verify directory structure
ls -la .claude/
```

### 2. Add Command Files
Create these files in `.claude/commands/`:

**File: `.claude/commands/work-ticket.md`**
```bash
# Copy the content from the work-ticket.md artifact above
```

**File: `.claude/commands/list-tickets.md`**  
```bash
# Copy the content from the list-tickets.md artifact above
```

### 3. Test Commands
```bash
# Start Claude Code in your project
claude

# Test listing tickets
/list-tickets

# Test working on a ticket (replace 123 with actual issue number)
/work-ticket 123
```

## Usage Workflow

### Daily Development Workflow
```bash
# 1. Start Claude Code
claude

# 2. See available work
/list-tickets ready

# 3. Pick and start a task
/work-ticket [ISSUE-NUMBER]

# 4. Let Claude Code complete the implementation
# (Claude will handle code, tests, PR creation, etc.)

# 5. Review and merge PR when ready
```

### Example Session
```bash
claude
> /list-tickets ready

# Output shows: #45 Assignment Database Schema [Ready]

> /work-ticket 45

# Claude Code will:
# - Fetch issue #45 details
# - Read acceptance criteria and Claude Code instructions
# - Create the database schemas in backend/src/models/
# - Add TypeScript interfaces
# - Run tests
# - Create feature branch and PR
# - Run /reflect command
```

## Command Features

### `/work-ticket` Command Features:
✅ **Fetches issue details** from GitHub  
✅ **Reads acceptance criteria** and implementation guidance  
✅ **Follows project standards** (CLAUDE.md)  
✅ **Creates proper branch** and commit messages  
✅ **Runs tests** and ensures quality  
✅ **Creates descriptive PR** with proper linking  
✅ **Updates project board** status  
✅ **Triggers reflection** for learning capture  

### `/list-tickets` Command Features:
✅ **Shows available tasks** ready for Claude Code  
✅ **Filters by priority** and complexity  
✅ **Groups by task groups** for logical development  
✅ **Shows dependencies** and blockers  
✅ **Recommends next best task** to work on  

## Integration with Your Project Board

### Task Requirements
For tasks to work with these commands, ensure your GitHub issues have:

1. **Clear acceptance criteria** section
2. **Claude Code Instructions** section with:
   - File paths and locations
   - Technical approach guidance
   - Testing requirements
   - Integration notes

3. **Proper labels** for filtering:
   - `claude-code-ready`
   - `priority-high/medium/low`
   - `complexity-simple/medium/complex`

### Example Issue Template
```markdown
## Task: Assignment Database Schema

### Context
Create foundational data models for assignments, learning objectives, and writing stages.

### Acceptance Criteria
- [ ] Assignment mongoose schema with all required fields
- [ ] LearningObjective schema with categorization
- [ ] WritingStage schema with progression logic
- [ ] Database relationships properly defined
- [ ] Schema validation rules implemented

### Claude Code Instructions
- Create schemas in `backend/src/models/`
- Follow existing mongoose patterns in codebase
- Include TypeScript interfaces in `backend/src/types/`
- Add comprehensive field validation
- Create database indexes for performance

### Dependencies
- None (foundational task)

### Definition of Done
- [ ] Code implemented and follows project standards
- [ ] Tests pass and new tests added if needed
- [ ] TypeScript compilation succeeds
- [ ] Documentation updated
- [ ] PR created and ready for review
```

## Troubleshooting

### Common Issues and Solutions

**Issue**: Command not found
```bash
# Solution: Ensure commands are in correct directory
ls .claude/commands/
# Should show: work-ticket.md, list-tickets.md
```

**Issue**: GitHub CLI not authenticated
```bash
# Solution: Authenticate with GitHub
gh auth login
```

**Issue**: No issues found with /list-tickets
```bash
# Solution: Check your issues have proper labels
gh issue list --state open
# Ensure issues have "claude-code-ready" label
```

**Issue**: /work-ticket can't find issue
```bash
# Solution: Verify issue exists and use correct number
gh issue view [ISSUE-NUMBER]
```

## Advanced Usage

### Batch Processing
```bash
# Work through all Group 1 tasks
/list-tickets group1
# Then manually run /work-ticket for each ready task
```

### Priority-Based Development
```bash
# Focus on high priority tasks first
/list-tickets high
/work-ticket [HIGH-PRIORITY-ISSUE]
```

### Dependency-Aware Development
```bash
# Check what's ready (no dependencies)
/list-tickets ready
# Start with dependency-free tasks first
```

## Benefits

### For You:
- **Streamlined workflow**: One command starts complete task implementation
- **Consistent quality**: Every task follows same high standards
- **Automatic documentation**: Reflection and PR documentation
- **Progress visibility**: Clear project board integration

### For Claude Code:
- **Clear context**: Every task has detailed implementation guidance
- **Focused work**: One task, complete implementation, proper testing
- **Quality assurance**: Built-in testing and reflection requirements
- **Educational alignment**: Every task serves writing education goals

This setup transforms your GitHub project board into a powerful development workflow where Claude Code can efficiently tackle tasks while maintaining high quality and educational focus! 🚀