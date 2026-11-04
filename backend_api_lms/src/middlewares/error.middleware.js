/**
 * Global Error Handler Middleware
 */

const { AppError } = require("../utils/errors");
const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Handle custom operational AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Handle Prisma Known Request Errors
  if (err.code === "P2002") {
    const fields = err.meta && err.meta.target ? err.meta.target : "Data";
    return res.status(409).json({
      success: false,
      message: `Data duplikat: ${fields} sudah terdaftar.`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || "Data tidak ditemukan.",
    });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Relasi data tidak valid atau referensi data tidak ditemukan.",
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }

  // Handle JSON parse syntax error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Format JSON pada request body tidak valid.",
    });
  }

  // Fallback 500 error
  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === "production"
    ? "Internal Server Error"
    : err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { errorHandler };
