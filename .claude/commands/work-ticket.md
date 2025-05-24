# Work on GitHub Project Ticket

**Usage**: `/work-ticket #123` or `/work-ticket 123`

## Command Purpose
Fetch a specific GitHub issue from the project board, understand the requirements, implement the solution, test it, and create a pull request.

## Process Overview
1. **Fetch Issue Details**: Get the full issue description, acceptance criteria, and context
2. **Understand Requirements**: Parse the technical requirements and educational goals
3. **Plan Implementation**: Create an implementation approach
4. **Code Implementation**: Write the code following project standards
5. **Testing**: Run existing tests and create new ones as needed
6. **Documentation**: Update relevant documentation
7. **Pull Request**: Create PR and update project board
8. **Reflection**: Document learnings from the task

## Step-by-Step Execution

### Step 1: Fetch and Analyze Issue
```bash
# Get issue details
gh issue view $ARGUMENTS --json title,body,labels,milestone,assignees

# If not already assigned, assign to self
gh issue edit $ARGUMENTS --add-assignee @me
```

Parse the issue for:
- **Acceptance Criteria**: What needs to be implemented
- **Claude Code Instructions**: Specific technical guidance
- **Dependencies**: Any blocking requirements
- **File Locations**: Where to implement changes
- **Testing Requirements**: What tests are needed

### Step 2: Implementation Planning
Before coding, create a brief implementation plan:
- **Files to modify/create**: List the specific files
- **Approach**: High-level technical approach
- **Testing strategy**: How to verify the implementation
- **Integration points**: How this connects to existing code

### Step 3: Implementation
Follow the Claude Code Instructions in the issue:
- **Code standards**: Follow patterns in CLAUDE.md
- **File organization**: Use existing project structure
- **TypeScript**: Ensure proper typing throughout
- **Error handling**: Include comprehensive error handling
- **Educational focus**: Ensure implementation serves writing education goals

### Step 4: Testing Requirements
- **Run existing tests**: `npm test` in relevant directories
- **Create new tests**: If specified in acceptance criteria
- **Manual testing**: Verify functionality works as expected
- **Integration testing**: Ensure no breaking changes

### Step 5: Documentation Updates
- **Update relevant README files** if public APIs changed
- **Add code comments** for complex logic
- **Update TypeScript interfaces** as needed

### Step 6: Create Pull Request
```bash
# Create feature branch if not already on one
git checkout -b "feature/issue-$ARGUMENTS"

# Commit changes with descriptive message
git add .
git commit -m "feat: implement issue #$ARGUMENTS - [brief description]

- [bullet point of main changes]
- [another key change]
- [any breaking changes or notes]

Closes #$ARGUMENTS"

# Push branch and create PR
git push -u origin "feature/issue-$ARGUMENTS"
gh pr create --title "feat: implement issue #$ARGUMENTS" --body "Implements the requirements specified in #$ARGUMENTS

## Changes Made
- [describe key changes]
- [any architectural decisions]
- [testing approach]

## Testing
- [ ] All existing tests pass
- [ ] New tests added where specified
- [ ] Manual testing completed
- [ ] Integration verified

## Educational Impact
- [how this serves writing education goals]
- [any user experience improvements]

Closes #$ARGUMENTS"
```

### Step 7: Update Project Board
```bash
# Move issue to Review column (if using GitHub CLI with projects)
# Note: Project board updates may need to be done manually in some cases
```

### Step 8: Reflection and Documentation
After completing the implementation, run the reflection command:
```bash
# Run the reflection command to document learnings
/reflect
```

## Example Execution Flow

### For Issue #45: "Assignment Database Schema"
1. **Fetch**: `gh issue view 45` shows it's about creating Mongoose schemas
2. **Plan**: Need to create Assignment, LearningObjective, WritingStage models
3. **Implement**: Create files in `backend/src/models/`
4. **Test**: Run `npm test` in backend directory
5. **PR**: Create pull request with descriptive title and body
6. **Reflect**: Document technical decisions and learnings

## Error Handling
If any step fails:
- **Ask for clarification** if issue requirements are unclear
- **Report specific errors** encountered during implementation
- **Suggest alternative approaches** if initial approach doesn't work
- **Request help** if stuck on technical challenges

## Integration with Project Workflow
This command is designed to work with your GitHub Projects setup:
- **Task Groups**: Respects task group dependencies
- **Custom Fields**: Updates issue status and complexity
- **Educational Focus**: Maintains focus on writing education goals
- **Claude Code Ready**: Only works on issues marked as ready

## Success Criteria
Task is complete when:
- [ ] All acceptance criteria met
- [ ] Code follows project standards (CLAUDE.md)
- [ ] Tests pass and new tests added if required
- [ ] Pull request created with good description
- [ ] Documentation updated if needed
- [ ] Issue can be closed
- [ ] Reflection completed

## Important Notes
- **Always read the full issue** before starting implementation
- **Follow the Claude Code Instructions** section in each issue
- **Maintain educational focus** - every implementation should serve writing education
- **Ask questions** if requirements are unclear
- **Test thoroughly** before creating PR
- **Document decisions** that future developers need to understand

This command transforms GitHub issues into focused, complete implementation sessions that maintain quality and educational alignment.