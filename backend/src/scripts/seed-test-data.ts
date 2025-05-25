import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Assignment } from '../models/Assignment';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { DocumentModel } from '../models/Document';
import { DocumentVersion } from '../models/DocumentVersion';
import { WritingSession } from '../models/WritingSession';

dotenv.config();

interface TestData {
  students: any[];
  educators: any[];
  courses: any[];
  assignments: any[];
  submissions: any[];
  documents: any[];
}

const testData: TestData = {
  students: [],
  educators: [],
  courses: [],
  assignments: [],
  submissions: [],
  documents: []
};

async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...\n');
    
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test data (optional - comment out if you want to keep existing data)
    await clearTestData();

    // Create test users
    await createTestUsers();
    
    // Create test courses
    await createTestCourses();
    
    // Create test assignments
    await createTestAssignments();
    
    // Create test submissions and documents
    await createTestSubmissions();
    
    console.log('🎉 Test data seeding completed successfully!\n');
    console.log('📊 Test Data Summary:');
    console.log(`   👨‍🎓 Students: ${testData.students.length}`);
    console.log(`   👩‍🏫 Educators: ${testData.educators.length}`);
    console.log(`   📚 Courses: ${testData.courses.length}`);
    console.log(`   📝 Assignments: ${testData.assignments.length}`);
    console.log(`   📄 Submissions: ${testData.submissions.length}\n`);
    
    console.log('🔑 Test Login Credentials:');
    console.log('   Admin: wes.piper@gmail.com (your existing account)');
    console.log('   Educator: prof.johnson@university.edu / password123');
    console.log('   Student: alice.chen@student.edu / password123');
    console.log('   Student: bob.martinez@student.edu / password123');
    console.log('   Student: carol.davis@student.edu / password123\n');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

async function clearTestData() {
  console.log('🧹 Clearing existing test data...');
  
  // Clear test data (keep your admin account)
  await User.deleteMany({ email: { $ne: 'wes.piper@gmail.com' } });
  await Course.deleteMany({});
  await Assignment.deleteMany({});
  await AssignmentSubmission.deleteMany({});
  await DocumentModel.deleteMany({});
  await DocumentVersion.deleteMany({});
  await WritingSession.deleteMany({});
  
  console.log('✅ Test data cleared\n');
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  // Use plain text password - User model will hash it automatically
  const plainPassword = 'password123';
  
  // Create test educators
  const educators = [
    {
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'prof.johnson@university.edu',
      password: plainPassword,
      role: 'educator',
      isVerified: true
    },
    {
      firstName: 'Prof. Michael',
      lastName: 'Rodriguez',
      email: 'prof.rodriguez@university.edu',
      password: plainPassword,
      role: 'educator',
      isVerified: true
    }
  ];
  
  for (const educator of educators) {
    const user = new User(educator);
    await user.save();
    testData.educators.push(user);
    console.log(`   ✅ Created educator: ${educator.firstName} ${educator.lastName}`);
  }
  
  // Create test students
  const students = [
    {
      firstName: 'Alice',
      lastName: 'Chen',
      email: 'alice.chen@student.edu',
      password: plainPassword,
      role: 'student',
      isVerified: true
    },
    {
      firstName: 'Bob',
      lastName: 'Martinez',
      email: 'bob.martinez@student.edu',
      password: plainPassword,
      role: 'student',
      isVerified: true
    },
    {
      firstName: 'Carol',
      lastName: 'Davis',
      email: 'carol.davis@student.edu',
      password: plainPassword,
      role: 'student',
      isVerified: true
    },
    {
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@student.edu',
      password: plainPassword,
      role: 'student',
      isVerified: true
    },
    {
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma.thompson@student.edu',
      password: plainPassword,
      role: 'student',
      isVerified: true
    }
  ];
  
  for (const student of students) {
    const user = new User(student);
    await user.save();
    testData.students.push(user);
    console.log(`   ✅ Created student: ${student.firstName} ${student.lastName}`);
  }
  
  console.log(`✅ Created ${educators.length} educators and ${students.length} students\n`);
}

