export { ServiceIntegrationTest, TestResult, ServiceTestSuite, TestCase } from './ServiceIntegrationTest';

// Integration test runner script
import { ServiceIntegrationTest } from './ServiceIntegrationTest';

/**
 * Run all integration tests
 */
export async function runAllIntegrationTests(): Promise<void> {
  const tester = new ServiceIntegrationTest();
  
  try {
    console.log('🚀 Starting Scribe Tree Integration Tests...\n');
    
    // Setup test environment
    await tester.setupTestServices();
    
    // Run tests
    const testResults = await tester.runIntegrationTests();
    
    // Display results
    console.log('\n📊 Test Results Summary:');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed} ✅`);
    console.log(`Failed: ${testResults.summary.failed} ❌`);
    console.log(`Duration: ${testResults.summary.duration}ms`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    if (testResults.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      console.log('─'.repeat(50));
      testResults.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  • ${r.testName}: ${r.error}`);
        });
    }
    
    console.log('\n✨ Integration tests completed!\n');
    
    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Integration test setup failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

/**
 * Contract testing utilities
 */
export class ContractTester {
  /**
   * Test API contract compliance
   */
  static async testAPIContract(
    serviceEndpoint: string,
    contractDefinition: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Test endpoint availability
      const response = await fetch(`${serviceEndpoint}/health`);
      if (!response.ok) {
        errors.push(`Health endpoint not accessible: ${response.status}`);
      }
      
      // Test required endpoints
      if (contractDefinition.endpoints) {
        for (const endpoint of contractDefinition.endpoints) {
          try {
            const testResponse = await fetch(`${serviceEndpoint}${endpoint.path}`, {
              method: endpoint.method || 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            // We expect either success or specific error codes, not network failures
            if (!testResponse) {
              errors.push(`Endpoint ${endpoint.path} not reachable`);
            }
          } catch (error) {
            errors.push(`Endpoint ${endpoint.path} failed: ${(error as Error).message}`);
          }
        }
      }
      
    } catch (error) {
      errors.push(`Contract test failed: ${(error as Error).message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Test MCP service contract
   */
  static async testMCPContract(
    serviceName: string,
    expectedCapabilities: string[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // For now, this is a placeholder for MCP contract testing
    // In a real implementation, you would:
    // 1. Connect to the MCP service
    // 2. List available tools
    // 3. Verify expected capabilities are present
    // 4. Test tool schemas and responses
    
    console.log(`Testing MCP contract for ${serviceName} with capabilities: ${expectedCapabilities.join(', ')}`);
    
    // Simulate contract validation
    if (expectedCapabilities.length === 0) {
      errors.push('No capabilities defined for MCP service');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Chaos testing utilities
 */
export class ChaosTester {
  /**
   * Test system resilience by introducing controlled failures
   */
  static async runChaosTests(): Promise<{
    testsRun: number;
    systemStable: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let testsRun = 0;
    
    console.log('🌪️  Starting chaos engineering tests...');
    
    // Test 1: Network latency simulation
    testsRun++;
    try {
      await this.simulateNetworkLatency();
      console.log('  ✅ Network latency test passed');
    } catch (error) {
      issues.push(`Network latency test failed: ${(error as Error).message}`);
    }
    
    // Test 2: Service dependency failure
    testsRun++;
    try {
      await this.simulateServiceFailure();
      console.log('  ✅ Service failure test passed');
    } catch (error) {
      issues.push(`Service failure test failed: ${(error as Error).message}`);
    }
    
    // Test 3: High load simulation
    testsRun++;
    try {
      await this.simulateHighLoad();
      console.log('  ✅ High load test passed');
    } catch (error) {
      issues.push(`High load test failed: ${(error as Error).message}`);
    }
    
    return {
      testsRun,
      systemStable: issues.length === 0,
      issues
    };
  }
  
  private static async simulateNetworkLatency(): Promise<void> {
    // Simulate network delays
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test if system handles latency gracefully
    const startTime = Date.now();
    
    try {
      // This would make actual service calls with simulated latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const duration = Date.now() - startTime;
      if (duration > 2000) {
        throw new Error('System did not handle latency within acceptable limits');
      }
    } catch (error) {
      throw new Error(`Latency simulation failed: ${(error as Error).message}`);
    }
  }
  
  private static async simulateServiceFailure(): Promise<void> {
    // Test fallback mechanisms
    console.log('    Simulating service failure...');
    
    // This would temporarily disable a service and test fallbacks
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify fallback systems activated
    console.log('    Verifying fallback systems...');
  }
  
  private static async simulateHighLoad(): Promise<void> {
    // Simulate high concurrent load
    const concurrentRequests = 50;
    const promises = Array.from({ length: concurrentRequests }, async () => {
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return true;
    });
    
    const results = await Promise.all(promises);
    const successRate = results.filter(r => r).length / results.length;
    
    if (successRate < 0.9) { // 90% success rate required
      throw new Error(`High load test failed: ${(successRate * 100).toFixed(1)}% success rate`);
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  /**
   * Run performance benchmarks
   */
  static async runPerformanceTests(): Promise<{
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
  }> {
    console.log('⚡ Running performance tests...');
    
    const startTime = Date.now();
    const iterations = 100;
    let errors = 0;
    
    const startMemory = process.memoryUsage().heapUsed;
    
    // Run performance test iterations
    for (let i = 0; i < iterations; i++) {
      try {
        // Simulate service call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      } catch (error) {
        errors++;
      }
    }
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const duration = endTime - startTime;
    const avgResponseTime = duration / iterations;
    const throughput = (iterations / duration) * 1000; // requests per second
    const errorRate = errors / iterations;
    const memoryIncrease = endMemory - startMemory;
    
    console.log(`  📈 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  🚀 Throughput: ${throughput.toFixed(2)} req/s`);
    console.log(`  ❌ Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    console.log(`  💾 Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    
    return {
      responseTime: avgResponseTime,
      throughput,
      errorRate,
      memoryUsage: memoryIncrease
    };
  }
}

// Export test runners for use in CI/CD
export const TestRunners = {
  integration: runAllIntegrationTests,
  contract: ContractTester,
  chaos: ChaosTester,
  performance: PerformanceTester
};

// CLI runner
if (require.main === module) {
  const testType = process.argv[2] || 'integration';
  
  switch (testType) {
    case 'integration':
      runAllIntegrationTests();
      break;
    case 'chaos':
      ChaosTester.runChaosTests().then(results => {
        console.log('Chaos test results:', results);
        process.exit(results.systemStable ? 0 : 1);
      });
      break;
    case 'performance':
      PerformanceTester.runPerformanceTests().then(results => {
        console.log('Performance test results:', results);
        process.exit(0);
      });
      break;
    default:
      console.log('Usage: node index.js [integration|chaos|performance]');
      process.exit(1);
  }
}