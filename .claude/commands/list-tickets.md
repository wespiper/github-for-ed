# List Available Project Tickets

**Usage**: `/list-tickets` or `/list-tickets ready`

## Command Purpose
Show available GitHub issues from the project board that are ready for Claude Code to work on.

## Available Filters
- **`/list-tickets`** - Show all open issues
- **`/list-tickets ready`** - Show issues in "Ready" column/status
- **`/list-tickets group1`** - Show Group 1 tasks
- **`/list-tickets high`** - Show high priority tasks only
- **`/list-tickets claude`** - Show issues marked as "Claude Code Ready"

## Command Execution

### Default: Show Ready Tasks
```bash
# Show issues that are ready to work on
gh issue list --state open --label "claude-code-ready" --json number,title,labels,assignees --template '
{{- range . -}}
🎫 #{{.number}}: {{.title}}
{{- if .assignees }} (Assigned: {{range .assignees}}@{{.login}} {{end}}){{end}}
{{- range .labels }} [{{.name}}]{{end}}

{{- end -}}'
```

### Show by Task Group
```bash
# Filter by task group (if $ARGUMENTS contains "group")
gh issue list --state open --search "Group $ARGUMENTS in:body" --json number,title,body --template '
{{- range . -}}
🎫 #{{.number}}: {{.title}}
Group: {{if (index (split .body "Task Group:") 1)}}{{slice (index (split .body "Task Group:") 1) 0 20}}...{{end}}

{{- end -}}'
```

### Show by Priority
```bash
# Filter by priority (if $ARGUMENTS contains priority level)
gh issue list --state open --label "priority-$ARGUMENTS" --json number,title,labels --template '
{{- range . -}}
🎫 #{{.number}}: {{.title}}
Priority: {{range .labels}}{{if (hasPrefix .name "priority-")}}{{.name}}{{end}}{{end}}

{{- end -}}'
```

## Enhanced Display Format

### Show Detailed Task Information
For each available task, display:
- **Issue Number**: For use with `/work-ticket`
- **Title**: Clear task description
- **Task Group**: Which logical group it belongs to
- **Priority**: High/Medium/Low
- **Complexity**: Simple/Medium/Complex (estimated hours)
- **Dependencies**: Any blocking issues
- **Assignment Status**: Available or assigned

### Example Output Format
```
🎫 Available Tasks for Claude Code:

📋 GROUP 1: DATA FOUNDATION
  #12: Assignment Database Schema [Group 1] [High Priority] [Medium Complexity]
       Dependencies: None | Estimated: 3-4 hours

  #13: Assignment API Endpoints [Group 1] [High Priority] [Medium Complexity]  
       Dependencies: #12 | Estimated: 3-4 hours

🎨 GROUP 2: CREATION INTERFACE  
  #15: Assignment Form Component [Group 2] [High Priority] [Medium Complexity]
       Dependencies: #13 | Estimated: 3-4 hours

✅ READY TO START:
  #12: Assignment Database Schema (no dependencies)

⏳ WAITING FOR DEPENDENCIES:
  #13: Assignment API Endpoints (needs #12)
  #15: Assignment Form Component (needs #13)
```

## Smart Recommendations

### Suggest Next Task
Based on current project state, recommend the best next task:
- **No dependencies**: Tasks that can start immediately
- **Logical progression**: Following task group order
- **Priority-based**: High priority tasks first
- **Complexity-based**: Consider available time/energy

### Dependency Awareness
```bash
# Check if task dependencies are complete
gh issue view $TASK_NUMBER --json body | jq -r '.body' | grep -i "dependencies"
```

## Integration Commands

### Quick Start Flow
```bash
# See what's available
/list-tickets ready

# Pick a task and start working
/work-ticket 12

# Check progress on current group
/list-tickets group1
```

### Project Health Check
Show overall project status:
- **Completed tasks**: Count of closed issues
- **In progress**: Currently assigned tasks
- **Ready for work**: Available tasks
- **Blocked**: Tasks waiting on dependencies

## Usage Examples

### Start of Development Session
```bash
# See what's ready to work on
/list-tickets ready

# Shows: #12 Assignment Database Schema is ready
/work-ticket 12
```

### Check Group Progress
```bash
# See all Group 1 tasks
/list-tickets group1

# Shows progress: 1/3 complete, 2 remaining
```

### Find High Priority Work
```bash
# Show only high priority tasks
/list-tickets high

# Focus on most important work first
```

## Customization Options

### Filter by Custom Fields
If your project uses custom fields, the command can filter by:
- **Task Group**: Group 1, Group 2, etc.
- **Component**: Frontend, Backend, Full-stack
- **Claude Code Ready**: Yes/No
- **Complexity**: Simple/Medium/Complex

### Sort Options
- **By Priority**: High → Medium → Low
- **By Dependencies**: Ready tasks first
- **By Group**: Logical development order
- **By Complexity**: Simple tasks first for quick wins

This command gives you a clear view of available work and helps you choose the right task for Claude Code to tackle next!