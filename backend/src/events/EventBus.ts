/**
 * Event Bus Interface for Service Communication
 * Provides decoupled communication between services with privacy support
 */

export interface Event {
  type: string;
  correlationId: string;
  timestamp: Date;
  payload: Record<string, any>;
  metadata?: {
    userId?: string;
    courseId?: string;
    assignmentId?: string;
    source?: string;
  };
}

/**
 * Privacy-enhanced event interface with privacy controls
 */
export interface PrivacyEvent extends Event {
  category: 'audit' | 'consent' | 'access' | 'compliance';
  privacyLevel: 'public' | 'restricted' | 'confidential';
  studentIdHash?: string; // Never store raw student IDs
  encrypted?: boolean;
  privacyContext?: {
    dataMinimized: boolean;
    consentVerified: boolean;
    educationalPurpose: string;
    retentionPeriod?: number; // days
  };
}

export type EventHandler<T extends Event = Event> = (event: T) => void | Promise<void>;

/**
 * Privacy utility functions for event handling
 */
export class PrivacyEventUtils {
  private static readonly ENCRYPTION_KEY = process.env.EVENT_ENCRYPTION_KEY || 'default-key-for-dev';

  /**
   * Hash student ID for privacy
   */
  static hashStudentId(studentId: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(studentId + this.ENCRYPTION_KEY).digest('hex').substring(0, 16);
  }

  /**
   * Encrypt sensitive event payload using AES-256-CBC with explicit IV
   */
  static encryptPayload(payload: Record<string, any>): string {
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-cbc';
      
      // Create a 32-byte key from the encryption key
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'privacy-salt', 32);
      
      // Generate a random 16-byte IV for CBC
      const iv = crypto.randomBytes(16);
      
      // Create cipher with explicit IV
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      // Encrypt the payload
      const jsonString = JSON.stringify(payload);
      let encrypted = cipher.update(jsonString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      const result = {
        iv: iv.toString('hex'),
        encrypted: encrypted
      };
      
      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
      throw new Error(`Failed to encrypt payload: ${errorMessage}`);
    }
  }

  /**
   * Decrypt event payload using AES-256-CBC with explicit IV
   */
  static decryptPayload(encryptedPayload: string): Record<string, any> {
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-cbc';
      
      // Parse the encrypted data structure
      const encryptedData = JSON.parse(Buffer.from(encryptedPayload, 'base64').toString('utf8'));
      const { iv, encrypted } = encryptedData;
      
      // Create a 32-byte key from the encryption key
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'privacy-salt', 32);
      
      // Create decipher with explicit IV
      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      throw new Error(`Failed to decrypt payload: ${errorMessage}`);
    }
  }

  /**
   * Validate privacy event structure
   */
  static validatePrivacyEvent(event: PrivacyEvent): boolean {
    // Check if event exists and has required fields
    if (!event || typeof event !== 'object') {
      return false;
    }
    
    // Check required privacy fields
    if (!event.category || !event.privacyLevel) {
      return false;
    }

    // Ensure no raw student IDs in confidential events
    if (event.privacyLevel === 'confidential') {
      const payloadStr = JSON.stringify(event.payload);
      if (payloadStr.includes('studentId') && !payloadStr.includes('studentIdHash')) {
        return false;
      }
    }

    // Verify privacy context for sensitive events
    if (event.privacyLevel !== 'public' && !event.privacyContext?.educationalPurpose) {
      return false;
    }

    return true;
  }

  /**
   * Minimize data in event payload based on privacy level
   */
  static minimizeEventData<T extends PrivacyEvent>(event: T): T {
    const minimized = { ...event };
    
    if (event.privacyLevel === 'confidential') {
      // Remove or hash sensitive fields
      if (minimized.payload.studentId) {
        minimized.studentIdHash = this.hashStudentId(minimized.payload.studentId);
        delete minimized.payload.studentId;
      }
      
      // Encrypt sensitive payload
      if (minimized.payload && Object.keys(minimized.payload).length > 0) {
        const encryptedPayload = this.encryptPayload(minimized.payload);
        minimized.payload = { encrypted: encryptedPayload };
        minimized.encrypted = true;
      }
    }

    return minimized;
  }
}

export interface EventBus {
  /**
   * Publish an event to all subscribers
   */
  publish<T extends Event>(event: T): Promise<void>;

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void;

  /**
   * Unsubscribe a handler from a specific event type
   */
  unsubscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void;

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[];

  /**
   * Get number of subscribers for an event type
   */
  getSubscriberCount(eventType: string): number;

