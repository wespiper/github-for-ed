// Simple test of a migrated route without database dependencies
const axios = require('axios');

async function testBasicEndpoint() {
  try {
    console.log('Starting simple endpoint test...');
    
    // Set traffic percentage to 100% to force Fastify routing for testing
    process.env.FASTIFY_TRAFFIC_PERCENTAGE = '50';
    process.env.FASTIFY_DEBUG_MODE = 'true';
    
    // Start the development server
    console.log('Please run "npm run dev" in another terminal');
    console.log('Press Ctrl+C to cancel, or wait 10 seconds to start testing...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test the health endpoint (should work)
    console.log('\n🧪 Testing health endpoint...');
    try {
      const healthResponse = await axios.get('http://localhost:5001/api/health', {
        timeout: 5000
      });
      console.log('✅ Health endpoint:', healthResponse.status, healthResponse.headers['x-routed-to']);
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
    }
    
    // Test a simple endpoint that might be routed to Fastify
    console.log('\n🧪 Testing admin API endpoints...');
    try {
      const response = await axios.get('http://localhost:5001/api/admin/api-endpoints', {
        headers: {
          'Authorization': 'Bearer dummy-token-for-testing'
        },
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status
      });
      console.log('✅ Admin endpoints test:', response.status);
      console.log('   Routed to:', response.headers['x-routed-to']);
      console.log('   Response:', response.data?.message || response.data?.error);
    } catch (error) {
      console.log('❌ Admin endpoints test failed:', error.message);
    }
    
    console.log('\n✅ Basic testing completed');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testBasicEndpoint();