import { existsSync, mkdirSync, appendFileSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private logDir: string;
  private logFile: string;
  private minLevel: LogLevel = 'error'; // Default to errors only as per user request
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private static instance: Logger | null = null;

  constructor() {
    // Use /data/logs in production (Docker), fallback to local for dev
    this.logDir = process.env.NODE_ENV === 'production'
      ? '/data/logs'
      : join(process.cwd(), 'data', 'logs');
    this.logFile = join(this.logDir, 'fauxdash.log');
    this.ensureLogDir();

    // Check for log level from environment variable
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLogLevel && LOG_LEVELS[envLogLevel as LogLevel] !== undefined) {
      this.minLevel = envLogLevel as LogLevel;
    }
  }

  // Set log level dynamically
  setLogLevel(level: LogLevel) {
    if (LOG_LEVELS[level] !== undefined) {
      this.minLevel = level;
    }
  }

  // Get current log level
  getLogLevel(): LogLevel {
    return this.minLevel;
  }

  private ensureLogDir() {
    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create log directory:', e);
    }
  }

  private formatEntry(entry: LogEntry): string {
    const details = entry.details ? ` | ${JSON.stringify(entry.details)}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase().padEnd(5)}] [${entry.category}] ${entry.message}${details}\n`;
  }

  private rotateIfNeeded() {
    try {
      if (existsSync(this.logFile)) {
        const stats = statSync(this.logFile);
        if (stats.size > this.maxFileSize) {
          const backupFile = `${this.logFile}.${Date.now()}.bak`;
          const fs = require('fs');
          fs.renameSync(this.logFile, backupFile);
        }
      }
    } catch (e) {
      // Ignore rotation errors
    }
  }

  private writeToFile(entry: LogEntry) {
    try {
      this.rotateIfNeeded();
      const line = this.formatEntry(entry);
      appendFileSync(this.logFile, line);
    } catch (e) {
      // Fall back to console only
    }
  }

  private log(level: LogLevel, category: string, message: string, details?: any) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    };

    // Always write to console
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(this.formatEntry(entry).trim());

    // Write to file
    this.writeToFile(entry);
  }

  debug(category: string, message: string, details?: any) {
    this.log('debug', category, message, details);
  }

  info(category: string, message: string, details?: any) {
    this.log('info', category, message, details);
  }

  warn(category: string, message: string, details?: any) {
    this.log('warn', category, message, details);
  }

  error(category: string, message: string, details?: any) {
    this.log('error', category, message, details);
  }

  // Read recent log entries
  getRecentLogs(lines: number = 500): string[] {
    try {
      if (!existsSync(this.logFile)) {
        return [];
      }
      const content = readFileSync(this.logFile, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines);
    } catch (e) {
      return [`Error reading log file: ${e}`];
    }
  }

  // Get log file path for API
  getLogFilePath(): string {
    return this.logFile;
  }

  // Clear logs
  clearLogs() {
    try {
      const fs = require('fs');
      fs.writeFileSync(this.logFile, '');
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports for common categories
export const logFavicon = (level: LogLevel, message: string, details?: any) => {
  logger[level]('FAVICON', message, details);
};

export const logAuth = (level: LogLevel, message: string, details?: any) => {
  logger[level]('AUTH', message, details);
};

export const logApi = (level: LogLevel, message: string, details?: any) => {
  logger[level]('API', message, details);
};

export const logDb = (level: LogLevel, message: string, details?: any) => {
  logger[level]('DATABASE', message, details);
};

export const logSystem = (level: LogLevel, message: string, details?: any) => {
  logger[level]('SYSTEM', message, details);
};

export const logGeoIP = (level: LogLevel, message: string, details?: any) => {
  logger[level]('GEOIP', message, details);
};

export const logSecurity = (level: LogLevel, message: string, details?: any) => {
  logger[level]('SECURITY', message, details);
};
