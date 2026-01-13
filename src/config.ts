import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface ServerConfig {
    port: number;
    host: string;
    serveDir: string;
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

    return {
        port,
        host,
        serveDir,
    };
}
