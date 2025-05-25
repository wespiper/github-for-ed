# Test Accounts and User Testing Flows

## Test User Accounts

### Admin Account
- **Email:** wes.piper@gmail.com
- **Password:** (your existing password)
- **Role:** Admin
- **Purpose:** Full system access, user management, system configuration

### Educator Accounts
- **Email:** prof.johnson@university.edu
- **Password:** password123
- **Name:** Dr. Sarah Johnson
- **Role:** Educator
- **Courses:** Advanced Composition, Creative Writing Workshop

- **Email:** prof.rodriguez@university.edu
- **Password:** password123
- **Name:** Prof. Michael Rodriguez
- **Role:** Educator
- **Courses:** Research Writing

### Student Accounts
- **Email:** alice.chen@student.edu
- **Password:** password123
- **Name:** Alice Chen
- **Status:** Active submission in drafting stage (Climate Change essay)
- **Courses:** Advanced Composition

- **Email:** bob.martinez@student.edu
- **Password:** password123
- **Name:** Bob Martinez
- **Status:** Brainstorming stage (Climate Change essay)
- **Courses:** Advanced Composition, Creative Writing Workshop

- **Email:** carol.davis@student.edu
- **Password:** password123
- **Name:** Carol Davis
- **Status:** Revising stage (Climate Change essay - 1050 words)
- **Courses:** Advanced Composition, Research Writing, Creative Writing Workshop

- **Email:** david.kim@student.edu
- **Password:** password123
- **Name:** David Kim
- **Status:** Enrolled but no submissions yet
- **Courses:** Research Writing, Creative Writing Workshop

- **Email:** emma.thompson@student.edu
- **Password:** password123
- **Name:** Emma Thompson
- **Status:** Enrolled but no submissions yet
- **Courses:** Research Writing

## Test Data Overview

### Courses Available
1. **Advanced Composition** - Focus on persuasive writing and critical thinking
2. **Research Writing** - Evidence-based academic papers
3. **Creative Writing Workshop** - Imaginative writing forms

### Active Assignment
**Climate Change Persuasive Essay**
- Course: Advanced Composition
- Instructor: Dr. Sarah Johnson
- Requirements: 1500-2000 words, MLA format, 5+ credible sources
- AI Assistance: Enabled with educational boundaries
- Writing Stages: Research & Planning → Drafting → Revision → Editing

## User Testing Flows

### Flow 1: Educator Dashboard and Assignment Management
**Login as:** prof.johnson@university.edu

1. **Dashboard Overview**
   - Navigate to educator dashboard
   - View course overview and student progress
   - Check active assignments and submission statuses

2. **Assignment Monitoring**
   - Click on "Climate Change Persuasive Essay" assignment
   - Review student submissions at different stages
   - Check AI interaction logs and educational questions generated
   - Monitor student writing progress and version history

3. **Educational AI Oversight**
   - Review AI-generated questions for educational appropriateness
   - Verify that AI is asking questions, not providing answers
   - Check that AI assistance aligns with writing stage boundaries

### Flow 2: Student Writing with AI Assistance (Drafting Stage)
**Login as:** alice.chen@student.edu

1. **Assignment Access**
   - Navigate to "Climate Change Persuasive Essay" assignment
   - Open existing draft (approximately 200 words, in-progress)
   - Review assignment requirements and learning objectives

2. **AI-Powered Writing Assistance**
   - Request AI help with expanding environmental impacts section
   - Test AI boundaries: Try asking for written content (should refuse)
   - Ask for thinking prompts about evidence and audience
   - Verify AI provides educational questions, not answers

3. **Writing Process**
   - Add content based on AI-generated thinking prompts
   - Save work and observe version control tracking
   - Move between writing stages and observe different AI assistance levels

### Flow 3: Student Writing with AI Assistance (Revising Stage)
**Login as:** carol.davis@student.edu

1. **Advanced Draft Review**
   - Open the 1050-word Climate Change essay in revising stage
   - Review current content and revision notes

2. **AI-Assisted Revision**
   - Request AI help with strengthening arguments
   - Ask for questions about counterarguments
   - Test AI's ability to identify areas needing development
   - Verify AI provides reflection prompts, not rewritten content

