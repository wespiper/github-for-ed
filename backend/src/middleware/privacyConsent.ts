import { Request, Response, NextFunction } from 'express';
import { getServices } from './serviceContainer';

export interface PrivacyContext {
  userId: string;
  role: 'student' | 'educator' | 'administrator';
  hasConsent: {
    general: boolean;
    analytics: boolean;
    research: boolean;
    aiAssistance: boolean;
  };
  isMinor: boolean;
  educationalContext?: {
    courseId?: string;
    assignmentId?: string;
    institutionId?: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      privacyContext?: PrivacyContext;
    }
  }
}

/**
 * Middleware to check and attach privacy consent information
 */
export async function checkPrivacyConsent(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Extract user information from authentication
    const userId = req.user?.id;
    const userRole = req.user?.role || 'student';
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Authentication required for privacy consent verification' 
      });
      return;
    }

    // Get student consent preferences (mock implementation)
    const consent = await getStudentConsent(userId);
    
    // Determine if user is a minor (simplified check)
    const isMinor = req.user?.age ? req.user.age < 18 : false;

    // Extract educational context from request
    const educationalContext = extractEducationalContext(req);

    // Create privacy context
    const privacyContext: PrivacyContext = {
      userId,
      role: userRole as 'student' | 'educator' | 'administrator',
      hasConsent: consent,
      isMinor,
      educationalContext,
    };

    // Attach to request
    req.privacyContext = privacyContext;

    // Log privacy context attachment for audit
    console.log('Privacy context attached:', {
      userId: hashUserId(userId),
      role: userRole,
      hasGeneralConsent: consent.general,
      isMinor,
      timestamp: new Date().toISOString(),
    });

    next();
  } catch (error) {
    console.error('Privacy consent middleware error:', error);
    res.status(500).json({ 
      message: 'Privacy consent verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Middleware specifically for operations requiring analytics consent
 */
export function requireAnalyticsConsent(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  if (!req.privacyContext) {
    res.status(500).json({ 
      message: 'Privacy context not initialized. Ensure checkPrivacyConsent middleware runs first.' 
    });
    return;
  }

  if (!req.privacyContext.hasConsent.analytics) {
    res.status(403).json({ 
      message: 'Analytics consent required for this operation',
      consentRequired: 'analytics',
      privacyPolicy: '/api/privacy/policy'
    });
    return;
  }

  next();
}

/**
 * Middleware for operations requiring AI assistance consent
 */
export function requireAIConsent(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  if (!req.privacyContext) {
    res.status(500).json({ 
      message: 'Privacy context not initialized. Ensure checkPrivacyConsent middleware runs first.' 
    });
    return;
  }

  if (!req.privacyContext.hasConsent.aiAssistance) {
    res.status(403).json({ 
      message: 'AI assistance consent required for this operation',
      consentRequired: 'aiAssistance',
      privacyPolicy: '/api/privacy/policy'
    });
    return;
  }

  next();
}

/**
 * Middleware for minor protection
 */
export function applyMinorProtections(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  if (!req.privacyContext) {
    res.status(500).json({ 
      message: 'Privacy context not initialized' 
    });
    return;
  }

  if (req.privacyContext.isMinor) {
    // Apply additional protections for minors
    req.headers['x-minor-protection'] = 'true';
    
    // Check if parental consent is required for this operation
    const operationType = req.route?.path;
    const requiresParentalConsent = [
      '/api/analytics/*',
      '/api/ai/*',
      '/api/sharing/*'
    ].some(pattern => operationType?.includes(pattern.replace('*', '')));

    if (requiresParentalConsent && !req.privacyContext.hasConsent.research) {
      res.status(403).json({ 
        message: 'Parental consent required for minor users',
        consentRequired: 'parental',
        contactSupport: '/api/support/parental-consent'
      });
      return;
    }
  }

  next();
}

/**
 * Get student consent preferences (mock implementation)
 * In a real system, this would query the database
 */
async function getStudentConsent(userId: string): Promise<{
  general: boolean;
  analytics: boolean;
  research: boolean;
  aiAssistance: boolean;
}> {
  // Mock implementation - would be replaced with database query
  try {
    // This would typically query a consent management system
    // For now, return default consent based on user preferences
    return {
      general: true,        // Basic platform usage
      analytics: true,      // Learning analytics
      research: false,      // Educational research
      aiAssistance: true,   // AI-powered assistance
    };
  } catch (error) {
    console.error('Error fetching consent preferences:', error);
    // Default to most restrictive consent
    return {
      general: true,        // Platform usage required
      analytics: false,
      research: false,
      aiAssistance: false,
    };
  }
}

/**
 * Extract educational context from request
 */
function extractEducationalContext(req: Request): PrivacyContext['educationalContext'] {
  return {
    courseId: req.body?.courseId || req.params?.courseId || req.query?.courseId,
    assignmentId: req.body?.assignmentId || req.params?.assignmentId || req.query?.assignmentId,
    institutionId: req.headers['x-institution-id'] as string,
  };
}

/**
 * Hash user ID for privacy logging
 */
function hashUserId(userId: string): string {
  // Simple hash for privacy (in production, use proper crypto)
  return Buffer.from(userId).toString('base64').substring(0, 8) + '...';
}

/**
 * Consent update endpoint handler
 */
export async function updateConsent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { consentType, granted } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Validate consent type
    const validConsentTypes = ['general', 'analytics', 'research', 'aiAssistance'];
    if (!validConsentTypes.includes(consentType)) {
      res.status(400).json({ 
        message: 'Invalid consent type',
        validTypes: validConsentTypes
      });
      return;
    }

    // Update consent in database (mock implementation)
    await updateStudentConsent(userId, consentType, granted);

    // Audit the consent change
    const serviceFactory = getServices();
    const mcpClient = serviceFactory.getMCPClient();
    
    await mcpClient.auditWritingDataAccess({
      accessType: 'write',
      dataType: 'consent_preferences',
      userId,
      accessedBy: userId,
      purpose: 'Student consent preference update',
      educationalContext: extractEducationalContext(req),
    });

    res.json({ 
      message: 'Consent updated successfully',
      consentType,
      granted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Consent update error:', error);
    res.status(500).json({ 
      message: 'Failed to update consent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update student consent in database (mock implementation)
 */
async function updateStudentConsent(
  userId: string, 
  consentType: string, 
  granted: boolean
): Promise<void> {
  // Mock implementation - would update database
  console.log('Updating consent:', { userId: hashUserId(userId), consentType, granted });
  
  // In a real implementation, this would:
  // 1. Update the consent record in the database
  // 2. Trigger privacy policy updates if needed
  // 3. Update cache invalidation for user preferences
  // 4. Send notifications if required by law
}