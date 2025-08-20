import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/statusCodes';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements CustomError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = MESSAGES.ERROR.INTERNAL_SERVER_ERROR
  } = error;

  // Log error details
  logger.error('Error occurred:', {
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

// Wrapper for async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle 404 errors
export const notFound = (req: Request, res: Response): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};