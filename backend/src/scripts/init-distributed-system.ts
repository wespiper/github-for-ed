#!/usr/bin/env ts-node

/**
 * Distributed System Initialization Script
 * 
 * This script initializes the complete distributed services architecture
 * for the Scribe Tree educational platform, including:
 * 
 * - Service Registry and Discovery
 * - API Gateway with MCP routing
 * - Distributed Monitoring and Tracing
 * - Service Orchestration
 * - Circuit Breaker Protection
 * - Configuration Management
 * 
 * Run with: npm run init-distributed-system
 */

import { DistributedServicesManager } from '../services/integration/DistributedServicesManager';
import fastify from 'fastify';

interface SystemInitOptions {
  port?: number;
  host?: string;
  environment?: 'development' | 'staging' | 'production';
  enableGateway?: boolean;
  enableMonitoring?: boolean;
  enableOrchestration?: boolean;
  verbose?: boolean;
}

async function initializeDistributedSystem(options: SystemInitOptions = {}) {
  const {
    port = 3000,
    host = '0.0.0.0',
    environment = 'development',
    enableGateway = true,
    enableMonitoring = true,
    enableOrchestration = true,
    verbose = false
  } = options;

  console.log('🚀 Initializing Scribe Tree Distributed Services System...\n');

  try {
    // Create Fastify instance for API Gateway
    const app = fastify({
      logger: verbose ? {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true
          }
        }
      } : false
    });

    // Initialize distributed services manager
    const servicesManager = new DistributedServicesManager(enableGateway ? app : undefined, {
      gateway: {
        enabled: enableGateway,
        port,
        host
      },
      monitoring: {
        enabled: enableMonitoring,
        metricsInterval: environment === 'development' ? 10000 : 30000, // 10s dev, 30s prod
        tracingEnabled: true
      },
      orchestration: {
        enabled: enableOrchestration,
        maxConcurrentWorkflows: environment === 'production' ? 20 : 10
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: environment === 'production' ? 3 : 5,
        recoveryTimeout: 30000
      }
    });

    // Initialize the system
    console.log('📦 Initializing services...');
    await servicesManager.initialize();

    // Setup graceful shutdown
    setupGracefulShutdown(servicesManager, app);

    // Setup event monitoring
    setupEventMonitoring(servicesManager, verbose);

    // Start API Gateway if enabled
    if (enableGateway) {
      console.log(`🌐 Starting API Gateway on http://${host}:${port}...`);
      await app.listen({ port, host });
    }

    // Display system status
    await displaySystemStatus(servicesManager);

    // Setup health monitoring
    if (enableMonitoring) {
      setupHealthMonitoring(servicesManager);
    }

    console.log('✅ Distributed services system initialized successfully!\n');

    if (enableGateway) {
      console.log(`🔗 API Gateway: http://${host}:${port}`);
      console.log(`📊 Health Check: http://${host}:${port}/gateway/health`);
      console.log(`📈 Metrics: http://${host}:${port}/gateway/metrics`);
      console.log(`🔍 Services: http://${host}:${port}/gateway/services`);
    }

    console.log('\n🎯 System ready for educational AI workloads!');

    return servicesManager;

  } catch (error) {
    console.error('❌ Failed to initialize distributed system:', error);
    process.exit(1);
  }
}

