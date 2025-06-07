import { Injectable, Logger } from '@nestjs/common';

/**
 * Feature Flag Service for graceful degradation and A/B testing
 * Controls MCP integration and fallback behavior
 */

export interface FeatureFlags {
  // MCP Integration Flags
  MCP_WRITING_ANALYSIS_ENABLED: boolean;
  MCP_REFLECTION_ANALYSIS_ENABLED: boolean;
  MCP_CONTENT_CLASSIFICATION_ENABLED: boolean;
  MCP_AI_BOUNDARIES_ENABLED: boolean;
  MCP_AUDIT_TRAILS_ENABLED: boolean;
  
  // Fallback Strategy Flags
  ALLOW_FALLBACK_SERVICES: boolean;
  REQUIRE_MCP_FOR_INSIGHTS: boolean;
  STRICT_PRIVACY_MODE: boolean;
  
  // Circuit Breaker Configuration
  CIRCUIT_BREAKER_ENABLED: boolean;
  AGGRESSIVE_FALLBACK: boolean;
  
  // Development and Testing
  DEBUG_MCP_COMMUNICATION: boolean;
  MOCK_MCP_RESPONSES: boolean;
  LOG_FALLBACK_USAGE: boolean;
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  
  private flags: FeatureFlags;
  
  constructor() {
    this.flags = this.initializeFlags();
    this.logger.log('Feature flags initialized', this.getActiveFlagsSummary());
  }

  /**
   * Initialize feature flags from environment variables with defaults
   */
  private initializeFlags(): FeatureFlags {
    return {
      // MCP Integration - Default to enabled but can be disabled
      MCP_WRITING_ANALYSIS_ENABLED: this.getEnvFlag('MCP_WRITING_ANALYSIS_ENABLED', true),
      MCP_REFLECTION_ANALYSIS_ENABLED: this.getEnvFlag('MCP_REFLECTION_ANALYSIS_ENABLED', true),
      MCP_CONTENT_CLASSIFICATION_ENABLED: this.getEnvFlag('MCP_CONTENT_CLASSIFICATION_ENABLED', true),
      MCP_AI_BOUNDARIES_ENABLED: this.getEnvFlag('MCP_AI_BOUNDARIES_ENABLED', true),
      MCP_AUDIT_TRAILS_ENABLED: this.getEnvFlag('MCP_AUDIT_TRAILS_ENABLED', true),
      
      // Fallback Strategy - Default to allowing fallbacks
      ALLOW_FALLBACK_SERVICES: this.getEnvFlag('ALLOW_FALLBACK_SERVICES', true),
      REQUIRE_MCP_FOR_INSIGHTS: this.getEnvFlag('REQUIRE_MCP_FOR_INSIGHTS', false),
      STRICT_PRIVACY_MODE: this.getEnvFlag('STRICT_PRIVACY_MODE', false),
      
      // Circuit Breaker - Default enabled for resilience
      CIRCUIT_BREAKER_ENABLED: this.getEnvFlag('CIRCUIT_BREAKER_ENABLED', true),
      AGGRESSIVE_FALLBACK: this.getEnvFlag('AGGRESSIVE_FALLBACK', false),
      
      // Development - Default to minimal logging
      DEBUG_MCP_COMMUNICATION: this.getEnvFlag('DEBUG_MCP_COMMUNICATION', false),
      MOCK_MCP_RESPONSES: this.getEnvFlag('MOCK_MCP_RESPONSES', false),
      LOG_FALLBACK_USAGE: this.getEnvFlag('LOG_FALLBACK_USAGE', true),
    };
  }

  /**
   * Get boolean flag from environment with default
   */
  private getEnvFlag(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Check if a specific feature is enabled
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Enable a feature flag
   */
  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
    this.logger.log(`Feature flag enabled: ${flag}`);
  }

