const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('Starting Writing Analysis MCP Server test...\n');

  try {
    // Start the MCP server
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Create client transport
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js'],
    });

    // Create MCP client
    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    }, {
      capabilities: {},
    });

    // Connect to server
    await client.connect(transport);
    console.log('✓ Connected to MCP server\n');

    // List available tools
    const tools = await client.request({
      method: 'tools/list',
      params: {},
    });

    console.log('Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test content classification
    console.log('Testing content classification...');
    const classificationResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'classify_content_sensitivity',
        arguments: {
          content: 'This is a test essay about learning to write better.',
          context: {
            contentType: 'essay',
            academicLevel: 'undergraduate',
          },
        },
      },
    });
    console.log('Classification result:', JSON.stringify(classificationResult, null, 2));
    console.log('');

    // Test writing pattern analysis
    console.log('Testing writing pattern analysis...');
    const analysisResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'analyze_writing_patterns',
        arguments: {
          content: 'This is a sample text for analysis. It contains multiple sentences. The purpose is to test the writing analysis capabilities.',
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
    console.log('Analysis result:', JSON.stringify(analysisResult, null, 2));
    console.log('');

    // Close connection
    await client.close();
    serverProcess.kill();
    
    console.log('✓ All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMCPServer();