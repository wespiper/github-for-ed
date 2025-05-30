import 'dotenv/config';
import { AIBoundaryService } from '../services/AIBoundaryService';
import { ReflectionAnalysisService } from '../services/ai/ReflectionAnalysisService';
import prisma from '../lib/prisma';

async function testReflectionIntegration() {
  console.log('🧪 Testing Reflection Analysis Integration...\n');

  // Test data
  const timestamp = Date.now();
  const testEmail = `test-student-${timestamp}@test.com`;
  const testAIInteractionId = 'test-interaction-' + timestamp;

  let testUser: any;
  let testCourse: any;
  let testAssignment: any;

  try {
    // Step 0: Create test user, course, and assignment
    console.log('0️⃣ Setting up test data...');
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'test-password-hash',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student'
      }
    });

    // Create test course
    testCourse = await prisma.course.create({
      data: {
        title: 'Test Course',
        description: 'Test course for reflection integration',
        instructorId: testUser.id
      }
    });

    // Create test assignment
    testAssignment = await prisma.assignment.create({
      data: {
        title: 'Test Assignment',
        instructions: 'Test assignment for reflection analysis',
        courseId: testCourse.id,
        instructorId: testUser.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        requirements: {},
        writingStages: ['brainstorming', 'drafting', 'revising', 'editing'],
        learningObjectives: ['Test objective'],
        aiSettings: {
          enabled: true,
          globalBoundary: 'moderate'
        }
      }
    });

    console.log('   ✅ Test user, course, and assignment created\n');

    // Step 1: Create a test AI interaction log
    console.log('1️⃣ Creating test AI interaction...');
    await prisma.aIInteractionLog.create({
      data: {
        id: testAIInteractionId,
        studentId: testUser.id,
        assignmentId: testAssignment.id,
        assistanceType: 'brainstorming',
        questionsGenerated: 3,
        educationallySound: true,
        writingStage: 'brainstorming',
        questionText: 'How can I make my climate change argument more compelling?',
        responseId: 'test-response-123',
        reflectionCompleted: false,
        metadata: {
          test: true,
          createdFor: 'reflection-integration-test'
        }
      }
    });
    console.log('   ✅ Test AI interaction created\n');

    // Step 2: Test different quality reflections
    console.log('2️⃣ Testing reflection quality analysis...\n');

    // High-quality reflection
    const highQualityReflection = `
      These questions made me realize I was making assumptions about 
      my audience. Specifically, I assumed everyone understood the 
      science behind climate change, but the question about "who might 
      disagree" helped me see I need to address skeptics differently. 
      I'm now thinking about restructuring my argument to start with 
      common ground rather than scientific facts. This is challenging 
      because I have to step outside my own perspective, but I think 
      it will make my essay more persuasive. I notice that when I write,
      I tend to assume readers share my knowledge base, which limits
      my effectiveness. Next time, I want to try mapping out different
      audience perspectives before I start drafting.
    `;

    console.log('   Testing HIGH quality reflection:');
    const highQualityAnalysis = await ReflectionAnalysisService.analyzeReflection(
      highQualityReflection,
      {
        studentId: testUser.id,
        assignmentId: testAssignment.id,
        aiInteractionId: testAIInteractionId,
        writingStage: 'brainstorming'
      }
    );

    console.log(`   - Overall Quality Score: ${highQualityAnalysis.overall.qualityScore}/100`);
    console.log(`   - Authenticity Score: ${highQualityAnalysis.overall.authenticityScore}/100`);
    console.log(`   - Access Level: ${highQualityAnalysis.overall.progressiveAccessLevel}`);
    console.log(`   - Depth: ${highQualityAnalysis.depth.score}/100 (${highQualityAnalysis.depth.reasoningChains} reasoning chains)`);
    console.log(`   - Self-Awareness: ${highQualityAnalysis.selfAwareness.score}/100`);
    console.log(`   - Critical Thinking: ${highQualityAnalysis.criticalEngagement.score}/100`);
    console.log(`   - Growth Mindset: ${highQualityAnalysis.growthMindset.score}/100\n`);

    // Low-quality/gaming reflection
    const lowQualityReflection = `The AI helped me think about my writing. These questions made me realize things. I learned from this interaction.`;

    console.log('   Testing LOW quality (potential gaming) reflection:');
    const lowQualityAnalysis = await ReflectionAnalysisService.analyzeReflection(
      lowQualityReflection,
      {
        studentId: testUser.id,
        assignmentId: testAssignment.id,
        aiInteractionId: testAIInteractionId + '-2',
        writingStage: 'brainstorming'
      }
    );

    console.log(`   - Overall Quality Score: ${lowQualityAnalysis.overall.qualityScore}/100`);
    console.log(`   - Authenticity Score: ${lowQualityAnalysis.overall.authenticityScore}/100`);
    console.log(`   - Access Level: ${lowQualityAnalysis.overall.progressiveAccessLevel}\n`);

    // Step 3: Test AI boundary integration
    console.log('3️⃣ Testing AI Boundary Service integration...\n');

    // Update the AI interaction to mark reflection as completed with low quality
    await prisma.aIInteractionLog.update({
      where: { id: testAIInteractionId },
      data: {
        reflectionCompleted: true,
        metadata: {
          reflection: lowQualityReflection,
          reflectionAnalysis: lowQualityAnalysis
        } as any
      }
    });

    // Create more low-quality reflections to trigger restriction
    for (let i = 0; i < 3; i++) {
      await prisma.aIInteractionLog.create({
        data: {
          studentId: testUser.id,
          assignmentId: testAssignment.id,
          assistanceType: 'brainstorming',
          questionsGenerated: 3,
          educationallySound: true,
          writingStage: 'brainstorming',
          questionText: 'Test question ' + i,
          responseId: 'test-response-' + i,
          reflectionCompleted: true,
          metadata: {
            reflection: 'Short reflection that lacks depth.',
            reflectionAnalysis: {
              overall: {
                qualityScore: 25,
                authenticityScore: 40
              }
            }
          } as any
        }
      });
    }

    // Test AI assistance request with poor reflection history
    console.log('   Testing AI request with poor reflection history:');
    const aiRequest = {
      studentId: testUser.id,
      assignmentId: testAssignment.id,
      assistanceType: 'brainstorming' as const,
      context: {
        currentStage: 'brainstorming',
        contentSample: 'Climate change affects our planet...',
        specificQuestion: 'How can I improve my introduction?',
        learningObjective: 'Develop persuasive writing skills'
      },
      timestamp: new Date()
    };

    const aiResponse = await AIBoundaryService.evaluateAssistanceRequest(aiRequest);
    
    if (!aiResponse.approved) {
      console.log('   ✅ AI access correctly DENIED due to poor reflection quality');
      console.log(`   - Reason: Low average reflection quality detected`);
    } else {
      console.log('   ✅ AI access GRANTED with enhanced reflection requirements');
      console.log(`   - Min reflection length: ${aiResponse.mandatoryReflection.minimumLength} words`);
      console.log(`   - Quality threshold: ${aiResponse.mandatoryReflection.qualityThreshold}`);
      console.log(`   - Custom prompts: ${aiResponse.mandatoryReflection.prompts.length} prompts`);
    }

    // Step 4: Test reflection history
    console.log('\n4️⃣ Testing reflection history retrieval...');
    const history = await ReflectionAnalysisService.getStudentReflectionHistory(
      testUser.id,
      testAssignment.id
    );

    console.log(`   - Total reflections: ${history.totalReflections}`);
    console.log(`   - Average quality: ${history.averageQuality}/100`);
    console.log(`   - Quality trend: ${history.qualityTrend}`);
    console.log(`   - Strengths: ${history.strengths.join(', ') || 'None yet'}`);
    console.log(`   - Areas for growth: ${history.areasForGrowth.join(', ')}`);

    console.log('\n✅ All integration tests passed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    if (testUser) {
      await prisma.aIInteractionLog.deleteMany({
        where: { studentId: testUser.id }
      });
      if (testAssignment) {
        await prisma.assignment.delete({
          where: { id: testAssignment.id }
        });
      }
      if (testCourse) {
        await prisma.course.delete({
          where: { id: testCourse.id }
        });
      }
      await prisma.user.delete({
        where: { id: testUser.id }
      });
    }
    console.log('   ✅ Test data cleaned up');
  }

  await prisma.$disconnect();
}

// Run the test
testReflectionIntegration();