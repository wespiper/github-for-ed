import { CircuitBreakerService } from '../services/fallback/CircuitBreakerService';

export interface HTTPClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  circuitBreakerEnabled: boolean;
  defaultHeaders: Record<string, string>;
}

export interface ServiceRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  headers: Record<string, string>;
  metadata: {
    duration: number;
    retries: number;
    circuitBreakerTripped: boolean;
    correlationId: string;
  };
}

export class HTTPServiceClient {
  private config: HTTPClientConfig;
  private circuitBreaker?: CircuitBreakerService;
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: Partial<HTTPClientConfig>, circuitBreaker?: CircuitBreakerService) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      circuitBreakerEnabled: config.circuitBreakerEnabled !== false,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'ScribeTree-ServiceClient/1.0',
        ...config.defaultHeaders
      }
    };
    this.circuitBreaker = circuitBreaker;
  }

  /**
   * Execute a service request with circuit breaker protection
   */
  async request<T = any>(request: ServiceRequest): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    let retries = 0;
    let circuitBreakerTripped = false;

    this.requestCount++;

    try {
      // Circuit breaker protection
      if (this.config.circuitBreakerEnabled && this.circuitBreaker) {
        const result = await this.circuitBreaker.execute(
          `http-${this.config.baseURL}`,
          () => this.executeRequest(request, correlationId),
          undefined // No fallback for HTTP calls
        );
        return this.createResponse(result, startTime, retries, circuitBreakerTripped, correlationId);
      }

      // Direct execution without circuit breaker
      const result = await this.executeRequestWithRetry(request, correlationId);
      retries = result.retries;
      return this.createResponse(result.data, startTime, retries, circuitBreakerTripped, correlationId);

    } catch (error) {
      this.errorCount++;
      
      if (error instanceof Error && error.message.includes('Circuit breaker')) {
        circuitBreakerTripped = true;
      }

      return this.createErrorResponse(error, startTime, retries, circuitBreakerTripped, correlationId);
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetry(
    request: ServiceRequest,
    correlationId: string
  ): Promise<{ data: any; retries: number }> {
    const maxRetries = request.retries ?? this.config.retries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const data = await this.executeRequest(request, correlationId);
        return { data, retries: attempt };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute a single HTTP request
   */
  private async executeRequest(request: ServiceRequest, correlationId: string): Promise<any> {
    const url = `${this.config.baseURL}${request.endpoint}`;
    const timeout = request.timeout ?? this.config.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = {
        ...this.config.defaultHeaders,
        ...request.headers,
        'x-correlation-id': correlationId,
        'x-request-timestamp': new Date().toISOString()
      };

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.data ? JSON.stringify(request.data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return {
        data: responseData,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Create successful response object
   */
  private createResponse<T>(
    result: any,
    startTime: number,
    retries: number,
    circuitBreakerTripped: boolean,
    correlationId: string
  ): ServiceResponse<T> {
    return {
      success: true,
      data: result.data,
      status: result.status,
      headers: result.headers || {},
      metadata: {
        duration: Date.now() - startTime,
        retries,
        circuitBreakerTripped,
        correlationId
      }
    };
  }

  /**
   * Create error response object
   */
  private createErrorResponse(
    error: any,
    startTime: number,
    retries: number,
    circuitBreakerTripped: boolean,
    correlationId: string
  ): ServiceResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0, // Unknown status for failed requests
      headers: {},
      metadata: {
        duration: Date.now() - startTime,
        retries,
        circuitBreakerTripped,
        correlationId
      }
    };
  }

  /**
   * Convenience methods for common HTTP operations
   */
  async get<T = any>(endpoint: string, options: Partial<ServiceRequest> = {}): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
      ...options
    });
  }

  async post<T = any>(endpoint: string, data: any, options: Partial<ServiceRequest> = {}): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint,
      data,
      ...options
    });
  }

  async put<T = any>(endpoint: string, data: any, options: Partial<ServiceRequest> = {}): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      endpoint,
      data,
      ...options
    });
  }

  async patch<T = any>(endpoint: string, data: any, options: Partial<ServiceRequest> = {}): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      endpoint,
      data,
      ...options
    });
  }

  async delete<T = any>(endpoint: string, options: Partial<ServiceRequest> = {}): Promise<ServiceResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      endpoint,
      ...options
    });
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<ServiceResponse<{ status: string; timestamp: string }>> {
    return this.get('/health', { timeout: 5000 });
  }

  /**
   * Get client statistics
   */
  getStats(): {
    requests: number;
    errors: number;
    errorRate: number;
    config: HTTPClientConfig;
  } {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      config: this.config
    };
  }

  /**
   * Update client configuration
   */
  updateConfig(updates: Partial<HTTPClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
  }

  /**
   * Utility methods
   */
  private generateCorrelationId(): string {
    return `http_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}