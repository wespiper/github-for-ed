# use-prompt

Load and execute a prompt file from the project documentation to guide development work.

## Usage

```
/use-prompt <prompt-file-path>
```

## Description

This command loads a markdown prompt file from the project documentation (typically from `docs/prompts/` or other doc directories) and uses it to guide the current development task. This is particularly useful for:

- Following phase-specific implementation guides
- Executing detailed technical procedures
- Maintaining consistency across development phases
- Providing structured context for complex tasks

## Arguments

- `<prompt-file-path>`: Path to the prompt file relative to the project root (e.g., `docs/prompts/phase-1-week-1.md`)

## Examples

```
/use-prompt docs/prompts/phase-1-fastify-setup.md
/use-prompt docs/prompts/mcp-service-template.md
/use-prompt docs/migration/week-1-checklist.md
```

## Prompt File Format

Prompt files should be markdown files containing:
- Clear objectives and scope
- Step-by-step instructions
- Technical requirements and constraints
- Success criteria
- Reference to relevant code locations

## Implementation

When this command is invoked:

1. **Load the specified prompt file** from the project directory
2. **Parse the markdown content** to understand the instructions
3. **Set the context** for the current development session
4. **Begin executing** the instructions systematically
5. **Track progress** against any checklist items in the prompt
6. **Report completion** of each major step

## Benefits

- **Consistency**: Ensures all phases follow the planned approach
- **Efficiency**: No need to repeat complex instructions
- **Traceability**: Documents exactly which prompts guided which work
- **Flexibility**: Easy to update prompts as the project evolves
- **Team Alignment**: Everyone uses the same detailed guides

## Best Practices

1. **Organize prompts** by phase and week in a logical directory structure
2. **Version control** all prompt files alongside the code
3. **Update prompts** based on learnings from each phase
4. **Include references** to relevant documentation and code
5. **Test prompts** before major implementation work

## Related Commands

- `/reflect` - Document insights after using a prompt
- `/work-ticket` - For issue-based work
- `/learn` - Incorporate learnings into future prompts