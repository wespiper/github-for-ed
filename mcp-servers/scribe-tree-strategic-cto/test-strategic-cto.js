#!/usr/bin/env node

// Test script for Strategic CTO MCP Server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('🚀 Testing Scribe Tree Strategic CTO MCP Server');
console.log('='.repeat(50));

// Test cases for strategic intelligence
const testCases = [
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    }
  },
  {
    name: 'Start Strategic Session - Microservices Migration Review',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'start_strategy_session',
        arguments: {
          type: 'technical-milestone-review',
          title: 'Microservices Migration Strategic Impact Assessment',
          context: {
            technicalMilestone: 'Completed microservices architecture migration',
            urgency: 'high'
          },
          participants: ['Strategic CTO', 'Technical Lead']
        }
      }
    }
  },
  {
    name: 'Create Revenue Goal',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_business_goal',
        arguments: {
          category: 'revenue',
          title: 'Achieve $50K MRR by Q4 2025',
          description: 'Establish sustainable recurring revenue through institutional partnerships and product market fit',
          owner: 'Strategic CTO',
          stakeholders: ['Technical Team', 'Business Development'],
          dependencies: {
            technicalFeatures: ['microservices-architecture', 'institutional-dashboard', 'privacy-compliance'],
            businessPrerequisites: ['pricing-strategy', 'pilot-program-completion', 'market-validation'],
            externalFactors: ['education-market-adoption', 'ai-regulation-clarity']
          },
          initialMetrics: [
            {
              name: 'Monthly Recurring Revenue',
              type: 'revenue',
              target: 50000,
              unit: 'USD',
              timeframe: 'monthly'
            },
            {
              name: 'Active Institutional Customers',
              type: 'growth',
              target: 20,
              unit: 'customers',
              timeframe: 'monthly'
            }
          ]
        }
      }
    }
  }
];

async function runTest(testCase) {
  return new Promise((resolve, reject) => {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log('-'.repeat(30));
    
    const server = spawn('node', [serverPath]);
    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    server.on('close', (code) => {
      if (code === 0) {
        try {
          const response = JSON.parse(output.trim());
          console.log('✅ Success:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (parseError) {
          console.log('📄 Raw output:', output);
          resolve({ success: true, rawOutput: output });
        }
      } else {
        console.log('❌ Error code:', code);
        console.log('📄 Error output:', errorOutput);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
    
    // Send the test request
    server.stdin.write(JSON.stringify(testCase.request) + '\n');
    server.stdin.end();
    
    // Timeout after 10 seconds
    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 10000);
  });
}

async function runAllTests() {
  console.log(`Starting tests for Strategic CTO MCP Server at: ${serverPath}`);
  
  for (const testCase of testCases) {
    try {
      await runTest(testCase);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    } catch (error) {
      console.log(`❌ Test failed: ${testCase.name}`, error.message);
    }
  }
  
  console.log('\n🎉 All tests completed!');
  console.log('\nIf the MCP server is working correctly, you should see:');
  console.log('- List of available tools (conversation and goal management)');
  console.log('- Successfully created strategic conversation');
  console.log('- Successfully created business goal with metrics');
  console.log('\nNext steps:');
  console.log('1. Add this server to your MCP configuration');
  console.log('2. Start using strategic conversation tools');
  console.log('3. Create business goals and track progress');
  console.log('4. Build your strategic intelligence over time');
}

runAllTests().catch(console.error);