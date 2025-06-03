#!/usr/bin/env node

/**
 * Setup Full Strategic Context for Scribe Tree
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    }, 10000);

    const onData = (data) => {
      responseData += data.toString();
      
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

async function setupFullContext() {
  console.log('🎯 Setting up full strategic context for Scribe Tree...\n');

  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  server.stderr.on('data', (data) => {
    // Suppress server messages
  });

  try {
    // Initialize
    await sendMCPRequest(server, createMCPRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "context-setup", version: "1.0.0" }
    }));

    // Start a strategic conversation
    console.log('📝 Starting strategic conversation...');
    const conversationResponse = await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'start_strategy_session',
      arguments: {
        topic: 'Scribe Tree Strategic Planning - Phase 2',
        type: 'quarterly-planning',
        context: {
          background: 'Phase 1 complete with 119/119 privacy tests passing, 149.1% performance improvement',
          urgency: 'high',
          stakeholders: ['CEO', 'CTO', 'Head of Product', 'Engineering Team']
        },
        keyQuestions: [
          'How do we leverage our privacy leadership for market positioning?',
          'What is the optimal frontend integration strategy?',
          'How do we package AI features for revenue generation?'
        ]
      }
    }));
    const conversationId = conversationResponse.result?.content?.[0]?.text?.match(/"id":\s*"([^"]+)"/)?.[1];
    console.log(`✅ Conversation started: ${conversationId}`);

    // Update milestone progress
    console.log('\n📊 Updating Privacy Architecture milestone to completed...');
    await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'update_milestone_progress',
      arguments: {
        milestoneId: 'c72f13f2-7ead-4aef-83f6-f7972ef50221',
        completionPercentage: 100,
        completedTasks: [
          'Privacy-by-Design implementation complete',
          'FERPA/COPPA/GDPR compliance verified',
          'AES-256-CBC encryption operational',
          'Comprehensive audit trails established',
          '119/119 privacy tests passing'
        ],
        nextSteps: [
          'Package privacy features for enterprise',
          'Create privacy compliance documentation',
          'Build privacy dashboard for administrators'
        ],
        businessImpactUpdate: '3 major universities interested, 2 enterprise inquiries pending'
      }
    }));

    // Update business goals with progress
    console.log('\n🎯 Updating business goals with achievements...');
    await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'update_goal_progress',
      arguments: {
        goalId: 'd7c7a629-2f9a-405f-b63a-62cf20a6df6b',
        progress: {
          milestones: ['Privacy Architecture Complete', 'Performance Targets Exceeded'],
          metrics: {
            'Privacy Compliance': 100,
            'Performance Improvement': 149.1,
            'Test Coverage': 90,
            'AI Services Operational': 8
          },
          achievements: [
            'First educational platform with comprehensive privacy-by-design',
            '149.1% performance improvement with Fastify migration',
            'Industry-leading privacy monitoring and compliance'
          ]
        },
        confidence: 85,
        nextQuarterProjection: 'Frontend integration and market launch'
      }
    }));

    // Capture strategic insights
    console.log('\n💡 Recording strategic insights...');
    await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'capture_strategic_insight',
      arguments: {
        conversationId: conversationId,
        insight: 'Privacy-first architecture creates significant competitive moat in educational AI market',
        category: 'competitive-advantage',
        impact: {
          timeframe: 'immediate',
          magnitude: 'high',
          confidence: 90
        },
        actionableSteps: [
          'Create privacy whitepaper for B2B sales',
          'Develop privacy certification program',
          'Partner with educational privacy advocates'
        ]
      }
    }));

    // Track strategic decision
    console.log('\n🎯 Recording strategic decision...');
    await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'track_strategic_decision',
      arguments: {
        conversationId: conversationId,
        decision: 'Proceed with Phase 2: Frontend Integration with Privacy Dashboard Priority',
        rationale: 'Privacy leadership validated, market demand confirmed, technical foundation solid',
        expectedOutcome: 'Market launch Q3 2025 with enterprise privacy features',
        reviewTriggers: [
          'Frontend integration delays > 2 weeks',
          'Enterprise deal closure',
          'Competitive privacy announcement'
        ],
        stakeholders: ['CEO', 'CTO', 'Head of Sales']
      }
    }));

    // Add competitor information
    console.log('\n🏆 Adding competitive intelligence...');
    await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'track_competitor_action',
      arguments: {
        competitorName: 'Turnitin',
        action: 'Announced AI detection features without privacy guarantees',
        impact: 'medium',
        ourResponse: 'Emphasize privacy-first AI vs surveillance approach',
        marketImplication: 'Creates differentiation opportunity for privacy-conscious institutions'
      }
    }));

    // Generate comprehensive report
    console.log('\n📊 Generating comprehensive strategic report...');
    const reportResponse = await sendMCPRequest(server, createMCPRequest('tools/call', {
      name: 'generate_executive_report',
      arguments: {
        focus: 'strategic-alignment',
        includeCompetitiveAnalysis: true,
        includeFinancialProjections: true,
        timeHorizon: 'quarterly'
      }
    }));

    console.log('\n✅ Full strategic context established!');
    console.log('\n📋 Summary:');
    console.log('- Strategic conversation initiated');
    console.log('- Privacy milestone marked complete');
    console.log('- Business goals updated with progress');
    console.log('- Strategic insights captured');
    console.log('- Competitive intelligence added');
    console.log('- Executive report generated');
    
    if (reportResponse.result?.content?.[0]?.text) {
      console.log('\n📊 Executive Report Preview:');
      console.log(reportResponse.result.content[0].text.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    server.kill();
  }
}

// Run the setup
setupFullContext().catch(console.error);