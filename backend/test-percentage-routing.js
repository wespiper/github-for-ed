#!/usr/bin/env node

/**
 * Traffic Percentage Routing Test Script
 * Tests traffic splitting between Express and Fastify based on FASTIFY_TRAFFIC_PERCENTAGE
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

// Configuration
const EXPRESS_PORT = 5001; // The main port that handles traffic routing
const FASTIFY_PORT = 3001;  // Direct Fastify port
const TEST_ENDPOINT = '/api/simple/hello';
const TEST_ITERATIONS = 20; // Number of requests to test percentage

async function makeRequest(port, endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(`http://localhost:${port}${endpoint}`, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          responseTime,
          data: data.substring(0, 100), // First 100 chars
          success: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 'TIMEOUT',
        responseTime: 5000,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function updateTrafficPercentage(percentage) {
  console.log(`🔧 Setting FASTIFY_TRAFFIC_PERCENTAGE to ${percentage}%`);
  
  // Read current .env
  const envPath = '/Users/wnp/Desktop/scribe-tree/backend/.env';
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update the percentage
  envContent = envContent.replace(
    /FASTIFY_TRAFFIC_PERCENTAGE=\d+/,
    `FASTIFY_TRAFFIC_PERCENTAGE=${percentage}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file`);
}

async function testTrafficRouting(percentage) {
  console.log(`\n🧪 TESTING ${percentage}% FASTIFY TRAFFIC`);
  console.log('='.repeat(40));
  
  const directExpressResults = [];
  const directFastifyResults = [];
  const routedResults = [];
  
  // Test direct connections first
  console.log('📡 Testing direct server connections...');
  
  for (let i = 0; i < 3; i++) {
    const expressResult = await makeRequest(EXPRESS_PORT, TEST_ENDPOINT);
    const fastifyResult = await makeRequest(FASTIFY_PORT, TEST_ENDPOINT);
    
    directExpressResults.push(expressResult);
    directFastifyResults.push(fastifyResult);
  }
  
  // Test routed traffic
  console.log('🔀 Testing routed traffic...');
  
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const result = await makeRequest(EXPRESS_PORT, TEST_ENDPOINT);
    routedResults.push(result);
    process.stdout.write('.');
  }
  console.log(' Done!');
  
  // Analyze results
  const successfulRouted = routedResults.filter(r => r.success);
  const failedRouted = routedResults.filter(r => !r.success);
  
  console.log(`\n📊 RESULTS for ${percentage}% Fastify Traffic:`);
  console.log(`  Direct Express: ${directExpressResults.filter(r => r.success).length}/3 success`);
  console.log(`  Direct Fastify: ${directFastifyResults.filter(r => r.success).length}/3 success`);
  console.log(`  Routed Success: ${successfulRouted.length}/${TEST_ITERATIONS} (${Math.round(successfulRouted.length/TEST_ITERATIONS*100)}%)`);
  console.log(`  Routed Failed:  ${failedRouted.length}/${TEST_ITERATIONS} (${Math.round(failedRouted.length/TEST_ITERATIONS*100)}%)`);
  
  if (successfulRouted.length > 0) {
    const avgResponseTime = successfulRouted.reduce((sum, r) => sum + r.responseTime, 0) / successfulRouted.length;
    console.log(`  Avg Response:   ${Math.round(avgResponseTime)}ms`);
  }
  
  // Analyze routing patterns (look for indicators of which server handled request)
  const fastifyResponses = successfulRouted.filter(r => 
    r.data && r.data.includes('Hello from migrated Fastify route!')
  );
  const expressResponses = successfulRouted.filter(r => 
    r.data && !r.data.includes('Hello from migrated Fastify route!')
  );
  
  console.log(`  Fastify handled: ${fastifyResponses.length} requests`);
  console.log(`  Express handled: ${expressResponses.length} requests`);
  
  if (successfulRouted.length > 0) {
    const actualFastifyPercentage = Math.round((fastifyResponses.length / successfulRouted.length) * 100);
    console.log(`  Actual routing:  ${actualFastifyPercentage}% Fastify (target: ${percentage}%)`);
    
    const deviation = Math.abs(actualFastifyPercentage - percentage);
    if (deviation <= 15) { // Allow 15% deviation due to randomness
      console.log(`  ✅ Routing within acceptable range (±15%)`);
    } else {
      console.log(`  ⚠️  Routing deviation: ${deviation}% (may need more samples)`);
    }
  }
  
  return {
    percentage,
    totalRequests: TEST_ITERATIONS,
    successfulRequests: successfulRouted.length,
    fastifyHandled: fastifyResponses.length,
    expressHandled: expressResponses.length,
    avgResponseTime: successfulRouted.length > 0 ? 
      successfulRouted.reduce((sum, r) => sum + r.responseTime, 0) / successfulRouted.length : 0
  };
}

async function runFullTest() {
  console.log('🎯 TRAFFIC PERCENTAGE ROUTING TEST');
  console.log('==================================');
  
  const testPercentages = [0, 25, 50, 75, 100];
  const results = [];
  
  for (const percentage of testPercentages) {
    await updateTrafficPercentage(percentage);
    
    // Give servers time to pick up config change
    console.log('⏰ Waiting 2 seconds for config reload...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await testTrafficRouting(percentage);
    results.push(result);
  }
  
  // Final summary
  console.log('\n🏆 FINAL SUMMARY');
  console.log('================');
  results.forEach(result => {
    const actualPercentage = result.successfulRequests > 0 ? 
      Math.round((result.fastifyHandled / result.successfulRequests) * 100) : 0;
    console.log(`${result.percentage}% target → ${actualPercentage}% actual (${result.successfulRequests}/${result.totalRequests} success)`);
  });
  
  console.log('\n✅ Traffic routing test complete!');
}

if (require.main === module) {
  runFullTest().catch(console.error);
}

module.exports = { testTrafficRouting, updateTrafficPercentage, makeRequest };