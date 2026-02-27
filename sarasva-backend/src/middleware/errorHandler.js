import { env } from "../config/env.js";

/**
 * Global Express error handler.
 * Must be registered LAST in app.js (after all routes).
 *
 * Handles:
 *  - ApiError (our own operational errors)
 *  - Mongoose validation errors
 *  - Mongoose duplicate key (code 11000)
 *  - JWT errors (re-caught here if needed)
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Mongoose validation error (e.g. required field missing)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // MongoDB duplicate key (unique index violation)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  if (env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
