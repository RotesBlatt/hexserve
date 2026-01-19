import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../logger.js';

/**
 * Middleware that logs all HTTP requests with response time
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logRequest(req.method, req.url, res.statusCode, responseTime);
    });

    next();
}
