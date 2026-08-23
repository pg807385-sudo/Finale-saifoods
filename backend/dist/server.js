"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const socket_1 = require("./config/socket");
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./utils/logger");
// Ensure the upload directory exists before multer tries to write to it.
const uploadDir = path_1.default.join(process.cwd(), config_1.config.upload.dir);
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const allowedOrigins = [config_1.config.frontendUrl, config_1.config.adminUrl];
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
io.on("connection", (socket) => {
    socket.on("join_order", (orderId) => {
        if (orderId)
            socket.join(orderId);
    });
});
(0, socket_1.setIo)(io);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)(config_1.config.nodeEnv === "development" ? "dev" : "combined"));
app.use("/uploads", express_1.default.static(uploadDir));
app.get("/health", (_req, res) => {
    res.json({ success: true, message: "SaifFoods API is running" });
});
app.use("/api/v1", rateLimiter_1.apiLimiter, routes_1.default);
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
httpServer.listen(config_1.config.port, () => {
    logger_1.logger.info(`SaifFoods API listening on port ${config_1.config.port} (${config_1.config.nodeEnv})`);
});
exports.default = app;
//# sourceMappingURL=server.js.map