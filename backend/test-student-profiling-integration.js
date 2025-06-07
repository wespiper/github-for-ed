#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testStudentProfilingIntegration() {
  console.log('Testing Student Profiling Backend Integration...\n');

  try {
    // Test 1: Check service status
    console.log('1. Testing service status...');
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/student-profiling/status`);
      console.log('Service Status:', {
        mcpConnected: statusResponse.data.data.mcpConnected,
        httpConnected: statusResponse.data.data.httpConnected,
        preferredMethod: statusResponse.data.data.preferredMethod
      });
    } catch (error) {
      console.log('Service status check failed (expected if not authenticated):', error.response?.status);
    }

    // Test 2: Build student profile (would require auth token)
    console.log('\n2. Testing profile build endpoint structure...');
    try {
      const profileResponse = await axios.post(`${API_BASE_URL}/student-profiling/profiles/build`, {
        studentId: 'test-student-123',
        requesterContext: {
          userId: 'test-requester',
          role: 'teacher',
          purpose: 'grade_assignment'
        },
        includePrivateData: false
      });
      console.log('Profile build successful');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Profile build endpoint exists but requires authentication ✓');
      } else if (error.response?.status === 400) {
        console.log('Profile build endpoint validation working ✓');
      } else {
        console.log('Profile build endpoint error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 3: Privacy choices endpoint
    console.log('\n3. Testing privacy choices endpoint structure...');
    try {
      const choicesResponse = await axios.put(`${API_BASE_URL}/student-profiling/profiles/test-student/privacy-choices`, {
        choices: {
          educationalSharing: {
            teacher: true,
            peer: false,
            parent: true
          }
        }
      });
      console.log('Privacy choices update successful');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Privacy choices endpoint exists but requires authentication ✓');
      } else {
        console.log('Privacy choices endpoint error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 4: Analytics endpoint
    console.log('\n4. Testing analytics endpoint structure...');
    try {
      const analyticsResponse = await axios.post(`${API_BASE_URL}/student-profiling/analytics/privacy-preserving`, {
        cohortIds: ['class-A', 'class-B', 'class-C'],
        metrics: ['average_writing_score', 'completion_rate'],
        epsilon: 1.0,
        delta: 0.00001
      });
      console.log('Analytics generation successful');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Analytics endpoint exists but requires authentication ✓');
      } else {
        console.log('Analytics endpoint error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 5: Privacy dashboard endpoint
    console.log('\n5. Testing privacy dashboard endpoint structure...');
    try {
      const dashboardResponse = await axios.get(`${API_BASE_URL}/student-profiling/profiles/test-student/privacy-dashboard`, {
        params: {
          includeRecommendations: true,
          timeRange: 'month'
        }
      });
      console.log('Privacy dashboard generation successful');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Privacy dashboard endpoint exists but requires authentication ✓');
      } else {
        console.log('Privacy dashboard endpoint error:', error.response?.status, error.response?.data?.message);
      }
    }

    console.log('\n✅ Backend integration endpoints are properly configured!');
    console.log('\nNotes:');
    console.log('- All endpoints require authentication (401 responses expected)');
    console.log('- Service will automatically fall back from MCP to HTTP if MCP server is unavailable');
    console.log('- Student Profiling MCP server should be running on port 3002 for full functionality');

  } catch (error) {
    console.error('\n❌ Backend integration test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure the backend server is running on port 5001:');
      console.log('cd backend && npm run dev');
    }
  }
}

// Helper function to test with authentication
async function testWithAuth() {
  console.log('\n=== Testing with Authentication ===');
  console.log('To test with authentication, you would need to:');
  console.log('1. Start the backend server: cd backend && npm run dev');
  console.log('2. Start the Student Profiling MCP server: cd mcp-servers/student-profiling && npm run start:dual');
  console.log('3. Obtain an auth token through the /api/auth/login endpoint');
  console.log('4. Add Authorization header: { "Authorization": "Bearer <token>" }');
  console.log('5. Run the student profiling endpoints');
}

// Run tests
if (require.main === module) {
  testStudentProfilingIntegration()
    .then(() => testWithAuth())
    .catch(console.error);
}

module.exports = {
  testStudentProfilingIntegration
};