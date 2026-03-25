console.log("Server.js: Begin Execution");

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import morgan from "morgan";
import winston from "winston";

// Import local modules later to isolate import errors
import connectDB from "./config/db.js";
import stickerRoutes from "./routes/stickerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Allow all origins for debugging
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Logger
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// db connection
// connectDB() - called in startServer

// routes
app.use("/api/stickers", stickerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Health Check
app.get("/api/ping", (req, res) => {
  logger.info("Ping received");
  res.status(200).send("pong");
});

// Start Server Wrapper
const startServer = async () => {
  try {
    console.log("Starting server...");
    
    // Connect to DB (Uncomment step by step)
    await connectDB(); 

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
