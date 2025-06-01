import {
  MessageQueue,
  Message,
  MessageHandler,
  QueueOptions,
  PublishOptions,
  ConsumeOptions
} from './MessageQueue';

/**
 * In-memory implementation of MessageQueue for testing
 */
export class InMemoryMessageQueue implements MessageQueue {
  private queues: Map<string, Message[]> = new Map();
  private handlers: Map<string, MessageHandler> = new Map();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
    console.log('InMemoryMessageQueue connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.queues.clear();
    this.handlers.clear();
    console.log('InMemoryMessageQueue disconnected');
  }

  async createQueue(name: string, options?: QueueOptions): Promise<void> {
    if (!this.queues.has(name)) {
      this.queues.set(name, []);
    }
  }

  async deleteQueue(name: string): Promise<void> {
    this.queues.delete(name);
    this.handlers.delete(name);
  }

  async publish(queue: string, message: Message, options?: PublishOptions): Promise<void> {
    if (!this.connected) {
      throw new Error('MessageQueue not connected');
    }

    // Ensure queue exists
    await this.createQueue(queue);
    
    const messages = this.queues.get(queue)!;
    messages.push({
      ...message,
      timestamp: new Date(),
    });

    // Process immediately if handler exists
    const handler = this.handlers.get(queue);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error processing message in queue ${queue}:`, error);
      }
    }
  }

  async publishToExchange(
    exchange: string,
    routingKey: string,
    message: Message,
    options?: PublishOptions
  ): Promise<void> {
    // For in-memory implementation, treat exchange.routingKey as queue name
    const queueName = `${exchange}.${routingKey}`;
    await this.publish(queueName, message, options);
  }

  async consume(
    queue: string,
    handler: MessageHandler,
    options?: ConsumeOptions
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('MessageQueue not connected');
    }

    // Ensure queue exists
    await this.createQueue(queue);
    
    // Store handler for new messages
    this.handlers.set(queue, handler);
    
    // Process existing messages
    const messages = this.queues.get(queue)!;
    const messagesToProcess = [...messages];
    
    if (!options?.noAck) {
      // Clear processed messages
      messages.length = 0;
    }

    // Process messages sequentially
    for (const message of messagesToProcess) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error processing message in queue ${queue}:`, error);
      }
    }
  }

  async createExchange(name: string, type: 'direct' | 'topic' | 'fanout' | 'headers'): Promise<void> {
    // In-memory implementation - exchanges are simulated through queue naming
    console.log(`InMemoryMessageQueue: Created exchange ${name} of type ${type}`);
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    // In-memory implementation - bindings are simulated
    console.log(`InMemoryMessageQueue: Bound queue ${queue} to exchange ${exchange} with routing key ${routingKey}`);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getQueueStats(queue: string): Promise<{
    messageCount: number;
    consumerCount: number;
  }> {
    const messages = this.queues.get(queue) || [];
    const hasConsumer = this.handlers.has(queue);
    
    return {
      messageCount: messages.length,
      consumerCount: hasConsumer ? 1 : 0,
    };
  }
}