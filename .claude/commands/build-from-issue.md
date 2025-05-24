# Build from Issue

**Usage:** 
- `@build-from-issue <issue-url-or-number>` - Build feature from issue
- `@build-from-issue --check-comment <comment-url>` - Analyze and respond to specific comment

**Description:** Analyzes a GitHub issue and implements the requested feature or fix following the project's development standards. When using `--check-comment`, focuses specifically on analyzing and responding to the comment content rather than the original issue.

## ⚠️ CRITICAL: Two Different Modes

### Mode 1: Issue Implementation
`@build-from-issue <issue-number>` → Builds the entire feature from the issue description

### Mode 2: Comment Analysis 
`@build-from-issue --check-comment <comment-url>` → Analyzes ONLY the comment and implements its specific requests

**When `--check-comment` is used:**
- ❌ Do NOT rebuild the entire feature from the issue
- ✅ DO analyze the specific comment content as the primary directive
- ✅ DO implement the exact changes/fixes requested in the comment
- ✅ DO treat the comment as incremental feedback on existing implementation

## Process

### For Regular Issue Implementation
1. **Issue Analysis**
   - Fetch and parse the GitHub issue content
   - Extract requirements, acceptance criteria, and technical specifications
   - Identify if it's a feature, bug fix, enhancement, or documentation update

### For Comment Analysis (--check-comment flag)
**IMPORTANT: When `--check-comment` is used, focus EXCLUSIVELY on the comment content, not the original issue.**

1. **Comment Access Attempts** (CRITICAL: Must retry on failure)
   - **First Attempt**: Try to fetch and parse the specific comment content using WebFetch
   - **If First Attempt Fails**: Wait 2 seconds and retry with same URL
   - **If Second Attempt Fails**: Stop implementation and ask user for guidance
   - **NEVER**: Proceed with issue content or make assumptions about comment content
   - **NEVER**: Try to interpret or implement based on guesswork

2. **Comment-First Analysis** (Only after successful comment access)
   - Parse the specific comment content as the PRIMARY source
   - Analyze what the comment is requesting, reporting, or discussing
   - Identify the type of comment: feedback, bug report, feature request, clarification, etc.

3. **Context Understanding**
   - Understand the comment in relation to existing implementation
   - Determine what specific changes, fixes, or improvements are being requested
   - Identify if this requires code changes, bug fixes, or clarifications

4. **Direct Implementation**
   - Implement the specific requests made in the comment
   - Fix any issues reported in the comment
   - Make the exact changes requested rather than rebuilding the entire feature

### Common Planning Phase
5. **Planning Phase** (applies to both issue and comment modes)
   - Create a todo list breaking down the implementation into manageable tasks
   - Determine if backend models, API routes, or frontend components need to be created/modified
   - Identify dependencies and prerequisites

6. **Implementation Strategy**
   
   **For Backend Features:**
   - Create or modify Mongoose models in `backend/src/models/`
   - Implement API routes in `backend/src/routes/`
   - Add middleware if needed in `backend/src/middleware/`
   - Update server configuration if required

   **For Frontend Features:**
   - Design and implement React components using ShadCN UI
   - Create custom hooks if needed in `frontend/src/hooks/`
   - Add utility functions in `frontend/src/utils/`
   - Implement proper TypeScript interfaces and types

   **For Full-Stack Features:**
   - Follow the Backend → Frontend development flow
   - Ensure API contracts match frontend expectations
   - Implement proper error handling on both sides

7. **Quality Assurance**
   - Write tests following TDD principles before implementation
   - Ensure code follows project's readability and scalability standards
   - Run linting and type checking: `npm run lint` and `npm run build`
   - Test the feature manually in development mode

8. **Documentation**
   - Update API documentation for new endpoints
   - Add component documentation for complex React components
   - Update README.md if the feature affects setup or usage
   - Document any new environment variables or configuration

## Comment Analysis Features

**CRITICAL: When `--check-comment` flag is used, this is a COMMENT-FOCUSED operation, not an issue implementation. The comment content is the primary directive.**

When using `--check-comment`, the system will:

### Primary Directive
- **ANALYZE THE COMMENT FIRST**: The comment content is the main instruction, not the original issue
- **IMPLEMENT COMMENT REQUESTS**: Focus on what the comment specifically asks for
- **INCREMENTAL CHANGES**: Make targeted changes based on comment feedback rather than rebuilding

