/**
 * Application Environment Configuration
 */

require("dotenv").config?.();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL || "mysql://lms_user:lms_password@127.0.0.1:3306/lms_db",
  jwt: {
    secret: process.env.JWT_SECRET || "lms-super-secret-key-2026",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
};

module.exports = config;
