#!/usr/bin/env node

const axios = require('axios');
const { spawn } = require('child_process');

const API_BASE_URL = 'http://localhost:3002/api/v1';

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${url}/student-profiles/health`);
      return true;
    } catch (error) {
      console.log(`Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function testAPI() {
  console.log('Testing Student Profiling HTTP API...\n');

  // Build the project
  console.log('Building project...');
  const build = spawn('npm', ['run', 'build'], { 
    cwd: __dirname,
    stdio: 'inherit'
  });

  await new Promise((resolve) => {
    build.on('close', resolve);
  });

  // Start HTTP server
  console.log('\nStarting HTTP server...');
  const server = spawn('node', ['dist/main.js', 'http'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    console.log(`Server: ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data.toString().trim()}`);
  });

  // Wait for server to be ready
  console.log('\nWaiting for server to be ready...');
  const serverReady = await waitForServer(API_BASE_URL);
  
  if (!serverReady) {
    console.error('Server failed to start');
    server.kill();
    process.exit(1);
  }

  console.log('Server is ready! Running tests...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE_URL}/student-profiles/health`);
    console.log('Health check:', health.data);

    // Test 2: Update privacy choices
    console.log('\n2. Testing privacy choices update...');
    const privacyUpdate = await axios.put(
      `${API_BASE_URL}/student-profiles/student-123/privacy-choices`,
      {
        educationalSharing: {
          teacher: true,
          peer: false,
          parent: true
        },
        platformImprovement: {
          anonymousPatterns: true,
          featureAnalytics: true,
          research: false
        },
        personalBenefits: {
          enhancedAnalytics: true,
          portfolio: false,
          careerGuidance: false
        },
        privacyControls: {
          retentionPeriod: '6_months',
          sensitiveContent: 'blur',
          thirdParty: 'none'
        }
      }
    );
    console.log('Privacy update result:', {
      choiceId: privacyUpdate.data.choiceId,
      timestamp: privacyUpdate.data.timestamp
    });

    // Test 3: Build student profile
    console.log('\n3. Testing profile building...');
    const profile = await axios.post(
      `${API_BASE_URL}/student-profiles/build`,
      {
        studentId: 'student-123',
        includePrivateData: false,
        requesterContext: {
          userId: 'teacher-456',
          role: 'teacher',
          purpose: 'grade_assignment'
        }
      }
    );
    console.log('Profile built:', {
      profileId: profile.data.profileId,
      studentId: profile.data.studentId,
      publicProfile: profile.data.publicProfile
    });

    // Test 4: Privacy-preserving analytics
    console.log('\n4. Testing differential privacy analytics...');
    const analytics = await axios.post(
      `${API_BASE_URL}/student-profiles/analytics/privacy-preserving`,
      {
        cohortIds: ['class-A', 'class-B', 'class-C', 'class-D', 'class-E',
                    'class-F', 'class-G', 'class-H', 'class-I', 'class-J'],
        metrics: ['average_writing_score', 'completion_rate', 'engagement_level'],
        epsilon: 1.0,
        delta: 0.00001
      }
    );
    console.log('Analytics result:', {
      analysisId: analytics.data.analysisId,
      cohortSize: analytics.data.cohortSize,
      metrics: analytics.data.metrics.map(m => ({
        name: m.name,
        privatizedValue: m.privatizedValue,
        confidence: m.confidence,
        suppressed: m.suppressed
      }))
    });

    // Test 5: Privacy dashboard
    console.log('\n5. Testing privacy dashboard...');
    const dashboard = await axios.get(
      `${API_BASE_URL}/student-profiles/student-123/privacy-dashboard`,
      {
        params: {
          includeRecommendations: true,
          timeRange: 'month'
        }
      }
    );
    console.log('Dashboard generated:', {
      dashboardId: dashboard.data.dashboardId,
      privacyScore: dashboard.data.privacyScore.overallScore,
      recommendations: dashboard.data.recommendations.length,
      dataInventory: {
        totalDataPoints: dashboard.data.dataInventory.totalDataPoints
      }
    });

    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  // Cleanup
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
}

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  process.exit(0);
});

// Run tests
testAPI().catch(console.error);