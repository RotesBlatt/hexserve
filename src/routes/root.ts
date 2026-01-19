import { Router, Request, Response } from 'express';
import { generateDirectoryHTML } from '../fileServer/router.js';

/**
 * Creates root path router
 * @param urlPrefix - The URL prefix for the file browser
 * @returns Express router
 */
export function createRootRouter(urlPrefix: string): Router {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
        const prefixName = urlPrefix.replace(/^\//, '');
        const items = [{
            name: prefixName,
            isDirectory: true,
            path: urlPrefix + '/',
            size: '-',
            modified: '-'
        }];
        const html = generateDirectoryHTML('/', items, null);
        res.send(html);
    });

    return router;
}
