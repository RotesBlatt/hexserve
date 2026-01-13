import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getConfig } from './config.js';

const app = express();
const config = getConfig();

// Ensure the serve directory exists
if (!fs.existsSync(config.serveDir)) {
    console.warn(`Warning: Serve directory does not exist: ${config.serveDir}`);
    console.warn('Creating directory...');
    fs.mkdirSync(config.serveDir, { recursive: true });
}

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Path traversal protection middleware for the URL prefix path
app.use(config.urlPrefix, (req: Request, res: Response, next: NextFunction) => {
    // Resolve the requested path and ensure it's within the serve directory
    const requestedPath = path.normalize(req.path);
    const resolvedPath = path.join(config.serveDir, requestedPath);
    const normalizedPath = path.resolve(resolvedPath);

    // Check if the resolved path is still within the serve directory
    if (!normalizedPath.startsWith(path.resolve(config.serveDir))) {
        console.warn(`Path traversal attempt blocked: ${req.path}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied'
        });
    }

    next();
});

// Serve static files from the configured directory at the URL prefix
app.use(config.urlPrefix, express.static(config.serveDir, {
    dotfiles: 'deny', // Don't serve hidden files
    index: false,     // Don't serve directory index
}));

// Handle 404 errors
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'File not found',
        path: req.path,
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// Start the server
app.listen(config.port, config.host, () => {
    console.log(`Static file server running at http://${config.host}:${config.port}`);
    console.log(`Serving files from: ${config.serveDir}`);
    console.log(`URL prefix: ${config.urlPrefix}`);
    console.log(`Example: http://${config.host}:${config.port}${config.urlPrefix}/sample.txt`);
    console.log(`Press Ctrl+C to stop the server`);
});
