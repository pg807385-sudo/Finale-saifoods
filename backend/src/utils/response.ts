import { Response } from "express";
import { ApiResponse } from "../types";

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: ApiResponse<T>["meta"]
) => {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, statusCode: number, message: string, error?: string) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