  /**
   * Disable a feature flag
   */
  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
    this.logger.log(`Feature flag disabled: ${flag}`);
  }

  /**
   * Set multiple flags at once
   */
  setFlags(flagUpdates: Partial<FeatureFlags>): void {
    Object.entries(flagUpdates).forEach(([key, value]) => {
      this.flags[key as keyof FeatureFlags] = value as boolean;
    });
    this.logger.log('Feature flags updated', flagUpdates);
  }

  /**
   * Get all current flag values
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get a summary of active flags for logging
   */
  getActiveFlagsSummary(): any {
    const activeFlags = Object.entries(this.flags)
      .filter(([_, enabled]) => enabled)
      .map(([flag]) => flag);
    
    return {
      totalFlags: Object.keys(this.flags).length,
      enabledFlags: activeFlags.length,
      mcpIntegrationActive: this.isMCPIntegrationActive(),
      fallbackAvailable: this.flags.ALLOW_FALLBACK_SERVICES,
      circuitBreakerEnabled: this.flags.CIRCUIT_BREAKER_ENABLED,
    };
  }

  /**
   * Check if MCP integration is generally active
   */
  isMCPIntegrationActive(): boolean {
    return this.flags.MCP_WRITING_ANALYSIS_ENABLED ||
           this.flags.MCP_REFLECTION_ANALYSIS_ENABLED ||
           this.flags.MCP_CONTENT_CLASSIFICATION_ENABLED ||
           this.flags.MCP_AI_BOUNDARIES_ENABLED ||
           this.flags.MCP_AUDIT_TRAILS_ENABLED;
  }

  /**
   * Get strategy for handling MCP failures
   */
  getMCPFailureStrategy(): {
    useFallback: boolean;
    failFast: boolean;
    requireMCP: boolean;
    logUsage: boolean;
  } {
    return {
      useFallback: this.flags.ALLOW_FALLBACK_SERVICES,
      failFast: this.flags.AGGRESSIVE_FALLBACK,
      requireMCP: this.flags.REQUIRE_MCP_FOR_INSIGHTS,
      logUsage: this.flags.LOG_FALLBACK_USAGE,
    };
  }

  /**
   * Emergency mode - disable all MCP, enable all fallbacks
   */
  enableEmergencyMode(): void {
    this.setFlags({
      // Disable all MCP features
      MCP_WRITING_ANALYSIS_ENABLED: false,
      MCP_REFLECTION_ANALYSIS_ENABLED: false,
      MCP_CONTENT_CLASSIFICATION_ENABLED: false,
      MCP_AI_BOUNDARIES_ENABLED: false,
      MCP_AUDIT_TRAILS_ENABLED: false,
      
      // Enable fallbacks and safety measures
      ALLOW_FALLBACK_SERVICES: true,
      REQUIRE_MCP_FOR_INSIGHTS: false,
      STRICT_PRIVACY_MODE: true,
      
      // Enable aggressive fallback
      CIRCUIT_BREAKER_ENABLED: true,
      AGGRESSIVE_FALLBACK: true,
      
      // Enable logging for debugging
      LOG_FALLBACK_USAGE: true,
    });
    
    this.logger.error('EMERGENCY MODE ACTIVATED - All MCP features disabled, fallbacks enabled');
  }

  /**
   * Production ready mode - safe defaults for production
   */
  enableProductionMode(): void {
    this.setFlags({
      // Enable MCP with caution
      MCP_WRITING_ANALYSIS_ENABLED: true,
      MCP_REFLECTION_ANALYSIS_ENABLED: true,
      MCP_CONTENT_CLASSIFICATION_ENABLED: true,
      MCP_AI_BOUNDARIES_ENABLED: true,
      MCP_AUDIT_TRAILS_ENABLED: true,
      
      // Safe fallback strategy
      ALLOW_FALLBACK_SERVICES: true,
      REQUIRE_MCP_FOR_INSIGHTS: false,
      STRICT_PRIVACY_MODE: true,
      
      // Production circuit breaker settings
      CIRCUIT_BREAKER_ENABLED: true,
      AGGRESSIVE_FALLBACK: false,
      
      // Minimal debug logging
      DEBUG_MCP_COMMUNICATION: false,
      MOCK_MCP_RESPONSES: false,
      LOG_FALLBACK_USAGE: true,
    });
    
    this.logger.log('Production mode enabled - Safe MCP integration with fallbacks');
  }

  /**
   * Development mode - enable debugging and testing features
   */
  enableDevelopmentMode(): void {
    this.setFlags({
      // Enable all MCP features for testing
      MCP_WRITING_ANALYSIS_ENABLED: true,
      MCP_REFLECTION_ANALYSIS_ENABLED: true,
      MCP_CONTENT_CLASSIFICATION_ENABLED: true,
      MCP_AI_BOUNDARIES_ENABLED: true,
      MCP_AUDIT_TRAILS_ENABLED: true,
      
      // Flexible fallback for development
      ALLOW_FALLBACK_SERVICES: true,
      REQUIRE_MCP_FOR_INSIGHTS: false,
      STRICT_PRIVACY_MODE: false,
      
      // Development settings
      CIRCUIT_BREAKER_ENABLED: true,
      AGGRESSIVE_FALLBACK: false,
      
      // Enable debugging
      DEBUG_MCP_COMMUNICATION: true,
      MOCK_MCP_RESPONSES: false,
      LOG_FALLBACK_USAGE: true,
    });
    
    this.logger.log('Development mode enabled - Full MCP integration with debugging');
  }

  /**
   * Check if should use MCP for a specific operation
   */
  shouldUseMCP(operation: 'writing_analysis' | 'reflection_analysis' | 'content_classification' | 'ai_boundaries' | 'audit_trails'): boolean {
    switch (operation) {
      case 'writing_analysis':
        return this.flags.MCP_WRITING_ANALYSIS_ENABLED;
      case 'reflection_analysis':
        return this.flags.MCP_REFLECTION_ANALYSIS_ENABLED;
      case 'content_classification':
        return this.flags.MCP_CONTENT_CLASSIFICATION_ENABLED;
      case 'ai_boundaries':
        return this.flags.MCP_AI_BOUNDARIES_ENABLED;
      case 'audit_trails':
        return this.flags.MCP_AUDIT_TRAILS_ENABLED;
      default:
        return false;
    }
  }

  /**
   * Get feature flag configuration for client
   */
  getClientConfig(): {
    mcpEnabled: boolean;
    fallbackAvailable: boolean;
    features: string[];
  } {
    const enabledFeatures = [];
    
    if (this.flags.MCP_WRITING_ANALYSIS_ENABLED) enabledFeatures.push('writing_analysis');
    if (this.flags.MCP_REFLECTION_ANALYSIS_ENABLED) enabledFeatures.push('reflection_analysis');
    if (this.flags.MCP_CONTENT_CLASSIFICATION_ENABLED) enabledFeatures.push('content_classification');
    if (this.flags.MCP_AI_BOUNDARIES_ENABLED) enabledFeatures.push('ai_boundaries');
    
    return {
      mcpEnabled: this.isMCPIntegrationActive(),
      fallbackAvailable: this.flags.ALLOW_FALLBACK_SERVICES,
      features: enabledFeatures,
    };
  }
}