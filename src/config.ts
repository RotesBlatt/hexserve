import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface ServerConfig {
    port: number;
    host: string;
    serveDir: string;
    urlPrefix: string;
}

/**
 * Get server configuration from environment variables
 */
export function getConfig(): ServerConfig {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';
    const serveDir = process.env.SERVE_DIR
        ? path.resolve(process.env.SERVE_DIR)
        : path.resolve('./public');
    // URL prefix should start with / and not end with /
    let urlPrefix = process.env.URL_PREFIX || '/latest';
    if (!urlPrefix.startsWith('/')) {
        urlPrefix = '/' + urlPrefix;
    }
    if (urlPrefix.endsWith('/')) {
        urlPrefix = urlPrefix.slice(0, -1);
    }

    return {
        port,
        host,
        serveDir,
        urlPrefix,
    };
}
