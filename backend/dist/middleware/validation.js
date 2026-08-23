"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const error_1 = require("../utils/error");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
                next(new error_1.ValidationError(messages));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
                next(new error_1.ValidationError(messages));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateBody = validateBody;
//# sourceMappingURL=validation.js.map