  /**
   * Privacy-enhanced event publishing with encryption and filtering
   */
  publishPrivacyEvent<T extends PrivacyEvent>(event: T): Promise<void>;

  /**
   * Subscribe to privacy events with access level filtering
   */
  subscribeToPrivacyEvents<T extends PrivacyEvent>(
    eventType: string, 
    handler: EventHandler<T>,
    requiredPrivacyLevel?: T['privacyLevel']
  ): void;

  /**
   * Validate event privacy requirements
   */
  validatePrivacyEvent<T extends PrivacyEvent>(event: T): boolean;
}

/**
 * In-memory implementation of EventBus for Phase 1
 * Will be replaced with RabbitMQ implementation in Phase 2
 */
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private privacyHandlers: Map<string, Set<{ handler: EventHandler; requiredLevel?: string }>> = new Map();

  async publish<T extends Event>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute handlers asynchronously
    const promises = Array.from(handlers).map(handler => 
      Promise.resolve(handler(event)).catch(error => {
        console.error(`Error in event handler for ${event.type}:`, error);
        // Don't let one handler failure affect others
      })
    );

    await Promise.all(promises);
  }

  async publishPrivacyEvent<T extends PrivacyEvent>(event: T): Promise<void> {
    // Validate privacy event
    if (!this.validatePrivacyEvent(event)) {
      throw new Error(`Invalid privacy event: ${event.type}`);
    }

    // Minimize data based on privacy level
    const minimizedEvent = PrivacyEventUtils.minimizeEventData(event);

    // Get privacy-aware handlers
    const privacyHandlers = this.privacyHandlers.get(event.type);
    if (privacyHandlers && privacyHandlers.size > 0) {
      const promises = Array.from(privacyHandlers)
        .filter(({ requiredLevel }) => {
          // Filter handlers based on required privacy level
          if (!requiredLevel) return true;
          return this.isPrivacyLevelAllowed(event.privacyLevel, requiredLevel);
        })
        .map(({ handler }) => 
          Promise.resolve(handler(minimizedEvent)).catch(error => {
            console.error(`Error in privacy event handler for ${event.type}:`, error);
          })
        );

      await Promise.all(promises);
    }

    // Also publish to regular handlers (they get minimized version)
    await this.publish(minimizedEvent as T extends PrivacyEvent ? T : never);
  }

  private isPrivacyLevelAllowed(eventLevel: string, requiredLevel: string): boolean {
    const levels = ['public', 'restricted', 'confidential'];
    const eventIndex = levels.indexOf(eventLevel);
    const requiredIndex = levels.indexOf(requiredLevel);
    return eventIndex >= requiredIndex;
  }

  subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
  }

  subscribeToPrivacyEvents<T extends PrivacyEvent>(
    eventType: string, 
    handler: EventHandler<T>,
    requiredPrivacyLevel?: T['privacyLevel']
  ): void {
    if (!this.privacyHandlers.has(eventType)) {
      this.privacyHandlers.set(eventType, new Set());
    }
    this.privacyHandlers.get(eventType)!.add({ 
      handler: handler as EventHandler, 
      requiredLevel: requiredPrivacyLevel 
    });
  }

  unsubscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }

    // Also remove from privacy handlers
    const privacyHandlers = this.privacyHandlers.get(eventType);
    if (privacyHandlers) {
      for (const handlerEntry of privacyHandlers) {
        if (handlerEntry.handler === handler) {
          privacyHandlers.delete(handlerEntry);
          break;
        }
      }
      if (privacyHandlers.size === 0) {
        this.privacyHandlers.delete(eventType);
      }
    }
  }

  validatePrivacyEvent<T extends PrivacyEvent>(event: T): boolean {
    return PrivacyEventUtils.validatePrivacyEvent(event);
  }

  getRegisteredEventTypes(): string[] {
    const regularTypes = Array.from(this.handlers.keys());
    const privacyTypes = Array.from(this.privacyHandlers.keys());
    return [...new Set([...regularTypes, ...privacyTypes])];
  }

  getSubscriberCount(eventType: string): number {
    const regularHandlers = this.handlers.get(eventType);
    const privacyHandlers = this.privacyHandlers.get(eventType);
    const regularCount = regularHandlers ? regularHandlers.size : 0;
    const privacyCount = privacyHandlers ? privacyHandlers.size : 0;
    return regularCount + privacyCount;
  }
}

// Singleton instance for the application
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new InMemoryEventBus();
  }
  return eventBusInstance;
}

export function setEventBus(bus: EventBus): void {
  eventBusInstance = bus;
}