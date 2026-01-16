import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getConfig } from './config.js';
import { createFileViewerRouter } from './fileViewer.js';

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

// Root path shows index with configured prefix as directory
app.get('/', (req: Request, res: Response) => {
    const prefixName = config.urlPrefix.replace(/^\//, '');
    const html = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
<head>
<title>Index of /</title>
<style>
table { border-collapse: collapse; }
td { padding: 2px 20px 2px 2px; }
th { padding: 2px 20px 2px 2px; text-align: left; }
</style>
</head>
<body>
<h1>Index of /</h1>
<table>
<tr><th>Name</th><th>Last modified</th><th>Size</th></tr>
<tr><th colspan="3"><hr></th></tr>
<tr><td><a href="${config.urlPrefix}/">${prefixName}/</a></td><td align="right">-</td><td align="right">-</td></tr>
<tr><th colspan="3"><hr></th></tr>
</table>
</body>
</html>`;
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
    console.log(`Browse files: http://${config.host}:${config.port}${config.urlPrefix}/`);
    console.log(`Press Ctrl+C to stop the server`);
});
