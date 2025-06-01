import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import {
  MessageQueue,
  Message,
  MessageHandler,
  QueueOptions,
  PublishOptions,
  ConsumeOptions
} from './MessageQueue';

/**
 * RabbitMQ implementation of MessageQueue
 */
export class RabbitMQService implements MessageQueue {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private consumers: Map<string, string> = new Map(); // queue -> consumerTag

  constructor(
    private readonly config: {
      url?: string;
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      vhost?: string;
      heartbeat?: number;
    } = {}
  ) {}

  private buildConnectionUrl(): string {
    if (this.config.url) {
      return this.config.url;
    }

    const {
      host = 'localhost',
      port = 5672,
      username = 'guest',
      password = 'guest',
      vhost = '/'
    } = this.config;

    return `amqp://${username}:${password}@${host}:${port}/${encodeURIComponent(vhost)}`;
  }

  async connect(): Promise<void> {
    if (this.connection && this.channel) {
      return; // Already connected
    }

    try {
      const url = this.buildConnectionUrl();
      this.connection = await amqp.connect(url, {
        heartbeat: this.config.heartbeat || 30,
      });

      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });

      this.channel = await this.connection.createChannel();
      
      this.channel.on('error', (error) => {
        console.error('RabbitMQ channel error:', error);
      });

      this.channel.on('close', () => {
        console.log('RabbitMQ channel closed');
        this.channel = null;
      });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Cancel all consumers
    for (const [queue, consumerTag] of this.consumers.entries()) {
      if (this.channel) {
        await this.channel.cancel(consumerTag);
      }
    }
    this.consumers.clear();

    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async createQueue(name: string, options?: QueueOptions): Promise<void> {
    await this.ensureConnected();
    await this.channel!.assertQueue(name, {
      durable: options?.durable ?? true,
      exclusive: options?.exclusive ?? false,
      autoDelete: options?.autoDelete ?? false,
      arguments: options?.arguments,
    });
  }

  async deleteQueue(name: string): Promise<void> {
    await this.ensureConnected();
    await this.channel!.deleteQueue(name);
  }

  async publish(queue: string, message: Message, options?: PublishOptions): Promise<void> {
    await this.ensureConnected();
    
    const content = Buffer.from(JSON.stringify(message));
    const publishOptions: amqp.Options.Publish = {
      persistent: options?.persistent ?? true,
      priority: options?.priority,
      expiration: options?.expiration,
      correlationId: options?.correlationId || message.correlationId,
      timestamp: Date.now(),
      contentType: 'application/json',
    };

    // Ensure queue exists before publishing
    await this.createQueue(queue);
    
    const sent = this.channel!.sendToQueue(queue, content, publishOptions);
    if (!sent) {
      throw new Error(`Failed to publish message to queue: ${queue}`);
    }
  }

  async publishToExchange(
    exchange: string,
    routingKey: string,
    message: Message,
    options?: PublishOptions
  ): Promise<void> {
    await this.ensureConnected();
    
    const content = Buffer.from(JSON.stringify(message));
    const publishOptions: amqp.Options.Publish = {
      persistent: options?.persistent ?? true,
      priority: options?.priority,
      expiration: options?.expiration,
      correlationId: options?.correlationId || message.correlationId,
      timestamp: Date.now(),
      contentType: 'application/json',
    };

    this.channel!.publish(exchange, routingKey, content, publishOptions);
  }

  async consume(
    queue: string,
    handler: MessageHandler,
    options?: ConsumeOptions
  ): Promise<void> {
    await this.ensureConnected();
    
    // Set prefetch count for load balancing
    if (options?.prefetchCount) {
      await this.channel!.prefetch(options.prefetchCount);
    }

    // Ensure queue exists
    await this.createQueue(queue);

    const { consumerTag } = await this.channel!.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const message: Message = JSON.parse(msg.content.toString());
          
          // Add RabbitMQ specific metadata
          message.metadata = {
            ...message.metadata,
            retryCount: msg.properties.headers?.['x-retry-count'] || 0,
          };

          await handler(message);

          // Acknowledge message if not in noAck mode
          if (!options?.noAck) {
            this.channel!.ack(msg);
          }
        } catch (error) {
          console.error(`Error processing message from ${queue}:`, error);
          
          // Reject and requeue message if not in noAck mode
          if (!options?.noAck) {
            const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
            const maxRetries = 3;

            if (retryCount < maxRetries) {
              // Requeue with incremented retry count
              const updatedMsg = JSON.parse(msg.content.toString());
              updatedMsg.metadata = {
                ...updatedMsg.metadata,
                retryCount: retryCount + 1,
              };
              
              await this.publish(queue, updatedMsg, {
                ...options,
                correlationId: msg.properties.correlationId,
              });
              
              this.channel!.ack(msg); // Acknowledge original message
            } else {
              // Send to dead letter queue after max retries
              console.error(`Message exceeded max retries, sending to DLQ: ${queue}.dlq`);
              await this.publish(`${queue}.dlq`, JSON.parse(msg.content.toString()));
              this.channel!.ack(msg);
            }
          }
        }
      },
      {
        noAck: options?.noAck ?? false,
        exclusive: options?.exclusive ?? false,
        priority: options?.priority,
      }
    );

    this.consumers.set(queue, consumerTag);
  }

  async createExchange(
    name: string,
    type: 'direct' | 'topic' | 'fanout' | 'headers'
  ): Promise<void> {
    await this.ensureConnected();
    await this.channel!.assertExchange(name, type, {
      durable: true,
      autoDelete: false,
    });
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    await this.ensureConnected();
    await this.channel!.bindQueue(queue, exchange, routingKey);
  }

  isConnected(): boolean {
    return !!(this.connection && this.channel);
  }

  async getQueueStats(queue: string): Promise<{ messageCount: number; consumerCount: number }> {
    await this.ensureConnected();
    const { messageCount, consumerCount } = await this.channel!.checkQueue(queue);
    return { messageCount, consumerCount };
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }
}

