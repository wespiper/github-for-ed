const { buildFastifyServer } = require('./dist/fastify/server');

async function testSingleRoute() {
  try {
    console.log('Testing Fastify route registration...');
    
    // Try to build just the basic server
    const fastify = await buildFastifyServer();
    
    // Register a simple test route to verify basic functionality
    await fastify.register(async function (fastify) {
      fastify.get('/test', async (request, reply) => {
        return { message: 'Fastify is working!' };
      });
    });
    
    console.log('✅ Basic Fastify server built successfully');
    
    // Try to start the server
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('✅ Fastify test server started on port 3002');
    
    // Test the route
    const response = await fetch('http://localhost:3002/test');
    const data = await response.json();
    console.log('✅ Test route response:', data);
    
    await fastify.close();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSingleRoute();