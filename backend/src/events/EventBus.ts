/**
 * Event Bus Interface for Service Communication
 * Provides decoupled communication between services
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

export type EventHandler<T extends Event = Event> = (event: T) => void | Promise<void>;

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
}

/**
 * In-memory implementation of EventBus for Phase 1
 * Will be replaced with RabbitMQ implementation in Phase 2
 */
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

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

  subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
  }

  unsubscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  getSubscriberCount(eventType: string): number {
    const handlers = this.handlers.get(eventType);
    return handlers ? handlers.size : 0;
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