import { Request, Response, NextFunction } from 'express';
import { logError } from '../logger.js';

/**
 * Global error handling middleware
 * Catches all unhandled errors and returns a 500 response
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    logError(err, {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
}

/**
 * 404 Not Found handler
 * Must be registered after all other routes
 */
export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        error: 'File not found',
        path: req.path,
    });
}
