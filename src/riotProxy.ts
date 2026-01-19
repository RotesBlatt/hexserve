import express, { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';

/**
 * Create a Riot API reverse proxy router
 * Forwards requests to the Riot Games API and automatically injects the API key
 * 
 * @param apiKey - The Riot Games API key
 * @param defaultBaseUrl - The default base URL for API requests
 * @returns Express router configured for Riot API proxying
 */
export function createRiotProxyRouter(apiKey: string, defaultBaseUrl: string): Router {
    const router = Router();

    // Catch all routes using middleware instead of route
    router.use(async (req: Request, res: Response) => {
        try {
            // Check if API key is configured
            if (!apiKey) {
                console.warn('Riot API proxy request without configured API key');
                return res.status(500).json({
                    error: 'Configuration Error',
                    message: 'Riot API key not configured'
                });
            }

            // Get base URL from query parameter or use default
            const requestBasePath = (req.query.requestBasePath as string) || defaultBaseUrl;

            // Remove requestBasePath from query string for the actual API call
            const queryParams = { ...req.query };
            delete queryParams.requestBasePath;

            // Rebuild query string
            const queryString = Object.keys(queryParams).length > 0
                ? '?' + new URLSearchParams(queryParams as Record<string, string>).toString()
                : '';

            // Construct target URL
            const targetPath = req.path;
            const targetUrl = `${requestBasePath}${targetPath}${queryString}`;

            console.log(`[Riot API Proxy] ${req.method} ${targetUrl}`);

            // Parse target URL
            const urlObj = new URL(targetUrl);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            // Prepare request headers
            const headers: http.OutgoingHttpHeaders = {
                'X-Riot-Token': apiKey,
                'User-Agent': req.headers['user-agent'] || 'hexserve-riot-proxy',
                'Accept': req.headers['accept'] || 'application/json',
            };

            // Forward Content-Type if present
            if (req.headers['content-type']) {
                headers['Content-Type'] = req.headers['content-type'];
            }

            // Prepare request options
            const options: https.RequestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: req.method,
                headers: headers
            };

            // Make the request to Riot API
            const apiRequest = httpModule.request(options, (apiResponse) => {
                // Forward status code
                res.status(apiResponse.statusCode || 200);

                // Forward response headers (except for some that should be handled by Express)
                const skipHeaders = ['connection', 'transfer-encoding'];
                Object.keys(apiResponse.headers).forEach(key => {
                    if (!skipHeaders.includes(key.toLowerCase()) && apiResponse.headers[key]) {
                        res.setHeader(key, apiResponse.headers[key]!);
                    }
                });

                // Pipe response body
                apiResponse.pipe(res);
            });

            // Handle request errors
            apiRequest.on('error', (error) => {
                console.error('[Riot API Proxy] Request error:', error);
                if (!res.headersSent) {
                    res.status(502).json({
                        error: 'Bad Gateway',
                        message: 'Failed to connect to Riot API',
                        details: error.message
                    });
                }
            });

            // Handle request timeout
            apiRequest.setTimeout(30000, () => {
                apiRequest.destroy();
                if (!res.headersSent) {
                    res.status(504).json({
                        error: 'Gateway Timeout',
                        message: 'Riot API request timed out'
                    });
                }
            });

            // Forward request body for POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                if (req.body) {
                    const bodyData = typeof req.body === 'string'
                        ? req.body
                        : JSON.stringify(req.body);
                    apiRequest.write(bodyData);
                }
            }

            apiRequest.end();

        } catch (error) {
            console.error('[Riot API Proxy] Error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    return router;
}
