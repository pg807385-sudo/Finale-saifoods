import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";
import { config } from "../config";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let error = "";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err.name;
  } else if (err.name === "PrismaClientKnownRequestError") {
    statusCode = 400;
    message = "Database operation failed";
    error = err.message;
  } else if (err.name === "ValidationError") {
    statusCode = 422;
    message = err.message;
  }

  logger.error({
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
    error: config.nodeEnv === "development" ? error : undefined,
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
