import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for JSON logging
const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    winston.format.json()
);

// Custom format for console logging (human-readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// File rotation transport for all logs
const fileRotateTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'hexserve-%DATE%.log'),
    datePattern: 'YYYY-WW', // Weekly rotation (WW = week number)
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days (2 weeks)
    format: jsonFormat,
    level: 'info'
});

// File rotation transport for errors
const errorFileRotateTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'hexserve-error-%DATE%.log'),
    datePattern: 'YYYY-WW', // Weekly rotation
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: jsonFormat,
    level: 'error'
});

// Console transport
const consoleTransport = new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        consoleTransport,
        fileRotateTransport,
        errorFileRotateTransport
    ],
    // Default metadata that will be added to all log entries
    defaultMeta: {
        service: 'hexserve',
        environment: process.env.NODE_ENV || 'development'
    },
    // Exit on error false to prevent logger from exiting the application
    exitOnError: false
});

// Log file rotation events
fileRotateTransport.on('rotate', (oldFilename: string, newFilename: string) => {
    logger.info('Log file rotated', {
        event: 'log_rotation',
        oldFilename,
        newFilename
    });
});

errorFileRotateTransport.on('rotate', (oldFilename: string, newFilename: string) => {
    logger.info('Error log file rotated', {
        event: 'error_log_rotation',
        oldFilename,
        newFilename
    });
});

export const setupLogger = (level: string, dir: string, environment: string) => {
    logger.level = level;
    logger.defaultMeta.environment = environment;
    // Update log directory if needed
    fileRotateTransport.dirname = dir;
    errorFileRotateTransport.dirname = dir;
}

// Helper functions for structured logging
export const logRequest = (method: string, url: string, statusCode?: number, responseTime?: number) => {
    logger.info('HTTP Request', {
        type: 'http_request',
        method,
        url,
        statusCode,
        responseTime
    });
};

export const logError = (error: Error, context?: Record<string, any>) => {
    logger.error('Error occurred', {
        type: 'error',
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        ...context
    });
};

export const logWarning = (message: string, context?: Record<string, any>) => {
    logger.warn(message, {
        type: 'warning',
        ...context
    });
};

export const logInfo = (message: string, context?: Record<string, any>) => {
    logger.info(message, {
        type: 'info',
        ...context
    });
};

export const logDebug = (message: string, context?: Record<string, any>) => {
    logger.debug(message, {
        type: 'debug',
        ...context
    });
};

export default logger;
