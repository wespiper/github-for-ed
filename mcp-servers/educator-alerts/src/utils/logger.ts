/**
 * Simple logger utility for MCP server
 */

export class Logger {
  constructor(private context: string) {}

  info(message: string, ...args: any[]) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, ...args);
    }
  }
}