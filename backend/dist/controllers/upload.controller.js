"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const error_1 = require("../utils/error");
exports.UploadController = {
    uploadImage: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.file) {
            throw new error_1.BadRequestError("No image uploaded");
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        (0, response_1.sendResponse)(res, 200, "Image uploaded", { url: imageUrl });
    }),
};
//# sourceMappingURL=upload.controller.js.map