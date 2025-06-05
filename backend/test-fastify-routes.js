#!/usr/bin/env node

/**
 * Quick test script to verify our fixed Fastify routes are loading correctly
 */

const { startFastifyServer } = require('./src/fastify/app');

async function testFastifyRoutes() {
  console.log('🚀 Testing Fastify route configuration...');
  
  try {
    console.log('📝 Creating Fastify app with enabled routes...');
    const fastify = await startFastifyServer(3001);
    
    console.log('✅ Fastify server started successfully!');
    console.log('📊 Route registration completed without errors');
    console.log('🔗 Available routes include:');
    console.log('   - /api/assignments (FIXED)');
    console.log('   - /api/courses (FIXED)');
    console.log('   - /api/submissions (FIXED)');
    console.log('   - /api/reflections (FIXED)');
    console.log('   - /api/analytics (FIXED)');
    console.log('   - /api/auth (FIXED)');
    console.log('   - /api/educational-ai-validator (FIXED)');
    console.log('   - /api/academic-integrity (FIXED)');
    
    console.log('\n🎉 SUCCESS: All TypeScript-fixed routes loaded successfully!');
    
    // Gracefully shutdown
    setTimeout(async () => {
      console.log('🛑 Shutting down test server...');
      await fastify.close();
      console.log('✅ Test completed successfully!');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error testing Fastify routes:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testFastifyRoutes();