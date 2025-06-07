import { performance } from 'perf_hooks';

/**
 * Optimized differential privacy implementation with <10ms overhead
 * 
 * Performance targets:
 * - Noise generation: <5ms per operation
 * - Privacy budget tracking: <2ms per query
 * - Query sensitivity: <3ms calculation
 * - Result caching: 95% hit rate for repeated queries
 */
export class DifferentialPrivacyOptimizer {
  // Pre-computed noise distributions for common epsilon values
  private static noiseCache = new Map<string, number[]>();
  private static sensitivityCache = new Map<string, number>();
  
  // Privacy budget tracking
  private privacyBudgets = new Map<string, PrivacyBudget>();
  private budgetThresholds = {
    warning: 0.8,    // Warn at 80% budget consumption
    block: 1.0       // Block at 100% budget consumption
  };
  
  // Performance statistics
  private stats = {
    noiseGenerations: 0,
    budgetChecks: 0,
    cacheHits: 0,
    averageNoiseTime: 0,
    averageBudgetTime: 0
  };

  constructor(private defaultEpsilon: number = 1.0, private defaultDelta: number = 1e-5) {
    this.precomputeCommonNoiseDistributions();
  }

  /**
   * Pre-compute noise distributions for common epsilon values
   */
  private precomputeCommonNoiseDistributions(): void {
    const commonEpsilons = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0];
    
