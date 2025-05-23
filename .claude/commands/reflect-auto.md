# Automatic Task Reflection Command

**IMMEDIATE ACTION**: After generating reflection content, automatically create and save the file to `.claude/reflections/YYYY-MM-DD-[feature-name].md`

## Step 1: Generate Reflection Content
[Use the same reflection framework as in the main reflect.md command]

## Step 2: REQUIRED - Automatic File Creation
**YOU MUST PERFORM THESE ACTIONS:**

1. **Determine today's date** in YYYY-MM-DD format
2. **Ask user for feature name** if not clear from context
3. **Create filename**: `.claude/reflections/[DATE]-[FEATURE-NAME].md`
4. **Write complete reflection content** to the file
5. **Confirm creation** with message: "✅ Reflection saved to: [filename]"

## Example File Creation Process:
```
Today is 2025-01-20
Feature: Writing Editor Layout Improvements
Filename: .claude/reflections/2025-01-20-writing-editor-layout.md
✅ Reflection saved to: .claude/reflections/2025-01-20-writing-editor-layout.md (2.3KB)
```

## Required Confirmation
After file creation, display:
- ✅ File path where reflection was saved
- 📊 File size (shows content was actually written)
- 🔍 Brief summary of key insights captured

This ensures the reflection is permanently stored and available for future `/learn` command analysis.

---

**Note**: This command combines reflection generation AND file creation into a single automated process. No manual saving required.