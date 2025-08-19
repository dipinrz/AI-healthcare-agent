"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
const statusCodes_1 = require("../constants/statusCodes");
class ResponseHandler {
    static success(res, message, data, statusCode = statusCodes_1.HTTP_STATUS.OK, meta) {
        const response = {
            success: true,
            message,
            ...(data !== undefined && { data }),
            ...(meta && { meta }),
        };
        res.status(statusCode).json(response);
    }
    static created(res, message, data, meta) {
        this.success(res, message, data, statusCodes_1.HTTP_STATUS.CREATED, meta);
    }
    static error(res, message, statusCode = statusCodes_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, errors) {
        const response = {
            success: false,
            message,
            ...(errors && { errors }),
        };
        res.status(statusCode).json(response);
    }
    static badRequest(res, message, errors) {
        this.error(res, message, statusCodes_1.HTTP_STATUS.BAD_REQUEST, errors);
    }
    static unauthorized(res, message) {
        this.error(res, message, statusCodes_1.HTTP_STATUS.UNAUTHORIZED);
    }
    static forbidden(res, message) {
        this.error(res, message, statusCodes_1.HTTP_STATUS.FORBIDDEN);
    }
    static notFound(res, message) {
        this.error(res, message, statusCodes_1.HTTP_STATUS.NOT_FOUND);
    }
    static conflict(res, message) {
        this.error(res, message, statusCodes_1.HTTP_STATUS.CONFLICT);
    }
    static validationError(res, message, errors) {
        this.error(res, message, statusCodes_1.HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
    }
    static paginated(res, message, data, total, page, limit) {
        const pages = Math.ceil(total / limit);
        this.success(res, message, data, statusCodes_1.HTTP_STATUS.OK, {
            total,
            page,
            limit,
            pages,
        });
    }
}
exports.ResponseHandler = ResponseHandler;
