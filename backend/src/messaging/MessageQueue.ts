/**
 * Message Queue Interface for Service Communication
 */

export interface Message {
  id: string;
  correlationId: string;
  timestamp: Date;
  type: string;
  payload: Record<string, any>;
  metadata?: {
    source?: string;
    userId?: string;
    retryCount?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, any>;
}

export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  correlationId?: string;
}

export interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  prefetchCount?: number;
}

export type MessageHandler = (message: Message) => Promise<void>;

export interface MessageQueue {
  /**
   * Connect to the message queue
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the message queue
   */
  disconnect(): Promise<void>;

  /**
   * Create a queue
   */
  createQueue(name: string, options?: QueueOptions): Promise<void>;

  /**
   * Delete a queue
   */
  deleteQueue(name: string): Promise<void>;

  /**
   * Publish a message to a queue
   */
  publish(queue: string, message: Message, options?: PublishOptions): Promise<void>;

  /**
   * Publish a message to an exchange with routing key
   */
  publishToExchange(
    exchange: string,
    routingKey: string,
    message: Message,
    options?: PublishOptions
  ): Promise<void>;

  /**
   * Subscribe to messages from a queue
   */
  consume(queue: string, handler: MessageHandler, options?: ConsumeOptions): Promise<void>;

  /**
   * Create an exchange
   */
  createExchange(name: string, type: 'direct' | 'topic' | 'fanout' | 'headers'): Promise<void>;

  /**
   * Bind a queue to an exchange
   */
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get queue statistics
   */
  getQueueStats(queue: string): Promise<{
    messageCount: number;
    consumerCount: number;
  }>;
}

/**
 * Educational queue patterns
 */
export class QueueNames {
  // Student activity queues
  static readonly STUDENT_PROGRESS = 'student.progress';
  static readonly STUDENT_INTERACTIONS = 'student.interactions';
  
  // AI processing queues
  static readonly AI_ANALYSIS_REQUEST = 'ai.analysis.request';
  static readonly AI_ANALYSIS_RESULT = 'ai.analysis.result';
  static readonly AI_BOUNDARY_CHECK = 'ai.boundary.check';
  
  // Writing process queues
  static readonly WRITING_SESSION_UPDATE = 'writing.session.update';
  static readonly WRITING_PATTERN_ANALYSIS = 'writing.pattern.analysis';
  
  // Intervention queues
  static readonly INTERVENTION_TRIGGER = 'intervention.trigger';
  static readonly INTERVENTION_NOTIFICATION = 'intervention.notification';
  
  // Analytics queues
  static readonly ANALYTICS_EVENT = 'analytics.event';
  static readonly ANALYTICS_AGGREGATION = 'analytics.aggregation';
}

/**
 * Exchange names for topic-based routing
 */
export class ExchangeNames {
  static readonly EDUCATIONAL_EVENTS = 'educational.events';
  static readonly AI_PROCESSING = 'ai.processing';
  static readonly NOTIFICATIONS = 'notifications';
  static readonly ANALYTICS = 'analytics';
}

/**
 * Routing key patterns
 */
export class RoutingKeys {
  // Student events
  static studentProgress(courseId: string, studentId: string): string {
    return `student.${courseId}.${studentId}.progress`;
  }
  
  // AI events
  static aiAnalysis(type: string, priority: string = 'normal'): string {
    return `ai.analysis.${type}.${priority}`;
  }
  
  // Notification events
  static notification(target: 'student' | 'educator', type: string): string {
    return `notification.${target}.${type}`;
  }
  
  // Analytics events
  static analytics(entity: string, metric: string): string {
    return `analytics.${entity}.${metric}`;
  }
}