/**
 * In-memory message queue for testing
 */
export class InMemoryMessageQueue implements MessageQueue {
  private queues: Map<string, Message[]> = new Map();
  private exchanges: Map<string, { type: string; bindings: Map<string, Set<string>> }> = new Map();
  private handlers: Map<string, MessageHandler[]> = new Map();
  private connected: boolean = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.handlers.clear();
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
    if (!this.connected) throw new Error('Not connected');
    
    // Ensure queue exists
    await this.createQueue(queue);
    
    // Add message to queue
    this.queues.get(queue)!.push(message);
    
    // Process handlers immediately (simulating async behavior)
    const handlers = this.handlers.get(queue) || [];
    for (const handler of handlers) {
      setTimeout(() => {
        const messages = this.queues.get(queue) || [];
        const msg = messages.shift();
        if (msg) {
          handler(msg).catch(console.error);
        }
      }, 0);
    }
  }

  async publishToExchange(
    exchange: string,
    routingKey: string,
    message: Message,
    options?: PublishOptions
  ): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    const ex = this.exchanges.get(exchange);
    if (!ex) throw new Error(`Exchange ${exchange} does not exist`);
    
    // Find matching queues based on exchange type and routing key
    const matchingQueues = new Set<string>();
    
    if (ex.type === 'fanout') {
      // All bound queues receive the message
      ex.bindings.forEach((_, queue) => matchingQueues.add(queue));
    } else if (ex.type === 'direct') {
      // Only queues bound with exact routing key
      ex.bindings.forEach((keys, queue) => {
        if (keys.has(routingKey)) {
          matchingQueues.add(queue);
        }
      });
    } else if (ex.type === 'topic') {
      // Pattern matching for topic exchanges
      ex.bindings.forEach((keys, queue) => {
        for (const pattern of keys) {
          if (this.matchTopicPattern(routingKey, pattern)) {
            matchingQueues.add(queue);
            break;
          }
        }
      });
    }
    
    // Publish to all matching queues
    for (const queue of matchingQueues) {
      await this.publish(queue, message, options);
    }
  }

  async consume(
    queue: string,
    handler: MessageHandler,
    options?: ConsumeOptions
  ): Promise<void> {
    if (!this.connected) throw new Error('Not connected');
    
    await this.createQueue(queue);
    
    if (!this.handlers.has(queue)) {
      this.handlers.set(queue, []);
    }
    this.handlers.get(queue)!.push(handler);
    
    // Process any existing messages
    const messages = this.queues.get(queue) || [];
    while (messages.length > 0) {
      const msg = messages.shift()!;
      handler(msg).catch(console.error);
    }
  }

  async createExchange(
    name: string,
    type: 'direct' | 'topic' | 'fanout' | 'headers'
  ): Promise<void> {
    if (!this.exchanges.has(name)) {
      this.exchanges.set(name, { type, bindings: new Map() });
    }
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    const ex = this.exchanges.get(exchange);
    if (!ex) throw new Error(`Exchange ${exchange} does not exist`);
    
    if (!ex.bindings.has(queue)) {
      ex.bindings.set(queue, new Set());
    }
    ex.bindings.get(queue)!.add(routingKey);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getQueueStats(queue: string): Promise<{ messageCount: number; consumerCount: number }> {
    const messages = this.queues.get(queue) || [];
    const handlers = this.handlers.get(queue) || [];
    return {
      messageCount: messages.length,
      consumerCount: handlers.length,
    };
  }

  private matchTopicPattern(routingKey: string, pattern: string): boolean {
    const keyParts = routingKey.split('.');
    const patternParts = pattern.split('.');
    
    if (patternParts.length !== keyParts.length && !patternParts.includes('#')) {
      return false;
    }
    
    let keyIndex = 0;
    for (let i = 0; i < patternParts.length; i++) {
      const part = patternParts[i];
      
      if (part === '#') {
        return true; // # matches zero or more words
      } else if (part === '*') {
        keyIndex++; // * matches exactly one word
      } else if (part === keyParts[keyIndex]) {
        keyIndex++;
      } else {
        return false;
      }
      
      if (keyIndex > keyParts.length) {
        return false;
      }
    }
    
    return keyIndex === keyParts.length;
  }
}