const path = require("path");
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const logger = require("./config/logger");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Request logging in development
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "LMS Backend API", version: "1.0.0" });
});

// API Routes
app.use("/api", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
