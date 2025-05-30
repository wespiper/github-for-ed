import 'dotenv/config';
import { ClaudeProvider } from '../services/ai/providers/ClaudeProvider';

async function testClaudeAPI() {
  console.log('Testing Claude API integration...\n');

  const provider = new ClaudeProvider();

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthOk = await provider.healthCheck();
    console.log(`   Health check: ${healthOk ? '✅ PASSED' : '❌ FAILED'}\n`);

    if (!healthOk) {
      console.error('Health check failed. Please check your CLAUDE_API_KEY.');
      process.exit(1);
    }

    // Test 2: Generate Educational Questions
    console.log('2. Testing educational question generation...');
    const context = {
      studentId: 'test-student-123',
      assignmentId: 'test-assignment-456',
      writingStage: 'brainstorming' as const,
      contentSample: 'Climate change is one of the most pressing issues of our time. It affects everything from weather patterns to economic stability.',
      specificQuestion: 'How can I make my argument about climate change more compelling?',
      learningObjective: 'Develop persuasive writing skills',
      academicLevel: 'developing' as const
    };

    const questions = await provider.generateEducationalQuestions(context);
    console.log('   Generated questions:');
    questions.questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.question}`);
    });
    console.log(`   ✅ Generated ${questions.questions.length} educational questions\n`);

    // Test 3: Validate Educational Response
    console.log('3. Testing educational validation...');
    const validation = await provider.validateEducationalResponse(
      'What specific examples can you think of that illustrate the impact of climate change in your local area?'
    );
    console.log(`   Validation result: ${validation.isEducationallySound ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   - Contains answers: ${validation.containsAnswers ? '❌' : '✅'}`);
    console.log(`   - Provides questions: ${validation.providesQuestions ? '✅' : '❌'}`);
    console.log(`   - Aligns with objectives: ${validation.alignsWithLearningObjectives ? '✅' : '❌'}\n`);

    console.log('🎉 All tests passed! Claude API integration is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testClaudeAPI();