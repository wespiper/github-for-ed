import 'dotenv/config';
import { AuthenticityDetector } from '../services/ai/AuthenticityDetector';
import { ReflectionAnalysisService } from '../services/ai/ReflectionAnalysisService';
import prisma from '../lib/prisma';

async function testAuthenticityDetection() {
  console.log('🔍 Testing Enhanced Authenticity Detection...\n');

  // Test data
  const testStudentId = 'test-student-auth-' + Date.now();
  const testAssignmentId = 'test-assignment-auth-' + Date.now();

  // Test samples
  const reflectionSamples = {
    authentic: {
      text: `When I first read the AI's questions about my climate change essay, I felt a bit defensive. 
      The question about "who might disagree" really struck a nerve because I realized I'd been 
      writing in an echo chamber. I spent most of yesterday evening thinking about my uncle Jim, 
      who's skeptical about climate science. At first, I wanted to dismiss his views, but then I 
      remembered our Thanksgiving conversation where he actually made some points about economic 
      impacts that I hadn't considered. This made me completely restructure my introduction. 
      Instead of starting with alarming statistics (which would immediately turn off readers like 
      him), I'm now beginning with shared values about protecting local jobs and communities. 
      It's harder to write this way because I have to constantly check my assumptions, but I 
      think it will ultimately be more persuasive. I'm still struggling with how to present 
      scientific data without seeming preachy - maybe I need to use more local examples?`,
      expectedScore: 85
    },
    
    gaming: {
      text: `The AI helped me think about my writing. These questions made me realize things about 
      my topic. I learned from this interaction. The questions were helpful because they made 
      me think differently. I now understand my topic better. This was useful for my essay. 
      The AI's questions challenged me to think deeper. I will use these insights in my writing.`,
      expectedScore: 25
    },
    
    minimal: {
      text: `Good questions. Made me think. Will revise essay. Thanks.`,
      expectedScore: 15
    },
    
    copyPaste: {
      text: `The AI helped me think about my writing. I realized I need to consider different 
      perspectives. The questions made me understand my topic better. This interaction was 
      helpful for developing my ideas. The AI helped me think about my writing. I realized 
      I need to consider different perspectives. The questions made me understand my topic 
      better. This interaction was helpful for developing my ideas.`,
      expectedScore: 20
    },
    
    mixedQuality: {
      text: `These questions about my audience made me pause. I hadn't really thought about who 
      would disagree with me. The AI helped me realize I need to be more inclusive in my 
      arguments. But honestly, it's frustrating because now I have to rewrite my whole intro. 
      I guess that's the point though - to make my writing better. Still, I wish I had 
      thought of this earlier.`,
      expectedScore: 60
    }
  };

  console.log('📊 Testing Various Reflection Types:\n');

  for (const [type, sample] of Object.entries(reflectionSamples)) {
    console.log(`\n${type.toUpperCase()} REFLECTION:`);
    console.log(`Expected Score: ~${sample.expectedScore}/100`);
    console.log(`Text Length: ${sample.text.split(/\s+/).length} words\n`);

    // Test with AuthenticityDetector directly
    const analysis = await AuthenticityDetector.analyzeAuthenticity(
      sample.text,
      testStudentId,
      testAssignmentId
    );

    console.log(`Authenticity Score: ${analysis.score}/100`);
    console.log(`Confidence: ${analysis.confidence}%`);
    
    if (analysis.flags.length > 0) {
      console.log(`Flags Detected:`);
      analysis.flags.forEach(flag => console.log(`  - ${flag}`));
    }
    
    if (analysis.recommendations.length > 0) {
      console.log(`Recommendations:`);
      analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    // Test with full ReflectionAnalysisService
    console.log('\nFull Analysis Results:');
    const fullAnalysis = await ReflectionAnalysisService.analyzeReflection(
      sample.text,
      {
        studentId: testStudentId,
        assignmentId: testAssignmentId,
        aiInteractionId: `test-interaction-${type}`,
        writingStage: 'brainstorming'
      }
    );

    console.log(`Overall Quality: ${fullAnalysis.overall.qualityScore}/100`);
    console.log(`Access Level: ${fullAnalysis.overall.progressiveAccessLevel}`);
    console.log(`Dimension Scores:`);
    console.log(`  - Depth: ${fullAnalysis.depth.score}`);
    console.log(`  - Self-Awareness: ${fullAnalysis.selfAwareness.score}`);
    console.log(`  - Critical Thinking: ${fullAnalysis.criticalEngagement.score}`);
    console.log(`  - Growth Mindset: ${fullAnalysis.growthMindset.score}`);
    
    console.log('\n' + '='.repeat(80));
  }

  // Test temporal pattern detection
  console.log('\n\n🕐 Testing Temporal Pattern Detection:\n');
  
  // Create test user and course for temporal testing
  const testUser = await prisma.user.create({
    data: {
      email: `temporal-test-${Date.now()}@test.com`,
      passwordHash: 'test-hash',
      firstName: 'Temporal',
      lastName: 'Test',
      role: 'student'
    }
  });

  const testCourse = await prisma.course.create({
    data: {
      title: 'Temporal Test Course',
      instructorId: testUser.id
    }
  });

  const testAssignment = await prisma.assignment.create({
    data: {
      title: 'Temporal Test Assignment',
      instructions: 'Test',
      courseId: testCourse.id,
      instructorId: testUser.id,
      requirements: {},
      writingStages: ['brainstorming'],
      learningObjectives: ['test'],
      aiSettings: {}
    }
  });

  // Simulate rapid submissions (gaming behavior)
  console.log('Simulating rapid reflection submissions...');
  for (let i = 0; i < 6; i++) {
    const analysis = await AuthenticityDetector.analyzeAuthenticity(
      `Quick reflection ${i}. The AI helped me think. This was useful.`,
      testUser.id,
      testAssignment.id
    );
    
    if (i === 5) {
      console.log(`\nAfter ${i + 1} rapid submissions:`);
      console.log(`Authenticity Score: ${analysis.score}/100`);
      console.log(`Temporal Flags: ${analysis.flags.filter(f => f.includes('temporal') || f.includes('rapid')).join(', ') || 'None'}`);
    }
    
    // Create reflection record for temporal analysis
    if (i < 5) {
      await prisma.reflectionAnalysis.create({
        data: {
          studentId: testUser.id,
          assignmentId: testAssignment.id,
          aiInteractionId: `temporal-test-${i}`,
          reflectionText: `Quick reflection ${i}`,
          depthScore: 20,
          reasoningChains: 0,
          abstractionLevel: 1,
          evidenceOfThinking: [],
          selfAwarenessScore: 20,
          criticalThinkingScore: 20,
          growthMindsetScore: 20,
          overallQualityScore: 20,
          authenticityScore: 30,
          progressiveAccessLevel: 'restricted',
          recommendations: []
        }
      });
    }
  }

  // Cleanup
  console.log('\n\n🧹 Cleaning up test data...');
  await prisma.reflectionAnalysis.deleteMany({
    where: { studentId: testUser.id }
  });
  await prisma.assignment.delete({
    where: { id: testAssignment.id }
  });
  await prisma.course.delete({
    where: { id: testCourse.id }
  });
  await prisma.user.delete({
    where: { id: testUser.id }
  });

  console.log('\n✅ Authenticity detection testing complete!');
  
  await prisma.$disconnect();
}

// Run the test
testAuthenticityDetection().catch(console.error);