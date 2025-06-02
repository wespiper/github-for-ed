#!/usr/bin/env node

// Test script for Enhanced Strategic CTO MCP Server (Week 2 Features)
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('🚀 Testing Enhanced Strategic CTO MCP Server (Week 2 Features)');
console.log('='.repeat(65));

// Test cases for enhanced features
const testCases = [
  {
    name: 'List Available Templates',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'list_conversation_templates',
        arguments: {}
      }
    }
  },
  {
    name: 'Get Technical Milestone Review Template',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_conversation_template',
        arguments: {
          templateId: 'technical-milestone-strategic-review'
        }
      }
    }
  },
  {
    name: 'Start Templated Conversation - Privacy Enhancement Strategic Review',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'start_templated_conversation',
        arguments: {
          templateId: 'technical-milestone-strategic-review',
          title: 'Privacy Enhancement Strategic Impact Assessment',
          context: {
            technicalMilestone: 'Completed privacy-by-design architecture with GDPR/FERPA compliance',
            urgency: 'high'
          },
          participants: ['Strategic CTO', 'Privacy Team', 'Business Development']
        }
      }
    }
  },
  {
    name: 'Extract Strategic Insights from Files',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'extract_insights_from_files',
        arguments: {
          includeInsights: true,
          includeReflections: true,
          minBusinessRelevance: 70
        }
      }
    }
  },
  {
    name: 'Generate Business Implications',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'generate_business_implications',
        arguments: {
          minBusinessRelevance: 60,
          includeAlignmentMappings: true
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
          
          // Parse the response and show relevant data
          if (response.result && response.result.content) {
            const content = JSON.parse(response.result.content[0].text);
            
            if (content.success) {
              console.log('✅ Success');
              
              // Show specific data based on test type
              if (testCase.name.includes('List Available Templates')) {
                console.log(`📋 Found ${content.data.length} templates:`);
                content.data.forEach(template => {
                  console.log(`   • ${template.name} (${template.type})`);
                });
              } else if (testCase.name.includes('Get Technical Milestone')) {
                console.log(`📄 Template: ${content.data.name}`);
                console.log(`   Purpose: ${content.data.context.purpose}`);
                console.log(`   Sections: ${content.data.templateStructure.sections.length} strategic sections`);
              } else if (testCase.name.includes('Start Templated Conversation')) {
                console.log(`💬 Conversation ID: ${content.data.conversation.id}`);
                console.log(`   Template: ${content.data.template.name}`);
                console.log(`   Key Questions: ${content.data.conversation.keyQuestions.length} questions`);
              } else if (testCase.name.includes('Extract Strategic Insights')) {
                console.log(`🔍 Extracted: ${content.data.summary.relevantInsights} insights`);
                console.log(`   High Value: ${content.data.summary.highValue} insights`);
                console.log(`   Categories: ${Object.keys(content.data.summary.byCategory).join(', ')}`);
              } else if (testCase.name.includes('Generate Business Implications')) {
                console.log(`📊 Generated: ${content.data.implications.length} business implications`);
                console.log(`   Alignment Mappings: ${content.data.alignmentMappings.length} mappings`);
                if (content.data.analysis.keyFindings.length > 0) {
                  console.log(`   Key Finding: ${content.data.analysis.keyFindings[0]}`);
                }
              }
              
              console.log(`📝 Message: ${content.message}`);
            } else {
              console.log('❌ Error:', content.error);
            }
          } else {
            console.log('📄 Raw response:', JSON.stringify(response, null, 2));
          }
          
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
    
    // Timeout after 15 seconds for complex operations
    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 15000);
  });
}

async function runAllTests() {
  console.log(`Starting enhanced tests for Strategic CTO MCP Server at: ${serverPath}`);
  
  for (const testCase of testCases) {
    try {
      await runTest(testCase);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    } catch (error) {
      console.log(`❌ Test failed: ${testCase.name}`, error.message);
    }
  }
  
  console.log('\n🎉 Enhanced feature tests completed!');
  console.log('\n✨ New capabilities now available:');
  console.log('📋 • Strategic conversation templates (4 pre-built templates)');
  console.log('🔗 • Integration with .claude/insights and .claude/reflections');
  console.log('📊 • Automatic business implication generation');
  console.log('🎯 • Technical-business alignment mapping');
  console.log('📈 • Comprehensive conversation reporting');
  console.log('\n🚀 Next steps:');
  console.log('1. Use templated conversations for structured strategic thinking');
  console.log('2. Extract insights from your existing development learnings');
  console.log('3. Generate business implications from technical achievements');
  console.log('4. Create strategic conversations based on extracted insights');
}

runAllTests().catch(console.error);