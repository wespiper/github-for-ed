# use-prompt

Load and execute a prompt file from the project documentation to guide development work. Upon completion, automatically update the prompt with reflection and move it to a review folder.

## Usage

```
/use-prompt <prompt-file-path>
```

## Description

This command loads a markdown prompt file from the project documentation (typically from `docs/prompts/` or other doc directories) and uses it to guide the current development task. Upon completion, it automatically:

1. **Updates the prompt file** with reflection insights from the `/reflect` command
2. **Creates a `review` folder** in the same directory as the prompt file (if it doesn't exist)
3. **Moves the completed prompt** to the review folder for archival

This is particularly useful for:

-   Following phase-specific implementation guides
-   Executing detailed technical procedures
-   Maintaining consistency across development phases
-   Providing structured context for complex tasks
-   **Automatically documenting completion** and lessons learned

## Arguments

-   `<prompt-file-path>`: Path to the prompt file relative to the project root (e.g., `docs/prompts/phase-1-week-1.md`)

## Examples

```
/use-prompt docs/prompts/phase-1-fastify-setup.md
/use-prompt docs/prompts/mcp-service-template.md
/use-prompt docs/migration/week-1-checklist.md
```

## Prompt File Format

Prompt files should be markdown files containing:

-   Clear objectives and scope
-   Step-by-step instructions
-   Technical requirements and constraints
-   Success criteria
-   Reference to relevant code locations

## Implementation

When this command is invoked:

1. **Load the specified prompt file** from the project directory
2. **Parse the markdown content** to understand the instructions
3. **Set the context** for the current development session
4. **Begin executing** the instructions systematically
5. **Track progress** against any checklist items in the prompt
6. **Report completion** of each major step

### **Completion Process (NEW)**

After completing the prompt implementation:

7. **Run `/reflect`** to capture implementation insights and lessons learned
8. **Update the prompt file** by appending a "## Completion Reflection" section with:
    - Implementation date and completion status
    - Key insights and lessons learned from `/reflect`
    - Any deviations from the original plan
    - Recommendations for future similar work
9. **Create review folder** (`review/` in same directory as prompt file) if it doesn't exist
10. **Move the updated prompt** to the review folder with timestamp suffix
11. **Log the completion** for project tracking

## File Organization

```
docs/prompts/
├── phase-1-week-1-fastify-setup.md          # Active prompts
├── phase-1-week-2-repository-pattern.md
├── review/                                   # Completed prompts
│   ├── phase-1-week-1-fastify-setup-completed-2025-06-01.md
│   └── phase-2-week-7-mcp-server-completed-2025-06-01.md
```

## Benefits

-   **Consistency**: Ensures all phases follow the planned approach
-   **Efficiency**: No need to repeat complex instructions
-   **Traceability**: Documents exactly which prompts guided which work
-   **Flexibility**: Easy to update prompts as the project evolves
-   **Team Alignment**: Everyone uses the same detailed guides
-   \***\*Automatic Documentation**: Captures completion insights without manual effort
-   \***\*Progress Tracking**: Clear separation of active vs completed prompts
-   \***\*Learning Integration**: Reflection insights improve future prompt quality

## Best Practices

1. **Organize prompts** by phase and week in a logical directory structure
2. **Version control** all prompt files alongside the code
3. **Update prompts** based on learnings from each phase
4. **Include references** to relevant documentation and code
5. **Test prompts** before major implementation work
6. \***\*Review completed prompts** in the review folder for pattern recognition
7. \***\*Use reflection insights** to improve future prompt design

## Related Commands

-   `/reflect` - Document insights after using a prompt (automatically called)
-   `/work-ticket` - For issue-based work
-   `/learn` - Incorporate learnings into future prompts
