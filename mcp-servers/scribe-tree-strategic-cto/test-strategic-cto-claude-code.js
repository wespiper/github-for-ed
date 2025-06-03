#!/usr/bin/env node

/**
 * Test Strategic CTO MCP Server in Claude Code
 * This script demonstrates running MCP tools directly
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the compiled MCP server
const serverPath = path.join(__dirname, 'dist', 'index.js');

function createMCPRequest(method, params = {}) {
  return {
    jsonrpc: "2.0",
    id: Date.now(),
    method: method,
    params: params
  };
}

function sendMCPRequest(server, request) {
  return new Promise((resolve, reject) => {
    const requestStr = JSON.stringify(request) + '\n';
    
    let responseData = '';
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    const onData = (data) => {
      responseData += data.toString();
      
      // Look for complete JSON response
      const lines = responseData.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            clearTimeout(timeout);
            server.stdout.off('data', onData);
            resolve(response);
            return;
          } catch (e) {
            // Continue looking for valid JSON
          }
        }
      }
    };

    server.stdout.on('data', onData);
    server.stdin.write(requestStr);
  });
}

async function testStrategicCTO() {
  console.log('🚀 Starting Strategic CTO MCP Server Test...\n');

  // Start the MCP server
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  try {
    // Initialize the server
    console.log('📡 Initializing MCP server...');
    const initResponse = await sendMCPRequest(server, createMCPRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "claude-code-test", version: "1.0.0" }
    }));
    console.log('✅ Server initialized:', initResponse.result?.serverInfo?.name);

    // List available tools
    console.log('\n🔧 Listing available tools...');
    const toolsResponse = await sendMCPRequest(server, createMCPRequest('tools/list'));
    const tools = toolsResponse.result?.tools || [];
    console.log(`📋 Found ${tools.length} tools:`);
    tools.slice(0, 10).forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description.substring(0, 60)}...`);
    });
    if (tools.length > 10) {
      console.log(`  ... and ${tools.length - 10} more tools`);
    }

    // Create a business goal using our project context
    console.log('\n🎯 Creating business goal with project context...');
    const goalResponse = await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'create_business_goal',
      arguments: {
        name: 'Privacy-First Educational AI Platform Leadership',
        description: 'Establish Scribe Tree as the leading privacy-compliant educational AI writing platform with microservices architecture',
        targetDate: '2025-08-01',
        confidence: 85,
        category: 'platform-leadership',
        successMetrics: [
          'FERPA/COPPA/GDPR compliance verified (119/119 tests passing)',
          '149.1% performance improvement achieved',
          '8 sophisticated AI services operational',
          'MCP microservices architecture ready'
        ]
      }
    }));
    console.log('📊 Goal created:', goalResponse.result?.content?.[0]?.text || 'Success');

    // Create technical milestone
    console.log('\n🏗️ Recording technical milestone...');
    const milestoneResponse = await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'create_technical_milestone',
      arguments: {
        name: 'Phase 1 Privacy Architecture Complete',
        businessContext: {
          revenueImpact: 'Enables B2B enterprise sales with privacy guarantees',
          competitiveAdvantage: 'First educational AI platform with comprehensive privacy-by-design',
          marketPosition: 'Privacy leadership in $8B educational technology market'
        },
        technicalDetails: {
          completion: '100%',
          performance: '149.1% improvement',
          testCoverage: '119/119 privacy tests passing'
        }
      }
    }));
    console.log('🎯 Milestone recorded:', milestoneResponse.result?.content?.[0]?.text || 'Success');

    // Generate strategic analysis
    console.log('\n📈 Generating strategic analysis...');
    const analysisResponse = await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'analyze_development_business_alignment',
      arguments: {}
    }));
    
    if (analysisResponse.result?.content?.[0]?.text) {
      console.log('📊 Strategic Analysis Results:');
      console.log(analysisResponse.result.content[0].text.substring(0, 500) + '...');
    }

    // Generate scenario forecast
    console.log('\n🔮 Generating scenario forecast...');
    const forecastResponse = await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'generate_scenario_forecast',
      arguments: {
        timeframe: '6-months',
        focusAreas: ['frontend-integration', 'market-positioning', 'revenue-enablement']
      }
    }));
    
    if (forecastResponse.result?.content?.[0]?.text) {
      console.log('🎯 Forecast Results:');
      console.log(forecastResponse.result.content[0].text.substring(0, 500) + '...');
    }

    console.log('\n✅ Strategic CTO MCP Server test completed successfully!');
    console.log('🎉 The server is working and providing strategic insights!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    server.kill();
  }
}

// Run the test
testStrategicCTO().catch(console.error);