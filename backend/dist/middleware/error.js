"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const error_1 = require("../utils/error");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const errorHandler = (err, req, res, _next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let error = "";
    if (err instanceof error_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        error = err.name;
    }
    else if (err.name === "PrismaClientKnownRequestError") {
        statusCode = 400;
        message = "Database operation failed";
        error = err.message;
    }
    else if (err.name === "ValidationError") {
        statusCode = 422;
        message = err.message;
    }
    logger_1.logger.error({
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });
    res.status(statusCode).json({
        success: false,
        message,
        error: config_1.config.nodeEnv === "development" ? error : undefined,
        stack: config_1.config.nodeEnv === "development" ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.js.map