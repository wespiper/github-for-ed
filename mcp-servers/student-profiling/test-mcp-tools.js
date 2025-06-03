#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('Testing Student Profiling MCP Server Tools...\n');

// Build the project first
console.log('Building project...');
const build = spawn('npm', ['run', 'build'], { cwd: __dirname });

build.on('close', (code) => {
  if (code !== 0) {
    console.error('Build failed');
    process.exit(1);
  }

  console.log('Build successful. Starting MCP server...\n');
  
  // Start the MCP server
  const mcp = spawn('node', ['dist/main.js', 'mcp'], { cwd: __dirname });

  const rl = readline.createInterface({
    input: mcp.stdout,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    console.log(`MCP: ${line}`);
  });

  mcp.stderr.on('data', (data) => {
    console.error(`MCP Error: ${data}`);
  });

  // Give server time to start
  setTimeout(() => {
    console.log('\nSending test requests...\n');

    // Test tool list request
    const listRequest = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    };

    mcp.stdin.write(JSON.stringify(listRequest) + '\n');

    // Test privacy choices tool
    setTimeout(() => {
      const privacyRequest = {
        jsonrpc: '2.0',
        method: 'tools/manage_student_privacy_choices',
        params: {
          studentId: 'test-student-123',
          choices: {
            educationalSharing: {
              teacher: true,
              peer: false,
              parent: true
            },
            platformImprovement: {
              anonymousPatterns: true,
              featureAnalytics: false,
              research: false
            }
          }
        },
        id: 2
      };

      console.log('\nTesting manage_student_privacy_choices tool...');
      mcp.stdin.write(JSON.stringify(privacyRequest) + '\n');
    }, 1000);

    // Test profile building
    setTimeout(() => {
      const profileRequest = {
        jsonrpc: '2.0',
        method: 'tools/build_student_profile',
        params: {
          studentId: 'test-student-123',
          requesterContext: {
            userId: 'teacher-456',
            role: 'teacher',
            purpose: 'grade_assignment'
          }
        },
        id: 3
      };

      console.log('\nTesting build_student_profile tool...');
      mcp.stdin.write(JSON.stringify(profileRequest) + '\n');
    }, 2000);

    // Test differential privacy analytics
    setTimeout(() => {
      const analyticsRequest = {
        jsonrpc: '2.0',
        method: 'tools/generate_privacy_preserving_analytics',
        params: {
          cohortIds: ['class-A', 'class-B', 'class-C'],
          metrics: ['average_writing_score', 'completion_rate'],
          epsilon: 1.0,
          delta: 0.00001
        },
        id: 4
      };

      console.log('\nTesting generate_privacy_preserving_analytics tool...');
      mcp.stdin.write(JSON.stringify(analyticsRequest) + '\n');
    }, 3000);

    // Test privacy dashboard
    setTimeout(() => {
      const dashboardRequest = {
        jsonrpc: '2.0',
        method: 'tools/create_student_privacy_dashboard',
        params: {
          studentId: 'test-student-123',
          includeRecommendations: true,
          timeRange: 'month'
        },
        id: 5
      };

      console.log('\nTesting create_student_privacy_dashboard tool...');
      mcp.stdin.write(JSON.stringify(dashboardRequest) + '\n');
    }, 4000);

    // Clean up after tests
    setTimeout(() => {
      console.log('\n\nTests completed. Shutting down server...');
      mcp.kill();
      process.exit(0);
    }, 6000);

  }, 2000);

  mcp.on('close', (code) => {
    console.log(`MCP server exited with code ${code}`);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  process.exit(0);
});