async function createTestCourses() {
  console.log('📚 Creating test courses...');
  
  const courses = [
    {
      title: 'Advanced Composition',
      description: 'Develop advanced writing skills through critical analysis and persuasive argumentation.',
      subject: 'English',
      instructor: testData.educators[0]._id,
      students: testData.students.slice(0, 3).map(s => s._id),
      isPublic: false,
      settings: {
        allowSelfEnrollment: false,
        requireApprovalToJoin: true,
        allowStudentDiscussions: true,
        gradingScale: 'points' as const
      },
      status: 'published' as const,
      isActive: true,
      enrollmentCode: 'COMP301',
      tags: ['writing', 'composition', 'advanced']
    },
    {
      title: 'Research Writing',
      description: 'Learn to conduct research and write evidence-based academic papers.',
      subject: 'English',
      instructor: testData.educators[1]._id,
      students: testData.students.slice(2, 5).map(s => s._id),
      isPublic: false,
      settings: {
        allowSelfEnrollment: false,
        requireApprovalToJoin: true,
        allowStudentDiscussions: true,
        gradingScale: 'points' as const
      },
      status: 'published' as const,
      isActive: true,
      enrollmentCode: 'RSCH201',
      tags: ['research', 'writing', 'academic']
    },
    {
      title: 'Creative Writing Workshop',
      description: 'Explore creative expression through various forms of imaginative writing.',
      subject: 'English',
      instructor: testData.educators[0]._id,
      students: testData.students.slice(1, 4).map(s => s._id),
      isPublic: false,
      settings: {
        allowSelfEnrollment: true,
        requireApprovalToJoin: false,
        allowStudentDiscussions: true,
        gradingScale: 'points' as const
      },
      status: 'published' as const,
      isActive: true,
      enrollmentCode: 'CRWT150',
      tags: ['creative', 'writing', 'workshop']
    }
  ];
  
  for (const courseData of courses) {
    const course = new Course(courseData);
    await course.save();
    testData.courses.push(course);
    console.log(`   ✅ Created course: ${courseData.title}`);
  }
  
  console.log(`✅ Created ${courses.length} courses\n`);
}

async function createTestAssignments() {
  console.log('📝 Creating test assignments...');
  
  const assignments = [
    // Advanced Composition assignments
    {
      title: 'Climate Change Persuasive Essay',
      description: 'Write a 1500-word persuasive essay about climate change impacts on your local community. Focus on specific evidence and compelling arguments.',
      course: testData.courses[0]._id,
      instructor: testData.educators[0]._id,
      instructions: `# Climate Change Persuasive Essay

## Objective
Develop a compelling argument about climate change impacts using evidence-based reasoning and persuasive techniques.

## Requirements
- 1500-2000 words
- Minimum 5 credible sources
- Clear thesis statement
- Counterargument acknowledgment
- MLA format

## Learning Objectives
- Develop critical thinking through evidence evaluation
- Practice persuasive writing techniques
- Learn to address counterarguments effectively`,
      type: 'individual',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      allowLateSubmissions: true,
      requirements: {
        minWords: 1500,
        maxWords: 2000,
        citationStyle: 'MLA',
        requiredSections: ['Introduction', 'Body Paragraphs', 'Counterargument', 'Conclusion'],
        allowedResources: ['Academic journals', 'Government reports', 'News articles', 'Scientific studies']
      },
      collaboration: {
        enabled: false,
        allowRealTimeEditing: false,
        allowComments: true,
        allowSuggestions: true,
        requireApprovalForChanges: false
      },
      versionControl: {
        autoSaveInterval: 30,
        createVersionOnSubmit: true,
        allowVersionRevert: true,
        trackAllChanges: true
      },
      learningObjectives: [
        {
          id: 'lo1',
          description: 'Develop critical thinking through evidence evaluation',
          category: 'analysis',
          bloomsLevel: 4,
          assessmentCriteria: ['Uses credible sources', 'Evaluates evidence quality', 'Makes logical connections'],
          weight: 30
        },
        {
          id: 'lo2',
          description: 'Practice persuasive writing techniques',
          category: 'application',
          bloomsLevel: 3,
          assessmentCriteria: ['Clear thesis statement', 'Compelling arguments', 'Effective rhetoric'],
          weight: 40
        },
        {
          id: 'lo3',
          description: 'Learn to address counterarguments effectively',
          category: 'synthesis',
          bloomsLevel: 5,
          assessmentCriteria: ['Acknowledges opposing views', 'Provides reasoned responses', 'Strengthens overall argument'],
          weight: 30
        }
      ],
      writingStages: [
        {
          id: 'stage1',
          name: 'Research & Planning',
          description: 'Research topic and create outline',
          order: 1,
          required: true,
          durationDays: 3,
          allowAI: true,
          aiAssistanceLevel: 'moderate'
        },
        {
          id: 'stage2',
          name: 'Drafting',
          description: 'Write first draft',
          order: 2,
          required: true,
          durationDays: 5,
          allowAI: true,
          aiAssistanceLevel: 'minimal'
        },
        {
          id: 'stage3',
          name: 'Revision',
          description: 'Revise for content and structure',
          order: 3,
          required: true,
          durationDays: 4,
          allowAI: true,
          aiAssistanceLevel: 'moderate'
        },
        {
          id: 'stage4',
          name: 'Editing',
          description: 'Final editing and proofreading',
          order: 4,
          required: true,
          durationDays: 2,
          allowAI: true,
          aiAssistanceLevel: 'comprehensive'
        }
      ],
      aiSettings: {
        enabled: true,
        globalBoundary: 'moderate',
        allowedAssistanceTypes: ['brainstorming', 'structure', 'research', 'citations'],
        requireReflection: true,
        reflectionPrompts: [
          'How did AI assistance help you think about your topic differently?',
          'What did you learn from the questions AI asked you?'
        ],
        stageSpecificSettings: [
          {
            stageId: 'stage1',
            allowedTypes: ['brainstorming', 'research'],
            boundaryLevel: 'moderate',
            customPrompts: []
          },
          {
            stageId: 'stage2',
            allowedTypes: ['structure'],
            boundaryLevel: 'strict',
            customPrompts: []
          }
        ]
      },
      status: 'published',
      publishedAt: new Date(),
      grading: {
        enabled: true,
        totalPoints: 100,
        rubric: [
          { criteria: 'Thesis & Argument', points: 25, description: 'Clear, compelling thesis with strong argumentation' },
          { criteria: 'Evidence & Sources', points: 25, description: 'Credible sources effectively integrated' },
          { criteria: 'Organization', points: 20, description: 'Logical flow and clear structure' },
          { criteria: 'Writing Quality', points: 20, description: 'Grammar, style, and mechanics' },
          { criteria: 'Citations', points: 10, description: 'Proper MLA format' }
        ],
        allowPeerReview: false
      }
    }
  ];
  
  for (const assignmentData of assignments) {
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    testData.assignments.push(assignment);
    console.log(`   ✅ Created assignment: ${assignmentData.title}`);
  }
  
  console.log(`✅ Created ${assignments.length} assignments\n`);
}