function setupGracefulShutdown(servicesManager: DistributedServicesManager, app: any) {
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // Shutdown services manager
      await servicesManager.shutdown();
      
      // Close Fastify if running
      if (app.server && app.server.listening) {
        await app.close();
      }
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

function setupEventMonitoring(servicesManager: DistributedServicesManager, verbose: boolean) {
  servicesManager.on('systemInitialized', () => {
    console.log('📡 System initialization complete');
  });

  servicesManager.on('serviceRegistered', (service) => {
    console.log(`✅ Service registered: ${service.name} (${service.type})`);
  });

  servicesManager.on('serviceHealthChanged', (service, previousStatus) => {
    const statusIcon = service.metadata.status === 'healthy' ? '💚' : 
                      service.metadata.status === 'degraded' ? '🟡' : '🔴';
    console.log(`${statusIcon} Service health changed: ${service.name} ${previousStatus} → ${service.metadata.status}`);
  });

  servicesManager.on('workflowCompleted', (execution) => {
    console.log(`🎯 Workflow completed: ${execution.workflowId} (${execution.id})`);
  });

  servicesManager.on('workflowFailed', (execution, error) => {
    console.error(`❌ Workflow failed: ${execution.workflowId} (${execution.id}):`, error.message);
  });

  if (verbose) {
    servicesManager.on('metricRecorded', (metric) => {
      console.log(`📊 Metric: ${metric.serviceName}.${metric.metricName} = ${metric.value}`);
    });
  }
}

async function displaySystemStatus(servicesManager: DistributedServicesManager) {
  console.log('\n📊 System Status:');
  console.log('=' .repeat(50));

  const health = servicesManager.getSystemHealth();
  const metrics = servicesManager.getSystemMetrics();

  // Overall health
  const healthIcon = health.status === 'healthy' ? '💚' : 
                    health.status === 'degraded' ? '🟡' : '🔴';
  console.log(`${healthIcon} Overall Status: ${health.status.toUpperCase()}`);
  console.log(`🏢 Services: ${health.services} total (${health.healthyServices} healthy, ${health.degradedServices} degraded, ${health.unhealthyServices} unhealthy)`);
  console.log(`⏱️  Uptime: ${Math.round(health.uptime / 1000)}s`);

  // Component status
  console.log('\n🔧 Components:');
  Object.entries(health.components).forEach(([component, status]) => {
    const icon = status === 'healthy' ? '✅' : status === 'disabled' ? '⚫' : '❌';
    console.log(`  ${icon} ${component}: ${status}`);
  });

  // Service overview
  if (metrics.services.length > 0) {
    console.log('\n🧪 Services:');
    metrics.services.forEach(service => {
      const icon = service.status === 'healthy' ? '💚' : 
                  service.status === 'degraded' ? '🟡' : '🔴';
      console.log(`  ${icon} ${service.serviceName}: ${service.status} (${service.responseTime}ms)`);
    });
  }

  // Metrics summary
  console.log('\n📈 Metrics Summary:');
  console.log(`  📡 Total Requests: ${metrics.overview.totalRequests}`);
  console.log(`  ⚡ Avg Response Time: ${Math.round(metrics.overview.avgResponseTime)}ms`);
  console.log(`  💔 Error Rate: ${(metrics.overview.errorRate * 100).toFixed(2)}%`);

  // Circuit breaker status
  console.log('\n🔒 Circuit Breakers:');
  console.log(`  🔒 Total: ${metrics.circuitBreaker.totalCircuits}`);
  console.log(`  ✅ Closed: ${metrics.circuitBreaker.closedCircuits}`);
  console.log(`  🟡 Half-Open: ${metrics.circuitBreaker.halfOpenCircuits}`);
  console.log(`  🔴 Open: ${metrics.circuitBreaker.openCircuits}`);

  console.log('=' .repeat(50));
}

function setupHealthMonitoring(servicesManager: DistributedServicesManager) {
  // Periodic health reports
  setInterval(() => {
    const health = servicesManager.getSystemHealth();
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  System health is UNHEALTHY - check services!');
    } else if (health.status === 'degraded') {
      console.info('🟡 System health is DEGRADED - some services may be slow');
    }
  }, 60000); // Check every minute

  // Alert on service failures
  servicesManager.on('serviceHealthChanged', (service) => {
    if (service.metadata.status === 'unhealthy') {
      console.error(`🚨 ALERT: Service ${service.name} is UNHEALTHY!`);
    }
  });
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SystemInitOptions = {};

  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--no-gateway':
        options.enableGateway = false;
        break;
      case '--no-monitoring':
        options.enableMonitoring = false;
        break;
      case '--no-orchestration':
        options.enableOrchestration = false;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--production':
        options.environment = 'production';
        break;
      case '--staging':
        options.environment = 'staging';
        break;
      default:
        if (arg.startsWith('--port=')) {
          options.port = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--host=')) {
          options.host = arg.split('=')[1];
        }
    }
  });

  // Display startup banner
  console.log('');
  console.log('🌟 Scribe Tree - Distributed Services Platform');
  console.log('   Transform writing education with responsible AI');
  console.log('');

  initializeDistributedSystem(options).catch(error => {
    console.error('Failed to start system:', error);
    process.exit(1);
  });
}

export { initializeDistributedSystem };