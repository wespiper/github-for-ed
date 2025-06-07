import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

export interface MCPRequest {
  method: string;
  params?: any;
  context?: {
    studentId?: string;
    userId?: string;
    role?: string;
  };
}

@Injectable()
export class ConsentGuard implements CanActivate {
  private readonly logger = new Logger(ConsentGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<MCPRequest>();
    
    this.logger.log(`Consent check for method: ${request.method}`);

    // Extract student ID and check consent
    const studentId = this.extractStudentId(request);
    if (!studentId) {
      this.logger.warn('No student ID found in request');
      return false;
    }

    // Check if the operation requires consent
    if (this.requiresConsent(request.method)) {
      return this.checkConsent(studentId, request.method);
    }

    return true;
  }

  private extractStudentId(request: MCPRequest): string | undefined {
    // Try to extract from params first
    if (request.params?.studentId) {
      return request.params.studentId;
    }

    // Try context
    if (request.context?.studentId) {
      return request.context.studentId;
    }

    // For self-requests
    if (request.context?.userId && request.context?.role === 'student') {
      return request.context.userId;
    }

    return undefined;
  }

  private requiresConsent(method: string): boolean {
    const consentRequiredMethods = [
      'build_student_profile',
      'track_learning_trajectory',
      'assess_skill_development',
      'generate_personalized_recommendations',
      'generate_privacy_preserving_analytics',
    ];

    return consentRequiredMethods.includes(method);
  }

  private async checkConsent(studentId: string, method: string): Promise<boolean> {
    // In a real implementation, this would check the database
    // For now, we'll implement a basic check
    this.logger.log(`Checking consent for student ${studentId} on method ${method}`);
    
    // Mock consent check - in production, query consent database
    // This would check if the student has given consent for the specific operation
    return true;
  }
}