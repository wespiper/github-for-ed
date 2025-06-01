import { Event } from '../EventBus';

/**
 * Event fired when an intervention is triggered for a student
 */
export interface InterventionTriggeredEvent extends Event {
  type: 'intervention.triggered';
  payload: {
    studentId: string;
    courseId: string;
    assignmentId?: string;
    interventionType: 'automated' | 'educator_alert' | 'peer_support' | 'resource_suggestion';
    triggerReason: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      indicators: string[];
    };
    intervention: {
      id: string;
      title: string;
      description: string;
      actions: Array<{
        type: 'notification' | 'email' | 'ui_prompt' | 'resource_unlock';
        target: 'student' | 'educator' | 'both';
        content: string;
      }>;
    };
    expectedOutcome?: string;
  };
}

/**
 * Event fired when an educator responds to an intervention
 */
export interface InterventionRespondedEvent extends Event {
  type: 'intervention.responded';
  payload: {
    interventionId: string;
    educatorId: string;
    responseType: 'acknowledged' | 'action_taken' | 'dismissed' | 'escalated';
    actions?: Array<{
      type: string;
      description: string;
      timestamp: Date;
    }>;
    notes?: string;
  };
}

/**
 * Event fired when intervention effectiveness is measured
 */
export interface InterventionEffectivenessEvent extends Event {
  type: 'intervention.effectiveness';
  payload: {
    interventionId: string;
    studentId: string;
    measurementType: 'immediate' | 'short_term' | 'long_term';
    effectiveness: {
      score: number; // 0-1
      indicators: Array<{
        metric: string;
        before: number;
        after: number;
        improvement: number;
      }>;
    };
    studentFeedback?: {
      helpful: boolean;
      rating?: number;
      comments?: string;
    };
  };
}