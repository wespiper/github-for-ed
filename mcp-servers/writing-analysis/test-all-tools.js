#!/usr/bin/env node

const { spawn } = require('child_process');

async function testAllTools() {
  console.log('🧪 Comprehensive Testing of Writing Analysis MCP Server\n');
  console.log('=' .repeat(60));

  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let requestId = 1;
  const results = [];

  // Helper to send JSON-RPC request
  function sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method,
      params,
    };
    
    const message = JSON.stringify(request);
    serverProcess.stdin.write(message + '\n');
    return request.id;
  }

  // Collect responses
  const responses = new Map();
  let buffer = '';

  serverProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    lines.forEach(line => {
      if (line.trim() && !line.includes('[Nest]')) {
        try {
          const response = JSON.parse(line);
          if (response.id) {
            responses.set(response.id, response);
          }
        } catch (e) {
          // Ignore non-JSON lines
        }
      }
    });
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2500));

  console.log('\n✅ Server started successfully\n');

  // Test all 8 tools
  const tests = [
    {
      name: 'Content Classification',
      tool: 'classify_content_sensitivity',
      args: {
        content: 'My name is John Doe and I struggle with anxiety. My phone is 555-1234.',
        context: { contentType: 'reflection', academicLevel: 'high_school' },
      },
    },
    {
      name: 'Educational Purpose Validation',
      tool: 'validate_educational_purpose',
      args: {
        purpose: 'analyzing student writing to improve teaching methods',
        requestedData: ['writing_content', 'reflection'],
        requesterRole: 'educator',
        targetUsers: ['student-1', 'student-2'],
      },
    },
    {
      name: 'AI Boundaries',
      tool: 'apply_ai_boundaries',
      args: {
        request: {
          prompt: 'Can you help me understand how to structure my essay better?',
          context: 'Working on argumentative essay',
          requestType: 'assistance',
        },
        studentContext: {
          assignmentType: 'essay',
          reflectionCompleted: true,
          progressLevel: 0.6,
        },
      },
    },
    {
      name: 'Writing Pattern Analysis',
      tool: 'analyze_writing_patterns',
      args: {
        content: 'Education is fundamental to society. However, there are challenges. Furthermore, we must adapt.',
        userId: 'test-123',
        role: 'student',
        purpose: 'self-improvement',
        consent: true,
        options: {
          includeStructure: true,
          includeSentiment: true,
          includeComplexity: true,
        },
      },
    },
    {
      name: 'Reflection Quality',
      tool: 'evaluate_reflection_quality',
      args: {
        reflection: 'I learned that planning helps. Next time I will outline first. This improved my writing.',
        userId: 'test-123',
        role: 'student',
        purpose: 'self-assessment',
        consent: true,
      },
    },
    {
      name: 'Progress Tracking',
      tool: 'track_writing_progress',
      args: {
        userId: 'test-123',
        sessionId: 'session-456',
        metrics: { wordCount: 750, timeSpent: 2400, revisions: 8 },
        role: 'student',
        purpose: 'progress monitoring',
        consent: true,
      },
    },
    {
      name: 'Insights Generation',
      tool: 'generate_writing_insights',
      args: {
        scope: 'individual',
        targetId: 'test-123',
        timeframe: 'week',
        role: 'educator',
        purpose: 'student support',
        includeRecommendations: true,
      },
    },
    {
      name: 'Audit Logging',
      tool: 'audit_writing_data_access',
      args: {
        accessType: 'analyze',
        dataType: 'reflection',
        userId: 'test-123',
        accessedBy: 'educator-456',
        purpose: 'educational assessment',
        educationalContext: { courseId: 'ENG101' },
      },
    },
  ];

  console.log('📋 Running Tool Tests:\n');

  // Run all tests
  for (const test of tests) {
    const startTime = Date.now();
    const id = sendRequest('tools/call', { name: test.tool, arguments: test.args });
    
    // Wait for response
    let response;
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (responses.has(id)) {
        response = responses.get(id);
        break;
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response && response.result) {
      console.log(`✅ ${test.name} (${test.tool})`);
      console.log(`   Response time: ${duration}ms`);
      
      // Log key results
      const result = response.result;
      if (result.sensitivityLevel !== undefined) {
        console.log(`   Sensitivity: ${result.sensitivityLevel} (score: ${result.sensitivityScore})`);
        console.log(`   Sensitive elements: ${result.sensitiveElements.length}`);
      }
      if (result.valid !== undefined) {
        console.log(`   Valid: ${result.valid} (score: ${result.score})`);
        console.log(`   Approval required: ${result.approvalRequired}`);
      }
      if (result.allowed !== undefined) {
        console.log(`   Allowed: ${result.allowed}`);
        console.log(`   Boundaries applied: ${result.boundariesApplied.join(', ') || 'none'}`);
      }
      if (result.patterns) {
        console.log(`   Patterns analyzed: ${Object.keys(result.patterns).filter(k => result.patterns[k]).length}`);
      }
      if (result.quality) {
        console.log(`   Quality score: ${result.quality.overall}%`);
        console.log(`   Access level: ${result.progressiveAccess.currentLevel}`);
      }
      if (result.progressRecorded !== undefined) {
        console.log(`   Progress recorded: ${result.progressRecorded}`);
        console.log(`   Privacy compliant: ${result.privacyCompliant}`);
      }
      if (result.insights) {
        console.log(`   Insights generated for: ${result.insights.summary}`);
        console.log(`   Privacy: ${result.privacyMetadata.aggregationLevel}, DP=${result.privacyMetadata.differentialPrivacyApplied}`);
      }
      if (result.auditId) {
        console.log(`   Audit ID: ${result.auditId}`);
        console.log(`   Immutable hash: ${result.immutableHash.substring(0, 16)}...`);
      }
      
      results.push({ test: test.name, success: true, duration });
    } else {
      console.log(`❌ ${test.name} (${test.tool})`);
      console.log(`   Error: No response received`);
      results.push({ test: test.name, success: false, duration });
    }
    console.log('');
  }

  // Summary
  console.log('=' .repeat(60));
  console.log('\n📊 Test Summary:\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${successful} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Average response time: ${Math.round(avgDuration)}ms`);
  console.log(`Performance: ${avgDuration < 200 ? '✅ PASS' : '❌ FAIL'} (target: <200ms)`);

  // Clean up
  serverProcess.kill();
  process.exit(failed > 0 ? 1 : 0);
}

testAllTools().catch(console.error);