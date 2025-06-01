import { MessageQueue } from '../messaging/MessageQueue';
import { InMemoryMessageQueue } from '../messaging/InMemoryMessageQueue';
// import { RabbitMQService } from '../messaging/RabbitMQService'; // Temporarily commented for testing

export interface MessagingConfig {
  type: 'rabbitmq' | 'memory';
  rabbitmq?: {
    url?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    vhost?: string;
    heartbeat?: number;
  };
}

export function createMessageQueue(config: MessagingConfig): MessageQueue {
  // if (config.type === 'rabbitmq') {
  //   return new RabbitMQService(config.rabbitmq);
  // }
  
  return new InMemoryMessageQueue();
}

// Default configuration
export const defaultMessagingConfig: MessagingConfig = {
  type: 'memory', // Temporarily use in-memory for testing
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USER || 'scribe',
    password: process.env.RABBITMQ_PASS || 'scribe_password',
    vhost: process.env.RABBITMQ_VHOST || '/',
    heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT || '30'),
  },
};