import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

/**
 * Verifies the JWT from the Authorization header.
 * On success, attaches req.user (the full User document, without passwordHash).
 * On failure, passes an ApiError to the global error handler.
 */
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "No token provided. Please log in.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      throw new ApiError(401, "User belonging to this token no longer exists.");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token."));
    }
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired. Please log in again."));
    }
    next(err);
  }
}
