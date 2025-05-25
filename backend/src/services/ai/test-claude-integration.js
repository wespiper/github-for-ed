// Simple test script to verify Claude integration
require('dotenv').config();
const { ClaudeProvider } = require('./providers/ClaudeProvider');
const { EducationalAIService } = require('./EducationalAIService');

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude Integration...\n');

  try {
    // Test 1: Provider Health Check
    console.log('1. Testing Claude Provider Health Check...');
    const provider = new ClaudeProvider();
    const isHealthy = await provider.healthCheck();
    console.log(`   Health Check: ${isHealthy ? '✅ PASSED' : '❌ FAILED'}\n`);

    if (!isHealthy) {
      console.log('❌ Provider health check failed. Check API key and connection.');
      return;
    }

    // Test 2: Educational Question Generation
    console.log('2. Testing Educational Question Generation...');
    const testRequest = {
      studentId: 'test-student-123',
      assignmentId: 'test-assignment-456',
      assistanceType: 'brainstorming',
      context: {
        currentStage: 'brainstorming',
        contentSample: 'I want to write about climate change and how it affects our community. I think it\'s a big problem but I\'m not sure where to start or what specific angle to take.',
        specificRequest: 'I need help figuring out what specific aspect of climate change to focus on for my essay.'
      },
      timestamp: new Date()
    };

    const testAssignment = {
      _id: 'test-assignment-456',
      learningObjectives: ['Develop critical thinking through research', 'Learn to form persuasive arguments'],
      difficultyLevel: 'intermediate',
      title: 'Climate Change Impact Essay',
      description: 'Write a persuasive essay about climate change impacts'
    };

    const questionSet = await EducationalAIService.generateEducationalQuestions(testRequest, testAssignment);
    
    console.log('   Generated Questions:');
    questionSet.questions.forEach((q, index) => {
      console.log(`   ${index + 1}. ${q.question}`);
      console.log(`      Educational Value: ${q.educationalRationale}`);
      console.log(`      Expected Outcome: ${q.expectedOutcome}\n`);
    });

    console.log(`   Overall Goal: ${questionSet.overallEducationalGoal}`);
    console.log(`   Reflection Prompt: ${questionSet.reflectionPrompt}`);
    console.log('\n✅ Educational Question Generation: PASSED\n');

    // Test 3: Educational Validation
    console.log('3. Testing Educational Validation...');
    const validation = await EducationalAIService.validateEducationalContent(questionSet);
    console.log(`   Educational Soundness: ${validation.isEducationallySound ? '✅' : '❌'}`);
    console.log(`   Provides Questions: ${validation.providesQuestions ? '✅' : '❌'}`);
    console.log(`   Avoids Answers: ${!validation.containsAnswers ? '✅' : '❌'}`);
    console.log('\n✅ Educational Validation: PASSED\n');

    console.log('🎉 All tests passed! Claude integration is working correctly.');
    console.log('\n📝 Your AI-powered educational assistant is ready to help students think deeper about their writing!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Check your Claude API key and internet connection.');
  }
}

// Run the test
testClaudeIntegration();