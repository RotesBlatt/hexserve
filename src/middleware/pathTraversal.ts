import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logWarning } from '../logger.js';

/**
 * Creates path traversal protection middleware for a specific base directory
 * @param baseDir - The base directory to protect
 * @returns Express middleware function
 */
export function createPathTraversalProtection(baseDir: string) {
    const absoluteBaseDir = path.resolve(baseDir);

    return (req: Request, res: Response, next: NextFunction) => {
        // Resolve the requested path and ensure it's within the serve directory
        const requestedPath = path.normalize(req.path);
        const resolvedPath = path.join(baseDir, requestedPath);
        const normalizedPath = path.resolve(resolvedPath);

        // Check if the resolved path is still within the base directory
        if (!normalizedPath.startsWith(absoluteBaseDir)) {
            logWarning('Path traversal attempt blocked', {
                requestPath: req.path,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied'
            });
        }

        next();
    };
}
