"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
const statusCodes_1 = require("../constants/statusCodes");
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    const { statusCode = statusCodes_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, message = messages_1.MESSAGES.ERROR.INTERNAL_SERVER_ERROR } = error;
    // Log error details
    logger_config_1.logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode,
    });
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse = {
        success: false,
        message,
        ...(isDevelopment && {
            stack: error.stack,
            error: error.message,
        }),
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Wrapper for async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// Handle 404 errors
const notFound = (req, res) => {
    res.status(statusCodes_1.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};
exports.notFound = notFound;
