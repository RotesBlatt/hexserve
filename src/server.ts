import express from 'express';
import fs from 'fs';
import { getConfig } from './config.js';
import { createFileViewerRouter } from './fileServer/router.js';
import { createRiotProxyRouter } from './riotProxy/router.js';
import { logInfo, logWarning, setupLogger } from './logger.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.js';
import { createPathTraversalProtection } from './middleware/pathTraversal.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createHealthRouter } from './routes/health.js';
import { createRootRouter } from './routes/root.js';

const app = express();
const config = getConfig();

// Setup logger with config values
setupLogger(config.logLevel, config.logDir, config.nodeEnv);

// Ensure the serve directory exists
if (!fs.existsSync(config.serveDir)) {
    logWarning('Serve directory does not exist, creating it', { directory: config.serveDir });
    fs.mkdirSync(config.serveDir, { recursive: true });
}

// Apply global middlewares
app.use(requestLoggerMiddleware);

// Health check endpoint (before other routes)
app.use(createHealthRouter(config));

// Root path router
app.use(createRootRouter(config.urlPrefix));

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

// Path traversal protection for file browser
app.use(config.urlPrefix, createPathTraversalProtection(config.serveDir));

// File browser with directory listing and static file serving
app.use(config.urlPrefix, createFileViewerRouter(config.serveDir, config.urlPrefix));

// 404 and error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

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