### Feedback Recognition
- **Approval**: "This looks good", "Works perfectly", "Great implementation"
- **Change Requests**: "Can you modify...", "This needs...", "Could you add..."
- **Bug Reports**: "This doesn't work", "I found an issue", "There's a problem with..."
- **Questions**: "How does this...", "Why did you...", "What if..."

### Implementation Actions
- **Add Features**: Extract new feature requests from comments
- **Fix Issues**: Identify and resolve reported problems
- **Modify Existing**: Update current implementation based on feedback
- **Clarify Requirements**: Ask follow-up questions when comments are unclear

### Response Types
- **Implementation Updates**: Make requested changes and summarize what was done
- **Status Reports**: Provide progress updates on requested changes
- **Clarification Requests**: Ask for more details when requirements are ambiguous
- **Completion Confirmations**: Confirm when requested changes are complete

## Example Usage

```bash
# Build feature from GitHub issue
@build-from-issue https://github.com/username/github-for-ed/issues/15

# Build from issue number (if repo context is available)
@build-from-issue 15

# COMMENT ANALYSIS MODE - Analyze and respond to specific comment
@build-from-issue --check-comment https://github.com/username/github-for-ed/issues/15#issuecomment-123456789
```

### Comment Analysis Example
When you run:
```bash
@build-from-issue --check-comment https://github.com/wespiper/github-for-ed/issues/3#issuecomment-2905483881
```

The system should:
1. Fetch and analyze ONLY the comment content at that URL
2. Determine what changes/fixes/improvements the comment requests
3. Implement those specific requests
4. NOT rebuild the entire feature from the original issue

## Comment URL Format

The `--check-comment` flag accepts GitHub comment URLs in this format:
```
https://github.com/owner/repo/issues/NUMBER#issuecomment-COMMENT_ID
```

Example:
```
https://github.com/wespiper/github-for-ed/issues/3#issuecomment-2901451070
```

## Development Standards Applied

- **Code Quality**: Write readable, self-documenting code
- **Testing**: Implement unit tests for business logic, integration tests for API endpoints
- **Architecture**: Follow the established patterns for models, routes, and components
- **Error Handling**: Implement comprehensive error boundaries and validation
- **TypeScript**: Maintain strict typing throughout implementation
- **Accessibility**: Ensure UI components follow accessibility best practices

## Output

The command will:
1. Create a detailed implementation plan
2. Generate all necessary code files
3. Write appropriate tests
4. Update documentation
5. Provide setup instructions and verification steps
6. Suggest next steps or follow-up issues if applicable
7. **When using --check-comment**: Respond to user feedback and implement requested changes

## Files Modified/Created

The command automatically determines which files need to be:
- **Created**: New models, routes, components, tests
- **Modified**: Existing files requiring updates
- **Updated**: Documentation and configuration files

## Troubleshooting

### If `--check-comment` isn't working as expected:

**Problem**: Cannot access specific comment content via WebFetch
**Solution**: 
1. Retry exactly once with 2-second delay
2. If second attempt fails, STOP and ask user: "I cannot access the comment at [URL] after two attempts. Would you like me to: (a) Try a different approach, (b) Work from the comment text if you provide it, or (c) Skip this task?"
3. NEVER proceed with guesswork or issue content

**Problem**: Command treats comment analysis like a full issue rebuild
**Solution**: Ensure the flag is used correctly: `@build-from-issue --check-comment <url>` (not combined with issue number)

**Problem**: Response is too generic and doesn't address specific comment requests
**Solution**: Check that the comment contains specific, actionable feedback rather than general discussion

### Expected Behavior
When working correctly, `--check-comment` should:
1. **Access Verification**: Successfully fetch comment content after 1-2 attempts, or ask user for guidance
2. **Content Quote**: Start by quoting or referencing the specific comment content
3. **Request Identification**: Identify the exact requests/issues raised in the comment  
4. **Targeted Implementation**: Implement targeted fixes rather than rebuilding features
5. **Direct Response**: Respond directly to the comment's concerns

### Failure Protocol
If comment cannot be accessed after two attempts:
1. **Stop Implementation**: Do not proceed with any code changes
2. **Report Issue**: Clearly state the access problem to the user
3. **Request Guidance**: Ask user how they want to proceed
4. **Never Guess**: Do not make assumptions about comment content or fall back to issue content

## Notes

- Always follows the project's established patterns and conventions
- Implements features incrementally with working intermediate states
- Considers the "GitHub for Writers" context and educational focus
- Ensures compatibility with existing React 19, TypeScript, MongoDB stack
- **Comment Analysis**: Maintains context between original issue and follow-up comments
- **Iterative Development**: Supports continuous improvement based on user feedback