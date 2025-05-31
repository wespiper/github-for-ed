import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

interface BenchmarkResult {
  endpoint: string;
  server: 'express' | 'fastify';
  url: string;
  requests: number;
  duration: number;
  throughput: {
    average: number;
    mean: number;
    stddev: number;
  };
  latency: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p50: number;
    p75: number;
    p90: number;
    p99: number;
  };
  errors: {
    [code: string]: number;
  };
  timestamp: string;
}

interface BenchmarkConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  description: string;
}

const endpoints: BenchmarkConfig[] = [
  {
    endpoint: '/api/auth/login',
    method: 'POST',
    body: {
      email: 'test@example.com',
      password: 'testpass123'
    },
    headers: {
      'Content-Type': 'application/json'
    },
    description: 'User login endpoint'
  },
  {
    endpoint: '/api/auth/verify',
    method: 'POST',
    body: {
      token: 'test.jwt.token'
    },
    headers: {
      'Content-Type': 'application/json'
    },
    description: 'Token verification endpoint'
  },
  {
    endpoint: '/api/ai/generate',
    method: 'POST',
    body: {
      prompt: 'Generate feedback for this essay',
      type: 'feedback',
      context: {
        assignmentId: 'test-assignment-123'
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test.jwt.token'
    },
    description: 'AI content generation endpoint'
  }
];

async function runBenchmark(
  url: string, 
  config: BenchmarkConfig, 
  duration: number = 10
): Promise<BenchmarkResult> {
  const fullUrl = `${url}${config.endpoint}`;
  
  console.log(`\n🔥 Benchmarking ${config.description}`);
  console.log(`   URL: ${fullUrl}`);
  console.log(`   Method: ${config.method}`);
  console.log(`   Duration: ${duration}s`);
  
  const result = await autocannon({
    url: fullUrl,
    method: config.method,
    headers: config.headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
    duration,
    connections: 10,
    pipelining: 1,
    title: `${config.description} - ${url.includes('3001') ? 'Fastify' : 'Express'}`
  });

  const server = url.includes('3001') ? 'fastify' : 'express';
  
  return {
    endpoint: config.endpoint,
    server,
    url: fullUrl,
    requests: result.requests.total,
    duration: result.duration,
    throughput: {
      average: result.throughput.average,
      mean: result.throughput.mean,
      stddev: result.throughput.stddev
    },
    latency: {
      average: result.latency.average,
      mean: result.latency.mean,
      stddev: result.latency.stddev,
      min: result.latency.min,
      max: result.latency.max,
      p50: result.latency.p50,
      p75: result.latency.p75,
      p90: result.latency.p90,
      p99: result.latency.p99
    },
    errors: typeof result.errors === 'object' && result.errors !== null ? result.errors as Record<string, number> : {},
    timestamp: new Date().toISOString()
  };
}

async function compareEndpoints(): Promise<void> {
  const expressUrl = process.env.EXPRESS_URL || 'http://localhost:5001';
  const fastifyUrl = process.env.FASTIFY_URL || 'http://localhost:3001';
  const duration = parseInt(process.env.BENCHMARK_DURATION || '10');
  
  console.log('🚀 Starting endpoint performance comparison');
  console.log(`📊 Test duration: ${duration} seconds per endpoint`);
  console.log(`🔄 Testing ${endpoints.length} endpoints on both servers`);
  
  const results: BenchmarkResult[] = [];
  
  for (const endpoint of endpoints) {
    try {
      // Test Express
      console.log(`\n=== Testing Express server ===`);
      const expressResult = await runBenchmark(expressUrl, endpoint, duration);
      results.push(expressResult);
      
      // Test Fastify
      console.log(`\n=== Testing Fastify server ===`);
      const fastifyResult = await runBenchmark(fastifyUrl, endpoint, duration);
      results.push(fastifyResult);
      
    } catch (error) {
      console.error(`❌ Error testing ${endpoint.endpoint}:`, error);
    }
  }
  
  // Generate comparison report
  generateReport(results);
}

function generateReport(results: BenchmarkResult[]): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `results-${timestamp}.md`);
  
  let report = `# Performance Benchmark Results\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  // Group results by endpoint
  const endpointGroups = results.reduce((groups, result) => {
    if (!groups[result.endpoint]) {
      groups[result.endpoint] = [];
    }
    groups[result.endpoint].push(result);
    return groups;
  }, {} as Record<string, BenchmarkResult[]>);
  
  // Generate comparison for each endpoint
  Object.entries(endpointGroups).forEach(([endpoint, endpointResults]) => {
    const express = endpointResults.find(r => r.server === 'express');
    const fastify = endpointResults.find(r => r.server === 'fastify');
    
    if (!express || !fastify) return;
    
    const throughputImprovement = ((fastify.throughput.average - express.throughput.average) / express.throughput.average * 100);
    const latencyImprovement = ((express.latency.average - fastify.latency.average) / express.latency.average * 100);
    
    report += `## ${endpoint}\n\n`;
    report += `| Metric | Express | Fastify | Improvement |\n`;
    report += `|--------|---------|---------|-------------|\n`;
    report += `| Requests/sec | ${express.throughput.average.toFixed(2)} | ${fastify.throughput.average.toFixed(2)} | **${throughputImprovement.toFixed(1)}%** |\n`;
    report += `| Avg Latency (ms) | ${express.latency.average.toFixed(2)} | ${fastify.latency.average.toFixed(2)} | **${latencyImprovement.toFixed(1)}%** |\n`;
    report += `| P99 Latency (ms) | ${express.latency.p99.toFixed(2)} | ${fastify.latency.p99.toFixed(2)} | **${((express.latency.p99 - fastify.latency.p99) / express.latency.p99 * 100).toFixed(1)}%** |\n`;
    report += `| Total Requests | ${express.requests} | ${fastify.requests} | **${((fastify.requests - express.requests) / express.requests * 100).toFixed(1)}%** |\n\n`;
    
    // Detailed latency breakdown
    report += `### Latency Percentiles (ms)\n\n`;
    report += `| Percentile | Express | Fastify |\n`;
    report += `|------------|---------|--------|\n`;
    report += `| P50 | ${express.latency.p50.toFixed(2)} | ${fastify.latency.p50.toFixed(2)} |\n`;
    report += `| P75 | ${express.latency.p75.toFixed(2)} | ${fastify.latency.p75.toFixed(2)} |\n`;
    report += `| P90 | ${express.latency.p90.toFixed(2)} | ${fastify.latency.p90.toFixed(2)} |\n`;
    report += `| P99 | ${express.latency.p99.toFixed(2)} | ${fastify.latency.p99.toFixed(2)} |\n\n`;
  });
  
  // Overall summary
  const avgThroughputImprovement = Object.values(endpointGroups)
    .map(results => {
      const express = results.find(r => r.server === 'express');
      const fastify = results.find(r => r.server === 'fastify');
      if (!express || !fastify) return 0;
      return (fastify.throughput.average - express.throughput.average) / express.throughput.average * 100;
    })
    .reduce((sum, improvement) => sum + improvement, 0) / Object.keys(endpointGroups).length;
  
  report += `## Summary\n\n`;
  report += `- **Average throughput improvement:** ${avgThroughputImprovement.toFixed(1)}%\n`;
  report += `- **Target achievement:** ${avgThroughputImprovement >= 200 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'} (target: 200-300% improvement)\n`;
  report += `- **Total endpoints tested:** ${Object.keys(endpointGroups).length}\n`;
  report += `- **Test duration per endpoint:** ${results[0]?.duration || 'N/A'} seconds\n\n`;
  
  // Raw data
  report += `## Raw Data\n\n`;
  report += `\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n`;
  
  // Write report
  fs.writeFileSync(reportPath, report);
  console.log(`\n📊 Benchmark report generated: ${reportPath}`);
  
  // Console summary
  console.log(`\n🎯 BENCHMARK SUMMARY:`);
  console.log(`   Average throughput improvement: ${avgThroughputImprovement.toFixed(1)}%`);
  console.log(`   Target (200-300%): ${avgThroughputImprovement >= 200 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
}

// CLI interface
if (require.main === module) {
  compareEndpoints().catch(console.error);
}

export { compareEndpoints, runBenchmark, BenchmarkResult, BenchmarkConfig };