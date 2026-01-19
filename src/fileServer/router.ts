import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { logWarning, logError } from '../logger.js';

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function createFileViewerRouter(baseDir: string, urlPrefix: string = ''): Router {
    const router = Router();
    const absoluteBaseDir = path.resolve(baseDir);

    router.use(async (req: Request, res: Response) => {
        try {
            // Resolve the full path - this properly handles ../ and other traversal attempts
            const fullPath = path.resolve(absoluteBaseDir, '.' + req.path);

            // Security check: ensure the resolved path is within the base directory
            if (!fullPath.startsWith(absoluteBaseDir)) {
                logWarning('Path traversal attempt blocked in file viewer', {
                    requestPath: req.path,
                    resolvedPath: fullPath,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                });
                return res.status(403).send('Forbidden');
            }

            let stats;
            try {
                stats = await fs.stat(fullPath);
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    return res.status(404).send('Not Found');
                }
                throw error;
            }

            if (stats.isDirectory()) {
                const items = await fs.readdir(fullPath, { withFileTypes: true });

                // Calculate relative path for display and links
                const relativePath = path.relative(absoluteBaseDir, fullPath);
                const displayPath = relativePath ? `/${relativePath.replace(/\\/g, '/')}/` : '/';

                const itemsList = await Promise.all(
                    items.map(async item => {
                        const itemFullPath = path.join(fullPath, item.name);
                        const itemRelativePath = path.relative(absoluteBaseDir, itemFullPath).replace(/\\/g, '/');
                        let size = '-';
                        let modified = '-';

                        try {
                            const itemStats = await fs.stat(itemFullPath);
                            modified = itemStats.mtime.toISOString().replace('T', ' ').substring(0, 19);
                            if (!item.isDirectory()) {
                                size = formatFileSize(itemStats.size);
                            }
                        } catch (e) {
                            // Ignore stat errors
                        }

                        return {
                            name: item.name,
                            isDirectory: item.isDirectory(),
                            path: urlPrefix + '/' + itemRelativePath,
                            size,
                            modified
                        };
                    })
                );

                itemsList.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });

                // Determine parent directory path
                const parentPath = fullPath !== absoluteBaseDir
                    ? urlPrefix + '/' + (path.relative(absoluteBaseDir, path.dirname(fullPath)).replace(/\\/g, '/') || '')
                    : null;

                res.send(generateDirectoryHTML(displayPath, itemsList, parentPath));
            } else {
                const content = await fs.readFile(fullPath, 'utf-8');

                // Detect JSON files and set appropriate content type
                const ext = path.extname(fullPath).toLowerCase();
                if (ext === '.json') {
                    res.type('application/json').send(content);
                } else {
                    res.type('text/plain').send(content);
                }
            }
        } catch (error: any) {
            logError(error instanceof Error ? error : new Error(String(error)), {
                context: 'File viewer error',
                url: req.url,
                method: req.method,
                ip: req.ip
            });
            res.status(500).send('Internal Server Error');
        }
    });

    return router;
}

export function generateDirectoryHTML(currentPath: string, items: any[], parentPath: string | null): string {
    return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
<head>
<title>Index of ${currentPath}</title>
<style>
table { border-collapse: collapse; }
td { padding: 2px 20px 2px 2px; }
th { padding: 2px 20px 2px 2px; text-align: left; }
</style>
</head>
<body>
<h1>Index of ${currentPath}</h1>
<table>
<tr><th>Name</th><th>Last modified</th><th>Size</th></tr>
<tr><th colspan="3"><hr></th></tr>
${parentPath !== null ? `<tr><td><a href="${parentPath}">../</a></td><td>&nbsp;</td><td align="right">-</td></tr>\n` : ''}${items.map(item => `<tr><td><a href="${item.path}">${item.name}${item.isDirectory ? '/' : ''}</a></td><td align="right">${item.modified}</td><td align="right">${item.size}</td></tr>`).join('\n')}
<tr><th colspan="3"><hr></th></tr>
</table>
</body>
</html>`;
}
