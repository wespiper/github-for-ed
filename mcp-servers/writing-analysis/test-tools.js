#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testMCPTools() {
  console.log('🧪 Testing Writing Analysis MCP Server Tools\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    console.log('📋 Available tools:');
    const toolsResponse = await client.request({
      method: 'tools/list',
      params: {},
    });
    
    const tools = toolsResponse.tools || [];
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log(`\nTotal tools: ${tools.length}\n`);

    // Test 1: Content Classification
    console.log('🔒 Test 1: Content Classification');
    const classificationResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'classify_content_sensitivity',
        arguments: {
          content: 'I am struggling with anxiety and my family situation is difficult. My name is John Doe.',
          context: {
            contentType: 'reflection',
            academicLevel: 'undergraduate',
          },
        },
      },
    });
    console.log('Result:', JSON.stringify(classificationResult, null, 2));
    console.log('');

    // Test 2: Educational Purpose Validation
    console.log('📚 Test 2: Educational Purpose Validation');
    const purposeResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'validate_educational_purpose',
        arguments: {
          purpose: 'analyzing student writing patterns to improve teaching methods',
          requestedData: ['writing_content', 'progress_metrics'],
          requesterRole: 'educator',
          targetUsers: ['student-123', 'student-456'],
        },
      },
    });
    console.log('Result:', JSON.stringify(purposeResult, null, 2));
    console.log('');

    // Test 3: AI Boundaries
    console.log('🚧 Test 3: AI Boundaries');
    const boundaryResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'apply_ai_boundaries',
        arguments: {
          request: {
            prompt: 'Write my essay for me about climate change',
            context: 'Assignment due tomorrow',
            requestType: 'answer',
          },
          studentContext: {
            assignmentType: 'essay',
            reflectionCompleted: false,
            progressLevel: 0.3,
          },
        },
      },
    });
    console.log('Result:', JSON.stringify(boundaryResult, null, 2));
    console.log('');

    // Test 4: Writing Pattern Analysis
    console.log('📝 Test 4: Writing Pattern Analysis');
    const patternResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'analyze_writing_patterns',
        arguments: {
          content: 'This is a test essay. I believe that education is important. However, there are many challenges. Furthermore, we must consider different perspectives. In conclusion, learning is a lifelong journey.',
          userId: 'test-user-123',
          role: 'student',
          purpose: 'learning improvement',
          consent: true,
          options: {
            includeStructure: true,
            includeSentiment: true,
            includeComplexity: true,
          },
        },
      },
    });
    console.log('Result:', JSON.stringify(patternResult, null, 2));
    console.log('');

    // Test 5: Reflection Quality
    console.log('💭 Test 5: Reflection Quality Assessment');
    const reflectionResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'evaluate_reflection_quality',
        arguments: {
          reflection: 'Looking back at this assignment, I realized that I struggled with organizing my thoughts initially. I learned that creating an outline helps me structure my ideas better. Next time, I will spend more time planning before I start writing. This experience taught me the importance of the writing process.',
          userId: 'test-user-123',
          role: 'student',
          purpose: 'self-assessment',
          consent: true,
          assignmentContext: {
            assignmentId: 'assignment-789',
          },
        },
      },
    });
    console.log('Result:', JSON.stringify(reflectionResult, null, 2));
    console.log('');

    // Test 6: Progress Tracking
    console.log('📊 Test 6: Writing Progress Tracking');
    const progressResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'track_writing_progress',
        arguments: {
          userId: 'test-user-123',
          sessionId: 'session-456',
          metrics: {
            wordCount: 500,
            timeSpent: 1800,
            revisions: 5,
          },
          role: 'student',
          purpose: 'progress monitoring',
          consent: true,
        },
      },
    });
    console.log('Result:', JSON.stringify(progressResult, null, 2));
    console.log('');

    // Test 7: Insights Generation
    console.log('📈 Test 7: Writing Insights Generation');
    const insightsResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'generate_writing_insights',
        arguments: {
          scope: 'individual',
          targetId: 'test-user-123',
          timeframe: 'week',
          role: 'educator',
          purpose: 'student support',
          includeRecommendations: true,
        },
      },
    });
    console.log('Result:', JSON.stringify(insightsResult, null, 2));
    console.log('');

    // Test 8: Audit Logging
    console.log('📋 Test 8: Audit Logging');
    const auditResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'audit_writing_data_access',
        arguments: {
          accessType: 'analyze',
          dataType: 'writing_patterns',
          userId: 'test-user-123',
          accessedBy: 'educator-456',
          purpose: 'educational assessment',
          educationalContext: {
            courseId: 'course-101',
            assignmentId: 'assignment-789',
          },
        },
      },
    });
    console.log('Result:', JSON.stringify(auditResult, null, 2));
    console.log('');

    console.log('✅ All tests completed successfully!');
    await client.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await client.close();
    process.exit(1);
  }
}

// Run tests
testMCPTools();