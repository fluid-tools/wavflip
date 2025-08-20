/**
 * Logger utility to replace console.* usage throughout the application
 * Follows Ultracite rules that prohibit direct console usage
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    // In test environment, suppress logs unless explicitly enabled
    if (this.isTest && !process.env.ENABLE_TEST_LOGGING) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    // In development, use console for immediate feedback
    if (this.isDevelopment) {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn :
                       level === 'info' ? console.info : console.log;
      
      logMethod(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, {
        ...(context && { context }),
        ...(error && { error: error.message, stack: error.stack }),
      });
      return;
    }

    // In production, you could send to a logging service
    // For now, we'll use console as fallback but with structured format
    const logData = {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...(context && { context }),
      ...(error && { 
        error: error.message, 
        stack: error.stack,
        name: error.name,
      }),
    };

    // Use appropriate console method based on level
    if (level === 'error') {
      console.error(JSON.stringify(logData));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logData));
    } else {
      console.log(JSON.stringify(logData));
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('error', message, context, error);
  }

  // Helper methods for common patterns
  apiRequest(method: string, url: string, context?: Record<string, unknown>) {
    this.info(`API ${method} ${url}`, context);
  }

  apiResponse(method: string, url: string, status: number, context?: Record<string, unknown>) {
    const level = status >= 400 ? 'warn' : 'info';
    this.log(level, `API ${method} ${url} - ${status}`, context);
  }

  apiError(method: string, url: string, error: Error, context?: Record<string, unknown>) {
    this.error(`API ${method} ${url} failed`, context, error);
  }

  dbQuery(query: string, context?: Record<string, unknown>) {
    this.debug(`DB Query: ${query}`, context);
  }

  dbError(operation: string, error: Error, context?: Record<string, unknown>) {
    this.error(`DB ${operation} failed`, context, error);
  }

  auth(action: string, userId?: string, context?: Record<string, unknown>) {
    this.info(`Auth: ${action}`, { ...context, userId });
  }

  storage(operation: string, key: string, context?: Record<string, unknown>) {
    this.info(`Storage: ${operation}`, { ...context, key });
  }

  storageError(operation: string, key: string, error: Error, context?: Record<string, unknown>) {
    this.error(`Storage: ${operation} failed`, { ...context, key }, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external usage
export type { LogLevel, LogEntry };