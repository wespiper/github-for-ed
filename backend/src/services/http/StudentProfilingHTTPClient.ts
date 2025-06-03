import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';

export interface StudentProfilingHTTPConfig {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
}

export interface HTTPResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class StudentProfilingHTTPClient {
  private client: AxiosInstance;
  private readonly logger = new Logger(StudentProfilingHTTPClient.name);
  private connected = false;

  constructor(private config: StudentProfilingHTTPConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('HTTP request failed:', error.message);
        throw error;
      }
    );
  }

  async connect(): Promise<void> {
    try {
      // Test connection with health check
      await this.client.get('/student-profiles/health');
      this.connected = true;
      this.logger.log('Connected to Student Profiling HTTP API');
    } catch (error) {
      this.logger.error('Failed to connect to Student Profiling HTTP API:', error.message);
      // Don't throw - allow graceful degradation
      this.logger.warn('Student Profiling HTTP API unavailable, features may be limited');
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.logger.log('Disconnected from Student Profiling HTTP API');
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<HTTPResponse<T>> {
    try {
      let response: AxiosResponse;

      switch (method) {
        case 'GET':
          response = await this.client.get(endpoint);
          break;
        case 'POST':
          response = await this.client.post(endpoint, data);
          break;
        case 'PUT':
          response = await this.client.put(endpoint, data);
          break;
        case 'DELETE':
          response = await this.client.delete(endpoint);
          break;
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      this.logger.error(`HTTP ${method} ${endpoint} failed:`, error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Build student profile via HTTP API
   */
  async buildStudentProfile(
    studentId: string,
    requesterContext: {
      userId: string;
      role: 'student' | 'teacher' | 'parent' | 'admin';
      purpose: string;
    },
    includePrivateData: boolean = false
  ): Promise<HTTPResponse<any>> {
    return this.request('POST', '/student-profiles/build', {
      studentId,
      requesterContext,
      includePrivateData
    });
  }

  /**
   * Update student privacy choices via HTTP API
   */
  async updatePrivacyChoices(
    studentId: string,
    choices: any
  ): Promise<HTTPResponse<any>> {
    return this.request('PUT', `/student-profiles/${studentId}/privacy-choices`, choices);
  }

  /**
   * Generate privacy-preserving analytics via HTTP API
   */
  async generatePrivacyPreservingAnalytics(
    cohortIds: string[],
    metrics: string[],
    epsilon?: number,
    delta?: number
  ): Promise<HTTPResponse<any>> {
    return this.request('POST', '/student-profiles/analytics/privacy-preserving', {
      cohortIds,
      metrics,
      epsilon,
      delta
    });
  }

  /**
   * Validate data access request via HTTP API
   */
  async validateDataAccessRequest(accessRequest: {
    requesterId: string;
    requesterType: 'teacher' | 'peer' | 'platform' | 'researcher';
    studentId: string;
    purpose: string;
    dataTypes: string[];
    studentBenefit?: string;
  }): Promise<HTTPResponse<any>> {
    return this.request('POST', '/student-profiles/access-validation', accessRequest);
  }

  /**
   * Get student privacy dashboard via HTTP API
   */
  async getPrivacyDashboard(
    studentId: string,
    includeRecommendations: boolean = true,
    timeRange: string = 'month'
  ): Promise<HTTPResponse<any>> {
    return this.request('GET', 
      `/student-profiles/${studentId}/privacy-dashboard?includeRecommendations=${includeRecommendations}&timeRange=${timeRange}`
    );
  }

  /**
   * Track learning trajectory via HTTP API
   */
  async trackLearningTrajectory(
    studentId: string,
    milestone: {
      skill: string;
      level: number;
      evidence?: string[];
    },
    privacyLevel: 'full' | 'anonymized' | 'aggregate' = 'anonymized'
  ): Promise<HTTPResponse<any>> {
    return this.request('POST', `/student-profiles/${studentId}/learning-trajectory`, {
      milestone,
      privacyLevel
    });
  }

  /**
   * Create skill assessment via HTTP API
   */
  async assessSkillDevelopment(
    studentId: string,
    skills: Array<{
      skillName: string;
      currentLevel: number;
      targetLevel: number;
      progress: number;
    }>,
    sharedWith: string[] = []
  ): Promise<HTTPResponse<any>> {
    return this.request('POST', `/student-profiles/${studentId}/skill-assessment`, {
      skills,
      sharedWith
    });
  }

  /**
   * Generate personalized recommendations via HTTP API
   */
  async generatePersonalizedRecommendations(
    studentId: string,
    options: {
      useEnhancedData?: boolean;
      recommendationTypes?: string[];
    } = {}
  ): Promise<HTTPResponse<any>> {
    return this.request('POST', `/student-profiles/${studentId}/recommendations`, options);
  }

  /**
   * Health check for the HTTP connection
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<HTTPResponse<any>> {
    return this.request('GET', '/student-profiles/health');
  }
}