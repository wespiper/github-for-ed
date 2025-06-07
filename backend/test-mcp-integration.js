#!/usr/bin/env node

// Simple test to verify MCP integration works
const { WritingAnalysisMCPClient } = require('./dist/services/mcp/WritingAnalysisMCPClient');

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Integration in Main Backend\n');

  try {
    // Create MCP client
    const mcpClient = new WritingAnalysisMCPClient();
    
    // Connect to MCP server
    console.log('Connecting to MCP server...');
    await mcpClient.connect();
    console.log('✅ Connected successfully\n');

    // Test 1: Content Classification
    console.log('📝 Test 1: Content Classification');
    const classificationResult = await mcpClient.classifyContentSensitivity({
      content: 'My name is John and I struggle with anxiety. This essay is about overcoming challenges.',
      context: {
        contentType: 'essay',
        academicLevel: 'undergraduate',
      },
    });
    
    console.log('Result:', {
      sensitivityLevel: classificationResult.sensitivityLevel,
      sensitivityScore: classificationResult.sensitivityScore,
      elements: classificationResult.sensitiveElements?.length || 0,
    });
    console.log('');

    // Test 2: Writing Pattern Analysis
    console.log('🎨 Test 2: Writing Pattern Analysis');
    const patternResult = await mcpClient.analyzeWritingPatterns({
      content: 'Education is important. However, there are challenges. Furthermore, we need solutions. In conclusion, learning never stops.',
      userId: 'test-student-123',
      role: 'student',
      purpose: 'self-improvement',
      consent: true,
      options: {
        includeStructure: true,
        includeSentiment: true,
        includeComplexity: true,
      },
    });

    console.log('Result:', {
      patterns: Object.keys(patternResult.patterns || {}),
      privacyCompliant: !!patternResult.privacyMetadata,
    });
    console.log('');

    // Test 3: Reflection Quality
    console.log('💭 Test 3: Reflection Quality');
    const qualityResult = await mcpClient.evaluateReflectionQuality({
      reflection: 'Looking back, I learned that planning helps. Next time I will outline first. This improved my writing process.',
      userId: 'test-student-123',
      role: 'student',
      purpose: 'self-assessment',
      consent: true,
    });

    console.log('Result:', {
      qualityScore: qualityResult.quality?.overall || 0,
      accessLevel: qualityResult.progressiveAccess?.currentLevel || 'unknown',
    });
    console.log('');

    // Test 4: Health Check
    console.log('🏥 Test 4: Health Check');
    const health = await mcpClient.healthCheck();
    console.log('Result:', health);
    console.log('');

    // Disconnect
    await mcpClient.disconnect();
    console.log('✅ All integration tests passed!');
    console.log('🎉 MCP integration is working correctly');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testMCPIntegration();