async function createTestSubmissions() {
  console.log('📄 Creating test submissions and documents...');
  
  const submissionData = [
    // Alice Chen - Climate Change Essay (In Progress)
    {
      studentIndex: 0,
      assignmentIndex: 0,
      status: 'in_progress',
      content: `# Climate Change in My Community: A Call to Action

## Introduction

Climate change is no longer a distant threat—it's happening right here in our community. Over the past five years, I've witnessed firsthand how rising temperatures and changing weather patterns have affected our local environment, economy, and way of life.

## Personal Observations

Living in [Community Name], I've noticed several troubling changes:

- Summer temperatures regularly exceed historical averages
- The local lake level has dropped significantly
- Our community garden struggles with more frequent droughts
- Extreme weather events have become more common

## Local Impacts

### Economic Effects
Local farmers report decreased crop yields and increased irrigation costs. The tourism industry, which relies on our natural beauty, has seen visitors decline during increasingly hot summer months.

### Environmental Changes
[This section needs more development - what specific environmental changes should I focus on? How can I make this more compelling for my audience?]

## Community Response

Some local organizations have begun taking action:
- The City Council passed a climate action plan
- Several schools have implemented sustainability programs
- Local businesses are adopting green practices

## What We Can Do

[Need to develop this section further with specific, actionable recommendations]

---

*Current word count: ~200 words. Need to expand to 1500-2000 words. Next steps: research specific data about local climate impacts, find credible sources, develop counterargument section.*`,
      wordCount: 200,
      lastWorkedOn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      stage: 'drafting'
    },
    // Bob Martinez - Climate Change Essay (Brainstorming)
    {
      studentIndex: 1,
      assignmentIndex: 0,
      status: 'draft',
      content: `# Ideas for Climate Change Essay

## Brainstorming Notes

**Possible angles:**
- Focus on water scarcity in our region
- Agricultural impacts on local farms
- Economic costs to the community
- Health impacts (heat waves, air quality)
- Solutions already being implemented

**Questions I have:**
- What data is available about local temperature changes?
- Which community members would be good to interview?
- What are the main counterarguments I should address?
- How can I make this personally relevant to readers?

**Potential thesis ideas:**
1. "Our community must act now to address climate change impacts before they become irreversible."
2. "Local climate action requires both individual responsibility and systemic change."
3. "The economic costs of climate inaction far outweigh the investment in prevention."

**Sources to find:**
- Local weather data from past 10 years
- Economic impact studies
- Interviews with farmers, business owners
- City Council climate action plan
- Scientific studies about regional climate patterns

## Outline Ideas

1. Introduction - Hook with personal observation
2. Evidence of local climate change
3. Current impacts (economic, environmental, social)
4. What's being done now
5. What more needs to be done
6. Counterarguments and responses
7. Conclusion - call to action

**Next steps:** Choose specific angle, find credible sources, start writing introduction`,
      wordCount: 50,
      lastWorkedOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      stage: 'brainstorming'
    },
    // Carol Davis - Climate Change Essay (Revising)
    {
      studentIndex: 2,
      assignmentIndex: 0,
      status: 'in_progress',
      content: `# The Urgent Need for Climate Action: Why Waiting Is Not an Option

## Introduction

Climate change represents the defining challenge of our generation, yet our response has been characterized by denial, delay, and incremental measures that fall far short of what science demands. While politicians debate and corporations prioritize profits, our planet continues to warm at an unprecedented rate. The time for gradual change has passed—we need immediate, transformative action to prevent catastrophic consequences.

## The Scientific Reality

The evidence is overwhelming and undeniable. Global temperatures have risen by 1.1°C since pre-industrial times, with the last decade being the warmest on record (IPCC, 2021). Arctic ice is melting at twice the predicted rate, sea levels are rising, and extreme weather events are becoming more frequent and severe. The Intergovernmental Panel on Climate Change warns that we have less than a decade to limit warming to 1.5°C and avoid the most devastating impacts.

Despite this clear scientific consensus, public understanding remains clouded by misinformation campaigns funded by fossil fuel interests. These deliberate efforts to spread doubt have delayed action for decades, creating the crisis we now face.

## Current Inadequate Response

Governments worldwide have made commitments through the Paris Agreement, yet current pledges fall far short of what's needed. Most countries are not even meeting their insufficient targets. The United States, despite rejoining the Paris Agreement, continues to approve new oil drilling permits. China, while investing heavily in renewable energy, remains the world's largest emitter.

Corporate "green-washing" has become endemic, with companies making bold sustainability claims while continuing business as usual. This superficial approach allows them to maintain their social license while avoiding fundamental changes to their operations.

## The Path Forward

Real climate action requires systemic transformation across all sectors of society. We need:

1. **Rapid decarbonization** of energy systems through massive investment in renewable energy
2. **Transportation revolution** with electric vehicles and improved public transit
3. **Agricultural reform** to reduce emissions and protect ecosystems
4. **Carbon pricing** that reflects the true cost of emissions
5. **Individual action** combined with policy change

The technology exists to make this transition. What we lack is political will and public pressure to implement solutions at the scale and speed required.

**Revision notes:**
- Strengthen counterargument section about economic costs
- Add more specific data about local climate impacts
- Improve transitions between main arguments
- Develop solutions section with more concrete examples

**Areas to strengthen:**
- More recent statistics from IPCC reports
- Address economic transition concerns more thoroughly
- Include examples of successful climate policies`,
      wordCount: 1050,
      lastWorkedOn: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      stage: 'revising'
    }
  ];
  
  for (const [index, data] of submissionData.entries()) {
    const student = testData.students[data.studentIndex];
    const assignment = testData.assignments[data.assignmentIndex];
    
    // Create document first
    const document = new DocumentModel({
      title: `${student.firstName}'s ${assignment.title}`,
      content: data.content,
      author: student._id,
      course: assignment.course,
      assignment: assignment._id,
      type: 'assignment_work',
      status: 'active',
      settings: {
        autoSave: true,
        autoSaveInterval: 30,
        allowCollaboration: false
      },
      metadata: {
        wordCount: data.wordCount,
        characterCount: data.content.length,
        readingTime: Math.ceil(data.wordCount / 200),
        lastEditedAt: data.lastWorkedOn,
        lastEditedBy: student._id
      }
    });
    await document.save();
    testData.documents.push(document);
    
    // Create document version
    const version = new DocumentVersion({
      document: document._id,
      version: 1,
      content: data.content,
      title: `${student.firstName}'s ${assignment.title} - Version 1`,
      changes: {
        type: 'manual',
        description: 'Initial draft',
        addedChars: data.content.length,
        deletedChars: 0,
        addedWords: data.wordCount,
        deletedWords: 0
      },
      author: student._id,
      metadata: {
        wordCount: data.wordCount,
        characterCount: data.content.length,
        readingTime: Math.ceil(data.wordCount / 200),
        sessionDuration: Math.floor(Math.random() * 3600) + 1800 // 30min-90min
      },
      createdAt: data.lastWorkedOn
    });
    await version.save();
    
    // Create assignment submission
    const submission = new AssignmentSubmission({
      assignment: assignment._id,
      author: student._id,
      collaborators: [],
      title: `${student.firstName}'s ${assignment.title}`,
      content: data.content,
      wordCount: data.wordCount,
      characterCount: data.content.length,
      status: data.status,
      submittedAt: data.status === 'submitted' ? data.lastWorkedOn : undefined,
      lastSavedAt: data.lastWorkedOn,
      collaboration: {
        isCollaborative: false,
        activeUsers: [student._id],
        lastActiveAt: data.lastWorkedOn,
        conflictResolution: 'auto'
      },
      currentVersion: 1,
      majorMilestones: [{
        version: 1,
        timestamp: data.lastWorkedOn,
        description: 'Initial draft',
        wordCount: data.wordCount,
        author: student._id
      }],
      comments: [],
      feedback: [],
      grading: {
        isGraded: false,
        rubricScores: []
      },
      analytics: {
        timeSpent: Math.floor(Math.random() * 300) + 60, // 1-5 hours
        wordVelocity: Math.floor(Math.random() * 50) + 20,
        editingPatterns: {
          totalEdits: Math.floor(Math.random() * 50) + 10,
          majorRevisions: Math.floor(Math.random() * 5) + 1,
          minorEdits: Math.floor(Math.random() * 30) + 5
        },
        writingFlow: {
          sessionCount: Math.floor(Math.random() * 5) + 1,
          averageSessionLength: Math.floor(Math.random() * 60) + 30,
          totalBreakTime: Math.floor(Math.random() * 120) + 30
        }
      }
    });
    await submission.save();
    testData.submissions.push(submission);
    
    // Create writing sessions
    const sessionCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < sessionCount; i++) {
      const sessionDate = new Date(data.lastWorkedOn.getTime() - (i * 24 * 60 * 60 * 1000));
      const session = new WritingSession({
        user: student._id,
        document: document._id,
        assignment: assignment._id,
        startTime: new Date(sessionDate.getTime() - 60 * 60 * 1000), // 1 hour earlier
        endTime: sessionDate,
        duration: 60, // 60 minutes
        activity: {
          wordsAdded: Math.floor(Math.random() * 200) + 50,
          wordsDeleted: Math.floor(Math.random() * 50) + 10,
          pauseTime: Math.floor(Math.random() * 300) + 60,
          keystrokeCount: Math.floor(Math.random() * 1000) + 500
        },
        emotionalState: ['focused', 'confident', 'struggling', 'breakthrough'][Math.floor(Math.random() * 4)] as any,
        progressNotes: [
          'Made good progress on introduction',
          'Struggled with transitions',
          'Found good sources for evidence',
          'Had breakthrough on main argument'
        ][Math.floor(Math.random() * 4)]
      });
      await session.save();
    }
    
    console.log(`   ✅ Created submission for ${student.firstName} ${student.lastName} - ${assignment.title}`);
  }
  
  console.log(`✅ Created ${submissionData.length} submissions with documents and writing sessions\n`);
}

// Run the seeding
seedTestData();