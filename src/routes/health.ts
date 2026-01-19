import { Router, Request, Response } from 'express';
import fs from 'fs';
import { ServerConfig } from '../config.js';

/**
 * Creates a health check router
 * @param config - Server configuration
 * @returns Express router with health endpoint
 */
export function createHealthRouter(config: ServerConfig): Router {
    const router = Router();

    router.get('/health', (req: Request, res: Response) => {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                fileServer: {
                    status: 'unknown',
                    serveDir: config.serveDir,
                    urlPrefix: config.urlPrefix,
                    accessible: false
                },
                riotProxy: {
                    status: 'unknown',
                    enabled: false,
                    configured: false,
                    proxyPrefix: config.proxyPrefix,
                    baseUrl: config.riotApiBaseUrl
                }
            },
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                unit: 'MB'
            }
        };

        // Check file server status
        try {
            if (fs.existsSync(config.serveDir)) {
                fs.accessSync(config.serveDir, fs.constants.R_OK);
                healthStatus.services.fileServer.status = 'healthy';
                healthStatus.services.fileServer.accessible = true;
            } else {
                healthStatus.services.fileServer.status = 'degraded';
                healthStatus.status = 'degraded';
            }
        } catch (error) {
            healthStatus.services.fileServer.status = 'unhealthy';
            healthStatus.services.fileServer.accessible = false;
            healthStatus.status = 'unhealthy';
        }

        // Check Riot API proxy status
        if (config.riotApiKey && config.riotApiKey.length > 0) {
            healthStatus.services.riotProxy.enabled = true;
            healthStatus.services.riotProxy.configured = true;
            healthStatus.services.riotProxy.status = 'healthy';
        } else {
            healthStatus.services.riotProxy.status = 'disabled';
            healthStatus.services.riotProxy.enabled = false;
        }

        const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(httpStatus).json(healthStatus);
    });

    return router;
}
