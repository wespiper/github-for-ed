#!/usr/bin/env node

/**
 * Traffic Routing Test Script
 * Tests the Express/Fastify hybrid architecture traffic routing
 */

const http = require('http');

// Configuration from .env
const EXPRESS_PORT = 5001;
const FASTIFY_PORT = 3001;
const TEST_ENDPOINTS = [
  '/api/simple/hello',
  '/api/simple/item/123',
  '/api/reflections',
  '/api/learning-objectives/presets'
];

// Test function
async function testEndpoint(port, endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`http://localhost:${port}${endpoint}`, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          port,
          endpoint,
          status: res.statusCode,
          responseTime,
          server: port === EXPRESS_PORT ? 'Express' : 'Fastify',
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        port,
        endpoint,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        server: port === EXPRESS_PORT ? 'Express' : 'Fastify',
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        port,
        endpoint,
        status: 'TIMEOUT',
        responseTime: 5000,
        server: port === EXPRESS_PORT ? 'Express' : 'Fastify',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('🧪 TRAFFIC ROUTING TEST');
  console.log('======================');
  
  // Test both servers
  const tests = [];
  for (const endpoint of TEST_ENDPOINTS) {
    tests.push(testEndpoint(EXPRESS_PORT, endpoint));
    tests.push(testEndpoint(FASTIFY_PORT, endpoint));
  }
  
  const results = await Promise.all(tests);
  
  // Organize results
  const expressResults = results.filter(r => r.port === EXPRESS_PORT);
  const fastifyResults = results.filter(r => r.port === FASTIFY_PORT);
  
  console.log('\n📊 RESULTS SUMMARY:');
  console.log('==================');
  
  console.log('\n🚂 EXPRESS SERVER (Port 5001):');
  expressResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.endpoint} - ${result.status} (${result.responseTime}ms)`);
    if (!result.success && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  console.log('\n⚡ FASTIFY SERVER (Port 3001):');
  fastifyResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.endpoint} - ${result.status} (${result.responseTime}ms)`);
    if (!result.success && result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  // Summary stats
  const expressSuccess = expressResults.filter(r => r.success).length;
  const fastifySuccess = fastifyResults.filter(r => r.success).length;
  
  console.log('\n📈 SUCCESS RATES:');
  console.log(`  Express: ${expressSuccess}/${expressResults.length} (${Math.round(expressSuccess/expressResults.length*100)}%)`);
  console.log(`  Fastify: ${fastifySuccess}/${fastifyResults.length} (${Math.round(fastifySuccess/fastifyResults.length*100)}%)`);
  
  // Traffic routing readiness
  if (expressSuccess > 0 && fastifySuccess > 0) {
    console.log('\n🎉 TRAFFIC ROUTING READY!');
    console.log('   Both servers responding - can test percentage routing');
  } else if (expressSuccess > 0) {
    console.log('\n⚠️  EXPRESS ONLY');
    console.log('   Fastify server issues - traffic routing not ready');
  } else if (fastifySuccess > 0) {
    console.log('\n⚠️  FASTIFY ONLY');
    console.log('   Express server issues - traffic routing not ready');
  } else {
    console.log('\n❌ BOTH SERVERS DOWN');
    console.log('   Cannot test traffic routing');
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };