import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getConfig } from './config.js';
import { createFileViewerRouter, generateDirectoryHTML } from './fileViewer.js';
import { createRiotProxyRouter } from './riotProxy.js';
import logger, { logInfo, logWarning, logError, logRequest, setupLogger } from './logger.js';

const app = express();
const config = getConfig();

// Setup logger with config values
setupLogger(config.logLevel, config.logDir, config.nodeEnv);

// Ensure the serve directory exists
if (!fs.existsSync(config.serveDir)) {
    logWarning('Serve directory does not exist, creating it', { directory: config.serveDir });
    fs.mkdirSync(config.serveDir, { recursive: true });
}

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logRequest(req.method, req.url, res.statusCode, responseTime);
    });

    next();
});

// Riot API Proxy (before path traversal protection)
if (config.riotApiKey) {
    logInfo('Riot API Proxy enabled', {
        proxyPrefix: config.proxyPrefix,
        defaultBaseUrl: config.riotApiBaseUrl
    });
    app.use(config.proxyPrefix, createRiotProxyRouter(config.riotApiKey, config.riotApiBaseUrl));
} else {
    logWarning('RIOT_API_KEY not configured. Riot API proxy disabled.');
}

// Path traversal protection middleware for the URL prefix path
app.use(config.urlPrefix, (req: Request, res: Response, next: NextFunction) => {
    // Resolve the requested path and ensure it's within the serve directory
    const requestedPath = path.normalize(req.path);
    const resolvedPath = path.join(config.serveDir, requestedPath);
    const normalizedPath = path.resolve(resolvedPath);

    // Check if the resolved path is still within the serve directory
    if (!normalizedPath.startsWith(path.resolve(config.serveDir))) {
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
});

// Root path shows index with configured prefix as directory
app.get('/', (req: Request, res: Response) => {
    const prefixName = config.urlPrefix.replace(/^\//, '');
    const items = [{
        name: prefixName,
        isDirectory: true,
        path: config.urlPrefix + '/',
        size: '-',
        modified: '-'
    }];
    const html = generateDirectoryHTML('/', items, null);
    res.send(html);
});

// File browser with directory listing and static file serving
app.use(config.urlPrefix, createFileViewerRouter(config.serveDir, config.urlPrefix));

// Handle 404 errors
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'File not found',
        path: req.path,
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
});

// Start the server
app.listen(config.port, config.host, () => {
    logInfo('Static file server started', {
        url: `http://${config.host}:${config.port}`,
        serveDir: config.serveDir,
        urlPrefix: config.urlPrefix,
        browseUrl: `http://${config.host}:${config.port}${config.urlPrefix}/`,
        riotProxyEnabled: !!config.riotApiKey,
        riotProxyUrl: config.riotApiKey ? `http://${config.host}:${config.port}${config.proxyPrefix}/` : undefined
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    logInfo('Shutting down gracefully (SIGINT)');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logInfo('Shutting down gracefully (SIGTERM)');
    process.exit(0);
});
