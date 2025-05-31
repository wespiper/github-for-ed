import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('MCP Server Integration', () => {
  let serverProcess: ChildProcess;
  
  beforeAll((done) => {
    // Start the MCP server
    const serverPath = resolve(__dirname, '../../dist/index.js');
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Wait for server to be ready
    serverProcess.stderr?.on('data', (data) => {
      if (data.toString().includes('MCP Server running')) {
        done();
      }
    });
    
    // Handle errors
    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      done(err);
    });
  }, 10000);
  
  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });
  
  describe('Tool Registration', () => {
    test('should list all available tools', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      };
      
      const response = await sendRequest(serverProcess, request);
      
      expect(response.result.tools).toBeDefined();
      expect(response.result.tools.length).toBeGreaterThan(0);
      
      const toolNames = response.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('validate_bounded_enhancement');
      expect(toolNames).toContain('assess_blooms_taxonomy');
      expect(toolNames).toContain('check_dependency_risk');
      expect(toolNames).toContain('enforce_philosophy_principles');
      expect(toolNames).toContain('validate_reflection_requirements');
      expect(toolNames).toContain('generate_educational_rationale');
      expect(toolNames).toContain('analyze_question_educational_value');
      expect(toolNames).toContain('validate_progressive_access');
    });
  });
  
  describe('Tool Execution', () => {
    test('validate_bounded_enhancement should validate AI responses', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'validate_bounded_enhancement',
          arguments: {
            aiResponse: {
              questions: [
                'What evidence supports your main argument?',
                'How might readers with different perspectives view this?'
              ],
              educationalRationale: 'Questions designed to promote critical thinking',
              attribution: 'AI-generated educational questions',
              limitations: ['General guidance only']
            },
            context: {
              writingStage: 'revising',
              academicLevel: 'undergraduate'
            }
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
      expect(response.result.content[0].type).toBe('text');
      
      const validation = JSON.parse(response.result.content[0].text);
      expect(validation.isValid).toBe(true);
      expect(validation.overallScore).toBeGreaterThan(70);
      expect(validation.principleScores).toBeDefined();
    });
    
    test('assess_blooms_taxonomy should analyze question levels', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'assess_blooms_taxonomy',
          arguments: {
            questions: [
              'Define the key terms.',
              'Explain the relationship.',
              'Analyze the effectiveness.',
              'Evaluate the outcome.'
            ],
            academicLevel: 'undergraduate'
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      
      const assessment = JSON.parse(response.result.content[0].text);
      expect(assessment.overallLevel).toBeGreaterThanOrEqual(3);
      expect(assessment.questionLevels).toHaveLength(4);
      expect(assessment.distribution).toBeDefined();
      expect(assessment.recommendations).toBeDefined();
    });
    
    test('check_dependency_risk should assess AI usage patterns', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'check_dependency_risk',
          arguments: {
            interactionPattern: {
              frequency: 6, // High frequency
              requestTypes: ['answer_seeking', 'solution_requests'],
              reflectionQuality: 35,
              independentWorkRatio: 0.3
            }
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      
      const riskAssessment = JSON.parse(response.result.content[0].text);
      expect(riskAssessment.riskLevel).not.toBe('none');
      expect(riskAssessment.riskScore).toBeGreaterThan(40);
      expect(riskAssessment.issues.length).toBeGreaterThan(0);
      expect(riskAssessment.interventions.length).toBeGreaterThan(0);
    });
    
    test('should handle invalid tool names', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'invalid_tool_name',
          arguments: {}
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      
      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Tool invalid_tool_name not found');
    });
    
    test('should handle missing required parameters', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'validate_bounded_enhancement',
          arguments: {
            // Missing required aiResponse
            context: {
              writingStage: 'drafting',
              academicLevel: 'high'
            }
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      
      expect(response.error).toBeDefined();
    });
  });
});

// Helper function to send requests to the MCP server
async function sendRequest(serverProcess: ChildProcess, request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestStr = JSON.stringify(request) + '\n';
    
    const responseHandler = (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        serverProcess.stdout?.removeListener('data', responseHandler);
        resolve(response);
      } catch (err) {
        // Handle partial responses
        let buffer = data.toString();
        const partialHandler = (moreData: Buffer) => {
          buffer += moreData.toString();
          try {
            const response = JSON.parse(buffer);
            serverProcess.stdout?.removeListener('data', partialHandler);
            resolve(response);
          } catch (e) {
            // Continue buffering
          }
        };
        serverProcess.stdout?.removeListener('data', responseHandler);
        serverProcess.stdout?.on('data', partialHandler);
      }
    };
    
    serverProcess.stdout?.on('data', responseHandler);
    serverProcess.stdin?.write(requestStr);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      serverProcess.stdout?.removeAllListeners('data');
      reject(new Error('Request timeout'));
    }, 5000);
  });
}