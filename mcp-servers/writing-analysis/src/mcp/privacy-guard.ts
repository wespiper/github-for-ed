import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

export interface PrivacyContext {
  userId: string;
  role: 'student' | 'educator' | 'administrator';
  purpose: string;
  hasConsent: boolean;
  isMinor?: boolean;
  educationalContext?: {
    courseId?: string;
    assignmentId?: string;
    institutionId?: string;
  };
}

@Injectable()
export class PrivacyGuard implements CanActivate {
  private readonly logger = new Logger(PrivacyGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check if privacy validation is required
    const skipPrivacy = this.reflector.getAllAndOverride<boolean>('skipPrivacy', [
      handler,
      classRef,
    ]);

    if (skipPrivacy) {
      return true;
    }

    // Extract privacy context from request
    const privacyContext = this.extractPrivacyContext(request);

    // Validate privacy requirements
    if (!this.validatePrivacyContext(privacyContext)) {
      this.logger.warn('Privacy validation failed', { 
        userId: privacyContext?.userId,
        purpose: privacyContext?.purpose,
      });
      return false;
    }

    // Check educational purpose validation
    if (!this.validateEducationalPurpose(privacyContext)) {
      this.logger.warn('Educational purpose validation failed', {
        userId: privacyContext.userId,
        purpose: privacyContext.purpose,
      });
      return false;
    }

    // Check consent requirements
    if (!this.checkConsentRequirements(privacyContext)) {
      this.logger.warn('Consent requirements not met', {
        userId: privacyContext.userId,
        hasConsent: privacyContext.hasConsent,
      });
      return false;
    }

    // Apply minor protections if needed
    if (privacyContext.isMinor && !this.applyMinorProtections(privacyContext)) {
      this.logger.warn('Minor protection requirements not met', {
        userId: privacyContext.userId,
      });
      return false;
    }

    // Check rate limiting for privacy-sensitive operations
    if (!this.checkRateLimit(privacyContext)) {
      this.logger.warn('Rate limit exceeded for privacy operation', {
        userId: privacyContext.userId,
      });
      return false;
    }

    // Attach privacy context to request for downstream use
    request.privacyContext = privacyContext;

    // Log access for audit
    this.logAccess(privacyContext, handler.name);

    return true;
  }

  /**
   * Enhanced privacy context extraction with validation
   */
  private extractPrivacyContextEnhanced(request: any): PrivacyContext | null {
    try {
      // Extract from MCP tool arguments or HTTP headers
      const args = request.body?.params?.arguments || {};
      const headers = request.headers || {};

      return {
        userId: args.userId || headers['x-user-id'] || 'anonymous',
        role: args.role || headers['x-user-role'] || 'student',
        purpose: args.purpose || headers['x-purpose'] || 'unspecified',
        hasConsent: args.consent === true || headers['x-consent'] === 'true',
        isMinor: args.isMinor === true || headers['x-is-minor'] === 'true',
        educationalContext: {
          courseId: args.courseId || headers['x-course-id'],
          assignmentId: args.assignmentId || headers['x-assignment-id'],
          institutionId: headers['x-institution-id'],
        },
      };
    } catch (error) {
      this.logger.error('Failed to extract privacy context:', error);
      return null;
    }
  }

  /**
   * Validate educational purpose of the request
   */
  private validateEducationalPurpose(context: PrivacyContext): boolean {
    const educationalPurposes = [
      'writing improvement',
      'learning analytics', 
      'reflection assessment',
      'educational feedback',
      'student progress tracking',
      'class performance analysis',
      'assignment evaluation',
      'self-assessment',
      'self-improvement',
      'learning',
    ];

    const purpose = context.purpose.toLowerCase();
    return educationalPurposes.some(validPurpose => purpose.includes(validPurpose));
  }

  /**
   * Check rate limiting for privacy-sensitive operations
   */
  private checkRateLimit(context: PrivacyContext): boolean {
    // Simple rate limiting check
    // In production, this would use Redis or similar
    const maxRequestsPerMinute = context.role === 'student' ? 30 : 100;
    
    // For now, always allow (would implement proper rate limiting in production)
    return true;
  }

  /**
   * Enhanced audit logging
   */
  private logAccessEnhanced(context: PrivacyContext, toolName: string): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: context.userId,
      role: context.role,
      purpose: context.purpose,
      toolAccessed: toolName,
      consentProvided: context.hasConsent,
      isMinor: context.isMinor,
      educationalContext: context.educationalContext,
      userAgent: 'MCP-Client',
      privacyCompliance: 'GDPR_FERPA',
    };

    this.logger.log('Enhanced privacy audit:', auditEntry);
  }

  private extractPrivacyContext(request: any): PrivacyContext {
    // Extract from MCP tool request
    const { userId, role, purpose, consent, isMinor, educationalContext } = request.body || {};

    return {
      userId: userId || 'anonymous',
      role: role || 'student',
      purpose: purpose || 'general',
      hasConsent: consent === true,
      isMinor,
      educationalContext,
    };
  }

  private validatePrivacyContext(context: PrivacyContext | null): boolean {
    if (!context) {
      return false;
    }

    // Validate required fields
    if (!context.userId || !context.role || !context.purpose) {
      return false;
    }

    // Validate role
    const validRoles = ['student', 'educator', 'administrator'];
    if (!validRoles.includes(context.role)) {
      return false;
    }

    // Validate purpose has educational value
    const educationalPurposes = [
      'learning',
      'assessment',
      'feedback',
      'improvement',
      'research',
      'analytics',
    ];

    return educationalPurposes.some(p => 
      context.purpose.toLowerCase().includes(p)
    );
  }

  private checkConsentRequirements(context: PrivacyContext): boolean {
    const consentConfig = this.configService.get('privacy.consent');

    // Check if consent is required by default
    if (consentConfig.defaultRequired && !context.hasConsent) {
      // Allow certain operations without consent for educators
      if (context.role === 'educator' && this.isEducatorExemptOperation(context)) {
        return true;
      }
      return false;
    }

    return true;
  }

  private isEducatorExemptOperation(context: PrivacyContext): boolean {
    // Educators can view aggregated data without individual consent
    const exemptPurposes = ['class-analytics', 'aggregated-insights', 'course-improvement'];
    return exemptPurposes.includes(context.purpose);
  }

  private applyMinorProtections(context: PrivacyContext): boolean {
    const consentConfig = this.configService.get('privacy.consent');

    if (!consentConfig.minorExtraProtections) {
      return true;
    }

    // Minors require explicit parental consent
    if (!context.hasConsent) {
      return false;
    }

    // Additional checks for minors
    // - No sharing of individual data
    // - Extra anonymization
    // - Limited retention
    return true;
  }

  private logAccess(context: PrivacyContext, operation: string): void {
    const auditConfig = this.configService.get('privacy.audit');

    if (!auditConfig.enabled) {
      return;
    }

    this.logger.log('Privacy access logged', {
      userId: context.userId,
      role: context.role,
      purpose: context.purpose,
      operation,
      timestamp: new Date().toISOString(),
      hasConsent: context.hasConsent,
      isMinor: context.isMinor,
      educationalContext: context.educationalContext,
    });
  }
}