import { query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logWarning } from '../logger.js';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorDetails = errors.array();

        logWarning('Request validation failed', {
            url: req.url,
            method: req.method,
            errors: errorDetails,
            query: req.query,
            params: req.params,
            ip: req.ip
        });

        return res.status(400).json({
            error: 'Validation Error',
            message: 'The request contains invalid parameters',
            details: errorDetails
        });
    }

    next();
};

/**
 * Validates if a URL is a valid Riot Games API endpoint
 */
const isValidRiotApiUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);

        // Must use HTTPS
        if (urlObj.protocol !== 'https:') {
            return false;
        }

        // Must match the pattern: {region}.api.riotgames.com
        const validPattern = /^[a-z0-9]+\.api\.riotgames\.com$/i;

        return validPattern.test(urlObj.hostname);
    } catch (error) {
        return false;
    }
};

/**
 * Validation rules for Riot API proxy requests
 */
export const validateRiotProxyRequest: ValidationChain[] = [
    query('requestBasePath')
        .optional()
        .isString()
        .withMessage('requestBasePath must be a string')
        .custom((value: string) => {
            if (!isValidRiotApiUrl(value)) {
                throw new Error('requestBasePath must be a valid Riot Games API URL (https://{region}.api.riotgames.com)');
            }
            return true;
        })
        .trim(),
];

/**
 * Generic validation for query parameters
 * Validates that query parameters are of expected types
 */
export const validateQueryParams = (paramRules: Record<string, 'string' | 'number' | 'boolean'>): ValidationChain[] => {
    const validations: ValidationChain[] = [];

    for (const [param, type] of Object.entries(paramRules)) {
        let validation = query(param);

        switch (type) {
            case 'string':
                validation = validation.optional().isString().withMessage(`${param} must be a string`);
                break;
            case 'number':
                validation = validation.optional().isNumeric().withMessage(`${param} must be a number`);
                break;
            case 'boolean':
                validation = validation.optional().isBoolean().withMessage(`${param} must be a boolean`);
                break;
        }

        validations.push(validation);
    }

    return validations;
};

/**
 * Sanitization middleware for query parameters
 * Trims and escapes query parameters to prevent injection attacks
 */
export const sanitizeQueryParams = (): ValidationChain[] => {
    return [
        query('*').trim().escape()
    ];
};
