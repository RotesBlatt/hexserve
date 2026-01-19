import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface ServerConfig {
    // General settings 
    nodeEnv: string;

    // Logging settings
    logLevel: string;
    logDir: string;

    // Basic Server Configuration
    port: number;
    host: string;
    serveDir: string;
    urlPrefix: string;

    // Riot API Proxy Configuration
    riotApiKey: string;
    riotApiBaseUrl: string;
    proxyPrefix: string;
}

/**
 * Get server configuration from environment variables
 */
export function getConfig(): ServerConfig {
    // General settings
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Logging settings
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = process.env.LOG_DIR
        ? path.resolve(process.env.LOG_DIR)
        : path.resolve('./logs');

    // Basic Server Configuration
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

    // Riot API Configuration
    const riotApiKey = process.env.RIOT_API_KEY || '';
    const riotApiBaseUrl = process.env.RIOT_API_BASE_URL || 'https://euw1.api.riotgames.com';
    let proxyPrefix = process.env.PROXY_PREFIX || '/riot-api';
    if (!proxyPrefix.startsWith('/')) {
        proxyPrefix = '/' + proxyPrefix;
    }
    if (proxyPrefix.endsWith('/')) {
        proxyPrefix = proxyPrefix.slice(0, -1);
    }

    

    return {
        nodeEnv,
        logLevel,
        logDir,
        port,
        host,
        serveDir,
        urlPrefix,
        riotApiKey,
        riotApiBaseUrl,
        proxyPrefix,
    };
}
