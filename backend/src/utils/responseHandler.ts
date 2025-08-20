import { Response } from 'express';
import { HTTP_STATUS } from '../constants/statusCodes';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  errors?: any[];
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: ApiResponse['meta']
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      ...(data !== undefined && { data }),
      ...(meta && { meta }),
    };

    res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    message: string,
    data?: T,
    meta?: ApiResponse['meta']
  ): void {
    this.success(res, message, data, HTTP_STATUS.CREATED, meta);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, errors?: any[]): void {
    this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(res: Response, message: string): void {
    this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, message: string): void {
    this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res: Response, message: string): void {
    this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res: Response, message: string): void {
    this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  static validationError(res: Response, message: string, errors: any[]): void {
    this.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): void {
    const pages = Math.ceil(total / limit);
    
    this.success(res, message, data, HTTP_STATUS.OK, {
      total,
      page,
      limit,
      pages,
    });
  }
}