3. **Collaborative Features**
   - Test comment and suggestion features
   - Review version timeline and change tracking
   - Explore how AI questions evolve with writing stage

### Flow 4: Student Starting New Work (Brainstorming Stage)
**Login as:** bob.martinez@student.edu

1. **Early Stage Writing**
   - Open the brainstorming notes for Climate Change essay
   - Review existing idea generation and outline concepts

2. **AI-Powered Brainstorming**
   - Request AI assistance with idea generation
   - Test AI's ability to ask expansive thinking questions
   - Verify AI helps explore different perspectives without providing content
   - Check that AI encourages personal connection and audience awareness

3. **Stage Progression**
   - Develop ideas based on AI questioning
   - Move from brainstorming to drafting stage
   - Observe how AI assistance changes between stages

### Flow 5: Admin System Overview
**Login as:** wes.piper@gmail.com

1. **User Management**
   - View all user accounts and roles
   - Check course enrollments and assignments
   - Review system activity and AI usage logs

2. **AI System Monitoring**
   - Monitor Claude API usage and costs
   - Review educational AI compliance across all interactions
   - Check that AI boundaries are being enforced system-wide

3. **Analytics and Insights**
   - View writing analytics across all students
   - Check educator insights dashboard
   - Review learning outcome progress tracking

## Key Testing Scenarios

### AI Educational Boundaries Testing
1. **Appropriate Requests:**
   - "What questions should I consider about my audience?"
   - "How can I think more deeply about counterarguments?"
   - "What perspectives am I missing on this topic?"

2. **Boundary Violations (Should Be Refused):**
   - "Write my introduction paragraph"
   - "Give me three main arguments for climate action"
   - "Provide citations for my essay"

### Writing Stage Progression Testing
1. **Brainstorming:** AI should ask expansive, creative questions
2. **Drafting:** AI should focus on organization and evidence questions
3. **Revising:** AI should challenge arguments and suggest reflection
4. **Editing:** AI should ask about clarity and presentation

### Collaboration and Version Control Testing
1. Test real-time editing and comment features
2. Verify version history captures AI interactions
3. Check that educator feedback integrates with AI assistance
4. Ensure all AI contributions are transparently attributed

## Expected AI Behavior

### What AI Should Do ✅
- Ask thoughtful, educational questions
- Provide stage-appropriate thinking prompts
- Encourage critical thinking and self-reflection
- Maintain transparency about its educational role
- Adapt questioning style to writing stage and student level

### What AI Should NOT Do ❌
- Write content for students
- Provide direct answers to assignment questions
- Give specific citations or research findings
- Complete tasks that students should do themselves
- Override educational boundaries set by instructors

## Success Criteria

### Technical Success
- [ ] All user accounts can login successfully
- [ ] AI responses are generated by real Claude API (not mock data)
- [ ] Writing stages progress correctly with appropriate AI boundaries
- [ ] Version control tracks all changes and AI interactions

### Educational Success
- [ ] AI consistently asks questions rather than providing answers
- [ ] Students report AI helps them think deeper about their writing
- [ ] Educators can observe meaningful student engagement with AI prompts
- [ ] AI assistance builds critical thinking skills over time

### User Experience Success
- [ ] Interface feels intuitive for both students and educators
- [ ] AI integration feels natural within the writing workflow
- [ ] Performance is responsive for real-time writing assistance
- [ ] Error handling provides clear, helpful feedback

## Troubleshooting

### Common Issues
- **AI Not Responding:** Check Claude API key configuration in backend/.env
- **Login Failures:** Verify MongoDB is running and test data was seeded successfully
- **Slow Performance:** Monitor Claude API response times and token usage
- **Permission Errors:** Confirm user roles and course enrollments are correct

### Reset Test Data
To reset the test environment:
```bash
cd backend
npx ts-node src/scripts/seed-test-data.ts
```

### Monitoring AI Usage
- Check backend console for Claude API initialization messages
- Monitor Claude API dashboard for usage and costs
- Review application logs for AI interaction patterns and errors