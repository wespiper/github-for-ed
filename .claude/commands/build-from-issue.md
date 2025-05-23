# Build from Issue

**Usage:** `@build-from-issue <issue-url-or-number> [--check-comment <comment-url>]`

**Description:** Analyzes a GitHub issue and implements the requested feature or fix following the project's development standards. Can also check and respond to specific issue comments for iterative development.

## Process

1. **Issue Analysis**
   - Fetch and parse the GitHub issue content
   - Extract requirements, acceptance criteria, and technical specifications
   - Identify if it's a feature, bug fix, enhancement, or documentation update

2. **Comment Analysis** (when `--check-comment` flag is used)
   - Fetch and parse the specific comment content
   - Analyze the comment in context of the original issue
   - Determine if it's feedback, a new request, or modification to existing implementation
   - Implement requested changes or respond to feedback

3. **Planning Phase**
   - Create a todo list breaking down the implementation into manageable tasks
   - Determine if backend models, API routes, or frontend components need to be created/modified
   - Identify dependencies and prerequisites

4. **Implementation Strategy**
   
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

5. **Quality Assurance**
   - Write tests following TDD principles before implementation
   - Ensure code follows project's readability and scalability standards
   - Run linting and type checking: `npm run lint` and `npm run build`
   - Test the feature manually in development mode

6. **Documentation**
   - Update API documentation for new endpoints
   - Add component documentation for complex React components
   - Update README.md if the feature affects setup or usage
   - Document any new environment variables or configuration

## Comment Analysis Features

When using `--check-comment`, the system will:

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

# Check and respond to a specific comment
@build-from-issue --check-comment https://github.com/username/github-for-ed/issues/15#issuecomment-123456789

# Combine issue implementation with comment analysis
@build-from-issue 15 --check-comment https://github.com/username/github-for-ed/issues/15#issuecomment-123456789
```

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

## Notes

- Always follows the project's established patterns and conventions
- Implements features incrementally with working intermediate states
- Considers the "GitHub for Writers" context and educational focus
- Ensures compatibility with existing React 19, TypeScript, MongoDB stack
- **Comment Analysis**: Maintains context between original issue and follow-up comments
- **Iterative Development**: Supports continuous improvement based on user feedback