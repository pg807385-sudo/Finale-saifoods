import fs from "fs";
import path from "path";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { Server } from "socket.io";

import { config } from "./config";
import { setIo } from "./config/socket";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

// Ensure the upload directory exists before multer tries to write to it.
const uploadDir = path.join(process.cwd(), config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [config.frontendUrl, config.adminUrl];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join_order", (orderId: string) => {
    if (orderId) socket.join(orderId);
  });
});

setIo(io);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));

app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "SaifFoods API is running" });
});

app.use("/api/v1", apiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(config.port, () => {
  logger.info(`SaifFoods API listening on port ${config.port} (${config.nodeEnv})`);
});

export default app;
