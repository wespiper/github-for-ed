import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit breaker pattern implementation for MCP services
 * Prevents cascading failures and manages fallback behavior
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Service unavailable, using fallback
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  recoveryTimeout: number;       // Time before attempting recovery (ms)
  successThreshold: number;      // Successes needed to close circuit
  timeout: number;               // Request timeout (ms)
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  
  private circuits = new Map<string, {
    state: CircuitState;
    config: CircuitBreakerConfig;
    metrics: CircuitMetrics;
  }>();

  private readonly defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,        // Open after 5 failures
    recoveryTimeout: 30000,     // Try recovery after 30 seconds
    successThreshold: 3,        // Close after 3 successes
    timeout: 10000,             // 10 second timeout
  };

  /**
   * Register a new circuit breaker for a service
   */
  registerCircuit(serviceName: string, config?: Partial<CircuitBreakerConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.circuits.set(serviceName, {
      state: CircuitState.CLOSED,
      config: finalConfig,
      metrics: {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        totalRequests: 0,
        totalFailures: 0,
      }
    });

    this.logger.log(`Circuit breaker registered for ${serviceName}`, finalConfig);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      throw new Error(`Circuit breaker not registered for service: ${serviceName}`);
    }

    circuit.metrics.totalRequests++;

    // Check circuit state
    switch (circuit.state) {
      case CircuitState.OPEN:
        if (this.shouldAttemptRecovery(circuit)) {
          circuit.state = CircuitState.HALF_OPEN;
          this.logger.log(`Circuit breaker ${serviceName} transitioning to HALF_OPEN`);
        } else {
          this.logger.warn(`Circuit breaker ${serviceName} is OPEN - using fallback`);
          return await this.executeFallback(serviceName, fallback);
        }
        break;

      case CircuitState.HALF_OPEN:
        // In half-open state, allow limited requests
        break;

      case CircuitState.CLOSED:
        // Normal operation
        break;
    }

    // Execute the operation with timeout
    try {
      const result = await this.executeWithTimeout(
        operation,
        circuit.config.timeout
      );
      
      this.recordSuccess(serviceName, circuit);
      return result;
      
    } catch (error) {
      this.recordFailure(serviceName, circuit, error);
      
      // Check if circuit is now open after recording failure
      if ((circuit as any).state === CircuitState.OPEN) {
        this.logger.warn(`Circuit breaker ${serviceName} opened - using fallback`);
        return await this.executeFallback(serviceName, fallback);
      }
      
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Execute fallback with error handling
   */
  private async executeFallback<T>(
    serviceName: string,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await fallback();
      this.logger.log(`Fallback executed successfully for ${serviceName}`);
      return result;
    } catch (fallbackError) {
      this.logger.error(`Fallback failed for ${serviceName}:`, fallbackError);
      throw new Error(`Both primary service and fallback failed for ${serviceName}`);
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(serviceName: string, circuit: any): void {
    circuit.metrics.successes++;
    circuit.metrics.lastSuccessTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.metrics.successes >= circuit.config.successThreshold) {
        circuit.state = CircuitState.CLOSED;
        circuit.metrics.failures = 0;
        circuit.metrics.successes = 0;
        this.logger.log(`Circuit breaker ${serviceName} CLOSED - service recovered`);
      }
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(serviceName: string, circuit: any, error: any): void {
    circuit.metrics.failures++;
    circuit.metrics.totalFailures++;
    circuit.metrics.lastFailureTime = Date.now();

    this.logger.error(`Circuit breaker ${serviceName} recorded failure:`, error.message);

    if (circuit.state === CircuitState.HALF_OPEN) {
      // If failure in half-open, go back to open
      circuit.state = CircuitState.OPEN;
      circuit.metrics.successes = 0;
      this.logger.warn(`Circuit breaker ${serviceName} returned to OPEN state`);
    } else if (circuit.metrics.failures >= circuit.config.failureThreshold) {
      // Open the circuit
      circuit.state = CircuitState.OPEN;
      this.logger.error(`Circuit breaker ${serviceName} OPENED - failure threshold exceeded`);
    }
  }

  /**
   * Check if we should attempt recovery
   */
  private shouldAttemptRecovery(circuit: any): boolean {
    const timeSinceLastFailure = Date.now() - circuit.metrics.lastFailureTime;
    return timeSinceLastFailure >= circuit.config.recoveryTimeout;
  }

  /**
   * Get circuit status for monitoring
   */
  getCircuitStatus(serviceName: string): any {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      return null;
    }

    return {
      serviceName,
      state: circuit.state,
      metrics: {
        ...circuit.metrics,
        failureRate: circuit.metrics.totalRequests > 0 
          ? (circuit.metrics.totalFailures / circuit.metrics.totalRequests) * 100 
          : 0,
        currentFailures: circuit.metrics.failures,
        currentSuccesses: circuit.metrics.successes,
      },
      config: circuit.config,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Get status of all circuits
   */
  getAllCircuitsStatus(): any[] {
    return Array.from(this.circuits.keys()).map(serviceName => 
      this.getCircuitStatus(serviceName)
    );
  }

  /**
   * Manually reset a circuit breaker
   */
  resetCircuit(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      return false;
    }

    circuit.state = CircuitState.CLOSED;
    circuit.metrics.failures = 0;
    circuit.metrics.successes = 0;
    
    this.logger.log(`Circuit breaker ${serviceName} manually reset`);
    return true;
  }

  /**
   * Force circuit open (for maintenance)
   */
  forceOpen(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (!circuit) {
      return false;
    }

    circuit.state = CircuitState.OPEN;
    this.logger.log(`Circuit breaker ${serviceName} manually opened`);
    return true;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    totalCircuits: number;
    openCircuits: number;
    closedCircuits: number;
    halfOpenCircuits: number;
    totalRequests: number;
    totalFailures: number;
    overallFailureRate: number;
  } {
    const circuits = Array.from(this.circuits.values());
    const totalRequests = circuits.reduce((sum, c) => sum + c.metrics.totalRequests, 0);
    const totalFailures = circuits.reduce((sum, c) => sum + c.metrics.totalFailures, 0);

    return {
      totalCircuits: circuits.length,
      openCircuits: circuits.filter(c => c.state === CircuitState.OPEN).length,
      closedCircuits: circuits.filter(c => c.state === CircuitState.CLOSED).length,
      halfOpenCircuits: circuits.filter(c => c.state === CircuitState.HALF_OPEN).length,
      totalRequests,
      totalFailures,
      overallFailureRate: totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0
    };
  }
}