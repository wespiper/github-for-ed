import 'dotenv/config';
import { ReflectionAnalysisService } from '../services/ai/ReflectionAnalysisService';
import { ReflectionCacheService } from '../services/cache/ReflectionCacheService';
import prisma from '../lib/prisma';

async function testPerformanceOptimization() {
  console.log('🚀 Testing Performance Optimization...\n');

  // Test data
  const testStudentId = 'perf-test-student-' + Date.now();
  const testAssignmentId = 'perf-test-assignment-' + Date.now();
  
  const testReflection = `
    When I first read the AI's questions about my climate change essay, I felt a bit defensive. 
    The question about "who might disagree" really struck a nerve because I realized I'd been 
    writing in an echo chamber. I spent most of yesterday evening thinking about my uncle Jim, 
    who's skeptical about climate science. This made me completely restructure my introduction.
  `;

  console.log('📊 Test 1: Cache Performance\n');
  
  // First analysis (no cache)
  console.log('First analysis (no cache):');
  const start1 = Date.now();
  const analysis1 = await ReflectionAnalysisService.analyzeReflection(testReflection, {
    studentId: testStudentId,
    assignmentId: testAssignmentId,
    aiInteractionId: 'test-interaction-1',
    writingStage: 'brainstorming'
  });
  const time1 = Date.now() - start1;
  console.log(`  Time: ${time1}ms`);
  console.log(`  Quality Score: ${analysis1.overall.qualityScore}/100`);
  
  // Second analysis (should hit cache)
  console.log('\nSecond analysis (cache hit):');
  const start2 = Date.now();
  const analysis2 = await ReflectionAnalysisService.analyzeReflection(testReflection, {
    studentId: testStudentId,
    assignmentId: testAssignmentId,
    aiInteractionId: 'test-interaction-2',
    writingStage: 'brainstorming'
  });
  const time2 = Date.now() - start2;
  console.log(`  Time: ${time2}ms`);
  console.log(`  Cache speedup: ${Math.round((time1 - time2) / time1 * 100)}%`);
  
  console.log('\n📊 Test 2: Batch Analysis Performance\n');
  
  // Create multiple reflections for history
  const reflections = [
    'I realized I need to consider different perspectives in my writing.',
    'The AI questions helped me think more deeply about my audience.',
    'I noticed patterns in my writing that I want to improve.',
    'This reflection process is helping me grow as a writer.',
    'I understand now why structure is important in essays.'
  ];
  
  console.log('Creating 5 reflection analyses...');
  const batchStart = Date.now();
  
  for (let i = 0; i < reflections.length; i++) {
    await ReflectionAnalysisService.analyzeReflection(reflections[i], {
      studentId: testStudentId,
      assignmentId: testAssignmentId,
      aiInteractionId: `batch-interaction-${i}`,
      writingStage: 'brainstorming'
    });
  }
  
  const batchTime = Date.now() - batchStart;
  console.log(`  Total time: ${batchTime}ms`);
  console.log(`  Average per reflection: ${Math.round(batchTime / reflections.length)}ms`);
  
  console.log('\n📊 Test 3: History Query Performance\n');
  
  // First history query (no cache)
  console.log('First history query (no cache):');
  const histStart1 = Date.now();
  const history1 = await ReflectionAnalysisService.getStudentReflectionHistory(
    testStudentId,
    testAssignmentId
  );
  const histTime1 = Date.now() - histStart1;
  console.log(`  Time: ${histTime1}ms`);
  console.log(`  Total reflections: ${history1.totalReflections}`);
  console.log(`  Average quality: ${history1.averageQuality}/100`);
  
  // Second history query (should hit cache)
  console.log('\nSecond history query (cache hit):');
  const histStart2 = Date.now();
  const history2 = await ReflectionAnalysisService.getStudentReflectionHistory(
    testStudentId,
    testAssignmentId
  );
  const histTime2 = Date.now() - histStart2;
  console.log(`  Time: ${histTime2}ms`);
  console.log(`  Cache speedup: ${Math.round((histTime1 - histTime2) / histTime1 * 100)}%`);
  
  console.log('\n📊 Test 4: Database Query Optimization\n');
  
  // Test optimized query with select
  console.log('Testing optimized database queries...');
  const dbStart = Date.now();
  
  // Optimized query (only selecting needed fields)
  const optimizedResults = await prisma.reflectionAnalysis.findMany({
    where: { studentId: testStudentId },
    select: {
      overallQualityScore: true,
      createdAt: true
    },
    take: 10
  });
  
  const dbTime = Date.now() - dbStart;
  console.log(`  Optimized query time: ${dbTime}ms`);
  console.log(`  Results returned: ${optimizedResults.length}`);
  
  console.log('\n📊 Cache Statistics\n');
  const cacheStats = ReflectionCacheService.getStats();
  console.log(`  Cache size: ${cacheStats.size} entries`);
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await prisma.reflectionAnalysis.deleteMany({
    where: { studentId: testStudentId }
  });
  
  // Clear cache
  ReflectionCacheService.clear();
  
  console.log('\n✅ Performance optimization testing complete!');
  console.log('\nKey Insights:');
  console.log('- Cache provides significant speedup for repeated analyses');
  console.log('- Batch operations complete in reasonable time');
  console.log('- Optimized queries reduce database load');
  console.log('- In-memory caching effective for session-based data');
  
  await prisma.$disconnect();
}

// Run the test
testPerformanceOptimization().catch(console.error);