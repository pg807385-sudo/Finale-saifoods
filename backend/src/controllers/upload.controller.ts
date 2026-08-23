import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/response";
import { BadRequestError } from "../utils/error";

export const UploadController = {
  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError("No image uploaded");
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    sendResponse(res, 200, "Image uploaded", { url: imageUrl });
  }),
};