    for (const epsilon of commonEpsilons) {
      const noiseValues = this.generateLaplaceNoiseBatch(epsilon, 1000);
      DifferentialPrivacyOptimizer.noiseCache.set(`laplace:${epsilon}`, noiseValues);
    }
  }

  /**
   * Optimized Laplace noise generation
   */
  generateLaplaceNoise(epsilon: number, sensitivity: number = 1): number {
    const start = performance.now();
    
    try {
      // Try to use pre-computed noise if available
      const cacheKey = `laplace:${epsilon}`;
      const cachedNoise = DifferentialPrivacyOptimizer.noiseCache.get(cacheKey);
      
      if (cachedNoise && cachedNoise.length > 0) {
        this.stats.cacheHits++;
        // Remove and return a random noise value from the cache
        const randomIndex = Math.floor(Math.random() * cachedNoise.length);
        const noise = cachedNoise.splice(randomIndex, 1)[0];
        return noise * sensitivity;
      }

      // Generate fresh noise using optimized algorithm
      const scale = sensitivity / epsilon;
      const noise = this.fastLaplaceNoise(scale);
      
      this.stats.noiseGenerations++;
      return noise;
      
    } finally {
      const duration = performance.now() - start;
      this.updateAverageNoiseTime(duration);
    }
  }

  /**
   * Fast Laplace noise generation using inverse CDF
   */
  private fastLaplaceNoise(scale: number): number {
    // Use inverse CDF for fast Laplace noise generation
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Generate batch of Laplace noise values for caching
   */
  private generateLaplaceNoiseBatch(epsilon: number, count: number): number[] {
    const scale = 1 / epsilon; // Assuming sensitivity = 1 for caching
    const noise: number[] = [];
    
    for (let i = 0; i < count; i++) {
      noise.push(this.fastLaplaceNoise(scale));
    }
    
    return noise;
  }

  /**
   * Optimized Gaussian noise generation for (ε, δ)-differential privacy
   */
  generateGaussianNoise(epsilon: number, delta: number, sensitivity: number = 1): number {
    // Calculate optimal noise scale for Gaussian mechanism
    const c = Math.sqrt(2 * Math.log(1.25 / delta));
    const sigma = c * sensitivity / epsilon;
    
    // Use Box-Muller transform for Gaussian noise
    return this.fastGaussianNoise() * sigma;
  }

  /**
   * Fast Gaussian noise using Box-Muller transform
   */
  private fastGaussianNoise(): number {
    // Box-Muller transform for standard normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Efficient privacy budget tracking
   */
  trackPrivacyBudget(
    entityId: string, 
    epsilon: number, 
    delta: number = this.defaultDelta
  ): PrivacyBudgetResult {
    const start = performance.now();
    
    try {
      const budget = this.privacyBudgets.get(entityId) || {
        totalEpsilon: 0,
        totalDelta: 0,
        queries: 0,
        lastAccess: Date.now(),
        dailyReset: this.getNextDailyReset()
      };

      // Check if budget needs daily reset
      if (Date.now() > budget.dailyReset) {
        budget.totalEpsilon = 0;
        budget.totalDelta = 0;
        budget.queries = 0;
        budget.dailyReset = this.getNextDailyReset();
      }

      // Calculate new budget consumption
      const newEpsilon = budget.totalEpsilon + epsilon;
      const newDelta = budget.totalDelta + delta;

      // Check budget limits
      const result: PrivacyBudgetResult = {
        allowed: newEpsilon <= this.budgetThresholds.block,
        remainingEpsilon: Math.max(0, this.budgetThresholds.block - newEpsilon),
        remainingDelta: Math.max(0, this.budgetThresholds.block - newDelta),
        warning: newEpsilon >= this.budgetThresholds.warning,
        consumedEpsilon: newEpsilon,
        consumedDelta: newDelta
      };

      // Update budget if allowed
      if (result.allowed) {
        budget.totalEpsilon = newEpsilon;
        budget.totalDelta = newDelta;
        budget.queries++;
        budget.lastAccess = Date.now();
        this.privacyBudgets.set(entityId, budget);
      }

      this.stats.budgetChecks++;
      return result;
      
    } finally {
      const duration = performance.now() - start;
      this.updateAverageBudgetTime(duration);
    }
  }

  /**
   * Optimized query sensitivity calculation
   */
  calculateQuerySensitivity(queryType: QueryType, parameters: QueryParameters): number {
    const start = performance.now();
    
    const cacheKey = `${queryType}:${JSON.stringify(parameters)}`;
    const cached = DifferentialPrivacyOptimizer.sensitivityCache.get(cacheKey);
    
    if (cached !== undefined) {
      return cached;
    }

    let sensitivity: number;
    
    switch (queryType) {
      case QueryType.COUNT:
        sensitivity = 1; // Adding/removing one record changes count by 1
        break;
      
      case QueryType.SUM:
        sensitivity = parameters.maxValue || 100; // Maximum contribution per individual
        break;
      
      case QueryType.AVERAGE:
        const n = parameters.datasetSize || 1000;
        const range = parameters.maxValue || 100;
        sensitivity = range / n; // Sensitivity of average
        break;
      
      case QueryType.HISTOGRAM:
        sensitivity = 1; // Adding/removing one record affects one bin
        break;
      
      case QueryType.QUANTILE:
        sensitivity = parameters.maxValue || 100; // Worst-case sensitivity
        break;
      
      default:
        sensitivity = 1; // Conservative default
    }

    // Cache the result
    DifferentialPrivacyOptimizer.sensitivityCache.set(cacheKey, sensitivity);
    
    const duration = performance.now() - start;
    console.log(`Sensitivity calculation: ${duration.toFixed(2)}ms`);
    
    return sensitivity;
  }

  /**
   * Apply differential privacy to query result
   */
  applyDifferentialPrivacy(
    queryResult: number | number[],
    queryType: QueryType,
    parameters: QueryParameters,
    epsilon: number = this.defaultEpsilon,
    delta: number = this.defaultDelta
  ): DifferentialPrivacyResult {
    const start = performance.now();
    
    // Calculate sensitivity
    const sensitivity = this.calculateQuerySensitivity(queryType, parameters);
    
    // Check privacy budget
    const entityId = parameters.entityId || 'global';
    const budgetResult = this.trackPrivacyBudget(entityId, epsilon, delta);
    
    if (!budgetResult.allowed) {
      throw new Error(`Privacy budget exceeded for entity ${entityId}`);
    }

    let noisyResult: number | number[];
    
    if (Array.isArray(queryResult)) {
      // Apply noise to each element (for histograms, etc.)
      noisyResult = queryResult.map(value => 
        value + this.generateLaplaceNoise(epsilon, sensitivity)
      );
    } else {
      // Apply noise to single value
      const noise = this.generateLaplaceNoise(epsilon, sensitivity);
      noisyResult = queryResult + noise;
    }

    const duration = performance.now() - start;
    
    return {
      result: noisyResult,
      epsilon,
      delta,
      sensitivity,
      noiseAdded: true,
      processingTime: duration,
      budgetRemaining: budgetResult.remainingEpsilon,
      privacyGuarantee: `(${epsilon}, ${delta})-differential privacy`
    };
  }

  /**
   * Batch differential privacy operations for efficiency
   */
  applyBatchDifferentialPrivacy(
    operations: DifferentialPrivacyOperation[]
  ): DifferentialPrivacyResult[] {
    return operations.map(op => 
      this.applyDifferentialPrivacy(
        op.queryResult,
        op.queryType,
        op.parameters,
        op.epsilon,
        op.delta
      )
    );
  }

  /**
   * Get next daily reset timestamp
   */
  private getNextDailyReset(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Update average noise generation time
   */
  private updateAverageNoiseTime(duration: number): void {
    this.stats.averageNoiseTime = 
      (this.stats.averageNoiseTime * (this.stats.noiseGenerations - 1) + duration) / 
      this.stats.noiseGenerations;
  }

  /**
   * Update average budget check time
   */
  private updateAverageBudgetTime(duration: number): void {
    this.stats.averageBudgetTime = 
      (this.stats.averageBudgetTime * (this.stats.budgetChecks - 1) + duration) / 
      this.stats.budgetChecks;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): DifferentialPrivacyStats {
    return {
      ...this.stats,
      cacheHitRate: this.stats.noiseGenerations > 0 ? 
        (this.stats.cacheHits / this.stats.noiseGenerations) * 100 : 0,
      cacheSizes: {
        noise: DifferentialPrivacyOptimizer.noiseCache.size,
        sensitivity: DifferentialPrivacyOptimizer.sensitivityCache.size
      },
      activeBudgets: this.privacyBudgets.size
    };
  }

  /**
   * Clear all caches and reset statistics
   */
  reset(): void {
    DifferentialPrivacyOptimizer.noiseCache.clear();
    DifferentialPrivacyOptimizer.sensitivityCache.clear();
    this.privacyBudgets.clear();
    
    this.stats = {
      noiseGenerations: 0,
      budgetChecks: 0,
      cacheHits: 0,
      averageNoiseTime: 0,
      averageBudgetTime: 0
    };
  }
}

export enum QueryType {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  HISTOGRAM = 'histogram',
  QUANTILE = 'quantile'
}

interface QueryParameters {
  datasetSize?: number;
  maxValue?: number;
  minValue?: number;
  entityId?: string;
  [key: string]: any;
}

interface PrivacyBudget {
  totalEpsilon: number;
  totalDelta: number;
  queries: number;
  lastAccess: number;
  dailyReset: number;
}

interface PrivacyBudgetResult {
  allowed: boolean;
  remainingEpsilon: number;
  remainingDelta: number;
  warning: boolean;
  consumedEpsilon: number;
  consumedDelta: number;
}

interface DifferentialPrivacyResult {
  result: number | number[];
  epsilon: number;
  delta: number;
  sensitivity: number;
  noiseAdded: boolean;
  processingTime: number;
  budgetRemaining: number;
  privacyGuarantee: string;
}

interface DifferentialPrivacyOperation {
  queryResult: number | number[];
  queryType: QueryType;
  parameters: QueryParameters;
  epsilon?: number;
  delta?: number;
}

interface DifferentialPrivacyStats {
  noiseGenerations: number;
  budgetChecks: number;
  cacheHits: number;
  averageNoiseTime: number;
  averageBudgetTime: number;
  cacheHitRate: number;
  cacheSizes: {
    noise: number;
    sensitivity: number;
  };
  activeBudgets: number;
}