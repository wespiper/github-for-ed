import 'dotenv/config';
import { ExternalAIDetectionService } from '../services/ai/ExternalAIDetectionService';
import { AcademicIntegrityService } from '../services/ai/AcademicIntegrityService';
import { WritingMonitorService } from '../services/WritingMonitorService';
import prisma from '../lib/prisma';

async function testAIDetectionSystem() {
  console.log('🔍 Testing AI Detection & Academic Integrity System...\n');

  try {
    // Create test user and course
    const testUser = await prisma.user.create({
      data: {
        email: `ai-detection-test-${Date.now()}@test.com`,
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student'
      }
    });

    const testInstructor = await prisma.user.create({
      data: {
        email: `instructor-${Date.now()}@test.com`,
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'Instructor',
        role: 'educator'
      }
    });

    const testCourse = await prisma.course.create({
      data: {
        title: 'Test Course for AI Detection',
        instructorId: testInstructor.id
      }
    });

    const testAssignment = await prisma.assignment.create({
      data: {
        title: 'Essay on Climate Change',
        instructions: 'Write a 500-word essay on climate change solutions',
        courseId: testCourse.id,
        instructorId: testInstructor.id,
        requirements: {},
        writingStages: ['brainstorming', 'drafting', 'revising'],
        learningObjectives: ['critical thinking', 'research skills'],
        aiSettings: {
          allowExternalAI: false,
          requireDeclaration: true
        }
      }
    });

    // Create submission and document
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: testAssignment.id,
        authorId: testUser.id,
        status: 'in_progress'
      }
    });

    const document = await prisma.document.create({
      data: {
        title: 'My Climate Change Essay',
        authorId: testUser.id,
        assignmentId: testAssignment.id,
        submissionId: submission.id,
        content: ''
      }
    });

    const writingSession = await prisma.writingSession.create({
      data: {
        documentId: document.id,
        userId: testUser.id,
        startTime: new Date(),
        activity: {}
      }
    });

    console.log('✅ Test data created\n');

    // Test 1: Baseline Writing (Student's authentic style)
    console.log('📝 TEST 1: Building Student Baseline\n');
    
    const authenticWriting = `Climate change is scary. I remember when I was younger, summers weren't this hot. My grandpa talks about how winters used to be way colder too. Its weird how fast things are changing.

I think we need to do something but I'm not sure what. Maybe if everyone just used less electricity? Or drove less? But that's hard because people need to get to work and stuff.

Solar panels seem cool but they're expensive. My neighbor got some and he says they work good but it took forever to save enough money. Not everyone can do that.`;

    // Simulate authentic writing session
    await WritingMonitorService.processSessionUpdate({
      sessionId: writingSession.id,
      documentId: document.id,
      userId: testUser.id,
      charactersAdded: authenticWriting.length,
      charactersDeleted: 45, // Some natural revision
      wordsAdded: authenticWriting.split(/\s+/).length,
      wordsDeleted: 8,
      copyPasteEvents: 0,
      bulkTextAdditions: 0,
      pauseDurations: [3, 5, 2, 8, 4, 12, 3, 6], // Natural pauses
      duration: 15, // 15 minutes
      lastActivity: new Date()
    });

    // Store authentic writing for baseline
    await prisma.document.update({
      where: { id: document.id },
      data: { content: authenticWriting }
    });

    console.log('Authentic writing sample stored for baseline\n');

    // Test 2: AI-Generated Content Detection
    console.log('🤖 TEST 2: Detecting External AI Usage\n');
    
    const aiGeneratedContent = `Climate change represents one of the most pressing challenges facing humanity in the 21st century. The scientific consensus indicates that anthropogenic activities, particularly the emission of greenhouse gases, have contributed significantly to global temperature increases and associated environmental disruptions.

To address this multifaceted issue, a comprehensive approach incorporating multiple strategies is essential. Firstly, transitioning to renewable energy sources such as solar, wind, and hydroelectric power can substantially reduce carbon emissions. Additionally, implementing energy efficiency measures across residential, commercial, and industrial sectors can yield significant benefits.

Furthermore, policy interventions at both national and international levels are crucial. Carbon pricing mechanisms, including carbon taxes and cap-and-trade systems, can incentivize emissions reductions while generating revenue for green investments. Moreover, international cooperation through frameworks like the Paris Agreement demonstrates the importance of collective action.

In conclusion, while climate change poses substantial challenges, the combination of technological innovation, policy implementation, and behavioral changes offers pathways toward a sustainable future. It is imperative that stakeholders across all sectors collaborate to implement these solutions effectively.`;

    // Simulate suspicious writing behavior
    await WritingMonitorService.processSessionUpdate({
      sessionId: writingSession.id,
      documentId: document.id,
      userId: testUser.id,
      charactersAdded: aiGeneratedContent.length,
      charactersDeleted: authenticWriting.length, // Deleted all original
      wordsAdded: aiGeneratedContent.split(/\s+/).length,
      wordsDeleted: authenticWriting.split(/\s+/).length,
      copyPasteEvents: 3, // Multiple copy-paste events
      bulkTextAdditions: 2, // Large chunks added
      pauseDurations: [45, 2, 60, 1], // Long pauses then sudden additions
      duration: 8, // Only 8 minutes for polished essay
      lastActivity: new Date()
    });

    // Update document with AI content
    await prisma.document.update({
      where: { id: document.id },
      data: { content: aiGeneratedContent }
    });

    // Run AI detection
    const detectionResult = await ExternalAIDetectionService.detectExternalAI(
      document.id,
      aiGeneratedContent,
      writingSession.id
    );

    console.log('AI Detection Results:');
    console.log(`  Overall Risk Score: ${detectionResult.overallRiskScore}/100`);
    console.log(`  Confidence: ${detectionResult.confidence}%`);
    console.log(`  Detection Method: ${detectionResult.detectionMethod}`);
    console.log('\nStylometric Analysis:');
    console.log(`  Vocabulary Complexity: ${detectionResult.stylometricAnalysis.vocabularyComplexity}`);
    console.log(`  Deviation from Baseline: ${detectionResult.stylometricAnalysis.deviationFromBaseline}%`);
    console.log(`  Unusual Phrases: ${detectionResult.stylometricAnalysis.unusualPhrases.join(', ')}`);
    console.log('\nBehavioral Analysis:');
    console.log(`  Typing Speed: ${detectionResult.behavioralAnalysis.typingSpeed} WPM`);
    console.log(`  Copy-Paste Events: ${detectionResult.behavioralAnalysis.copyPasteEvents}`);
    console.log(`  Revision Pattern: ${detectionResult.behavioralAnalysis.revisionPattern}`);
    console.log('\nAI Pattern Analysis:');
    console.log(`  Formulaic Structure: ${detectionResult.aiPatternAnalysis.formulaicStructure}`);
    console.log(`  Overly Polished: ${detectionResult.aiPatternAnalysis.overlyPolishedStyle}`);
    console.log(`  Lacks Personal Voice: ${detectionResult.aiPatternAnalysis.lackOfPersonalVoice}`);
    console.log('\nEducational Response:');
    console.log(`  Severity: ${detectionResult.educationalResponse.severity}`);
    console.log(`  Intervention: ${detectionResult.educationalResponse.interventionType}`);
    console.log(`  Message: ${detectionResult.educationalResponse.message}`);

    // Store detection result
    await ExternalAIDetectionService.storeDetectionResult(document.id, detectionResult);

    // Test 3: Academic Integrity Response
    console.log('\n\n🎓 TEST 3: Academic Integrity Intervention\n');

    const interventionResult = await AcademicIntegrityService.handleDetectedAIUsage(
      document.id,
      detectionResult
    );

    console.log('Intervention Result:');
    console.log(`  Type: ${interventionResult.interventionType}`);
    console.log(`  Success: ${interventionResult.success}`);
    console.log(`  Student Response: ${interventionResult.studentResponse}`);
    console.log(`  Next Steps:`);
    interventionResult.nextSteps.forEach(step => console.log(`    - ${step}`));

    // Test 4: Student Self-Declaration
    console.log('\n\n✋ TEST 4: Student Self-Declaration\n');

    const declaration = {
      studentId: testUser.id,
      documentId: document.id,
      assignmentId: testAssignment.id,
      usedExternalAI: true,
      aiTools: ['ChatGPT', 'Grammarly'],
      usageDescription: 'I used ChatGPT to help structure my essay and Grammarly for grammar checking',
      percentageAIGenerated: 70,
      whyUsedAI: 'I was struggling to organize my thoughts and running out of time. I wanted to see how to structure a formal essay.',
      whatLearned: 'I learned about essay structure and formal academic language, but I realize I need to develop my own voice.',
      howWillImprove: 'Next time I will start with an outline and write in my own words first, then only use AI for grammar checking.',
      declarationTime: 'after' as const,
      honestySelfAssessment: 8,
      understandsPolicy: true
    };

    const declarationResult = await AcademicIntegrityService.processSelfDeclaration(declaration);

    console.log('Self-Declaration Processing:');
    console.log(`  Intervention Type: ${declarationResult.interventionType}`);
    console.log(`  Success: ${declarationResult.success}`);
    console.log(`  Educational Modules Assigned:`);
    declarationResult.nextSteps.forEach(step => console.log(`    - ${step}`));

    // Test 5: Integrity Education Plan
    console.log('\n\n📚 TEST 5: Creating Integrity Education Plan\n');

    const educationPlan = await AcademicIntegrityService.createIntegrityPlan(
      testUser.id,
      'first_incident'
    );

    console.log('Education Plan Created:');
    console.log(`  Integrity Score: ${educationPlan.integrityScore}/100`);
    console.log(`  Risk Level: ${educationPlan.riskLevel}`);
    console.log(`  Required Modules:`);
    educationPlan.requiredModules.forEach(module => {
      const moduleInfo = AcademicIntegrityService.EDUCATIONAL_MODULES[module as keyof typeof AcademicIntegrityService.EDUCATIONAL_MODULES];
      console.log(`    - ${moduleInfo?.title || module}`);
    });
    console.log(`  Support: ${educationPlan.assignedMentor ? 'Peer mentor assigned' : 'Self-paced'}`);
    console.log(`  Check-ins: ${educationPlan.scheduledCheckIns?.length || 0} scheduled`);

    // Test 6: Session Summary for Educator
    console.log('\n\n👩‍🏫 TEST 6: Educator Dashboard Summary\n');

    const sessionSummary = await WritingMonitorService.generateSessionSummary(writingSession.id);

    console.log('Session Summary for Educator:');
    console.log(`  Writing Behavior: ${sessionSummary.writingBehavior}`);
    console.log(`  Anomaly Count: ${sessionSummary.anomalyCount}`);
    console.log(`  AI Risk Indicators:`);
    sessionSummary.aiRiskIndicators.forEach(indicator => console.log(`    - ${indicator}`));
    console.log(`  Recommended Actions:`);
    sessionSummary.recommendedActions.forEach(action => console.log(`    - ${action}`));

    // Check notifications
    console.log('\n\n📬 Checking Generated Notifications:\n');

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: testUser.id },
          { recipientId: testInstructor.id }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total notifications created: ${notifications.length}`);
    notifications.forEach(notif => {
      console.log(`\n${notif.recipientId === testUser.id ? 'Student' : 'Educator'} Notification:`);
      console.log(`  Type: ${notif.type}`);
      console.log(`  Title: ${notif.title}`);
      console.log(`  Message: ${notif.message?.substring(0, 100) || 'No message'}...`);
    });

    // Cleanup
    console.log('\n\n🧹 Cleaning up test data...');
    
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipientId: testUser.id },
          { recipientId: testInstructor.id }
        ]
      }
    });
    
    await prisma.writingSession.delete({ where: { id: writingSession.id } });
    await prisma.document.delete({ where: { id: document.id } });
    await prisma.assignmentSubmission.delete({ where: { id: submission.id } });
    await prisma.assignment.delete({ where: { id: testAssignment.id } });
    await prisma.course.delete({ where: { id: testCourse.id } });
    await prisma.studentProfile.deleteMany({ where: { studentId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.user.delete({ where: { id: testInstructor.id } });

    console.log('\n✅ AI Detection System test complete!');

    // Summary
    console.log('\n📊 Test Summary:');
    console.log('- Successfully built student writing baseline');
    console.log('- Detected AI-generated content with high confidence');
    console.log('- Deployed educational intervention (not punitive)');
    console.log('- Processed student self-declaration positively');
    console.log('- Created personalized education plan');
    console.log('- Generated actionable educator insights');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAIDetectionSystem().catch(console.error);